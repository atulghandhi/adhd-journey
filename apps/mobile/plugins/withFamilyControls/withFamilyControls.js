// @ts-check
const { withXcodeProject, withEntitlementsPlist, withInfoPlist, IOSConfig } =
  require("expo/config-plugins");
const path = require("path");
const fs = require("fs");

const APP_GROUP_ID = "group.app.nextthing";
const BUNDLE_ID = "app.nextthing.mobile";

const EXTENSIONS = [
  {
    name: "ShieldConfigExtension",
    bundleId: `${BUNDLE_ID}.ShieldConfig`,
    frameworks: ["ManagedSettings", "ManagedSettingsUI"],
    entitlements: {
      "com.apple.developer.family-controls": true,
      "com.apple.security.application-groups": [APP_GROUP_ID],
    },
  },
  {
    name: "DeviceActivityMonitorExtension",
    bundleId: `${BUNDLE_ID}.DeviceActivityMonitor`,
    frameworks: ["DeviceActivity", "ManagedSettings"],
    entitlements: {
      "com.apple.developer.family-controls": true,
      "com.apple.security.application-groups": [APP_GROUP_ID],
    },
  },
];

/**
 * @param {import('expo/config-plugins').ExpoConfig} config
 * @returns {import('expo/config-plugins').ExpoConfig}
 */
function withFamilyControls(config) {
  // 1. Add App Group + FamilyControls entitlement to main app
  config = withEntitlementsPlist(config, (mod) => {
    mod.modResults["com.apple.security.application-groups"] = [APP_GROUP_ID];
    mod.modResults["com.apple.developer.family-controls"] = true;
    return mod;
  });

  // 2. Add extension targets to Xcode project
  config = withXcodeProject(config, (mod) => {
    const project = mod.modResults;
    const rootObject = project.getFirstProject().firstProject;

    for (const ext of EXTENSIONS) {
      addExtensionTarget(project, rootObject, ext, mod.modRequest.projectRoot);
    }

    return mod;
  });

  return config;
}

function addExtensionTarget(project, rootObject, ext, projectRoot) {
  const targetName = ext.name;
  const targetBundleId = ext.bundleId;

  // Check if target already exists
  const existingTarget = project.pbxTargetByName(targetName);
  if (existingTarget) return;

  // Create PBX group for extension files
  const extSourceDir = path.join(
    __dirname,
    "extensions",
    targetName,
  );
  const extDestDir = path.join(projectRoot, "ios", targetName);

  // Copy Swift + Info.plist files
  if (!fs.existsSync(extDestDir)) {
    fs.mkdirSync(extDestDir, { recursive: true });
  }

  const sourceFiles = fs.readdirSync(extSourceDir);
  for (const file of sourceFiles) {
    fs.copyFileSync(
      path.join(extSourceDir, file),
      path.join(extDestDir, file),
    );
  }

  // Write entitlements file
  const entitlementsPath = path.join(extDestDir, `${targetName}.entitlements`);
  const entitlementsPlist = generatePlist(ext.entitlements);
  fs.writeFileSync(entitlementsPath, entitlementsPlist);

  // Add native target via xcode lib
  const target = project.addTarget(
    targetName,
    "app_extension",
    targetName,
    targetBundleId,
  );

  // Add source files to target
  const groupKey = project.pbxCreateGroup(targetName, `"${targetName}"`);
  project.addToPbxGroup(groupKey, rootObject.mainGroup);

  for (const file of sourceFiles) {
    const filePath = `${targetName}/${file}`;
    if (file.endsWith(".swift")) {
      project.addSourceFile(filePath, { target: target.uuid }, groupKey);
    } else {
      project.addFile(filePath, groupKey);
    }
  }

  // Add entitlements file
  project.addFile(
    `${targetName}/${targetName}.entitlements`,
    groupKey,
  );

  // Add frameworks
  for (const fw of ext.frameworks) {
    project.addFramework(`${fw}.framework`, {
      target: target.uuid,
      link: true,
    });
  }

  // Configure build settings
  const buildConfigs =
    project.pbxXCBuildConfigurationSection();
  for (const key in buildConfigs) {
    const config = buildConfigs[key];
    if (
      config &&
      typeof config === "object" &&
      config.buildSettings &&
      config.name &&
      project.pbxNativeTargetSection()?.[target.uuid]
    ) {
      // Only apply to this target's configs
      if (config.buildSettings.PRODUCT_BUNDLE_IDENTIFIER === targetBundleId ||
          config.buildSettings.PRODUCT_NAME === `"${targetName}"`) {
        config.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = "17.0";
        config.buildSettings.SWIFT_VERSION = "5.0";
        config.buildSettings.CODE_SIGN_ENTITLEMENTS = `${targetName}/${targetName}.entitlements`;
        config.buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';
      }
    }
  }
}

function generatePlist(obj) {
  let inner = "";
  for (const [key, value] of Object.entries(obj)) {
    inner += `    <key>${key}</key>\n`;
    if (typeof value === "boolean") {
      inner += `    <${value}/>\n`;
    } else if (Array.isArray(value)) {
      inner += "    <array>\n";
      for (const item of value) {
        inner += `        <string>${item}</string>\n`;
      }
      inner += "    </array>\n";
    } else if (typeof value === "string") {
      inner += `    <string>${value}</string>\n`;
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
${inner}</dict>
</plist>
`;
}

module.exports = withFamilyControls;
