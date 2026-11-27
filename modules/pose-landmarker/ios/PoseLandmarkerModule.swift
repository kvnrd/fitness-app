import AVFoundation
import ExpoModulesCore

public class PoseLandmarkerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PoseLandmarker")

    AsyncFunction("getCameraPermission") { () -> [String: Any] in
      return PoseLandmarkerModule.permission(AVCaptureDevice.authorizationStatus(for: .video))
    }

    AsyncFunction("requestCameraPermission") { () async -> [String: Any] in
      _ = await AVCaptureDevice.requestAccess(for: .video)
      return PoseLandmarkerModule.permission(AVCaptureDevice.authorizationStatus(for: .video))
    }

    View(PoseCameraView.self) {
      Events("onPose", "onNoPose", "onTrackingError")

      Prop("active") { (view, active: Bool?) in
        view.setActive(active ?? false)
      }
      Prop("facing") { (view, facing: String?) in
        view.setFacing(facing == "front" ? .front : .back)
      }
    }
  }

  private static func permission(_ s: AVAuthorizationStatus) -> [String: Any] {
    switch s {
    case .authorized: return ["status": "granted", "granted": true, "canAskAgain": false]
    case .notDetermined: return ["status": "undetermined", "granted": false, "canAskAgain": true]
    default: return ["status": "denied", "granted": false, "canAskAgain": false]
    }
  }
}
