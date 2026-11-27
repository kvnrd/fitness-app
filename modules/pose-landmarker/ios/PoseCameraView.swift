import AVFoundation
import ExpoModulesCore
import MediaPipeTasksVision
import UIKit

/// Live camera preview + MediaPipe Pose Landmarker (live stream mode), all on the phone.
///
/// Privacy rules enforced here (legal review: Texas CUBI, Illinois BIPA):
///   - Only pose indices 11–32 (body joints) are sent to JS. Face points 0–10 are never copied.
///   - Frames are analyzed in memory and dropped. Nothing is written to disk or sent anywhere.
public final class PoseCameraView: ExpoView, AVCaptureVideoDataOutputSampleBufferDelegate, PoseLandmarkerLiveStreamDelegate {
  /// { t: ms since the camera started, p: [x, y, visibility] × 22 body joints, w/h: analyzed frame size }
  let onPose = EventDispatcher()
  let onNoPose = EventDispatcher()
  let onTrackingError = EventDispatcher()

  private static let firstBodyIndex = 11
  private static let bodyPoints = 22
  /// Throttle to ~15 analyzed frames a second to limit battery and heat.
  private static let minFrameGapMs = 66

  private let session = AVCaptureSession()
  private let previewLayer: AVCaptureVideoPreviewLayer
  private let videoQueue = DispatchQueue(label: "pose.camera.video")
  private let sessionQueue = DispatchQueue(label: "pose.camera.session")
  private var landmarker: PoseLandmarker?
  private var position: AVCaptureDevice.Position = .back
  private var active = false
  private var configured = false
  private var startUptimeMs: Int = 0
  private var lastSentMs: Int = -1_000_000
  private var frameW = 0
  private var frameH = 0

  public required init(appContext: AppContext? = nil) {
    previewLayer = AVCaptureVideoPreviewLayer(session: session)
    super.init(appContext: appContext)
    clipsToBounds = true
    previewLayer.videoGravity = .resizeAspectFill
    layer.addSublayer(previewLayer)
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    previewLayer.frame = bounds
  }

  func setActive(_ value: Bool) {
    guard value != active else { return }
    active = value
    value ? start() : stop()
  }

  func setFacing(_ value: AVCaptureDevice.Position) {
    guard value != position else { return }
    position = value
    guard configured else { return }
    sessionQueue.async { [weak self] in self?.configureInput() }
  }

  public override func removeFromSuperview() {
    stop()
    super.removeFromSuperview()
  }

  deinit {
    session.stopRunning()
  }

  // MARK: - Camera

  private func start() {
    guard AVCaptureDevice.authorizationStatus(for: .video) == .authorized else {
      onTrackingError(["code": "camera_permission"])
      return
    }
    sessionQueue.async { [weak self] in
      guard let self else { return }
      if !self.configured {
        guard self.makeLandmarker() else { return }
        self.session.beginConfiguration()
        self.session.sessionPreset = .high
        let output = AVCaptureVideoDataOutput()
        output.alwaysDiscardsLateVideoFrames = true
        output.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
        output.setSampleBufferDelegate(self, queue: self.videoQueue)
        if self.session.canAddOutput(output) { self.session.addOutput(output) }
        self.session.commitConfiguration()
        self.configured = true
        self.configureInput()
      }
      self.startUptimeMs = Self.nowMs()
      self.lastSentMs = -1_000_000
      if !self.session.isRunning { self.session.startRunning() }
    }
  }

  private func stop() {
    sessionQueue.async { [weak self] in
      guard let self, self.session.isRunning else { return }
      self.session.stopRunning()
    }
  }

  private func configureInput() {
    session.beginConfiguration()
    defer { session.commitConfiguration() }
    session.inputs.forEach { session.removeInput($0) }
    guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: position),
          let input = try? AVCaptureDeviceInput(device: device),
          session.canAddInput(input) else {
      onTrackingError(["code": "camera_unavailable"])
      return
    }
    session.addInput(input)
    if let conn = session.outputs.first?.connection(with: .video) {
      if #available(iOS 17.0, *) {
        if conn.isVideoRotationAngleSupported(90) { conn.videoRotationAngle = 90 }
      } else if conn.isVideoOrientationSupported {
        conn.videoOrientation = .portrait
      }
      if conn.isVideoMirroringSupported {
        conn.automaticallyAdjustsVideoMirroring = false
        conn.isVideoMirrored = position == .front
      }
    }
  }

  private func makeLandmarker() -> Bool {
    let bundle = Bundle(for: PoseCameraView.self)
    guard let path = bundle.path(forResource: "pose_landmarker_lite", ofType: "task")
      ?? Bundle.main.path(forResource: "pose_landmarker_lite", ofType: "task") else {
      onTrackingError(["code": "model_missing"])
      return false
    }
    let options = PoseLandmarkerOptions()
    options.baseOptions.modelAssetPath = path
    options.runningMode = .liveStream
    options.numPoses = 1
    options.minPoseDetectionConfidence = 0.5
    options.minPosePresenceConfidence = 0.5
    options.minTrackingConfidence = 0.5
    options.poseLandmarkerLiveStreamDelegate = self
    do {
      landmarker = try PoseLandmarker(options: options)
      return true
    } catch {
      onTrackingError(["code": "model_load_failed"])
      return false
    }
  }

  private static func nowMs() -> Int {
    return Int(ProcessInfo.processInfo.systemUptime * 1000)
  }

  // MARK: - Frames

  public func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
    let now = Self.nowMs()
    guard now - lastSentMs >= Self.minFrameGapMs, let landmarker else { return }
    lastSentMs = now
    // The connection already rotates to portrait, so the buffer is upright.
    if let pb = CMSampleBufferGetImageBuffer(sampleBuffer) {
      frameW = CVPixelBufferGetWidth(pb)
      frameH = CVPixelBufferGetHeight(pb)
    }
    guard let image = try? MPImage(sampleBuffer: sampleBuffer, orientation: .up) else { return }
    try? landmarker.detectAsync(image: image, timestampInMilliseconds: now)
  }

  public func poseLandmarker(_ poseLandmarker: PoseLandmarker, didFinishDetection result: PoseLandmarkerResult?,
                             timestampInMilliseconds: Int, error: (any Error)?) {
    let t = timestampInMilliseconds - startUptimeMs
    guard error == nil, let pose = result?.landmarks.first, pose.count >= Self.firstBodyIndex + Self.bodyPoints else {
      onNoPose(["t": t])
      return
    }
    var packed = [Double]()
    packed.reserveCapacity(Self.bodyPoints * 3)
    // Body joints only. Indices 0–10 (face) are skipped and never leave this function.
    for i in Self.firstBodyIndex..<(Self.firstBodyIndex + Self.bodyPoints) {
      let lm = pose[i]
      packed.append(Double(lm.x))
      packed.append(Double(lm.y))
      packed.append(lm.visibility?.doubleValue ?? 0)
    }
    onPose(["t": t, "p": packed, "w": frameW, "h": frameH])
  }
}
