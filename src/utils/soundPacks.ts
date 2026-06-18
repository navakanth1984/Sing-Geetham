import { SoundPack } from "../types";

export const SOUND_PACKS: SoundPack[] = [
  {
    id: "pushpaka_vimana",
    name: "Pushpaka Vimana Ambient Silence",
    creator: "Singeetham Legacy Team",
    genre: "lofi",
    description: "Paid homage to Singeetham Srinivasa Rao's legendary dialogue-less movie standard. Cinematic soft lofi chords, soothing vinyl dust crackling, and ambient delays that represent the beautiful art of silent storytelling.",
    stems: [
      { name: "Silent Chords (Triangle Pad)", type: "synth", notes: "Cmaj7 - Fmaj7 - G6 - Am", frequencyConfig: [261.6, 349.2, 392.0, 440.0] },
      { name: "Vinyl Crackle Static Loop", type: "drums", notes: "Continuous Soft Dust Beats", frequencyConfig: [50, 60, 40] },
      { name: "Dreamy Bass Walk", type: "bass", notes: "C - F - G - A", frequencyConfig: [130.8, 174.6, 196.0, 220.0] },
      { name: "Storyteller Mellotron Flute", type: "melody", notes: "Solo E5 - G5 - A5 - C6", frequencyConfig: [659.2, 783.9, 880.0, 1046.5] }
    ]
  },
  {
    id: "aditya_369",
    name: "Aditya 369 Retro Time Warp",
    creator: "Chronos Synths",
    genre: "pop",
    description: "Inspired by Singeetham's historical science-fiction masterpiece 'Aditya 369'. High-tempo hyper-pop rhythms, arpeggiated 1980s synthesizers, and vintage electronic acoustic-claps simulating time travel sounds.",
    stems: [
      { name: "Time Warp Acid Arpeggiator", type: "synth", notes: "Fast C1 - C2 Octaves", frequencyConfig: [523.2, 587.3, 659.2, 783.9] },
      { name: "80s Synth Pop Kick & Clap", type: "drums", notes: "Kick (0) Drum & Clap (2,6)", frequencyConfig: [60, 80] },
      { name: "Cyberpunk Sub-Bass", type: "bass", notes: "C1 - Eb1 - F1 - Bb1", frequencyConfig: [65.4, 77.7, 87.3, 116.5] },
      { name: "Futuristic Laser Melody", type: "melody", notes: "High Resonance Sine Pulse", frequencyConfig: [1200, 1500, 1800] }
    ]
  },
  {
    id: "bhairava_dweepam",
    name: "Bhairava Dweepam Folk Chamber",
    creator: "Karthikeya Folk",
    genre: "classical",
    description: "Honoring Singeetham Rao's high-fantasy film 'Bhairava Dweepam'. Beautiful classical Indian string arrangements, rich ethnic percussion cues, and micro-tonal woodwind melodies playing celestial progressions.",
    stems: [
      { name: "Indian Sitar Plucks", type: "synth", notes: "Raag Bhairavi microtonal", frequencyConfig: [250, 300, 350, 400] },
      { name: "Ethnic Tabla Percussions", type: "drums", notes: "Ta-Din-Da loops", frequencyConfig: [140, 180, 220] },
      { name: "Veena Low Ground drones", type: "bass", notes: "Sa - Pa - Sa resonance", frequencyConfig: [110, 165] },
      { name: "Flute Rhapsody of Dwarfs", type: "melody", notes: "D5 - F5 - G5 - Bb5", frequencyConfig: [587.3, 698.4, 783.9, 932.3] }
    ]
  },
  {
    id: "michael_madana_comedy",
    name: "Michael Madana Slap-Bass Funk",
    creator: "Funky Quadruplets",
    genre: "jazz",
    description: "Paying homage to the timeless four-character comedy masterclass 'Michael Madana Kama Rajan'. Rhythmic slap-bass lines, chaotic jazz-fusion chords, and bouncy retro-brass packs that spark playfulness.",
    stems: [
      { name: "Chaotic Slap-Bass Stabs", type: "bass", notes: "Funk G-Pentatonic Pops", frequencyConfig: [98, 146, 196] },
      { name: "Bouncy Slap Shaker Snares", type: "drums", notes: "135 Bpm energetic swing", frequencyConfig: [300, 400] },
      { name: "Quadruplet Jazz Brass chords", type: "synth", notes: "G9 - C7 - Fmaj9", frequencyConfig: [392, 523, 698] },
      { name: "Whimsical Carnival Whistle", type: "melody", notes: "Playful vibrato synth", frequencyConfig: [1500, 1600, 1700] }
    ]
  }
];
