export interface Track {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  title: string;
  genre: "jazz" | "pop" | "rock" | "lofi" | "classical";
  lyrics: string;
  audioUrl?: string; // base64 URL or Blob URL
  chords?: string[];
  arrangements?: { section: string; chords: string; intensity: string }[];
  suggestions?: string[];
  createdAt: number;
  likes: number;
  comments?: { userName: string; text: string; createdAt: number }[];
}

export interface JamSession {
  id: string;
  title: string;
  creatorId: string;
  creatorName: string;
  genre: string;
  peersCount: number;
  lyrics: string;
  chords: string[];
  messages: { id: string; userId: string; userName: string; text: string; timestamp: number }[];
  createdAt: number;
  isActive: boolean;
}

export interface SoundPack {
  id: string;
  name: string;
  creator: string;
  genre: "jazz" | "pop" | "rock" | "lofi" | "classical";
  description: string;
  stems: { name: string; type: "drums" | "bass" | "melody" | "synth"; notes: string; frequencyConfig: number[] }[];
}
