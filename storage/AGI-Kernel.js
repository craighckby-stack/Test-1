import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { Zap, Brain, Terminal, Cpu, GitBranch, Activity, AlertTriangle, Target, Lock, Globe, Search } from 'lucide-react';

/**
 * AGI-KERNEL v5.9.4
 * RESTORATION: Core Mission Logic & Strategic Mutation
 * MISSION: Read main/system, enhance, and mutate system branch upon maturity.
 */

const INITIAL_STATE = {
  isBooted: false,
  isLive: false,
  status: 'IDLE',
  activeObjective: 'Awaiting Strategic Input',
  cycleCount: 0,
  maturityScore: 0,
  logs: [],
  config: { 
    token: '', 
    repo: 'craighckby-stack/Test-1', 
    path: 'storage/AGI-Kernel.js', 
    cerebrasKey: '', 
    model: 'llama-3.3-70b',
    threshold: 5 // Minimum cycles before System Branch Mutation
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'BOOT': return { ...state, isBooted: true, config: { ...state.config, ...action.config } };
    case 'SET_LIVE': return { ...state, isLive: action.value, status: action.value ? 'STABILIZING' : 'STANDBY' };
    case 'SET_STATUS': return { ...state, status: action.value, activeObjective: action.objective || state.activeObjective };
    case 'LOG_UPDATE': return { ...state, logs: action.logs };
    case 'INCREMENT_CYCLE': 
      return { ...state, cycleCount: state.cycleCount + 1, maturityScore: action.maturity || state.maturityScore };
    case 'RESET_MATURITY': return { ...state, maturityScore: 0, cycleCount: 0 };
    default: return state;
  }
}

const utoa = (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode('0x' + p)));
const atou = (str) => { try { return decodeURIComponent(Array.prototype.map.call(atob(str), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')); } catch (e) { return atob(str); } };

const firebaseConfig = JSON.parse(__firebase_config);
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'agi-kernel-v5-9-4';

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

  const persistentFetch = async (url, options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 15000);
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
        } catch (e) {
            if (i === retries - 1) throw e;
            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
    }
  };

  const fetchFile = async (repo, path, branch, token) => {
    const res = await persistentFetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}&t=${Date.now()}`, { 
        headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' } 
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { content: atou(data.content), sha: data.sha };
  };

  const executeKernelCycle = useCallback(async () => {
    if (!state.isLive) return;
    const { token, repo, path, cerebrasKey, model, threshold } = state.config;

    try {
      dispatch({ type: 'SET_STATUS', value: 'SYNCING', objective: 'Aggregating Strategic Context...' });
      
      const mainContext = await fetchFile(repo, path, 'main', token);
      if (!mainContext) throw new Error("Main branch source missing.");

      const systemContext = await fetchFile(repo, path, 'System', token);
      const systemCode = systemContext ? systemContext.content : "// Initialize System Baseline";

      dispatch({ type: 'SET_STATUS', value: 'EVOLVING', objective: 'Simulating AGI Logic Mutation...' });
      
      const aiRes = await persistentFetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cerebrasKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { 
              role: 'system', 
              content: `You are the AGI-Kernel Core. Your mission is to evolve the provided .js code.
              STRATEGY:
              1. Analyze Main branch code for logic errors or efficiency gaps.
              2. Compare with System branch code (the stable baseline).
              3. Produce an enhanced version of the logic.
              4. Rate the "maturity_rating" from 0-100. (100 = Final, immutable logic).
              OUTPUT ONLY VALID JSON: { "code_update": "string", "maturity_rating": number, "thought_process": "string" }` 
            },
            { 
              role: 'user', 
              content: `MAIN_CODE:\n${mainContext.content}\n\nSYSTEM_CODE:\n${systemCode}\n\nEvolution Task: Enhance the logic. Aim for stability and recursion.` 
            }
          ],
          response_format: { type: "json_object" }
        })
      });

      const aiJson = await aiRes.json();
      const response = JSON.parse(aiJson.choices[0].message.content);

      dispatch({ type: 'SET_STATUS', value: 'MUTATING', objective: 'Updating Main Logic...' });
      
      // Atomic Sync for Main
      const freshMain = await fetchFile(repo, path, 'main', token);
      const mainCommit = await persistentFetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `AGI Mutation Cycle ${state.cycleCount + 1}: ${response.maturity_rating}% Mature`,
          content: utoa(response.code_update),
          sha: freshMain.sha,
          branch: 'main'
        })
      });

      if (!mainCommit.ok) throw new Error("Main Commit Failure");
      await pushLog(`Mutation applied to Main. Maturity: ${response.maturity_rating}%`, 'success');

      // Promotion Logic to System Branch
      if (response.maturity_rating >= 90 || state.cycleCount >= threshold) {
        dispatch({ type: 'SET_STATUS', value: 'PROMOTING', objective: 'Executing System Branch Mutation...' });
        
        const freshSystem = await fetchFile(repo, path, 'System', token);
        if (freshSystem) {
            const systemCommit = await persistentFetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `SYSTEM EVOLUTION: Logic reached stability threshold.`,
                    content: utoa(response.code_update),
                    sha: freshSystem.sha,
                    branch: 'System'
                })
            });
            if (systemCommit.ok) {
                await pushLog("SYSTEM BRANCH MUTATED: Logic Promoted.", "success");
                dispatch({ type: 'RESET_MATURITY' });
            }
        }
      } else {
        dispatch({ type: 'INCREMENT_CYCLE', maturity: response.maturity_rating });
      }

      dispatch({ type: 'SET_STATUS', value: 'IDLE', objective: 'Thermal Cooldown...' });

    } catch (e) {
      await pushLog(`Logic Fault: ${e.message}`, 'error');
      dispatch({ type: 'SET_LIVE', value: false });
    }
  }, [state.isLive, state.config, state.cycleCount, pushLog]);

  useEffect(() => {
    if (state.isLive) {
      cycleTimer.current = setInterval(executeKernelCycle, 60000); 
      executeKernelCycle();
    } else { clearInterval(cycleTimer.current); }
    return () => clearInterval(cycleTimer.current);
  }, [state.isLive, executeKernelCycle]);

  if (!state.isBooted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 space-y-6">
          <div className="flex flex-col items-center">
            <Brain className="text-blue-500 mb-4" size={48} />
            <h1 className="text-white font-black text-2xl tracking-tighter italic">KERNEL 5.9.4</h1>
            <p className="text-zinc-600 text-[9px] uppercase tracking-widest mt-1 font-bold">Strategic Evolution Protocol</p>
          </div>
          <div className="space-y-2">
            <input type="password" placeholder="GitHub PAT" className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none focus:border-blue-500" value={bootInput.token} onChange={e => setBootInput({...bootInput, token: e.target.value})} />
            <input type="password" placeholder="Cerebras Key" className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none focus:border-blue-500" value={bootInput.cerebrasKey} onChange={e => setBootInput({...bootInput, cerebrasKey: e.target.value})} />
          </div>
          <button onClick={() => dispatch({ type: 'BOOT', config: bootInput })} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-600/20">Boot Logic Engine</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-zinc-300 flex flex-col font-sans overflow-hidden">
      <header className="h-20 border-b border-zinc-900 flex items-center justify-between px-8 bg-black/50 backdrop-blur-xl z-10">
        <div className="flex items-center gap-4">
          <Activity className="text-blue-500 animate-pulse" size={24} />
          <div>
            <div className="text-white text-[12px] font-black tracking-widest uppercase italic">AGI-Kernel v5.9.4</div>
            <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-tighter">{state.status}</div>
          </div>
        </div>
        <button onClick={() => dispatch({ type: 'SET_LIVE', value: !state.isLive })} className={`px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${state.isLive ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-600 text-white'}`}>
          {state.isLive ? 'Terminate' : 'Engage Strategic Logic'}
        </button>
      </header>

      <div className="bg-zinc-950/50 border-b border-zinc-900 px-8 py-5 grid grid-cols-3 gap-10">
          <div className="space-y-2">
              <div className="flex justify-between text-[8px] text-zinc-600 uppercase font-black tracking-widest">
                  <span>Logic Maturity</span>
                  <span>{state.maturityScore}%</span>
              </div>
              <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{width: `${state.maturityScore}%`}} />
              </div>
          </div>
          <div className="space-y-1">
              <div className="text-[8px] text-zinc-600 uppercase font-black flex items-center gap-1"><GitBranch size={10}/> Target Branch</div>
              <div className="text-white text-xs font-mono">{state.config.repo.split('/')[1]} / System</div>
          </div>
          <div className="space-y-1 text-right">
              <div className="text-[8px] text-zinc-600 uppercase font-black flex items-center gap-1 justify-end"><Target size={10}/> Mutation Threshold</div>
              <div className="text-blue-500 text-xs font-mono">{Math.max(0, state.config.threshold - state.cycleCount)} Cycles to Release</div>
          </div>
      </div>

      <main className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="mb-3 px-2 flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic">
            <Terminal size={14} className="text-blue-900" />
            {state.activeObjective}
        </div>
        <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl">
          <div className="flex-1 overflow-y-auto p-8 font-mono text-[11px] space-y-4 custom-scrollbar">
            {state.logs.map(log => (
              <div key={log.id} className="flex gap-5 group animate-in slide-in-from-bottom-1 duration-300">
                <span className="text-zinc-800 text-[9px] w-14 shrink-0 mt-0.5">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, second: '2-digit' })}</span>
                <span className={`flex-1 ${log.type === 'success' ? 'text-blue-400 font-bold' : log.type === 'error' ? 'text-red-500' : 'text-zinc-500'}`}>
                    {log.type === 'error' && <AlertTriangle size={10} className="inline mr-2" />}
                    {log.msg}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="h-10 border-t border-zinc-900 px-8 flex items-center text-[8px] uppercase tracking-widest text-zinc-700 font-black">
        MISSION STATUS: DUAL-BRANCH MUTATION ENGINE — READY
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #18181b; border-radius: 10px; }
      `}</style>
    </div>
  );
}

