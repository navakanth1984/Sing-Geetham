import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, addDoc, updateDoc, doc, arrayUnion } from "firebase/firestore";
import { JamSession } from "../types";
import { Users, Plus, Send, Zap, Volume2, VolumeX, Radio, Sparkles } from "lucide-react";
import { startRhythmEngine, stopAllSynthesizers } from "../utils/audioEngine";

interface LiveSessionJamProps {
  currentUser: { uid: string; displayName: string } | null;
}

export default function LiveSessionJam({ currentUser }: LiveSessionJamProps) {
  const [sessions, setSessions] = useState<JamSession[]>([]);
  const [activeSession, setActiveSession] = useState<JamSession | null>(null);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [newSessionGenre, setNewSessionGenre] = useState("pop");
  const [chatMessage, setChatMessage] = useState("");
  const [isSynthesizerLooping, setIsSynthesizerLooping] = useState(false);

  // Fallback state if database has no entries yet or is unavailable
  const fallbackSession: JamSession = {
    id: "local_homage_jam",
    title: "Pushpaka Silent Melody Jam",
    creatorId: "system",
    creatorName: "Singeetham Legacy",
    genre: "lofi",
    peersCount: 4,
    lyrics: "In the quiet of a midnight flight, we write our song without a word...",
    chords: ["Am", "F", "C", "G"],
    messages: [
      { id: "1", userId: "sim1", userName: "Srinivas Rao", text: "Welcome creators! Let's build a synchronized jam.", timestamp: Date.now() - 3000 }
    ],
    createdAt: Date.now(),
    isActive: true
  };

  // 1. Listen for active jams on firestore
  useEffect(() => {
    try {
      const q = collection(db, "jams");
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: JamSession[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as any);
        });
        setSessions(list);
        
        // Auto select first session or update active session
        if (list.length > 0) {
          if (activeSession) {
            const found = list.find((s) => s.id === activeSession.id);
            if (found) setActiveSession(found);
          } else {
            setActiveSession(list[0]);
          }
        } else {
          setActiveSession(fallbackSession);
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("DB subscription failed; switching to live state simulate.", e);
      setSessions([fallbackSession]);
      setActiveSession(fallbackSession);
    }
  }, [activeSession?.id]);

  // Handle playing local synth drum & keyboard loops for active session parameters
  useEffect(() => {
    if (isSynthesizerLooping && activeSession) {
      const bpm = activeSession.genre === "lofi" ? 80 : activeSession.genre === "jazz" ? 95 : 120;
      startRhythmEngine(activeSession.genre as any, bpm, activeSession.chords || ["C", "Am", "F", "G"]);
    } else {
      stopAllSynthesizers();
    }
    return () => {
      stopAllSynthesizers();
    };
  }, [isSynthesizerLooping, activeSession?.genre, activeSession?.chords]);

  // 2. Create a new digital Jam Lobby
  const handleCreateSession = async () => {
    if (!newSessionTitle.trim()) return;

    const chordsTemplates: { [key: string]: string[] } = {
      pop: ["C", "G", "Am", "F"],
      jazz: ["Cmaj7", "Dm7", "Em7", "A9"],
      rock: ["E5", "G5", "A5", "E5"],
      lofi: ["Am7", "Dm7", "G7", "Cmaj7"],
      classical: ["C", "F", "G", "C"]
    };

    const sessionPayload = {
      title: newSessionTitle,
      creatorId: currentUser?.uid || "anonymous_user",
      creatorName: currentUser?.displayName || "Anonymous Creator",
      genre: newSessionGenre,
      peersCount: 1,
      lyrics: "Start writing collaborative lyrics here...",
      chords: chordsTemplates[newSessionGenre] || ["C", "G", "Am", "F"],
      messages: [],
      createdAt: Date.now(),
      isActive: true
    };

    try {
      const docRef = await addDoc(collection(db, "jams"), sessionPayload);
      setNewSessionTitle("");
      console.log("Jam session structured on cloud path:", docRef.id);
    } catch (e) {
      console.warn("Local demo create fallback:", e);
      const simulated = { ...sessionPayload, id: "local_sim_" + Date.now() };
      setSessions((prev) => [simulated, ...prev]);
      setActiveSession(simulated);
      setNewSessionTitle("");
    }
  };

  // 3. Update Sync Chords / Lyrics
  const handleUpdateNotes = async (newLyrics: string) => {
    if (!activeSession) return;
    try {
      if (activeSession.id.startsWith("local_")) {
        setActiveSession((prev) => prev ? { ...prev, lyrics: newLyrics } : null);
        return;
      }
      const sessionRef = doc(db, "jams", activeSession.id);
      await updateDoc(sessionRef, { lyrics: newLyrics });
    } catch (err) {
      setActiveSession((prev) => prev ? { ...prev, lyrics: newLyrics } : null);
    }
  };

  // 4. Send live commentary and chord triggers
  const handleSendLiveMessage = async () => {
    if (!chatMessage.trim() || !activeSession) return;

    const newMessage = {
      id: "msg_" + Date.now(),
      userId: currentUser?.uid || "anonymous_user",
      userName: currentUser?.displayName || "Anonymous Creator",
      text: chatMessage,
      timestamp: Date.now()
    };

    try {
      if (activeSession.id.startsWith("local_")) {
        setActiveSession((prev) => prev ? { ...prev, messages: [...prev.messages, newMessage] } : null);
        setChatMessage("");
        return;
      }
      const sessionRef = doc(db, "jams", activeSession.id);
      await updateDoc(sessionRef, {
        messages: arrayUnion(newMessage)
      });
      setChatMessage("");
    } catch (err) {
      setActiveSession((prev) => prev ? { ...prev, messages: [...prev.messages, newMessage] } : null);
      setChatMessage("");
    }
  };

  const currentThemeColor = 
    activeSession?.genre === "lofi" ? "#a855f7" : 
    activeSession?.genre === "jazz" ? "#f59e0b" : 
    activeSession?.genre === "rock" ? "#ef4444" : "#10b981";

  return (
    <div className="bg-white/5 p-8 rounded-3xl border border-white/10 flex flex-col gap-6 text-slate-200 shadow-2xl">
      
      {/* Session Title Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <Radio className="w-5 h-5 text-amber-500 animate-pulse" />
          <div>
            <h3 className="text-xl font-serif italic text-amber-500">Collaborative Jam Lobby</h3>
            <p className="text-xs text-slate-400 mt-1">Join a remote session, compose synchronized sheets & trigger real-time beats.</p>
          </div>
        </div>

        {/* Toggle Backing Synth Loop */}
        {activeSession && (
          <button
            id="toggle_jam_playback"
            onClick={() => setIsSynthesizerLooping(!isSynthesizerLooping)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all shadow-lg ${
              isSynthesizerLooping 
                ? "bg-amber-500/15 text-amber-500 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]" 
                : "bg-black/30 text-slate-400 border-white/10 hover:bg-white/5"
            }`}
          >
            {isSynthesizerLooping ? <Volume2 className="w-4 h-4 text-amber-500" /> : <VolumeX className="w-4 h-4" />}
            <span>{isSynthesizerLooping ? "Mute Jam Beat" : "Audition Jam Beat"}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Jams lobby and join menu */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white/5 p-5 rounded-2xl border border-white/10 shadow-xl">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5 mb-4">
              <Plus className="w-3.5 h-3.5 text-amber-500" />
              Launch Jam Room
            </h4>
            
            <div className="space-y-3">
              <input
                id="jam_input_title"
                type="text"
                aria-label="Jam session title"
                placeholder="Give it an upbeat title..."
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-amber-500 font-medium"
              />

              <div className="flex gap-2">
                <select
                  id="jam_select_genre"
                  aria-label="Jam session genre"
                  value={newSessionGenre}
                  onChange={(e) => setNewSessionGenre(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-amber-500 flex-1 font-bold"
                >
                  <option value="pop">Pop Dance</option>
                  <option value="jazz">Lively Jazz</option>
                  <option value="lofi">Mellow Lofi</option>
                  <option value="rock">Acoustic Rock</option>
                  <option value="classical">Indian Classical</option>
                </select>

                <button
                  id="btn_create_jam_room"
                  onClick={handleCreateSession}
                  className="bg-white hover:bg-amber-500 text-black font-extrabold text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg transition duration-300"
                >
                  Create
                </button>
              </div>
            </div>
          </div>

          {/* Active List */}
          <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] block mb-1">Active Jams Index</span>
            {sessions.map((session) => (
              <button
                key={session.id}
                id={`jam_entry_${session.id}`}
                onClick={() => setActiveSession(session)}
                className={`w-full text-left p-4 rounded-xl border transition duration-300 ${
                  activeSession?.id === session.id
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.15)] font-bold"
                    : "bg-black/20 border-white/5 hover:border-amber-500/40"
                }`}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold block truncate max-w-[130px]">{session.title}</span>
                  <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                    {session.genre}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mt-2.5 text-[10px] text-slate-400">
                  <span className="truncate">By: {session.creatorName}</span>
                  <span className="flex items-center gap-1 font-bold">
                    <Users className="w-3 h-3 text-amber-500" />
                    {session.peersCount || 1} online
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Middle column: Collaborative lyrics and track progress */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          {activeSession ? (
            <div className="bg-black/40 p-6 rounded-2xl border border-white/10 flex flex-col justify-between min-h-[360px] shadow-inner">
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="text-base font-serif italic text-amber-500">{activeSession.title}</h4>
                    <p className="text-[11px] text-slate-400">Choreographed live by creators • genre: <span className="text-amber-500 font-mono font-bold uppercase">{activeSession.genre}</span></p>
                  </div>

                  {/* Chord Sheets Tag */}
                  <div className="flex gap-1.5 flex-wrap">
                    {(activeSession.chords || []).map((chord, index) => (
                      <span
                        key={index}
                        className="text-[10px] font-bold font-mono px-2.5 py-1 rounded bg-white/5 border border-white/10 text-amber-500 uppercase"
                      >
                        {chord}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Cooperative Lyric Pad */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex justify-between">
                    <span>Collaborative Lyrics Pad (Auto Syncs on Cloud)</span>
                    <span className="text-amber-500 flex items-center gap-0.5"><Sparkles className="w-3 h-3"/> real-time</span>
                  </label>
                  <textarea
                    id="collab_lyrics_input"
                    value={activeSession.lyrics}
                    onChange={(e) => handleUpdateNotes(e.target.value)}
                    placeholder="Contribute lyrics and words directly..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-slate-100 h-[110px] outline-none focus:border-amber-500 leading-relaxed font-sans resize-none font-medium"
                  />
                </div>
              </div>

              {/* Chat feedback feed */}
              <div className="border-t border-white/10 pt-4 mt-4 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Live Jam Feed Messages</span>
                
                <div className="space-y-2 max-h-[105px] overflow-y-auto pr-1">
                  {(activeSession.messages || []).length === 0 ? (
                    <div className="text-[11px] italic text-slate-400/80">No active messages. Be the first to shout out chords!</div>
                  ) : (
                    (activeSession.messages || []).map((msg) => (
                      <div key={msg.id} className="text-xs bg-black/20 rounded-xl px-3.5 py-2 border border-white/5">
                        <span className="font-bold text-amber-500 mr-2">{msg.userName}:</span>
                        <span className="text-slate-300 font-sans">{msg.text}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    id="jam_chat_msg"
                    type="text"
                    aria-label="Chat message"
                    placeholder="Suggest a beat, tell peers to trigger chorus..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendLiveMessage()}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-amber-500 font-medium"
                  />
                  <button
                    id="jam_btn_send_chat"
                    onClick={handleSendLiveMessage}
                    aria-label="Send message"
                    className="bg-white hover:bg-amber-500 text-black p-2.5 rounded-lg transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0A0A0B]"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[360px] text-xs text-slate-400 italic">
              Select or launch a Jam session from the catalog to start remote collaborating.
            </div>
          )}
        </div>

      </div>

    </div>

  );
}
