import { Redirect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line } from 'react-native-svg';
import { PoseCameraView, PoseLandmarkerNative, type NativePoseEvent } from '../../modules/pose-landmarker/src';
import { Button, Chip, Text } from '../components/ui';
import {
  BONES,
  LiveSession,
  MOVEMENTS,
  bodyFrameFromPacked,
  devProPreview,
  flaggedReps,
  formCheckLabEnabled,
  formCheckOutputs,
  previewPoint,
  setCues,
  type BodyFrame,
  type Movement,
  type SetAnalysis,
  type TrackingState,
} from '../formCheck';
import { radius, space } from '../theme/tokens';
import { useTheme } from '../theme/ThemeProvider';

/**
 * DEV ONLY. Form check lab (see src/formCheck/lab.ts). Labels here are developer labels, not product
 * copy; the real screens use Kevin-approved strings. Nothing is saved or uploaded: frames live in
 * memory for one set and are dropped when the screen closes.
 */
const ENABLED = formCheckLabEnabled();

export default function DevFormCheckRoute() {
  if (!ENABLED) return <Redirect href="/" />;
  return <Lab />;
}

type Perm = 'unknown' | 'granted' | 'denied';

function Lab() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [movement, setMovement] = useState<Movement>('squat');
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [running, setRunning] = useState(false);
  const [perm, setPerm] = useState<Perm>('unknown');
  const [count, setCount] = useState(0);
  const [tracking, setTracking] = useState<TrackingState>('waiting');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SetAnalysis | null>(null);
  const [frame, setFrame] = useState<{ body: BodyFrame; w: number; h: number } | null>(null);
  const [view, setView] = useState({ w: 0, h: 0 });
  const session = useRef<LiveSession | null>(null);
  const pro = formCheckOutputs(devProPreview());

  useEffect(() => {
    PoseLandmarkerNative?.getCameraPermission().then((p) => setPerm(p.granted ? 'granted' : p.canAskAgain ? 'unknown' : 'denied'));
  }, []);

  const start = useCallback(async () => {
    if (!PoseLandmarkerNative) return;
    let granted = perm === 'granted';
    if (!granted) {
      const p = await PoseLandmarkerNative.requestCameraPermission();
      granted = p.granted;
      setPerm(granted ? 'granted' : 'denied');
    }
    if (!granted) return;
    session.current = new LiveSession(movement);
    setCount(0);
    setTracking('waiting');
    setResult(null);
    setError(null);
    setRunning(true);
  }, [movement, perm]);

  const stop = useCallback(() => {
    setRunning(false);
    const s = session.current;
    session.current = null;
    setFrame(null);
    if (s) setResult(s.finish().analysis);
  }, []);

  const onPose = useCallback((e: { nativeEvent: NativePoseEvent }) => {
    const s = session.current;
    if (!s) return;
    s.onPose(e.nativeEvent);
    setCount(s.repCount);
    setTracking(s.tracking);
    try {
      setFrame({ body: bodyFrameFromPacked(e.nativeEvent.p, e.nativeEvent.t), w: e.nativeEvent.w, h: e.nativeEvent.h });
    } catch {
      setFrame(null);
    }
  }, []);

  const onNoPose = useCallback((e: { nativeEvent: { t: number } }) => {
    const s = session.current;
    if (!s) return;
    s.onNoPose(e.nativeEvent);
    setTracking(s.tracking);
  }, []);

  const onLayout = (e: LayoutChangeEvent) => setView({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  if (!PoseCameraView) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg, paddingTop: insets.top + space[4] }]}>
        <Text variant="heading">Form check lab (dev)</Text>
        <Text color={colors.textMuted} style={{ marginTop: space[2], textAlign: 'center' }}>
          The pose module is not in this build. Use a development build (npx expo run:ios --device), not Expo Go or web.
        </Text>
      </View>
    );
  }

  const Camera = PoseCameraView;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.camera} onLayout={onLayout}>
        <Camera
          style={StyleSheet.absoluteFill}
          active={running}
          facing={facing}
          onPose={onPose}
          onNoPose={onNoPose}
          onTrackingError={(e) => setError(e.nativeEvent.code)}
        />
        {frame ? <Skeleton frame={frame} view={view} color={colors.accent} /> : null}
        <View style={[styles.hud, { top: insets.top + space[2], backgroundColor: colors.surface }]}>
          <Text variant="metric" accessibilityLabel={`reps ${count}`}>{count}</Text>
          <Text variant="small" color={colors.textMuted}>{running ? tracking : 'idle'}</Text>
        </View>
      </View>
      <ScrollView
        style={{ flexGrow: 0, maxHeight: '45%' }}
        contentContainerStyle={{ padding: space[4], paddingBottom: insets.bottom + space[4], gap: space[3] }}
      >
        <View style={styles.row}>
          {MOVEMENTS.map((m) => (
            <Chip key={m} label={m} active={m === movement} onPress={running ? undefined : () => setMovement(m)} />
          ))}
        </View>
        <View style={styles.row}>
          <Chip label="back camera" active={facing === 'back'} onPress={() => setFacing('back')} />
          <Chip label="front camera" active={facing === 'front'} onPress={() => setFacing('front')} />
        </View>
        {running ? <Button label="Stop set" onPress={stop} /> : <Button label="Start set" onPress={start} />}
        {perm === 'denied' ? <Text color={colors.textMuted}>Camera permission denied. Turn it on in Settings.</Text> : null}
        {error ? <Text color={colors.textMuted}>error: {error}</Text> : null}
        {result ? <Results result={result} pro={pro.flaggedReps} /> : null}
      </ScrollView>
    </View>
  );
}

function Skeleton({ frame, view, color }: { frame: { body: BodyFrame; w: number; h: number }; view: { w: number; h: number }; color: string }) {
  const pt = (j: keyof BodyFrame['points']) => {
    const p = frame.body.points[j];
    return p && p.v >= 0.5 ? previewPoint(p.x, p.y, frame, view) : null;
  };
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      {BONES.map(([a, b]) => {
        const pa = pt(a), pb = pt(b);
        return pa && pb ? <Line key={`${a}-${b}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke={color} strokeWidth={3} /> : null;
      })}
      {Object.keys(frame.body.points).map((j) => {
        const p = pt(j as keyof BodyFrame['points']);
        return p ? <Circle key={j} cx={p.x} cy={p.y} r={4} fill={color} /> : null;
      })}
    </Svg>
  );
}

function Results({ result, pro }: { result: SetAnalysis; pro: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { borderColor: colors.borderStrong }]}>
      <Text variant="bodyStrong">{result.movement}: {result.reps.length} reps</Text>
      {pro ? (
        <>
          {result.reps.map((r) => (
            <Text key={r.index} variant="small" color={colors.textMuted}>
              #{r.index} bottom {Math.round(r.bottomAngle)}° top {Math.round(r.topAngle)}° {(r.endT - r.startT) | 0}ms {r.flags.join(', ')}
            </Text>
          ))}
          <Text variant="small" color={colors.textMuted}>flagged: {flaggedReps(result).join(', ') || 'none'}</Text>
          <Text variant="small" color={colors.textMuted}>cues: {setCues(result).join(', ') || 'none'}</Text>
          <Text variant="small" color={colors.textMuted}>bar drift: {result.barDrift === null ? 'n/a' : result.barDrift.toFixed(2)}</Text>
        </>
      ) : (
        <Text variant="small" color={colors.textMuted}>Set EXPO_PUBLIC_DEV_FORM_CHECK_PRO=1 to see angles and flags.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', padding: space[4] },
  camera: { flex: 1, overflow: 'hidden' },
  hud: { position: 'absolute', alignSelf: 'center', paddingHorizontal: space[4], paddingVertical: space[2], borderRadius: radius.card, alignItems: 'center', minWidth: 96 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  card: { borderWidth: 1, borderRadius: radius.card, padding: space[3], gap: space[1] },
});
