// @ts-check
const { withXcodeProject, withEntitlementsPlist } = require("expo/config-plugins");
const path = require("path");
const fs = require("fs");

const APP_GROUP_ID = "group.app.nextthing";
const DEFAULT_BUNDLE_ID = "app.nextthing.mobile";
const DEPLOYMENT_TARGET = "16.0";

// Logic shared by the app and every extension. It lives in the native module
// (so the app's pod compiles it) and is copied into each extension target.
const SHARED_SOURCES = [
  path.join(
    __dirname,
    "..",
    "..",
    "modules",
    "family-controls-bridge",
    "src",
    "GatewayCore.swift",
  ),
];

const EXTENSION_ENTITLEMENTS = {
  "com.apple.developer.family-controls": true,
  "com.apple.security.application-groups": [APP_GROUP_ID],
};

const EXTENSIONS = [
  {
    name: "ShieldConfigExtension",
    bundleIdSuffix: "ShieldConfig",
    displayName: "Next Thing Shield",
    extensionPoint: "com.apple.ManagedSettingsUI.shield-configuration-service",
    principalClass: "ShieldConfigExtension",
  },
  {
    name: "ShieldActionExtension",
    bundleIdSuffix: "ShieldAction",
    displayName: "Next Thing Shield Actions",
    extensionPoint: "com.apple.ManagedSettings.shield-action-service",
    principalClass: "ShieldActionExtension",
  },
  {
    name: "DeviceActivityMonitorExtension",
    bundleIdSuffix: "DeviceActivityMonitor",
    displayName: "Next Thing Activity Monitor",
    extensionPoint: "com.apple.deviceactivity.monitor-extension",
    principalClass: "AppDisruptDeviceActivityMonitor",
  },
];

/**
 * Adds Screen Time (FamilyControls) support: the entitlements on the app and
 * three app-extension targets (shield appearance, shield buttons, background
 * activity monitor). app.config.ts lists the same targets for EAS Build.
 *
 * @param {import('expo/config-plugins').ExpoConfig} config
 * @returns {import('expo/config-plugins').ExpoConfig}
 */
function withFamilyControls(config) {
  config = withEntitlementsPlist(config, (mod) => {
    mod.modResults["com.apple.security.application-groups"] = [APP_GROUP_ID];
    mod.modResults["com.apple.developer.family-controls"] = true;
    return mod;
  });

  config = withXcodeProject(config, (mod) => {
    const project = mod.modResults;
    const bundleId = mod.ios?.bundleIdentifier ?? DEFAULT_BUNDLE_ID;
    const marketingVersion = mod.version ?? "1.0.0";
    const buildNumber = mod.ios?.buildNumber ?? "1";
    const teamId = mod.ios?.appleTeamId;

    for (const ext of EXTENSIONS) {
      addExtensionTarget(project, ext, {
        buildNumber,
        bundleId: `${bundleId}.${ext.bundleIdSuffix}`,
        marketingVersion,
        projectRoot: mod.modRequest.projectRoot,
        teamId,
      });
    }

    return mod;
  });

  return config;
}

/**
 * Create one app-extension target with everything Xcode needs to build it.
 *
 * `project.addTarget` only creates an empty shell: no Sources, Frameworks or
 * Resources build phases, and an INFOPLIST_FILE that points at a file that
 * does not exist. Calling `addSourceFile` on that shell does not help either,
 * because with no Sources phase on the new target node-xcode quietly falls
 * back to the *first* Sources phase in the project, which is the main app's.
 * The result was extensions that shipped without any code in them, so iOS
 * showed its stock shield and ignored ours. This builds the phases and file
 * references by hand so every file lands in the right target.
 */
function addExtensionTarget(project, ext, options) {
  const targetName = ext.name;
  if (findTargetByName(project, targetName)) return;

  const objects = project.hash.project.objects;

  // 1. Copy sources into ios/<Target>/ and write the generated files.
  const sourceDir = path.join(__dirname, "extensions", targetName);
  const destDir = path.join(options.projectRoot, "ios", targetName);
  fs.mkdirSync(destDir, { recursive: true });

  /** @type {string[]} */
  const swiftFiles = [];
  /** @type {string[]} */
  const resourceFiles = [];

  for (const file of fs.readdirSync(sourceDir)) {
    fs.copyFileSync(path.join(sourceDir, file), path.join(destDir, file));
    if (file.endsWith(".swift")) swiftFiles.push(file);
    else if (file.endsWith(".png")) resourceFiles.push(file);
  }
  for (const sharedSource of SHARED_SOURCES) {
    const file = path.basename(sharedSource);
    fs.copyFileSync(sharedSource, path.join(destDir, file));
    swiftFiles.push(file);
  }

  const infoPlistName = "Info.plist";
  const entitlementsName = `${targetName}.entitlements`;
  fs.writeFileSync(path.join(destDir, infoPlistName), buildInfoPlist(ext));
  fs.writeFileSync(
    path.join(destDir, entitlementsName),
    buildPlist(EXTENSION_ENTITLEMENTS),
  );

  // 2. node-xcode only records the app -> extension dependency when these
  //    sections already exist, and a fresh Expo project has neither.
  objects.PBXTargetDependency = objects.PBXTargetDependency || {};
  objects.PBXContainerItemProxy = objects.PBXContainerItemProxy || {};

  // 3. The target itself (also embeds the .appex into the app).
  const target = project.addTarget(
    targetName,
    "app_extension",
    targetName,
    options.bundleId,
  );

  // 4. Build phases, attached to the new target.
  const sourcesPhase = project.addBuildPhase(
    [],
    "PBXSourcesBuildPhase",
    "Sources",
    target.uuid,
  ).buildPhase;
  project.addBuildPhase([], "PBXFrameworksBuildPhase", "Frameworks", target.uuid);
  const resourcesPhase = project.addBuildPhase(
    [],
    "PBXResourcesBuildPhase",
    "Resources",
    target.uuid,
  ).buildPhase;

  // 5. A group for the files, with each buildable file wired to its phase.
  //    System frameworks are linked automatically from the Swift imports.
  /** @type {{ value: string, comment: string }[]} */
  const groupChildren = [];
  const addFile = (file, fileType, phase, phaseName) => {
    const fileRef = project.generateUuid();
    objects.PBXFileReference[fileRef] = {
      isa: "PBXFileReference",
      lastKnownFileType: fileType,
      path: `"${file}"`,
      sourceTree: '"<group>"',
    };
    objects.PBXFileReference[`${fileRef}_comment`] = file;
    groupChildren.push({ value: fileRef, comment: file });

    if (phase) {
      const buildFile = project.generateUuid();
      const comment = `${file} in ${phaseName}`;
      objects.PBXBuildFile[buildFile] = {
        isa: "PBXBuildFile",
        fileRef,
        fileRef_comment: file,
      };
      objects.PBXBuildFile[`${buildFile}_comment`] = comment;
      phase.files.push({ value: buildFile, comment });
    }
  };

  for (const file of swiftFiles) {
    addFile(file, "sourcecode.swift", sourcesPhase, "Sources");
  }
  for (const file of resourceFiles) {
    addFile(file, "image.png", resourcesPhase, "Resources");
  }
  addFile(infoPlistName, "text.plist.xml", null, null);
  addFile(entitlementsName, "text.plist.entitlements", null, null);

  const groupUuid = project.generateUuid();
  objects.PBXGroup[groupUuid] = {
    isa: "PBXGroup",
    children: groupChildren,
    path: `"${targetName}"`,
    sourceTree: '"<group>"',
  };
  objects.PBXGroup[`${groupUuid}_comment`] = targetName;
  const mainGroupUuid = project.getFirstProject().firstProject.mainGroup;
  objects.PBXGroup[mainGroupUuid].children.push({
    value: groupUuid,
    comment: targetName,
  });

  // 6. Build settings, found through the target's own configuration list.
  //    (Matching on PRODUCT_BUNDLE_IDENTIFIER does not work: node-xcode
  //    stores that value wrapped in quotes.)
  const nativeTarget = project.pbxNativeTargetSection()[target.uuid];
  const configurationList =
    project.pbxXCConfigurationList()[nativeTarget.buildConfigurationList];
  const buildConfigurations = project.pbxXCBuildConfigurationSection();

  for (const ref of configurationList.buildConfigurations) {
    const buildConfig = buildConfigurations[ref.value];
    if (!buildConfig || !buildConfig.buildSettings) continue;
    const settings = buildConfig.buildSettings;

    settings.APPLICATION_EXTENSION_API_ONLY = "YES";
    settings.CLANG_ENABLE_MODULES = "YES";
    settings.CODE_SIGN_ENTITLEMENTS = `"${targetName}/${entitlementsName}"`;
    settings.CODE_SIGN_STYLE = "Automatic";
    settings.CURRENT_PROJECT_VERSION = `"${options.buildNumber}"`;
    settings.GENERATE_INFOPLIST_FILE = "NO";
    settings.INFOPLIST_FILE = `"${targetName}/${infoPlistName}"`;
    settings.IPHONEOS_DEPLOYMENT_TARGET = DEPLOYMENT_TARGET;
    settings.MARKETING_VERSION = `"${options.marketingVersion}"`;
    settings.SWIFT_VERSION = "5.0";
    settings.TARGETED_DEVICE_FAMILY = '"1,2"';
    if (options.teamId) {
      settings.DEVELOPMENT_TEAM = options.teamId;
    }
    if (buildConfig.name === "Debug") {
      settings.SWIFT_ACTIVE_COMPILATION_CONDITIONS = "DEBUG";
      settings.SWIFT_OPTIMIZATION_LEVEL = '"-Onone"';
    }
  }
}

/** node-xcode stores target names wrapped in quotes, so compare unquoted. */
function findTargetByName(project, name) {
  const targets = project.pbxNativeTargetSection();
  for (const key of Object.keys(targets)) {
    if (key.endsWith("_comment")) continue;
    const targetName = String(targets[key].name || "").replace(/^"(.*)"$/, "$1");
    if (targetName === name) return targets[key];
  }
  return null;
}

function buildInfoPlist(ext) {
  return buildPlist({
    CFBundleDevelopmentRegion: "$(DEVELOPMENT_LANGUAGE)",
    CFBundleDisplayName: ext.displayName,
    CFBundleExecutable: "$(EXECUTABLE_NAME)",
    CFBundleIdentifier: "$(PRODUCT_BUNDLE_IDENTIFIER)",
    CFBundleInfoDictionaryVersion: "6.0",
    CFBundleName: "$(PRODUCT_NAME)",
    CFBundlePackageType: "$(PRODUCT_BUNDLE_PACKAGE_TYPE)",
    CFBundleShortVersionString: "$(MARKETING_VERSION)",
    CFBundleVersion: "$(CURRENT_PROJECT_VERSION)",
    NSExtension: {
      NSExtensionPointIdentifier: ext.extensionPoint,
      NSExtensionPrincipalClass: `$(PRODUCT_MODULE_NAME).${ext.principalClass}`,
    },
  });
}

function buildPlist(obj) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
${plistValue(obj, "")}
</plist>
`;
}

function plistValue(value, indent) {
  if (typeof value === "boolean") return `${indent}<${value}/>`;
  if (typeof value === "string") return `${indent}<string>${value}</string>`;
  if (Array.isArray(value)) {
    const items = value.map((item) => plistValue(item, `${indent}    `));
    return `${indent}<array>\n${items.join("\n")}\n${indent}</array>`;
  }
  const entries = Object.entries(value).map(
    ([key, entry]) =>
      `${indent}    <key>${key}</key>\n${plistValue(entry, `${indent}    `)}`,
  );
  return `${indent}<dict>\n${entries.join("\n")}\n${indent}</dict>`;
}

module.exports = withFamilyControls;
