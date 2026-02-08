import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { Shield, Zap, Brain, Terminal, Cpu, GitBranch, RefreshCw, ChevronDown, ChevronUp, Database, FileCode, Construction, Timer, Activity } from 'lucide-react';

/**
 * AGI-KERNEL v5.6
 * Reverted naming. Maintained stabilization logic for 2,000+ file repositories.
 */

const INITIAL_STATE = {
  isBooted: false,
  isLive: false,
  status: 'IDLE',
  activeObjective: 'Awaiting Neural Link',
  cycleCount: 0,
  logs: [],
  config: { token: '', repo: 'craighckby-stack/Test-1', path: 'storage/AGI-Kernel.js', cerebrasKey: '', model: 'llama-3.3-70b' },
};

function reducer(state, action) {
  switch (action.type) {
    case 'BOOT': return { ...state, isBooted: true, config: { ...state.config, ...action.config } };
    case 'SET_LIVE': return { ...state, isLive: action.value, status: action.value ? 'STABILIZING' : 'STANDBY' };
    case 'SET_STATUS': return { ...state, status: action.value, activeObjective: action.objective || state.activeObjective };
    case 'LOG_UPDATE': return { ...state, logs: action.logs };
    case 'INCREMENT_CYCLE': return { ...state, cycleCount: state.cycleCount + 1 };
    default: return state;
  }
}

const utoa = (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode('0x' + p)));
const atou = (str) => { try { return decodeURIComponent(Array.prototype.map.call(atob(str), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')); } catch (e) { return atob(str); } };

const firebaseConfig = JSON.parse(__firebase_config);
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'agi-kernel-v5-6';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [user, setUser] = useState(null);
  const [showMeta, setShowMeta] = useState(true);
  const [bootInput, setBootInput] = useState({ token: '', repo: 'craighckby-stack/Test-1', path: 'storage/AGI-Kernel.js', cerebrasKey: '', model: 'llama-3.3-70b' });
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

  const executeKernelCycle = useCallback(async () => {
    if (!state.isLive && state.status !== 'MANUAL') return;
    const { token, repo, path, cerebrasKey, model } = state.config;

    try {
      dispatch({ type: 'SET_STATUS', value: 'THROTTLING', objective: 'Stabilizing API buffer...' });
      await sleep(3000); 

      dispatch({ type: 'SET_STATUS', value: 'INDEXING', objective: 'Scanning repository tree...' });
      const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees/main?recursive=1`, { headers: { 'Authorization': `token ${token}` } });
      const treeData = await treeRes.json();
      if (!treeData.tree) throw new Error("Repository tree unavailable.");
      const files = treeData.tree.filter(f => f.type === 'blob').map(f => f.path);
      await pushLog(`Indexed ${files.length} paths. Detecting dependencies...`, 'info');

      dispatch({ type: 'SET_STATUS', value: 'READING', objective: 'Reading current logic state...' });
      await sleep(1000);
      const kernelRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, { headers: { 'Authorization': `token ${token}` } });
      const kernelData = await kernelRes.json();
      if (!kernelData || !kernelData.content) throw new Error("Kernel buffer empty.");
      const currentKernelCode = atou(kernelData.content);

      dispatch({ type: 'SET_STATUS', value: 'EVOLVING', objective: 'Synthesizing neural enhancements...' });
      const aiRes = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cerebrasKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'Output JSON: { "roadmap": "string", "code_update": "string" }. Analyze the repo and improve the kernel.' },
            { role: 'user', content: `FILES: ${files.join(', ')}\n\nKERNEL:\n${currentKernelCode}` }
          ],
          response_format: { type: "json_object" }
        })
      });

      const aiJson = await aiRes.json();
      const response = JSON.parse(aiJson.choices[0].message.content);

      dispatch({ type: 'SET_STATUS', value: 'LOGGING', objective: 'Persisting roadmap to README...' });
      const readmeMetaRes = await fetch(`https://api.github.com/repos/${repo}/contents/README.md`, { headers: { 'Authorization': `token ${token}` } });
      const readmeMeta = await readmeMetaRes.json();
      await fetch(`https://api.github.com/repos/${repo}/contents/README.md`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "Kernel: Sync Roadmap",
          content: utoa(`# AGI-Kernel Roadmap\n\n${response.roadmap}`),
          sha: readmeMeta.sha
        })
      });

      await sleep(2000); 

      dispatch({ type: 'SET_STATUS', value: 'MUTATING', objective: 'Committing evolved logic...' });
      const mutationRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `AGI-Kernel Cycle ${state.cycleCount + 1}`,
          content: utoa(response.code_update),
          sha: kernelData.sha
        })
      });

      if (mutationRes.ok) {
        await pushLog(`Cycle #${state.cycleCount + 1} Success. Evolution stable.`, 'success');
        dispatch({ type: 'INCREMENT_CYCLE' });
      }

      dispatch({ type: 'SET_STATUS', value: 'STANDBY', objective: 'Cooling down...' });

    } catch (e) {
      await pushLog(`Kernel Error: ${e.message}`, 'error');
      dispatch({ type: 'SET_LIVE', value: false });
    }
  }, [state.isLive, state.config, state.cycleCount, pushLog]);

  useEffect(() => {
    if (state.isLive) {
      cycleTimer.current = setInterval(executeKernelCycle, 300000);
      executeKernelCycle();
    } else { clearInterval(cycleTimer.current); }
    return () => clearInterval(cycleTimer.current);
  }, [state.isLive, executeKernelCycle]);

  if (!state.isBooted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-xl shadow-blue-500/30 mb-4"><Zap size={30} /></div>
            <h1 className="text-white font-black text-2xl tracking-tighter">AGI-KERNEL</h1>
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">v5.6 Stabilized</p>
          </div>
          <div className="space-y-3">
            <input type="password" placeholder="GitHub Token" className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-white text-sm outline-none focus:ring-1 ring-blue-500" value={bootInput.token} onChange={e => setBootInput({...bootInput, token: e.target.value})} />
            <input type="password" placeholder="Cerebras Key" className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-white text-sm outline-none focus:ring-1 ring-blue-500" value={bootInput.cerebrasKey} onChange={e => setBootInput({...bootInput, cerebrasKey: e.target.value})} />
          </div>
          <button onClick={() => dispatch({ type: 'BOOT', config: bootInput })} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-blue-500 transition-all">Engage Neural Link</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-zinc-300 flex flex-col overflow-hidden font-sans">
      <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-6 bg-zinc-950/80 backdrop-blur-xl z-10">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800"><Activity size={18} className="text-blue-500" /></div>
          <div>
            <div className="text-white text-[12px] font-black uppercase tracking-widest">AGI-KERNEL</div>
            <div className="flex items-center gap-2 mt-0.5">
                <span className={`w-1 h-1 rounded-full ${state.isLive ? 'bg-blue-500 animate-pulse' : 'bg-zinc-700'}`} />
                <span className="text-[9px] font-mono text-zinc-600 uppercase">{state.status}</span>
            </div>
          </div>
        </div>
        <button onClick={() => dispatch({ type: 'SET_LIVE', value: !state.isLive })} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${state.isLive ? 'bg-zinc-900 text-zinc-500 border-zinc-800' : 'bg-blue-600 text-white border-blue-400'}`}>
          {state.isLive ? 'Dormant' : 'Evolution'}
        </button>
      </header>

      <div className="bg-zinc-950 border-b border-zinc-900">
        <button onClick={() => setShowMeta(!showMeta)} className="w-full px-6 py-2 flex items-center justify-between text-[8px] font-black text-zinc-600 uppercase tracking-widest">
          <span>Target: {state.config.repo}</span>
          {showMeta ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
        </button>
        {showMeta && (
          <div className="px-6 pb-4 grid grid-cols-2 gap-3 animate-in slide-in-from-top duration-300">
             <div className="p-3 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                <div className="text-[7px] text-zinc-600 uppercase font-black mb-1">Architecture</div>
                <div className="text-blue-400 text-[10px] font-mono truncate">2,016 Files Mapped</div>
             </div>
             <div className="p-3 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                <div className="text-[7px] text-zinc-600 uppercase font-black mb-1">Mutations</div>
                <div className="text-white text-[10px] font-mono">Cycle #{state.cycleCount}</div>
             </div>
          </div>
        )}
      </div>

      <main className="flex-1 flex flex-col p-4 overflow-hidden bg-[#020202]">
        <div className="flex items-center justify-between mb-2 px-2">
            <div className="flex items-center gap-2 text-zinc-600">
                <Terminal size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">Logic Stream</span>
            </div>
            <div className="text-[9px] text-blue-500/80 font-bold italic truncate max-w-[200px]">{state.activeObjective}</div>
        </div>

        <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-[2rem] flex flex-col overflow-hidden shadow-2xl">
          <div className="flex-1 overflow-y-auto p-6 font-mono text-[11px] space-y-3 scrollbar-hide">
            {state.logs.map(log => (
              <div key={log.id} className={`flex gap-4 p-2 rounded-lg transition-colors ${log.type === 'error' ? 'bg-red-500/5' : log.type === 'success' ? 'bg-blue-500/5' : 'hover:bg-zinc-900/30'}`}>
                <span className="text-zinc-800 shrink-0 text-[8px] pt-1 font-bold">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}
                </span>
                <span className={`leading-relaxed ${log.type === 'success' ? 'text-blue-400 font-bold' : log.type === 'error' ? 'text-red-400' : 'text-zinc-500'}`}>
                  {log.msg}
                </span>
              </div>
            ))}
          </div>
          {state.isLive && (
            <div className="h-0.5 bg-zinc-900 overflow-hidden shrink-0">
                <div className="h-full bg-blue-600 w-1/4 animate-[progress_2s_infinite_ease-in-out]" />
            </div>
          )}
        </div>
      </main>

      <footer className="h-10 border-t border-zinc-900 flex items-center justify-center text-[7px] font-black text-zinc-700 uppercase tracking-[0.4em] bg-black">
        AGI-KERNEL — Stabilized Neural Uplink — v5.6
      </footer>

      <style>{`
        @keyframes progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

