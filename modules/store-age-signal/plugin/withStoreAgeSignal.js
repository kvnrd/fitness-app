const { withEntitlementsPlist, withAppBuildGradle } = require('@expo/config-plugins');

// Check https://developer.android.com/google/play/age-signals/use-age-signals-api for the latest version.
const AGE_SIGNALS_DEP = "implementation 'com.google.android.play:age-signals:0.0.4'";

function withIosEntitlement(config) {
  return withEntitlementsPlist(config, (c) => {
    // Needs "Declared Age Range" enabled on the App ID (Apple Developer portal).
    c.modResults['com.apple.developer.declared-age-range'] = true;
    return c;
  });
}

function withAndroidDependency(config) {
  return withAppBuildGradle(config, (c) => {
    if (c.modResults.language !== 'groovy') return c; // Kotlin DSL: the module's own build.gradle still declares it.
    if (!c.modResults.contents.includes('com.google.android.play:age-signals')) {
      c.modResults.contents = c.modResults.contents.replace(
        /dependencies\s*\{/,
        (m) => `${m}\n    ${AGE_SIGNALS_DEP}`
      );
    }
    return c;
  });
}

module.exports = function withStoreAgeSignal(config) {
  return withAndroidDependency(withIosEntitlement(config));
};
