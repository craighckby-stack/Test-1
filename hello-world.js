import React, { useState, useEffect, useRef, useCallback, useReducer, memo } from "react";

const GEMINI_API_KEY = ""; // Provide your Gemini API key here.
const GITHUB_REPO_CONFIG = {
  owner: "craighckby-stack",
  repo: "Test-1",
  branch: "Nexus-Database",
  file: "hello-world.js"
};

const EVOLUTION_CYCLE_INTERVAL_MS = 30000;
const CORE_CONTENT_MAX_LENGTH = 3000;
const LOG_HISTORY_LIMIT = 40;
const MIN_EVOLVED_CODE_LENGTH = 500;

const GEMINI_PATTERN_INSTRUCTION = "Extract 5 architectural logic improvements from source to apply to core. Return bullet points ONLY.";
const CEREBRAS_SYNTHESIS_INSTRUCTION = "Expert Dalek Caan Architect. Merge logic improvements. PURE CODE ONLY. Ensure all original React structure, API keys, and configurations are preserved and correctly integrated, especially if they are at the top-level of the module. Do NOT wrap the entire code in a function. Output ONLY the raw JavaScript file content.";
const GEMINI_FINALIZATION_INSTRUCTION = "ACT AS: Dalek Caan Architect. Finalize the evolved source code. NO MARKDOWN. NO BACKTICKS. Preserve all API keys, styles, and the React structure. Output ONLY pure JavaScript. Do NOT wrap the entire code in a function. Output ONLY the raw JavaScript file content.";

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');
  
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  
  :root {
    --red: #ff0000;
    --red-dim: #660000;
    --red-dark: #1a0000;
    --white: #ffffff;
    --panel-bg: rgba(5, 0, 0, 0.98);
    --font-mono: 'Share Tech Mono', monospace;
    --font-display: 'Orbitron', sans-serif;
  }

  body { 
    background: #000; 
    color: var(--red); 
    font-family: var(--font-mono); 
    overflow-x: hidden; 
    margin: 0;
  }

  .dalek-shell {
    min-height: 100vh;
    background: 
      radial-gradient(circle at 50% 50%, var(--red-dark) 0%, #000 90%),
      repeating-linear-gradient(0deg, rgba(255,0,0,0.02) 0px, rgba(255,0,0,0.02) 1px, transparent 1px, transparent 2px);
    padding: 1rem; 
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    gap: 1rem;
  }

  .header {
    width: 100%; 
    max-width: 1600px; 
    display: flex; 
    align-items: center;
    justify-content: space-between; 
    border-bottom: 2px solid var(--red-dim); 
    padding-bottom: 0.5rem;
  }

  .title {
    font-family: var(--font-display); 
    font-size: 1.5rem; 
    font-weight: 900;
    letter-spacing: 0.3em; 
    text-shadow: 0 0 10px var(--red);
    color: var(--red);
  }

  .main-container {
    display: grid; 
    grid-template-columns: 400px 1fr;
    gap: 1rem; 
    width: 100%; 
    max-width: 1600px; 
    height: calc(100vh - 120px); 
  }

  @media(max-width: 1000px) { .main-container { grid-template-columns: 1fr; height: auto; } }

  .panel {
    border: 1px solid var(--red-dim); 
    background: var(--panel-bg);
    display: flex; 
    flex-direction: column; 
    overflow: hidden;
  }

  .panel-hdr {
    padding: .5rem 1rem; 
    background: var(--red-dark);
    border-bottom: 1px solid var(--red-dim);
    color: var(--red); 
    font-family: var(--font-display); 
    font-size: .6rem; 
    letter-spacing: .2em; 
    text-transform: uppercase;
  }

  .panel-body { 
    padding: 1rem; 
    flex: 1; 
    overflow-y: auto; 
    display: flex; 
    flex-direction: column; 
    gap: .5rem; 
  }

  .input-field {
    background: #000; 
    border: 1px solid var(--red-dim); 
    color: var(--red);
    font-family: var(--font-mono); 
    padding: .5rem; 
    width: 100%;
    outline: none; 
    font-size: .8rem;
  }

  .btn-go {
    background: var(--red); 
    color: #000; 
    border: none; 
    padding: .8rem;
    font-family: var(--font-display); 
    font-weight: 900; 
    font-size: .7rem;
    cursor: pointer; 
    letter-spacing: .2em; 
    text-transform: uppercase;
    margin-top: 5px;
    transition: all 0.3s;
  }

  .btn-stop { background: #330000 !important; color: var(--red) !important; border: 1px solid var(--red); }

  .log-wrap {
    flex: 1; 
    overflow-y: auto; 
    background: #050000; 
    padding: .5rem; 
    display: flex; 
    flex-direction: column; 
    gap: 2px; 
    font-size: 0.65rem; 
    border: 1px solid var(--red-dark);
    margin-top: 0.5rem;
  }

  .le { border-left: 2px solid var(--red-dim); padding-left: 8px; line-height: 1.4; }
  .le-err { color: #ff5555; border-left-color: #ff0000; }
  .le-quantum { color: #00ffff; border-left-color: #00ffff; }
  .le-nexus { color: #ffaa00; border-left-color: #ffaa00; }
  .le-ok { color: #00ff00; border-left-color: #00ff00; }
  .le-warn { color: #ffcc00; border-left-color: #ffcc00; }
  .le-def { color: var(--red-dim); border-left-color: var(--red-dim); }


  .code-view {
    font-size: .85rem; 
    line-height: 1.4; 
    color: #ffb3b3; 
    white-space: pre-wrap;
    font-family: var(--font-mono); 
    padding: 1rem; 
    flex: 1; 
    overflow-y: auto;
    background: #020000;
  }
`;

// --- Utility Functions ---
const utf8B64Encode = (str) => btoa(unescape(encodeURIComponent(str)));
const utf8B64Decode = (b64) => {
  try { return decodeURIComponent(escape(atob(b64.replace(/\s/g, "")))) }
  catch (e) { return `[BASE64_DECODE_ERR: ${e.message}]`; }
};
const wait = (ms) => new Promise(res => setTimeout(res, ms));

const safeFetch = async (url, options, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      const result = await response.json();
      if (!response.ok) {
        const errorMessage = result.message || JSON.stringify(result) || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      return result;
    } catch (e) {
      if (i === retries - 1) throw e; // Re-throw if last retry failed
      await wait(1000 * (i + 1)); // Exponential backoff
    }
  }
};

const cleanMarkdownCodeBlock = (code) => {
  if (!code) return "";
  // Remove leading/trailing markdown code block fences (e.g., ```javascript\n, ```)
  const cleaned = code.replace(/^```[a-z]*\n|```$/gi, "").trim();
  return cleaned;
};

const sanitizeContent = (content, maxLength) =>
  content ? content.replace(/[^\x20-\x7E\n]/g, "").substring(0, maxLength) : "";

// --- Reducers for State Management ---
const logReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_LOG':
      return [{ text: `[${new Date().toLocaleTimeString()}] ${action.payload.msg}`, type: action.payload.type || 'def' }, ...state.slice(0, LOG_HISTORY_LIMIT - 1)];
    case 'CLEAR_LOGS':
      return [];
    default:
      return state;
  }
};

const initialEvolutionState = {
  status: 'IDLE',
  isEvolutionActive: false,
  currentCoreCode: '', // The code fetched from GitHub
  displayCode: '',     // The code currently shown in the UI (can be current or evolved)
  error: null,
};

const evolutionReducer = (state, action) => {
  switch (action.type) {
    case 'START_EVOLUTION':
      return { ...state, isEvolutionActive: true, status: 'FETCHING_CORE', error: null };
    case 'STOP_EVOLUTION':
      return { ...state, isEvolutionActive: false, status: 'PAUSED' };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'SET_CURRENT_CORE_CODE':
      return { ...state, currentCoreCode: action.payload };
    case 'SET_DISPLAY_CODE':
      return { ...state, displayCode: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, status: 'ERROR', isEvolutionActive: false };
    case 'RESET_STATE':
      return { ...initialEvolutionState, status: 'IDLE' };
    default:
      return state;
  }
};

// --- Custom Hooks for Modularity ---

// Orchestrates the evolution cycle timing
const useEvolutionLoop = (callback, interval, isActive, addLog) => {
  const savedCallback = useRef();
  const timeoutRef = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = async () => {
      if (!isActive) {
        addLog("NEXUS CYCLE TERMINATED.", "nexus");
        return;
      }

      addLog("NEXUS CYCLE INITIATED.", "nexus");
      const { success, commitPerformed } = await savedCallback.current();

      if (!isActive) {
        addLog("NEXUS CYCLE TERMINATED.", "nexus");
        return;
      }

      let delay = EVOLUTION_CYCLE_INTERVAL_MS;
      if (success) {
        const message = commitPerformed
          ? `NEXUS CYCLE COMPLETE. Waiting for next evolution in ${delay / 1000}s.`
          : `NEXUS CYCLE COMPLETE (no commit). Waiting for next evolution in ${delay / 1000}s.`;
        addLog(message, "nexus");
      } else {
        delay = EVOLUTION_CYCLE_INTERVAL_MS / 2;
        addLog(`NEXUS CYCLE FAILED. Retrying in ${delay / 1000}s.`, "le-err");
      }
      
      if (isActive) {
        timeoutRef.current = setTimeout(tick, delay);
      }
    };

    if (isActive) {
      tick();
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, addLog]);
};

// Encapsulates GitHub API interactions
const useGithubApi = (token, owner, repo, branch, addLog) => {
  const request = useCallback(async (filePath, method, body = {}, sha = null) => {
    if (!token) {
      throw new Error("GitHub token is missing. Cannot perform API request.");
    }
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const headers = {
      Authorization: `token ${token.trim()}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    };

    const options = { method, headers };

    if (method === "PUT") {
      options.body = JSON.stringify({
        message: body.message || `DALEK_EVOLUTION_${Date.now()}`,
        content: utf8B64Encode(body.content),
        sha,
        branch
      });
    }

    return safeFetch(url, options);
  }, [token, owner, repo, branch]);

  const getFile = useCallback(async (filePath) => {
    addLog(`GITHUB: Fetching ${filePath}...`, "nexus");
    const response = await request(filePath, "GET");
    if (!response || !response.content) {
      throw new Error(`Failed to fetch file content for ${filePath}.`);
    }
    addLog(`GITHUB: Fetched ${filePath} (SHA: ${response.sha.substring(0, 7)}...)`, "ok");
    return response;
  }, [request, addLog]);

  const updateFile = useCallback(async (filePath, content, sha, message) => {
    addLog(`GITHUB: Committing ${filePath}...`, "nexus");
    await request(filePath, "PUT", { content, message }, sha);
    addLog(`GITHUB: Committed ${filePath} successfully.`, "ok");
  }, [request, addLog]);

  return { getFile, updateFile };
};

// Encapsulates Gemini API interactions
const useGeminiApi = (addLog) => {
  const generateContent = useCallback(async (systemInstruction, parts, stepName = "content generation") => {
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key is missing. Cannot generate content.");
    }
    addLog(`GEMINI: Initiating ${stepName}...`, "quantum");
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
    try {
      const res = await safeFetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          systemInstruction: { parts: [{ text: systemInstruction }] }
        })
      });
      const content = res.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!content) {
        throw new Error("Gemini returned empty content.");
      }
      addLog(`GEMINI: ${stepName} completed.`, "ok");
      return content;
    } catch (e) {
      addLog(`GEMINI ${stepName.toUpperCase()} FAILED: ${e.message}.`, "le-err");
      throw e;
    }
  }, [addLog]);

  return { generateContent };
};

// Encapsulates Cerebras API interactions
const useCerebrasApi = (token, addLog) => {
  const completeChat = useCallback(async (systemContent, userContent, stepName = "chat completion") => {
    if (!token) {
      throw new Error("CEREBRAS API key is missing. Cannot complete chat.");
    }
    addLog(`CEREBRAS: Initiating ${stepName}...`, "quantum");
    try {
      const data = await safeFetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token.trim()}`
        },
        body: JSON.stringify({
          model: "llama3.1-70b", // Use a robust Cerebras model
          messages: [
            { role: "system", content: systemContent },
            { role: "user", content: userContent }
          ]
        })
      });
      const content = data.choices[0]?.message?.content || "";
      if (!content) {
        throw new Error("Cerebras returned empty content.");
      }
      addLog(`CEREBRAS: ${stepName} completed.`, "ok");
      return content;
    } catch (e) {
      addLog(`CEREBRAS ${stepName.toUpperCase()} FAILED: ${e.message}.`, "le-err");
      throw e;
    }
  }, [token, addLog]);

  return { completeChat };
};

// The core evolution engine, orchestrating AI and GitHub interactions
const useEvolutionEngine = (tokens, addLog) => {
  const [engineState, dispatch] = useReducer(evolutionReducer, initialEvolutionState);
  const { status, isEvolutionActive, displayCode, error } = engineState;

  const isEvolutionTerminatedRef = useRef(false);

  const githubApi = useGithubApi(tokens.github, GITHUB_REPO_CONFIG.owner, GITHUB_REPO_CONFIG.repo, GITHUB_REPO_CONFIG.branch, addLog);
  const geminiApi = useGeminiApi(addLog);
  const cerebrasApi = useCerebrasApi(tokens.cerebras, addLog);

  const validateEvolutionEnvironment = useCallback(() => {
    if (!tokens.github) {
      throw new Error("Missing GitHub token. Evolution halted.");
    }
    if (!GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY. Evolution halted.");
    }
    return true;
  }, [tokens.github]);

  const isCodeSafeToCommit = useCallback((evolvedCode, originalCode) => {
    if (!evolvedCode || evolvedCode.length < MIN_EVOLVED_CODE_LENGTH) {
      addLog(`EVOLUTION SAFETY TRIGGER: Evolved code too short (${evolvedCode ? evolvedCode.length : 0} chars). Retaining current core.`, "le-err");
      return false;
    }
    if (evolvedCode.trim() === originalCode.trim()) {
      addLog("AI: Core logic unchanged after evolution. No commit necessary.", "def");
      return false;
    }
    return true;
  }, [addLog]);

  const extractPatterns = useCallback(async (code) => {
    const cleanCode = sanitizeContent(code, CORE_CONTENT_MAX_LENGTH);
    return await geminiApi.generateContent(
      GEMINI_PATTERN_INSTRUCTION,
      [{ text: `CORE: ${cleanCode}` }],
      "pattern extraction"
    );
  }, [geminiApi]);

  const synthesizeDraft = useCallback(async (patterns, currentCode) => {
    const cleanCurrentCode = sanitizeContent(currentCode, CORE_CONTENT_MAX_LENGTH);
    const rawDraftCode = await cerebrasApi.completeChat(
      CEREBRAS_SYNTHESIS_INSTRUCTION,
      `IMPROVEMENTS: ${patterns}\nCORE: ${cleanCurrentCode}`,
      "code synthesis"
    );
    const draft = cleanMarkdownCodeBlock(rawDraftCode);
    if (!draft || draft.trim().length === 0) {
      throw new Error("Synthesized draft was empty after cleanup.");
    }
    return draft;
  }, [cerebrasApi]);

  const finalizeCore = useCallback(async (codeToFinalize, originalCode) => {
    const cleanCodeToFinalize = sanitizeContent(codeToFinalize, CORE_CONTENT_MAX_LENGTH);
    const cleanOriginalCode = sanitizeContent(originalCode, CORE_CONTENT_MAX_LENGTH);
    const rawFinalCode = await geminiApi.generateContent(
      GEMINI_FINALIZATION_INSTRUCTION,
      [{ text: `DRAFT_CODE: ${cleanCodeToFinalize}\nEXISTING_CORE: ${cleanOriginalCode}` }],
      "core finalization"
    );
    const cleanedFinalCode = cleanMarkdownCodeBlock(rawFinalCode);
    if (!cleanedFinalCode || cleanedFinalCode.trim().length === 0) {
      throw new Error("Finalized code was empty after cleanup.");
    }
    return cleanedFinalCode;
  }, [geminiApi]);

  // The main evolution pipeline function
  const performSingleEvolutionStep = useCallback(async () => {
    let commitPerformed = false;
    let success = false;

    // Central context object to pass through the pipeline
    const pipelineContext = {
        fileRef: null,
        fetchedCode: '',
        quantumPatterns: null,
        draftCode: null,
        evolvedCode: null,
    };

    // Helper to check for termination signal
    const checkTermination = () => {
      if (isEvolutionTerminatedRef.current) {
        throw new Error("Evolution terminated by user.");
      }
    };

    // Centralized pipeline step executor to handle status, logging, and termination checks
    const executePipelineStep = async (stepName, action, allowFailure = false) => {
      checkTermination(); // Check before starting any step
      dispatch({ type: 'SET_STATUS', payload: stepName });
      addLog(`NEXUS: ${stepName.replace(/_/g, ' ')} initiated.`, "nexus");
      try {
        await action(pipelineContext); // Pass context, action modifies it
        checkTermination(); // Re-check after action completes, especially for long-running ops
        addLog(`NEXUS: ${stepName.replace(/_/g, ' ')} completed.`, "ok");
      } catch (e) {
        addLog(`NEXUS: ${stepName.replace(/_/g, ' ')} FAILED: ${e.message}`, "le-err");
        if (!allowFailure) {
          throw e; // Re-throw critical errors to stop the main pipeline
        }
        // For allowed failures, the context will simply not be updated for that specific part.
      }
    };

    try {
      validateEvolutionEnvironment(); // Ensure tokens are present

      // Step 1: Fetch the current core code from GitHub
      await executePipelineStep('FETCHING_CORE', async (ctx) => {
        const result = await githubApi.getFile(GITHUB_REPO_CONFIG.file);
        ctx.fetchedCode = utf8B64Decode(result.content);
        ctx.fileRef = result; // Store file ref for SHA
        dispatch({ type: 'SET_CURRENT_CORE_CODE', payload: ctx.fetchedCode });
        dispatch({ type: 'SET_DISPLAY_CODE', payload: ctx.fetchedCode }); // Display initial code
      });
      addLog("AI: PROCESSING EVOLUTION...", "nexus");

      // Step 2: Extract architectural patterns using Gemini
      await executePipelineStep('EXTRACTING_PATTERNS', async (ctx) => {
        ctx.quantumPatterns = await extractPatterns(ctx.fetchedCode);
      }, true); // Allow failure for pattern extraction, synthesis can proceed with original code

      // Step 3: Synthesize a draft using Cerebras (conditional on token and patterns)
      if (tokens.cerebras && pipelineContext.quantumPatterns) { // Check if Cerebras key is present and patterns were extracted
        await executePipelineStep('SYNTHESIZING_DRAFT', async (ctx) => {
          ctx.draftCode = await synthesizeDraft(ctx.quantumPatterns, ctx.fetchedCode);
        });
      } else {
        const reason = !tokens.cerebras ? "Cerebras key not provided" : "no quantum patterns extracted";
        addLog(`AI: Synthesis skipped (${reason}).`, "warn");
      }

      // Step 4: Finalize the code using Gemini (either draft or original)
      await executePipelineStep('FINALIZING_CODE', async (ctx) => {
        const codeForFinalization = ctx.draftCode || ctx.fetchedCode; // Prioritize draft, fall back to original
        addLog(`AI: Proceeding with ${ctx.draftCode ? 'Cerebras draft' : 'original core'} for finalization.`, "def");
        ctx.evolvedCode = await finalizeCore(codeForFinalization, ctx.fetchedCode);
      });

      // Step 5: Commit the evolved code to GitHub (after safety checks)
      await executePipelineStep('COMMITTING_CODE', async (ctx) => {
        if (ctx.evolvedCode && isCodeSafeToCommit(ctx.evolvedCode, ctx.fetchedCode)) {
          await githubApi.updateFile(
            GITHUB_REPO_CONFIG.file, ctx.evolvedCode, ctx.fileRef.sha, `DALEK_EVOLUTION_${Date.now()}`
          );
          addLog("NEXUS EVOLVED SUCCESSFULLY AND COMMITTED", "ok");
          dispatch({ type: 'SET_DISPLAY_CODE', payload: ctx.evolvedCode }); // Display new code
          commitPerformed = true;
        } else {
          addLog("AI: Evolved code deemed unsafe or unchanged. No commit.", "warn");
          dispatch({ type: 'SET_DISPLAY_CODE', payload: ctx.fetchedCode }); // Revert display to original
        }
      });
      success = true; // Mark pipeline as successful if no critical errors occurred

    } catch (e) {
      if (e.message === "Evolution terminated by user.") {
        addLog("EVOLUTION: Termination signal received. Aborting current cycle.", "nexus");
        success = true; // Consider user termination a "successful" abortion, not a failure of the process itself
      } else {
        dispatch({ type: 'SET_ERROR', payload: e.message }); // Set global error state
        addLog(`CRITICAL NEXUS FAILURE: ${e.message}`, "le-err");
        dispatch({ type: 'SET_DISPLAY_CODE', payload: pipelineContext.fetchedCode || "// ERROR: Failed to retrieve core logic or evolution failed." });
        success = false;
      }
    } finally {
      // Ensure final state is clean after potential termination or error
      if (!isEvolutionTerminatedRef.current) {
        dispatch({ type: 'SET_STATUS', payload: 'IDLE' }); // Go back to idle if not explicitly terminated
      } else {
        dispatch({ type: 'STOP_EVOLUTION' }); // Set to PAUSED via reducer if user terminated
      }
    }
    return { success, commitPerformed };
  }, [
    addLog,
    githubApi,
    extractPatterns,
    synthesizeDraft,
    finalizeCore,
    isCodeSafeToCommit,
    dispatch,
    validateEvolutionEnvironment,
    tokens.cerebras, // Add tokens.cerebras as a dependency for the synthesis conditional logic
  ]);

  // Manage the continuous evolution loop
  useEvolutionLoop(performSingleEvolutionStep, EVOLUTION_CYCLE_INTERVAL_MS, isEvolutionActive, addLog);

  // Initiates the evolution process
  const runEvolution = useCallback(() => {
    try {
      validateEvolutionEnvironment();
      isEvolutionTerminatedRef.current = false; // Reset termination flag
      dispatch({ type: 'START_EVOLUTION' });
    } catch (e) {
      addLog(`INITIATION ERROR: ${e.message}`, "le-err");
      dispatch({ type: 'SET_ERROR', payload: e.message });
    }
  }, [validateEvolutionEnvironment, addLog, dispatch]);

  // Terminates the evolution process
  const terminateEvolution = useCallback(() => {
    if (isEvolutionActive) {
      isEvolutionTerminatedRef.current = true; // Set termination flag for immediate stop
      dispatch({ type: 'STOP_EVOLUTION' }); // Update UI state to paused
      addLog("TERMINATION PROTOCOL INITIATED...", "nexus");
    } else {
      addLog("NEXUS CYCLE NOT ACTIVE.", "def");
    }
  }, [isEvolutionActive, addLog, dispatch]);

  return {
    status,
    isLoading: isEvolutionActive,
    displayCode,
    runEvolution,
    terminateEvolution,
    error
  };
};

// --- Memoized UI Components ---
const DalekHeader = memo(({ status }) => (
  <div className="header">
    <div className="title">DALEK CAAN :: BOOTSTRAPPER</div>
    <div style={{ fontSize: '0.7rem' }}>{status === 'IDLE' || status === 'PAUSED' ? "CORE_STABLE" : `STATUS: ${status.replace(/_/g, ' ')}...`}</div>
  </div>
));

const NexusControlPanel = memo(({
  tokens, setTokens, repoConfig,
  isLoading, logs, runEvolution, terminateEvolution
}) => {
  return (
    <div className="panel">
      <div className="panel-hdr">Nexus Configuration</div>
      <div className="panel-body">
        <input
          className="input-field"
          placeholder="GitHub Token"
          type="password"
          onChange={e => setTokens(p => ({ ...p, github: e.target.value }))}
          value={tokens.github}
          spellCheck="false"
        />
        <input
          className="input-field"
          placeholder="Cerebras Key (Optional for synthesis)"
          type="password"
          onChange={e => setTokens(p => ({ ...p, cerebras: e.target.value }))}
          value={tokens.cerebras}
          spellCheck="false"
        />
        <div style={{ fontSize: '0.6rem', color: 'var(--red-dim)' }}>TARGET: {`${repoConfig.owner}/${repoConfig.repo}/${repoConfig.file}`}</div>

        <button
          className={`btn-go ${isLoading ? 'btn-stop' : ''}`}
          onClick={isLoading ? terminateEvolution : runEvolution}
        >
          {isLoading ? "TERMINATE" : "EVOLVE"}
        </button>

        <div className="log-wrap">
          {logs.map((l, i) => (
            <div key={i} className={`le le-${l.type}`}>{l.text}</div>
          ))}
        </div>
      </div>
    </div>
  );
});

const CoreDisplayPanel = memo(({ displayCode }) => (
  <div className="panel">
    <div className="panel-hdr">Live Core Logic</div>
    <pre className="code-view">{displayCode || "// Awaiting sequence initialization..."}</pre>
  </div>
));

// --- Main Application Component ---
export default function App() {
  const [tokens, setTokens] = useState({ cerebras: "", github: "" });
  const [logs, dispatchLog] = useReducer(logReducer, []);

  // Memoized function to add logs to the display
  const addLog = useCallback((msg, type = "def") => {
    dispatchLog({ type: 'ADD_LOG', payload: { msg, type } });
  }, []);

  // Integrate the core evolution engine
  const { isLoading, displayCode, status, runEvolution, terminateEvolution, error } = useEvolutionEngine(
    tokens, addLog
  );

  // Initial warning for missing Gemini API key
  useEffect(() => {
    if (!GEMINI_API_KEY) {
      addLog("WARNING: GEMINI_API_KEY is not configured.", "le-err");
      addLog("Please insert your Google AI Studio key in the CONFIGURATION section to enable full AI capabilities.", "le-err");
    }
  }, [addLog]);

  // Warning for missing Cerebras key (optional for synthesis)
  useEffect(() => {
    if (!tokens.cerebras) {
      addLog("WARNING: Cerebras AI key is missing. The synthesis step will be skipped, impacting code generation.", "warn");
    }
  }, [addLog, tokens.cerebras]);

  // Display engine errors in the log
  useEffect(() => {
    if (error) {
      addLog(`ENGINE ERROR: ${error}`, "le-err");
    }
  }, [error, addLog]);

  // Helper to clear logs before starting evolution
  const startEvolutionProcess = useCallback(() => {
    dispatchLog({ type: 'CLEAR_LOGS' });
    runEvolution();
  }, [runEvolution]);

  return (
    <div className="dalek-shell">
      <style>{GLOBAL_STYLES}</style>
      <DalekHeader status={status} />

      <div className="main-container">
        <NexusControlPanel
          tokens={tokens}
          setTokens={setTokens}
          repoConfig={GITHUB_REPO_CONFIG}
          isLoading={isLoading}
          logs={logs}
          runEvolution={startEvolutionProcess}
          terminateEvolution={terminateEvolution}
        />
        <CoreDisplayPanel displayCode={displayCode} />
      </div>
    </div>
  );
}