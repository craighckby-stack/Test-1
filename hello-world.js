import React, { useState, useEffect, useRef, useCallback, useReducer, memo, useMemo } from "react";

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
      if (i === retries - 1) throw e;
      await wait(1000 * (i + 1));
    }
  }
};

const cleanMarkdownCodeBlock = (code) => {
  if (!code) return "";
  const cleaned = code.replace(/^```[a-z]*\n|```$/gi, "").trim();
  return cleaned;
};

const sanitizeContent = (content, maxLength) =>
  content ? content.replace(/[^\x20-\x7E\n]/g, "").substring(0, maxLength) : "";

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
  currentCoreCode: '',
  displayCode: '',
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

const createApiClient = (addLog, defaultHeaders = {}) => {
  return async (url, options, stepName = "API Request", logType = "def") => {
    try {
      addLog(`API: Initiating ${stepName}...`, logType);
      const response = await safeFetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });
      addLog(`API: ${stepName} completed.`, "ok");
      return response;
    } catch (e) {
      addLog(`API ${stepName.toUpperCase()} FAILED: ${e.message}.`, "le-err");
      throw e;
    }
  };
};

const useExternalClients = (tokens, githubConfig, addLog) => {
  const githubApiClient = useRef(null);
  const geminiApiClient = useRef(null);
  const cerebrasApiClient = useRef(null);

  useEffect(() => {
    if (tokens.github) {
      githubApiClient.current = createApiClient(addLog, {
        Authorization: `token ${tokens.github.trim()}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      });
    } else {
      githubApiClient.current = null;
    }
  }, [tokens.github, addLog]);

  useEffect(() => {
    // Gemini API Key is a global constant, no token state dependency needed here.
    geminiApiClient.current = createApiClient(addLog, { "Content-Type": "application/json" });
  }, [addLog]);

  useEffect(() => {
    if (tokens.cerebras) {
      cerebrasApiClient.current = createApiClient(addLog, {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tokens.cerebras.trim()}`
      });
    } else {
      cerebrasApiClient.current = null;
    }
  }, [tokens.cerebras, addLog]);

  const getFile = useCallback(async (filePath = githubConfig.file) => {
    if (!githubApiClient.current) throw new Error("GitHub client not initialized. Missing token?");
    const url = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${filePath}`;
    const response = await githubApiClient.current(url, { method: "GET" }, `GitHub Fetch ${filePath}`, "nexus");
    if (!response || !response.content) {
      throw new Error(`Failed to fetch file content for ${filePath}. Response: ${JSON.stringify(response)}`);
    }
    return response;
  }, [githubApiClient, githubConfig.owner, githubConfig.repo, githubConfig.file]); // addLog is already in createApiClient dependencies

  const updateFile = useCallback(async (filePath, content, sha, message) => {
    if (!githubApiClient.current) throw new Error("GitHub client not initialized. Missing token?");
    const url = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${filePath}`;
    const body = {
      message: message || `DALEK_EVOLUTION_${Date.now()}`,
      content: utf8B64Encode(content),
      sha,
      branch: githubConfig.branch
    };
    await githubApiClient.current(url, { method: "PUT", body: JSON.stringify(body) }, `GitHub Commit ${filePath}`, "nexus");
  }, [githubApiClient, githubConfig.owner, githubConfig.repo, githubConfig.branch]); // addLog is already in createApiClient dependencies

  const generateContent = useCallback(async (systemInstruction, parts, stepName = "content generation") => {
    if (!GEMINI_API_KEY) throw new Error("Gemini API key is missing. Cannot generate content.");
    if (!geminiApiClient.current) throw new Error("Gemini client not initialized.");
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
    const res = await geminiApiClient.current(geminiUrl, {
      method: "POST",
      body: JSON.stringify({
        contents: [{ parts }],
        systemInstruction: { parts: [{ text: systemInstruction }] }
      })
    }, `Gemini ${stepName}`, "quantum");
    const content = res.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!content) {
      throw new Error(`Gemini returned empty content or no valid candidate found for ${stepName}.`);
    }
    return content;
  }, [geminiApiClient]); // addLog is already in createApiClient dependencies

  const completeChat = useCallback(async (systemContent, userContent, stepName = "chat completion") => {
    if (!tokens.cerebras) throw new Error("Cerebras API key is missing. Cannot complete chat.");
    if (!cerebrasApiClient.current) throw new Error("Cerebras client not initialized. Missing token?");
    const data = await cerebrasApiClient.current("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      body: JSON.stringify({
        model: "llama3.1-70b", // Model specific to Cerebras, ensure it's correct.
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: userContent }
        ]
      })
    }, `Cerebras ${stepName}`, "quantum");
    const content = data.choices?.[0]?.message?.content || "";
    if (!content) {
      throw new Error(`Cerebras returned empty content or no valid choice found for ${stepName}.`);
    }
    return content;
  }, [cerebrasApiClient, tokens.cerebras]); // addLog is already in createApiClient dependencies

  return {
    github: { getFile, updateFile },
    gemini: { generateContent },
    cerebras: { completeChat }
  };
};

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

      const { success, commitPerformed } = await savedCallback.current();

      // Check isActive again after async operation, as it might have changed during await
      if (!isActive) {
        addLog("NEXUS CYCLE TERMINATED.", "nexus");
        return;
      }

      let delay = EVOLUTION_CYCLE_INTERVAL_MS;
      if (success) {
        const message = commitPerformed
          ? `NEXUS CYCLE COMPLETE. Waiting for next evolution in ${delay / 1000}s.`
          : `NEXUS CYCLE COMPLETE (no commit needed). Waiting for next evolution in ${delay / 1000}s.`;
        addLog(message, "nexus");
      } else {
        delay = EVOLUTION_CYCLE_INTERVAL_MS / 2; // Reduce delay on failure to reattempt faster
        addLog(`NEXUS CYCLE FAILED. Retrying in ${delay / 1000}s.`, "le-err");
      }
      
      if (isActive) {
        timeoutRef.current = setTimeout(tick, delay);
      }
    };

    if (isActive) {
      addLog("NEXUS CYCLE INITIATED. Preparing for first evolution.", "nexus");
      tick(); // Start immediately when isActive becomes true
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        addLog("NEXUS CYCLE PAUSED.", "nexus");
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isActive, addLog, interval]);
};

const useEvolutionPipeline = (steps, addLog, dispatch, isTerminatedRef) => {
  const runPipeline = useCallback(async () => {
    let success = false;
    let commitPerformed = false;
    const pipelineContext = {
      fileRef: null, // Stores GitHub file metadata (e.g., SHA)
      fetchedCode: '',
      quantumPatterns: null,
      draftCode: null,
      evolvedCode: null,
      commitPerformed: false,
    };

    try {
      dispatch({ type: 'SET_STATUS', payload: 'EVOLUTION_CYCLE_INITIATED' });
      addLog("AI: PROCESSING EVOLUTION...", "nexus");

      for (const step of steps) {
        if (isTerminatedRef.current) {
          throw new Error("Evolution terminated by user.");
        }
        dispatch({ type: 'SET_STATUS', payload: step.name });
        addLog(`NEXUS: ${step.name.replace(/_/g, ' ')} initiated.`, "nexus");

        try {
          await step.action(pipelineContext);
          if (isTerminatedRef.current) { // Check again after each step
            throw new Error("Evolution terminated by user.");
          }
          if (step.name === 'FINALIZING_CODE' && pipelineContext.evolvedCode) {
            dispatch({ type: 'SET_DISPLAY_CODE', payload: pipelineContext.evolvedCode });
          }
          addLog(`NEXUS: ${step.name.replace(/_/g, ' ')} completed.`, "ok");
        } catch (stepError) {
          addLog(`NEXUS: ${step.name.replace(/_/g, ' ')} FAILED: ${stepError.message}`, "le-err");
          if (!step.allowFailure) {
            throw stepError; // Critical step failure, stop the pipeline
          }
        }
      }
      success = true;
      commitPerformed = pipelineContext.commitPerformed;

    } catch (e) {
      if (e.message === "Evolution terminated by user.") {
        addLog("EVOLUTION: Termination signal received. Aborting current cycle.", "nexus");
        success = true; // Consider user termination a "successful" exit from the cycle
      } else {
        dispatch({ type: 'SET_ERROR', payload: e.message });
        addLog(`CRITICAL NEXUS FAILURE: ${e.message}`, "le-err");
        // Ensure display code reflects failure state
        dispatch({ type: 'SET_DISPLAY_CODE', payload: pipelineContext.fetchedCode || "// ERROR: Failed to retrieve core logic or evolution failed. Check logs." });
        success = false;
      }
    } finally {
      if (isTerminatedRef.current) {
        dispatch({ type: 'STOP_EVOLUTION' }); // Fully stop if termination signal was set
      } else {
        dispatch({ type: 'SET_STATUS', payload: success ? 'IDLE' : 'ERROR' });
      }
    }
    return { success, commitPerformed };
  }, [steps, addLog, dispatch, isTerminatedRef]);

  return runPipeline;
};

const useEvolutionEngine = (tokens, addLog) => {
  const [engineState, dispatch] = useReducer(evolutionReducer, initialEvolutionState);
  const { status, isEvolutionActive, displayCode, error } = engineState;

  const isEvolutionTerminatedRef = useRef(false);

  const { github, gemini, cerebras } = useExternalClients(tokens, GITHUB_REPO_CONFIG, addLog);

  const validateEvolutionEnvironment = useCallback(() => {
    if (!tokens.github) { throw new Error("Missing GitHub token. Evolution halted."); }
    if (!GEMINI_API_KEY) { throw new Error("Missing GEMINI_API_KEY. Evolution halted."); }
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

  const evolutionPipelineSteps = useMemo(() => ([
    {
      name: 'FETCHING_CORE',
      action: async (ctx) => {
        const result = await github.getFile(GITHUB_REPO_CONFIG.file);
        ctx.fetchedCode = utf8B64Decode(result.content);
        ctx.fileRef = result; // Store entire result to get SHA for updates
        dispatch({ type: 'SET_CURRENT_CORE_CODE', payload: ctx.fetchedCode });
        dispatch({ type: 'SET_DISPLAY_CODE', payload: ctx.fetchedCode });
      }
    },
    {
      name: 'EXTRACTING_PATTERNS',
      allowFailure: true, // Allow pipeline to continue if patterns extraction fails
      action: async (ctx) => {
        const cleanCode = sanitizeContent(ctx.fetchedCode, CORE_CONTENT_MAX_LENGTH);
        ctx.quantumPatterns = await gemini.generateContent(
          GEMINI_PATTERN_INSTRUCTION,
          [{ text: `CORE: ${cleanCode}` }],
          "pattern extraction"
        );
        if (!ctx.quantumPatterns || ctx.quantumPatterns.trim().length < 10) { // Check for meaningful patterns
            addLog("AI: No meaningful quantum patterns extracted by Gemini. Synthesis might be less effective.", "warn");
            ctx.quantumPatterns = null; // Ensure it's explicitly null if not useful
        } else {
            addLog("AI: Quantum patterns extracted.", "quantum");
        }
      }
    },
    {
      name: 'SYNTHESIZING_DRAFT',
      allowFailure: true, // Allow pipeline to continue if Cerebras is unavailable or fails
      action: async (ctx) => {
        if (!tokens.cerebras || !cerebras.completeChat) {
          addLog("AI: Cerebras client not available or key missing. Skipping synthesis.", "warn");
          ctx.draftCode = null; // Explicitly nullify draft code
          return;
        }
        const sanitizedFetchedCode = sanitizeContent(ctx.fetchedCode, CORE_CONTENT_MAX_LENGTH);
        const userContent = ctx.quantumPatterns 
          ? `IMPROVEMENTS: ${ctx.quantumPatterns}\nCORE: ${sanitizedFetchedCode}`
          : `CORE: ${sanitizedFetchedCode}`;
        
        ctx.draftCode = await cerebras.completeChat(
          CEREBRAS_SYNTHESIS_INSTRUCTION,
          userContent,
          "code synthesis"
        );
        ctx.draftCode = cleanMarkdownCodeBlock(ctx.draftCode);
        if (!ctx.draftCode || ctx.draftCode.trim().length < MIN_EVOLVED_CODE_LENGTH / 2) { // Minimum length for a meaningful draft
          addLog("AI: Synthesized draft was too short or empty after cleanup. Will proceed with original code for finalization.", "warn");
          ctx.draftCode = null; 
        } else {
          addLog("AI: Draft code synthesized.", "quantum");
        }
      }
    },
    {
      name: 'FINALIZING_CODE',
      action: async (ctx) => {
        const codeForFinalization = ctx.draftCode || ctx.fetchedCode;
        if (!codeForFinalization) {
            throw new Error("No code available for finalization. This indicates a critical upstream failure.");
        }
        addLog(`AI: Proceeding with ${ctx.draftCode ? 'Cerebras draft' : 'original core'} for finalization.`, "def");
        
        const rawFinalCode = await gemini.generateContent(
          GEMINI_FINALIZATION_INSTRUCTION,
          [
            { text: `DRAFT_CODE: ${sanitizeContent(codeForFinalization, CORE_CONTENT_MAX_LENGTH)}` },
            { text: `EXISTING_CORE_REFERENCE: ${sanitizeContent(ctx.fetchedCode, CORE_CONTENT_MAX_LENGTH)}` } // Provide reference for context
          ],
          "core finalization"
        );
        ctx.evolvedCode = cleanMarkdownCodeBlock(rawFinalCode);
        if (!ctx.evolvedCode || ctx.evolvedCode.trim().length === 0) {
          throw new Error("Finalized code was empty after cleanup, indicating a critical AI failure.");
        }
        addLog("AI: Finalized code generated.", "quantum");
      }
    },
    {
      name: 'COMMITTING_CODE',
      action: async (ctx) => {
        if (ctx.evolvedCode && isCodeSafeToCommit(ctx.evolvedCode, ctx.fetchedCode)) {
          await github.updateFile(
            GITHUB_REPO_CONFIG.file, ctx.evolvedCode, ctx.fileRef.sha, `DALEK_EVOLUTION_${Date.now()}`
          );
          addLog("NEXUS EVOLVED SUCCESSFULLY AND COMMITTED", "ok");
          dispatch({ type: 'SET_DISPLAY_CODE', payload: ctx.evolvedCode });
          ctx.commitPerformed = true;
        } else {
          addLog("AI: Evolved code deemed unsafe or unchanged. No commit.", "warn");
          dispatch({ type: 'SET_DISPLAY_CODE', payload: ctx.fetchedCode }); // Revert display to original if not committing
          ctx.commitPerformed = false;
        }
      }
    }
  ]), [
    github, gemini, cerebras, // Clients depend on tokens/addLog already, but pipeline needs the instances
    addLog, dispatch, isCodeSafeToCommit, tokens.cerebras // Explicit token for conditional logic in synthesis
  ]);

  const performSingleEvolutionStep = useEvolutionPipeline(
    evolutionPipelineSteps, addLog, dispatch, isEvolutionTerminatedRef
  );

  useEvolutionLoop(performSingleEvolutionStep, EVOLUTION_CYCLE_INTERVAL_MS, isEvolutionActive, addLog);

  const runEvolution = useCallback(() => {
    try {
      validateEvolutionEnvironment();
      isEvolutionTerminatedRef.current = false; // Reset termination flag for a new run
      dispatch({ type: 'START_EVOLUTION' });
    } catch (e) {
      addLog(`INITIATION ERROR: ${e.message}`, "le-err");
      dispatch({ type: 'SET_ERROR', payload: e.message });
    }
  }, [validateEvolutionEnvironment, addLog, dispatch]);

  const terminateEvolution = useCallback(() => {
    if (isEvolutionActive) {
      isEvolutionTerminatedRef.current = true;
      addLog("TERMINATION PROTOCOL INITIATED...", "nexus");
      // The useEvolutionLoop and useEvolutionPipeline will pick up the ref change
    } else {
      addLog("NEXUS CYCLE NOT ACTIVE. No termination needed.", "def");
    }
  }, [isEvolutionActive, addLog]);

  return {
    status,
    isLoading: isEvolutionActive, // More descriptive name for UI
    displayCode,
    runEvolution,
    terminateEvolution,
    error
  };
};

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

export default function App() {
  const [tokens, setTokens] = useState({ cerebras: "", github: "" });
  const [logs, dispatchLog] = useReducer(logReducer, []);

  const addLog = useCallback((msg, type = "def") => {
    dispatchLog({ type: 'ADD_LOG', payload: { msg, type } });
  }, []);

  const { isLoading, displayCode, status, runEvolution, terminateEvolution, error } = useEvolutionEngine(
    tokens, addLog
  );

  useEffect(() => {
    if (!GEMINI_API_KEY) {
      addLog("WARNING: GEMINI_API_KEY is not configured.", "le-err");
      addLog("Please insert your Google AI Studio key in the CONFIGURATION section to enable full AI capabilities.", "le-err");
    } else {
      addLog("GEMINI_API_KEY detected. Gemini services enabled.", "ok");
    }
  }, [addLog]);

  useEffect(() => {
    if (!tokens.cerebras) {
      addLog("WARNING: Cerebras AI key is missing. The synthesis step will be skipped, impacting code generation.", "warn");
    } else {
      addLog("Cerebras AI key detected. Cerebras synthesis enabled.", "ok");
    }
  }, [addLog, tokens.cerebras]);

  useEffect(() => {
    if (!tokens.github) {
      addLog("WARNING: GitHub token is missing. Core evolution and commits will be disabled.", "le-err");
    } else {
      addLog("GitHub token detected. Repository access enabled.", "ok");
    }
  }, [addLog, tokens.github]);

  useEffect(() => {
    if (error) {
      addLog(`ENGINE ERROR: ${error}`, "le-err");
    }
  }, [error, addLog]);

  const startEvolutionProcess = useCallback(() => {
    dispatchLog({ type: 'CLEAR_LOGS' }); // Clear logs on new initiation
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