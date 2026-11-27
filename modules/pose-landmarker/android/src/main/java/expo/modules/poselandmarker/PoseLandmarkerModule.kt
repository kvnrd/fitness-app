package expo.modules.poselandmarker

import android.Manifest
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PoseLandmarkerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PoseLandmarker")

    AsyncFunction("getCameraPermission") { promise: Promise ->
      Permissions.getPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.CAMERA)
    }

    AsyncFunction("requestCameraPermission") { promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.CAMERA)
    }

    View(PoseCameraView::class) {
      Events("onPose", "onNoPose", "onTrackingError")

      Prop("active") { view: PoseCameraView, active: Boolean? ->
        view.setActive(active ?: false)
      }
      Prop("facing") { view: PoseCameraView, facing: String? ->
        view.setFacing(facing == "front")
      }
      OnViewDestroys { view: PoseCameraView ->
        view.release()
      }
    }
  }
}
