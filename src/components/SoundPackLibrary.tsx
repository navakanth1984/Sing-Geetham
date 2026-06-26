import { useState } from "react";
import { SOUND_PACKS } from "../utils/soundPacks";
import { SoundPack } from "../types";
import { Music, Play, Square, Download, Sparkles, AudioLines } from "lucide-react";
import { playChordProgression, stopAllSynthesizers } from "../utils/audioEngine";

export default function SoundPackLibrary() {
  const [activePack, setActivePack] = useState<SoundPack>(SOUND_PACKS[0]);
  const [playingStemId, setPlayingStemId] = useState<string | null>(null);

  const handleAuditionStem = (stemName: string, frequency: number, packGenre: any) => {
    stopAllSynthesizers();
    if (playingStemId === stemName) {
      setPlayingStemId(null);
      return;
    }
    
    setPlayingStemId(stemName);
    
    // Play a procedurally simulated synth chord / sweep
    // Map frequency to chord note names for the sound engine
    const chordOptions = ["C", "F", "G", "Am"];
    const randomChord = chordOptions[Math.floor(Math.random() * chordOptions.length)];
    playChordProgression(randomChord, 1.8, packGenre);

    setTimeout(() => {
      setPlayingStemId(null);
    }, 1800);
  };

  const handleDownloadPack = (pack: SoundPack) => {
    // Generate a simple configuration payload as a file download for producers "sound_pack.json"
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pack, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sing_geetham_${pack.id}_soundpack.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div id="sound_pack_system_section" className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/5 p-8 rounded-3xl border border-white/10 text-slate-200 shadow-2xl">
      
      {/* Soundpack Catalog List */}
      <div className="md:col-span-1 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Music className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-serif italic text-amber-500">Royalty-Free Sound Packs</h3>
        </div>
        
        {SOUND_PACKS.map((pack) => (
          <button
            key={pack.id}
            id={`pack_btn_${pack.id}`}
            onClick={() => setActivePack(pack)}
            className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${
              activePack.id === pack.id
                ? "bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.15)] font-bold"
                : "bg-black/30 border-white/5 text-slate-400 hover:border-amber-500/40 hover:text-slate-100"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm block truncate pr-2">{pack.name}</span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                {pack.genre}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 line-clamp-1">{pack.description}</p>
          </button>
        ))}

        <div className="mt-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-500/90 leading-relaxed font-sans">
          <Sparkles className="w-4 h-4 inline mr-1.5 text-amber-500" />
          <span>Each sound pack includes dedicated melodic oscillators and procedural synthesizer stems optimized for DAWs.</span>
        </div>
      </div>

      {/* Selected Pack Audition Interface */}
      <div className="md:col-span-2 space-y-5 bg-black/40 p-6 rounded-2xl border border-white/10 flex flex-col justify-between shadow-inner">
        <div>
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest block mb-1">Active Pack Preview</span>
              <h4 className="text-xl font-serif italic text-amber-500 mt-0.5">{activePack.name}</h4>
              <p className="text-xs text-slate-400 font-mono mt-1">Engineered by: {activePack.creator}</p>
            </div>
            
            <button
              id={`dl_pack_${activePack.id}`}
              onClick={() => handleDownloadPack(activePack)}
              className="flex items-center gap-1.5 bg-white hover:bg-amber-500 text-black text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl transition duration-300 transform hover:scale-[1.02]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Stem Data</span>
            </button>
          </div>

          <p className="text-xs text-slate-300 mt-4 bg-white/[0.02] p-4 rounded-xl border border-white/5 leading-relaxed font-sans">
            {activePack.description}
          </p>

          <h5 className="text-[11px] font-bold text-amber-500/80 uppercase tracking-widest mt-6 mb-3 flex items-center gap-1.5">
            <AudioLines className="w-3.5 h-3.5 text-amber-500" />
            Stems & Chord Loops
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activePack.stems.map((stem) => {
              const isPlaying = playingStemId === stem.name;
              return (
                <div
                  key={stem.name}
                  className="flex justify-between items-center bg-black/20 hover:bg-white/5 p-3 rounded-xl border border-white/5 transition duration-300"
                >
                  <div className="truncate pr-2">
                    <span className="text-xs font-bold text-slate-200 block truncate">{stem.name}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase bg-white/5 px-2 py-0.5 rounded border border-white/10 inline-block mt-1.5 tracking-wider">
                      {stem.type} • {stem.notes}
                    </span>
                  </div>

                  <button
                    id={`audition_stem_${stem.name.replace(/\s+/g, '')}`}
                    aria-label={isPlaying ? `Stop ${stem.name}` : `Play ${stem.name}`}
                    onClick={() => handleAuditionStem(stem.name, stem.frequencyConfig[0], activePack.genre)}
                    className={`p-2 rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                      isPlaying 
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" 
                        : "bg-white/5 hover:bg-white/10 text-amber-500 border border-white/10"
                    }`}
                  >
                    {isPlaying ? <Square className="w-4 h-4 fill-amber-500 text-amber-500" /> : <Play className="w-4 h-4 fill-amber-500 text-amber-500" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tribute Quote / Director Credit */}
        <div className="border-t border-white/10 pt-4 mt-6 flex items-center gap-3 text-xs text-slate-400">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold border border-amber-500/25 shrink-0 select-none">
            S
          </div>
          <p className="italic leading-relaxed font-sans">
            "Singeetham Srinivasa Rao revolutionized dynamic filmmaking. This palette honors his beautiful integration of melody and silence in Pushpaka Vimanam."
          </p>
        </div>
      </div>

    </div>

  );
}
