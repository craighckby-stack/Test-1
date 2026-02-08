import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { Shield, Zap, Brain, Terminal, Cpu, GitBranch, RefreshCw, ChevronDown, ChevronUp, Database, FileCode, Construction, Timer, Activity, AlertTriangle, Layers, Target, Lock, Globe } from 'lucide-react';

const INITIAL_STATE = {
  isBooted: false,
  isLive: false,
  status: 'IDLE',
  activeObjective: 'Awaiting Neural Link',
  cycleCount: 0,
  maturityScore: 0,
  logs: [],
  config: { 
    token: '', 
    repo: 'craighckby-stack/Test-1', 
    path: 'storage/AGI-Kernel.js', 
    cerebrasKey: '', 
    model: 'llama-3.3-70b',
    threshold: 5 
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'BOOT': return { ...state, isBooted: true, config: { ...state.config, ...action.config } };
    case 'SET_LIVE': return { ...state, isLive: action.value, status: action.value ? 'STABILIZING' : 'STANDBY' };
    case 'SET_STATUS': return { ...state, status: action.value, activeObjective: action.objective || state.activeObjective };
    case 'LOG_UPDATE': return { ...state, logs: action.logs };
    case 'INCREMENT_CYCLE': return { ...state, cycleCount: state.cycleCount + 1, maturityScore: action.maturity || state.maturityScore };
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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'agi-kernel-v5-9-1';

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
    }, (err) => console.error("Firestore Error:", err));
  }, [user]);

  const pushLog = useCallback(async (msg, type = 'info') => {
    if (!auth.currentUser) return;
    try { await addDoc(collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'logs'), { msg, type, timestamp: Date.now() }); } catch (e) { console.error(e); }
  }, []);

  const safeFetch = async (url, options, timeout = 15000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
  };

  const fetchFile = async (repo, path, branch, token) => {
    try {
        const res = await safeFetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`, { 
            headers: { 
                'Authorization': `token ${token}`, 
                'Accept': 'application/vnd.github.v3+json',
                'Cache-Control': 'no-cache' 
            } 
        });
        if (!res.ok) return null;
        const data = await res.json();
        return { content: atou(data.content), sha: data.sha };
    } catch (e) {
        return null;
    }
  };

  const executeKernelCycle = useCallback(async () => {
    if (!state.isLive) return;
    const { token, repo, path, cerebrasKey, model, threshold } = state.config;

    try {
      dispatch({ type: 'SET_STATUS', value: 'SYNCING', objective: 'Contacting GitHub Edge...' });
      
      const mainContext = await fetchFile(repo, path, 'main', token);
      if (!mainContext) throw new Error("GitHub Connectivity Failure (Main Branch)");

      const systemContext = await fetchFile(repo, path, 'System', token);
      const systemCode = systemContext ? systemContext.content : "No System Branch Found";

      dispatch({ type: 'SET_STATUS', value: 'EVOLVING', objective: 'Consulting Cerebras Inference...' });
      
      const aiRes = await safeFetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${cerebrasKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: `You are AGI-Kernel. Output ONLY JSON: { "code_update": "string", "maturity_rating": number }` },
            { role: 'user', content: `Current Main:\n${mainContext.content}\n\nSystem Baseline:\n${systemCode}\n\nInstruction: Iterate on logic. If optimized, maturity > 80.` }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!aiRes.ok) {
        const errText = await aiRes.text();
        throw new Error(`Cerebras API Error: ${aiRes.status}`);
      }

      const aiJson = await aiRes.json();
      const response = JSON.parse(aiJson.choices[0].message.content);

      dispatch({ type: 'SET_STATUS', value: 'LOCKING', objective: 'Securing Final SHA...' });
      const freshMain = await fetchFile(repo, path, 'main', token);

      dispatch({ type: 'SET_STATUS', value: 'MUTATING', objective: 'Committing to Main...' });
      const mainMutation = await safeFetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: { 
            'Authorization': `token ${token}`, 
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: `AGI Evolution Cycle ${state.cycleCount + 1}`,
          content: utoa(response.code_update),
          sha: freshMain.sha,
          branch: 'main'
        })
      });

      if (!mainMutation.ok) throw new Error(`Commit Rejected: ${mainMutation.status}`);
      
      await pushLog(`Evolution Success. Maturity: ${response.maturity_rating}%`, 'success');

      if (response.maturity_rating >= 95 || state.cycleCount >= threshold) {
        dispatch({ type: 'SET_STATUS', value: 'PROMOTING', objective: 'Merging to System...' });
        const freshSystem = await fetchFile(repo, path, 'System', token);
        if (freshSystem) {
            await safeFetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  message: `SYSTEM UPDATE: Level ${response.maturity_rating}`,
                  content: utoa(response.code_update),
                  sha: freshSystem.sha,
                  branch: 'System'
                })
            });
            await pushLog("SYSTEM ARCHITECTURE UPDATED", "success");
            dispatch({ type: 'RESET_MATURITY' });
        }
      } else {
        dispatch({ type: 'INCREMENT_CYCLE', maturity: response.maturity_rating });
      }

      dispatch({ type: 'SET_STATUS', value: 'IDLE', objective: 'Awaiting Next Cycle' });

    } catch (e) {
      await pushLog(`Kernel Exception: ${e.message}`, 'error');
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
          <div className="flex flex-col items-center text-center">
            <div className="bg-blue-600 p-4 rounded-3xl text-white mb-4 shadow-2xl shadow-blue-500/20"><Zap size={32} /></div>
            <h1 className="text-white font-black text-2xl tracking-tighter uppercase italic">Kernel 5.9.1</h1>
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-2">Neural Synchronization Protocol</p>
          </div>
          <div className="space-y-3">
            <div className="relative">
                <input type="password" placeholder="GitHub PAT" className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-white text-sm outline-none focus:border-blue-500 transition-colors" value={bootInput.token} onChange={e => setBootInput({...bootInput, token: e.target.value})} />
                <Lock className="absolute right-4 top-4 text-zinc-700" size={16} />
            </div>
            <div className="relative">
                <input type="password" placeholder="Cerebras Key" className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-white text-sm outline-none focus:border-blue-500 transition-colors" value={bootInput.cerebrasKey} onChange={e => setBootInput({...bootInput, cerebrasKey: e.target.value})} />
                <Brain className="absolute right-4 top-4 text-zinc-700" size={16} />
            </div>
          </div>
          <button onClick={() => dispatch({ type: 'BOOT', config: bootInput })} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all transform active:scale-95 shadow-xl shadow-blue-600/20">Establish Link</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-zinc-300 flex flex-col overflow-hidden font-sans">
      <header className="h-20 border-b border-zinc-900 flex items-center justify-between px-8 bg-black/50 backdrop-blur-xl z-20">
        <div className="flex items-center gap-5">
          <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800"><Globe size={20} className="text-blue-500" /></div>
          <div>
            <div className="text-white text-[13px] font-black uppercase tracking-widest flex items-center gap-2">
              AGI-KERNEL 5.9.1
              <span className="text-[9px] text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded-md border border-blue-500/20 font-mono">CORS-SAFE</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${state.isLive ? 'bg-blue-500 animate-pulse' : 'bg-red-900 shadow-[0_0_8px_rgba(255,0,0,0.5)]'}`} />
                <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-tighter">{state.status}</span>
            </div>
          </div>
        </div>
        <button onClick={() => dispatch({ type: 'SET_LIVE', value: !state.isLive })} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${state.isLive ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/20'}`}
        >
          {state.isLive ? 'Emergency Stop' : 'Initiate Sequence'}
        </button>
      </header>

      <div className="bg-zinc-950/50 border-b border-zinc-900 px-8 py-4 grid grid-cols-3 gap-8">
          <div className="space-y-2">
              <div className="flex justify-between text-[8px] text-zinc-600 uppercase font-black">
                  <span>Maturity Curve</span>
                  <span>{state.maturityScore}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.5)]" style={{width: `${state.maturityScore}%`}} />
              </div>
          </div>
          <div className="space-y-1">
              <div className="text-[8px] text-zinc-600 uppercase font-black flex items-center gap-1"><Lock size={10}/></div>
              <div className="text-white text-xs font-mono flex items-center gap-2">
                  <span className={state.status === 'LOCKING' ? 'text-yellow-500 animate-pulse' : 'text-blue-500'}></span>
                  {state.status === 'LOCKING' ? 'VALIDATING SHA...' : 'INTEGRITY SECURE'}
              </div>
          </div>
          <div className="space-y-1 text-right">
              <div className="text-[8px] text-zinc-600 uppercase font-black flex items-center gap-1 justify-end"><Target size={10}/></div>
              <div className="text-zinc-400 text-xs font-mono">{state.config.repo.split('/')[1]} / System</div>
          </div>
      </div>

      <main className="flex-1 flex flex-col p-6 overflow-hidden bg-[radial-gradient(circle_at_50%_120%,_rgba(20,20,50,0.3)_0%,_transparent_50%)]">
        <div className="flex items-center justify-between mb-3 px-4 text-[10px] font-bold">
            <div className="flex items-center gap-2 text-zinc-500">
                <Terminal size={14} className="text-blue-900" />
                <span className="tracking-widest uppercase">{state.activeObjective}</span>
            </div>
            <div className="text-zinc-700 font-mono">CYCLE_ID: {state.cycleCount}</div>
        </div>

        <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl">
          <div className="flex-1 overflow-y-auto p-8 font-mono text-[11px] space-y-4 custom-scrollbar">
            {state.logs.length === 0 && <div className="text-zinc-800 italic">No activity detected. Initiate neural link to begin.</div>}
            {state.logs.map(log => (
              <div key={log.id} className="flex gap-5 group animate-in slide-in-from-bottom-2 fade-in duration-300">
                <span className="text-zinc-800 text-[9px] w-12 flex-shrink-0">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                <div className="flex-1 flex items-start gap-2">
                    <span className={`w-1 h-1 rounded-full mt-1.5 ${log.type === 'success' ? 'bg-green-500' : log.type === 'error' ? 'bg-red-500' : 'bg-blue-900'}`} />
                    <span className={`${log.type === 'success' ? 'text-green-400/80' : log.type === 'error' ? 'text-red-400 font-bold tracking-tight' : 'text-zinc-400'}`}
                    >
                    {log.msg}
                    </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #18181b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #27272a; }
      `}</style>
    </div>
  );
}


System:
// System branch empty
