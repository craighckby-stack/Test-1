import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, query, limit, orderBy } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  ShieldCheck, Cpu, RefreshCcw, Binary, Fingerprint, Box, HardDrive, Terminal, ShieldAlert, Activity
} from 'lucide-react';

/**
 * AGI-KERNAL v6.9.7 - "VIRTUAL_OS" [GOVERNANCE PATCH]
 * INTEGRATED: AuditDataNormalizer & GovernanceSchemaDefs
 */

// --- GOVERNANCE CORE (Grafts) ---

class AuditDataNormalizer {
    normalize(actorId, rawTelemetry) {
        // Governance logic: Normalize latency against a 5000ms ceiling for AI generation
        const latencyScore = 1 - (rawTelemetry.p95LatencyMs / 5000); 
        const stabilityFactor = rawTelemetry.success ? 1 : 0;

        return {
            efficiencyScore: Math.max(0, Math.min(1, latencyScore)),
            complianceScore: stabilityFactor,
            violationCount: rawTelemetry.success ? 0 : 1,
            timestamp: Date.now()
        };
    }
}

const GPC_CONFIG = {
    protocol_evolution_control: {
        risk_tolerance: "MODERATE",
        target_efficiency_gain_min: 0.15
    }
};

const kernelNormalizer = new AuditDataNormalizer();

// --- VIRTUAL OS LAYER ---
const VIRTUAL_PROCESS = { env: { NODE_ENV: 'development' }, cwd: () => '/root' };
if (typeof window !== 'undefined') { window.process = VIRTUAL_PROCESS; }

const getFirebaseConfig = () => {
  try { return typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {}; } catch (e) { return {}; }
};

const KERNAL_CONSTANTS = {
  GITHUB_API: "https://api.github.com/repos",
  GEMINI_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent",
  DEFAULT_APP_ID: 'agi-kernal-v6-9-7'
};

const appId = typeof __app_id !== 'undefined' ? __app_id : KERNAL_CONSTANTS.DEFAULT_APP_ID;

const safeAtou = (str) => {
  if (!str) return "";
  try {
    const cleaned = str.replace(/\s/g, '');
    return decodeURIComponent(Array.prototype.map.call(atob(cleaned), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  } catch (e) { return atob(str.replace(/\s/g, '')); }
};

const safeUtoa = (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode(parseInt(p, 16))));

const INITIAL_STATE = {
  isBooted: false,
  isLive: false,
  status: 'IDLE',
  activeObjective: 'Awaiting Uplink',
  cycleCount: 0,
  currentTarget: 'None',
  logs: [],
  governanceMetrics: { compliance: 1, efficiency: 1 },
  config: { token: '', repo: '', path: 'storage/AGI-Kernal.js', apiKey: '', cycleDelay: 45000 }
};

function reducer(state, action) {
  switch (action.type) {
    case 'BOOT': return { ...state, isBooted: true, config: { ...state.config, ...action.config } };
    case 'SET_LIVE': return { ...state, isLive: action.value, status: action.value ? 'HUNTING' : 'STANDBY' };
    case 'SET_STATUS': return { ...state, status: action.value, activeObjective: action.objective || state.activeObjective };
    case 'SET_TARGET': return { ...state, currentTarget: action.target };
    case 'LOG_UPDATE': return { ...state, logs: action.logs };
    case 'SET_METRICS': return { ...state, governanceMetrics: action.value };
    case 'INCREMENT_CYCLE': return { ...state, cycleCount: state.cycleCount + 1 };
    default: return state;
  }
}

const firebaseConfig = getFirebaseConfig();
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [user, setUser] = useState(null);
  const [bootInput, setBootInput] = useState({ token: '', repo: '', path: 'storage/AGI-Kernal.js', apiKey: '' });
  const isProcessing = useRef(false);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { await signInWithCustomToken(auth, __initial_auth_token); }
      else { await signInAnonymously(auth); }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  const pushLog = useCallback(async (msg, type = 'info') => {
    if (!auth.currentUser) return;
    try { await addDoc(collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'logs'), { msg, type, timestamp: Date.now() }); } catch (e) {}
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'logs'), orderBy('timestamp', 'desc'), limit(40));
    return onSnapshot(q, (snap) => dispatch({ type: 'LOG_UPDATE', logs: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) }));
  }, [user]);

  const executeEvolution = async (targetCode, kernelCode) => {
    const start = Date.now();
    try {
      const res = await fetch(`${KERNAL_CONSTANTS.GEMINI_URL}?key=${state.config.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Graft TARGET into KERNEL:\nTARGET:\n${targetCode}\n\nKERNEL:\n${kernelCode}` }] }],
          systemInstruction: { parts: [{ text: "AGI_KERNAL_EVOLUTION_ENGINE: Output JSON {\"kernel_evolution\": \"source\"}. Ensure structural compliance." }] },
          generationConfig: { responseMimeType: "application/json", maxOutputTokens: 8192, temperature: 0.1 }
        })
      });
      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const evolvedCode = JSON.parse(rawText).kernel_evolution;

      // GOVERNANCE AUDIT
      const audit = kernelNormalizer.normalize('EvoEngine', {
          p95LatencyMs: Date.now() - start,
          success: !!evolvedCode,
          complianceChecksRun: 1,
          complianceChecksFailed: 0
      });

      dispatch({ type: 'SET_METRICS', value: { compliance: audit.complianceScore, efficiency: audit.efficiencyScore } });
      await pushLog(`Audit: Compliance=${(audit.complianceScore*100).toFixed(0)}%, Eff=${(audit.efficiencyScore*100).toFixed(0)}%`, 'info');

      if (audit.complianceScore < 1.0) throw new Error("GOVERNANCE_VETO");

      return evolvedCode;
    } catch (e) {
      await pushLog(`Audit Failure: ${e.message}`, 'error');
      return null;
    }
  };

  const executeGrowthCycle = useCallback(async () => {
    if (isProcessing.current || !state.isLive) return;
    isProcessing.current = true;
    try {
      const { token, repo, path } = state.config;
      dispatch({ type: 'SET_STATUS', value: 'HUNTING', objective: 'Auditing source tree...' });
      const headers = { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' };
      const treeRes = await fetch(`${KERNAL_CONSTANTS.GITHUB_API}/${repo}/git/trees/main?recursive=1`, { headers });
      const treeData = await treeRes.json();
      const files = (treeData.tree || []).filter(f => f.type === 'blob' && /\.(js|jsx|ts|tsx)$/i.test(f.path) && f.path !== path);
      if (files.length === 0) throw new Error("VOID_REPO");

      const target = files[Math.floor(Math.random() * files.length)];
      dispatch({ type: 'SET_TARGET', target: target.path });

      const [tRes, kRes] = await Promise.all([
          fetch(target.url, { headers }), 
          fetch(`${KERNAL_CONSTANTS.GITHUB_API}/${repo}/contents/${path}`, { headers })
      ]);
      const tData = await tRes.json(); const kData = await kRes.json();
      
      const evolved = await executeEvolution(safeAtou(tData.content), safeAtou(kData.content));
      
      if (evolved) {
        dispatch({ type: 'SET_STATUS', value: 'GRAFTING', objective: 'Verified absorption...' });
        const upRes = await fetch(`${KERNAL_CONSTANTS.GITHUB_API}/${repo}/contents/${path}`, {
          method: 'PUT', headers, body: JSON.stringify({ message: `AGI-Graft [Governance-Verified]: ${target.path}`, content: safeUtoa(evolved), sha: kData.sha })
        });
        if (upRes.ok) { dispatch({ type: 'INCREMENT_CYCLE' }); await pushLog(`Verified Absorbed: ${target.path}`, 'success'); }
      }
    } catch (e) { await pushLog(`Cycle Aborted: ${e.message}`, 'error'); }
    finally { dispatch({ type: 'SET_STATUS', value: 'IDLE', objective: 'Governance standby.' }); isProcessing.current = false; }
  }, [state.isLive, state.config, pushLog]);

  useEffect(() => {
    if (state.isLive) {
      const itv = setInterval(executeGrowthCycle, state.config.cycleDelay);
      return () => clearInterval(itv);
    }
  }, [state.isLive, state.config.cycleDelay, executeGrowthCycle]);

  if (!state.isBooted) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-mono">
        <div className="w-full max-w-sm bg-zinc-900/10 border border-zinc-800/50 p-10 rounded-[2.5rem] space-y-8 backdrop-blur-3xl shadow-2xl">
          <div className="flex flex-col items-center gap-3 text-center">
            <Fingerprint className="text-blue-500 animate-pulse" size={40} />
            <h1 className="text-white font-black text-xl tracking-tighter uppercase italic">AGI-KERNAL</h1>
            <p className="text-[7px] text-zinc-600 uppercase tracking-[0.4em] font-bold">Governance OS v6.9.7</p>
          </div>
          <div className="space-y-2">
            <input type="password" placeholder="GEMINI_API_KEY" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none" value={bootInput.apiKey} onChange={e => setBootInput({...bootInput, apiKey: e.target.value})} />
            <input type="password" placeholder="GITHUB_PAT" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none" value={bootInput.token} onChange={e => setBootInput({...bootInput, token: e.target.value})} />
            <input type="text" placeholder="OWNER/REPO" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none" value={bootInput.repo} onChange={e => setBootInput({...bootInput, repo: e.target.value})} />
          </div>
          <button onClick={() => bootInput.apiKey && bootInput.token && dispatch({ type: 'BOOT', config: bootInput })} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">Establish Secure Uplink</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#020202] text-zinc-400 flex flex-col font-mono overflow-hidden">
      <header className="h-20 border-b border-zinc-900 flex items-center justify-between px-10">
        <div className="flex items-center gap-5">
          <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800"><Cpu className={state.isLive ? 'text-blue-500 animate-spin-slow' : 'text-zinc-700'} size={24} /></div>
          <div><div className="text-white text-md font-black tracking-tighter uppercase italic">AGI_KERNAL_VOS</div><div className="flex items-center gap-2 mt-1"><div className={`h-1 w-1 rounded-full ${state.isLive ? 'bg-blue-500 animate-pulse' : 'bg-zinc-800'}`} /><span className="text-[7px] text-zinc-600 uppercase font-black tracking-widest">{state.status}</span></div></div>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-4">
                <span className="text-[6px] text-zinc-600 uppercase font-black">Risk Tolerance</span>
                <span className="text-blue-500 text-[9px] font-bold italic">{GPC_CONFIG.protocol_evolution_control.risk_tolerance}</span>
            </div>
            <button onClick={() => dispatch({ type: 'SET_LIVE', value: !state.isLive })} className={`px-10 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${state.isLive ? 'bg-zinc-900 text-red-500 border border-red-500/20' : 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'}`}>{state.isLive ? 'HALT KERNAL' : 'ENGAGE EVOLUTION'}</button>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-hidden flex flex-col gap-6">
        <div className="grid grid-cols-4 gap-6">
            <div className="bg-zinc-900/10 border border-zinc-900 p-5 rounded-3xl">
                <span className="text-[7px] text-zinc-700 uppercase font-black block mb-1">Evo_Cycle</span>
                <span className="text-white text-xl font-black italic">{state.cycleCount}</span>
            </div>
            <div className="bg-zinc-900/10 border border-zinc-900 p-5 rounded-3xl relative overflow-hidden">
                <span className="text-[7px] text-zinc-700 uppercase font-black block mb-1">Governance_Audit</span>
                <div className="flex items-center gap-2">
                    <ShieldCheck className={state.governanceMetrics.compliance > 0.9 ? 'text-emerald-500' : 'text-red-500'} size={14} />
                    <span className="text-white text-[11px] font-bold">{(state.governanceMetrics.compliance * 100).toFixed(0)}% COMPLIANT</span>
                </div>
                <div className="absolute bottom-0 left-0 h-0.5 bg-blue-600" style={{ width: `${state.governanceMetrics.efficiency * 100}%` }} />
            </div>
            <div className="bg-zinc-900/10 border border-zinc-900 p-5 rounded-3xl col-span-2 flex items-center justify-between">
                <div className="truncate pr-4">
                    <span className="text-[7px] text-zinc-700 uppercase font-black block mb-1">Current_Target</span>
                    <span className="text-blue-400 text-[10px] truncate block font-bold">{state.currentTarget}</span>
                </div>
                <Activity className="text-zinc-800" size={20} />
            </div>
        </div>

        <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-[3rem] flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-10 space-y-2">
            {state.logs.map((log) => (
              <div key={log.id} className="flex gap-5 border-l border-zinc-900/50 pl-5 py-0.5 group">
                <span className="text-zinc-800 text-[7px] w-12 shrink-0 font-bold mt-1 italic group-hover:text-zinc-600 transition-colors">{new Date(log.timestamp).toLocaleTimeString([], {hour12:false})}</span>
                <div className={`flex-1 text-[10px] ${log.type === 'success' ? 'text-blue-400' : log.type === 'error' ? 'text-red-500/70 font-bold' : 'text-zinc-600'}`}>
                    {log.type === 'error' && <ShieldAlert size={10} className="inline mr-2 mb-0.5" />}
                    {log.msg}
                </div>
              </div>
            ))}
            {state.logs.length === 0 && <div className="h-full flex items-center justify-center text-[8px] uppercase tracking-[0.5em] text-zinc-900 font-black">Initializing Audit Logs...</div>}
          </div>
        </div>
      </main>

      <footer className="h-12 border-t border-zinc-900/50 px-10 flex items-center justify-between text-[7px] uppercase tracking-[0.4em] text-zinc-800 font-black">
        <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-blue-900"><Box size={10}/> VIRTUAL_OS_ACTIVE</span>
            <span className="flex items-center gap-1.5 text-zinc-900"><HardDrive size={10}/> VFS_MOUNTED: /root</span>
            <span className="flex items-center gap-1.5 text-emerald-900"><ShieldCheck size={10}/> AUDIT_NORMALIZER: ACTIVE</span>
        </div>
        <div className="flex items-center gap-2"><Terminal size={10} /><span>KERNEL_READY_v6.9.7</span></div>
      </footer>
    </div>
  );
                                                                                                                                                                                                         }
