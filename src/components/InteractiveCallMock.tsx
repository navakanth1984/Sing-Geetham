import React, { useState, useEffect } from "react";
import { 
  Phone, PhoneOff, Mic, MicOff, MessageSquare, ToggleLeft, ToggleRight, 
  Music, Volume2, Sparkles, Upload, FileAudio, FileVideo, RefreshCw, Layers
} from "lucide-react";
import { playChordProgression, stopAllSynthesizers } from "../utils/audioEngine";
import { AudioVisualizer } from "./AudioVisualizer";

interface InteractiveCallMockProps {
  onConsumeCredits: (actionName: string, modelUsed: string, trialCost: number, dfCost: number) => boolean;
}

export default function InteractiveCallMock({ onConsumeCredits }: InteractiveCallMockProps) {
  const [activePlatform, setActivePlatform] = useState<"whatsapp" | "teams" | "instagram" | "youtube" | "general">("whatsapp");
  const [isCallActive, setIsCallActive] = useState(false);
  const [isSingingMode, setIsSingingMode] = useState(true); // Toggle speaking vs singing
  const [callTime, setCallTime] = useState(0);
  const [inputText, setInputText] = useState("We both had pizza for lunch under the heavy rain, and then we wrote songs.");
  const [renderedLyrics, setRenderedLyrics] = useState("");
  const [renderedChords, setRenderedChords] = useState<string[]>(["Am", "F", "C", "G"]);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceSynthesisBase64, setVoiceSynthesisBase64] = useState<string | null>(null);
  
  // Media extraction states
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<"audio" | "video" | null>(null);

  // Playback state
  const [isSynthPlaying, setIsSynthPlaying] = useState(false);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallTime((prev) => prev + 1);
      }, 1000);
    } else {
      setCallTime(0);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  // Convert seconds to MM:SS format
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };

  // Turn words to lyrics and chords: triggers our API routes!
  const convertConversationToSong = async (textToProcess = inputText) => {
    if (!textToProcess.trim()) return;

    // Check & consume credits
    const hasCredits = onConsumeCredits(
      `Call Mock Song synthesis (${activePlatform.toUpperCase()})`,
      "gemini-3.5-flash & gemini-3.1-flash-tts",
      2.50,
      1.15
    );
    if (!hasCredits) return;

    setIsLoading(true);
    setVoiceSynthesisBase64(null);

    try {
      // 1. Analyze lyrics and generate elegant chord sheet
      const chordsResponse = await fetch("/api/analyze-lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lyrics: textToProcess, genre: activePlatform === "instagram" ? "pop" : "jazz" })
      });
      const chordData = await chordsResponse.json();
      
      if (chordData.success && chordData.chords) {
        setRenderedChords(chordData.chords);
      }

      // 2. TTS expressively using gemini-3.1-flash-tts-preview
      const ttsResponse = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToProcess, voice: "kore" })
      });
      const ttsData = await ttsResponse.json();

      if (ttsData.success && ttsData.audioBase64) {
        setVoiceSynthesisBase64(ttsData.audioBase64);
        setRenderedLyrics(textToProcess);
        
        // Play vocal synthesis on screen!
        setIsSynthPlaying(true);
        // Play procedural background chords aligned
        if (chordData.chords && chordData.chords.length > 0) {
          playChordProgression(chordData.chords[0], 2.5);
          setTimeout(() => {
            if (chordData.chords[1]) playChordProgression(chordData.chords[1], 2.5);
          }, 2000);
        }
      } else {
        // Fallback simulation
        setRenderedLyrics(textToProcess);
        setRenderedChords(chordData.chords || ["C", "Am", "F", "G"]);
        setIsSynthPlaying(true);
        playChordProgression("C", 2.0);
        setTimeout(() => playChordProgression("Am", 2.0), 2000);
      }
    } catch (e) {
      console.warn("Conversion failed - falling back to browser synthesis:", e);
      // Fallback
      setRenderedLyrics(textToProcess);
      setRenderedChords(["C", "F", "G", "C"]);
      setIsSynthPlaying(true);
      playChordProgression("C", 2.0);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle uploaded audio/video file and extract speech to lyric convert
  const handleMediaUploadAndTranscribe = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check & consume credits
    const hasCredits = onConsumeCredits(
      `Extract speech from media (${file.name})`,
      "gemini-3.5-flash",
      1.50,
      3.20
    );
    if (!hasCredits) return;

    setMediaFile(file);
    const isVid = file.type.includes("video");
    setMediaType(isVid ? "video" : "audio");
    setIsLoading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(",")[1];
        
        const response = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileData: base64Data,
            mimeType: file.type
          })
        });

        const data = await response.json();
        if (data.success && data.transcription) {
          setInputText(data.transcription);
          convertConversationToSong(data.transcription);
        } else {
          // Mock transcription fallback
          const mockTrans = "Hey, did you hear that beautiful rhythm singing out from Sing Geetham?";
          setInputText(mockTrans);
          convertConversationToSong(mockTrans);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn("Transcription failed, simulating text:", err);
      setIsLoading(false);
    }
  };

  const handleToggleCall = () => {
    if (isCallActive) {
      stopAllSynthesizers();
      setIsSynthPlaying(false);
      setIsCallActive(false);
    } else {
      setIsCallActive(true);
      // Instantly start rendering song if in singing mode
      if (isSingingMode) {
        convertConversationToSong();
      }
    }
  };

  // Play audio voice if available (decodes pcm / wav base64 via audioctx)
  const speakSynthesisAudio = () => {
    if (!voiceSynthesisBase64) return;
    try {
      const binaryString = window.atob(voiceSynthesisBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtx.decodeAudioData(bytes.buffer, (buffer) => {
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start(0);
      });
    } catch(err) {
      // client-side speech synthesiser fallback if ctx decoding fails
      const utterance = new SpeechSynthesisUtterance(renderedLyrics);
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (isSynthPlaying && voiceSynthesisBase64) {
      speakSynthesisAudio();
    }
  }, [isSynthPlaying, voiceSynthesisBase64]);

  return (
    <div id="call_mock_layout_section" className="grid grid-cols-1 md:grid-cols-5 gap-6 text-slate-200">
      
      {/* Platform & Flow Selector Panel */}
      <div className="md:col-span-2 space-y-4">
        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 shadow-xl">
          <h4 className="text-[11px] uppercase tracking-widest text-amber-500 font-bold mb-4 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            Integrate Sing Geetham Calls
          </h4>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { id: "whatsapp", label: "WhatsApp Chat" },
              { id: "teams", label: "Teams Call" },
              { id: "instagram", label: "Instagram Reels" },
              { id: "youtube", label: "YouTube Audios" },
              { id: "general", label: "General Mic Call" }
            ].map((p) => (
              <button
                key={p.id}
                id={`plat_btn_${p.id}`}
                onClick={() => setActivePlatform(p.id as any)}
                className={`py-2 px-3 rounded-lg border text-left font-bold transition-all ${
                  activePlatform === p.id
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                    : "bg-black/30 border-white/5 text-slate-300 hover:border-amber-500/40 hover:text-slate-100"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="border-t border-white/10 pt-3 mt-4 text-[11px] text-slate-400 leading-relaxed font-medium">
            <span>Seamlessly toggle conversation back and forth. Converting phone speaking to harmonized tracks during voice calls.</span>
          </div>
        </div>

        {/* Media Upload (Extract Audio/Video speech) */}
        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 shadow-xl space-y-3">
          <h4 className="text-[11px] uppercase tracking-widest text-amber-500 font-bold flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-amber-500" />
            Extract Speech from Files
          </h4>
          
          <p className="text-xs text-slate-400 leading-relaxed">
            Share audio or video recordings. Our system extracts spoken vowels and maps them with a rhythm backing.
          </p>

          <label className="flex flex-col items-center justify-center p-5 border border-dashed border-white/10 hover:border-amber-500/50 rounded-xl cursor-pointer bg-black/40 hover:bg-white/5 transition-all">
            <input 
              id="file_speech_extractor"
              type="file" 
              accept="audio/*,video/*" 
              className="hidden" 
              onChange={handleMediaUploadAndTranscribe}
            />
            {mediaFile ? (
              <div className="text-center">
                {mediaType === "video" ? <FileVideo className="w-5 h-5 text-amber-500 mx-auto" /> : <FileAudio className="w-5 h-5 text-amber-500 mx-auto" />}
                <span className="text-xs mt-1 block max-w-[150px] truncate text-amber-400 font-bold">{mediaFile.name}</span>
              </div>
            ) : (
              <div className="text-center text-xs text-slate-400">
                <FileAudio className="w-6 h-6 text-slate-500 mx-auto mb-1.5" />
                <span>Choose Audio/Video File</span>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Main Simulated Calling Interface */}
      <div className="md:col-span-3 bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col justify-between min-h-[380px] shadow-2xl relative overflow-hidden">
        
        {/* Visual Pulse Header */}
        <div className="flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isCallActive ? "bg-red-500 animate-pulse" : "bg-white/20"}`} />
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">
              {isCallActive ? `${activePlatform.toUpperCase()} LIVE CALL` : "IDLE STATE"}
            </span>
          </div>

          {isCallActive && (
            <span className="text-xs font-mono font-bold text-slate-300 tracking-wider">
              {formatTime(callTime)}
            </span>
          )}
        </div>

        {/* Center Canvas display for interactive dialogue and lyrics */}
        <div className="my-5 space-y-4 z-10">
          {isCallActive ? (
            <div className="space-y-4">
              {/* Animated Speaking indicator & toggle mode */}
              <div className="flex items-center justify-between bg-white/[0.03] px-4 py-2.5 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-amber-500 animate-bounce" />
                  <span className="text-xs text-slate-300 font-bold">
                    {isSingingMode ? "Singing Mode Active (GeethamMode)" : "Speaking Mode Active (SprechMode)"}
                  </span>
                </div>

                {/* Seamless toggle switch */}
                <button
                  id="toggle_speak_sing_mode"
                  onClick={() => {
                     setIsSingingMode(!isSingingMode);
                     if (!isSingingMode) {
                       convertConversationToSong(); // Convert when singing mode clicked
                     } else {
                       stopAllSynthesizers();
                       setIsSynthPlaying(false);
                     }
                  }}
                  className="flex items-center gap-1.5 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                  title="Seamless Toggle Speaking/Singing"
                  aria-label="Seamless Toggle Speaking/Singing"
                >
                  {isSingingMode ? (
                    <ToggleRight className="w-8 h-8 text-amber-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-500" />
                  )}
                </button>
              </div>

              {/* Dynamic conversion board */}
              {isSingingMode ? (
                <div className="bg-[#0A0A0B] p-5 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] uppercase tracking-widest text-amber-500 font-bold">Live Voice to Lyrics:</span>
                    <span className="text-[9px] uppercase font-bold tracking-widest bg-white/5 px-2 py-0.5 rounded text-amber-500 border border-amber-500/20">Lyria Arrangements</span>
                  </div>
                  
                  {renderedLyrics ? (
                    <p className="text-lg italic text-slate-100 leading-relaxed font-serif">
                      "{renderedLyrics}"
                    </p>
                  ) : (
                    <p className="text-xs italic text-slate-400">
                      Generating vocal chord alignment... Try entering details in the prompt box below!
                    </p>
                  )}

                  {/* Chord Sheets representation */}
                  <div className="flex gap-1.5 pt-2 border-t border-white/5 overflow-x-auto">
                    {renderedChords.map((chord, index) => (
                      <span
                        key={index}
                        className="text-[10px] font-bold font-mono px-2.5 py-1 rounded bg-white/5 text-amber-500 border border-amber-500/20 uppercase"
                      >
                        {chord}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-black/30 p-5 rounded-2xl border border-white/5 min-h-[105px] flex items-center justify-center text-xs text-slate-400 italic font-medium">
                  Normal talking call enabled without melody synthesis. Words are displayed as standard subtitles.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Phone className="w-12 h-12 text-slate-600 mx-auto animate-pulse mb-3" />
              <p className="text-xs text-slate-400 font-sans max-w-sm mx-auto leading-relaxed">No call connected. Set your conversation text script below and tap Connect to start.</p>
            </div>
          )}

          {/* Prompt/Dialogue Script Box */}
          <div className="space-y-1.5 z-10">
            <span className="text-[11px] uppercase font-bold text-amber-500/80 block tracking-widest">Type Spoken Words / Lyrics</span>
            <div className="flex gap-2">
              <input
                id="call_mock_text_prompt"
                type="text"
                placeholder="Say something to align with instrumental chords automatically..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 text-xs px-3 py-2.5 rounded-lg outline-none text-slate-100 font-medium focus:border-amber-500"
              />
              {isCallActive && isSingingMode && (
                <button
                  id="reprocess_call_song"
                  onClick={() => convertConversationToSong()}
                  disabled={isLoading}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 p-2.5 rounded-lg text-amber-500 transition flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  title="Resynthesize Melody"
                  aria-label="Resynthesize Melody"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Responsive Equalizer and Controls */}
        <div className="space-y-4 z-10 pt-4 border-t border-white/10">
          <AudioVisualizer isPlaying={isCallActive && isSynthPlaying} color={isSingingMode ? "#f59e0b" : "#38bdf8"} speed={1.3} />

          {/* Action Dial Button Controls */}
          <div className="flex justify-center items-center gap-4 pt-1">
            <button
              id="call_toggle_btn"
              onClick={handleToggleCall}
              className={`p-4 rounded-full transition-all shadow-xl flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                isCallActive 
                  ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20" 
                  : "bg-amber-500 hover:bg-amber-400 text-black font-extrabold shadow-amber-500/20 duration-300 transform hover:scale-105"
              }`}
              title={isCallActive ? "End Call" : "Start Call"}
              aria-label={isCallActive ? "End Call" : "Start Call"}
            >
              {isCallActive ? <PhoneOff className="w-5 h-5 font-bold" /> : <Phone className="w-5 h-5 font-bold" />}
            </button>
          </div>
        </div>

        {/* Ambient watermark */}
        <span className="absolute bottom-2 right-3 text-[9px] font-mono font-bold text-white/10 uppercase tracking-[0.2em] select-none pointer-events-none">
          Sing Geetham Calling Port
        </span>
      </div>

    </div>
  );
}
