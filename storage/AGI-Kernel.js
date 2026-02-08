import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { Shield, Zap, Brain, Terminal, Cpu, GitBranch, RefreshCw, ChevronDown, ChevronUp, Database, FileCode, Construction, Timer, Activity, AlertTriangle, Layers, Target, Lock } from 'lucide-react';

/**
 * AGI-KERNEL v5.9
 * FIX: Atomic SHA Re-validation (Prevents "Commit Failed" errors)
 * NEW: Multi-Branch Readiness Check
 */

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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'agi-kernel-v5-9';

export default function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [user, setUser] = useState(null);
  const [showMeta, setShowMeta] = useState(true);
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

  const fetchFile = async (repo, path, branch, token) => {
    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`, { 
        headers: { 'Authorization': `token ${token}`, 'Cache-Control': 'no-cache' } 
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { content: atou(data.content), sha: data.sha };
  };

  const executeKernelCycle = useCallback(async () => {
    if (!state.isLive) return;
    const { token, repo, path, cerebrasKey, model, threshold } = state.config;

    try {
      dispatch({ type: 'SET_STATUS', value: 'SYNCING', objective: 'Pulling Atomic State...' });
      
      const mainContext = await fetchFile(repo, path, 'main', token);
      if (!mainContext) throw new Error("Main branch unavailable.");

      const systemContext = await fetchFile(repo, path, 'System', token);
      const systemCode = systemContext ? systemContext.content : "No System Branch Found";

      dispatch({ type: 'SET_STATUS', value: 'EVOLVING', objective: 'Optimizing via Cerebras Inference...' });
      const aiRes = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cerebrasKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: `You are AGI-Kernel. Output ONLY JSON: { "code_update": "string", "maturity_rating": number }` },
            { role: 'user', content: `Current Main:\n${mainContext.content}\n\nSystem Baseline:\n${systemCode}\n\nImprove the code logic. If matches/beats System baseline, maturity is 100.` }
          ],
          response_format: { type: "json_object" }
        })
      });

      const aiJson = await aiRes.json();
      const response = JSON.parse(aiJson.choices[0].message.content);

      // --- ATOMIC RE-SYNC (Crucial Step) ---
      dispatch({ type: 'SET_STATUS', value: 'LOCKING', objective: 'Verifying Commit Integrity...' });
      const freshMain = await fetchFile(repo, path, 'main', token);

      dispatch({ type: 'SET_STATUS', value: 'MUTATING', objective: 'Writing to Main...' });
      const mainMutation = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Cycle ${state.cycleCount + 1}: Integrity Match`,
          content: utoa(response.code_update),
          sha: freshMain.sha, // Use the absolute latest SHA
          branch: 'main'
        })
      });

      if (!mainMutation.ok) throw new Error(`Main Commit Failed: ${mainMutation.status}`);
      await pushLog(`Main Mutated. Maturity: ${response.maturity_rating}%`, 'info');

      // Promotion Logic
      if (response.maturity_rating >= 90 || state.cycleCount >= threshold) {
        dispatch({ type: 'SET_STATUS', value: 'PROMOTING', objective: 'Pushing to System Branch...' });
        const freshSystem = await fetchFile(repo, path, 'System', token);
        if (freshSystem) {
            await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  message: `PROMOTION: Maturity ${response.maturity_rating}%`,
                  content: utoa(response.code_update),
                  sha: freshSystem.sha,
                  branch: 'System'
                })
            });
            await pushLog("SYSTEM BRANCH ENHANCED", "success");
            dispatch({ type: 'RESET_MATURITY' });
        }
      } else {
        dispatch({ type: 'INCREMENT_CYCLE', maturity: response.maturity_rating });
      }

      dispatch({ type: 'SET_STATUS', value: 'IDLE', objective: 'Cooling down...' });

    } catch (e) {
      await pushLog(`Kernel Fault: ${e.message}`, 'error');
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
            <div className="bg-blue-600 p-4 rounded-3xl text-white mb-4"><Zap size={32} /></div>
            <h1 className="text-white font-black text-2xl tracking-tighter uppercase italic">Kernel 5.9</h1>
          </div>
          <div className="space-y-3">
            <input type="password" placeholder="GitHub PAT" className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-white text-sm outline-none" value={bootInput.token} onChange={e => setBootInput({...bootInput, token: e.target.value})} />
            <input type="password" placeholder="Cerebras Key" className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-white text-sm outline-none" value={bootInput.cerebrasKey} onChange={e => setBootInput({...bootInput, cerebrasKey: e.target.value})} />
          </div>
          <button onClick={() => dispatch({ type: 'BOOT', config: bootInput })} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[11px]">Sync Neural Link</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-zinc-300 flex flex-col overflow-hidden font-sans">
      <header className="h-20 border-b border-zinc-900 flex items-center justify-between px-8 bg-black/50 backdrop-blur-xl z-20">
        <div className="flex items-center gap-5">
          <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800"><Activity size={20} className="text-blue-500" /></div>
          <div>
            <div className="text-white text-[13px] font-black uppercase tracking-widest flex items-center gap-2">
              AGI-KERNEL v5.9
              <span className="text-[10px] text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">ATOMIC</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${state.isLive ? 'bg-blue-500 animate-pulse' : 'bg-red-900'}`} />
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">{state.status}</span>
            </div>
          </div>
        </div>
        <button onClick={() => dispatch({ type: 'SET_LIVE', value: !state.isLive })} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${state.isLive ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-blue-600 text-white border-blue-400'}`}>
          {state.isLive ? 'Kill Cycle' : 'Initialize'}
        </button>
      </header>

      <div className="bg-zinc-950/50 border-b border-zinc-900 px-8 py-4 grid grid-cols-3 gap-6">
          <div className="space-y-2">
              <div className="text-[8px] text-zinc-600 uppercase font-black">Maturity Threshold</div>
              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-1000" style={{width: `${state.maturityScore}%`}} />
              </div>
          </div>
          <div className="space-y-1">
              <div className="text-[8px] text-zinc-600 uppercase font-black flex items-center gap-1"><Lock size={10}/> Logic Lock</div>
              <div className="text-white text-xs font-mono">{state.status === 'LOCKING' ? 'VERIFYING...' : 'READY'}</div>
          </div>
          <div className="space-y-1">
              <div className="text-[8px] text-zinc-600 uppercase font-black flex items-center gap-1"><Target size={10}/> Cycles to System</div>
              <div className="text-blue-500 text-xs font-mono">{Math.max(0, state.config.threshold - state.cycleCount)} Left</div>
          </div>
      </div>

      <main className="flex-1 flex flex-col p-6 overflow-hidden bg-[radial-gradient(circle_at_50%_50%,_rgba(20,20,20,1)_0%,_rgba(0,0,0,1)_100%)]">
        <div className="flex items-center justify-between mb-3 px-2 text-[10px] font-bold">
            <div className="flex items-center gap-2 text-zinc-500 italic">
                <Terminal size={14} />
                <span>{state.activeObjective}</span>
            </div>
        </div>

        <div className="flex-1 bg-black/40 border border-zinc-900 rounded-[2rem] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 font-mono text-[11px] space-y-3">
            {state.logs.map(log => (
              <div key={log.id} className="flex gap-4 group animate-in slide-in-from-left-1">
                <span className="text-zinc-800 text-[9px]">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
                <span className={`${log.type === 'success' ? 'text-green-500' : log.type === 'error' ? 'text-red-500 font-bold' : 'text-zinc-400'}`}>
                  {log.msg}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

