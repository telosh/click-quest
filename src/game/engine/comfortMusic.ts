import { COMFORT_MUSIC_KEY } from "../config";

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let loopTimer: ReturnType<typeof setInterval> | null = null;
let step = 0;

const MELODY = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63];

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    audioContext = new AudioContext();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.035;
    masterGain.connect(audioContext.destination);
  }
  return audioContext;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function playSoftNote(frequency: number): void {
  const ctx = getContext();
  if (!ctx || !masterGain) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.9, ctx.currentTime + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.6);
}

export function startComfortMusic(): void {
  if (prefersReducedMotion()) return;

  const ctx = getContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  if (loopTimer) return;

  loopTimer = setInterval(() => {
    playSoftNote(MELODY[step % MELODY.length]);
    step += 1;
  }, 900);
}

export function stopComfortMusic(): void {
  if (loopTimer) {
    clearInterval(loopTimer);
    loopTimer = null;
  }
}

export function isComfortMusicPlaying(): boolean {
  return loopTimer !== null;
}

export function loadComfortMusicPref(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(COMFORT_MUSIC_KEY) === "1";
}

export function saveComfortMusicPref(on: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMFORT_MUSIC_KEY, on ? "1" : "0");
}
