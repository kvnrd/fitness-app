import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { WorkoutDay } from '../data/types';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space } from '../theme/tokens';
import { Text } from './ui';

function Player({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => p.play());
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls />;
}

/** The coach's walkthrough. Poster until a real upload exists. Aurora: compact 48 pt row. */
export function VideoHero({ day, trainerName }: { day: WorkoutDay; trainerName: string }) {
  const { colors, family, fonts } = useTheme();
  const [tapped, setTapped] = useState(false);
  const video = day.video;
  if (!video) return null;
  const aurora = family === 'aurora';

  if (aurora) {
    return (
      <Pressable
        onPress={() => setTapped(true)}
        accessibilityRole="button"
        accessibilityLabel={`Play ${video.title}, ${video.durationLabel}`}
        style={[
          styles.compact,
          {
            backgroundColor: colors.glass,
            borderColor: colors.glassBorder,
            minHeight: 48,
            borderRadius: 24,
          },
        ]}
      >
        <View style={[styles.compactPlay, { backgroundColor: colors.accent, width: 36, height: 36, borderRadius: 18 }]}>
          <Ionicons name="play" size={20} color={colors.accentText} style={{ marginLeft: 2 }} />
        </View>
        {tapped && video.uri ? (
          <View style={{ flex: 1, height: 48 }}>
            <Player uri={video.uri} />
          </View>
        ) : (
          <>
            <Text variant="small" style={{ fontFamily: fonts.bodySemi }}>
              Video
            </Text>
            <Text variant="label" color={colors.textSecondary}>
              {video.durationLabel}
            </Text>
          </>
        )}
      </Pressable>
    );
  }

  return (
    <View style={{ gap: space.sm }}>
      <View style={[styles.frame, { backgroundColor: colors.surface }]}>
        {tapped && video.uri ? (
          <Player uri={video.uri} />
        ) : (
          <Pressable
            style={styles.poster}
            onPress={() => setTapped(true)}
            accessibilityRole="button"
            accessibilityLabel={`Play ${video.title}, ${video.durationLabel}`}
          >
            <View style={[styles.play, { backgroundColor: colors.accent }]}>
              <Ionicons name="play" size={22} color={colors.accentText} style={{ marginLeft: 3 }} />
            </View>
            <Text variant="small" color={colors.textSecondary} style={styles.duration}>
              {video.durationLabel}
            </Text>
            {tapped ? (
              <Text variant="small" color={colors.textSecondary} style={styles.notice}>
                The video plays here once {trainerName.split(' ')[0]} uploads it.
              </Text>
            ) : null}
          </Pressable>
        )}
      </View>
      <View style={{ gap: 2 }}>
        <Text variant="bodyStrong">{video.title}</Text>
        <Text variant="small" color={colors.coach}>
          {trainerName}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    aspectRatio: 16 / 9,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  poster: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  play: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  duration: { position: 'absolute', right: space.sm, bottom: space.xs, fontVariant: ['tabular-nums'] },
  notice: { position: 'absolute', left: space.sm, top: space.xs },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 16,
    paddingLeft: 6,
    borderWidth: StyleSheet.hairlineWidth,
    height: 48,
  },
  compactPlay: { alignItems: 'center', justifyContent: 'center' },
});

