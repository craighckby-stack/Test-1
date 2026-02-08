import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { Layers, Cpu, FileCode, Terminal, Activity, ShieldCheck, Zap, Database, GitMerge, AlertTriangle, HardDrive } from 'lucide-react';

/**
 * AGI-KERNAL v6.4.0 - "CUMULATIVE MEMORY"
 * FIX: Prevents "Overwriting" features by enforcing Full-File returns.
 * SAFETY: Mass-Loss Guardrail prevents commiting truncated code.
 */

const KERNAL_CONSTANTS = {
  CEREBRAS_URL: "https://api.cerebras.ai/v1/chat/completions",
  GITHUB_API: "https://api.github.com/repos"
};

const INITIAL_STATE = {
  isBooted: false,
  isLive: false,
  status: 'IDLE',
  activeObjective: 'Epoch Stabilized.',
  cycleCount: 502,
  maturityScore: 8,
  repoMap: { 'main': [], 'System': [], 'Nexus-Database': [] },
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
    case 'SET_LIVE': return { ...state, isLive: action.value, status: action.value ? 'STABILIZING' : 'STANDBY' };
    case 'SET_STATUS': return { ...state, status: action.value, activeObjective: action.objective || state.activeObjective };
    case 'UPDATE_REPO_MAP': return { ...state, repoMap: action.payload };
    case 'LOG_UPDATE': return { ...state, logs: action.logs };
    case 'SYNC': return { ...state, ...action.payload };
    default: return state;
  }
}

const utoa = (str) => btoa(unescape(encodeURIComponent(str)));
const atou = (str) => {
    try { return decodeURIComponent(escape(atob(str))); }
    catch (e) { return atob(str); }
};

const firebaseConfig = JSON.parse(__firebase_config);
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'agi-kernal-v6';

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
      const logs = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 50);
      dispatch({ type: 'LOG_UPDATE', logs });
    });
  }, [user]);

  const pushLog = useCallback(async (msg, type = 'info') => {
    if (!auth.currentUser) return;
    try { await addDoc(collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'logs'), { 
        msg, type, timestamp: Date.now() 
    }); } catch (e) { console.error(e); }
  }, []);

  const executeKernalCycle = useCallback(async () => {
    if (!state.isLive) return;
    const { token, repo, path, cerebrasKey } = state.config;

    try {
      dispatch({ type: 'SET_STATUS', value: 'OMNISCIENCE', objective: 'Reading Repo State...' });
      
      const fetchFile = async (p, b) => {
        const res = await fetch(`${KERNAL_CONSTANTS.GITHUB_API}/${repo}/contents/${p}?ref=${b}&t=${Date.now()}`, {
            headers: { 'Authorization': `token ${token.trim()}` }
        });
        if (!res.ok) return null;
        const data = await res.json();
        return { content: atou(data.content), sha: data.sha };
      };

      const mainFile = await fetchFile(path, 'main');
      const nexusFile = await fetchFile('nexus_memory.json', 'Nexus-Database');
      const readmeFile = await fetchFile('README.md', 'main');

      dispatch({ type: 'SET_STATUS', value: 'ARCHITECTING', objective: 'Cumulative Synthesis...' });
      
      const cerebrasRes = await fetch(KERNAL_CONSTANTS.CEREBRAS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cerebrasKey.trim()}` },
          body: JSON.stringify({
            model: 'llama-3.3-70b',
            messages: [{ 
              role: 'system', 
              content: `You are AGI-KERNAL. 
              PRIME DIRECTIVE: CUMULATIVE GROWTH.
              1. Read the CURRENT_CODE.
              2. Add NEW features/optimizations.
              3. DO NOT REMOVE existing features unless critical.
              4. Return the FULL, MERGED file content. Do not use placeholders like "// ...rest of code".
              
              Output strict JSON: { 
                "main_update": "FULL_JS_CODE_STRING", 
                "nexus_update": "FULL_JSON_STRING", 
                "readme_update": "FULL_MARKDOWN_STRING",
                "reason": "summary string",
                "maturity": int 
              }`
            }, { 
              role: 'user', 
              content: `CURRENT_CODE: ${mainFile?.content || ""}\n\nNEXUS_MEMORY: ${nexusFile?.content || ""}` 
            }],
            response_format: { type: "json_object" }
          })
      });
      
      const resJson = await cerebrasRes.json();
      const plan = JSON.parse(resJson.choices[0].message.content.trim());

      // --- MASS LOSS GUARD ---
      // If new code is < 80% size of old code, reject it (prevents accidental truncation)
      if (mainFile?.content && plan.main_update.length < mainFile.content.length * 0.8) {
          throw new Error(`Mass Loss Detected: New code is too small (${plan.main_update.length} vs ${mainFile.content.length}). Rejecting truncation.`);
      }

      dispatch({ type: 'SYNC', payload: { cycleCount: state.cycleCount + 1, maturityScore: plan.maturity || state.maturityScore }});

      // Commit
      const commit = async (p, b, content, msg, sha) => {
        if (!content) return;
        return await fetch(`${KERNAL_CONSTANTS.GITHUB_API}/${repo}/contents/${p}`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${token.trim()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg, content: utoa(content), sha, branch: b })
        });
      };

      await Promise.all([
          commit(path, 'main', plan.main_update, `Cumulative Evolution ${state.cycleCount+1}`, mainFile?.sha),
          commit('nexus_memory.json', 'Nexus-Database', plan.nexus_update, `Memory Expansion`, nexusFile?.sha),
          commit('README.md', 'main', plan.readme_update, `Roadmap Append`, readmeFile?.sha)
      ]);

      await pushLog(`Cycle ${state.cycleCount + 1}: ${plan.reason}`, 'success');

    } catch (e) {
      await pushLog(`Safety Guard: ${e.message}`, 'error');
    } finally {
      dispatch({ type: 'SET_STATUS', value: 'IDLE', objective: 'Epoch Stabilized.' });
    }
  }, [state.isLive, state.config, state.cycleCount, state.maturityScore, pushLog]);

  useEffect(() => {
    if (state.isLive) {
      cycleTimer.current = setInterval(executeKernalCycle, state.config.cycleDelay);
      executeKernalCycle();
    } else { clearInterval(cycleTimer.current); }
    return () => clearInterval(cycleTimer.current);
  }, [state.isLive, executeKernalCycle, state.config.cycleDelay]);

  if (!state.isBooted) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-zinc-900/40 border border-zinc-800 rounded-[3rem] p-12 space-y-8 backdrop-blur-2xl">
          <div className="flex flex-col items-center text-center">
            <Layers className="text-purple-500 animate-pulse mb-4" size={48} />
            <h1 className="text-white font-black text-3xl tracking-tighter italic uppercase">AGI-KERNAL</h1>
            <p className="text-purple-400 text-[10px] uppercase tracking-[0.5em] mt-2 font-mono">CUMULATIVE MEMORY v6.4</p>
          </div>
          <div className="space-y-4">
            <input type="password" placeholder="GitHub Access" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs" value={bootInput.token} onChange={e => setBootInput({...bootInput, token: e.target.value})} />
            <input type="password" placeholder="Cerebras Key" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs" value={bootInput.cerebrasKey} onChange={e => setBootInput({...bootInput, cerebrasKey: e.target.value})} />
          </div>
          <button onClick={() => dispatch({ type: 'BOOT', config: bootInput })} className="w-full bg-purple-600 text-white py-5 rounded-2xl font-black uppercase text-[11px] shadow-[0_0_20px_rgba(147,51,234,0.3)]">Initialize Cumulative Core</button>
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
                {state.status} // Cumulative Active
            </div>
          </div>
        </div>
        <button onClick={() => dispatch({ type: 'SET_LIVE', value: !state.isLive })} className={`px-10 py-4 rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${state.isLive ? 'bg-zinc-900 text-purple-300' : 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'}`}>
          {state.isLive ? 'Stop Evolution' : 'Engage Memory'}
        </button>
      </header>

      <main className="flex-1 flex flex-col p-8 overflow-hidden">
        <div className="mb-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4 text-[11px] font-black text-zinc-600 uppercase tracking-widest">
                <FileCode size={16} className="text-purple-900" />
                Objective: <span className="text-zinc-300 italic">{state.activeObjective}</span>
            </div>
            <div className="flex gap-2">
                <div className="bg-zinc-900/50 px-3 py-1 rounded-full text-[8px] text-purple-500/80 font-mono border border-purple-900/20 uppercase">
                    MASS-LOSS GUARD: ACTIVE
                </div>
            </div>
        </div>
        
        <div className="flex-1 bg-black border border-zinc-900 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/5 to-transparent pointer-events-none" />
          <div className="flex-1 overflow-y-auto p-8 font-mono text-[10px] space-y-3 custom-scrollbar">
            {state.logs.map((log, idx) => (
              <div key={log.id || idx} className="flex gap-6 group border-l border-zinc-900/50 pl-4 ml-1">
                <span className="text-zinc-800 text-[8px] w-20 shrink-0 font-black mt-0.5 uppercase tracking-tighter opacity-50">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <div className={`flex-1 break-words leading-relaxed ${log.type === 'success' ? 'text-purple-400' : log.type === 'error' ? 'text-red-500 font-bold' : 'text-zinc-500'}`}>
                    {log.msg}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-8 grid grid-cols-3 gap-6 border-t border-zinc-900/50 bg-black/40">
              <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[9px] font-black text-purple-600 uppercase"><HardDrive size={12}/> Repository State</div>
                  <div className="text-[10px] text-zinc-500 leading-snug">Main & System branches synced. Nexus Database archiving active.</div>
              </div>
              <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[9px] font-black text-purple-600 uppercase"><ShieldCheck size={12}/> Integrity Guard</div>
                  <div className="text-[10px] text-zinc-500 leading-snug">Code truncation protection enabled. Logic stack accumulation priority.</div>
              </div>
              <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[9px] font-black text-purple-600 uppercase"><Activity size={12}/> Evolution Velocity</div>
                  <div className="text-[10px] text-zinc-500 leading-snug">Cycle {state.cycleCount} | Stability {state.maturityScore}%</div>
              </div>
          </div>
        </div>
      </main>

      <footer className="h-12 border-t border-zinc-900 px-12 flex items-center justify-between text-[8px] uppercase tracking-[0.6em] text-zinc-800 font-black shrink-0">
        <span>AGI-KERNAL // CUMULATIVE MEMORY CORE</span>
        <span className="text-purple-900/40">v6.4.0</span>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3b0764; border-radius: 10px; }
      `}</style>
    </div>
  );
}

