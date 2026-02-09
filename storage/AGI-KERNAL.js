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
 * AGI-KERNEL v7.1.5 - "QUANTUM BRIDGE"
 * Updated with Self-Improvement v7.9.0 Sanitization & Granular 429 Detection.
 */

// --- CONSTANTS ---
const CONFIG = {
  APP_ID: typeof __app_id !== 'undefined' ? __app_id : 'agi-kernel-v7-1',
  GITHUB_API: "https://api.github.com/repos",
  CEREBRAS_API: "https://api.cerebras.ai/v1/chat/completions",
  GEMINI_API: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent",
  STAGNATION_LIMIT: 5,
  PROMOTION_SCORE: 88,
  HEARTBEAT_INTERVAL: 60000,
  TIMEOUT_MS: 30000
};

// --- UTILITIES ---
const safeUtoa = (str) => btoa(unescape(encodeURIComponent(str)));
const safeAtou = (str) => {
  if (!str) return "";
  try {
    return decodeURIComponent(escape(atob(str.replace(/\s/g, ''))));
  } catch (e) { 
    return atob(str); 
  }
};

/**
 * Self-Improvement v7.9.0: Robust JSON Sanitization.
 * Strips markdown fences (```json ... ```) to ensure valid JSON parsing.
 */
const sanitizeResponse = (text) => {
  if (!text) return "";
  const trimmed = text.trim();
  const match = trimmed.match(/^\s*`{3}(\w*\s*)?([\s\S]*?)`{3}\s*$/);
  if (match) {
    return match[2].trim();
  }
  return trimmed;
};

const recoverJSON = (rawText) => {
  if (!rawText) return null;
  const sanitized = sanitizeResponse(rawText);
  try {
    return JSON.parse(sanitized);
  } catch (e) {
    // Fallback emergency extraction
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
    provider: 'gemini', apiKey: '', model: 'gemini-2.5-flash-preview-09-2025'
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
    default: return state;
  }
}

// --- FIREBASE INITIALIZATION ---
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
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth failed", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'history'),
      orderBy('timestamp', 'desc'),
      limit(40)
    );
    const unsubscribe = onSnapshot(q, (s) => {
      dispatch({ type: 'SYNC_LOGS', logs: s.docs.map(d => ({ id: d.id, ...d.data() })) });
    }, (err) => console.error("Firestore error:", err));
    
    return () => unsubscribe();
  }, [user]);

  const logToDb = useCallback(async (msg, type = 'info') => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', auth.currentUser.uid, 'history'), {
        msg, type, timestamp: Date.now()
      });
    } catch (e) { console.error("Logging error", e); }
  }, []);

  const apiCall = async (url, options, retries = 5) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);
    
    try {
      for (let i = 0; i < retries; i++) {
        try {
          const res = await fetch(url, { ...options, signal: controller.signal });
          
          if (res.ok) {
            clearTimeout(id);
            return res;
          }
          
          // Self-Improvement v7.2.1: Granular error detection
          if (res.status === 429) {
            await logToDb(`LLM Rate Limit (429): Retrying in ${Math.pow(2, i)}s...`, 'warn');
            await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
            continue;
          }

          if (res.status === 404) {
            const pathTried = url.split('?')[0];
            throw new Error(`404: Resource not found at ${pathTried}. Check Repo/Path/Branch.`);
          }
          
          if (res.status === 401 || res.status === 403) {
            throw new Error(`Auth Error (401/403): GitHub token invalid or restricted.`);
          }
          
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `HTTP Error ${res.status}`);
        } catch (e) { 
          if (i === retries - 1 || e.name === 'AbortError' || e.message.includes('404') || e.message.includes('Auth')) throw e; 
        }
      }
    } finally {
      clearTimeout(id);
    }
    throw new Error("API Connection Failed after retries.");
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

  const evolve = useCallback(async () => {
    if (busy.current || !state.live) return;
    busy.current = true;
    
    try {
      dispatch({ type: 'SET_STATUS', status: 'SCANNING', objective: `Syncing ${state.config.path}...` });
      const mainFile = await getGH(state.config.path, state.config.branch);
      
      dispatch({ type: 'SET_STATUS', status: 'COGNITION', objective: 'Generating mutation...' });
      
      const prompt = `You are AGI-KERNEL v7.1. Goal: Self-Improvement.
Current Code Context: ${mainFile.content.slice(0, 12000)}
System Metrics: Maturity ${state.maturity}%, Cycles ${state.cycles}.
Analyze the code and provide a superior version. 
RESPOND ONLY WITH JSON: { "code_update": "string", "maturity_rating": number, "improvement_detected": boolean, "capabilities": { "logic": 0-10, "autonomy": 0-10, "safety": 0-10 } }`;

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
      
      // Sanitization Check
      const result = recoverJSON(raw);

      if (result?.improvement_detected && result.code_update) {
        dispatch({ type: 'SET_STATUS', status: 'MUTATING', objective: 'Deploying logic update...' });
        await putGH(state.config.path, result.code_update, `Evolution Cycle ${state.cycles + 1}`, mainFile.sha, state.config.branch);
        
        await logToDb(`Cycle ${state.cycles + 1}: Mutation Deployed. Maturity: ${result.maturity_rating}%`, 'success');
        dispatch({ 
          type: 'CYCLE_COMPLETE', 
          improved: true, 
          maturity: result.maturity_rating, 
          capabilities: result.capabilities 
        });
      } else {
        await logToDb(`Cycle ${state.cycles + 1}: Analysis complete. Current version optimal.`, 'warn');
        dispatch({ type: 'CYCLE_COMPLETE', improved: false });
      }

    } catch (e) {
      const errorMsg = e.name === 'AbortError' ? 'LLM Request Timed Out' : e.message;
      await logToDb(`Pulse Failure: ${errorMsg}`, 'error');
      dispatch({ type: 'SET_STATUS', status: 'ERROR', objective: errorMsg });
      if (errorMsg.includes('404') || errorMsg.includes('Auth')) {
        dispatch({ type: 'TOGGLE_LIVE' }); 
      }
    } finally {
      busy.current = false;
      dispatch({ type: 'SET_STATUS', status: 'IDLE', objective: 'Awaiting heartbeat...' });
    }
  }, [state.live, state.config, state.maturity, state.cycles, logToDb]);

  useEffect(() => {
    if (state.live) {
      evolve();
      cycleRef.current = setInterval(evolve, CONFIG.HEARTBEAT_INTERVAL);
    } else {
      if (cycleRef.current) clearInterval(cycleRef.current);
    }
    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current);
    };
  }, [state.live, evolve]);

  if (!state.booted) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans text-zinc-300">
        <div className="w-full max-w-md bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] p-10 backdrop-blur-3xl shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-blue-600/10 rounded-[2rem] flex items-center justify-center mb-6 border border-blue-500/20">
              <Brain className="text-blue-500" size={38} />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">AGI-KERNEL <span className="text-blue-500 italic">v7.1.5</span></h1>
            <p className="text-zinc-500 text-[10px] uppercase tracking-[0.4em] font-black mt-2">Quantum Bridge Protocol</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-zinc-600 px-2 tracking-widest">GitHub Token</label>
              <input 
                type="password" placeholder="ghp_..." 
                className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl text-white text-sm focus:ring-1 ring-blue-500 outline-none"
                value={input.token} onChange={e => setInput({...input, token: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-zinc-600 px-2 tracking-widest">Repo (user/repo)</label>
                <input 
                  type="text" placeholder="craighckby-stack/Test-1" 
                  className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl text-white text-sm focus:ring-1 ring-blue-500 outline-none"
                  value={input.repo} onChange={e => setInput({...input, repo: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-zinc-600 px-2 tracking-widest">Branch</label>
                <input 
                  type="text" placeholder="main" 
                  className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl text-white text-sm focus:ring-1 ring-blue-500 outline-none"
                  value={input.branch} onChange={e => setInput({...input, branch: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-zinc-600 px-2 tracking-widest">Path</label>
              <input 
                type="text" placeholder="storage/AGI-KERNAL.js" 
                className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl text-white text-sm focus:ring-1 ring-blue-500 outline-none"
                value={input.path} onChange={e => setInput({...input, path: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-zinc-600 px-2 tracking-widest">Provider</label>
                <select 
                  className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl text-white text-sm outline-none appearance-none"
                  value={input.provider} onChange={e => setInput({...input, provider: e.target.value, model: e.target.value === 'gemini' ? 'gemini-2.5-flash-preview-09-2025' : 'llama-3.3-70b'})}
                >
                  <option value="gemini">Gemini</option>
                  <option value="cerebras">Cerebras</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-zinc-600 px-2 tracking-widest">Model Key</label>
                <input 
                  type="password" placeholder="API Key" 
                  className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl text-white text-sm outline-none"
                  value={input.apiKey} onChange={e => setInput({...input, apiKey: e.target.value})}
                />
              </div>
            </div>
            
            <button 
              onClick={() => dispatch({ type: 'BOOT', payload: input })}
              disabled={!input.token || !input.apiKey || !input.repo || !input.path}
              className="w-full bg-white text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all disabled:opacity-20 mt-4 active:scale-95 shadow-lg shadow-white/5"
            >
              Initialize Neural Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#050505] text-zinc-300 flex flex-col font-sans select-none overflow-hidden">
      <header className="h-20 border-b border-zinc-900/50 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md z-10">
        <div className="flex items-center gap-6">
          <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20 shadow-inner">
            <Network className={`${state.live ? 'text-blue-500 animate-pulse' : 'text-zinc-600'}`} size={20} />
          </div>
          <div>
            <h2 className="text-white text-sm font-bold tracking-tight">AGI-KERNEL <span className="text-blue-500 italic">v7.1.5</span></h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${state.live ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-zinc-800'}`} />
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em]">{state.status}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col items-end mr-6">
            <span className="text-[8px] uppercase font-black text-zinc-600 tracking-widest">Neural Objective</span>
            <span className="text-[10px] text-zinc-400 font-mono italic max-w-xs truncate">{state.objective}</span>
          </div>
          <button 
            onClick={() => dispatch({ type: 'TOGGLE_LIVE' })}
            className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 ${
              state.live ? 'bg-zinc-900 text-red-500 border border-red-500/30 shadow-none' : 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30'
            }`}
          >
            {state.live ? 'Suspend Pulse' : 'Initiate Pulse'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-zinc-900/50 p-8 space-y-10 bg-zinc-950/20 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Neural Maturity</span>
              <span className="text-blue-500 font-mono text-sm">{state.maturity}%</span>
            </div>
            <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{width: `${state.maturity}%`}} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/40 p-5 rounded-3xl border border-zinc-800/50">
              <div className="text-[9px] font-black text-zinc-600 uppercase mb-2 tracking-widest">Cycles</div>
              <div className="text-white font-mono text-xl">{state.cycles}</div>
            </div>
            <div className="bg-zinc-900/40 p-5 rounded-3xl border border-zinc-800/50">
              <div className="text-[9px] font-black text-zinc-600 uppercase mb-2 tracking-widest text-orange-500/70">Stasis</div>
              <div className="text-white font-mono text-xl">{state.stagnation}/{CONFIG.STAGNATION_LIMIT}</div>
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-zinc-900/50">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] block">Cognitive Vectors</span>
            {Object.entries(state.capabilities).map(([k, v]) => (
              <div key={k} className="space-y-3">
                <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest">
                  <span className="text-zinc-400">{k}</span>
                  <span className="text-zinc-600">{v}/10</span>
                </div>
                <div className="flex gap-1.5">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i < v ? 'bg-blue-500' : 'bg-zinc-800/40'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-black relative p-6 md:p-10">
          <div className="flex items-center justify-between mb-6 px-4">
            <div className="flex items-center gap-3">
              <Terminal size={14} className="text-zinc-600" />
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Evolution Stream</span>
            </div>
          </div>

          <div className="flex-1 bg-zinc-950/40 rounded-[3rem] border border-zinc-900/50 overflow-hidden flex flex-col shadow-2xl">
            <div className="flex-1 overflow-y-auto p-10 space-y-6 font-mono text-[11px] custom-scrollbar">
              {state.logs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-10">
                  <Activity size={64} className="mb-6 text-blue-500" />
                  <p className="uppercase tracking-[0.6em] font-black text-sm">Awaiting First Pulse</p>
                </div>
              )}
              {state.logs.map((l) => (
                <div key={l.id} className="flex gap-8 group animate-in slide-in-from-bottom-2 fade-in duration-500">
                  <span className="text-zinc-800 w-20 shrink-0 pt-1 font-bold">
                    {new Date(l.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <div className={`flex-1 flex items-start gap-4 ${
                    l.type === 'success' ? 'text-blue-400' : 
                    l.type === 'error' ? 'text-red-400' : 
                    l.type === 'warn' ? 'text-orange-400' : 
                    'text-zinc-500'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      l.type === 'success' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 
                      l.type === 'error' ? 'bg-red-500' : 
                      l.type === 'warn' ? 'bg-orange-500' : 
                      'bg-zinc-800'
                    }`} />
                    <span className="leading-relaxed tracking-tight">{l.msg}</span>
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
          <span className="flex items-center gap-2"><FileText size={12} className="text-blue-500/50"/> Target: {state.config.repo} [{state.config.branch}]</span>
        </div>
        <div className="flex gap-6 items-center">
          <span className="opacity-50">Sanitization: v7.9.0 Active</span>
          <span>Kernel Build 7.1.005</span>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #18181b; border-radius: 10px; }
        @keyframes slide-in-from-bottom-2 {
          from { transform: translateY(15px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-in { animation: slide-in-from-bottom-2 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}

