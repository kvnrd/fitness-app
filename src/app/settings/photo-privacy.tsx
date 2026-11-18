import { useState } from 'react';
import { router } from 'expo-router';
import { PhotoPrivacySettingsScreen } from '../../progress/screens/PhotoPrivacySettings';
import { DEFAULT_CAMERA_ROLL_COPIES, defaultPhotoLockOn } from '../../progress/photoPrivacy.ts';

export default function PhotoPrivacyRoute() {
  const [lockOn, setLockOn] = useState(defaultPhotoLockOn());
  const [blurOn, setBlurOn] = useState(true);
  const [cameraRollOn, setCameraRollOn] = useState(DEFAULT_CAMERA_ROLL_COPIES);
  return (
    <PhotoPrivacySettingsScreen
      optedIn={false}
      lockOn={lockOn}
      blurOn={blurOn}
      cameraRollOn={cameraRollOn}
      coachSharingOn={false}
      onBack={() => router.back()}
      onOpenOptIn={() => router.push('/photos/opt-in')}
      onCoachSharing={() => router.push('/settings/photo-share')}
      onToggleLock={setLockOn}
      onToggleBlur={setBlurOn}
      onToggleCameraRoll={setCameraRollOn}
    />
  );
}
