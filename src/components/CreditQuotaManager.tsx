import { useState } from "react";
import { 
  ShieldCheck, RefreshCw, History, Info, AlertTriangle
} from "lucide-react";

export interface TransactionLog {
  id: string;
  action: string;
  model: string;
  trialDeduction: number;
  dfDeduction: number;
  timestamp: number;
}

export interface CreditState {
  trialRemaining: number;
  trialOriginal: number;
  dialogflowRemaining: number;
  dialogflowOriginal: number;
}

interface CreditQuotaManagerProps {
  credits: CreditState;
  logs: TransactionLog[];
  onResetCredits: () => void;
}

export default function CreditQuotaManager({ 
  credits,
  logs,
  onResetCredits
}: CreditQuotaManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Reset helper
  const handleReset = async () => {
    setIsResetting(true);
    onResetCredits();
    setTimeout(() => setIsResetting(false), 850);
  };

  // Safe credit percentage calculations matching user's spreadsheet criteria (5 decimals)
  const calcPercentage = (remaining: number, original: number) => {
    if (original === 0) return "0.00000";
    const percent = (remaining / original) * 100;
    return percent.toFixed(5);
  };

  const trialPercent = calcPercentage(credits.trialRemaining, credits.trialOriginal);
  const dfPercent = calcPercentage(credits.dialogflowRemaining, credits.dialogflowOriginal);

  return (
    <div className="relative inline-block text-left z-40">
      {/* Top navbar Billing status badge button */}
      <button
        id="billing_quota_dropdown_btn"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-slate-300 hover:border-amber-500/50 hover:text-slate-100 transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        title="Check Active Rupee Promo Credits & API billing Quotas"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
        <span className="font-mono text-[10px] text-amber-500 font-bold">₹ Quota Panel</span>
        <span className="text-slate-400 font-mono text-[10px] hidden sm:inline">
          Trial: ₹{Math.floor(credits.trialRemaining).toLocaleString('en-IN')}
        </span>
      </button>

      {isOpen && (
        <div 
          id="billing_dropdown_dialog" 
          className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-[#0F0F12] border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300 z-50 animate-in fade-in slide-in-from-top-2"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-5 border-b border-white/10 relative">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-500 block mb-1">Billing & API Quotas</span>
                <h3 className="text-sm font-serif italic text-slate-100">Sing Geetham Account Credits</h3>
              </div>
              <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1.5 shrink-0">
                <ShieldCheck className="w-3 h-3" /> API MATCHED
              </span>
            </div>
            
            <div className="mt-2.5 text-[10px] text-slate-400 leading-normal flex items-start gap-1">
              <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span>Matching your promotional sandbox. Every melody synthesis, voice-over generation, and collaborative stream logs real credits.</span>
            </div>
          </div>

          <div className="max-h-[380px] overflow-y-auto p-5 space-y-4">
            {/* Credit Item #1: Trial Credit */}
            <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-100">Trial credit</span>
                <span className="font-mono text-amber-500 font-bold">₹{credits.trialRemaining.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              
              {/* Dynamic progress bar matching percentage visually */}
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.max(1, Math.min(100, Number(trialPercent)))}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>Remaining: <b className="text-slate-200">{trialPercent}%</b></span>
                <span className="text-white/30 text-[9px]">ID: 494be35b0-one-time</span>
              </div>
            </div>

            {/* Credit Item #2: Dialogflow Promo Credit */}
            <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-100">Dialogflow</span>
                <span className="font-mono text-cyan-400 font-bold">₹{credits.dialogflowRemaining.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              
              {/* Dynamic progress bar */}
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-cyan-500 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.max(1, Math.min(100, Number(dfPercent)))}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>Remaining: <b className="text-slate-200">{dfPercent}%</b></span>
                <span className="text-white/30 text-[9px]">ID: dialogflow-promo</span>
              </div>
            </div>

            {/* Simulated Alerts for Out of Credits if low */}
            {(credits.trialRemaining < 100 || credits.dialogflowRemaining < 100) && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-[10.5px] text-amber-500 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>One of your account promo balances is running low. Trigger a full refund below to test seamlessly.</span>
              </div>
            )}

            {/* Transaction Logs Accordion title */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <History className="w-3 h-3 text-slate-500" /> API billing transaction logs
              </span>

              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {logs.length === 0 ? (
                  <div className="text-[10px] italic text-slate-500 py-3 text-center bg-black/10 rounded-lg">
                    No active transaction logs to report.
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="text-[10px] bg-black/20 p-2.5 rounded-lg border border-white/5 space-y-1">
                      <div className="flex justify-between items-center font-semibold text-slate-300">
                        <span className="truncate pr-1">{log.action}</span>
                        <span className="text-[9px] text-slate-500 shrink-0 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[9px] text-white/40 font-mono">
                        <span className="text-amber-500/80 truncate font-bold">model: {log.model}</span>
                        <span className="text-right text-rose-400 font-bold">
                          {log.trialDeduction > 0 && `-₹${log.trialDeduction.toFixed(2)} (Tr) PM`}
                          {log.dfDeduction > 0 && ` -₹${log.dfDeduction.toFixed(2)} (Df)`}
                          {log.trialDeduction === 0 && log.dfDeduction === 0 && "₹0.00"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Footer controls: Refill action button */}
          <div className="border-t border-white/10 bg-black/60 p-4 flex justify-between items-center">
            <span className="text-[9px] text-white/20 font-mono">SANDBOX DEV WORKSPACE</span>
            <button
              id="billing_reset_credits_btn"
              onClick={handleReset}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-white/15 bg-white/5 text-amber-500 hover:text-black hover:bg-amber-500 text-[10px] uppercase font-bold tracking-wider transition-all duration-300 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <RefreshCw className={`w-3 h-3 ${isResetting ? "animate-spin" : ""}`} />
              <span>{isResetting ? "Refunding..." : "Refill Full Balances"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
