import { RepAnalyzer, type SetAnalysis } from './analyzer.ts';
import { bodyFrameFromPacked, type BodyFrame } from './landmarks.ts';
import type { Movement } from './movements.ts';

/**
 * Glue between the native pose camera's events and the rep analyzer, for one set.
 * Pure TS so it can be tested without a phone. Frames stay in memory only.
 */
export type TrackingState = 'waiting' | 'tracking' | 'lost';

/** After this long without a body in frame, tracking counts as lost. */
export const LOST_AFTER_MS = 1500;

export class LiveSession {
  private analyzer: RepAnalyzer;
  private frames: BodyFrame[] = [];
  private lastPoseT: number | null = null;
  private lastT = 0;
  private rejected = 0;

  readonly movement: Movement;

  constructor(movement: Movement) {
    this.movement = movement;
    this.analyzer = new RepAnalyzer(movement);
  }

  /** Native onPose. Malformed payloads are dropped and counted, never thrown into the UI. */
  onPose(e: { t: number; p: ArrayLike<number> }): void {
    let f: BodyFrame;
    try {
      f = bodyFrameFromPacked(e.p, e.t);
    } catch {
      this.rejected++;
      return;
    }
    this.lastT = Math.max(this.lastT, e.t);
    this.lastPoseT = e.t;
    this.frames.push(f);
    this.analyzer.push(f);
  }

  /** Native onNoPose. */
  onNoPose(e: { t: number }): void {
    this.lastT = Math.max(this.lastT, e.t);
  }

  get repCount(): number {
    return this.analyzer.count;
  }

  get rejectedFrames(): number {
    return this.rejected;
  }

  get tracking(): TrackingState {
    if (this.lastPoseT === null) return 'waiting';
    return this.lastT - this.lastPoseT > LOST_AFTER_MS ? 'lost' : 'tracking';
  }

  /** Ends the set. The frames are returned for an optional skeleton save, then dropped here. */
  finish(): { analysis: SetAnalysis; frames: BodyFrame[] } {
    const analysis = this.analyzer.finish();
    const frames = this.frames;
    this.frames = [];
    return { analysis, frames };
  }
}
