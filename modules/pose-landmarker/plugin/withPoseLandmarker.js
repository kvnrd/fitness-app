const { withInfoPlist } = require('@expo/config-plugins');

// iOS needs a camera purpose string before the camera prompt can show.
// DRAFT copy pending Kevin's approval (no Counsel string exists for this). Pass the approved text
// as the plugin's `cameraPermission` option in app.json; the default is only for dev builds.
const DRAFT_CAMERA_TEXT = 'DRAFT: Form check uses the camera to track your body position on this phone.';

module.exports = function withPoseLandmarker(config, props = {}) {
  const text = props.cameraPermission || DRAFT_CAMERA_TEXT;
  return withInfoPlist(config, (c) => {
    c.modResults.NSCameraUsageDescription = c.modResults.NSCameraUsageDescription || text;
    return c;
  });
};
