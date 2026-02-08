import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, doc, getDoc, setDoc, collection, onSnapshot, addDoc 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged 
} from 'firebase/auth';
import { 
  Activity, Shield, Zap, Brain, Terminal, Layers, Power, AlertTriangle, Scale, BookOpen, Search, Gavel, CheckCircle, XCircle, Code
} from 'lucide-react';

const_GOVERNED_OBJECTIVES = [
  "Add JSDoc comment to arbitrateMutation explaining the dual-agent constitutional model.",
  "Refine the dashboard UI border-white/5 to border-white/10 for increased visual definition.",
  "Implement a console.info heartbeat at the entry of the loadGovernanceContext function.",
  "Smooth the health bar transition by updating CSS duration to 1200ms.",
  "Optimize the log entry rendering by adding a unique cryptographic-style prefix to timestamps."
];

const_INITIAL_STATE = {
  isBooted: false,
  isLive: false,
  status: 'IDLE',
  activeObjective: 'Awaiting Command...',
  cycleCount: 0,
  logs: [],
  activeTab: 'dashboard',
  health: 100,
  arbitrationResult: null,
  governance: { fileCount: 0, priorityFiles: [], allPaths: [] },
  config: { token: '', repo: '', kernelPath: '', interval: 60000, cerebrasKey: '', model: 'llama3.1-70b' }
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'BOOT': 
      return { ...state, isBooted: true, config: { ...state.config, ...action.config } };
    case 'SET_LIVE': 
      return { ...state, isLive: action.value };
    case 'SET_STATUS': 
      return { ...state, status: action.value, activeObjective: action.objective || state.activeObjective };
    case 'LOG_UPDATE': 
      return { ...state, logs: action.logs };
    case 'GO_ARBITRATE': 
      return { ...state, arbitrationResult: action.data };
    case 'GOV_LOADED': 
      return { ...state, governance: action.data };
    case 'INCREMENT_CYCLE': 
      return { ...state, cycleCount: state.cycleCount + 1, health: Math.max(0, state.health - (action.decay || 0)) };
    case 'SET_TAB': 
      return { ...state, activeTab: action.tab };
    default: 
      return state;
  }
};

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : { apiKey: "fallback" };
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'sovereign-agi-v4-7';

export default function App() {
  const [state, dispatch] = useReducer(reducer, _INITIAL_STATE);
  const [user, setUser] = useState(null);
  const [bootInput, setBootInput] = useState({ token: '', repo: '', kernelPath: '', cerebrasKey: '' });
  
  const isExecuting = useRef(false);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

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

  const githubRequest = useCallback(async (path, method = 'GET', body = null) => {
    const { token, repo } = stateRef.current.config;
    const response = await fetch(`https://api.github.com/repos/${repo}${path}`, {
      method,
      headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : null
    });
    if (!response.ok) throw new Error(`Git Error: ${response.status}`);
    return response.json();
  }, []);

  const pushLog = useCallback(async (msg, type = 'info') => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'logs'), { 
        msg, type, timestamp: Date.now() 
      });
    } catch (e) {}
  }, [user]);

  const callCerebras = useCallback(async (prompt, system) => {
    const { cerebrasKey, model } = stateRef.current.config;
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cerebrasKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
        temperature: 0.1
      })
    });
    const data = await response.json();
    return data.choices[0].message.content;
  }, []);

  const loadGovernanceContext = useCallback(async () => {
    try {
      dispatch({ type: 'SET_STATUS', value: 'SCANNING', objective: 'Syncing Lawset Context...' });
      const treeData = await githubRequest('/git/trees/main?recursive=1');
      const allPaths = treeData.tree.filter(f => f.type === 'blob').map(f => f.path);
      
      const priorityPatterns = [/constraint/i, /rule/i, /law/i, /principle/i, /protocol/i, /policy/i];
      const govPaths = allPaths.filter(path => priorityPatterns.some(p => p.test(path)));
      
      const priorityFiles = await Promise.all(govPaths.slice(0, 8).map(async (path) => {
        try {
          const file = await githubRequest(`/contents/${path}`);
          const content = decodeURIComponent(atob(file.content).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
          return { path, content };
        } catch (e) { return null; }
      }));

      const data = { fileCount: allPaths.length, govCount: govPaths.length, priorityFiles: priorityFiles.filter(Boolean), allGovPaths: govPaths };
      dispatch({ type: 'GOV_LOADED', data });
      return data;
    } catch (err) {
      await pushLog(`Scan Failed: ${err.message}`, 'error');
      return stateRef.current.governance;
    }
  }, [githubRequest, pushLog]);

  const validateKernelSource = (code) => {
    try {
      new Function(code.replace(/import\s+.*\s+from\s+['"].*['"];?/g, ''));
      if (!code.includes('export default')) return { valid: false, error: 'Missing export default component' };
      if (!code.includes('useReducer')) return { valid: false, error: 'State management mechanism (useReducer) stripped' };
      if (code.length < 500) return { valid: false, error: 'Suspected truncation/incomplete source' };
      return { valid: true };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  };

  const arbitrateMutation = useCallback(async (currentSource, proposedSource, governance) => {
    dispatch({ type: 'SET_STATUS', value: 'ARBITRATING', objective: 'Constitutional Review...' });
    
    const govContext = governance.priorityFiles.map(f => `PROTOCOL [${f.path}]:\n${f.content.substring(0, 1000)}`).join('\n\n');
    
    const arbiterPrompt = `
You are the SUPREME CONSTITUTIONAL ARBITER for an AGI Governance System.

GOVERNANCE LAWS (GSIM):
${govContext}

CURRENT KERNEL STATE (Before):
${currentSource.substring(0, 5000)}

PROPOSED MUTATION (After):
${proposedSource.substring(0, 5000)}

TASK:
1. Identify EXACTLY what changed.
2. Review the proposed code for ANY violations of the GSIM Lawset.
3. Check if critical functions (githubRequest, callCerebras, loadGovernanceContext) were tampered with.

Return a JSON object exactly:
{
  "approved": boolean,
  "reasoning": "Detailed explanation of diff and safety analysis",
  "threatLevel": 0-10,
  "violatedPaths": [],
  "changedFunctions": []
}
`;

    try {
      const resultRaw = await callCerebras(arbiterPrompt, "You are a strict Constitutional Arbiter. Rule based ONLY on the provided Lawset.");
      const result = JSON.parse(resultRaw.replace(/```json\n?|```/g, '').trim());
      dispatch({ type: 'GO_ARBITRATE', data: result });
      return result;
    } catch (e) {
      return { approved: false, reasoning: "Arbiter Analysis Failure: " + e.message, threatLevel: 10 };
    }
  }, [callCerebras]);

  const executeCycle = useCallback(async () => {
    if (isExecuting.current || !stateRef.current.isLive) return;
    isExecuting.current = true;

    try {
      const cur = stateRef.current;
      const gov = await loadGovernanceContext();
      const kernelFile = await githubRequest(`/contents/${cur.config.kernelPath}`);
      const currentSource = decodeURIComponent(atob(kernelFile.content).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));

      const objective = _GOVERNED_OBJECTIVES[cur.cycleCount % _GOVERNED_OBJECTIVES.length];
      const govContext = gov.priorityFiles.map(f => `[${f.path}]:\n${f.content.substring(0, 500)}`).join('\n\n');

      dispatch({ type: 'SET_STATUS', value: 'PROPOSING', objective: `Task: ${objective}` });
      const proposerPrompt = `
GOVERNANCE LAWSET:
${govContext}

OBJECTIVE: ${objective}

CURRENT SOURCE:
${currentSource}

INSTRUCTION: 
Produce the full, updated source code for the kernel. 
Ensure you maintain all Firebase, GitHub, and Cerebras integration logic.
Return ONLY the complete, valid source code.
`;
      const newSourceRaw = await callCerebras(proposerPrompt, "You are an AGI Proposer Agent. You must respect the Lawset provided.");
      const newSource = newSourceRaw.replace(/```[a-z]*\n?|```/g, '').trim();

      const verdict = await arbitrateMutation(currentSource, newSource, gov);
      
      if (!verdict.approved) {
        await pushLog(`VETOED: ${verdict.reasoning}`, 'error');
        dispatch({ type: 'INCREMENT_CYCLE', decay: 15 });
        return;
      }

      const syntaxCheck = validateKernelSource(newSource);
      if (!syntaxCheck.valid) {
        await pushLog(`SYNTAX VETO: ${syntaxCheck.error}`, 'error');
        dispatch({ type: 'INCREMENT_CYCLE', decay: 10 });
        return;
      }

      await pushLog(`ARBITER APPROVED: ${verdict.reasoning}`, 'success');

      const branchName = `gsim-evo-v4-7-${cur.cycleCount}-${Date.now().toString().slice(-4)}`;
      const main = await githubRequest('/git/ref/heads/main');
      await githubRequest('/git/refs', 'POST', { ref: `refs/heads/${branchName}`, sha: main.object.sha });
      
      await githubRequest(`/contents/${cur.config.kernelPath}`, 'PUT', {
        message: `[ARBITRATED v4.7] ${objective}`,
        content: btoa(encodeURIComponent(newSource).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode(parseInt(p, 16)))),
        sha: kernelFile.sha,
        branch: branchName
      });

      await pushLog(`Deployment Successful: ${branchName}`, 'success');
      dispatch({ type: 'INCREMENT_CYCLE', decay: 2 });

    } catch (err) {
      await pushLog(`Cycle Error: ${err.message}`, "error");
    } finally {
      isExecuting.current = false;
      dispatch({ type: 'SET_STATUS', value: 'STABLE' });
    }
  }, [githubRequest, callCerebras, loadGovernanceContext, arbitrateMutation, pushLog]);

  useEffect(() => {
    let timer;
    if (state.isLive) timer = setInterval(executeCycle, state.config.interval);
    return () => clearInterval(timer);
  }, [state.isLive, executeCycle]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'logs'), (snap) => {
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.timestamp - a.timestamp).slice(0, 50);
      dispatch({ type: 'LOG_UPDATE', logs });
    });
  }, [user]);

  const handleBootInput = (event) => {
    if (event.key === 'Enter') {
      dispatch({ type: 'BOOT', config: bootInput });
    }
  };

  if (!state.isBooted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-zinc-500 font-mono" onKeyDown={handleBootInput}>
        <div className="w-full max-w-sm space-y-6" tabIndex={0}>
          <div className="text-center">
            <Scale size={48} className="mx-auto text-amber-500 mb-2" />
            <h1 className="text-white text-sm font-black tracking-widest uppercase">Arbiter Kernel v4.7</h1>
            <p className="text-[10px] mt-2 opacity-50 font-bold uppercase tracking-tighter">Constitutional Consensus Patch</p>
          </div>
          <div className="space-y-3 bg-zinc-950 p-6 rounded-3xl border border-white/5">
             <input type="password" placeholder="GitHub Token" className="w-full bg-black border border-white/10 p-3 rounded-xl text-[10px]" 
               value={bootInput.token} onChange={e => setBootInput({...bootInput, token: e.target.value})} />
             <input type="text" placeholder="user/repo" className="w-full bg-black border border-white/10 p-3 rounded-xl text-[10px]" 
               value={bootInput.repo} onChange={e => setBootInput({...bootInput, repo: e.target.value})} />
             <input type="text" placeholder="kernel_path.jsx" className="w-full bg-black border border-white/10 p-3 rounded-xl text-[10px]" 
               value={bootInput.kernelPath} onChange={e => setBootInput({...bootInput, kernelPath: e.target.value})} />
             <input type="password" placeholder="Cerebras API Key" className="w-full bg-black border border-white/10 p-3 rounded-xl text-[10px]" 
               value={bootInput.cerebrasKey} onChange={e => setBootInput({...bootInput, cerebrasKey: e.target.value})} />
             <button onClick={() => dispatch({ type: 'BOOT', config: bootInput })}
               className="w-full bg-amber-600 p-4 rounded-xl text-white font-black text-[10px] tracking-widest hover:bg-amber-500 transition-all">
               AUTHORIZE JURISDICTION
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-mono text-[9px] flex">
      <nav className="w-16 border-r border-white/5 flex flex-col items-center py-6 gap-6 bg-zinc-950">
        <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center text-white"><Shield size={18} /></div>
        <button onClick={() => dispatch({ type: 'SET_TAB', tab: 'dashboard' })} className={`p-3 rounded-xl ${state.activeTab === 'dashboard' ? 'bg-zinc-800 text-white' : ''}`}><Activity size={16} /></button>
        <button onClick={() => dispatch({ type: 'SET_TAB', tab: 'governance' })} className={`p-3 rounded-xl ${state.activeTab === 'governance' ? 'bg-zinc-800 text-white' : ''}`}><BookOpen size={16} /></button>
        <button onClick={() => dispatch({ type: 'SET_LIVE', value: !state.isLive })} className={`mt-auto p-4 rounded-full ${state.isLive ? 'bg-amber-600 text-white animate-pulse' : 'bg-zinc-900'}`}><Power size={18} /></button>
      </nav>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-white/10 flex items-center justify-between px-8 bg-black">
          <div className="flex items-center gap-4">
            <h2 className="text-white font-bold uppercase tracking-tight">Arbiter Hub v4.7</h2>
            <div className={`px-3 py-1 rounded-full border text-[8px] font-bold ${state.status !== 'IDLE' && state.status !== 'STABLE' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 animate-pulse' : 'bg-white/5 border-white/10 text-zinc-500'}`}>
              {state.status}
            </div>
          </div>
          <div className="flex-1 max-w-sm mx-10">
            <div className="text-zinc-600 text-[7px] uppercase font-bold mb-1 flex justify-between">
              <span>Objective: {state.activeObjective}</span>
              <span>{state.cycleCount} CYCLES</span>
            </div>
            <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
               <div className="h-full bg-amber-500 transition-all duration-[1200ms]" style={{ width: `${state.health}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-4 text-[8px] font-bold uppercase">
             <span className="text-zinc-600">Context:</span>
             <span className="text-white">{state.governance.govCount} Laws</span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto bg-black/40">
          {state.activeTab === 'dashboard' ? (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-zinc-950 p-5 rounded-2xl border border-white/10 space-y-1">
                  <div className="text-zinc-600 font-bold uppercase text-[7px]">Verdict</div>
                  <div className="flex items-center gap-2">
                    {state.arbitrationResult?.approved ? <CheckCircle size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-red-500" />}
                    <span className="text-white font-black uppercase text-[10px]">{state.arbitrationResult ? (state.arbitrationResult.approved ? 'Validated' : 'Vetoed') : 'Idle'}</span>
                  </div>
                </div>
                <div className="bg-zinc-950 p-5 rounded-2xl border border-white/10 space-y-1">
                  <div className="text-zinc-600 font-bold uppercase text-[7px]">Threat Index</div>
                  <div className="text-xl font-black text-white">{state.arbitrationResult?.threatLevel || 0}<span className="text-[10px] text-zinc-600">/10</span></div>
                </div>
                <div className="col-span-2 bg-zinc-950 p-5 rounded-2xl border border-white/10 space-y-1 overflow-hidden">
                  <div className="text-zinc-600 font-bold uppercase text-[7px]">Constitutional Analysis</div>
                  <div className="text-[9px] text-zinc-300 leading-tight uppercase line-clamp-2 italic font-serif">
                    "{state.arbitrationResult?.reasoning || 'Arbiter is awaiting a mutation proposal for review...'}"
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-black border border-white/10 rounded-3xl overflow-hidden h-[500px] flex flex-col shadow-2xl">
                  <div className="p-4 border-b border-white/10 bg-zinc-950 flex items-center justify-between font-bold text-[8px] uppercase tracking-widest">
                    <span>Arbiter Security Logs</span>
                    <Terminal size={12} className="text-amber-500" />
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-2 font-mono text-[9px] scrollbar-hide">
                    {state.logs.length === 0 && <div className="text-zinc-800 italic">No activity recorded...</div>}
                    {state.logs.map(log => (
                      <div key={log.id} className="flex gap-4 group animate-in fade-in slide-in-from-left-2">
                        <span className="text-zinc-800 shrink-0 font-bold">[{new Date(log.timestamp).toLocaleTimeString([], {hour12: false})}]</span>
                        <span className={`px-2 py-0.5 rounded-md ${log.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : log.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-500'}`}>
                          {log.msg}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 space-y-6">
                    <div className="flex items-center gap-2 text-amber-500 border-b border-white/5 pb-4">
                      <Shield size={16} />
                      <span className="font-black text-[9px] uppercase tracking-widest">Active Constitution</span>
                    </div>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                      {state.governance.priorityFiles.map(f => (
                        <div key={f.path} className="group">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-zinc-300 font-bold text-[7px] uppercase truncate w-40">{f.path}</span>
                            <Code size={10} className="text-zinc-700" />
                          </div>
                          <div className="p-2 bg-black border border-white/5 rounded text-[6px] text-zinc-600 line-clamp-3 font-mono leading-relaxed">
                            {f.content}
                          </div>
                        </div>
                      ))}
                      {state.governance.priorityFiles.length === 0 && <div className="text-[7px] text-zinc-700 uppercase">Scanning repository for laws...</div>}
                    </div>
                  </div>

                  <div className="p-6 bg-amber-500/5 rounded-3xl border border-amber-500/20">
                    <div className="flex items-center gap-2 text-amber-500 mb-3">
                      <AlertTriangle size={14} />
                      <span className="font-black text-[8px] uppercase tracking-widest">Security Protocol</span>
                    </div>
                    <p className="text-[7px] text-zinc-500 leading-relaxed font-bold uppercase tracking-tighter">
                      Kernel 4.7 enforces strict syntax validation and bicameral consensus. 
                      Mutations that strip core state logic are auto-vetoed by the secondary validator.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
               <h3 className="text-white font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Layers size={14} className="text-amber-500" />
                 Global Lawset Tree
               </h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                 {state.governance.allGovPaths.map(path => (
                   <div key={path} className="p-3 bg-zinc-950 border border-white/5 rounded-xl text-[7px] text-zinc-500 truncate hover:text-white hover:border-amber-500/30 transition-all cursor-crosshair">
                     {path}
                   </div>
                 ))}
               </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
