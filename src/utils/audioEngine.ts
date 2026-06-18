// Sing Geetham Web Audio Procedural Synth Engine
// This handles local synthesized loops, chord structures, beats, and playbacks.

let audioCtx: AudioContext | null = null;
let currentBpm = 120;
let soundInterval: any = null;
let activeNodes: AudioNode[] = [];

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Convert note names to frequencies (A4 = 440Hz)
export function noteToFreq(note: string): number {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const match = note.match(/^([A-G]#?)(\d+)$/);
  if (!match) return 440;
  const name = match[1];
  const octave = parseInt(match[2], 10);
  const semitones = notes.indexOf(name) + (octave - 4) * 12;
  return 440 * Math.pow(2, semitones / 12);
}

// Map chord names (e.g. C, Am, G, F) to absolute frequencies
export function chordToFreqs(chord: string): number[] {
  const rootNotes: { [key: string]: number } = {
    C: 261.63, "C#": 277.18, D: 293.66, "D#": 311.13, E: 329.63,
    F: 349.23, "F#": 369.99, G: 392.00, "G#": 415.30, A: 440.00,
    "A#": 466.16, B: 493.88
  };

  const clean = chord.trim().replace("sus4", "").replace("7", "").replace("maj", "");
  const isMinor = clean.endsWith("m");
  const rootName = isMinor ? clean.slice(0, -1) : clean;
  const baseFreq = rootNotes[rootName] || 261.63;

  // Root, Third (minor or major), Fifth
  const f1 = baseFreq;
  const f2 = baseFreq * (isMinor ? 1.189 : 1.25); // Minor 3rd vs Major 3rd
  const f3 = baseFreq * 1.5; // Perfect 5th
  
  return [f1, f2, f3, f1 * 2];
}

// Play a structured chord block using Web Audio oscillators
export function playChordProgression(chordName: string, duration = 1.5, type: "jazz" | "pop" | "rock" | "lofi" | "classical" = "pop") {
  try {
    const ctx = getAudioCtx();
    const freqs = chordToFreqs(chordName);
    const now = ctx.currentTime;

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Configure oscillator types based on genre
      if (type === "jazz") {
        osc.type = "sine"; // Warm mellow tone
      } else if (type === "lofi") {
        osc.type = "triangle"; // Soft chill retro
      } else if (type === "rock") {
        osc.type = "sawtooth"; // Overdriven bright
      } else {
        osc.type = "sine"; // Standard Pop hybrid
      }

      osc.frequency.setValueAtTime(freq, now);

      // Low velocity chord voicings on pop & lofi
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(type === "rock" ? 0.08 : 0.05, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);

      activeNodes.push(osc);
    });
  } catch (error) {
    console.warn("Web Audio Playback inactive:", error);
  }
}

// Clean sound synthesizer loops
export function stopAllSynthesizers() {
  if (soundInterval) {
    clearInterval(soundInterval);
    soundInterval = null;
  }
  activeNodes.forEach(node => {
     try { (node as any).stop(); } catch(e){}
  });
  activeNodes = [];
}

// Start continuous rhythmic beat backing drum + backing chord sequences
export function startRhythmEngine(
  genre: "jazz" | "pop" | "rock" | "lofi" | "classical", 
  bpm = 110,
  chordProgression: string[] = ["C", "Am", "F", "G"]
) {
  stopAllSynthesizers();
  const ctx = getAudioCtx();
  currentBpm = bpm;
  const intervalMs = (60 / bpm) * 1000 * 0.5; // Eighth note interval

  let step = 0;
  let chordIndex = 0;

  soundInterval = setInterval(() => {
    const now = ctx.currentTime;
    
    // Play back backing drums procedurally
    try {
      // Step modulo 8 loop
      const beatStep = step % 8;

      // 1. Bass drum kick synthesis
      if (beatStep === 0 || beatStep === 4 || (genre === "rock" && beatStep === 6)) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      }

      // 2. Snare / Clap synthesis
      if (beatStep === 2 || beatStep === 6) {
        // High frequency noise burst
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(genre === "jazz" ? 220 : 355, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      }

      // 3. Hi-hat cymbal synthesis
      if (genre === "jazz" ? (beatStep % 3 === 0) : (beatStep % 2 !== 0)) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(8000, now);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      }

      // 4. Bass synth line accompaniment (every 4 steps)
      if (beatStep === 0 || beatStep === 3) {
        const currentChord = chordProgression[chordIndex];
        const freqs = chordToFreqs(currentChord);
        const bassFreq = freqs[0] / 2; // Octave lower for bass
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = genre === "lofi" ? "sine" : "sawtooth";
        osc.frequency.setValueAtTime(bassFreq, now);
        gain.gain.setValueAtTime(genre === "rock" ? 0.08 : 0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      }

      // 5. Backing harmonic chord pads (every 8 steps)
      if (beatStep === 0) {
        const currentChord = chordProgression[chordIndex];
        playChordProgression(currentChord, (60 / bpm) * 4, genre);
        
        // Progress chords
        chordIndex = (chordIndex + 1) % chordProgression.length;
      }

      step++;
    } catch (err) {
      console.warn("Drum synthesis skipped tick:", err);
    }
  }, intervalMs);
}

// Convert audio base64 from Gemini TTS/Lyria into a playable Audio Buffer Source Node
export async function playEncodedAudio(base64: string): Promise<AudioBufferSourceNode> {
  const ctx = getAudioCtx();
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const audioBuf = await ctx.decodeAudioData(bytes.buffer);
  const source = ctx.createBufferSource();
  source.buffer = audioBuf;
  source.connect(ctx.destination);
  source.start(0);
  return source;
}
