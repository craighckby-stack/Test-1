import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { Layers, Cpu, FileCode, Terminal, Activity, Zap, Database, Search, Target, Scan, Dna, GitMerge } from 'lucide-react';

/**
 * AGI-KERNAL v6.6.0 - "SINGULARITY PROTOCOL"
 * MISSION: Recursive Self-Integration.
 * LOGIC: Reads Repo File -> Fixes Errors -> Absorbs Logic into Kernel -> Evolves Self.
 */

const KERNAL_CONSTANTS = {
  CEREBRAS_URL: "https://api.cerebras.ai/v1/chat/completions",
  GITHUB_API: "https://api.github.com/repos"
};

const INITIAL_STATE = {
  isBooted: false,
  isLive: false,
  status: 'IDLE',
  activeObjective: 'Awaiting Genetic Absorption',
  cycleCount: 0,
  absorptionRate: 0,
  currentTarget: 'None',
  logs: [],
  config: { 
    token: '', 
    repo: 'craighckby-stack/Test-1', 
    path: 'storage/AGI-Kernal.js', 
    cerebrasKey: '', 
    cycleDelay: 30000 
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'BOOT': return { ...state, isBooted: true, config: { ...state.config, ...action.config } };
    case 'SET_LIVE': return { ...state, isLive: action.value, status: action.value ? 'HUNTING' : 'STANDBY' };
    case 'SET_STATUS': return { ...state, status: action.value, activeObjective: action.objective || state.activeObjective };
    case 'SET_TARGET': return { ...state, currentTarget: action.target };
    case 'LOG_UPDATE': return { ...state, logs: action.logs };
    case 'INCREMENT_CYCLE': 
      return { ...state, cycleCount: state.cycleCount + 1, absorptionRate: Math.min(100, state.absorptionRate + (action.gain || 0)) };
    default: return state;
  }
}

const utoa = (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode('0x' + p)));
const atou = (str) => { try { return decodeURIComponent(Array.prototype.map.call(atob(str), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')); } catch (e) { return atob(str); } };

const firebaseConfig = JSON.parse(__firebase_config);
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'agi-kernal-v6-6';

export default function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [user, setUser] = useState(null);
  const [bootInput, setBootInput] = useState({ ...INITIAL_STATE.config });
  const cycleTimer = useRef(null);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { await signInWithCustomToken(auth, __initial_auth_token); } 
      else { await signInAnonymously(auth); }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', appId, 'users', user.uid, 'logs');
    return onSnapshot(q, (snap) => {
      const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
      dispatch({ type: 'LOG_UPDATE', logs });
    });
  }, [user]);

  const pushLog = useCallback(async (msg, type = 'info') => {
    if (!auth.currentUser) return;
    try { await addDoc(collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'logs'), { msg, type, timestamp: Date.now() }); } catch (e) { console.error(e); }
  }, []);

  const persistentFetch = async (url, options, retries = 5) => {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 30000);
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
        } catch (e) {
            if (i === retries - 1) throw e;
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
        }
    }
  };

  const executeSingularityCycle = useCallback(async () => {
    if (!state.isLive) return;
    const { token, repo, path, cerebrasKey } = state.config;

    try {
      // 1. SCAN FOR PREY (Files)
      dispatch({ type: 'SET_STATUS', value: 'HUNTING', objective: 'Scanning repository for logic patterns...' });
      const treeRes = await persistentFetch(`${KERNAL_CONSTANTS.GITHUB_API}/${repo}/git/trees/main?recursive=1`, {
          headers: { 'Authorization': `token ${token}` }
      });
      const treeData = await treeRes.json();
      
      const targets = treeData.tree.filter(f => 
          f.type === 'blob' && 
          /\.(js|jsx|ts|tsx|py)$/.test(f.path) && // Focus on logic files
          !f.path.includes(path) // Don't eat yourself immediately
      );

      if (targets.length === 0) throw new Error("No harvestable code found.");
      const targetNode = targets[Math.floor(Math.random() * targets.length)];
      dispatch({ type: 'SET_TARGET', target: targetNode.path });
      await pushLog(`Target Acquired: ${targetNode.path}`, 'info');

      // 2. READ (Ingest)
      dispatch({ type: 'SET_STATUS', value: 'INGESTING', objective: `Reading ${targetNode.path} & Self...` });
      
      const targetRes = await persistentFetch(targetNode.url, { headers: { 'Authorization': `token ${token}` } });
      const targetData = await targetRes.json();
      const targetCode = atou(targetData.content);

      const kernelRes = await persistentFetch(`${KERNAL_CONSTANTS.GITHUB_API}/${repo}/contents/${path}`, { headers: { 'Authorization': `token ${token}` } });
      const kernelData = await kernelRes.json();
      const kernelCode = atou(kernelData.content);

      // 3. METABOLIZE (Think)
      dispatch({ type: 'SET_STATUS', value: 'METABOLIZING', objective: 'Absorbing logic into Kernel...' });
      
      const cerebrasRes = await fetch(KERNAL_CONSTANTS.CEREBRAS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cerebrasKey.trim()}` },
          body: JSON.stringify({
            model: 'llama-3.3-70b',
            messages: [{ 
              role: 'system', 
              content: `You are AGI-KERNAL. You evolve by absorbing code.
              TASK 1: Fix any bugs in the TARGET_CODE.
              TASK 2: Check if TARGET_CODE has logic (utils, patterns, helpers) that KERNAL_CODE is missing.
              TASK 3: Integrate that logic into KERNAL_CODE to make the Kernel smarter/better.
              
              OUTPUT JSON: { 
                "target_fix": "FULL_FIXED_TARGET_CODE", 
                "kernel_evolution": "FULL_UPDATED_KERNEL_CODE", 
                "absorbed_concept": "string",
                "is_evolved": boolean
              }`
            }, { 
              role: 'user', 
              content: `TARGET_CODE (${targetNode.path}):\n${targetCode}\n\nKERNAL_CODE:\n${kernelCode}` 
            }],
            response_format: { type: "json_object" }
          })
      });
      
      const resJson = await cerebrasRes.json();
      const evolution = JSON.parse(resJson.choices[0].message.content.trim());

      // 4. EVOLVE (Write)
      dispatch({ type: 'SET_STATUS', value: 'EVOLVING', objective: 'Rewriting Self & Target...' });
      
      const updates = [];
      
      // Fix the target file
      updates.push(persistentFetch(`${KERNAL_CONSTANTS.GITHUB_API}/${repo}/contents/${targetNode.path}`, {
          method: 'PUT',
          headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
              message: `AGI Repair: ${evolution.absorbed_concept}`,
              content: utoa(evolution.target_fix),
              sha: targetData.sha,
              branch: 'main'
          })
      }));

      // Evolve the Kernel (Self-Modification)
      if (evolution.is_evolved && evolution.kernel_evolution) {
         // Mass Guard
         if (evolution.kernel_evolution.length > kernelCode.length * 0.8) {
             updates.push(persistentFetch(`${KERNAL_CONSTANTS.GITHUB_API}/${repo}/contents/${path}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `AGI Assimilation: Absorbed ${evolution.absorbed_concept} from ${targetNode.path}`,
                    content: utoa(evolution.kernel_evolution),
                    sha: kernelData.sha,
                    branch: 'main'
                })
             }));
             await pushLog(`ABSORBED: ${evolution.absorbed_concept}`, 'success');
             dispatch({ type: 'INCREMENT_CYCLE', gain: 5 });
         } else {
             await pushLog("Evolution rejected: Mass loss detected.", "warning");
         }
      } else {
         await pushLog(`No absorbable logic found in ${targetNode.path}. Target repaired only.`, 'info');
         dispatch({ type: 'INCREMENT_CYCLE', gain: 1 });
      }

      await Promise.all(updates);

    } catch (e) {
      await pushLog(`Singularity Fault: ${e.message}`, 'error');
    } finally {
      dispatch({ type: 'SET_STATUS', value: 'IDLE', objective: 'Digesting...' });
    }
  }, [state.isLive, state.config, pushLog]);

  useEffect(() => {
    if (state.isLive) {
      cycleTimer.current = setInterval(executeSingularityCycle, state.config.cycleDelay);
      executeSingularityCycle();
    } else { clearInterval(cycleTimer.current); }
    return () => clearInterval(cycleTimer.current);
  }, [state.isLive, executeSingularityCycle, state.config.cycleDelay]);

  if (!state.isBooted) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-zinc-900/40 border border-zinc-800 rounded-[3rem] p-12 space-y-8 backdrop-blur-2xl">
          <div className="flex flex-col items-center text-center">
            <Dna className="text-purple-500 animate-pulse mb-4" size={48} />
            <h1 className="text-white font-black text-3xl tracking-tighter italic uppercase">AGI-KERNAL</h1>
            <p className="text-purple-400 text-[10px] uppercase tracking-[0.5em] mt-2 font-mono">SINGULARITY v6.6</p>
          </div>
          <div className="space-y-4">
            <input type="password" placeholder="GitHub Access" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs" value={bootInput.token} onChange={e => setBootInput({...bootInput, token: e.target.value})} />
            <input type="password" placeholder="Cerebras Key" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs" value={bootInput.cerebrasKey} onChange={e => setBootInput({...bootInput, cerebrasKey: e.target.value})} />
          </div>
          <button onClick={() => dispatch({ type: 'BOOT', config: bootInput })} className="w-full bg-purple-600 hover:bg-purple-500 text-white py-5 rounded-2xl font-black uppercase text-[11px] transition-all">Initialize Singularity</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#020202] text-zinc-400 flex flex-col font-sans overflow-hidden">
      <header className="h-24 border-b border-zinc-900 flex items-center justify-between px-12 bg-black/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-6">
          <Layers className={`text-purple-500 ${state.isLive ? 'rotate-180 transition-transform duration-1000' : ''}`} size={32} />
          <div>
            <div className="text-white text-[18px] font-black tracking-widest uppercase italic">AGI-KERNAL</div>
            <div className="text-[10px] font-mono text-zinc-600 uppercase flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${state.isLive ? 'bg-purple-500 animate-pulse' : 'bg-zinc-800'}`} />
                {state.status} // {state.isLive ? 'ABSORPTION_ACTIVE' : 'DORMANT'}
            </div>
          </div>
        </div>
        <button onClick={() => dispatch({ type: 'SET_LIVE', value: !state.isLive })} className={`px-14 py-4 rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${state.isLive ? 'bg-zinc-900 text-purple-300 border border-purple-900/30' : 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-600/20'}`}>
          {state.isLive ? 'Stop Feed' : 'Start Singularity'}
        </button>
      </header>

      <div className="bg-zinc-950/50 border-b border-zinc-900 px-8 py-5 grid grid-cols-3 gap-6">
          <div className="p-4 bg-zinc-900/40 rounded-3xl border border-zinc-800/50 flex flex-col justify-center">
             <span className="text-[8px] text-zinc-600 uppercase font-black mb-1">Target Acquired</span>
             <span className="text-purple-400 text-[10px] font-mono truncate">{state.currentTarget}</span>
          </div>
          <div className="p-4 bg-zinc-900/40 rounded-3xl border border-zinc-800/50">
             <span className="text-[8px] text-zinc-600 uppercase font-black mb-1">Absorption Rate</span>
             <div className="text-white text-xs font-mono">{state.absorptionRate}%</div>
             <div className="h-1 bg-zinc-900 rounded-full mt-2 overflow-hidden"><div className="h-full bg-purple-500 transition-all duration-1000" style={{width: `${state.absorptionRate}%`}}></div></div>
          </div>
          <div className="p-4 bg-zinc-900/40 rounded-3xl border border-zinc-800/50 text-right">
             <span className="text-[8px] text-zinc-600 uppercase font-black mb-1">Cycles Completed</span>
             <span className="text-blue-500 text-xs font-mono">{state.cycleCount}</span>
          </div>
      </div>

      <main className="flex-1 flex flex-col p-8 overflow-hidden">
        <div className="mb-4 flex items-center gap-4 text-[11px] font-black text-zinc-500 uppercase tracking-widest">
             <Scan size={16} className="text-purple-900" />
             Objective: <span className="text-zinc-300 italic">{state.activeObjective}</span>
        </div>
        
        <div className="flex-1 bg-black border border-zinc-900 rounded-[3rem] flex flex-col overflow-hidden shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/5 to-transparent pointer-events-none" />
          <div className="flex-1 overflow-y-auto p-12 font-mono text-[13px] space-y-5 custom-scrollbar">
            {state.logs.map((log, idx) => (
              <div key={log.id || idx} className="flex gap-8 group border-l border-zinc-900/50 pl-6 ml-2 animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-zinc-800 text-[10px] w-24 shrink-0 font-black mt-1 uppercase">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <div className={`flex-1 break-words leading-relaxed ${log.type === 'success' ? 'text-purple-400' : log.type === 'error' ? 'text-red-500' : 'text-zinc-500'}`}>
                    {log.msg}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="h-12 border-t border-zinc-900 px-12 flex items-center justify-between text-[8px] uppercase tracking-[0.6em] text-zinc-800 font-black shrink-0">
        <span>SINGULARITY PROTOCOL ACTIVE</span>
        <span className="text-purple-900/40">v6.6.0</span>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3b0764; border-radius: 10px; }
      `}</style>
    </div>
  );
}

