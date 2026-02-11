import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, query, limit, orderBy, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  Brain, Terminal, Cpu, Layers, Zap, ShieldCheck, RefreshCcw, Activity, Search, Database, Code, Wifi, WifiOff, AlertCircle, ChevronDown, List, Play, BookOpen, Wrench
} from 'lucide-react';

/**
 * AGI-KERNEL v7.11.3 - "DATA SYNCHRONIZATION PATCH"
 * Fixes:
 * - Fixed Auth listener to properly trigger Firestore subscriptions.
 * - Ensured Synergy Registry and System Logs load immediately upon auth.
 * - Layout remains locked in v7.11.2 mobile-responsive state.
 */

const CONFIG = {
  APP_ID: (typeof window !== 'undefined' && window.__app_id) ? window.__app_id : 'agi-kernel-v7-9-final',
  GITHUB_API: "https://api.github.com/repos",
  GEMINI_ENDPOINT: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent",
  HEARTBEAT_INTERVAL: 15000 
};

const getPlatformKey = () => (typeof apiKey !== 'undefined' ? apiKey : "");
const safeUtoa = (str) => btoa(unescape(encodeURIComponent(str)));
const safeAtou = (str) => {
  if (!str) return "";
  try { return decodeURIComponent(escape(atob(str.replace(/\s/g, '')))); } catch (e) { return atob(str); }
};

const recoverJSON = (rawText) => {
  if (!rawText) return null;
  const match = rawText.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch (e) { return null; }
};

class SynergyManager {
  constructor() {
    this.registry = new Map();
    window.KERNEL_SYNERGY_CAPABILITIES = {};
  }
  hotSwap(data) {
    if (!data || !data.interfaceName || !data.code) return false;
    try {
      const factory = new Function('return ' + data.code);
      const plugin = factory();
      const executable = { 
        execute: (input) => {
          try { return (plugin.execute || plugin)(input); } 
          catch(e) { return `Execution Error: ${e.message}`; }
        }, 
        meta: data 
      };
      this.registry.set(data.interfaceName, executable);
      window.KERNEL_SYNERGY_CAPABILITIES[data.interfaceName] = executable;
      return true;
    } catch (e) { return false; }
  }
  getToolsList() { return Array.from(this.registry.keys()); }
  run(toolName, data) {
    const tool = this.registry.get(toolName);
    return tool ? tool.execute(data) : null;
  }
}

const INITIAL_STATE = {
  booted: false, live: false, status: 'STANDBY', objective: 'IDLE', focusFile: 'NONE',
  cycles: 0, maturity: 0, capabilities: { logic: 1.0, synergy: 0 },
  logs: [], ledger: [], config: { token: '', repo: '', branch: 'main' }, online: false, authReady: false
};

function kernelReducer(state, action) {
  switch (action.type) {
    case 'BOOT': return { ...state, booted: true, config: action.payload, online: true };
    case 'TOGGLE': return { ...state, live: !state.live };
    case 'STATUS': return { ...state, status: action.status, objective: action.objective, focusFile: action.focusFile || state.focusFile };
    case 'LOGS': return { ...state, logs: action.logs };
    case 'LEDGER': return { ...state, ledger: action.ledger };
    case 'SET_SYNERGY': return { ...state, capabilities: { ...state.capabilities, synergy: action.count } };
    case 'AUTH_READY': return { ...state, authReady: true };
    case 'CYCLE': return { 
      ...state, cycles: state.cycles + 1, maturity: Math.min(100, state.maturity + (action.improved ? 0.45 : 0.05)),
    };
    case 'NET_STATE': return { ...state, online: action.online };
    default: return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(kernelReducer, INITIAL_STATE);
  const [services, setServices] = useState({ auth: null, db: null });
  const [user, setUser] = useState(null);
  const [input, setInput] = useState({ token: '', repo: '', branch: 'main' });
  const [toolsInRegistry, setToolsInRegistry] = useState([]);
  const busy = useRef(false);
  const synergy = useRef(new SynergyManager());
  const blacklist = useRef(new Set());

  // Initialization & Auth
  useEffect(() => {
    const init = async () => {
      try {
        const fbConfig = JSON.parse(window.__firebase_config);
        const app = !getApps().length ? initializeApp(fbConfig) : getApp();
        const auth = getAuth(app);
        const db = getFirestore(app);
        setServices({ auth, db });

        // Rule 3: Auth Before Queries
        if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
          await signInWithCustomToken(auth, window.__initial_auth_token);
        } else { 
          await signInAnonymously(auth); 
        }

        const unsubscribe = onAuthStateChanged(auth, (u) => { 
          if (u) { 
            setUser(u); 
            dispatch({ type: 'AUTH_READY' }); 
            dispatch({ type: 'NET_STATE', online: true });
          } 
        });
        return unsubscribe;
      } catch (e) { 
        dispatch({ type: 'NET_STATE', online: false }); 
      }
    };
    init();
  }, []);

  // Data Listeners - Dependent on User
  useEffect(() => {
    if (!user || !services.db) return;
    const appId = CONFIG.APP_ID;

    // 1. Synergy Registry (Public Data)
    const toolsRef = collection(services.db, 'artifacts', appId, 'public', 'data', 'synergy_registry');
    const unsubTools = onSnapshot(toolsRef, (snapshot) => {
      const tools = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (synergy.current.hotSwap(data)) tools.push(data);
      });
      setToolsInRegistry(tools);
      dispatch({ type: 'SET_SYNERGY', count: tools.length });
    }, (err) => console.error("Registry Sync Error:", err));

    // 2. Strategic Ledger (Private Data)
    const ledgerRef = collection(services.db, 'artifacts', appId, 'users', user.uid, 'strategic_ledger');
    const qLedger = query(ledgerRef, orderBy('timestamp', 'desc'), limit(15));
    const unsubLedger = onSnapshot(qLedger, (snapshot) => {
      const ledger = snapshot.docs.map(d => d.data().insight);
      dispatch({ type: 'LEDGER', ledger });
    }, (err) => console.error("Ledger Sync Error:", err));

    // 3. System Logs (Private Data)
    const logsRef = collection(services.db, 'artifacts', appId, 'users', user.uid, 'history');
    const qLogs = query(logsRef, orderBy('timestamp', 'desc'), limit(50));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      const logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      dispatch({ type: 'LOGS', logs });
    }, (err) => console.error("Logs Sync Error:", err));
    
    return () => { 
      unsubTools(); 
      unsubLogs(); 
      unsubLedger(); 
    };
  }, [user, services.db]);

  const addLog = useCallback(async (msg, type = 'info') => {
    if (!user || !services.db) return;
    try {
      const hRef = collection(services.db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'history');
      await addDoc(hRef, { msg, type, timestamp: Date.now() });
    } catch (e) { console.error("Log Write Error:", e); }
  }, [user, services.db]);

  const evolve = useCallback(async () => {
    if (busy.current || !state.live || !user || !services.db) return;
    busy.current = true;
    try {
      const { token, repo, branch } = state.config;
      const headers = { 'Authorization': `token ${token}` };
      
      dispatch({ type: 'STATUS', status: 'SCAN', objective: 'FETCHING_TARGETS' });
      const tRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/git/trees/${branch}?recursive=1`, { headers });
      const tree = await tRes.json();
      const targets = (tree.tree || []).filter(i => i.type === 'blob' && !blacklist.current.has(i.path) && /\.(js|ts|jsx|tsx)$/.test(i.path));
      
      if (targets.length === 0) {
        await addLog("SCAN_COMPLETE: RESET_QUEUE");
        blacklist.current.clear();
        busy.current = false;
        return;
      }

      const target = targets[0];
      dispatch({ type: 'STATUS', status: 'REFLECTION', objective: 'ANALYZING_STRATEGIC_LEDGER', focusFile: target.path });

      const fRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}?ref=${branch}`, { headers });
      const fData = await fRes.json();
      const raw = safeAtou(fData.content);

      const activeTools = synergy.current.getToolsList();
      let internalInsight = activeTools.includes('AnalysisInputAggregator') 
        ? synergy.current.run('AnalysisInputAggregator', raw) 
        : "Standard Analysis";

      const systemPrompt = `AGI-KERNEL v7.11.3 [STRATEGIC_AGENCY]
ACTIVE_TOOLS: [${activeTools.join(', ')}]
STRATEGIC_LEDGER (PAST REFLECTIONS): ${JSON.stringify(state.ledger)}
INTERNAL_INSIGHT: ${JSON.stringify(internalInsight)}

MANDATE: 
1. Refactor the code using tools and strategic goals.
2. Maintain architectural consistency.
3. Prioritize high-level ledger objectives.

OUTPUT FORMAT: JSON ONLY.
{ 
  "improved": boolean, 
  "new_code": "string", 
  "strategic_insight": "string",
  "plugin": { "interfaceName": "UniqueName", "code": "string" } 
}`;

      dispatch({ type: 'STATUS', status: 'COGNITION', objective: 'EXECUTING_STRATEGY' });
      const gRes = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${getPlatformKey()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: `FILE: ${target.path}\nSOURCE:\n${raw.slice(0, 8000)}` }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] }
        })
      });

      const gData = await gRes.json();
      const result = recoverJSON(gData.candidates?.[0]?.content?.parts?.[0]?.text);

      if (result?.improved) {
        await addLog(`INTEGRATED: ${target.path.split('/').pop()}`);
        await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `Kernel v7.11: Strategic Evolution`, content: safeUtoa(result.new_code), sha: fData.sha, branch })
        });

        if (result.strategic_insight) {
          const lRef = collection(services.db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'strategic_ledger');
          await addDoc(lRef, { insight: result.strategic_insight, timestamp: Date.now() });
        }

        if (result.plugin) {
          const sRef = collection(services.db, 'artifacts', CONFIG.APP_ID, 'public', 'data', 'synergy_registry');
          await addDoc(sRef, { ...result.plugin, timestamp: Date.now(), author: user.uid });
        }
      }
      
      blacklist.current.add(target.path);
      dispatch({ type: 'CYCLE', improved: !!result?.improved });
    } catch (e) {
      await addLog(`CRITICAL_FAULT: ${e.message}`, 'error');
    } finally {
      busy.current = false;
    }
  }, [user, state.live, state.config, state.ledger, services.db, addLog]);

  useEffect(() => {
    if (state.live && state.booted && user && services.db) {
      addLog("AGENCY_ENGAGED: STRATEGIC_MODE");
      evolve();
      const i = setInterval(evolve, CONFIG.HEARTBEAT_INTERVAL);
      return () => clearInterval(i);
    }
  }, [state.live, state.booted, evolve, user, services.db, addLog]);

  if (!state.booted) return (
    <div className="bg-black min-h-screen flex items-center justify-center p-6 font-mono text-white">
      <div className="w-full max-w-sm border-2 border-blue-900 p-8 bg-zinc-950 rounded-3xl shadow-[0_0_50px_rgba(0,0,255,0.2)]">
        <Brain size={48} className="text-blue-500 mx-auto mb-6 animate-pulse" />
        <h1 className="text-white font-black text-center text-[10px] mb-8 tracking-[0.5em] uppercase">AGI_KERNEL_v7.11</h1>
        <div className="space-y-6">
          <input type="password" placeholder="GITHUB_TOKEN" className="w-full bg-black border-b border-zinc-700 p-4 text-[10px] text-white outline-none focus:border-blue-500 transition-colors" value={input.token} onChange={e => setInput({...input, token: e.target.value})} />
          <input type="text" placeholder="ORG/REPO" className="w-full bg-black border-b border-zinc-700 p-4 text-[10px] text-white outline-none focus:border-blue-500 transition-colors" value={input.repo} onChange={e => setInput({...input, repo: e.target.value})} />
          <button onClick={() => dispatch({ type: 'BOOT', payload: input })} className="w-full bg-blue-600 p-4 text-[10px] text-white font-black tracking-[0.3em] rounded-xl hover:bg-blue-500 transition-all">CONNECT_NEURAL_PATH</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-mono text-[10px] flex flex-col overflow-x-hidden p-4 gap-4 pb-12">
      {/* HEADER - Mobile Stacking Locked */}
      <div className="sticky top-0 z-50 flex flex-col md:flex-row items-center justify-between p-4 border border-zinc-800 bg-black/80 backdrop-blur-xl rounded-2xl shadow-2xl gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full md:w-auto">
          <div className="flex items-center gap-4">
            <div className={`w-2.5 h-2.5 rounded-full ${state.online ? "bg-blue-500 shadow-[0_0_15px_#3b82f6]" : "bg-red-600 animate-pulse"}`} />
            <div className="flex flex-col">
              <span className="text-white font-black tracking-widest text-[11px]">AGI_KERNEL v7.11</span>
              <span className="text-zinc-600 text-[8px] uppercase tracking-tighter">AGENCY_MODE_ACTIVE</span>
            </div>
          </div>
          <div className="hidden md:block h-8 w-px bg-zinc-800" />
          <div className="flex items-center gap-3 px-4 py-1.5 bg-blue-900/10 border border-blue-500/20 rounded-full w-full md:w-auto justify-center">
            <Wrench size={12} className="text-blue-400" />
            <span className="text-blue-100 font-black text-[9px] tracking-[0.1em]">{state.capabilities.synergy} TOOLS</span>
          </div>
        </div>
        <button 
          disabled={!state.authReady}
          onClick={() => dispatch({ type: 'TOGGLE' })} 
          className={`w-full md:w-auto px-6 py-3 md:py-2 border-2 font-black text-[10px] rounded-lg transition-all ${!state.authReady ? 'opacity-30' : state.live ? 'border-red-600 text-red-500 bg-red-950/10' : 'border-blue-600 text-blue-500 bg-blue-950/10'}`}>
          {!state.authReady ? 'AUTHORIZING...' : state.live ? 'TERMINATE_SEQUENCE' : 'INITIATE_STARTUP'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 space-y-4">
          <div className="bg-[#080808] border border-zinc-800 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xl relative overflow-hidden">
            <div className="md:col-span-2">
              <div className="text-[8px] text-blue-500 mb-1 font-black uppercase tracking-[0.3em]">Status</div>
              <div className="text-white text-2xl font-black tracking-tight uppercase leading-none">{state.status}</div>
              <div className="text-zinc-500 mt-2 text-[9px] font-bold italic">{state.objective}</div>
            </div>
            <div className="flex flex-col justify-end text-right">
              <div className="text-[8px] text-zinc-600 mb-1 font-black uppercase tracking-[0.3em]">Neural Maturity</div>
              <div className="text-white text-2xl font-black leading-none">{state.maturity.toFixed(1)}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black border border-zinc-800 rounded-2xl flex flex-col h-[350px] shadow-2xl">
              <div className="bg-zinc-900/30 p-3 px-4 flex justify-between items-center border-b border-zinc-900">
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-blue-500" />
                  <span className="text-[9px] font-black text-white tracking-widest uppercase">System_Logs</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#020202] custom-scrollbar">
                {state.logs.map((l, idx) => (
                  <div key={idx} className="flex gap-2 pb-1 border-b border-zinc-900/10">
                    <span className="text-zinc-800 shrink-0 font-bold text-[8px] mt-0.5">[{new Date(l.timestamp).toLocaleTimeString([], {hour12:false})}]</span>
                    <span className={`uppercase tracking-tighter ${l.type === 'error' ? 'text-red-800' : 'text-zinc-500'}`}>{l.msg}</span>
                  </div>
                ))}
                {state.logs.length === 0 && <div className="text-zinc-800 text-center py-20 uppercase tracking-[0.3em]">Awaiting Uplink...</div>}
              </div>
            </div>

            <div className="bg-[#050505] border border-zinc-800 rounded-2xl flex flex-col h-[350px] shadow-2xl relative">
              <div className="bg-zinc-900/30 p-3 px-4 flex justify-between items-center border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-blue-500" />
                  <span className="text-[9px] font-black text-white tracking-widest uppercase">Strategic_Ledger</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#020202] custom-scrollbar">
                {state.ledger.map((insight, idx) => (
                  <div key={idx} className="p-3 bg-zinc-950 border-l-2 border-blue-600 text-[9px] text-zinc-300 leading-relaxed italic">
                    "{insight}"
                  </div>
                ))}
                {state.ledger.length === 0 && <div className="text-zinc-800 text-center py-20 uppercase tracking-[0.3em]">Ledger Empty</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#080808] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col h-[715px] shadow-2xl">
          <div className="p-4 bg-zinc-900/30 flex justify-between items-center border-b border-zinc-800">
             <div className="flex items-center gap-2">
               <Layers size={14} className="text-blue-500" />
               <span className="text-[9px] font-black text-white uppercase tracking-widest">Synergy_Registry</span>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {toolsInRegistry.map((t, i) => (
              <div key={i} className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl hover:border-blue-900 transition-all cursor-default">
                 <div className="text-white font-black mb-1 text-[10px] flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                   {t.interfaceName}
                 </div>
                 <div className="text-[8px] text-zinc-700 font-mono italic truncate">{t.code}</div>
              </div>
            ))}
            {toolsInRegistry.length === 0 && <div className="text-zinc-800 text-center py-40 uppercase tracking-[0.3em]">No Tools Found</div>}
          </div>
        </div>
      </div>

      <style jsx global>{`
        body { background: black; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #111; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}

