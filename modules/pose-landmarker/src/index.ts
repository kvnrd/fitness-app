import type { ComponentType } from 'react';
import type { ViewProps } from 'react-native';
import { requireNativeView, requireOptionalNativeModule } from 'expo';

/** One analyzed frame: ms since the camera started, 22 body joints × (x, y, visibility) normalized to the upright frame (w × h px). No face points. */
export type NativePoseEvent = { t: number; p: number[]; w: number; h: number };
export type NativeTrackingError = 'camera_permission' | 'camera_unavailable' | 'model_missing' | 'model_load_failed' | 'tracking_failed';

export type CameraPermission = { status: 'granted' | 'denied' | 'undetermined'; granted: boolean; canAskAgain: boolean };

export type PoseCameraViewProps = ViewProps & {
  /** Camera and tracking run only while true. */
  active: boolean;
  facing?: 'back' | 'front';
  onPose?: (e: { nativeEvent: NativePoseEvent }) => void;
  onNoPose?: (e: { nativeEvent: { t: number } }) => void;
  onTrackingError?: (e: { nativeEvent: { code: NativeTrackingError } }) => void;
};

type NativeModule = {
  getCameraPermission(): Promise<CameraPermission>;
  requestCameraPermission(): Promise<CameraPermission>;
};

/** Null in Expo Go and on web: the module only exists in a development or store build. */
export const PoseLandmarkerNative: NativeModule | null = requireOptionalNativeModule<NativeModule>('PoseLandmarker');

export const PoseCameraView: ComponentType<PoseCameraViewProps> | null = PoseLandmarkerNative
  ? requireNativeView<PoseCameraViewProps>('PoseLandmarker')
  : null;

export const poseTrackingAvailable = PoseLandmarkerNative !== null;
