Pod::Spec.new do |s|
  s.name           = 'PoseLandmarker'
  s.version        = '1.0.0'
  s.summary        = 'On-device MediaPipe pose tracking (body joints only)'
  s.description    = 'On-device MediaPipe pose tracking (body joints only)'
  s.license        = 'UNLICENSED'
  s.author         = 'Fitness App'
  s.homepage       = 'https://example.invalid'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  # Google's MediaPipe Tasks (Apache-2.0). The CocoaPods build is marked deprecated in favor of
  # Swift Package Manager (1.2.x); 1.0.1 is the last pod. Move to SPM (spm_dependency) when it's
  # proven with Expo autolinking.
  s.dependency 'MediaPipeTasksVision', '1.0.1'

  s.source_files = "**/*.{h,m,swift}"
  # pose_landmarker_lite.task (Apache-2.0, sha256 in docs/phase-7-form-check.md). Copied into the app bundle.
  s.resources = 'models/*.task'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
