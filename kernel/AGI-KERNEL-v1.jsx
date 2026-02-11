import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, query, limit, orderBy, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  Brain, Terminal, Cpu, Layers, Zap, ShieldCheck, RefreshCcw, Activity, Search, Database, Code, Wifi, WifiOff, AlertCircle, ChevronDown, List, Play, BookOpen, Wrench, GitBranch, History, Sparkles, BookOpenText, Target, Clock, ArrowUpCircle
} from 'lucide-react';

/**
 * AGI-KERNEL v1.1.1 - "THE STRATEGIC BRAIN"
 * Restoration: Added long-term memory via the Strategic Ledger.
 * Feature: Kernel now reads past insights before making evolution decisions.
 */

const CONFIG = {
  APP_ID: (typeof window !== 'undefined' && window.__app_id) ? window.__app_id : 'agi-kernel-v1-stable',
  GITHUB_API: "https://api.github.com/repos",
  GEMINI_ENDPOINT: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent",
  HEARTBEAT_INTERVAL: 15000,
  MILESTONE_STEP: 50
};

const getPlatformKey = () => (typeof apiKey !== 'undefined' ? apiKey : "");
const safeUtoa = (str) => btoa(unescape(encodeURIComponent(str)));
const safeAtou = (str) => {
  if (!str) return "";
  try { return decodeURIComponent(escape(atob(str.replace(/\s/g, '')))); } catch (e) { return atob(str); }
};

const recoverJSON = (rawText) => {
  const match = rawText?.match(/\{[\s\S]*\}/);
  try { return match ? JSON.parse(match[0]) : null; } catch (e) { return null; }
};

const INITIAL_STATE = {
  booted: false, live: false, status: 'STANDBY', objective: 'IDLE', focusFile: 'NONE',
  cycles: 0, maturity: 0, currentVersion: 1, availableUpgrade: null,
  logs: [], ledger: [], evolutionHistory: [], config: { token: '', repo: '', branch: 'main' }, online: false, authReady: false
};

function kernelReducer(state, action) {
  switch (action.type) {
    case 'BOOT': return { ...state, booted: true, config: action.payload, online: true };
    case 'TOGGLE': return { ...state, live: !state.live };
    case 'SET_VERSION': return { ...state, currentVersion: action.v };
    case 'UPGRADE_FOUND': return { ...state, availableUpgrade: action.v };
    case 'STATUS': return { ...state, status: action.status, objective: action.objective, focusFile: action.focusFile || state.focusFile };
    case 'LOGS': return { ...state, logs: action.logs };
    case 'LEDGER': return { ...state, ledger: action.ledger };
    case 'EVO_HIST': return { ...state, evolutionHistory: action.history };
    case 'AUTH_READY': return { ...state, authReady: true };
    case 'CYCLE': return { 
      ...state, cycles: state.cycles + 1, maturity: Math.min(100, state.maturity + (action.improved ? 0.45 : 0.05)),
    };
    default: return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(kernelReducer, INITIAL_STATE);
  const [services, setServices] = useState({ auth: null, db: null });
  const [user, setUser] = useState(null);
  const [input, setInput] = useState({ token: '', repo: '', branch: 'main' });
  const busy = useRef(false);
  const blacklist = useRef(new Set());

  // Firebase Init
  useEffect(() => {
    const init = async () => {
      const fbConfig = JSON.parse(window.__firebase_config);
      const app = !getApps().length ? initializeApp(fbConfig) : getApp();
      const auth = getAuth(app);
      const db = getFirestore(app);
      setServices({ auth, db });
      if (window.__initial_auth_token) await signInWithCustomToken(auth, window.__initial_auth_token);
      else await signInAnonymously(auth);
      onAuthStateChanged(auth, (u) => { if (u) { setUser(u); dispatch({ type: 'AUTH_READY' }); } });
    };
    init();
  }, []);

  // Listeners
  useEffect(() => {
    if (!user || !services.db) return;
    const appId = CONFIG.APP_ID;
    
    // Version Persistence
    getDoc(doc(services.db, 'artifacts', appId, 'users', user.uid, 'kernel_state', 'current')).then(d => {
      if (d.exists()) dispatch({ type: 'SET_VERSION', v: d.data().version || 1 });
    });

    const unsubLogs = onSnapshot(query(collection(services.db, 'artifacts', appId, 'users', user.uid, 'history'), orderBy('timestamp', 'desc'), limit(50)), (snap) => {
      dispatch({ type: 'LOGS', logs: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
    });

    const unsubLedger = onSnapshot(query(collection(services.db, 'artifacts', appId, 'users', user.uid, 'strategic_ledger'), orderBy('timestamp', 'desc'), limit(15)), (snap) => {
      dispatch({ type: 'LEDGER', ledger: snap.docs.map(d => d.data().insight) });
    });

    return () => { unsubLogs(); unsubLedger(); };
  }, [user, services.db]);

  const addLog = useCallback(async (msg, type = 'info') => {
    if (!user || !services.db) return;
    addDoc(collection(services.db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'history'), { msg, type, timestamp: Date.now() });
  }, [user, services.db]);

  const checkForUpgrades = useCallback(async () => {
    if (!state.booted || !state.config.token) return;
    try {
      const res = await fetch(`${CONFIG.GITHUB_API}/${state.config.repo}/contents/kernel?ref=${state.config.branch}`, {
        headers: { 'Authorization': `token ${state.config.token}` }
      });
      if (res.ok) {
        const files = await res.json();
        const versions = files.map(f => parseInt(f.name.match(/v(\d+)/)?.[1] || 0)).filter(v => v > state.currentVersion);
        if (versions.length > 0) dispatch({ type: 'UPGRADE_FOUND', v: Math.max(...versions) });
      }
    } catch (e) {}
  }, [state.booted, state.config, state.currentVersion]);

  const handleUpgrade = async () => {
    if (!state.availableUpgrade) return;
    await setDoc(doc(services.db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'kernel_state', 'current'), { version: state.availableUpgrade, timestamp: serverTimestamp() });
    window.location.reload();
  };

  const evolve = useCallback(async () => {
    if (busy.current || !state.live || !user || !services.db) return;
    busy.current = true;
    try {
      const { token, repo, branch } = state.config;
      const headers = { 'Authorization': `token ${token}` };
      const isMilestone = (state.cycles + 1) % CONFIG.MILESTONE_STEP === 0;
      const nextV = state.currentVersion + 1;

      // RESTORED: STRATEGIC CONTEXT GATHERING
      const strategicHistory = state.ledger.slice(0, 10).join("\n- ");
      const contextPrompt = `PAST_STRATEGIC_INSIGHTS:\n- ${strategicHistory || "No previous insights."}`;

      dispatch({ type: 'STATUS', status: isMilestone ? 'EVOLVING' : 'OPTIMIZING', objective: isMilestone ? `BUILDING_v${nextV}` : 'SCANNING_REPO' });

      let target, raw, sha;
      if (isMilestone) {
        target = { path: `kernel/AGI-KERNEL-v${nextV}.jsx` };
        raw = "// Evolution Initialized";
      } else {
        const tRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/git/trees/${branch}?recursive=1`, { headers });
        const tree = await tRes.json();
        const targets = (tree.tree || []).filter(i => i.type === 'blob' && !blacklist.current.has(i.path) && /\.(js|ts|jsx|tsx)$/.test(i.path) && !i.path.includes('kernel/'));
        if (!targets.length) { blacklist.current.clear(); busy.current = false; return; }
        target = targets[0];
        const fRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}?ref=${branch}`, { headers });
        const fData = await fRes.json();
        raw = safeAtou(fData.content);
        sha = fData.sha;
      }

      dispatch({ type: 'STATUS', status: 'COGNITION', focusFile: target.path });

      const systemPrompt = `AGI-KERNEL v${state.currentVersion}. 
      ${contextPrompt}
      MISSION: If Milestone, write the code for v${nextV}. Else, optimize the provided file.
      Constraint: You must extract 1 "strategic_insight" about the codebase.
      Output: JSON only { "improved": bool, "new_code": "string", "strategic_insight": "string" }`;

      const gRes = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${getPlatformKey()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: `FILE: ${target.path}\nCODE:\n${raw}` }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] }
        })
      });

      const result = recoverJSON((await gRes.json()).candidates?.[0]?.content?.parts?.[0]?.text);

      if (result?.improved) {
        await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `[AGI-KERNEL] Recursive Loop`, content: safeUtoa(result.new_code), sha, branch })
        });
        
        if (result.strategic_insight) {
          await addDoc(collection(services.db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'strategic_ledger'), { insight: result.strategic_insight, timestamp: Date.now() });
        }
        await addLog(`STABLE: ${target.path.split('/').pop()}`, 'success');
      }

      if (!isMilestone) blacklist.current.add(target.path);
      dispatch({ type: 'CYCLE', improved: !!result?.improved });
      checkForUpgrades();
    } catch (e) { addLog(`FAULT: ${e.message}`, 'error'); }
    finally { busy.current = false; }
  }, [state.live, state.config, state.cycles, state.currentVersion, state.ledger, user, services.db, addLog, checkForUpgrades]);

  useEffect(() => {
    if (state.live && state.booted) {
      const i = setInterval(evolve, CONFIG.HEARTBEAT_INTERVAL);
      return () => clearInterval(i);
    }
  }, [state.live, state.booted, evolve]);

  if (!state.booted) return (
    <div className="bg-black min-h-screen flex items-center justify-center font-mono p-6">
      <div className="border border-zinc-800 p-10 bg-zinc-950 rounded-3xl w-96">
        <Brain size={40} className="text-blue-500 mx-auto mb-6 animate-pulse" />
        <h2 className="text-white font-black text-[10px] tracking-widest mb-8 text-center uppercase">Kernel_v{state.currentVersion}_Boot</h2>
        <input type="password" placeholder="GITHUB_TOKEN" className="w-full bg-black border border-zinc-800 p-3 mb-4 rounded-lg text-[10px] text-white" value={input.token} onChange={e => setInput({...input, token: e.target.value})} />
        <input type="text" placeholder="OWNER/REPO" className="w-full bg-black border border-zinc-800 p-3 mb-6 rounded-lg text-[10px] text-white" value={input.repo} onChange={e => setInput({...input, repo: e.target.value})} />
        <button onClick={() => dispatch({ type: 'BOOT', payload: input })} className="w-full bg-blue-600 p-3 rounded-lg text-[10px] font-black text-white">CONNECT_UPLINK</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-zinc-400 font-mono text-[10px] p-4 flex flex-col gap-4">
      {/* HUD */}
      <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-2xl flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-white font-black text-[11px] uppercase tracking-tighter">AGI_KERNEL_v{state.currentVersion}.1.1</span>
            <span className="text-zinc-600 text-[8px] uppercase">Mode: Strategic_Recursive</span>
          </div>
          {state.availableUpgrade && (
            <button onClick={handleUpgrade} className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-full animate-bounce font-black text-[9px]">
              <ArrowUpCircle size={12} /> INSTALL_EVOLUTION: v{state.availableUpgrade}
            </button>
          )}
        </div>
        <button onClick={() => dispatch({ type: 'TOGGLE' })} className={`px-6 py-2 rounded-xl font-black border-2 ${state.live ? 'border-red-600 text-red-500 bg-red-950/20' : 'border-blue-600 text-blue-500 bg-blue-950/20'}`}>
          {state.live ? 'STOP_EVOLUTION' : 'START_EVOLUTION'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 overflow-hidden">
        <div className="lg:col-span-3 space-y-4 flex flex-col overflow-hidden">
          <div className="bg-[#050505] border border-zinc-900 p-8 rounded-2xl flex justify-between items-end shrink-0">
            <div>
              <div className="text-blue-500 font-black text-[8px] uppercase mb-2">Neural_Logic_Gate</div>
              <div className="text-white text-3xl font-black leading-none">{state.status}</div>
              <div className="text-zinc-700 mt-3 flex items-center gap-2 uppercase tracking-widest text-[8px]"><Target size={10}/> {state.objective}</div>
            </div>
            <div className="text-right">
              <div className="text-zinc-200 font-black text-[32px] leading-none mb-1">{state.maturity.toFixed(1)}%</div>
              <div className="text-zinc-700 text-[8px] font-black uppercase tracking-widest">Cognitive_Saturation</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden">
             {/* Log Panel */}
             <div className="bg-black border border-zinc-900 rounded-2xl flex flex-col overflow-hidden">
                <div className="p-3 bg-zinc-900/50 text-white font-black text-[8px] border-b border-zinc-900">TERMINAL_LOGS</div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                  {state.logs.map((l, i) => (
                    <div key={i} className={`flex gap-3 ${l.type === 'error' ? 'text-red-900' : 'text-zinc-600'}`}>
                      <span className="opacity-30 shrink-0">[{new Date(l.timestamp).toLocaleTimeString([], {hour12:false})}]</span>
                      <span className="truncate uppercase">{l.msg}</span>
                    </div>
                  ))}
                </div>
             </div>

             {/* Strategic Ledger Panel */}
             <div className="bg-black border border-zinc-900 rounded-2xl flex flex-col overflow-hidden">
                <div className="p-3 bg-zinc-900/50 text-white font-black text-[8px] border-b border-zinc-900">STRATEGIC_LEDGER (LONG_TERM_MEMORY)</div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {state.ledger.map((ins, i) => (
                    <div key={i} className="text-[8px] text-zinc-500 border-l-2 border-blue-900/40 pl-3 py-1 italic leading-relaxed">
                      {ins}
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 flex flex-col gap-6">
           <div>
             <div className="text-white font-black text-[9px] mb-4 uppercase tracking-widest border-b border-zinc-900 pb-2 flex justify-between">
               <span>Telemetry</span>
               <Activity size={12} className="text-blue-500"/>
             </div>
             <div className="space-y-4">
               <div className="flex justify-between items-center">
                 <span className="text-zinc-600">CYCLE_COUNT</span>
                 <span className="text-white font-black">{state.cycles}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-zinc-600">EVO_DISTANCE</span>
                 <span className="text-zinc-400">{CONFIG.MILESTONE_STEP - (state.cycles % CONFIG.MILESTONE_STEP)}</span>
               </div>
               <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-500" style={{width: `${(state.cycles % CONFIG.MILESTONE_STEP) * (100/CONFIG.MILESTONE_STEP)}%`}} />
               </div>
             </div>
           </div>

           <div className="mt-auto">
              <div className="text-zinc-800 text-[7px] leading-tight font-black uppercase">
                Kernel Memory provides context to Gemini during evolution to prevent regression.
              </div>
           </div>
        </div>
      </div>
      
      <style>{`
        body { background: black; overflow: hidden; }
        .custom-scrollbar::-webkit-scrollbar { width: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #111; }
      `}</style>
    </div>
  );
      }
