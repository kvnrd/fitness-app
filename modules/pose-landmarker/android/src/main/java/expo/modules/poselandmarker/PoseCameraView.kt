package expo.modules.poselandmarker

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Matrix
import android.os.SystemClock
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.core.resolutionselector.AspectRatioStrategy
import androidx.camera.core.resolutionselector.ResolutionSelector
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.framework.image.MPImage
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarkerResult
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * Live camera preview + MediaPipe Pose Landmarker (live stream mode), all on the phone.
 *
 * Privacy rules enforced here (legal review: Texas CUBI, Illinois BIPA):
 *   - Only pose indices 11–32 (body joints) are sent to JS. Face points 0–10 are never copied.
 *   - Frames are analyzed in memory and dropped. Nothing is written to disk or sent anywhere.
 */
class PoseCameraView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  /** { t: ms since the camera started, p: [x, y, visibility] × 22 body joints, w/h: analyzed frame size } */
  private val onPose by EventDispatcher<Map<String, Any>>()
  private val onNoPose by EventDispatcher<Map<String, Any>>()
  private val onTrackingError by EventDispatcher<Map<String, Any>>()

  private val previewView = PreviewView(context).apply {
    scaleType = PreviewView.ScaleType.FILL_CENTER
    implementationMode = PreviewView.ImplementationMode.COMPATIBLE
  }
  private val executor: ExecutorService = Executors.newSingleThreadExecutor()
  private var provider: ProcessCameraProvider? = null
  private var landmarker: PoseLandmarker? = null
  private var front = false
  private var active = false
  private var startMs = 0L
  private var lastSentMs = Long.MIN_VALUE / 2

  init {
    addView(previewView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
  }

  fun setActive(value: Boolean) {
    if (value == active) return
    active = value
    if (value) start() else stop()
  }

  fun setFacing(isFront: Boolean) {
    if (isFront == front) return
    front = isFront
    if (active) bind()
  }

  fun release() {
    stop()
    executor.execute {
      landmarker?.close()
      landmarker = null
    }
    executor.shutdown()
  }

  private fun start() {
    val granted = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
    if (!granted) {
      onTrackingError(mapOf("code" to "camera_permission"))
      return
    }
    executor.execute {
      if (landmarker == null && !makeLandmarker()) return@execute
      post { bind() }
    }
  }

  private fun stop() {
    provider?.unbindAll()
  }

  private fun makeLandmarker(): Boolean {
    return try {
      val options = PoseLandmarker.PoseLandmarkerOptions.builder()
        .setBaseOptions(BaseOptions.builder().setModelAssetPath(MODEL).build())
        .setRunningMode(RunningMode.LIVE_STREAM)
        .setNumPoses(1)
        .setMinPoseDetectionConfidence(0.5f)
        .setMinPosePresenceConfidence(0.5f)
        .setMinTrackingConfidence(0.5f)
        .setOutputSegmentationMasks(false)
        .setResultListener(this::onResult)
        .setErrorListener { _ -> onTrackingError(mapOf("code" to "tracking_failed")) }
        .build()
      landmarker = PoseLandmarker.createFromOptions(context, options)
      true
    } catch (e: Exception) {
      onTrackingError(mapOf("code" to "model_load_failed"))
      false
    }
  }

  private fun bind() {
    val owner = appContext.currentActivity as? LifecycleOwner
    if (owner == null) {
      onTrackingError(mapOf("code" to "camera_unavailable"))
      return
    }
    val future = ProcessCameraProvider.getInstance(context)
    future.addListener({
      val p = future.get()
      provider = p
      val selector = ResolutionSelector.Builder()
        .setAspectRatioStrategy(AspectRatioStrategy.RATIO_4_3_FALLBACK_AUTO_STRATEGY)
        .build()
      val preview = Preview.Builder().setResolutionSelector(selector).build().also {
        it.setSurfaceProvider(previewView.surfaceProvider)
      }
      val analysis = ImageAnalysis.Builder()
        .setResolutionSelector(selector)
        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
        .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
        .build()
        .also { it.setAnalyzer(executor, ::analyze) }
      val camera = if (front) CameraSelector.DEFAULT_FRONT_CAMERA else CameraSelector.DEFAULT_BACK_CAMERA
      try {
        p.unbindAll()
        p.bindToLifecycle(owner, camera, preview, analysis)
        startMs = SystemClock.uptimeMillis()
        lastSentMs = Long.MIN_VALUE / 2
      } catch (e: Exception) {
        onTrackingError(mapOf("code" to "camera_unavailable"))
      }
    }, ContextCompat.getMainExecutor(context))
  }

  private fun analyze(proxy: ImageProxy) {
    val now = SystemClock.uptimeMillis()
    val lm = landmarker
    if (lm == null || now - lastSentMs < MIN_FRAME_GAP_MS) {
      proxy.close()
      return
    }
    lastSentMs = now
    val bitmap = Bitmap.createBitmap(proxy.width, proxy.height, Bitmap.Config.ARGB_8888)
    proxy.use { bitmap.copyPixelsFromBuffer(it.planes[0].buffer) }
    val matrix = Matrix().apply {
      postRotate(proxy.imageInfo.rotationDegrees.toFloat())
      if (front) postScale(-1f, 1f)
    }
    val upright = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
    if (upright !== bitmap) bitmap.recycle()
    val image: MPImage = BitmapImageBuilder(upright).build()
    lm.detectAsync(image, now)
  }

  private fun onResult(result: PoseLandmarkerResult, input: MPImage) {
    val t = result.timestampMs() - startMs
    val pose = result.landmarks().firstOrNull()
    if (pose == null || pose.size < FIRST_BODY_INDEX + BODY_POINTS) {
      onNoPose(mapOf("t" to t))
      return
    }
    val packed = DoubleArray(BODY_POINTS * 3)
    // Body joints only. Indices 0–10 (face) are skipped and never leave this function.
    for (i in 0 until BODY_POINTS) {
      val l = pose[FIRST_BODY_INDEX + i]
      packed[i * 3] = l.x().toDouble()
      packed[i * 3 + 1] = l.y().toDouble()
      packed[i * 3 + 2] = l.visibility().orElse(0f).toDouble()
    }
    onPose(mapOf("t" to t, "p" to packed.toList(), "w" to input.width, "h" to input.height))
  }

  companion object {
    private const val MODEL = "pose_landmarker_lite.task"
    private const val FIRST_BODY_INDEX = 11
    private const val BODY_POINTS = 22
    /** ~15 analyzed frames a second to limit battery and heat. */
    private const val MIN_FRAME_GAP_MS = 66L
  }
}
