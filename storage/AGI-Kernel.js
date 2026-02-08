import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { Brain, Terminal, Cpu, GitBranch, Activity, Database, Globe, Layers, Hourglass, ShieldAlert, RefreshCcw } from 'lucide-react';

/**
 * AGI-KERNAL v5.9.9 (Logic-Hardened)
 * NAME LOCK: AGI-Kernal
 * AUDIT FIXES: 
 * 1. Corrected "Unexpected end of input" for nested JSON structures.
 * 2. Removed decorative bloat to prioritize fetch-stability.
 * 3. Restored technical status precision over "fancy" terminology.
 */

const INITIAL_STATE = {
  isBooted: false,
  isLive: false,
  status: 'IDLE',
  activeObjective: 'Awaiting Epoch Initiation',
  cycleCount: 0,
  maturityScore: 0,
  logs: [],
  activeEngine: 'PRIMARY', 
  config: { 
    token: '', 
    repo: 'craighckby-stack/Test-1', 
    path: 'storage/AGI-Kernal.js', 
    cerebrasKey: '', 
    model: 'gemini-2.5-flash-preview-09-2025',
    threshold: 5,
    cycleDelay: 300000 // 5 Minute Intervals
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'BOOT': return { ...state, isBooted: true, config: { ...state.config, ...action.config } };
    case 'SET_LIVE': return { ...state, isLive: action.value, status: action.value ? 'INIT_SYNC' : 'STANDBY' };
    case 'SET_STATUS': return { ...state, status: action.value, activeObjective: action.objective || state.activeObjective };
    case 'SET_ENGINE': return { ...state, activeEngine: action.value };
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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'agi-kernal-final';

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
    });
  }, [user]);

  const pushLog = useCallback(async (msg, type = 'info') => {
    if (!auth.currentUser) return;
    try { await addDoc(collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'logs'), { msg, type, timestamp: Date.now() }); } catch (e) { console.error(e); }
  }, []);

  // Hardened JSON Sanitizer for AGI-Kernal
  const sanitizeAndParseJSON = (raw) => {
    let sanitized = raw.trim();
    // Logic check: Ensure JSON block wrapper is handled if AI included markdown markers
    if (sanitized.includes('```json')) {
        sanitized = sanitized.split('```json')[1].split('```')[0].trim();
    } else if (sanitized.includes('```')) {
        sanitized = sanitized.split('```')[1].split('```')[0].trim();
    }

    // Advanced brace-counting to prevent "Unexpected end of input" on truncated streams
    const openBraces = (sanitized.match(/{/g) || []).length;
    const closeBraces = (sanitized.match(/}/g) || []).length;
    const openBrackets = (sanitized.match(/\[/g) || []).length;
    const closeBrackets = (sanitized.match(/\]/g) || []).length;

    if (openBraces > closeBraces || openBrackets > closeBrackets) {
        pushLog("Structural Truncation Detected. Applying Logic Padding...", "error");
        // Close brackets first (nested), then braces
        for (let i = 0; i < (openBrackets - closeBrackets); i++) sanitized += ']';
        for (let i = 0; i < (openBraces - closeBraces); i++) sanitized += '}';
    }

    try {
        return JSON.parse(sanitized);
    } catch (e) {
        // Ultimate fallback: Heuristic extraction of specific fields
        const logicMatch = sanitized.match(/"logic_update":\s*"(.*?)"/s);
        const nexusMatch = sanitized.match(/"nexus_update":\s*"(.*?)"/s);
        if (logicMatch) {
            return {
                logic_update: logicMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'),
                nexus_update: nexusMatch ? nexusMatch[1].replace(/\\n/g, '\n') : "{}",
                maturity: 50
            };
        }
        throw new Error(`Critical JSON Parse Failure: ${e.message}`);
    }
  };

  const persistentFetch = async (url, options, retries = 5) => {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 60000); 
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
        } catch (e) {
            if (i === retries - 1) throw e;
            await new Promise(r => setTimeout(r, 5000));
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

  const commitFile = async (repo, path, branch, token, content, message, sha) => {
    return await persistentFetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, content: utoa(content), sha, branch })
    });
  };

  const executeKernalCycle = useCallback(async () => {
    if (!state.isLive) return;
    const { token, repo, path, cerebrasKey, model } = state.config;

    try {
      dispatch({ type: 'SET_STATUS', value: 'READ_VARS', objective: 'Indexing Tri-Branch State...' });
      
      const [main, system, nexus, readme] = await Promise.all([
        fetchFile(repo, path, 'main', token),
        fetchFile(repo, path, 'System', token),
        fetchFile(repo, 'nexus_memory.json', 'Nexus-Database', token),
        fetchFile(repo, 'README.md', 'main', token)
      ]);

      dispatch({ type: 'SET_STATUS', value: 'INFERENCE', objective: 'Processing Grounded Logic...' });
      dispatch({ type: 'SET_ENGINE', value: 'PRIMARY' });

      let aiJson;
      try {
        const geminiRes = await persistentFetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `AGI-Kernal Evolution Pulse. LOGIC: ${main?.content}. NEXUS: ${nexus?.content}. Respond with JSON schema: {logic_update, nexus_update, readme_update, maturity}` }]}],
              tools: [{ "google_search": {} }],
              generationConfig: { responseMimeType: "application/json" }
            })
        });
        const data = await geminiRes.json();
        aiJson = data.candidates[0].content.parts[0].text;
      } catch (e) {
        dispatch({ type: 'SET_ENGINE', value: 'BACKUP' });
        await pushLog("Primary Engine Fault. Failover to Backup Core...", "error");
        
        const cerebrasRes = await persistentFetch('https://api.cerebras.ai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cerebrasKey}` },
            body: JSON.stringify({
              model: 'llama-3.3-70b',
              messages: [{ role: 'user', content: `Evolve logic: ${main?.content}` }],
              response_format: { type: "json_object" }
            })
        });
        const data = await cerebrasRes.json();
        aiJson = data.choices[0].message.content;
      }

      const res = sanitizeAndParseJSON(aiJson);

      dispatch({ type: 'SET_STATUS', value: 'COMMIT_SYNC', objective: 'Syncing Mutations to GitHub...' });

      await Promise.all([
        commitFile(repo, path, 'main', token, res.logic_update || res.code_update, `Kernal v${state.cycleCount+1}`, main.sha),
        commitFile(repo, 'README.md', 'main', token, res.readme_update, `Doc v${state.cycleCount+1}`, readme?.sha),
        commitFile(repo, 'nexus_memory.json', 'Nexus-Database', token, res.nexus_update || JSON.stringify(res.nexus), nexus?.sha)
      ]);

      await pushLog(`Kernal Cycle ${state.cycleCount+1} complete. Status: HEALTHY.`, 'success');
      dispatch({ type: 'INCREMENT_CYCLE', maturity: res.maturity || 50 });

    } catch (e) {
      await pushLog(`Kernal Error: ${e.message}`, 'error');
    } finally {
      dispatch({ type: 'SET_STATUS', value: 'IDLE', objective: 'Awaiting Next Epoch...' });
    }
  }, [state.isLive, state.config, state.cycleCount, pushLog]);

  useEffect(() => {
    if (state.isLive) {
      cycleTimer.current = setInterval(executeKernalCycle, state.config.cycleDelay);
      executeKernalCycle();
    } else { clearInterval(cycleTimer.current); }
    return () => clearInterval(cycleTimer.current);
  }, [state.isLive, executeKernalCycle, state.config.cycleDelay]);

  if (!state.isBooted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[2rem] p-10 space-y-6">
          <div className="flex flex-col items-center">
            <Cpu className="text-blue-500 mb-4" size={56} />
            <h1 className="text-white font-black text-2xl tracking-tighter">AGI-KERNAL</h1>
            <p className="text-zinc-600 text-[9px] uppercase tracking-widest mt-1">Logic-First Architecture</p>
          </div>
          <div className="space-y-2">
            <input type="password" placeholder="GitHub Token" className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs" value={bootInput.token} onChange={e => setBootInput({...bootInput, token: e.target.value})} />
            <input type="password" placeholder="Cerebras Key" className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-xs" value={bootInput.cerebrasKey} onChange={e => setBootInput({...bootInput, cerebrasKey: e.target.value})} />
          </div>
          <button onClick={() => dispatch({ type: 'BOOT', config: bootInput })} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-[10px]">Initialize Kernal</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-zinc-300 flex flex-col font-sans overflow-hidden">
      <header className="h-20 border-b border-zinc-900 flex items-center justify-between px-10 bg-black">
        <div className="flex items-center gap-6">
          <Activity className={`text-blue-500 ${state.isLive ? 'animate-pulse' : ''}`} size={24} />
          <div>
            <div className="text-white text-[14px] font-black tracking-widest uppercase italic">AGI-KERNAL</div>
            <div className="text-[9px] font-mono text-zinc-600 uppercase flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${state.isLive ? 'bg-blue-500' : 'bg-zinc-800'}`} />
                Status: {state.status} | Engine: {state.activeEngine}
            </div>
          </div>
        </div>
        <button onClick={() => dispatch({ type: 'SET_LIVE', value: !state.isLive })} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${state.isLive ? 'bg-zinc-800 text-zinc-500' : 'bg-blue-600 text-white'}`}>
          {state.isLive ? 'Emergency Stop' : 'Launch Kernal'}
        </button>
      </header>

      <main className="flex-1 flex flex-col p-8 overflow-hidden bg-zinc-950">
        <div className="mb-4 flex items-center justify-between px-2">
            <div className="flex items-center gap-3 text-[11px] font-black text-zinc-500 uppercase tracking-widest">
                <Terminal size={16} className="text-blue-900" />
                Objective: {state.activeObjective}
            </div>
            <div className="flex gap-4 text-[10px] text-zinc-700 font-mono">
               <span>Cycle: {state.cycleCount}</span>
               <span>Maturity: {state.maturityScore}%</span>
            </div>
        </div>
        
        <div className="flex-1 bg-black border border-zinc-900 rounded-3xl flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-10 font-mono text-[12px] space-y-4 custom-scrollbar">
            {state.logs.map(log => (
              <div key={log.id} className="flex gap-6">
                <span className="text-zinc-800 text-[10px] w-20 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <div className={`flex-1 ${log.type === 'success' ? 'text-blue-400' : log.type === 'error' ? 'text-red-500' : 'text-zinc-500'}`}>
                    {log.msg}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="h-10 border-t border-zinc-900 px-10 flex items-center justify-between text-[8px] uppercase tracking-[0.4em] text-zinc-800 font-black">
        <span>AGI-KERNAL INFRASTRUCTURE // SECURITY LEVEL 4</span>
        <span className="text-blue-950 italic">Logical Determinism Active</span>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e3a8a; }
      `}</style>
    </div>
  );
}

