const { withEntitlementsPlist, withXcodeProject, withInfoPlist, IOSConfig } = require("expo/config-plugins");
const path = require("path");
const fs = require("fs");

const APP_GROUP_ID = "group.app.nextthing";
const WIDGET_BUNDLE_ID_SUFFIX = ".TodayTaskWidget";
const WIDGET_TARGET_NAME = "TodayTaskWidget";

/**
 * Expo config plugin that adds a WidgetKit extension for the Today's Task widget.
 *
 * It performs three steps:
 * 1. Adds App Group entitlement to the main app target
 * 2. Copies the Swift widget source files into the iOS project
 * 3. Adds the WidgetExtension target to the Xcode project
 */
const withTodayTaskWidget = (config) => {
  // Step 1 — Add App Group entitlement to main app
  config = withEntitlementsPlist(config, (mod) => {
    mod.modResults["com.apple.security.application-groups"] = [APP_GROUP_ID];
    return mod;
  });

  // Step 2 — Copy Swift source files + add Xcode target
  config = withXcodeProject(config, (mod) => {
    const xcodeProject = mod.modResults;
    const bundleId =
      (config.ios && config.ios.bundleIdentifier) || "app.nextthing.mobile";
    const widgetBundleId = bundleId + WIDGET_BUNDLE_ID_SUFFIX;

    // --- Copy widget Swift files into ios/<WidgetTarget>/ ---
    const projectRoot = mod.modRequest.projectRoot;
    const iosDir = path.join(projectRoot, "ios");
    const widgetDir = path.join(iosDir, WIDGET_TARGET_NAME);

    if (!fs.existsSync(widgetDir)) {
      fs.mkdirSync(widgetDir, { recursive: true });
    }

    const pluginSwiftDir = path.join(__dirname, "swift");
    const swiftFiles = fs
      .readdirSync(pluginSwiftDir)
      .filter((f) => f.endsWith(".swift"));

    for (const file of swiftFiles) {
      fs.copyFileSync(
        path.join(pluginSwiftDir, file),
        path.join(widgetDir, file)
      );
    }

    // Write entitlements file
    const entitlementsContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>${APP_GROUP_ID}</string>
    </array>
</dict>
</plist>`;
    fs.writeFileSync(
      path.join(widgetDir, `${WIDGET_TARGET_NAME}.entitlements`),
      entitlementsContent
    );

    // Write Info.plist for widget extension
    const infoPlistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>Next Thing</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>CFBundleShortVersionString</key>
    <string>$(MARKETING_VERSION)</string>
    <key>CFBundleVersion</key>
    <string>$(CURRENT_PROJECT_VERSION)</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.widgetkit-extension</string>
    </dict>
</dict>
</plist>`;
    fs.writeFileSync(path.join(widgetDir, "Info.plist"), infoPlistContent);

    // --- Add the extension target to the Xcode project ---
    const targetUuid = xcodeProject.generateUuid();
    const widgetGroupKey = xcodeProject.pbxCreateGroup(
      WIDGET_TARGET_NAME,
      `"${WIDGET_TARGET_NAME}"`
    );

    // Add Swift source files to the widget group
    const sourceFiles = [];
    for (const file of swiftFiles) {
      const fileRef = xcodeProject.addFile(
        `${WIDGET_TARGET_NAME}/${file}`,
        widgetGroupKey,
        { target: targetUuid, lastKnownFileType: "sourcecode.swift" }
      );
      if (fileRef) {
        sourceFiles.push(fileRef);
      }
    }

    // Add Info.plist and entitlements
    xcodeProject.addFile(
      `${WIDGET_TARGET_NAME}/Info.plist`,
      widgetGroupKey,
      { lastKnownFileType: "text.plist.xml" }
    );
    xcodeProject.addFile(
      `${WIDGET_TARGET_NAME}/${WIDGET_TARGET_NAME}.entitlements`,
      widgetGroupKey,
      { lastKnownFileType: "text.plist.entitlements" }
    );

    // Add the widget extension target
    const target = xcodeProject.addTarget(
      WIDGET_TARGET_NAME,
      "app_extension",
      WIDGET_TARGET_NAME,
      widgetBundleId
    );

    // Configure build settings for the widget target
    if (target && target.uuid) {
      const configurations = xcodeProject.pbxXCBuildConfigurationSection();
      for (const key in configurations) {
        const config = configurations[key];
        if (
          config.buildSettings &&
          config.name &&
          config.baseConfigurationReference === undefined
        ) {
          // Check if this config belongs to the widget target by checking for our bundle ID
          if (
            config.buildSettings.PRODUCT_BUNDLE_IDENTIFIER === widgetBundleId
          ) {
            config.buildSettings.SWIFT_VERSION = "5.0";
            config.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = "17.0";
            config.buildSettings.CODE_SIGN_ENTITLEMENTS = `${WIDGET_TARGET_NAME}/${WIDGET_TARGET_NAME}.entitlements`;
            config.buildSettings.INFOPLIST_FILE = `${WIDGET_TARGET_NAME}/Info.plist`;
            config.buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';
            config.buildSettings.MARKETING_VERSION = "1.0.0";
            config.buildSettings.CURRENT_PROJECT_VERSION = "1";
            config.buildSettings.GENERATE_INFOPLIST_FILE = "NO";
            config.buildSettings.ASSETCATALOG_COMPILER_WIDGET_BACKGROUND_COLOR_NAME =
              "WidgetBackground";
            config.buildSettings.LD_RUNPATH_SEARCH_PATHS =
              '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"';
          }
        }
      }
    }

    return mod;
  });

  return config;
};

module.exports = withTodayTaskWidget;
