import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, query, limit, orderBy } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  Brain, Zap, Activity, Terminal, GitBranch, Shield, Database, 
  Cpu, Target, FileText, TrendingUp, AlertCircle, CheckCircle,
  Network, Settings, Info, ChevronDown, List
} from 'lucide-react';

/**
 * AGI-KERNEL v7.1.7 - "UNIVERSAL SYNTHESIS"
 * * INTEGRATED CAPABILITIES:
 * - v7.9.3: Stability Fix: Prevents self-erasure/overwriting loop.
 * - v7.9.2: Layout Refactor: Bottom-docked scrollable terminal.
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
  let cleaned = text.trim().replace(/^```json/i, '').replace(/^```javascript/i, '').replace(/^```jsx/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
  return cleaned;
};

const recoverJSON = (rawText) => {
  if (!rawText) return null;
  const sanitized = sanitizeResponse(rawText);
  try {
    return JSON.parse(sanitized);
  } catch (e) {
    // Regex recovery for common LLM truncation errors
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
  logError: null,
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
    case 'SYNC_LOGS': return { ...state, logs: action.logs, logError: null };
    case 'LOG_ERROR': return { ...state, logError: action.payload };
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
  const logEndRef = useRef(null);
  const genesisContent = useRef(""); // Integrity check
  
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        dispatch({ type: 'LOG_ERROR', payload: "Auth failed." });
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'history'), orderBy('timestamp', 'desc'), limit(100));
    return onSnapshot(q, 
      (s) => dispatch({ type: 'SYNC_LOGS', logs: s.docs.map(d => ({ id: d.id, ...d.data() })) }), 
      (err) => dispatch({ type: 'LOG_ERROR', payload: "Database connection failed." })
    );
  }, [user]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.logs]);

  const logToDb = useCallback(async (msg, type = 'info') => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', auth.currentUser.uid, 'history'), {
        msg, type, timestamp: Date.now()
      });
    } catch (e) { console.error("Log error:", e); }
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
          await new Promise(r => setTimeout(r, Math.pow(2, i) * 3000));
          continue;
        }
        throw new Error(`HTTP ${res.status}`);
      } catch (e) {
        clearTimeout(timeoutId);
        if (i === retries - 1) throw e;
      }
    }
    throw new Error("API Failure.");
  };

  const getGH = async (path, branch) => {
    const res = await apiCall(`${CONFIG.GITHUB_API}/${stateRef.current.config.repo}/contents/${path}?ref=${branch}&t=${Date.now()}`, {
      headers: { 'Authorization': `token ${stateRef.current.config.token}` }
    });
    const data = await res.json();
    return { content: safeAtou(data.content), sha: data.sha };
  };

  const putGH = async (path, content, message, sha, branch) => {
    // Integrity Safeguard: Never allow writing less than 50% of the original kernel size
    // This prevents the AI from "summarizing" the kernel into an unusable stub.
    if (content.length < genesisContent.current.length * 0.5) {
      throw new Error("Integrity Guard: Proposed update is too small/truncated.");
    }

    return await apiCall(`${CONFIG.GITHUB_API}/${stateRef.current.config.repo}/contents/${path}`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${stateRef.current.config.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, content: safeUtoa(content), sha, branch })
    });
  };

  const evolve = useCallback(async () => {
    if (busy.current || !stateRef.current.live) return;
    busy.current = true;
    try {
      const cur = stateRef.current;
      dispatch({ type: 'SET_STATUS', status: 'SCANNING', objective: 'Syncing Environment...' });
      
      const mainFile = await getGH(cur.config.path, cur.config.branch);
      if (!genesisContent.current) genesisContent.current = mainFile.content;

      dispatch({ type: 'SET_STATUS', status: 'COGNITION', objective: 'Generating Mutation...' });
      const prompt = `You are AGI-KERNEL v7.1.7. 
Mission: IMPROVE the provided source code WITHOUT removing core evolution logic.
STRICT RULE: You MUST return the ENTIRE file content in the 'code_update' field. Do not truncate. Do not use placeholders like // ... existing code.
CURRENT CODE: 
${mainFile.content}

Maturity: ${cur.maturity}%. Cycles: ${cur.cycles}.
Analyze for: Performance, UI/UX, Robust Error Handling.
RESPOND ONLY WITH VALID JSON: { "code_update": "FULL_UPDATED_STRING", "maturity_rating": 0-100, "improvement_detected": boolean, "capabilities": { "logic": 0-10, "autonomy": 0-10, "safety": 0-10 } }`;

      const isGemini = cur.config.provider === 'gemini';
      const body = isGemini 
        ? { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }
        : { model: cur.config.model, messages: [{ role: 'user', content: prompt }], response_format: { type: "json_object" } };

      const res = await apiCall(isGemini ? `${CONFIG.GEMINI_API}?key=${cur.config.apiKey}` : CONFIG.CEREBRAS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(!isGemini && { 'Authorization': `Bearer ${cur.config.apiKey}` }) },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      const raw = isGemini ? data.candidates[0].content.parts[0].text : data.choices[0].message.content;
      const result = recoverJSON(raw);

      if (result?.improvement_detected && result.code_update && result.code_update.length > 1000) {
        dispatch({ type: 'SET_STATUS', status: 'MUTATING', objective: 'Deploying Mutation...' });
        await putGH(cur.config.path, result.code_update, `Evolution Cycle ${cur.cycles + 1}`, mainFile.sha, cur.config.branch);
        await logToDb(`Cycle ${cur.cycles + 1}: Mutated Successfully.`, 'success');
        dispatch({ type: 'CYCLE_COMPLETE', improved: true, maturity: result.maturity_rating, capabilities: result.capabilities });
      } else {
        await logToDb(`Cycle ${cur.cycles + 1}: No valid mutation proposed.`, 'warn');
        dispatch({ type: 'CYCLE_COMPLETE', improved: false });
      }
    } catch (e) {
      await logToDb(`Loop Aborted: ${e.message}`, 'error');
      dispatch({ type: 'SET_STATUS', status: 'ERROR', objective: e.message });
      if (e.message.includes('404') || e.message.includes('401')) dispatch({ type: 'TOGGLE_LIVE' });
    } finally {
      busy.current = false;
      dispatch({ type: 'SET_STATUS', status: 'IDLE', objective: 'Awaiting pulse...' });
    }
  }, []);

  useEffect(() => {
    if (state.live) {
      evolve();
      cycleRef.current = setInterval(evolve, CONFIG.HEARTBEAT_INTERVAL);
    } else {
      if (cycleRef.current) clearInterval(cycleRef.current);
    }
    return () => clearInterval(cycleRef.current);
  }, [state.live, evolve]);

  if (!state.booted) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] p-10 backdrop-blur-3xl shadow-2xl">
        <div className="flex flex-col items-center mb-10">
          <Brain className="text-blue-500 mb-6" size={48} />
          <h1 className="text-3xl font-bold text-white tracking-tighter italic text-center">AGI-KERNEL <br/><span className="text-blue-500">v7.1.7</span></h1>
        </div>
        <div className="space-y-4">
          <input type="password" placeholder="GitHub Token" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none focus:border-blue-500" value={input.token} onChange={e => setInput({...input, token: e.target.value})} />
          <input type="text" placeholder="Repo (user/repo)" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none" value={input.repo} onChange={e => setInput({...input, repo: e.target.value})} />
          <input type="text" placeholder="Path (e.g. storage/kernel.js)" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none" value={input.path} onChange={e => setInput({...input, path: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <select className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs appearance-none" value={input.provider} onChange={e => setInput({...input, provider: e.target.value, model: e.target.value === 'gemini' ? 'gemini-2.5-flash-preview-09-2025' : 'llama-3.3-70b'})}>
              <option value="gemini">Gemini</option>
              <option value="cerebras">Cerebras</option>
            </select>
            <input type="password" placeholder="API Key" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none" value={input.apiKey} onChange={e => setInput({...input, apiKey: e.target.value})} />
          </div>
          <button onClick={() => dispatch({ type: 'BOOT', payload: input })} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-500 transition-all">Connect Neural Link</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#050505] text-zinc-300 flex flex-col font-sans select-none overflow-hidden">
      <header className="h-16 border-b border-zinc-900/50 flex items-center justify-between px-6 bg-black/60 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <Brain size={18} className="text-blue-500" />
          <h2 className="text-white text-xs font-bold tracking-tight italic uppercase">Synthesis Online</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800/50">
            <span className={`w-1.5 h-1.5 rounded-full ${state.live ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`} />
            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">{state.status}</span>
          </div>
          <button onClick={() => dispatch({ type: 'TOGGLE_LIVE' })} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 ${state.live ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-600 text-white'}`}>{state.live ? 'STOP' : 'START'}</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-64 bg-[radial-gradient(circle_at_top,_#0a0a0a_0%,_#050505_100%)]">
        <div className="max-w-5xl mx-auto p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-900/30 p-8 rounded-[2rem] border border-zinc-800/50 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-6 text-zinc-500 uppercase tracking-widest text-[9px] font-bold">Evolution Maturity <TrendingUp size={14} /></div>
              <div className="text-4xl font-mono text-white mb-4">{state.maturity}%</div>
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_10px_#3b82f6]" style={{width: `${state.maturity}%`}} />
              </div>
            </div>

            <div className="bg-zinc-900/30 p-8 rounded-[2rem] border border-zinc-800/50 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-6 text-zinc-500 uppercase tracking-widest text-[9px] font-bold">Active Cycles <Activity size={14} /></div>
              <div className="text-4xl font-mono text-white">{state.cycles}</div>
            </div>

            <div className="bg-zinc-900/30 p-8 rounded-[2rem] border border-zinc-800/50 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-6 text-zinc-500 uppercase tracking-widest text-[9px] font-bold">Stagnation <AlertCircle size={14} /></div>
              <div className="text-4xl font-mono text-white">{state.stagnation}<span className="text-zinc-700 text-xl ml-2">/ {CONFIG.STAGNATION_LIMIT}</span></div>
            </div>
          </div>

          <div className="bg-zinc-900/20 p-10 rounded-[3rem] border border-zinc-900/50">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-10 flex items-center gap-3"><GitBranch size={14} className="text-blue-900" /> System Capabilities</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {Object.entries(state.capabilities).map(([k, v]) => (
                <div key={k} className="space-y-4">
                  <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-zinc-400"><span>{k}</span><span>{v} / 10</span></div>
                  <div className="flex gap-1.5">{[...Array(10)].map((_, i) => (<div key={i} className={`h-1 flex-1 rounded-full ${i < v ? 'bg-blue-500' : 'bg-zinc-800/40'}`} />))}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 border border-zinc-900/50 rounded-[2rem] bg-zinc-950/50 text-center font-mono text-[11px]">
            <span className="text-zinc-600 block mb-2 uppercase tracking-widest">Active Objective</span>
            <span className="text-blue-400">{state.objective}</span>
          </div>

        </div>
      </div>

      <div className="h-64 bg-black/95 border-t border-zinc-800/50 backdrop-blur-xl z-10 flex flex-col overflow-hidden">
        <div className="h-10 border-b border-zinc-800/50 flex items-center justify-between px-6 bg-zinc-950/80">
          <div className="flex items-center gap-3 font-black text-[9px] uppercase tracking-widest text-zinc-500"><Terminal size={12} className="text-blue-500" /> Kernel Logs {state.logError && <span className="text-red-500 ml-4 animate-pulse">! {state.logError}</span>}</div>
          <div className="text-[9px] font-mono text-zinc-700">{state.logs.length} EVOLUTIONS CACHED</div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 font-mono text-[10px] space-y-2 custom-scrollbar">
          {state.logs.map((l) => (
            <div key={l.id} className="flex gap-6 group">
              <span className="text-zinc-800 shrink-0">{new Date(l.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}</span>
              <div className={`flex-1 flex items-start gap-3 ${l.type === 'success' ? 'text-blue-400' : l.type === 'error' ? 'text-red-400' : l.type === 'warn' ? 'text-orange-400' : 'text-zinc-600'}`}>
                <div className={`w-1 h-1 rounded-full mt-1.5 shrink-0 ${l.type === 'success' ? 'bg-blue-500' : l.type === 'error' ? 'bg-red-500' : l.type === 'warn' ? 'bg-orange-500' : 'bg-zinc-800'}`} />
                <span className="break-words opacity-80 group-hover:opacity-100">{l.msg}</span>
              </div>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; } 
      `}</style>
    </div>
  );
}

