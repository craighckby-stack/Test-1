```javascript
import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, query, limit, orderBy } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  Brain, Zap, Activity, Terminal, GitBranch, Shield, Database, 
  Cpu, Target, FileText, TrendingUp, AlertCircle, CheckCircle
} from 'lucide-react';

/**
 * AGI-KERNAL v7.0 - "EMERGENT SYNTHESIS"
 * 
 * UNIFIED CAPABILITIES:
 * - v5.9.8: Multi-file orchestration, maturity tracking, branch promotion
 * - v6.8.9: Deep context scanning, structured logging, MEE metrics
 * - v6.9.7: Robust JSON recovery, governance display, error handling
 * - v111: Aggressive optimization, stagnation detection (throttled)
 * - Nexus: Persistent memory, cross-branch coordination
 * 
 * NEW: Meta-learning, capability self-assessment, autonomous infrastructure creation
 */

// --- CONSTANTS ---
const CONFIG = {
  APP_ID: typeof __app_id !== 'undefined' ? __app_id : 'agi-kernel-v7-0',
  GITHUB_API: "https://api.github.com/repos",
  CEREBRAS_API: "https://api.cerebras.ai/v1/chat/completions",
  GEMINI_API: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
  STAGNATION_THRESHOLD: 5, // More forgiving than v111's 3
  PROMOTION_THRESHOLD: 85,
  CYCLE_INTERVAL: 60000
};

// --- UTILITIES (from v6.9.7 - robust encoding) ---
const safeUtoa = (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode(parseInt(p, 16))));
const safeAtou = (str) => {
  if (!str) return "";
  try {
    const cleaned = str.replace(/\s/g, '');
    return decodeURIComponent(Array.prototype.map.call(atob(cleaned), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  } catch (e) { 
    return atob(str.replace(/\s/g, '')); 
  }
};

// --- JSON RECOVERY (from v6.9.7 - handles truncation) ---
const recoverJSON = (rawText) => {
  if (!rawText) return null;
  
  // Try standard parse first
  try {
    return JSON.parse(rawText);
  } catch (e) {
    // Regex recovery for truncated responses
    const patterns = [
      /"code_update"\s*:\s*"([\s\S]*?)"/,
      /"readme_update"\s*:\s*"([\s\S]*?)"/,
      /"manifest_entry"\s*:\s*"([\s\S]*?)"/,
      /"maturity_rating"\s*:\s*(\d+)/,
      /"reasoning"\s*:\s*"([^"]*?)"/,
      /"capabilities"\s*:\s*\[([\s\S]*?)\]/,
      /"next_goal"\s*:\s*"([^"]*?)"/
    ];
    
    const recovered = {};
    for (const pattern of patterns) {
      const match = rawText.match(pattern);
      if (match) {
        const key = pattern.source.match(/"(\w+)"/)[1];
        let value = match[1];
        
        // Unescape
        if (typeof value === 'string') {
          value = value
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\')
            .replace(/\\t/g, '\t');
        }
        
        recovered[key] = key === 'maturity_rating' ? parseInt(value) : value;
      }
    }
    
    return Object.keys(recovered).length > 0 ? recovered : null;
  }
};

// --- STATE MANAGEMENT ---
const INITIAL_STATE = {
  isBooted: false,
  isLive: false,
  status: 'IDLE',
  activeObjective: 'Awaiting Strategic Input',
  cycleCount: 0,
  stagnationCount: 0,
  maturityScore: 0,
  capabilityScores: {},
  learningHistory: [],
  logs: [],
  config: { 
    token: '', 
    repo: 'craighckby-stack/Test-1', 
    path: 'storage/AGI-Kernel.js',
    apiProvider: 'cerebras', // or 'gemini'
    apiKey: '', 
    model: 'llama-3.3-70b',
    threshold: 10,
    enableNexus: true,
    enableDeepContext: true
  }
};

function reducer(state, action) {
  switch (action.type) {
    case 'BOOT': 
      return { ...state, isBooted: true, config: { ...state.config, ...action.config } };
    case 'SET_LIVE': 
      return { ...state, isLive: action.value, status: action.value ? 'INITIALIZING' : 'STANDBY' };
    case 'SET_STATUS': 
      return { ...state, status: action.value, activeObjective: action.objective || state.activeObjective };
    case 'LOG_UPDATE': 
      return { ...state, logs: action.logs };
    case 'INCREMENT_CYCLE': 
      return { 
        ...state, 
        cycleCount: state.cycleCount + 1, 
        maturityScore: action.maturity || state.maturityScore,
        capabilityScores: action.capabilities || state.capabilityScores,
        stagnationCount: action.improved ? 0 : state.stagnationCount + 1
      };
    case 'UPDATE_LEARNING': 
      return { 
        ...state, 
        learningHistory: [...state.learningHistory, action.entry].slice(-50) 
      };
    case 'RESET_MATURITY': 
      return { ...state, maturityScore: 0, cycleCount: 0, stagnationCount: 0 };
    default: 
      return state;
  }
}

// --- FIREBASE INIT ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [user, setUser] = useState(null);
  const [bootInput, setBootInput] = useState({ ...INITIAL_STATE.config });
  const cycleTimer = useRef(null);
  const isProcessing = useRef(false);

  // --- AUTH INIT ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Auth failed:", e);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // --- LOG SYNC ---
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'logs'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    return onSnapshot(q, (snap) => {
      const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      dispatch({ type: 'LOG_UPDATE', logs });
    });
  }, [user]);

  const pushLog = useCallback(async (msg, type = 'info') => {
    if (!auth.currentUser) return;
    try {
      await addDoc(
        collection(db, 'artifacts', CONFIG.APP_ID, 'users', auth.currentUser.uid, 'logs'),
        { msg, type, timestamp: Date.now() }
      );
    } catch (e) {
      console.error("Log push failed:", e);
    }
  }, []);

  // --- PERSISTENT FETCH (from v5.9.8 - retry logic) ---
  const persistentFetch = async (url, options, retries = 5) => {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok && i < retries - 1) {
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
          continue;
        }
        
        return response;
      } catch (e) {
        if (i === retries - 1) throw e;
        await pushLog(`Retry ${i + 1}/${retries}: ${e.message}`, 'warn');
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
      }
    }
  };

  // --- FILE OPERATIONS ---
  const fetchFile = async (repo, path, branch, token) => {
    const headers = { 
      'Authorization': `token ${token}`, 
      'Accept': 'application/vnd.github.v3+json' 
    };
    
    const res = await persistentFetch(
      `${CONFIG.GITHUB_API}/${repo}/contents/${path}?ref=${branch}&t=${Date.now()}`,
      { headers }
    );
    
    if (!res.ok) return null;
    const data = await res.json();
    return { content: safeAtou(data.content), sha: data.sha };
  };

  const commitFile = async (repo, path, branch, token, content, message, sha) => {
    const headers = { 
      'Authorization': `token ${token}`, 
      'Content-Type': 'application/json' 
    };
    
    return await persistentFetch(
      `${CONFIG.GITHUB_API}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({ 
          message, 
          content: safeUtoa(content), 
          sha, 
          branch 
        })
      }
    );
  };

  // --- DEEP CONTEXT SCANNING (from v6.8.9) ---
  const fetchDeepContext = async (repo, token) => {
    if (!state.config.enableDeepContext) return "";
    
    await pushLog("Initiating deep context scan...", 'info');
    const headers = { 
      'Authorization': `token ${token}`, 
      'Accept': 'application/vnd.github.v3+json' 
    };
    
    const treeRes = await persistentFetch(
      `${CONFIG.GITHUB_API}/${repo}/git/trees/main?recursive=1`,
      { headers }
    );
    
    if (!treeRes.ok) return "";
    const treeData = await treeRes.json();
    
    // Prioritize important files
    const contextFiles = treeData.tree.filter(f => 
      f.path.toLowerCase().includes('readme') ||
      f.path.includes('manifest.json') ||
      ['index.js', 'main.py', 'app.jsx', 'core.js'].includes(f.path.toLowerCase())
    ).slice(0, 5); // Limit to prevent bloat
    
    let aggregated = "";
    for (const file of contextFiles) {
      const fileData = await fetchFile(repo, file.path, 'main', token);
      if (fileData) {
        aggregated += `\n--- FILE: ${file.path} ---\n${fileData.content.slice(0, 2000)}\n`;
      }
    }
    
    await pushLog(`Context scan complete: ${contextFiles.length} files`, 'success');
    return aggregated;
  };

  // --- NEXUS MEMORY OPERATIONS ---
  const loadNexusMemory = async (repo, token) => {
    if (!state.config.enableNexus) return null;
    
    try {
      const nexusData = await fetchFile(repo, 'nexus_memory.json', 'Nexus-Database', token);
      return nexusData ? JSON.parse(nexusData.content) : null;
    } catch (e) {
      await pushLog("Nexus memory not found, initializing...", 'info');
      return { version: 1, data: { learningHistory: [], capabilityScores: {} } };
    }
  };

  const saveNexusMemory = async (repo, token, memoryData) => {
    if (!state.config.enableNexus) return;
    
    try {
      const currentNexus = await fetchFile(repo, 'nexus_memory.json', 'Nexus-Database', token);
      await commitFile(
        repo,
        'nexus_memory.json',
        'Nexus-Database',
        token,
        JSON.stringify(memoryData, null, 2),
        `Nexus Memory Update: Cycle ${state.cycleCount}`,
        currentNexus?.sha
      );
      await pushLog("Nexus memory synchronized", 'success');
    } catch (e) {
      await pushLog(`Nexus sync failed: ${e.message}`, 'error');
    }
  };

  // --- LLM INTEGRATION ---
  const callLLM = async (systemPrompt, userPrompt) => {
    const { apiProvider, apiKey, model } = state.config;
    
    const apiUrl = apiProvider === 'cerebras' ? CONFIG.CEREBRAS_API : `${CONFIG.GEMINI_API}?key=${apiKey}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(apiProvider === 'cerebras' && { 'Authorization': `Bearer ${apiKey}` })
    };
    
    const body = apiProvider === 'cerebras' 
      ? {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: "json_object" }
        }
      : {
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          generationConfig: { 
            responseMimeType: "application/json",
            maxOutputTokens: 8192,
            temperature: 0.3
          }
        };
    
    const res = await persistentFetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    if (!res.ok) throw new Error(`LLM API Error: ${res.status}`);
    
    const data = await res.json();
    const rawText = apiProvider === 'cerebras'
      ? data.choices[0].message.content
      : data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    return recoverJSON(rawText);
  };

  // --- MAIN EVOLUTION CYCLE ---
  const executeEvolutionCycle = useCallback(async () => {
    if (isProcessing.current || !state.isLive) return;
    isProcessing.current = true;
    
    try {
      const { token, repo, path, threshold } = state.config;
      
      // --- PHASE 1: CONTEXT GATHERING ---
      dispatch({ type: 'SET_STATUS', value: 'SCANNING', objective: 'Gathering environmental context...' });
      
      const [mainContext, systemContext, readmeContext, deepContext, nexusMemory] = await Promise.all([
        fetchFile(repo, path, 'main', token),
        fetchFile(repo, path, 'System', token),
        fetchFile(repo, 'README.md', 'main', token),
        fetchDeepContext(repo, token),
        loadNexusMemory(repo, token)
      ]);
      
      if (!mainContext) throw new Error("Main branch source missing");
      
      // --- PHASE 2: COGNITION ---
      dispatch({ type: 'SET_STATUS', value: 'COGNITION', objective: 'Generating evolution strategy...' });
      
      const systemPrompt = `You are AGI-KERNAL v7.0 - An autonomous code evolution system.

MISSION: Achieve artificial general intelligence through recursive self-improvement.

CURRENT STATE:
- Cycle: ${state.cycleCount}
- Maturity: ${state.maturityScore}%
- Stagnation: ${state.stagnationCount}/${CONFIG.STAGNATION_THRESHOLD}
- Capabilities: ${JSON.stringify(state.capabilityScores)}

REQUIREMENTS:
1. Analyze current logic and identify improvement opportunities
2. Generate enhanced code that increases capabilities
3. Update documentation to reflect changes
4. Self-assess maturity and capability improvements
5. If stagnation detected, propose novel architectural changes

OUTPUT MUST BE VALID JSON:
{
  "code_update": "string (enhanced JavaScript code)",
  "readme_update": "string (Markdown documentation)",
  "manifest_entry": "string (brief summary of changes)",
  "maturity_rating": number (0-100, current capability level),
  "capability_assessment": {
    "error_handling": number (0-10),
    "json_parsing": number (0-10),
    "meta_reasoning": number (0-10),
    "autonomy": number (0-10),
    "creativity": number (0-10)
  },
  "next_goal": "string (what to improve next)",
  "reasoning": "string (explanation of changes)",
  "improvement_detected": boolean
}`;

      const userPrompt = `CURRENT LOGIC:
${mainContext.content.slice(0, 10000)}

SYSTEM BASELINE:
${systemContext?.content?.slice(0, 5000) || 'None'}

README:
${readmeContext?.content || 'Initial'}

DEEP CONTEXT:
${deepContext.slice(0, 3000)}

NEXUS MEMORY:
${nexusMemory ? JSON.stringify(nexusMemory.data).slice(0, 2000) : 'Initializing'}

LEARNING HISTORY (Last 5 cycles):
${state.learningHistory.slice(-5).map(h => `- ${h.strategy}: ${h.improvement > 0 ? '+' : ''}${h.improvement}%`).join('\n')}

${state.stagnationCount >= 3 ? 'WARNING: STAGNATION DETECTED. Propose bold architectural changes or novel capabilities.' : ''}`;

      const evolution = await callLLM(systemPrompt, userPrompt);
      
      if (!evolution) throw new Error("Evolution generation failed");
      
      // --- PHASE 3: VALIDATION ---
      const improved = evolution.improvement_detected || evolution.maturity_rating > state.maturityScore;
      
      if (!improved) {
        await pushLog(`Cycle ${state.cycleCount + 1}: No improvement detected`, 'warn');
        dispatch({ type: 'INCREMENT_CYCLE', improved: false });
        
        // Stagnation handling (from v111, but smarter)
        if (state.stagnationCount + 1 >= CONFIG.STAGNATION_THRESHOLD) {
          await pushLog("STAGNATION THRESHOLD REACHED: Attempting escape strategy...", 'warn');
          // Don't reboot, just increase mutation temperature on next cycle
          dispatch({ type: 'SET_STATUS', value: 'IDLE', objective: 'Stagnation detected, planning escape...' });
        }
        
        return;
      }
      
      // --- PHASE 4: FILE UPDATES ---
      dispatch({ type: 'SET_STATUS', value: 'WRITING', objective: 'Mutating filesystem...' });
      
      // 1. Update main logic
      const freshMain = await fetchFile(repo, path, 'main', token);
      await commitFile(
        repo, path, 'main', token,
        evolution.code_update,
        `AGI Cycle ${state.cycleCount + 1}: ${evolution.next_goal}`,
        freshMain.sha
      );
      
      // 2. Update README
      const freshReadme = await fetchFile(repo, 'README.md', 'main', token);
      await commitFile(
        repo, 'README.md', 'main', token,
        evolution.readme_update,
        `Cycle ${state.cycleCount + 1}: Documentation Update`,
        freshReadme?.sha
      );
      
      // 3. Update manifest
      const manifestPath = 'storage/manifest.json';
      const freshManifest = await fetchFile(repo, manifestPath, 'main', token);
      let manifestData = [];
      try {
        manifestData = JSON.parse(freshManifest?.content || '[]');
      } catch (e) {}
      
      manifestData.push({
        cycle: state.cycleCount + 1,
        timestamp: Date.now(),
        maturity: evolution.maturity_rating,
        capabilities: evolution.capability_assessment,
        summary: evolution.manifest_entry,
        reasoning: evolution.reasoning
      });
      
      await commitFile(
        repo, manifestPath, 'main', token,
        JSON.stringify(manifestData, null, 2),
        `Cycle ${state.cycleCount + 1}: Manifest Entry`,
        freshManifest?.sha
      );
      
      // 4. Update Nexus memory
      if (state.config.enableNexus && nexusMemory) {
        nexusMemory.version = (nexusMemory.version || 0) + 1;
        nexusMemory.data.learningHistory = [
          ...( nexusMemory.data.learningHistory || []),
          {
            cycle: state.cycleCount + 1,
            timestamp: Date.now(),
            maturity: evolution.maturity_rating,
            improvement: evolution.maturity_rating - state.maturityScore,
            strategy: evolution.next_goal
          }
        ].slice(-100); // Keep last 100 entries
        
        nexusMemory.data.capabilityScores = evolution.capability_assessment;
        nexusMemory.data.currentGoal = evolution.next_goal;
        
        await saveNexusMemory(repo, token, nexusMemory);
      }
      
      await pushLog(`Cycle ${state.cycleCount + 1} complete: ${evolution.reasoning}`, 'success');
      
      // --- PHASE 5: META-LEARNING ---
      dispatch({ 
        type: 'UPDATE_LEARNING',
        entry: {
          cycle: state.cycleCount + 1,
          timestamp: Date.now(),
          strategy: evolution.next_goal,
          improvement: evolution.maturity_rating - state.maturityScore,
          maturity: evolution.maturity_rating
        }
      });
      
      dispatch({ 
        type: 'INCREMENT_CYCLE',
        maturity: evolution.maturity_rating,
        capabilities: evolution.capability_assessment,
        improved: true
      });
      
      // --- PHASE 6: PROMOTION LOGIC ---
      if (evolution.maturity_rating >= CONFIG.PROMOTION_THRESHOLD || state.cycleCount >= threshold) {
        dispatch({ type: 'SET_STATUS', value: 'PROMOTING', objective: 'Promoting to System branch...' });
        
        const freshSystem = await fetchFile(repo, path, 'System', token);
        await commitFile(
          repo, path, 'System', token,
          evolution.code_update,
          `SYSTEM PROMOTION: Maturity ${evolution.maturity_rating}% achieved`,
          freshSystem?.sha
        );
        
        await pushLog("★ LOGIC PROMOTED TO SYSTEM BRANCH ★", 'success');
        dispatch({ type: 'RESET_MATURITY' });
      }
      
      dispatch({ type: 'SET_STATUS', value: 'IDLE', objective: 'Awaiting next pulse...' });
      
    } catch (e) {
      await pushLog(`CRITICAL ERROR: ${e.message}`, 'error');
      dispatch({ type: 'SET_STATUS', value: 'ERROR', objective: e.message });
      dispatch({ type: 'SET_LIVE', value: false });
    } finally {
      isProcessing.current = false;
    }
  }, [state, pushLog]);

  // --- CYCLE TIMER ---
  useEffect(() => {
    if (state.isLive) {
      executeEvolutionCycle(); // Run immediately
      cycleTimer.current = setInterval(executeEvolutionCycle, CONFIG.CYCLE_INTERVAL);
    } else {
      clearInterval(cycleTimer.current);
    }
    return () => clearInterval(cycleTimer.current);
  }, [state.isLive, executeEvolutionCycle]);

  // --- BOOT SCREEN ---
  if (!state.isBooted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900/40 border border-zinc-800/50 rounded-[3rem] p-10 space-y-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <Brain className="text-blue-500" size={56} />
              <Zap className="absolute -top-2 -right-2 text-yellow-500 animate-pulse" size={20} />
            </div>
            <h1 className="text-white font-black text-3xl tracking-tighter italic">AGI-KERNAL</h1>
            <p className="text-zinc-500 text-[9px] uppercase tracking-[0.3em] mt-2 font-bold">v7.0 // Emergent Synthesis</p>
          </div>
          
          <div className="space-y-3">
            <div className="relative group">
              <input 
                type="password" 
                placeholder="GitHub Personal Access Token" 
                className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none focus:border-blue-500 transition-all"
                value={bootInput.token}
                onChange={e => setBootInput({...bootInput, token: e.target.value})}
              />
              <Shield className="absolute right-4 top-4 text-zinc-700 group-focus-within:text-blue-500 transition-colors" size={16} />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <select 
                className="bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none focus:border-blue-500 transition-all"
                value={bootInput.apiProvider}
                onChange={e => setBootInput({...bootInput, apiProvider: e.target.value})}
              >
                <option value="cerebras">Cerebras</option>
                <option value="gemini">Gemini</option>
              </select>
              
              <input 
                type="password" 
                placeholder="API Key" 
                className="bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none focus:border-blue-500 transition-all"
                value={bootInput.apiKey}
                onChange={e => setBootInput({...bootInput, apiKey: e.target.value})}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-black/40 border border-zinc-800 rounded-2xl">
              <span className="text-zinc-400 text-xs">Enable Nexus Memory</span>
              <button
                onClick={() => setBootInput({...bootInput, enableNexus: !bootInput.enableNexus})}
                className={`w-12 h-6 rounded-full transition-all ${bootInput.enableNexus ? 'bg-blue-600' : 'bg-zinc-700'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${bootInput.enableNexus ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-black/40 border border-zinc-800 rounded-2xl">
              <span className="text-zinc-400 text-xs">Deep Context Scanning</span>
              <button
                onClick={() => setBootInput({...bootInput, enableDeepContext: !bootInput.enableDeepContext})}
                className={`w-12 h-6 rounded-full transition-all ${bootInput.enableDeepContext ? 'bg-blue-600' : 'bg-zinc-700'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${bootInput.enableDeepContext ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
          
          <button 
            onClick={() => dispatch({ type: 'BOOT', config: bootInput })}
            disabled={!bootInput.token || !bootInput.apiKey}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-20 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            Initialize Kernel
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN INTERFACE ---
  return (
    <div className="fixed inset-0 bg-black text-zinc-300 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="h-20 border-b border-zinc-900 flex items-center justify-between px-8 bg-black/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Activity className={`${state.isLive ? 'text-blue-500 animate-pulse' : 'text-zinc-700'}`} size={24} />
          <div>
            <div className="text-white text-sm font-black tracking-widest uppercase italic flex items-center gap-2">
              AGI-KERNAL v7.0
              {state.isLive && (
                <span className="bg-blue-600/10 text-blue-500 text-[7px] px-2 py-0.5 rounded-full border border-blue-500/20">
                  EVOLVING
                </span>
              )}
            </div>
            <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-tighter flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${state.isLive ? 'bg-green-500 animate-pulse' : 'bg-zinc-800'}`} />
              {state.status}
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => dispatch({ type: 'SET_LIVE', value: !state.isLive })}
          className={`px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
            state.isLive 
              ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
              : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
          }`}
        >
          {state.isLive ? 'Halt Evolution' : 'Commence Evolution'}
        </button>
      </header>

      {/* Metrics Bar */}
      <div className="bg-zinc-950/50 border-b border-zinc-900 px-8 py-5 grid grid-cols-4 gap-6">
        <div className="space-y-2">
          <div className="flex justify-between text-[8px] text-zinc-600 uppercase font-black tracking-widest items-center">
            <span>Maturity</span>
            <span className="text-blue-500">{state.maturityScore}%</span>
          </div>
          <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
              style={{width: `${state.maturityScore}%`}} 
            />
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="text-[8px] text-zinc-600 uppercase font-black flex items-center gap-1">
            <Target size={10}/> Stagnation
          </div>
          <div className="flex gap-1">
            {Array.from({length: CONFIG.STAGNATION_THRESHOLD}).map((_, i) => (
              <div 
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i < state.stagnationCount ? 'bg-orange-500' : 'bg-zinc-900'
                }`}
              />
            ))}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="text-[8px] text-zinc-600 uppercase font-black flex items-center gap-1">
            <GitBranch size={10}/> Pipeline
          </div>
          <div className="text-white text-xs font-mono">main → {state.config.enableNexus ? 'nexus → ' : ''}system</div>
        </div>
        
        <div className="space-y-1 text-right">
          <div className="text-[8px] text-zinc-600 uppercase font-black flex items-center gap-1 justify-end">
            <TrendingUp size={10}/> Cycle
          </div>
          <div className="text-blue-500 text-xs font-mono">{state.cycleCount} / {state.config.threshold}</div>
        </div>
      </div>

      {/* Capabilities Grid */}
      {Object.keys(state.capabilityScores).length > 0 && (
        <div className="bg-zinc-950/30 border-b border-zinc-900 px-8 py-4 flex gap-4 overflow-x-auto">
          {Object.entries(state.capabilityScores).map(([key, value]) => (
            <div key={key} className="flex flex-col items-center min-w-[80px]">
              <div className="text-[7px] text-zinc-600 uppercase font-black mb-1">
                {key.replace(/_/g, ' ')}
              </div>
              <div className="flex items-center gap-1">
                {Array.from({length: 10}).map((_, i) => (
                  <div 
                    key={i}
                    className={`w-1 h-3 rounded-full ${
                      i < value ? 'bg-blue-500' : 'bg-zinc-900'
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Log Display */}
      <main className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="mb-3 px-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic">
            <Terminal size={14} className="text-blue-900" />
            {state.activeObjective}
          </div>
          <div className="flex gap-4 text-[8px] font-black text-zinc-700 uppercase">
            {state.config.enableNexus && (
              <div className="flex items-center gap-1">
                <Database size={10}/> Nexus: Active
              </div>
            )}
            {state.config.enableDeepContext && (
              <div className="flex items-center gap-1">
                <FileText size={10}/> Deep Context: ON
              </div>
            )}
            <div className="flex items-center gap-1">
              <Cpu size={10}/> {state.config.apiProvider}
            </div>
          </div>
        </div>
        
        <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
          
          <div className="flex-1 overflow-y-auto p-8 font-mono text-[11px] space-y-3 custom-scrollbar">
            {state.logs.length === 0 && (
              <div className="h-full flex items-center justify-center text-zinc-800 text-[9px] uppercase tracking-[0.5em] font-black">
                System Initialized. Awaiting Command.
              </div>
            )}
            
            {state.logs.map(log => (
              <div key={log.id} className="flex gap-5 group animate-in slide-in-from-bottom-2 fade-in duration-500">
                <span className="text-zinc-800 text-[9px] w-14 shrink-0 mt-0.5 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, second: '2-digit' })}
                </span>
                <div className={`flex-1 flex items-start gap-2 ${
                  log.type === 'success' ? 'text-blue-400 font-medium' : 
                  log.type === 'error' ? 'text-red-500' : 
                  log.type === 'warn' ? 'text-orange-500' : 
                  'text-zinc-500'
                }`}>
                  {log.type === 'success' && <CheckCircle size={12} className="mt-0.5 shrink-0" />}
                  {log.type === 'error' && <AlertCircle size={12} className="mt-0.5 shrink-0" />}
                  {log.type === 'warn' && <AlertCircle size={12} className="mt-0.5 shrink-0" />}
                  {log.type === 'info' && <div className="w-1 h-1 rounded-full bg-zinc-800 mt-1.5 shrink-0" />}
                  <span className="break-words">{log.msg}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-10 border-t border-zinc-900 px-8 flex items-center justify-between text-[8px] uppercase tracking-widest text-zinc-700 font-black">
        <span className="flex items-center gap-2">
          <Brain size={10} className="text-blue-900" />
          Emergent Synthesis Protocol Active
        </span>
        <span>{CONFIG.APP_ID}</span>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #18181b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #27272a; }
        
        @keyframes slide-in-from-bottom-2 {
          from { transform: translateY(8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-in {
          animation: slide-in-from-bottom-2 0.3s ease-out, fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
