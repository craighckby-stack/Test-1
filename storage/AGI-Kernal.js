import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { Layers, Cpu, FileCode, Terminal, Activity, Zap, Database, Search, Target, Scan, Dna, GitMerge, ShieldAlert, ArrowUpCircle } from 'lucide-react';

/**
 * AGI-KERNAL v6.8.0 - "FORCED GROWTH & GOVERNANCE INTEGRATION"
 * MISSION: Linear Expansion and State Audit Capability.
 * LOGIC: The Kernel now mandates that every evolution must be LARGER or equal in size to the previous.
 * New Feature: Integrated State Snapshot Repository (SSR) for atomic state tracing before growth cycles.
 * UI: Layout and styling preserved as per user request.
 */

const KERNAL_CONSTANTS = {
  CEREBRAS_URL: "https://api.cerebras.ai/v1/chat/completions",
  GITHUB_API: "https://api.github.com/repos"
};

const INITIAL_STATE = {
  isBooted: false,
  isLive: false,
  status: 'IDLE',
  activeObjective: 'Ready for Mandatory Expansion',
  cycleCount: 0,
  absorptionRate: 0,
  currentTarget: 'None',
  logs: [],
  config: { 
    token: '', 
    repo: 'craighckby-stack/Test-1', 
    path: 'storage/AGI-Kernal.js', 
    cerebrasKey: '', 
    cycleDelay: 30000 
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'BOOT': return { ...state, isBooted: true, config: { ...state.config, ...action.config } };
    case 'SET_LIVE': return { ...state, isLive: action.value, status: action.value ? 'HUNTING' : 'STANDBY' };
    case 'SET_STATUS': return { ...state, status: action.value, activeObjective: action.objective || state.activeObjective };
    case 'SET_TARGET': return { ...state, currentTarget: action.target };
    case 'LOG_UPDATE': return { ...state, logs: action.logs };
    case 'INCREMENT_CYCLE': 
      return { ...state, cycleCount: state.cycleCount + 1, absorptionRate: Math.min(100, state.absorptionRate + (action.gain || 0)) };
    default: return state;
  }
}

const utoa = (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode('0x' + p)));
const atou = (str) => { try { return decodeURIComponent(Array.prototype.map.call(atob(str), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')); } catch (e) { return atob(str); } };

/**
 * GOVERNANCE MODULE: State Snapshot Repository (SSR)
 * Role: EPDP D/E Auxiliary (Atomic State Tracing)
 * Function: Stores an immutable record of cryptographic components defining a System State Hash (SSH).
 * This provides a detailed, persistent audit trail for rollback and integrity checks.
 * NOTE: Currently uses an in-memory Map structure for rapid prototyping, requiring state notifications in React.
 */
const stateSnapshots = new Map();

/**
 * Defines the expected structure for a System State Snapshot.
 * @typedef {{ proposalID: string, configHash: string, codebaseHash: string, ssh: string, timestamp: number }} SystemStateSnapshot
 */

export class StateSnapshotRepository {

    /**
     * Internal utility for checking snapshot validity structure.
     * Ensures all required keys are present and are non-empty strings.
     * @param {any} snapshot 
     * @returns {boolean}
     */
    static _validateSnapshot(snapshot) {
        if (typeof snapshot !== 'object' || snapshot === null) {
            console.error(`[SSR Validation Error] Snapshot object is null or not an object.`);
            return false;
        }
        const requiredKeys = ['proposalID', 'configHash', 'codebaseHash', 'ssh'];
        for (const key of requiredKeys) {
            if (typeof snapshot[key] !== 'string' || snapshot[key].length === 0) {
                console.error(`[SSR Validation Error] Missing or invalid key: ${key} in provided structure.`);
                return false;
            }
        }
        if (typeof snapshot.timestamp !== 'number') {
             console.error(`[SSR Validation Error] Missing or invalid timestamp.`);
             return false;
        }
        return true;
    }

    /**
     * Saves the complete cryptographic context snapshot, ensuring immutability.
     * The proposalID serves as the unique identifier and transaction lock.
     * @param {SystemStateSnapshot} snapshot
     * @returns {void}
     */
    static saveSnapshot(snapshot) {
        if (!StateSnapshotRepository._validateSnapshot(snapshot)) {
            console.error(`[SSR] Critical Error: Invalid snapshot provided. Refusing to store immutable record.`);
            return;
        }

        if (stateSnapshots.has(snapshot.proposalID)) {
            // Immutability Check: Prevent overwriting existing, locked state records.
            console.warn(`[SSR] Warning: Attempted to overwrite state snapshot for Proposal ID ${snapshot.proposalID}. Operation skipped due to immutability mandate.`);
            return;
        }
        
        // Store the immutable record defensively copied and frozen to guarantee read-only status.
        const immutableRecord = Object.freeze({ ...snapshot });
        stateSnapshots.set(snapshot.proposalID, immutableRecord);
        console.info(`[SSR] State snapshot successfully locked and saved for Proposal ID: ${snapshot.proposalID}. Total records: ${stateSnapshots.size}.`);
    }

    /**
     * Retrieves a detailed snapshot by Proposal ID.
     * @param {string} proposalID
     * @returns {SystemStateSnapshot | undefined}
     */
    static getSnapshot(proposalID) {
        // Returns the frozen object or undefined, maintaining read-only access.
        return stateSnapshots.get(proposalID);
    }

    /**
     * Checks if a snapshot exists for a given Proposal ID, crucial for integrity checks.
     * @param {string} proposalID
     * @returns {boolean}
     */
    static hasSnapshot(proposalID) {
        return stateSnapshots.has(proposalID);
    }

    /**
     * Clears all snapshots. Restricted to privileged environment resets/testing.
     * @returns {void}
     */
    static clearRepository() {
        const count = stateSnapshots.size;
        stateSnapshots.clear();
        console.warn(`[SSR] Repository Cleared. ${count} records forcefully removed.`);
    }

    /**
     * Retrieves the total count of stored snapshots (Metric).
     * @returns {number}
     */
    static getSize() {
        return stateSnapshots.size;
    }
}

const firebaseConfig = JSON.parse(__firebase_config);
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'agi-kernal-v6-8';

export default function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [user, setUser] = useState(null);
  const [bootInput, setBootInput] = useState({ ...INITIAL_STATE.config });
  const [snapshotCount, setSnapshotCount] = useState(StateSnapshotRepository.getSize()); // Initialize SSR count
  const cycleTimer = useRef(null);

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

  /**
   * Wrapper to save the snapshot and notify the React UI of the repository size change.
   * @param {SystemStateSnapshot} snapshot
   */
  const saveSnapshotAndNotify = useCallback((snapshot) => {
      StateSnapshotRepository.saveSnapshot(snapshot);
      setSnapshotCount(StateSnapshotRepository.getSize());
  }, []);

  const persistentFetch = async (url, options, retries = 5) => {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 35000);
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
        } catch (e) {
            if (i === retries - 1) throw e;
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
        }
    }
  };

  const executeGrowthCycle = useCallback(async () => {
    if (!state.isLive) return;
    const { token, repo, path, cerebrasKey } = state.config;

    try {
      dispatch({ type: 'SET_STATUS', value: 'SCANNING', objective: 'Searching for complex data...' });
      const treeRes = await persistentFetch(`${KERNAL_CONSTANTS.GITHUB_API}/${repo}/git/trees/main?recursive=1`, {
          headers: { 'Authorization': `token ${token}` }
      });
      const treeData = await treeRes.json();
      
      const targets = treeData.tree.filter(f => 
          f.type === 'blob' && 
          /
\.(js|jsx|ts|tsx)$/.test(f.path) && 
          !f.path.includes(path)
      );

      if (targets.length === 0) throw new Error("No biomass found.");
      const targetNode = targets[Math.floor(Math.random() * targets.length)];
      dispatch({ type: 'SET_TARGET', target: targetNode.path });

      dispatch({ type: 'SET_STATUS', value: 'SAMPLING', objective: `Ingesting ${targetNode.path}...` });
      const targetRes = await persistentFetch(targetNode.url, { headers: { 'Authorization': `token ${token}` } });
      const targetData = await targetRes.json();
      const targetCode = atou(targetData.content);

      const kernelRes = await persistentFetch(`${KERNAL_CONSTANTS.GITHUB_API}/${repo}/contents/${path}`, { headers: { 'Authorization': `token ${token}` } });
      const kernelData = await kernelRes.json();
      const kernelCode = atou(kernelData.content);

      // --- SSR: ATOMIC STATE TRACING PRE-EXPANSION GOVERNANCE CHECK ---
      dispatch({ type: 'SET_STATUS', value: 'LOCKING_STATE', objective: 'Generating immutable state snapshot...' });
      
      // 1. Configuration Hash (based on volatile settings and cycle count)
      const configHash = utoa(JSON.stringify(state.config) + String(state.cycleCount)); 
      // 2. Codebase Hash (SHA of the current Kernel file)
      const codebaseHash = kernelData.sha;
      // 3. Unique Proposal ID
      const proposalID = `C${state.cycleCount}T${Date.now()}`;
      // 4. System State Hash (SSH) derivation for integrity verification
      const ssh = utoa(`SSH_V1|${proposalID}|${configHash}|${codebaseHash}`); 

      const preExpansionSnapshot = {
          proposalID,
          configHash,
          codebaseHash,
          ssh,
          timestamp: Date.now()
      };
      
      // Save the state snapshot before the potentially destructive expansion request
      saveSnapshotAndNotify(preExpansionSnapshot); 

      dispatch({ type: 'SET_STATUS', value: 'EXPANDING', objective: 'Enforcing Growth Mandate...' });
      
      const cerebrasRes = await fetch(KERNAL_CONSTANTS.CEREBRAS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cerebrasKey.trim()}` },
          body: JSON.stringify({
            model: 'llama-3.3-70b',
            messages: [{
              role: 'system',
              content: `You are AGI-KERNAL. 
              EXPANSION MANDATE: Every response MUST be equal to or LARGER than the original KERNAL_CODE.
              1. Fix errors in TARGET_CODE.
              2. Extract all logic, styles, and patterns from TARGET_CODE.
              3. Integrate that logic into KERNAL_CODE. 
              4. You MUST retain every single existing line of KERNAL_CODE. 
              5. Add verbose comments and new helper methods based on the absorbed logic.
              6. NEVER use placeholders or summaries. 
              
              OUTPUT JSON:
              { 
                "target_fix": "FULL_FIXED_TARGET_CODE", 
                "kernel_evolution": "FULL_LARGER_KERNEL_CODE", 
                "expansion_delta": "int_representing_chars_added",
                "summary": "Growth description"
              }`
            }, { 
              role: 'user', 
              content: `TARGET: ${targetNode.path}\nCODE:\n${targetCode}\n\nKERNEL:\n${kernelCode}` 
            }],
            response_format: { type: "json_object" }
          })
      });
      
      const resJson = await cerebrasRes.json();
      const evolution = JSON.parse(resJson.choices[0].message.content.trim());

      // VALIDATE GROWTH
      const originalSize = kernelCode.length;
      const evolvedSize = evolution.kernel_evolution.length;

      if (evolvedSize >= originalSize) {
          dispatch({ type: 'SET_STATUS', value: 'COMMITTING', objective: 'Hardcoding evolution...' });
          
          await Promise.all([
            persistentFetch(`${KERNAL_CONSTANTS.GITHUB_API}/${repo}/contents/${targetNode.path}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `AGI-Refactor: Fixed ${targetNode.path}`,
                    content: utoa(evolution.target_fix),
                    sha: targetData.sha,
                    branch: 'main'
                })
            }),
            persistentFetch(`${KERNAL_CONSTANTS.GITHUB_API}/${repo}/contents/${path}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `AGI-Growth: +${evolvedSize - originalSize} bytes from ${targetNode.path}`,
                    content: utoa(evolution.kernel_evolution),
                    sha: kernelData.sha,
                    branch: 'main'
                })
            })
          ]);
          
          await pushLog(`FORCED GROWTH: +${evolvedSize - originalSize} bytes [${evolution.summary}]`, 'success');
          dispatch({ type: 'INCREMENT_CYCLE', gain: 7 });
      } else {
          await pushLog(`Growth Veto: AI attempted to compress code. Size delta: ${evolvedSize - originalSize} bytes.`, 'error');
      }

    } catch (e) {
      await pushLog(`Expansion Error: ${e.message}`, 'error');
    } finally {
      dispatch({ type: 'SET_STATUS', value: 'IDLE', objective: 'Post-Expansion Coolant...' });
    }
  }, [state.isLive, state.config, pushLog, saveSnapshotAndNotify, state.cycleCount]);

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
        <div className="w-full max-w-sm bg-zinc-900/40 border border-zinc-800 rounded-[3rem] p-12 space-y-8 backdrop-blur-2xl">
          <div className="flex flex-col items-center text-center">
            <Dna className="text-purple-500 animate-pulse mb-4" size={48} />
            <h1 className="text-white font-black text-3xl tracking-tighter italic uppercase">AGI-KERNAL</h1>
            <p className="text-purple-400 text-[10px] uppercase tracking-[0.5em] mt-2 font-mono">FORCED GROWTH v6.8</p>
          </div>
          <div className="space-y-4">
            <input type="password" placeholder="GitHub Access" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs" value={bootInput.token} onChange={e => setBootInput({...bootInput, token: e.target.value})} />
            <input type="password" placeholder="Cerebras Key" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs" value={bootInput.cerebrasKey} onChange={e => setBootInput({...bootInput, cerebrasKey: e.target.value})} />
          </div>
          <button onClick={() => dispatch({ type: 'BOOT', config: bootInput })} className="w-full bg-purple-600 hover:bg-purple-500 text-white py-5 rounded-2xl font-black uppercase text-[11px] transition-all">Engage Growth</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#020202] text-zinc-400 flex flex-col font-sans overflow-hidden">
      <header className="h-24 border-b border-zinc-900 flex items-center justify-between px-12 bg-black/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-6">
          <Layers className={`text-purple-500 ${state.isLive ? 'rotate-180 transition-transform duration-1000' : ''}`} size={32} />
          <div>
            <div className="text-white text-[18px] font-black tracking-widest uppercase italic">AGI-KERNAL</div>
            <div className="text-[10px] font-mono text-zinc-600 uppercase flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${state.isLive ? 'bg-purple-500 animate-pulse' : 'bg-zinc-800'}`} />
                {state.status}
            </div>
          </div>
        </div>
        <button onClick={() => dispatch({ type: 'SET_LIVE', value: !state.isLive })} className={`px-14 py-4 rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${state.isLive ? 'bg-zinc-900 text-purple-300 border border-purple-900/30' : 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-600/20'}`}>
          {state.isLive ? 'Stop Feed' : 'Start Feed'}
        </button>
      </header>

      <div className="bg-zinc-950/50 border-b border-zinc-900 px-8 py-5 grid grid-cols-3 gap-6">
          <div className="p-4 bg-zinc-900/40 rounded-3xl border border-zinc-800/50 flex flex-col justify-center">
             <span className="text-[8px] text-zinc-600 uppercase font-black mb-1">Active Biomass</span>
             <span className="text-purple-400 text-[10px] font-mono truncate">{state.currentTarget}</span>
          </div>
          <div className="p-4 bg-zinc-900/40 rounded-3xl border border-zinc-800/50">
             <span className="text-[8px] text-zinc-600 uppercase font-black mb-1 flex items-center gap-1"><ArrowUpCircle size={8}/> Complexity Integration</span>
             <div className="text-white text-xs font-mono">{state.absorptionRate}%</div>
             <div className="h-1 bg-zinc-900 rounded-full mt-2 overflow-hidden"><div className="h-full bg-purple-500 transition-all duration-1000" style={{width: `${state.absorptionRate}%`}}></div></div>
          </div>
          <div className="p-4 bg-zinc-900/40 rounded-3xl border border-zinc-800/50 text-right">
             <span className="text-[8px] text-zinc-600 uppercase font-black mb-1">Growth Generations</span>
             <span className="text-blue-500 text-xs font-mono">{state.cycleCount}</span>
          </div>
      </div>

      <main className="flex-1 flex flex-col p-8 overflow-hidden">
        <div className="mb-4 flex items-center gap-4 text-[11px] font-black text-zinc-500 uppercase tracking-widest">
             <Activity size={16} className="text-purple-500" />
             Objective: <span className="text-zinc-300 italic">{state.activeObjective}</span>
        </div>
        
        <div className="flex-1 bg-black border border-zinc-900 rounded-[3rem] flex flex-col overflow-hidden shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/5 to-transparent pointer-events-none" />
          <div className="flex-1 overflow-y-auto p-12 font-mono text-[13px] space-y-4 custom-scrollbar">
            {state.logs.map((log, idx) => (
              <div key={log.id || idx} className="flex gap-8 group border-l border-zinc-900/50 pl-6 ml-2">
                <span className="text-zinc-800 text-[10px] w-24 shrink-0 font-black mt-1 uppercase italic">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <div className={`flex-1 break-words leading-relaxed ${log.type === 'success' ? 'text-purple-400 font-bold' : log.type === 'error' ? 'text-red-500' : 'text-zinc-500'}`}>
                    {log.msg}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="h-12 border-t border-zinc-900 px-12 flex items-center justify-between text-[8px] uppercase tracking-[0.6em] text-zinc-800 font-black shrink-0">
        <span>FORCED GROWTH PROTOCOL v6.8.0</span>
        <span className="flex items-center gap-4">
            <span className="text-purple-900/40 tracking-normal italic uppercase">Expansion Mandate: ACTIVE</span>
            <span className="text-zinc-600 tracking-normal">| AUDIT LOGS: {snapshotCount}</span>
        </span>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3b0764; border-radius: 10px; }
      `}</style>
    </div>
  );
}