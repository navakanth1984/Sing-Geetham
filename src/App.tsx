import { useState, useEffect } from "react";
import { 
  Music, Sparkles, Share2, Download, LogOut, User, Plus, Play, Square, 
  Radio, Tv, Award, BookOpen, ChevronRight, Heart, Trash2, ShieldAlert
} from "lucide-react";
import { auth, db, GoogleAuthProvider, signInWithPopup, signOut } from "./firebase";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { Track } from "./types";
import SoundPackLibrary from "./components/SoundPackLibrary";
import LiveSessionJam from "./components/LiveSessionJam";
import InteractiveCallMock from "./components/InteractiveCallMock";
import CreditQuotaManager, { CreditState, TransactionLog } from "./components/CreditQuotaManager";
import { AudioVisualizer } from "./components/AudioVisualizer";
import { playChordProgression, stopAllSynthesizers } from "./utils/audioEngine";

export default function App() {
  const [user, setUser] = useState<{ uid: string; displayName: string; email?: string } | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"composer" | "call_mock" | "jam_lobby" | "sound_packs">("composer");
  
  // Credits & API billing states (synchronized dynamically from user's quota details image)
  const [credits, setCredits] = useState<CreditState>({
    trialRemaining: 94804.47,
    trialOriginal: 94812.51,
    dialogflowRemaining: 56729.35,
    dialogflowOriginal: 56730.01
  });
  const [creditLogs, setCreditLogs] = useState<TransactionLog[]>([]);

  // Composer states
  const [promptText, setPromptText] = useState("After the long silence, we finally laughed, converting standard talking into high harmony.");
  const [selectedGenre, setSelectedGenre] = useState<"pop" | "jazz" | "rock" | "lofi" | "classical">("pop");
  const [activePlaybackTrack, setActivePlaybackTrack] = useState<Track | null>(null);
  const [isPlaybackActive, setIsPlaybackActive] = useState(false);
  const [lyricsResult, setLyricsResult] = useState("");
  const [chordsResult, setChordsResult] = useState<string[]>(["C", "G", "Am", "F"]);
  const [arrangementResult, setArrangementResult] = useState<{ section: string; chords: string; intensity: string }[]>([]);
  const [suggestionsResult, setSuggestionsResult] = useState<string[]>([]);
  const [vocalAudioUrl, setVocalAudioUrl] = useState<string | null>(null);

  // Singeetham Rao Homage catalog items
  const moviesTribute = [
    { title: "Pushpaka Vimanam", year: "1987", desc: "A flawless silent black-comedy that proved words are secondary to expression and rhythm.", logo: "🤫" },
    { title: "Aditya 369", year: "1991", desc: "India's pioneer sci-fi time-travel film pairing ancient imperial tunes with hyper-futuristic beats.", logo: "⏳" },
    { title: "Bhairava Dweepam", year: "1994", desc: "High-fantasy legendary masterpiece showcasing rich local folklore arrangements and strings.", logo: "🐉" },
    { title: "Michael Madana Kama Rajan", year: "1990", desc: "Chaos of funny quadruplets synchronized in an upbeat, energetic retro-slap bass jazz theme.", logo: "🎭" }
  ];

  // 1. Authenticate Listeners & Sync Promotional Credit Status
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setUser({
          uid: authUser.uid,
          displayName: authUser.displayName || "Anonymous Musician",
          email: authUser.email || ""
        });
      } else {
        // Fallback: anonymous sign in to keep firebase operations working immediately
        signInAnonymously(auth).then((cred) => {
          setUser({
            uid: cred.user.uid,
            displayName: "Guest Creator",
            email: ""
          });
        }).catch(() => {
          setUser({
            uid: "demouser",
            displayName: "Sing Guest"
          });
        });
      }
    });
    return () => unsub();
  }, []);

  // Synchronize credits with Firestore (and localStorage fallback)
  useEffect(() => {
    if (!user) return;
    const uid = user.uid || "guest_user";
    
    let unsubCredits: () => void = () => {};
    try {
      const docRef = doc(db, "credits", uid);
      unsubCredits = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCredits({
            trialRemaining: Number(data.trialRemaining ?? 94804.47),
            trialOriginal: Number(data.trialOriginal ?? 94812.51),
            dialogflowRemaining: Number(data.dialogflowRemaining ?? 56729.35),
            dialogflowOriginal: Number(data.dialogflowOriginal ?? 56730.01)
          });
          if (data.logs) {
            setCreditLogs(data.logs);
          }
        } else {
          // Setup initial state in Firestore to preserve matching image balances
          const initPayload = {
            trialRemaining: 94804.47,
            trialOriginal: 94812.51,
            dialogflowRemaining: 56729.35,
            dialogflowOriginal: 56730.01,
            logs: [{
              id: "init",
              action: "Promo Credits Activated",
              model: "Billing Framework Setup",
              trialDeduction: 0,
              dfDeduction: 0,
              timestamp: Date.now()
            }],
            updatedAt: Date.now()
          };
          setDoc(docRef, initPayload).catch(() => {});
        }
      });
    } catch (e) {
      console.warn("Credits Firestore listen bypassed, using offline context:", e);
      // LocalStorage sync
      const stored = localStorage.getItem(`credits_${uid}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCredits(parsed.credits);
          setCreditLogs(parsed.logs || []);
        } catch (_) {}
      }
    }

    return () => unsubCredits();
  }, [user]);

  // Handle credits replenish
  const handleResetCredits = async () => {
    const uid = user ? user.uid : "guest_user";
    const resetVal = {
      trialRemaining: 94812.51,
      trialOriginal: 94812.51,
      dialogflowRemaining: 56730.01,
      dialogflowOriginal: 56730.01
    };
    const resetLog = {
      id: "res_" + Date.now(),
      action: "Replenished Full Balances",
      model: "Billing Dashboard Refill Tool",
      trialDeduction: 0,
      dfDeduction: 0,
      timestamp: Date.now()
    };
    const newLogs = [resetLog, ...creditLogs].slice(0, 50);

    setCredits(resetVal);
    setCreditLogs(newLogs);

    try {
      await setDoc(doc(db, "credits", uid), {
        ...resetVal,
        logs: newLogs,
        updatedAt: Date.now()
      });
    } catch (e) {
      localStorage.setItem(`credits_${uid}`, JSON.stringify({ credits: resetVal, logs: newLogs }));
    }
  };

  // Check and consume credits
  const onConsumeCredits = (actionName: string, modelUsed: string, trialCost: number, dfCost: number): boolean => {
    if (credits.trialRemaining < trialCost || credits.dialogflowRemaining < dfCost) {
      alert(`API Quota Exhausted! You need ₹${trialCost.toFixed(2)} Trial credits & ₹${dfCost.toFixed(2)} Dialogflow credits to run this request. Use the refill button in the quota panel in your top bar.`);
      return false;
    }

    const uid = user ? user.uid : "guest_user";
    const nextTrial = Math.max(0, credits.trialRemaining - trialCost);
    const nextDf = Math.max(0, credits.dialogflowRemaining - dfCost);
    
    const newLog = {
      id: "log_" + Date.now(),
      action: actionName,
      model: modelUsed,
      trialDeduction: trialCost,
      dfDeduction: dfCost,
      timestamp: Date.now()
    };
    const updatedCredits = {
      trialRemaining: nextTrial,
      trialOriginal: credits.trialOriginal,
      dialogflowRemaining: nextDf,
      dialogflowOriginal: credits.dialogflowOriginal
    };
    const nextLogs = [newLog, ...creditLogs].slice(0, 50);

    setCredits(updatedCredits);
    setCreditLogs(nextLogs);

    // Sync to Firestore
    setDoc(doc(db, "credits", uid), {
      ...updatedCredits,
      logs: nextLogs,
      updatedAt: Date.now()
    }).catch((err) => {
      console.warn("Storage write issue, carrying offline:", err);
      localStorage.setItem(`credits_${uid}`, JSON.stringify({ credits: updatedCredits, logs: nextLogs }));
    });

    return true;
  };

  // 2. Fetch shared tracks from Firebase Firestore
  useEffect(() => {
    try {
      const q = collection(db, "tracks");
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: Track[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Track);
        });
        // Sort newest first
        list.sort((a, b) => b.createdAt - a.createdAt);
        setTracks(list);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Could not query firestore shared tracks. Operating on local memory stack:", e);
      // Set solid template state
      setTracks([
        {
          id: "local_demo_1",
          userId: "admin",
          userName: "Srinivas Rao Inspired",
          title: "Vimana Silence",
          genre: "lofi",
          lyrics: "Silent streets, noisy minds. We speak through the keys. A pushpaka flight of melody...",
          chords: ["Am7", "Dm7", "G7", "Cmaj7"],
          createdAt: Date.now() - 3600000,
          likes: 8
        }
      ]);
    }
  }, []);

  // 3. User Google Trigger Login
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      if (res.user) {
        setUser({
          uid: res.user.uid,
          displayName: res.user.displayName || "Google Creator",
          email: res.user.email || ""
        });
      }
    } catch (e) {
      console.warn("Google popup blocked. Setting demo mode:", e);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
  };

  // 4. Transform Spoken / Conversational Text to Beautiful Song (APIs orchestration)
  const handleGenerateHarmony = async () => {
    if (!promptText.trim()) return;

    // Check & consume credits
    const hasCredits = onConsumeCredits(
      "Melody Composer Song Synthesis",
      "gemini-3.5-flash & gemini-3.1-flash-tts",
      2.50,
      1.15
    );
    if (!hasCredits) return;

    setIsGenerating(true);
    stopAllSynthesizers();
    setIsPlaybackActive(false);

    try {
      // Step A: Generate chords and dynamic arrangements sheets
      const chordsResponse = await fetch("/api/analyze-lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lyrics: promptText, genre: selectedGenre })
      });
      const chordData = await chordsResponse.json();

      let chordsList = ["C", "G", "Am", "F"];
      let arrangements = [];
      let suggestions = [];

      if (chordData.success) {
        chordsList = chordData.chords || chordsList;
        arrangements = chordData.arrangement || [];
        suggestions = chordData.suggestions || [];
      }

      // Step B: Generate vocal synthesis from text of speech via gemini-3.1-flash-tts-preview
      const ttsResponse = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: promptText, voice: "kore" })
      });
      const ttsData = await ttsResponse.json();

      if (ttsData.success && ttsData.audioBase64) {
        const audioBlobUrl = `data:audio/mp3;base64,${ttsData.audioBase64}`;
        setVocalAudioUrl(audioBlobUrl);
      } else {
        setVocalAudioUrl(null);
      }

      setLyricsResult(promptText);
      setChordsResult(chordsList);
      setArrangementResult(arrangements);
      setSuggestionsResult(suggestions);

      // Instantly start playing the newly generated preview track
      playChordProgression(chordsList[0], 2.2, selectedGenre);
      setIsPlaybackActive(true);

    } catch (error) {
      console.error("Failed model melody pipeline orchestration:", error);
      // Fallback
      setLyricsResult(promptText);
      setChordsResult(["C", "Am", "F", "G"]);
      setIsPlaybackActive(true);
    } finally {
      setIsGenerating(false);
    }
  };

  // Playback single shared library track
  const handleTogglePlayback = (track: Track) => {
    stopAllSynthesizers();
    if (activePlaybackTrack?.id === track.id && isPlaybackActive) {
      setIsPlaybackActive(false);
      setActivePlaybackTrack(null);
      return;
    }

    setActivePlaybackTrack(track);
    setIsPlaybackActive(true);
    
    // Cycle sequential chord progression loops
    const chs = track.chords || ["C", "Am", "F", "G"];
    playChordProgression(chs[0], 2.0, track.genre);
    setTimeout(() => {
      playChordProgression(chs[1] || chs[0], 2.0, track.genre);
    }, 1800);
  };

  // 5. Share creation on Firestore Public Tracks Board
  const handleShareOnFeed = async () => {
    if (!lyricsResult) return;

    const newTrackPayload = {
      userId: user?.uid || "guest_uid",
      userName: user?.displayName || "Creative Creator",
      title: `${selectedGenre.toUpperCase()} Conversation Song`,
      genre: selectedGenre,
      lyrics: lyricsResult,
      chords: chordsResult,
      arrangements: arrangementResult,
      suggestions: suggestionsResult,
      createdAt: Date.now(),
      likes: 0
    };

    try {
      await addDoc(collection(db, "tracks"), newTrackPayload);
      alert("Successfully shared song with Sing Geetham creator stream!");
    } catch (err) {
      console.warn("Shared on local heap:", err);
      setTracks((prev) => [{ id: "local_sh_" + Date.now(), ...newTrackPayload } as Track, ...prev]);
    }
  };

  // Like track
  const handleLikeTrack = async (track: Track) => {
    try {
      if (track.id.startsWith("local_")) {
         setTracks((prev) => prev.map((t) => t.id === track.id ? { ...t, likes: t.likes + 1 } : t));
         return;
      }
      const trackRef = doc(db, "tracks", track.id);
      await updateDoc(trackRef, { likes: track.likes + 1 });
    } catch (e) {
      setTracks((prev) => prev.map((t) => t.id === track.id ? { ...t, likes: t.likes + 1 } : t));
    }
  };

  // 6. Professional High Fidelity Chord & Lyric TXT sheets Exporter
  const handleExportTrackData = (trackName: string, chords: string[], lyricsContent: string) => {
    const formattedData = `----------------------------------------
SING GEETHAM - HIGH FIDELITY PRO SHEETS EXPORT
========================================
Track Title: ${trackName}
Tempo arranged: 120 Bpm
Homage: Singeetham Srinivasa Rao Legacy

CHORD SEQUENCE SHEET:
--------------------
[ ${chords.join("  →  ")} ]

LYRIC CHOREOGRAPHY CHANNELS:
---------------------------
${lyricsContent}

========================================
Exported via Sing Geetham Professional Music Workflow.
----------------------------------------`;

    const blob = new Blob([formattedData], { type: "text/plain;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", downloadUrl);
    downloadAnchor.setAttribute("download", `${trackName.toLowerCase().replace(/\s+/g, '_')}_pro_scores.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 font-sans leading-relaxed selection:bg-amber-500 selection:text-black">
      
      {/* Universal Top Nav and Brand Headings */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h1 id="brand_title" className="text-2xl font-serif italic text-amber-500 tracking-tight leading-none">
              Sing Geetham
            </h1>
            <span className="text-[10px] uppercase tracking-[0.2em] opacity-40 mt-1">A Tribute to Rao's Vision</span>
          </div>

          {/* Tab Navigation links */}
          <nav className="flex gap-2 flex-wrap justify-center">
            {[
              { id: "composer", label: "Melody Composer", icon: Sparkles },
              { id: "call_mock", label: "Seamless Calls Interface", icon: Tv },
              { id: "jam_lobby", label: "Co-Jam Lobby", icon: Radio },
              { id: "sound_packs", label: "Royalty-Free Sounds", icon: Music }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab_select_${tab.id}`}
                  aria-label={tab.label}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    stopAllSynthesizers();
                    setIsPlaybackActive(false);
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-amber-500 ${
                    isActive
                      ? "bg-amber-500 text-black border-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                      : "text-slate-400 border-white/5 bg-white/5 hover:border-amber-500/50 hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Sign-In Controls */}
          <div id="auth_portal_indicator" className="flex items-center gap-3">
            {/* Credit Billing Quota Manager Dashboard Link */}
            <CreditQuotaManager 
              credits={credits} 
              logs={creditLogs} 
              onResetCredits={handleResetCredits} 
            />

            {user ? (
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Creator:</span>
                <span className="text-xs font-bold text-slate-200 truncate max-w-[120px]">{user.displayName}</span>
                <button
                  id="sign_out_button"
                  aria-label="Sign Out"
                  onClick={handleSignOut}
                  className="p-1 text-slate-400 hover:text-red-400 transition ml-1 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-red-400 rounded-md"
                  title="Sign Out Session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="sign_in_button"
                onClick={handleGoogleLogin}
                className="bg-amber-500 hover:bg-amber-400 text-black text-xs px-4 py-2 rounded-full font-bold uppercase tracking-wider transition flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.3)] border border-amber-600 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>

        </div>
      </header>


      {/* Main Content Layout Container */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Dynamic active tabs container */}
        <section id="rendering_stage_workspace">
          {activeTab === "composer" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Input Prompt Vocal synth */}
              <div className="lg:col-span-7 space-y-6">
                
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4 shadow-2xl">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] uppercase tracking-widest text-amber-500 font-bold">Acoustic Conversational Script</span>
                    <span className="text-[10px] font-mono bg-white/5 text-slate-300 font-semibold px-2 py-0.5 rounded border border-white/10 uppercase tracking-widest">
                      Vocal Vocoder Synthesis
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium">
                    Type a dialogue, standard text, or sentence from a Whatsapp chat. We'll automatically synthesize spoken expression matched with chords.
                  </p>

                  <textarea
                    id="composer_dialogue_textarea"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Enter chat conversation, general words or spoken scripts..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs font-sans text-slate-200 outline-none focus:border-amber-500 leading-relaxed h-[130px] resize-none shadow-inner"
                  />

                  {/* Style/Genre selection */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-amber-500/80 uppercase tracking-widest block">Choose Genre Harmony</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {["pop", "jazz", "rock", "lofi", "classical"].map((genre) => (
                          <button
                            key={genre}
                            id={`gn_btn_${genre}`}
                            onClick={() => setSelectedGenre(genre as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border uppercase transition-all ${
                              selectedGenre === genre
                                ? "border-amber-500/40 bg-amber-500/10 text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                                : "border-white/10 bg-white/5 text-slate-400 hover:border-amber-500/50 hover:text-slate-100"
                            }`}
                          >
                            {genre}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      id="generate_sound_track_btn"
                      onClick={handleGenerateHarmony}
                      disabled={isGenerating}
                      className="bg-white text-black font-extrabold uppercase text-[11px] tracking-widest rounded-xl hover:bg-amber-500 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all px-6 py-3 shrink-0 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    >
                      {isGenerating ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          <span>Synthesizing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          <span>Generate Song Track</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Harmonized generated results scoreboard */}
                {lyricsResult && (
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/10 space-y-6 shadow-2xl">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div>
                        <span className="text-[11px] uppercase tracking-widest text-white/30 font-bold block mb-1">Rendered Musical Scores</span>
                        <h4 className="text-xl font-serif italic text-amber-500 leading-tight">Sing Geetham Synthesized Arrangement</h4>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        {/* Feed sharing */}
                        <button
                          id="export_shared_stream"
                          onClick={handleShareOnFeed}
                          className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Post to Feed</span>
                        </button>

                        {/* TXT Score Sheet Exporter */}
                        <button
                          id="btn_export_scores"
                          onClick={() => handleExportTrackData(`${selectedGenre.toUpperCase()} Conversational Score`, chordsResult, lyricsResult)}
                          className="flex items-center gap-1.5 bg-white hover:bg-amber-500 text-black text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export scores</span>
                        </button>
                      </div>
                    </div>

                    {/* Equalizer visuals */}
                    <div className="space-y-3 bg-black rounded-3xl border border-white/5 p-6 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent pointer-events-none"></div>
                      <div className="flex justify-between items-center text-[10px] text-white/40 font-mono uppercase tracking-wider relative z-10">
                        <span>Melodic Audio Waveform</span>
                        <span className="text-amber-500 font-bold shadow-amber-500">Live Expressive Sync</span>
                      </div>
                      
                      <div className="relative z-10">
                        <AudioVisualizer isPlaying={isPlaybackActive} color="#f59e0b" speed={1.1} />
                      </div>

                      {/* Manual trigger voice backup if tts generated */}
                      {vocalAudioUrl && (
                        <div className="flex justify-between items-center pt-2 relative z-10 border-t border-white/5">
                          <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Vocal Stem Available</span>
                          <button
                            id="play_synthesized_audio_btn"
                            onClick={() => {
                              const audio = new Audio(vocalAudioUrl);
                              audio.play();
                            }}
                            className="text-[10px] uppercase tracking-widest text-amber-500 font-bold flex items-center gap-1.5 hover:text-amber-400"
                          >
                            <Play className="w-3 h-3 fill-amber-500 text-amber-500" /> Play Vocal Synthesizer
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Lyric score blocks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left Block: Lyrics & Chords align */}
                      <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/5 space-y-4">
                        <span className="text-[11px] uppercase tracking-widest text-white/30 font-bold block">Harmonized Vowels</span>
                        <div className="flex gap-2 flex-wrap pb-3 border-b border-white/5">
                          {chordsResult.map((c, i) => (
                            <span key={i} className="text-xs font-mono font-bold px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded border border-amber-500/20">{c}</span>
                          ))}
                        </div>
                        <p className="text-xl font-serif text-slate-100 italic leading-relaxed whitespace-pre-wrap">
                          {lyricsResult}
                        </p>
                      </div>

                      {/* Right Block: Melodic structure mapping */}
                      <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/5 space-y-4">
                        <span className="text-[11px] uppercase tracking-widest text-white/30 font-bold block">Lyric Choreography Alignment</span>
                        
                        <div className="space-y-2 overflow-y-auto max-h-[160px] pr-1">
                          {arrangementResult.map((arr, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs bg-black/30 p-3 rounded-xl border border-white/5 hover:bg-white/5 transition-all">
                              <div>
                                <span className="font-bold text-amber-500 block text-xs">{arr.section}</span>
                                <span className="text-[10px] text-slate-400 block mt-1">chords: {arr.chords}</span>
                              </div>
                              <span className="text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-white/5 text-slate-300 border border-white/10">
                                {arr.intensity}
                              </span>
                            </div>
                          ))}

                          {arrangementResult.length === 0 && (
                            <div className="text-xs italic text-slate-400 py-6 text-center">
                              Choral progressions optimized automatically.
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

              </div>

              {/* Right Column: Homage section & Stream */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Public Shared Tracks Stream of Musics */}
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4 shadow-2xl">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[11px] uppercase tracking-widest text-amber-500 font-bold flex items-center gap-1.5 font-sans">
                      <Radio className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      Public Conversation Songs
                    </h3>
                    <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">Live Index</span>
                  </div>

                  <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                    {tracks.map((track) => (
                      <div
                        key={track.id}
                        className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3 hover:bg-white/5 transition-all duration-300"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="truncate">
                            <span className="font-bold text-sm text-slate-100 block truncate">{track.title}</span>
                            <span className="text-[10px] text-slate-400">Shared by: {track.userName}</span>
                          </div>

                          <span className="text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/25">
                            {track.genre}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 line-clamp-2 italic bg-black/40 p-3 rounded-lg border border-white/5 font-serif leading-relaxed">
                          "{track.lyrics}"
                        </p>

                        <div className="flex justify-between items-center pt-1.5 text-xs">
                          {/* Play simulated synth chords trigger */}
                          <button
                            id={`play_track_tgl_${track.id}`}
                            onClick={() => handleTogglePlayback(track)}
                            className="flex items-center gap-1.5 text-amber-500 hover:text-amber-400 font-bold uppercase text-[10px] tracking-widest transition-all"
                          >
                            {activePlaybackTrack?.id === track.id && isPlaybackActive ? (
                              <>
                                <Square className="w-3 h-3 fill-amber-500 text-amber-500" />
                                <span>Stop Chords</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 fill-amber-500 text-amber-500" />
                                <span>Audition Chords</span>
                              </>
                            )}
                          </button>

                          <div className="flex items-center gap-3">
                            {/* Like trigger */}
                            <button
                              id={`like_track_${track.id}`}
                              onClick={() => handleLikeTrack(track)}
                              className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition-all font-bold"
                            >
                              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                              <span>{track.likes || 0}</span>
                            </button>

                            {/* Scores export from feed */}
                            <button
                              id={`dl_track_score_${track.id}`}
                              onClick={() => handleExportTrackData(track.title, track.chords || ["C", "F"], track.lyrics)}
                              className="text-slate-400 hover:text-slate-200 transition"
                              title="Download Chord Progression Sheet"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {tracks.length === 0 && (
                      <div className="text-xs italic text-gray-400 text-center py-6">
                        No shared tracks available on the cloud index. Create the first masterpiece!
                      </div>
                    )}
                  </div>
                </div>

                {/* Director Homage Block Special Portfolio */}
                <div id="homage_director_banner" className="bg-gradient-to-br from-black/40 to-white/[0.02] p-6 rounded-2xl border border-white/10 space-y-4 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-amber-500" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-amber-500">Singeetham Srinivasa Rao Tribute</h4>
                      <p className="text-[10px] text-slate-400 font-mono">Celebrating the Film Wizard of India</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    This software is created to pay deep homage to the legendary director **Singeetham Srinivasa Rao** (referred to in local movie lore as the visionary who made movie standard 'Singeetham'). He beautifully integrated dialogue-free silence, whimsical synthesized loops, and genre-defying science fiction.
                  </p>

                  <div className="space-y-3 border-t border-white/10 pt-4">
                    {moviesTribute.map((movie, index) => (
                      <div key={index} className="flex gap-3 items-start text-xs">
                        <span className="text-lg bg-white/5 p-1.5 rounded-lg border border-white/10">{movie.logo}</span>
                        <div>
                          <span className="font-bold text-slate-200">{movie.title} ({movie.year})</span>
                          <p className="text-[10.5px] text-slate-400 leading-relaxed mt-0.5">{movie.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl text-xs text-amber-500/90 flex items-start gap-2.5 leading-relaxed">
                    <BookOpen className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Selected chords and ambient sounds dynamically align to reflect his film score philosophy.</span>
                  </div>
                </div>

              </div>
              
            </div>
          )}

          {activeTab === "call_mock" && <InteractiveCallMock onConsumeCredits={onConsumeCredits} />}
          {activeTab === "jam_lobby" && <LiveSessionJam currentUser={user} />}
          {activeTab === "sound_packs" && <SoundPackLibrary />}
        </section>

      </main>

      {/* Universal Sticky Global Homage Footer */}
      <footer className="border-t border-white/10 bg-black/60 py-8 text-center text-xs text-slate-400 font-sans mt-12 backdrop-blur-md">
        <p className="font-semibold tracking-wide">© 2026 Sing Geetham Studio. Built in deep artistic respect for Singeetham Srinivasa Rao.</p>
        <p className="text-[10px] text-slate-500 mt-2 font-mono">Vocal Synthesis preview model: models/gemini-3.1-flash-tts-preview</p>
      </footer>

    </div>
  );
}
