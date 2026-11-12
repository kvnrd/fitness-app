import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { WorkoutDay } from '../data/types';
import { colors, radius, space } from '../theme/tokens';
import { Text } from './ui';

function Player({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => p.play());
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls />;
}

/** Trainer's walkthrough video. Shows a poster until a real upload exists. */
export function VideoHero({ day, trainerName }: { day: WorkoutDay; trainerName: string }) {
  const [playing, setPlaying] = useState(false);
  const video = day.video;
  if (!video) return null;

  return (
    <View style={styles.frame}>
      {playing && video.uri ? (
        <Player uri={video.uri} />
      ) : (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setPlaying(true)}
          accessibilityRole="button"
          accessibilityLabel={`Play ${video.title}`}
        >
          <LinearGradient
            colors={['#24262B', '#141416', '#0A0A0B']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.center}>
            <View style={styles.play}>
              <Ionicons name="play" size={26} color={colors.accentText} style={{ marginLeft: 3 }} />
            </View>
          </View>
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.scrim} />
          <View style={styles.meta}>
            <Text variant="label" color={colors.accent}>
              Coach video · {video.durationLabel}
            </Text>
            <Text variant="heading" numberOfLines={2}>
              {video.title}
            </Text>
            <Text variant="small" color={colors.textSecondary}>
              {trainerName}
            </Text>
          </View>
          {playing && !video.uri ? (
            <View style={styles.notice}>
              <Text variant="small" color={colors.textSecondary}>
                Video plays here once your coach uploads it.
              </Text>
            </View>
          ) : null}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    aspectRatio: 16 / 10,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: '48%', alignItems: 'center', justifyContent: 'center' },
  play: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },
  meta: { position: 'absolute', left: space.lg, right: space.lg, bottom: space.lg, gap: 4 },
  notice: {
    position: 'absolute',
    top: space.md,
    alignSelf: 'center',
    backgroundColor: colors.overlay,
    paddingHorizontal: space.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
});
