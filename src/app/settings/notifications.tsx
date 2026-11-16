import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSession } from '../../auth/SessionProvider';
import { NotificationsSettingsScreen, type NotificationPrefs } from '../../settings/screens/NotificationsSettings';

const DEFAULTS: NotificationPrefs = { workoutReminders: true, planReady: true, messages: true };

function keyFor(userId: string | undefined): string {
  return `settings.notifications.v1:${userId ?? 'local'}`;
}

export default function NotificationsSettingsRoute() {
  const { user } = useSession();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULTS);

  useEffect(() => {
    let alive = true;
    void AsyncStorage.getItem(keyFor(user?.id)).then((raw) => {
      if (!alive || !raw) return;
      try {
        const p = JSON.parse(raw) as Partial<NotificationPrefs>;
        setPrefs({
          workoutReminders: p.workoutReminders !== false,
          planReady: p.planReady !== false,
          messages: p.messages !== false,
        });
      } catch {
        // keep defaults
      }
    });
    return () => {
      alive = false;
    };
  }, [user?.id]);

  function onChange(next: NotificationPrefs) {
    setPrefs(next);
    void AsyncStorage.setItem(keyFor(user?.id), JSON.stringify(next)).catch(() => {});
  }

  return <NotificationsSettingsScreen prefs={prefs} onChange={onChange} onBack={() => router.back()} />;
}
