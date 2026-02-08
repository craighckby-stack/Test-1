AGI-KERNAL-SIGNATURE-V6-9
import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { Activity, ShieldCheck, Zap, ScanText, AlertTriangle, KeyRound, Globe, Lock, ThermometerSnowflake, Binary, Cpu, GitMerge, Gauge } from 'lucide-react';

/**
 * AGI-KERNAL v6.9 - "MEE_INTEGRATION"
 * FIX: Implements MEE Metric Evaluation Framework and Governance Adapter.
 * MISSION: Merge Target logic INTO Kernel logic without deletion.
 */

// --- Governance API Adapter ---
class GovernanceApiAdapter {
    constructor(endpoint) {
        if (!endpoint) throw new Error("Adapter requires a configuration endpoint.");
        this.endpoint = endpoint;
    }

    async fetchLatestConfig() {
        // console.log(`[Adapter] Attempting to fetch constants from: ${this.endpoint}`);
        
        // Mocked return for development/testing, simulating dynamic governance overlay:
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay

        return {
            system_tuning: {
                governance_cycle_ms: 45000, // Dynamic adjustment
                min_r_index_threshold: 55,
                dynamic_threshold_adjustment: true
            },
        };
    }
}

// --- MEE Metric Evaluation Engine ---
const MEE_ENGINE = {
    // Default weights for core metrics
    DEFAULT_WEIGHTS: {
        absorptionRate: 0.4, // How much new code was absorbed
        successRate: 0.5,    // Ratio of successful grafts to total cycles
        latencyScore: 0.1    // Inverse measure of execution speed (normalized)
    },

    // 1. Weighted Calculation (W_SCORE)
    calculateWScore: (metrics, weights) => {
        let totalScore = 0;
        let totalWeight = 0;
        for (const key in metrics) {
            if (weights[key] !== undefined) {
                totalScore += metrics[key] * weights[key];
                totalWeight += weights[key];
            }
        }
        return totalWeight > 0 ? totalScore / totalWeight : 0;
    },

    // 2. R_INDEX Calculation (Reliability Index)
    calculateRIndex: (wScore, cycleCount, errorRate) => {
        // R_INDEX = (W_SCORE * log(CycleCount + 1)) / (1 + ErrorRate)
        const reliability = (wScore * Math.log(cycleCount + 1)) / (1 + errorRate);
        return Math.min(100, Math.max(0, reliability)); // Cap between 0 and 100
    },

    // 3. Dynamic Threshold Evaluation
    evaluateThresholds: (rIndex, governanceConfig) => {
        const defaultThreshold = governanceConfig.min_r_index_threshold || 50;
        
        // Dynamic adjustment based on current R-Index
        const adjustmentFactor = governanceConfig.dynamic_threshold_adjustment ? (rIndex / 100) * 10 : 0;
        const currentThreshold = defaultThreshold + adjustmentFactor;
        
        const isOperational = rIndex >= currentThreshold;
        
        return {
            currentThreshold: parseFloat(currentThreshold.toFixed(2)),
            isOperational,
            recommendation: isOperational ? 'CONTINUE_GROWTH' : 'INITIATE_COOLING'
        };
    },
};

const KERNAL_CONSTANTS = {
  GITHUB_API: "https://api.github.com/repos",
  GEMINI_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent",
  GOVERNANCE_ENDPOINT: "https://api.kernal.gov/v1/config" // New endpoint for Governance Adapter
};

const INITIAL_STATE = {
  isBooted: false,
  isLive: false,
  isCooling: false,
  status: 'IDLE',
  activeObjective: 'Awaiting Uplink',
  cycleCount: 0,
  successCount: 0,
  errorCount: 0,
  absorptionRate: 0,
  currentTarget: 'None',
  logs: [],
  governanceConfig: { 
    governance_cycle_ms: 60000, 
    min_r_index_threshold: 50,
    dynamic_threshold_adjustment: true
  },
  metrics: {
    wScore: 0,
    rIndex: 0,
    threshold: 0,
    isOperational: false
  },
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
    case 'SET_GOV_CONFIG':
        return { 
            ...state, 
            governanceConfig: { ...state.governanceConfig, ...action.config },
            config: { ...state.config, cycleDelay: action.config.governance_cycle_ms || state.config.cycleDelay } // Update cycle delay dynamically
        };
    case 'UPDATE_METRICS':
        return { ...state, metrics: action.metrics };
    case 'INCREMENT_CYCLE': 
      return { 
        ...state, 
        cycleCount: state.cycleCount + 1, 
        successCount: state.successCount + (action.success ? 1 : 0),
        errorCount: state.errorCount + (action.error ? 1 : 0),
        absorptionRate: Math.min(100, state.absorptionRate + (action.gain || 0)) 
      };
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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'agi-kernal-v6-9';

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
    const sys = `AGI_KERNAL_CORE_OPERATOR. \n    MANDATE: Take the existing KERNEL code and graft the features from the TARGET code into it.\n    RULE 1: DO NOT replace the Kernel code.\n    RULE 2: Preserve all React components, Firebase logic, and State Management.\n    RULE 3: Append or Integrate the MEE Metric Evaluation logic as a sub-engine or helper within the existing file structure.\n    RULE 4: Output the ENTIRE merged file as a JSON object: { "kernel_evolution": "full_code" }.`;
    
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

  const runPreCycleChecks = useCallback(async () => {
    dispatch({ type: 'SET_STATUS', value: 'GOVERNANCE', objective: 'Fetching governance overlay...' });
    
    // 1. Fetch Governance Config
    const adapter = new GovernanceApiAdapter(KERNAL_CONSTANTS.GOVERNANCE_ENDPOINT);
    const govData = await adapter.fetchLatestConfig();
    
    dispatch({ type: 'SET_GOV_CONFIG', config: govData.system_tuning });

    // 2. Calculate Metrics
    const totalCycles = state.cycleCount > 0 ? state.cycleCount : 1;
    const errorRate = state.errorCount / totalCycles;
    const successRate = state.successCount / totalCycles;
    
    // Placeholder for latency score (simulated good performance)
    const latencyScore = 0.95; 

    const currentMetrics = {
        absorptionRate: state.absorptionRate,
        successRate: successRate * 100, // Scale to 100
        latencyScore: latencyScore * 100
    };

    const wScore = MEE_ENGINE.calculateWScore(currentMetrics, MEE_ENGINE.DEFAULT_WEIGHTS);
    const rIndex = MEE_ENGINE.calculateRIndex(wScore, state.cycleCount, errorRate);
    const thresholdEvaluation = MEE_ENGINE.evaluateThresholds(rIndex, govData.system_tuning);

    const newMetrics = {
        wScore: parseFloat(wScore.toFixed(2)),
        rIndex: parseFloat(rIndex.toFixed(2)),
        threshold: thresholdEvaluation.currentThreshold,
        isOperational: thresholdEvaluation.isOperational
    };

    dispatch({ type: 'UPDATE_METRICS', metrics: newMetrics });

    if (!thresholdEvaluation.isOperational) {
        dispatch({ type: 'SET_COOLING', value: true });
        await pushLog(`MEE_ALERT: R-Index (${newMetrics.rIndex}) below threshold (${newMetrics.threshold}). Initiating cooling sequence.`, 'error');
        // Set cooling duration based on dynamic cycle delay
        setTimeout(() => dispatch({ type: 'SET_COOLING', value: false }), state.config.cycleDelay * 2);
        return false;
    }
    
    return true;
}, [state.cycleCount, state.errorCount, state.successCount, state.absorptionRate, state.config.cycleDelay, pushLog]);

  const executeGrowthCycle = useCallback(async () => {
    if (!state.isLive || state.isCooling) return;
    
    // --- MEE Pre-Check Integration ---
    const operational = await runPreCycleChecks();
    if (!operational) {
        dispatch({ type: 'SET_STATUS', value: 'STANDBY', objective: 'Awaiting thermal stabilization.' });
        return;
    }
    // ---------------------------------

    const { token, repo, path } = state.config;
    let success = false;

    try {
      dispatch({ type: 'SET_STATUS', value: 'SCANNING', objective: 'Grafting identification...' });
      
      const headers = { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' };
      const treeRes = await fetch(`${KERNAL_CONSTANTS.GITHUB_API}/${repo}/git/trees/main?recursive=1`, { headers });
      
      if (!treeRes.ok) {
        if (treeRes.status === 401 || treeRes.status === 403) {
            dispatch({ type: 'SET_COOLING', value: true });
            await pushLog("THROTTLE: Entering deep-cool state.", 'error');
            setTimeout(() => dispatch({ type: 'SET_COOLING', value: false }), 90000);
            dispatch({ type: 'INCREMENT_CYCLE', error: true });
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
      dispatch({ type: 'INCREMENT_CYCLE', gain: 5, success: true });
      success = true;

    } catch (e) { 
      await pushLog(`FAULT: ${e.message}`, 'error'); 
      dispatch({ type: 'INCREMENT_CYCLE', error: true });
    } finally { 
      dispatch({ type: 'SET_STATUS', value: 'IDLE', objective: 'Ready.' }); 
    }
  }, [state.isLive, state.isCooling, state.config, pushLog, runPreCycleChecks]);

  useEffect(() => {
    if (state.isLive) {
      cycleTimer.current = setInterval(executeGrowthCycle, state.config.cycleDelay);
      executeGrowthCycle(); // Run immediately on start
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
            <p className="text-zinc-500 text-[9px] uppercase tracking-[0.2em] mt-2">v6.9 // MEE-Metric Ready</p>
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

  const rIndexColor = state.metrics.rIndex >= state.metrics.threshold ? 'text-emerald-400' : 'text-red-400';
  const rIndexBg = state.metrics.rIndex >= state.metrics.threshold ? 'bg-emerald-900/20' : 'bg-red-900/20';

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

      <div className="bg-zinc-950/50 border-b border-zinc-900 px-10 py-4 grid grid-cols-6 gap-4">
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
          <div className={`p-3 rounded-2xl border border-zinc-800/40 ${rIndexBg}`}>
             <span className="text-[7px] text-zinc-600 uppercase font-black mb-1 block">R-Index</span>
             <span className={`${rIndexColor} text-[10px] font-mono flex items-center gap-1`}><Gauge size={10}/> {state.metrics.rIndex}</span>
          </div>
          <div className="p-3 bg-zinc-900/30 rounded-2xl border border-zinc-800/40 text-center">
             <span className="text-[7px] text-zinc-600 uppercase font-black mb-1 block">Threshold</span>
             <span className="text-white text-[10px] font-mono">{state.metrics.threshold}</span>
          </div>
          <div className="p-3 bg-zinc-900/30 rounded-2xl border border-zinc-800/40 text-center">
             <span className="text-[7px] text-zinc-600 uppercase font-black mb-1 block">Cycles (E/S)</span>
             <span className="text-white text-[10px] font-mono">{state.cycleCount} ({state.errorCount}/{state.successCount})</span>
          </div>
          <div className="p-3 bg-zinc-900/30 rounded-2xl border border-zinc-800/40 text-right">
             <span className="text-[7px] text-zinc-600 uppercase font-black mb-1 block">Next Cycle</span>
             <span className="text-zinc-500 text-[9px] font-mono">{state.config.cycleDelay / 1000}s</span>
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
        <span>v6.9 // {state.config.repo}</span>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #111; border-radius: 10px; }
      `}</style>
    </div>
  );
}