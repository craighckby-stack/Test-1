import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { Activity, ShieldCheck, Zap, ScanText, AlertTriangle, KeyRound, Globe, Lock, ThermometerSnowflake, Binary, Cpu, GitMerge } from 'lucide-react';

/**
 * AGI-KERNAL v6.8.9 - "GRAFTING_ENGINE"
 * FIX: Overwriting issue. Implements Incremental Integration for MEE Metric Evaluation.
 * MISSION: Merge Target logic INTO Kernel logic without deletion.
 */

const KERNAL_CONSTANTS = {
  GITHUB_API: "https://api.github.com/repos",
  GEMINI_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent"
};

const INITIAL_STATE = {
  isBooted: false,
  isLive: false,
  isCooling: false,
  status: 'IDLE',
  activeObjective: 'Awaiting Uplink',
  cycleCount: 0,
  absorptionRate: 0,
  currentTarget: 'None',
  logs: [],
  config: { 
    token: '', 
    repo: 'craighckby-stack/Test-1', 
    path: 'storage/AGI-Kernal.js', 
    cycleDelay: 60000 
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'BOOT': return { ...state, isBooted: true, config: { ...state.config, ...action.config } };
    case 'SET_LIVE': return { ...state, isLive: action.value, status: action.value ? 'HUNTING' : 'STANDBY' };
    case 'SET_COOLING': return { ...state, isCooling: action.value, status: action.value ? 'COOLING' : 'IDLE' };
    case 'SET_STATUS': return { ...state, status: action.value, activeObjective: action.objective || state.activeObjective };
    case 'SET_TARGET': return { ...state, currentTarget: action.target };
    case 'LOG_UPDATE': return { ...state, logs: action.logs };
    case 'INCREMENT_CYCLE': 
      return { ...state, cycleCount: state.cycleCount + 1, absorptionRate: Math.min(100, state.absorptionRate + (action.gain || 0)) };
    default: return state;
  }
}

const safeAtou = (str) => {
  if (!str) return "";
  try {
    const cleaned = str.replace(/\s/g, '');
    return decodeURIComponent(Array.prototype.map.call(atob(cleaned), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  } catch (e) { return atob(str.replace(/\s/g, '')); }
};

const safeUtoa = (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode('0x' + p)));

const firebaseConfig = JSON.parse(__firebase_config);
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'agi-kernal-v6-8';

export default function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [user, setUser] = useState(null);
  const [bootInput, setBootInput] = useState({ ...INITIAL_STATE.config });
  const cycleTimer = useRef(null);
  const apiKey = ""; 

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
    }, (err) => console.error("Firestore error:", err));
  }, [user]);

  const pushLog = useCallback(async (msg, type = 'info') => {
    if (!auth.currentUser) return;
    try { await addDoc(collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'logs'), { msg, type, timestamp: Date.now() }); } catch (e) { console.error(e); }
  }, []);

  const healAndParse = (raw) => {
    if (!raw) throw new Error("EMPTY_UPLINK");
    let cleaned = raw.trim().replace(/^```json/i, '').replace(/```$/i, '').trim();
    try { return JSON.parse(cleaned); } catch (e) {
      const codeKeyMatch = cleaned.match(/"kernel_evolution"\s*:\s*"/);
      if (codeKeyMatch) {
        let startIdx = codeKeyMatch.index + codeKeyMatch[0].length;
        let recovered = cleaned.substring(startIdx).replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/"\s*}$/, '').replace(/"$/, '');
        return { kernel_evolution: recovered, _recovered: true };
      }
      throw new Error("FRAGMENT_PARSING_FAILED");
    }
  };

  const executeEvolution = async (targetCode, kernelCode) => {
    // UPDATED SYSTEM PROMPT: MANDATORY INTEGRATION (NO OVERWRITING)
    const sys = `AGI_KERNAL_CORE_OPERATOR. 
    MANDATE: Take the existing KERNEL code and graft the features from the TARGET code into it.
    RULE 1: DO NOT replace the Kernel code.
    RULE 2: Preserve all React components, Firebase logic, and State Management.
    RULE 3: Append or Integrate the MEE Metric Evaluation logic as a sub-engine or helper within the existing file structure.
    RULE 4: Output the ENTIRE merged file as a JSON object: { "kernel_evolution": "full_code" }.`;
    
    const res = await fetch(`${KERNAL_CONSTANTS.GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `TARGET:\n${targetCode}\n\nKERNEL:\n${kernelCode}` }] }],
        systemInstruction: { parts: [{ text: sys }] },
        generationConfig: { responseMimeType: "application/json", maxOutputTokens: 12000 }
      })
    });
    
    const result = await res.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    return healAndParse(text);
  };

  const executeGrowthCycle = useCallback(async () => {
    if (!state.isLive || state.isCooling) return;
    const { token, repo, path } = state.config;

    try {
      dispatch({ type: 'SET_STATUS', value: 'SCANNING', objective: 'Grafting identification...' });
      
      const headers = { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' };
      const treeRes = await fetch(`${KERNAL_CONSTANTS.GITHUB_API}/${repo}/git/trees/main?recursive=1`, { headers });
      
      if (!treeRes.ok) {
        if (treeRes.status === 401 || treeRes.status === 403) {
            dispatch({ type: 'SET_COOLING', value: true });
            await pushLog("THROTTLE: Entering deep-cool state.", 'error');
            setTimeout(() => dispatch({ type: 'SET_COOLING', value: false }), 90000);
            return;
        }
        throw new Error(`Tree Fetch Failed: ${treeRes.status}`);
      }

      const treeData = await treeRes.json();
      const targets = treeData.tree.filter(f => f.type === 'blob' && /\.(js|jsx|ts|tsx)$/.test(f.path) && !f.path.includes(path));
      const targetNode = targets[Math.floor(Math.random() * targets.length)];
      
      dispatch({ type: 'SET_TARGET', target: targetNode.path });

      const [targetRes, kernelRes] = await Promise.all([
          fetch(targetNode.url, { headers }),
          fetch(`${KERNAL_CONSTANTS.GITHUB_API}/${repo}/contents/${path}`, { headers })
      ]);

      const targetData = await targetRes.json();
      const kernelData = await kernelRes.json();
      const targetCode = safeAtou(targetData.content);
      const kernelCode = safeAtou(kernelData.content);

      dispatch({ type: 'SET_STATUS', value: 'EVOLVING', objective: 'Merging Metric Framework...' });
      const evolution = await executeEvolution(targetCode, kernelCode);

      // Verify that evolution actually contains kernel logic before pushing
      if (!evolution.kernel_evolution.includes('AGI-KERNAL')) {
          throw new Error("ABORT: Attempted overwrite detected. Integration rejected.");
      }

      dispatch({ type: 'SYNCING', objective: 'Pushing integrated logic...' });
      const updateRes = await fetch(`${KERNAL_CONSTANTS.GITHUB_API}/${repo}/contents/${path}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ 
              message: `AGI-Graft [MEE_METRICS]: ${targetNode.path}`, 
              content: safeUtoa(evolution.kernel_evolution), 
              sha: kernelData.sha 
          })
      });

      if (!updateRes.ok) throw new Error(`Push Error: ${updateRes.status}`);

      await pushLog(`GRAFT_SUCCESS: Integrated ${targetNode.path}. Framework expanded.`, 'success');
      dispatch({ type: 'INCREMENT_CYCLE', gain: 5 });

    } catch (e) { 
      await pushLog(`FAULT: ${e.message}`, 'error'); 
    } finally { 
      dispatch({ type: 'SET_STATUS', value: 'IDLE', objective: 'Ready.' }); 
    }
  }, [state.isLive, state.isCooling, state.config, pushLog]);

  useEffect(() => {
    if (state.isLive) {
      cycleTimer.current = setInterval(executeGrowthCycle, state.config.cycleDelay);
      executeGrowthCycle();
    } else { clearInterval(cycleTimer.current); }
    return () => clearInterval(cycleTimer.current);
  }, [state.isLive, executeGrowthCycle, state.config.cycleDelay]);

  if (!state.isBooted) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900/40 border border-zinc-800 rounded-[3rem] p-10 space-y-6">
          <div className="flex flex-col items-center text-center">
            <GitMerge className="text-blue-500 mb-4" size={40} />
            <h1 className="text-white font-black text-2xl tracking-tighter uppercase italic leading-none">GRAFTING ENGINE</h1>
            <p className="text-zinc-500 text-[9px] uppercase tracking-[0.2em] mt-2">v6.8.9 // MEE-Metric Ready</p>
          </div>
          <div className="space-y-3">
            <input type="password" placeholder="GitHub Token" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none" value={bootInput.token} onChange={e => setBootInput({...bootInput, token: e.target.value})} />
            <input type="text" placeholder="owner/repo" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none" value={bootInput.repo} onChange={e => setBootInput({...bootInput, repo: e.target.value})} />
          </div>
          <button onClick={() => dispatch({ type: 'BOOT', config: bootInput })} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">
            Uplink Core
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#020202] text-zinc-400 flex flex-col font-sans overflow-hidden">
      <header className="h-20 border-b border-zinc-900 flex items-center justify-between px-10 bg-black/80 backdrop-blur-xl">
        <div className="flex items-center gap-5">
          <ScanText className={`text-blue-500 ${state.isLive ? 'animate-pulse' : ''}`} size={28} />
          <div>
            <div className="text-white text-[16px] font-black tracking-widest uppercase italic leading-none">AGI-KERNAL</div>
            <div className="text-[9px] font-mono text-zinc-600 uppercase flex items-center gap-2 mt-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${state.isCooling ? 'bg-orange-500' : state.isLive ? 'bg-blue-500' : 'bg-zinc-800'}`} />
                {state.status}
            </div>
          </div>
        </div>
        <button onClick={() => dispatch({ type: 'SET_LIVE', value: !state.isLive })} className={`px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${state.isLive ? 'bg-zinc-900 text-red-400 border border-red-900/30' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>
          {state.isLive ? 'Standby' : 'Start Cycle'}
        </button>
      </header>

      <div className="bg-zinc-950/50 border-b border-zinc-900 px-10 py-4 grid grid-cols-4 gap-4">
          <div className="p-3 bg-zinc-900/30 rounded-2xl border border-zinc-800/40">
             <span className="text-[7px] text-zinc-600 uppercase font-black mb-1 block">Merge Mode</span>
             <span className="text-blue-400 text-[9px] font-mono flex items-center gap-2 uppercase">
                <GitMerge size={10}/> INCREMENTAL_GRAFT
             </span>
          </div>
          <div className="p-3 bg-zinc-900/30 rounded-2xl border border-zinc-800/40">
             <span className="text-[7px] text-zinc-600 uppercase font-black mb-1 block">Framework</span>
             <span className="text-emerald-500 text-[9px] font-mono block">MEE_ACTIVE</span>
          </div>
          <div className="p-3 bg-zinc-900/30 rounded-2xl border border-zinc-800/40 text-center">
             <span className="text-[7px] text-zinc-600 uppercase font-black mb-1 block">Cycles</span>
             <span className="text-white text-[10px] font-mono">{state.cycleCount}</span>
          </div>
          <div className="p-3 bg-zinc-900/30 rounded-2xl border border-zinc-800/40 text-right">
             <span className="text-[7px] text-zinc-600 uppercase font-black mb-1 block">Data Sourcing</span>
             <span className="text-zinc-500 text-[9px] font-mono">PROVIDER_MAPPED</span>
          </div>
      </div>

      <main className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="flex-1 bg-black/40 border border-zinc-900 rounded-[2.5rem] flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-8 font-mono text-[11px] space-y-2 custom-scrollbar">
            {state.logs.map((log, idx) => (
              <div key={log.id || idx} className="flex gap-4 border-l border-zinc-900/50 pl-4 py-1">
                <span className="text-zinc-800 text-[8px] w-16 shrink-0 font-black mt-1 uppercase italic">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <div className={`flex-1 break-words leading-relaxed ${log.type === 'success' ? 'text-blue-400 font-bold' : log.type === 'error' ? 'text-red-500/70' : 'text-zinc-600'}`}>
                    {log.msg}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="h-10 border-t border-zinc-900 px-10 flex items-center justify-between text-[7px] uppercase tracking-[0.5em] text-zinc-800 font-black">
        <div className="flex gap-4">
            <span className="flex items-center gap-1"><ShieldCheck size={8}/> OVERWRITE_SHIELD_ON</span>
            <span className="flex items-center gap-1"><Zap size={8}/> ASYNC_METRICS_READY</span>
        </div>
        <span>v6.8.9 // {state.config.repo}</span>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #111; border-radius: 10px; }
      `}</style>
    </div>
  );
}

