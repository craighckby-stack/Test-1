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

  const handleBoot = (e) => {
    e.preventDefault();
    if (!input.token || !input.repo || !input.path || !input.apiKey) {
      alert("Please fill all required fields.");
      return;
    }
    dispatch({ type: 'BOOT', payload: input });
    dispatch({ type: 'TOGGLE_LIVE' }); // Start the engine
  };

  const evolve = useCallback(async () => {
    if (busy.current || !state.live) return;
    
    // Self-Improvement v7.9.1: Stagnation Detection
    if (state.stagnation >= CONFIG.STAGNATION_LIMIT) {
      dispatch({ type: 'SET_STATUS', status: 'CRITICAL', objective: 'STAGNATION FAILURE' });
      await logToDb(`CRITICAL: Stagnation Limit (${CONFIG.STAGNATION_LIMIT}) Reached. Halting self-improvement. Manual intervention required.`, 'critical');
      dispatch({ type: 'TOGGLE_LIVE' }); // Toggle live off
      return;
    }

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
  }, [state.live, state.config, state.maturity, state.cycles, state.stagnation, logToDb]);

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

          <form className="space-y-4" onSubmit={handleBoot}>
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
                <label className="text-[9px] uppercase font-bold text-zinc-600 px-2 tracking-widest">{input.provider.toUpperCase()} API Key</label>
                <input 
                  type="password" placeholder={`Enter ${input.provider} key`} 
                  className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl text-white text-sm focus:ring-1 ring-blue-500 outline-none"
                  value={input.apiKey} onChange={e => setInput({...input, apiKey: e.target.value})}
                />
              </div>
            </div>
            <button 
              type="submit"
              className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-700 transition-colors rounded-xl font-bold text-white text-lg shadow-lg shadow-blue-900/40"
            >
              BOOT KERNEL
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ... (Kernel dashboard UI would go here if !state.booted was false)
  // Placeholder return for booted state (required for component completeness)
  return <div className="min-h-screen bg-black text-white p-4">Kernel Operational. Status: {state.status}</div>;
}