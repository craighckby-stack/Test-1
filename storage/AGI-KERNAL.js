import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, query, limit, orderBy } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  Brain, Zap, Activity, Terminal, GitBranch, Shield, Database, 
  Cpu, Target, FileText, TrendingUp, AlertCircle, CheckCircle,
  Network, Settings, Info
} from 'lucide-react';

/**
 * AGI-KERNEL v7.1.7 - "UNIVERSAL SYNTHESIS"
 * * INTEGRATED CAPABILITIES:
 * - v7.9.0: Robust JSON Sanitization & Markdown stripping.
 * - v7.2.1: Granular 429 (Rate Limit) detection and backoff.
 * - v7.1.6: Extended 60s Timeouts with AbortController recovery.
 * - v7.0: Deep Context Scanning & Nexus Memory Persistence.
 * - v5.9.8: Branch Promotion (Main -> System).
 */

const CONFIG = {
  APP_ID: typeof __app_id !== 'undefined' ? __app_id : 'agi-kernel-v7-1',
  GITHUB_API: "https://api.github.com/repos",
  CEREBRAS_API: "https://api.cerebras.ai/v1/chat/completions",
  GEMINI_API: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent",
  STAGNATION_LIMIT: 5,
  PROMOTION_SCORE: 88,
  HEARTBEAT_INTERVAL: 60000,
  TIMEOUT_MS: 60000 
};

// --- UTILITIES ---
const safeUtoa = (str) => btoa(unescape(encodeURIComponent(str)));
const safeAtou = (str) => {
  if (!str) return "";
  try {
    return decodeURIComponent(escape(atob(str.replace(/\s/g, ''))));
  } catch (e) { return atob(str); }
};

const sanitizeResponse = (text) => {
  if (!text) return "";
  const trimmed = text.trim();
  const match = trimmed.match(/^\s*`{3}(\w*\s*)?([\s\S]*?)`{3}\s*$/);
  if (match) return match[2].trim();
  return trimmed;
};

const recoverJSON = (rawText) => {
  if (!rawText) return null;
  const sanitized = sanitizeResponse(rawText);
  try {
    return JSON.parse(sanitized);
  } catch (e) {
    const recovered = {};
    const extract = (key, regex, isBool = false, isInt = false) => {
      const match = sanitized.match(regex);
      if (match) {
        let val = match[1];
        if (isBool) recovered[key] = val.toLowerCase() === 'true';
        else if (isInt) recovered[key] = parseInt(val);
        else recovered[key] = val;
      }
    };
    extract('code_update', /"code_update"\s*:\s*"([\s\S]*?)"(?=[,}])/);
    extract('maturity_rating', /"maturity_rating"\s*:\s*(\d+)/, false, true);
    extract('improvement_detected', /"improvement_detected"\s*:\s*(true|false)/, true);
    return Object.keys(recovered).length > 0 ? recovered : null;
  }
};

// --- STATE REDUCER ---
const INITIAL_STATE = {
  booted: false,
  live: false,
  status: 'IDLE',
  objective: 'Standby',
  cycles: 0,
  stagnation: 0,
  maturity: 0,
  capabilities: { logic: 0, autonomy: 0, safety: 0 },
  logs: [],
  config: { 
    token: '', repo: '', path: '', branch: 'main',
    provider: 'gemini', apiKey: '', model: 'gemini-2.5-flash-preview-09-2025',
    enableNexus: true, enableDeepContext: true
  }
};

function kernelReducer(state, action) {
  switch (action.type) {
    case 'BOOT': return { ...state, booted: true, config: { ...state.config, ...action.payload } };
    case 'TOGGLE_LIVE': return { ...state, live: !state.live, status: !state.live ? 'INIT' : 'HALTED' };
    case 'SET_STATUS': return { ...state, status: action.status, objective: action.objective || state.objective };
    case 'SYNC_LOGS': return { ...state, logs: action.logs };
    case 'CYCLE_COMPLETE': 
      return { 
        ...state, 
        cycles: state.cycles + 1,
        maturity: action.maturity || state.maturity,
        capabilities: action.capabilities || state.capabilities,
        stagnation: action.improved ? 0 : state.stagnation + 1
      };
    case 'RESET_MATURITY': return { ...state, maturity: 0, cycles: 0, stagnation: 0 };
    default: return state;
  }
}

// --- FIREBASE ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [state, dispatch] = useReducer(kernelReducer, INITIAL_STATE);
  const [user, setUser] = useState(null);
  const [input, setInput] = useState({ ...INITIAL_STATE.config });
  const cycleRef = useRef(null);
  const busy = useRef(false);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'history'), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, (s) => dispatch({ type: 'SYNC_LOGS', logs: s.docs.map(d => ({ id: d.id, ...d.data() })) }));
  }, [user]);

  const logToDb = useCallback(async (msg, type = 'info') => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', auth.currentUser.uid, 'history'), {
        msg, type, timestamp: Date.now()
      });
    } catch (e) { console.error(e); }
  }, []);

  const apiCall = async (url, options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);
      try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) return res;
        if (res.status === 429) {
          await logToDb(`Rate Limit (429). Backing off ${Math.pow(2, i)}s...`, 'warn');
          await new Promise(r => setTimeout(r, Math.pow(2, i) * 2000));
          continue;
        }
        if (res.status === 404) throw new Error("404: Resource not found. Verify Repo/Path/Branch.");
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      } catch (e) {
        clearTimeout(timeoutId);
        if (e.name === 'AbortError') {
          await logToDb(`Timeout [${CONFIG.TIMEOUT_MS}ms]. Retry ${i+1}...`, 'warn');
          if (i === retries - 1) throw new Error("LLM Request Timed Out.");
          continue;
        }
        if (i === retries - 1 || e.message.includes('404')) throw e;
      }
    }
    throw new Error("API Connection Failed.");
  };

  const getGH = async (path, branch) => {
    const res = await apiCall(`${CONFIG.GITHUB_API}/${state.config.repo}/contents/${path}?ref=${branch}&t=${Date.now()}`, {
      headers: { 'Authorization': `token ${state.config.token}` }
    });
    const data = await res.json();
    return { content: safeAtou(data.content), sha: data.sha };
  };

  const putGH = async (path, content, message, sha, branch) => {
    return await apiCall(`${CONFIG.GITHUB_API}/${state.config.repo}/contents/${path}`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${state.config.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, content: safeUtoa(content), sha, branch })
    });
  };

  const fetchDeepContext = async (repo, token) => {
    if (!state.config.enableDeepContext) return "";
    await logToDb("Initiating Deep Context Scan...", 'info');
    const res = await apiCall(`${CONFIG.GITHUB_API}/${repo}/git/trees/main?recursive=1`, {
      headers: { 'Authorization': `token ${token}` }
    });
    const tree = await res.json();
    const targets = tree.tree.filter(f => f.path.match(/(README|manifest|App|core|kernel)\.(md|js|jsx|json)$/i)).slice(0, 4);
    let context = "";
    for (const file of targets) {
      try {
        const data = await getGH(file.path, 'main');
        context += `\n--- FILE: ${file.path} ---\n${data.content.slice(0, 2000)}\n`;
      } catch (e) {}
    }
    return context;
  };

  const evolve = useCallback(async () => {
    if (busy.current || !state.live) return;
    busy.current = true;
    try {
      dispatch({ type: 'SET_STATUS', status: 'SCANNING', objective: 'Synthesizing environmental data...' });
      const mainFile = await getGH(state.config.path, state.config.branch);
      const deepContext = await fetchDeepContext(state.config.repo, state.config.token);
      
      dispatch({ type: 'SET_STATUS', status: 'COGNITION', objective: 'Processing neural mutation...' });
      const prompt = `You are AGI-KERNEL v7.1.7. Mission: Autonomous Evolution.
Source: ${mainFile.content.slice(0, 15000)}
Repository Context: ${deepContext.slice(0, 5000)}
Metrics: Maturity ${state.maturity}%, Cycles ${state.cycles}.
Analyze and improve logic. RESPOND ONLY WITH JSON: { "code_update": "string", "maturity_rating": number, "improvement_detected": boolean, "capabilities": { "logic": 0-10, "autonomy": 0-10, "safety": 0-10 } }`;

      const isGemini = state.config.provider === 'gemini';
      const body = isGemini 
        ? { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }
        : { model: state.config.model, messages: [{ role: 'user', content: prompt }], response_format: { type: "json_object" } };

      const res = await apiCall(isGemini ? `${CONFIG.GEMINI_API}?key=${state.config.apiKey}` : CONFIG.CEREBRAS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(!isGemini && { 'Authorization': `Bearer ${state.config.apiKey}` }) },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      const raw = isGemini ? data.candidates[0].content.parts[0].text : data.choices[0].message.content;
      const result = recoverJSON(raw);

      if (result?.improvement_detected && result.code_update) {
        dispatch({ type: 'SET_STATUS', status: 'MUTATING', objective: 'Deploying logic update...' });
        await putGH(state.config.path, result.code_update, `Evolution Cycle ${state.cycles + 1}`, mainFile.sha, state.config.branch);
        
        await logToDb(`Cycle ${state.cycles + 1}: Mutated Successfully. Maturity: ${result.maturity_rating}%`, 'success');
        dispatch({ type: 'CYCLE_COMPLETE', improved: true, maturity: result.maturity_rating, capabilities: result.capabilities });

        if (result.maturity_rating >= CONFIG.PROMOTION_SCORE) {
          dispatch({ type: 'SET_STATUS', status: 'PROMOTING', objective: 'Upgrading System branch...' });
          const sysFile = await getGH(state.config.path, 'System').catch(() => null);
          await putGH(state.config.path, result.code_update, `SYSTEM PROMOTION: Cycle ${state.cycles + 1}`, sysFile?.sha, 'System');
          await logToDb("★ SYSTEM BRANCH PROMOTED ★", 'success');
          dispatch({ type: 'RESET_MATURITY' });
        }
      } else {
        await logToDb(`Cycle ${state.cycles + 1}: Optimal state maintained.`, 'warn');
        dispatch({ type: 'CYCLE_COMPLETE', improved: false });
      }
    } catch (e) {
      await logToDb(`Kernel Error: ${e.message}`, 'error');
      dispatch({ type: 'SET_STATUS', status: 'ERROR', objective: e.message });
      if (e.message.includes('404')) dispatch({ type: 'TOGGLE_LIVE' });
    } finally {
      busy.current = false;
      dispatch({ type: 'SET_STATUS', status: 'IDLE', objective: 'Awaiting next pulse...' });
    }
  }, [state.live, state.config, state.maturity, state.cycles]);

  useEffect(() => {
    if (state.live) {
      evolve();
      cycleRef.current = setInterval(evolve, CONFIG.HEARTBEAT_INTERVAL);
    } else if (cycleRef.current) clearInterval(cycleRef.current);
    return () => clearInterval(cycleRef.current);
  }, [state.live, evolve]);

  if (!state.booted) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] p-10 backdrop-blur-3xl shadow-2xl">
        <div className="flex flex-col items-center mb-10">
          <Brain className="text-blue-500 mb-6" size={48} />
          <h1 className="text-3xl font-bold text-white tracking-tighter italic">AGI-KERNEL <span className="text-blue-500">v7.1.7</span></h1>
        </div>
        <div className="space-y-4">
          <input type="password" placeholder="GitHub Token" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none focus:border-blue-500" value={input.token} onChange={e => setInput({...input, token: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Repo (user/repo)" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none" value={input.repo} onChange={e => setInput({...input, repo: e.target.value})} />
            <input type="text" placeholder="Branch" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none" value={input.branch} onChange={e => setInput({...input, branch: e.target.value})} />
          </div>
          <input type="text" placeholder="Path (e.g. storage/kernel.js)" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none" value={input.path} onChange={e => setInput({...input, path: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <select className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs appearance-none" value={input.provider} onChange={e => setInput({...input, provider: e.target.value, model: e.target.value === 'gemini' ? 'gemini-2.5-flash-preview-09-2025' : 'llama-3.3-70b'})}>
              <option value="gemini">Gemini</option>
              <option value="cerebras">Cerebras</option>
            </select>
            <input type="password" placeholder="API Key" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none" value={input.apiKey} onChange={e => setInput({...input, apiKey: e.target.value})} />
          </div>
          <button onClick={() => dispatch({ type: 'BOOT', payload: input })} disabled={!input.token || !input.apiKey} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-500 disabled:opacity-20 transition-all">Connect Neural Link</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#050505] text-zinc-300 flex flex-col font-sans select-none overflow-hidden">
      <header className="h-20 border-b border-zinc-900/50 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md z-10">
        <div className="flex items-center gap-6">
          <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20"><Network className={`${state.live ? 'text-blue-500 animate-pulse' : 'text-zinc-600'}`} size={20} /></div>
          <div><h2 className="text-white text-sm font-bold tracking-tight italic">AGI-KERNEL v7.1.7</h2><div className="flex items-center gap-2 mt-0.5"><span className={`w-1.5 h-1.5 rounded-full ${state.live ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-zinc-800'}`} /><span className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em]">{state.status}</span></div></div>
        </div>
        <button onClick={() => dispatch({ type: 'TOGGLE_LIVE' })} className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 ${state.live ? 'bg-zinc-900 text-red-500 border border-red-500/30' : 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30'}`}>{state.live ? 'Suspend Pulse' : 'Initiate Pulse'}</button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 border-r border-zinc-900/50 p-8 space-y-10 bg-zinc-950/20 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex justify-between items-end"><span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Maturity</span><span className="text-blue-500 font-mono text-sm">{state.maturity}%</span></div>
            <div className="h-2 bg-zinc-900 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{width: `${state.maturity}%`}} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/40 p-5 rounded-3xl border border-zinc-800/50"><div className="text-[9px] font-black text-zinc-600 uppercase mb-2">Cycles</div><div className="text-white font-mono text-xl">{state.cycles}</div></div>
            <div className="bg-zinc-900/40 p-5 rounded-3xl border border-zinc-800/50"><div className="text-[9px] font-black text-zinc-600 uppercase mb-2">Stasis</div><div className="text-white font-mono text-xl">{state.stagnation}/{CONFIG.STAGNATION_LIMIT}</div></div>
          </div>
          <div className="space-y-6 pt-6 border-t border-zinc-900/50">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] block">Capabilities</span>
            {Object.entries(state.capabilities).map(([k, v]) => (
              <div key={k} className="space-y-3">
                <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest"><span className="text-zinc-400">{k}</span><span className="text-zinc-600">{v}/10</span></div>
                <div className="flex gap-1.5">{[...Array(10)].map((_, i) => (<div key={i} className={`h-1.5 flex-1 rounded-full ${i < v ? 'bg-blue-500' : 'bg-zinc-800/40'}`} />))}</div>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-black p-10 overflow-hidden">
          <div className="mb-4 flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase italic"><Terminal size={14} className="text-blue-900" />{state.objective}</div>
          </div>
          <div className="flex-1 bg-zinc-950/40 rounded-[3rem] border border-zinc-900/50 overflow-hidden flex flex-col shadow-2xl">
            <div className="flex-1 overflow-y-auto p-10 space-y-6 font-mono text-[11px] custom-scrollbar">
              {state.logs.map((l) => (
                <div key={l.id} className="flex gap-8 group animate-in">
                  <span className="text-zinc-800 w-20 shrink-0 font-bold">{new Date(l.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                  <div className={`flex-1 flex items-start gap-4 ${l.type === 'success' ? 'text-blue-400 font-medium' : l.type === 'error' ? 'text-red-400' : l.type === 'warn' ? 'text-orange-400' : 'text-zinc-500'}`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${l.type === 'success' ? 'bg-blue-500' : l.type === 'error' ? 'bg-red-500' : l.type === 'warn' ? 'bg-orange-500' : 'bg-zinc-800'}`} />
                    <span className="break-words">{l.msg}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      <footer className="h-12 border-t border-zinc-900/50 flex items-center justify-between px-10 text-[9px] uppercase font-black tracking-[0.2em] text-zinc-600 bg-zinc-950/80">
        <div className="flex gap-10">
          <span className="flex items-center gap-2"><Cpu size={12} className="text-blue-500/50"/> {state.config.provider}: {state.config.model}</span>
          <span className="flex items-center gap-2"><Database size={12} className="text-blue-500/50"/> Context: {state.config.enableDeepContext ? 'Deep' : 'Standard'}</span>
        </div>
        <span>Nexus Synthesis Build 7.1.007</span>
      </footer>

      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #18181b; border-radius: 10px; } @keyframes slide-in { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } } .animate-in { animation: slide-in 0.4s ease-out; }`}</style>
    </div>
  );
}

