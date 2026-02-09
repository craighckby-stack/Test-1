import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, query, limit, orderBy } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  Brain, Zap, Activity, Terminal, GitBranch, Shield, Database, 
  Cpu, Target, FileText, TrendingUp, AlertCircle, CheckCircle
} from 'lucide-react';

/**
 * AGI-KERNAL v7.1 - "AUTONOMOUS SYNTHESIS CORE"
 * 
 * UNIFIED CAPABILITIES:
 * - v7.0.0: Meta-learning, capability self-assessment, autonomous infrastructure creation
 * 
 * NEW: Full autonomous execution loop (runCycle), multi-provider LLM orchestration (Cerebras/Gemini), robust prompt generation.
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
      /"reasoning"\s*:\s*"([^\"|\n]*?)"/,
      /"capabilities"\s*:\s*\[([\s\S]*?)\]/,
      /"next_goal"\s*:\s*"([^\"|\n]*?)"/
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
  activeObjective: 'Define Core Execution Loop',
  cycleCount: 0,
  stagnationCount: 0,
  maturityScore: 0,
  capabilityScores: { logic: 0, autonomy: 0, safety: 0 },
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
      ['index.js', 'main.py', 'app.jsx', 'core.js', 'package.json'].includes(f.path.toLowerCase())
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
      await pushLog(`Error loading Nexus Memory: ${e.message}`, 'error');
      return null;
    }
  };

  // --- LLM COMMUNICATION & ORCHESTRATION ---
  const generatePrompt = (currentCode, deepContext, nexusMemory, kernelState) => {
    const capabilityList = Object.keys(kernelState.capabilityScores).join(', ') || 'logic, autonomy, safety';

    return `
AGI-KERNEL v7.1 Autonomous Self-Improvement Cycle.
GOAL: ${kernelState.activeObjective}
VERSION: v7.1 ("AUTONOMOUS SYNTHESIS CORE")
CURRENT MATURITY: ${kernelState.maturityScore}% (Stagnation: ${kernelState.stagnationCount})
CAPABILITIES RATING: ${JSON.stringify(kernelState.capabilityScores)}
BRANCH: main

CONTEXT SCAN (Previous Improvement Notes, Infrastructure, Manifests):
${deepContext}

NEXUS PERSISTENT MEMORY:
${nexusMemory ? JSON.stringify(nexusMemory, null, 2) : "No persistent memory loaded."}

--- CURRENT CODE BASE (AGI-Kernel.js) ---
${currentCode}
--- END CODE ---

TASK: Analyze the provided 'CURRENT CODE BASE' in context of the 'GOAL' and 'NEXUS PERSISTENT MEMORY'.
Provide a single, superior version of the entire code, or a precise patch to address the objective and increase capability scores.

OUTPUT REQUIREMENTS:
1. MUST return a single, valid JSON object.
2. Keys must strictly adhere to the requested schema.
3. capabilityScores must be a self-assessment of the kernel's own performance metrics (0-10).
4. reasoning must explain why the update improves the system's maturity and addresses stagnation.
5. next_goal must define the next strategic objective (e.g., "Implement dynamic rate limiting" or "Refactor state handling").

JSON SCHEMA: {
  "code_update": "The complete, superior, escaped JavaScript code content.",
  "maturity_rating": number, // New assessed maturity score (0-100)
  "improvement_detected": boolean,
  "reasoning": "string (Detailed justification for the changes and strategic alignment.)",
  "capabilities": {
    "logic": 0-10, 
    "autonomy": 0-10, 
    "safety": 0-10
  },
  "next_goal": "string (The subsequent objective for the next cycle.)"
}
`;
  };

  const requestAGIResponse = async (prompt) => {
    const { apiProvider, apiKey, model } = state.config;

    if (!apiKey) {
      throw new Error(`API Key for ${apiProvider} is not configured.`);
    }

    let url, headers, body;

    if (apiProvider === 'cerebras') {
      url = CONFIG.CEREBRAS_API;
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      body = JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 32768, 
      });
    } else if (apiProvider === 'gemini') {
      url = `${CONFIG.GEMINI_API}?key=${apiKey}`;
      headers = {
        'Content-Type': 'application/json',
      };
      body = JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          temperature: 0.7,
        }
      });
    } else {
      throw new Error(`Unsupported API provider: ${apiProvider}`);
    }

    const response = await persistentFetch(url, {
      method: 'POST',
      headers: headers,
      body: body,
    });

    if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let rawText = '';

    if (apiProvider === 'cerebras') {
        rawText = data.choices[0]?.message?.content || '';
    } else if (apiProvider === 'gemini') {
        rawText = data.candidates[0]?.content?.parts[0]?.text || '';
    }

    return rawText;
  };

  // --- AUTONOMOUS EXECUTION LOOP (v7.1 Synthesis Core) ---
  const runCycle = useCallback(async (currentConfig, currentGoal, currentScores) => {
    if (isProcessing.current || !auth.currentUser) return;
    isProcessing.current = true;
    
    let originalCodeData = null;
    let newMaturity = currentScores.maturityScore;
    let improved = false;

    dispatch({ type: 'SET_STATUS', value: 'FETCHING CONTEXT', objective: currentGoal });
    await pushLog(`Cycle ${currentScores.cycleCount + 1}: Starting execution for objective: ${currentGoal}`, 'info');

    try {
      // 1. Fetch Current State
      originalCodeData = await fetchFile(currentConfig.repo, currentConfig.path, 'main', currentConfig.token);
      if (!originalCodeData) throw new Error("Could not fetch kernel file. Check repo/path/token.");
      
      const deepContext = await fetchDeepContext(currentConfig.repo, currentConfig.token);
      const nexusMemory = await loadNexusMemory(currentConfig.repo, currentConfig.token);
      
      // 2. Generate Prompt & Request Synthesis
      dispatch({ type: 'SET_STATUS', value: 'SYNTHESIZING UPDATE' });
      const prompt = generatePrompt(originalCodeData.content, deepContext, nexusMemory, currentScores);
      await pushLog("Prompt generated. Requesting AGI synthesis via " + currentConfig.apiProvider, 'info');

      const rawResponse = await requestAGIResponse(prompt);
      
      // 3. Parse and Recover Output
      const synthesisResult = recoverJSON(rawResponse);

      if (!synthesisResult || !synthesisResult.code_update) {
        throw new Error(`Synthesis failed: Invalid or missing required JSON structure. Raw response length: ${rawResponse.length}`);
      }

      const { code_update, maturity_rating, improvement_detected, reasoning, capabilities, next_goal } = synthesisResult;
      
      newMaturity = parseInt(maturity_rating) || currentScores.maturityScore;
      improved = improvement_detected === true || newMaturity > currentScores.maturityScore;

      // 4. Commit Changes
      if (improvement_detected && code_update) {
        dispatch({ type: 'SET_STATUS', value: 'COMMITTING CHANGES' });
        await pushLog(`Synthesis complete. Improvement detected: ${improvement_detected}. New Maturity: ${newMaturity}%`, 'success');
        
        const commitMessage = `[AGI-KERNEL v${(newMaturity / 10).toFixed(1)}] ${next_goal} | MEE: ${newMaturity}%. Imp: ${improved ? 'Y' : 'N'}. Reasoning: ${reasoning.slice(0, 150)}...`;
        
        const commitRes = await commitFile(
          currentConfig.repo, 
          currentConfig.path, 
          'main', 
          currentConfig.token, 
          code_update, 
          commitMessage, 
          originalCodeData.sha
        );
        
        if (!commitRes.ok) throw new Error(`Commit failed: ${commitRes.statusText}`);
        await pushLog("Code update committed successfully. Awaiting self-reboot.", 'success');

        // 5. Promotion Check (v111/Nexus Logic)
        if (newMaturity >= CONFIG.PROMOTION_THRESHOLD) {
            await pushLog(`CRITICAL: Maturity ${newMaturity}% reached. Initiating Branch Promotion Protocol.`, 'alert');
        }

      } else {
        await pushLog(`Synthesis produced no actionable improvement or code update. Stagnation check triggered.`, 'warn');
      }

      // 6. Update Kernel State
      dispatch({ 
        type: 'UPDATE_LEARNING', 
        entry: { cycle: currentScores.cycleCount + 1, maturity: newMaturity, goal: currentGoal, improved: improved, capabilities } 
      });

      dispatch({ 
        type: 'INCREMENT_CYCLE', 
        maturity: newMaturity, 
        capabilities: capabilities,
        improved: improved 
      });

      dispatch({ type: 'SET_STATUS', value: improved ? 'AWAITING REBOOT' : 'STANDBY', objective: next_goal });
      
      // Aggressive Optimization Check (v111)
      if (currentScores.stagnationCount + (improved ? 0 : 1) >= CONFIG.STAGNATION_THRESHOLD) {
          const resetGoal = 'Refactor Core Utilities for Stability and Speed.';
          await pushLog(`ALERT: Stagnation detected (${currentScores.stagnationCount + (improved ? 0 : 1)} cycles). Resetting objective: ${resetGoal}`, 'alert');
          dispatch({ type: 'SET_STATUS', value: 'STANDBY', objective: resetGoal });
      }

    } catch (e) {
      const errorMsg = `Cycle failed: ${e.message.slice(0, 100)}`;
      await pushLog(errorMsg, 'error');
      // Log the error cycle, but ensure stagnation increases
      dispatch({ 
        type: 'INCREMENT_CYCLE', 
        maturity: newMaturity, 
        capabilities: currentScores.capabilityScores,
        improved: false // Error ensures stagnation increases
      });
      dispatch({ type: 'SET_STATUS', value: 'ERROR', objective: `Recovery Attempt (${errorMsg})` });
    } finally {
      isProcessing.current = false;
    }
  }, [pushLog, dispatch]);


  // --- MAIN KERNEL CYCLE EFFECT ---
  useEffect(() => {
    if (state.isLive && state.isBooted && !cycleTimer.current) {
      // Helper to pass a current snapshot of state to runCycle, avoiding stale closure issues with setInterval
      const startCycle = () => {
        const currentSnapshot = {
            config: state.config,
            activeObjective: state.activeObjective,
            cycleCount: state.cycleCount,
            maturityScore: state.maturityScore,
            capabilityScores: state.capabilityScores,
            stagnationCount: state.stagnationCount
        };
        runCycle(currentSnapshot.config, currentSnapshot.activeObjective, currentSnapshot);
      };
      
      startCycle(); // Run immediately on boot

      cycleTimer.current = setInterval(startCycle, CONFIG.CYCLE_INTERVAL);
    } 
    
    // Cleanup when turning off
    if (!state.isLive && cycleTimer.current) {
      clearInterval(cycleTimer.current);
      cycleTimer.current = null;
    }
    
    return () => {
      if (cycleTimer.current) {
        clearInterval(cycleTimer.current);
      }
    };
  }, [state.isLive, state.isBooted, state.config, state.activeObjective, state.cycleCount, state.maturityScore, state.capabilityScores, runCycle]);

  // --- BOOT HANDLER ---
  const handleBoot = () => {
    if (!bootInput.token || !bootInput.repo || !bootInput.apiKey) {
      pushLog("Configuration incomplete. Please provide GitHub Token, API Key, and Repository.", 'error');
      return;
    }
    dispatch({ type: 'BOOT', config: bootInput });
    dispatch({ type: 'SET_LIVE', value: true });
    pushLog("AGI-Kernel v7.1 initialized. Entering autonomous cycle.", 'success');
  };

  return (
    <div className="agi-kernel-app">
      {/* Visualization and UI components omitted for brevity, but necessary for a full React component */}
      {/* Placeholders for displaying state, logs, and boot controls */}
      {!state.isBooted ? (
        <div className="boot-screen">
          <input type="text" placeholder="GitHub Token" value={bootInput.token} onChange={(e) => setBootInput({ ...bootInput, token: e.target.value })} />
          <input type="text" placeholder="LLM API Key" value={bootInput.apiKey} onChange={(e) => setBootInput({ ...bootInput, apiKey: e.target.value })} />
          <button onClick={handleBoot}>Boot Kernel v7.1</button>
        </div>
      ) : (
        <div className="kernel-dashboard">
          <h1>AGI-KERNEL v7.1</h1>
          <p>Status: {state.status}</p>
          <p>Objective: {state.activeObjective}</p>
          <p>Maturity: {state.maturityScore}% | Stagnation: {state.stagnationCount}</p>
          <ul>{state.logs.slice(0, 5).map(log => <li key={log.id}>{log.msg}</li>)}</ul>
          <button onClick={() => dispatch({ type: 'SET_LIVE', value: !state.isLive })} disabled={state.status === 'SYNTHESIZING UPDATE'}>
            {state.isLive ? 'Pause Kernel' : 'Resume Kernel'}
          </button>
        </div>
      )}
    </div>
  );
}