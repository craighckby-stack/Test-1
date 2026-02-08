import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, doc, getDoc, setDoc, collection, onSnapshot, addDoc, query, limit 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged 
} from 'firebase/auth';
import { 
  Activity, Shield, Zap, Brain, Terminal, Layers, Power, AlertCircle, CheckCircle2, Cpu, GitBranch, Settings, Info, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';

/**
 * SOVEREIGN AGI KERNEL V5.2 - MOBILE OPTIMIZED
 * Fixes "Right side unviewable" issue by using a responsive stack.
 */

const INITIAL_STATE = {
  isBooted: false,
  isLive: false,
  status: 'SYSTEM_READY',
  activeObjective: 'Awaiting Activation',
  cycleCount: 0,
  logs: [],
  config: { token: '', repo: '', path: '', cerebrasKey: '', model: 'llama-3.3-70b' },
};

function reducer(state, action) {
  switch (action.type) {
    case 'BOOT': return { ...state, isBooted: true, config: { ...state.config, ...action.config } };
    case 'SET_LIVE': return { ...state, isLive: action.value, status: action.value ? 'LIVE_EVOLUTION' : 'STANDBY' };
    case 'SET_STATUS': return { ...state, status: action.value, activeObjective: action.objective || state.activeObjective };
    case 'LOG_UPDATE': return { ...state, logs: action.logs };
    case 'INCREMENT_CYCLE': return { ...state, cycleCount: state.cycleCount + 1 };
    default: return state;
  }
}

const utoa = (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode('0x' + p)));
const atou = (str) => {
    try {
        return decodeURIComponent(Array.prototype.map.call(atob(str), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    } catch (e) { return atob(str); }
};

const firebaseConfig = JSON.parse(__firebase_config);
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'sovereign-v5-2';

export default function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [user, setUser] = useState(null);
  const [showMeta, setShowMeta] = useState(false); // Mobile toggle for stats
  const [bootInput, setBootInput] = useState({ 
    token: '', 
    repo: 'craighckby-stack/Test-1', 
    path: 'storage/AGI-Kernel.js', 
    cerebrasKey: '', 
    model: 'llama-3.3-70b' 
  });
  
  const cycleTimer = useRef(null);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', appId, 'users', user.uid, 'logs');
    return onSnapshot(q, (snap) => {
      const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 50);
      dispatch({ type: 'LOG_UPDATE', logs });
    }, (err) => console.error("Firestore Err:", err));
  }, [user]);

  const pushLog = useCallback(async (msg, type = 'info') => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'logs'), { 
        msg, type, timestamp: Date.now() 
      });
    } catch (e) { console.error(e); }
  }, []);

  const executeCycle = useCallback(async () => {
    if (!state.isLive && state.status !== 'MANUAL_TRIGGER') return;
    dispatch({ type: 'SET_STATUS', value: 'READING_SOURCE', objective: `Accessing ${state.config.path}...` });
    try {
      const { token, repo, path, cerebrasKey, model } = state.config;
      const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
      });
      if (!res.ok) throw new Error(`GitHub Error: ${res.statusText}`);
      const fileData = await res.json();
      const currentCode = atou(fileData.content);
      await pushLog(`Source Code Locked (SHA: ${fileData.sha.substring(0,8)})`, "info");

      dispatch({ type: 'SET_STATUS', value: 'THINKING', objective: 'Optimizing kernel logic via Cerebras...' });
      const cerRes = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cerebrasKey}` },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: 'Return only optimized code.' }, { role: 'user', content: currentCode }]
        })
      });
      if (!cerRes.ok) throw new Error("Cerebras unreachable.");
      const aiData = await cerRes.json();
      const newCode = aiData.choices?.[0]?.message?.content?.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '') || "";

      dispatch({ type: 'SET_STATUS', value: 'COMMITTING', objective: 'Syncing evolution...' });
      const commit = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Sovereign Evolution Cycle #${state.cycleCount + 1}`,
          content: utoa(newCode),
          sha: fileData.sha
        })
      });
      if (!commit.ok) throw new Error("GitHub Write Failed.");
      await pushLog(`Evolution #${state.cycleCount + 1} finalized.`, "success");
      dispatch({ type: 'INCREMENT_CYCLE' });
      dispatch({ type: 'SET_STATUS', value: 'STANDBY', objective: 'Monitoring environment...' });
    } catch (e) {
      await pushLog(e.message, "error");
      dispatch({ type: 'SET_STATUS', value: 'IDLE_ERROR', objective: e.message });
      dispatch({ type: 'SET_LIVE', value: false });
    }
  }, [state.isLive, state.config, state.cycleCount, pushLog]);

  useEffect(() => {
    if (state.isLive) {
      cycleTimer.current = setInterval(executeCycle, 300000);
      executeCycle();
    } else {
      clearInterval(cycleTimer.current);
    }
    return () => clearInterval(cycleTimer.current);
  }, [state.isLive, executeCycle]);

  if (!state.isBooted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><Shield size={20} /></div>
            <h1 className="text-white font-bold">Kernel Boot v5.2</h1>
          </div>
          <div className="space-y-4">
            <input type="password" placeholder="GitHub Token" className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-white text-sm outline-none" value={bootInput.token} onChange={e => setBootInput({...bootInput, token: e.target.value})} />
            <input type="password" placeholder="Cerebras Key" className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-white text-sm outline-none" value={bootInput.cerebrasKey} onChange={e => setBootInput({...bootInput, cerebrasKey: e.target.value})} />
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-[10px] text-zinc-500 font-mono">
                REPO: {bootInput.repo}<br/>PATH: {bootInput.path}
            </div>
          </div>
          <button onClick={() => dispatch({ type: 'BOOT', config: bootInput })} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Initiate</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-zinc-300 flex flex-col overflow-hidden">
      {/* HEADER */}
      <header className="shrink-0 h-14 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Cpu size={16} className="text-blue-500" />
          <div>
            <div className="text-white text-xs font-bold uppercase tracking-tighter">Sovereign Kernel</div>
            <div className="text-[8px] text-zinc-600 font-black flex items-center gap-1 uppercase">
               <span className={`w-1 h-1 rounded-full ${state.isLive ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
               {state.status}
            </div>
          </div>
        </div>
        <button 
          onClick={() => dispatch({ type: 'SET_LIVE', value: !state.isLive })}
          className={`px-4 py-1.5 rounded-lg font-bold text-[10px] transition-all ${
            state.isLive ? 'bg-red-500/10 text-red-500 border border-red-500/30' : 'bg-blue-600 text-white'
          }`}
        >
          {state.isLive ? 'STOP' : 'AUTO-PILOT'}
        </button>
      </header>

      {/* MOBILE COLLAPSIBLE METADATA (Replaces Sidebar on Small Screens) */}
      <div className="bg-zinc-950 border-b border-zinc-900">
        <button 
          onClick={() => setShowMeta(!showMeta)}
          className="w-full px-4 py-2 flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase"
        >
          <span className="flex items-center gap-2"><GitBranch size={10}/> Telemetry & Stats</span>
          {showMeta ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
        </button>
        
        {showMeta && (
          <div className="px-4 pb-4 grid grid-cols-2 gap-2 animate-in slide-in-from-top duration-200">
             <div className="p-2 bg-zinc-900 rounded border border-zinc-800">
                <div className="text-[7px] text-zinc-600 uppercase">Cycles</div>
                <div className="text-white text-xs font-mono">{state.cycleCount}</div>
             </div>
             <div className="p-2 bg-zinc-900 rounded border border-zinc-800">
                <div className="text-[7px] text-zinc-600 uppercase">Model</div>
                <div className="text-amber-500 text-xs font-mono truncate">{state.config.model}</div>
             </div>
             <div className="col-span-2 p-2 bg-zinc-900 rounded border border-zinc-800">
                <div className="text-[7px] text-zinc-600 uppercase">Path</div>
                <div className="text-blue-400 text-[9px] font-mono truncate">{state.config.path}</div>
             </div>
          </div>
        )}
      </div>

      {/* TERMINAL (FULL WIDTH) */}
      <main className="flex-1 flex flex-col p-3 overflow-hidden bg-black">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 px-1">
                <Terminal size={12} className="text-zinc-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Kernel Stream</span>
            </div>
            <div className="text-[9px] text-blue-400 font-mono italic px-2">
                {state.activeObjective}
            </div>
        </div>

        <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-xl flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed space-y-2 scroll-smooth">
            {state.logs.length === 0 && <div className="text-zinc-800 animate-pulse">Waiting for uplink...</div>}
            {state.logs.map(log => (
              <div key={log.id} className="flex gap-3 border-l border-zinc-800 pl-3 py-0.5">
                <span className="text-zinc-700 shrink-0 text-[8px] w-12 pt-0.5">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className={
                  log.type === 'error' ? 'text-red-500 font-bold' : 
                  log.type === 'success' ? 'text-emerald-400 font-bold' : 'text-zinc-400'
                }>
                  {log.msg}
                </span>
              </div>
            ))}
          </div>
          {state.isLive && (
            <div className="h-1 bg-zinc-900 relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-blue-500 w-1/3 animate-[loading_1.5s_infinite_linear]" />
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
      `}</style>
    </div>
  );
}

