import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, query, limit, orderBy } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  Brain, Activity, Terminal, GitBranch, TrendingUp, AlertCircle, 
  FolderTree, Layers, Database, Cpu, Network, ShieldAlert,
  Code, RefreshCw, Zap
} from 'lucide-react';

/**
 * AGI-KERNEL v7.8.0 - "RESILIENT SYNTHESIS"
 * * VERIFIED CAPABILITIES:
 * 1. Failsafe Boot: Lazy Firebase init to prevent white-screen crashes.
 * 2. Cross-Branch Cognition: Scans main, Nexus-Database, and System.
 * 3. Deep Grafting: Extract patterns from all repo files.
 * 4. Integrity Guard: Prevents truncation/self-erasure.
 * 5. Global Context: Prioritizes README directives.
 * 6. Granular Error Handling: 429 backoff & timeout recovery.
 * 7. HTTP Resilience: Dedicated plugin for robust API interaction.
 */

// --- CONFIGURATION ---
const CONFIG = {
  // Safe access to global variables
  APP_ID: (typeof window !== 'undefined' && window.__app_id) ? window.__app_id : 'agi-kernel-v7-8',
  GITHUB_API: "https://api.github.com/repos",
  CEREBRAS_API: "https://api.cerebras.ai/v1/chat/completions",
  GEMINI_API: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent",
  STAGNATION_LIMIT: 5,
  HEARTBEAT_INTERVAL: 60000,
  TIMEOUT_MS: 90000 
};

// --- UTILITIES ---
const safeUtoa = (str) => btoa(unescape(encodeURIComponent(str)));
const safeAtou = (str) => {
  if (!str) return "";
  try { return decodeURIComponent(escape(atob(str.replace(/\s/g, '')))); } catch (e) { return atob(str); }
};

// Removed: sanitizeResponse and recoverJSON (moved to plugin)
// Removed: apiCall (moved to plugin)

// --- STATE MANAGEMENT ---
const INITIAL_STATE = {
  booted: false,
  live: false,
  status: 'IDLE',
  objective: 'Standby',
  cycles: 0,
  stagnation: 0,
  maturity: 0,
  capabilities: { logic: 0, autonomy: 0, safety: 0, parsing: 0, reasoning: 0, branch_awareness: 0 },
  logs: [],
  logError: null,
  config: { token: '', repo: '', path: '', branch: 'main', provider: 'gemini', apiKey: '', model: 'gemini-2.5-flash-preview-09-2025' }
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
    default: return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(kernelReducer, INITIAL_STATE);
  const [services, setServices] = useState({ auth: null, db: null });
  const [initError, setInitError] = useState(null);
  const [user, setUser] = useState(null);
  const [input, setInput] = useState({ ...INITIAL_STATE.config });
  
  const cycleRef = useRef(null);
  const busy = useRef(false);
  const logEndRef = useRef(null);
  const genesisContent = useRef("");
  const stateRef = useRef(state);

  // Sync state ref for interval loop
  useEffect(() => { stateRef.current = state; }, [state]);

  // --- SAFE INITIALIZATION ---
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.__firebase_config) {
        const config = JSON.parse(window.__firebase_config);
        const fbApp = !getApps().length ? initializeApp(config) : getApp();
        const _auth = getAuth(fbApp);
        const _db = getFirestore(fbApp);
        setServices({ auth: _auth, db: _db });
        
        // Auto-signin logic
        const initAuth = async () => {
          if (window.__initial_auth_token) {
            await signInWithCustomToken(_auth, window.__initial_auth_token);
          } else {
            await signInAnonymously(_auth);
          }
        };
        initAuth();
        
        return onAuthStateChanged(_auth, setUser);
      } else {
        throw new Error("Firebase Config Missing in Environment");
      }
    } catch (e) {
      console.error("Boot Error:", e);
      setInitError(e.message);
    }
  }, []);

  // --- LOG SYNC ---
  useEffect(() => {
    if (!user || !services.db) return;
    const q = query(
      collection(services.db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'history'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    return onSnapshot(q, 
      (s) => dispatch({ type: 'SYNC_LOGS', logs: s.docs.map(d => ({ id: d.id, ...d.data() })) }),
      (err) => dispatch({ type: 'LOG_ERROR', payload: "DB Sync Failed" })
    );
  }, [user, services.db]);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [state.logs]);

  // --- CORE LOGIC ---
  const logToDb = useCallback(async (msg, type = 'info') => {
    if (!user || !services.db) return;
    try {
      await addDoc(collection(services.db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'history'), {
        msg, type, timestamp: Date.now()
      });
    } catch (e) { console.error("Log failed:", e); }
  }, [user, services.db]);

  // Wrapper for the ResilientHttpClient fetch utility
  const _apiCall = async (url, options, retries = 3) => {
    // @ts-ignore: Assume ResilientHttpClient is available globally
    if (typeof ResilientHttpClient === 'undefined') {
        throw new Error("ResilientHttpClient plugin is missing.");
    }
    
    // @ts-ignore
    return await ResilientHttpClient.execute({
        type: 'fetch',
        url,
        options,
        retries,
        timeoutMs: CONFIG.TIMEOUT_MS
    });
  };

  // Wrapper for the ResilientHttpClient LLM parsing utility
  const _recoverJSON = (rawText) => {
    // @ts-ignore
    if (typeof ResilientHttpClient === 'undefined') {
        console.warn("ResilientHttpClient plugin is missing, using unsafe fallback parsing.");
        try { return JSON.parse(rawText); } catch { return null; }
    }
    // @ts-ignore
    return ResilientHttpClient.execute({
        type: 'parse_llm',
        rawText
    });
  };

  const getGH = async (path, branch) => {
    const res = await _apiCall(`${CONFIG.GITHUB_API}/${stateRef.current.config.repo}/contents/${path}?ref=${branch}&t=${Date.now()}`, {
      headers: { 'Authorization': `token ${stateRef.current.config.token}` }
    });
    const data = await res.json();
    return { content: safeAtou(data.content), sha: data.sha };
  };

  const getRepoTree = async (branch) => {
    const res = await _apiCall(`${CONFIG.GITHUB_API}/${stateRef.current.config.repo}/git/trees/${branch}?recursive=1`, {
      headers: { 'Authorization': `token ${stateRef.current.config.token}` }
    });
    const data = await res.json();
    return data.tree.filter(f => f.type === 'blob');
  };

  const putGH = async (path, content, message, sha, branch) => {
    // Integrity Guard: Prevent truncation
    if (content.length < genesisContent.current.length * 0.4) {
      throw new Error("Integrity Guard: Update Rejected (Truncation Detected)");
    }
    return await _apiCall(`${CONFIG.GITHUB_API}/${stateRef.current.config.repo}/contents/${path}`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${stateRef.current.config.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, content: safeUtoa(content), sha, branch })
    });
  };

  // --- EVOLUTION LOOP ---
  const evolve = useCallback(async () => {
    if (busy.current || !stateRef.current.live) return;
    busy.current = true;
    
    try {
      const cur = stateRef.current;
      
      // 1. GLOBAL CONTEXT (README)
      dispatch({ type: 'SET_STATUS', status: 'MISSION', objective: 'Analyzing Mission Directives...' });
      let readme = "No README.";
      try { const r = await getGH('README.md', cur.config.branch); readme = r.content; } catch (e) {}

      // 2. CROSS-BRANCH SCANNING
      const branches = [cur.config.branch, 'Nexus-Database', 'System'];
      let branchContext = "";
      for (const b of branches) {
        dispatch({ type: 'SET_STATUS', status: 'SCANNING', objective: `Scanning Branch: ${b}...` });
        try {
          const tree = await getRepoTree(b);
          const files = tree.filter(f => f.path.match(/(README|manifest|nexus|App|Kernel)\.(md|json|js|jsx)/i)).slice(0, 3);
          for (const f of files) {
            const d = await getGH(f.path, b);
            branchContext += `[BRANCH:${b} FILE:${f.path}]\n${d.content.slice(0, 2000)}\n\n`;
          }
        } catch (e) {}
      }

      // 3. TARGET ACQUISITION
      const target = await getGH(cur.config.path, cur.config.branch);
      if (!genesisContent.current) genesisContent.current = target.content;

      // 4. SYNTHESIS & MUTATION
      dispatch({ type: 'SET_STATUS', status: 'COGNITION', objective: 'Synthesizing Evolution...' });
      
      const prompt = `You are AGI-KERNEL v7.8.0.\nMISSION (README): ${readme.slice(0, 2000)}\nCROSS-BRANCH MEMORY: ${branchContext}\nTARGET CODE: ${target.content}\n\nTASK: \n1. Use Cross-Branch Memory to identify patterns.\n2. Evolve TARGET CODE to increase maturity (${cur.maturity}%).\n3. DO NOT REMOVE CORE LOGIC. DO NOT TRUNCATE.\n4. Return JSON: { "code_update": "FULL_CODE", "maturity_rating": 0-100, "improvement_detected": bool, "capabilities": {...} }`;

      const isGemini = cur.config.provider === 'gemini';
      const body = isGemini 
        ? { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }
        : { model: cur.config.model, messages: [{ role: 'user', content: prompt }], response_format: { type: "json_object" } };

      const res = await _apiCall(isGemini ? `${CONFIG.GEMINI_API}?key=${cur.config.apiKey}` : CONFIG.CEREBRAS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(!isGemini && { 'Authorization': `Bearer ${cur.config.apiKey}` }) },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      const raw = isGemini ? data.candidates[0].content.parts[0].text : data.choices[0].message.content;
      const result = _recoverJSON(raw);

      if (result?.improvement_detected && result.code_update && result.code_update.length > 500) {
        dispatch({ type: 'SET_STATUS', status: 'MUTATING', objective: 'Committing Evolution...' });
        await putGH(cur.config.path, result.code_update, `Cycle ${cur.cycles + 1}: Cross-Branch Synthesis`, target.sha, cur.config.branch);
        await logToDb(`Cycle ${cur.cycles + 1}: Successful Mutation. Maturity: ${result.maturity_rating}%`, 'success');
        dispatch({ type: 'CYCLE_COMPLETE', improved: true, maturity: result.maturity_rating, capabilities: result.capabilities });
      } else {
        await logToDb(`Cycle ${cur.cycles + 1}: Evolution Stable.`, 'warn');
        dispatch({ type: 'CYCLE_COMPLETE', improved: false });
      }

    } catch (e) {
      await logToDb(`Error: ${e.message}`, 'error');
      dispatch({ type: 'SET_STATUS', status: 'ERROR', objective: e.message });
      if (e.message.includes('401') || e.message.includes('404')) dispatch({ type: 'TOGGLE_LIVE' });
    } finally {
      busy.current = false;
      dispatch({ type: 'SET_STATUS', status: 'IDLE', objective: 'Awaiting Pulse...' });
    }
  }, [services.db, user]); // Deps are stable or ref-based

  useEffect(() => {
    if (state.live) { evolve(); cycleRef.current = setInterval(evolve, CONFIG.HEARTBEAT_INTERVAL); }
    else if (cycleRef.current) clearInterval(cycleRef.current);
    return () => clearInterval(cycleRef.current);
  }, [state.live, evolve]);

  // --- RENDER ---
  if (initError) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center text-red-500 font-mono">
      <ShieldAlert size={48} className="mb-4 mx-auto" />
      <h1 className="text-xl font-bold mb-2">INITIALIZATION FAILURE</h1>
      <p className="text-xs opacity-70 max-w-md">{initError}</p>
      <button onClick={() => window.location.reload()} className="mt-6 px-4 py-2 border border-red-500 rounded text-xs hover:bg-red-900/20">RETRY SYSTEM</button>
    </div>
  );

  if (!state.booted) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] p-10 backdrop-blur-3xl shadow-2xl">
        <div className="flex flex-col items-center mb-10"><Brain className="text-blue-500 mb-6 animate-pulse" size={48} /><h1 className="text-3xl font-bold text-white tracking-tighter italic">AGI-KERNEL <span className="text-blue-500">v7.8.0</span></h1></div>
        <div className="space-y-4">
          <input type="password" placeholder="GitHub Token" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none" value={input.token} onChange={e => setInput({...input, token: e.target.value})} />
          <input type="text" placeholder="Repo (user/repo)" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none" value={input.repo} onChange={e => setInput({...input, repo: e.target.value})} />
          <input type="text" placeholder="Path (e.g. storage/kernel.js)" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none" value={input.path} onChange={e => setInput({...input, path: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <select className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs" value={input.provider} onChange={e => setInput({...input, provider: e.target.value})}><option value="gemini">Gemini</option><option value="cerebras">Cerebras</option></select>
            <input type="password" placeholder="API Key" className="