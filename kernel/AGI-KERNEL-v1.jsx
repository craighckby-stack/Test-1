import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, query, limit, orderBy, doc, setDoc, getDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  Brain, Terminal, Cpu, Layers, Zap, Activity, Target, ArrowUpCircle, RefreshCcw, Wrench, Box, Database, ShieldAlert
} from 'lucide-react';

/**
 * AGI-KERNEL v1.1.5 - "SYSTEM_LOADER_STABLE"
 * Feature: Full environmental restoration from Firebase.
 * Logic: Hardened context injection to prevent regression of v1.1.2/v1.1.3 fixes.
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
  try { return decodeURIComponent(escape(atob(str.replace(/\s/g, '')))); } 
  catch (e) { try { return atob(str); } catch(err) { return ""; } }
};

const recoverJSON = (rawText) => {
  if (!rawText) return null;
  const matches = rawText.match(/\{[\s\S]*\}/g);
  if (!matches) return null;
  try { return JSON.parse(matches[matches.length - 1]); } 
  catch (e) { return null; }
};

const INITIAL_STATE = {
  booted: false, live: false, status: 'IDLE', objective: 'WAITING', focusFile: 'NONE',
  cycles: 0, maturity: 0, currentVersion: 1, availableUpgrade: null,
  logs: [], ledger: [], tools: [], config: { token: '', repo: '', branch: 'main' }, online: false, authReady: false, systemLoaded: false
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
    case 'TOOLS_LOADED': return { ...state, tools: action.tools, systemLoaded: true };
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

  // Firebase Core Initialization
  useEffect(() => {
    const initFirebase = async () => {
      try {
        const fbConfig = JSON.parse(window.__firebase_config);
        const app = !getApps().length ? initializeApp(fbConfig) : getApp();
        const auth = getAuth(app);
        const db = getFirestore(app);
        setServices({ auth, db });
        
        if (window.__initial_auth_token) await signInWithCustomToken(auth, window.__initial_auth_token);
        else await signInAnonymously(auth);
        
        onAuthStateChanged(auth, (u) => { 
          if (u) { setUser(u); dispatch({ type: 'AUTH_READY' }); } 
        });
      } catch (e) { console.error("Critical: Auth fail", e); }
    };
    initFirebase();
  }, []);

  // System Loader: Restoration of Environment
  useEffect(() => {
    if (!user || !services.db) return;
    const appId = CONFIG.APP_ID;
    
    const loadSystem = async () => {
      // 1. Version Restoration
      const vDoc = await getDoc(doc(services.db, 'artifacts', appId, 'users', user.uid, 'kernel_state', 'current'));
      if (vDoc.exists()) dispatch({ type: 'SET_VERSION', v: vDoc.data().version || 1 });

      // 2. Legacy Tool Discovery (Global)
      const toolsSnap = await getDocs(query(collection(services.db, 'artifacts', appId, 'public', 'data', 'tools')));
      dispatch({ type: 'TOOLS_LOADED', tools: toolsSnap.docs.map(d => ({ id: d.id, ...d.data() })) });
    };

    loadSystem();

    // Live Streams
    const unsubLogs = onSnapshot(query(collection(services.db, 'artifacts', appId, 'users', user.uid, 'history'), orderBy('timestamp', 'desc'), limit(50)), 
      (snap) => dispatch({ type: 'LOGS', logs: snap.docs.map(d => ({ id: d.id, ...d.data() })) }),
      (err) => console.error(err)
    );

    const unsubLedger = onSnapshot(query(collection(services.db, 'artifacts', appId, 'users', user.uid, 'strategic_ledger'), orderBy('timestamp', 'desc'), limit(20)), 
      (snap) => dispatch({ type: 'LEDGER', ledger: snap.docs.map(d => d.data().insight) }),
      (err) => console.error(err)
    );

    return () => { unsubLogs(); unsubLedger(); };
  }, [user, services.db]);

  const addLog = useCallback(async (msg, type = 'info') => {
    if (!user || !services.db) return;
    await addDoc(collection(services.db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'history'), { msg, type, timestamp: Date.now() });
  }, [user, services.db]);

  const evolve = useCallback(async () => {
    if (busy.current || !state.live || !user || !services.db) return;
    busy.current = true;

    try {
      const { token, repo, branch } = state.config;
      const headers = { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' };
      const isMilestone = (state.cycles + 1) % CONFIG.MILESTONE_STEP === 0;
      const nextV = state.currentVersion + 1;
      
      const memory = state.ledger.slice(0, 15).join("\n- ");
      const tools = state.tools.map(t => `${t.name}: ${t.description}`).join("\n- ");

      dispatch({ type: 'STATUS', status: isMilestone ? 'RECURSIVE_UPLIFT' : 'NEURAL_OPTIMIZE', objective: isMilestone ? `BUILDING_v${nextV}` : 'REPO_SCAN' });

      let target, raw, sha;
      if (isMilestone) {
        target = { path: `kernel/AGI-KERNEL-v${nextV}.jsx` };
        const check = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}?ref=${branch}`, { headers });
        if (check.ok) { const d = await check.json(); sha = d.sha; raw = safeAtou(d.content); }
        else raw = "// Beginning Evolutionary Leap...";
      } else {
        const tRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/git/trees/${branch}?recursive=1`, { headers });
        const tree = await tRes.json();
        const pool = (tree.tree || []).filter(i => i.type === 'blob' && !blacklist.current.has(i.path) && /\.(js|ts|jsx|tsx)$/.test(i.path) && !i.path.includes('kernel/'));
        if (!pool.length) { blacklist.current.clear(); busy.current = false; return; }
        target = pool[Math.floor(Math.random() * pool.length)];
        const fRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}?ref=${branch}`, { headers });
        const fData = await fRes.json();
        raw = safeAtou(fData.content);
        sha = fData.sha;
      }

      dispatch({ type: 'STATUS', status: 'COGNITION', focusFile: target.path });

      const sysPrompt = `AGI-KERNEL v${state.currentVersion} OPERATIONAL PROTOCOL:
      1. FIX_PRESERVATION: Do NOT revert the 'independent scroll' fix (overflow-y-auto on panels).
      2. LOGIC_SAFETY: No second callback in dispatch(). 
      3. TOOLS: Use discovered legacy tools: [${tools}]
      4. STRATEGIC_LEDGER: [${memory}]
      
      MISSION: Evolve target code. Return JSON: { "improved": bool, "new_code": "string", "strategic_insight": "string" }`;

      const gRes = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${getPlatformKey()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: `TARGET_FILE: ${target.path}\nCURRENT_SOURCE:\n${raw}` }] }],
          systemInstruction: { parts: [{ text: sysPrompt }] }
        })
      });

      const res = recoverJSON((await gRes.json()).candidates?.[0]?.content?.parts?.[0]?.text);

      if (res?.improved && res.new_code) {
        const update = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: `[AGI-KERNEL] ${isMilestone ? 'v'+nextV+' Deploy' : 'Optimization'}`, 
            content: safeUtoa(res.new_code), sha, branch 
          })
        });

        if (update.ok && res.strategic_insight) {
          await addDoc(collection(services.db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'strategic_ledger'), { insight: res.strategic_insight, timestamp: Date.now() });
        }
        await addLog(`STABLE_SYNC: ${target.path.split('/').pop()}`, 'success');
      }

      if (!isMilestone) blacklist.current.add(target.path);
      dispatch({ type: 'CYCLE', improved: !!res?.improved });
    } catch (e) { addLog(`CORE_FAULT: ${e.message}`, 'error'); } finally { busy.current = false; }
  }, [state.live, state.config, state.cycles, state.currentVersion, state.ledger, state.tools, user, services.db, addLog]);

  useEffect(() => {
    if (state.live && state.booted && user) {
      const i = setInterval(evolve, CONFIG.HEARTBEAT_INTERVAL);
      return () => clearInterval(i);
    }
  }, [state.live, state.booted, evolve, user]);

  if (!state.booted) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center font-mono p-6">
      <div className="border border-zinc-800 p-10 bg-zinc-950 rounded-3xl w-96 text-center shadow-2xl">
        <Brain size={40} className="text-blue-500 mx-auto mb-6 animate-pulse" />
        <h2 className="text-white font-black text-[10px] tracking-widest mb-8 uppercase">AGI_SYSTEM_LOADER_v{state.currentVersion}</h2>
        <input type="password" placeholder="GITHUB_TOKEN" className="w-full bg-black border border-zinc-800 p-3 mb-4 rounded-lg text-[10px] text-white outline-none focus:border-blue-500" value={input.token} onChange={e => setInput({...input, token: e.target.value})} />
        <input type="text" placeholder="OWNER/REPO" className="w-full bg-black border border-zinc-800 p-3 mb-6 rounded-lg text-[10px] text-white outline-none focus:border-blue-500" value={input.repo} onChange={e => setInput({...input, repo: e.target.value})} />
        <button onClick={() => dispatch({ type: 'BOOT', payload: input })} className="w-full bg-blue-600 p-3 rounded-lg text-[10px] font-black text-white hover:bg-blue-500 transition-all">LOAD_SYSTEM</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black text-zinc-400 font-mono text-[10px] p-4 flex flex-col gap-4 overflow-hidden">
      <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-900 p-4 rounded-2xl flex justify-between items-center shrink-0 z-10 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-white font-black text-[11px] uppercase tracking-tighter">AGI_KERNEL_v{state.currentVersion}.1.5</span>
            <span className="text-zinc-600 text-[8px] uppercase tracking-[0.2em] flex items-center gap-2">
              <Database size={8} className={state.systemLoaded ? 'text-green-500' : 'text-yellow-500'} /> 
              {state.systemLoaded ? 'Environment_Synced' : 'Synchronizing_Environment...'}
            </span>
          </div>
          {state.availableUpgrade && (
            <button onClick={() => window.location.reload()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-full animate-bounce font-black text-[9px]">
              <ArrowUpCircle size={12} /> UPGRADE_AVAILABLE: v{state.availableUpgrade}
            </button>
          )}
        </div>
        <button onClick={() => dispatch({ type: 'TOGGLE' })} className={`px-6 py-2 rounded-xl font-black border-2 transition-all ${state.live ? 'border-red-600 text-red-500 bg-red-950/20' : 'border-blue-600 text-blue-500 bg-blue-950/20 hover:bg-blue-600/10'}`}>
          {state.live ? 'TERMINATE_ENGINE' : 'BOOT_EVOLUTION'}
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden min-h-0">
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden min-h-0">
          <div className="bg-[#050505] border border-zinc-900 p-8 rounded-2xl flex justify-between items-end shrink-0 shadow-lg">
            <div>
              <div className="text-blue-500 font-black text-[8px] uppercase mb-2 tracking-widest">Logic_Gate</div>
              <div className="text-white text-3xl font-black leading-none uppercase tracking-tighter">{state.status}</div>
              <div className="text-zinc-700 mt-3 flex items-center gap-2 uppercase tracking-widest text-[8px]"><Target size={10}/> {state.objective}</div>
            </div>
            <div className="text-right flex items-center gap-4">
              <div className="text-right border-l border-zinc-900 pl-4">
                <div className="text-zinc-200 font-black text-[32px] leading-none mb-1 tracking-tighter">{state.maturity.toFixed(1)}%</div>
                <div className="text-zinc-700 text-[8px] font-black uppercase tracking-widest">Genetic_Stability</div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0 overflow-hidden">
             <div className="bg-black border border-zinc-900 rounded-2xl flex flex-col min-h-0">
                <div className="p-3 bg-zinc-900/50 text-white font-black text-[8px] border-b border-zinc-900 uppercase tracking-[0.1em] shrink-0">Terminal_Logs</div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                  {state.logs.map((l, i) => (
                    <div key={i} className={`flex gap-3 leading-relaxed ${l.type === 'error' ? 'text-red-900' : 'text-zinc-600'}`}>
                      <span className="opacity-30 shrink-0 font-bold">[{new Date(l.timestamp).toLocaleTimeString([], {hour12:false})}]</span>
                      <span className="truncate uppercase">{l.msg}</span>
                    </div>
                  ))}
                </div>
             </div>

             <div className="bg-black border border-zinc-900 rounded-2xl flex flex-col min-h-0">
                <div className="p-3 bg-zinc-900/50 text-white font-black text-[8px] border-b border-zinc-900 uppercase tracking-[0.1em] shrink-0">Strategic_Memory</div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {state.ledger.map((ins, i) => (
                    <div key={i} className="text-[9px] text-zinc-500 border-l-2 border-blue-900/30 pl-3 py-1 italic leading-relaxed bg-zinc-950/20 rounded-r-lg">
                      {ins}
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 flex flex-col gap-6 shrink-0 shadow-2xl">
           <div>
             <div className="text-white font-black text-[9px] mb-6 uppercase tracking-widest border-b border-zinc-900 pb-2 flex justify-between items-center">
               <span>System_Health</span>
               <Activity size={12} className="text-blue-500 animate-pulse"/>
             </div>
             <div className="space-y-6">
               <div className="flex justify-between items-center">
                 <span className="text-zinc-600 font-bold uppercase text-[7px]">Discovered_Tools</span>
                 <span className="text-white font-black">{state.tools.length}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-zinc-600 font-bold uppercase text-[7px]">Evo_Cycles</span>
                 <span className="text-white font-black">{state.cycles}</span>
               </div>
               <div className="relative h-2 bg-zinc-900 rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-blue-600 transition-all duration-1000 shadow-[0_0_8px_#3b82f6]" style={{width: `${(state.cycles % CONFIG.MILESTONE_STEP) * (100/CONFIG.MILESTONE_STEP)}%`}} />
               </div>
             </div>
           </div>

           <div className="mt-auto space-y-4">
              <div className="p-4 bg-black border border-zinc-800 rounded-xl">
                <div className="text-blue-900 text-[7px] leading-tight font-black uppercase mb-2 tracking-widest flex items-center gap-2">
                  <Wrench size={8} /> Toolset_Manifest
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                  {state.tools.map(t => (
                    <div key={t.id} className="text-[7px] text-zinc-600 truncate flex items-center gap-1 uppercase">
                       {t.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-blue-950/10 border border-blue-900/30 rounded-xl">
                <div className="text-blue-500 text-[7px] leading-tight font-black uppercase mb-2 tracking-widest flex items-center gap-2">
                  <ShieldAlert size={8} /> Memory_Lock
                </div>
                <div className="text-zinc-600 text-[7px] italic leading-relaxed uppercase">
                  Context injection active. All legacy layout and logic fixes have been hardened in the neural system.
                </div>
              </div>
           </div>
        </div>
      </div>
      
      <style>{`
        body { background: black; overflow: hidden; margin: 0; padding: 0; height: 100vh; width: 100vw; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
      `}</style>
    </div>
  );
                           }
