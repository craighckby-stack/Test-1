import React, { useState, useEffect, useRef, useCallback, useReducer, memo, useMemo } from "react";

const API_KEYS = {
  GEMINI: "",
};

const APP_CONFIG = {
  GITHUB_REPO: {
    owner: "craighckby-stack",
    repo: "Test-1",
    branch: "Nexus-Database",
    file: "hello-world.js"
  },
  EVOLUTION_CYCLE_INTERVAL_MS: 30000,
  CORE_CONTENT_MAX_LENGTH: 3000,
  LOG_HISTORY_LIMIT: 40,
  MIN_EVOLVED_CODE_LENGTH: 500,
  MIN_SYNTHESIZED_DRAFT_LENGTH: 250,
};

const PROMPT_INSTRUCTIONS = {
  GEMINI_PATTERN: "Extract 5 architectural logic improvements from source to apply to core. Return bullet points ONLY.",
  CEREBRAS_SYNTHESIS: "Expert Dalek Caan Architect. Merge logic improvements. PURE CODE ONLY. Ensure all original React structure, API keys, and configurations are preserved and correctly integrated, especially if they are at the top-level of the module. Do NOT wrap the entire code in a function. Output ONLY the raw JavaScript file content.",
  GEMINI_FINALIZATION: "ACT AS: Dalek Caan Architect. Finalize the evolved source code. NO MARKDOWN. NO BACKTICKS. Preserve all API keys, styles, and the React structure. Output ONLY pure JavaScript. Do NOT wrap the entire code in a function. Output ONLY the raw JavaScript file content.",
};

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

const safeFetch = async (url, options, retries = 3, signal = null) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { ...options, signal });
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status} for ${url}`;
        try {
          const errorBody = await response.json();
          errorMessage = errorBody.message || JSON.stringify(errorBody);
        } catch (jsonParseError) {
        }
        throw new Error(errorMessage);
      }
      return await response.json();
    } catch (e) {
      if (e.name === 'AbortError') {
        throw e;
      }
      if (i === retries - 1) {
        throw e;
      }
      await wait(1000 * (i + 1));
    }
  }
  throw new Error("safeFetch exhausted all retries.");
};

const cleanMarkdownCodeBlock = (code) => {
  if (!code) return "";
  const cleaned = code.replace(/^```[a-z]*\n|```$/gi, "").trim();
  return cleaned;
};

const sanitizeContent = (content, maxLength) =>
  content ? content.replace(/[^\x20-\x7E\n]/g, "").substring(0, maxLength) : "";

const LogActionTypes = {
  ADD_LOG: 'ADD_LOG',
  CLEAR_LOGS: 'CLEAR_LOGS',
};

const EvolutionActionTypes = {
  START_EVOLUTION: 'START_EVOLUTION',
  STOP_EVOLUTION: 'STOP_EVOLUTION',
  SET_STATUS: 'SET_STATUS',
  SET_CURRENT_CORE_CODE: 'SET_CURRENT_CORE_CODE',
  SET_EVOLVED_CODE: 'SET_EVOLVED_CODE',
  SET_ERROR: 'SET_ERROR',
  RESET_STATE: 'RESET_STATE',
  RESTART_EVOLUTION: 'RESTART_EVOLUTION',
};

const EvolutionStatus = {
  IDLE: 'IDLE',
  PAUSED: 'PAUSED',
  ERROR: 'ERROR',
  EVOLUTION_CYCLE_INITIATED: 'EVOLUTION_CYCLE_INITIATED',
  FETCHING_CORE: 'FETCHING_CORE',
  EXTRACTING_PATTERNS: 'EXTRACTING_PATTERNS',
  SYNTHESIZING_DRAFT: 'SYNTHESIZING_DRAFT',
  FINALIZING_CODE: 'FINALIZING_CODE',
  COMMITTING_CODE: 'COMMITTING_CODE',
};

const logReducer = (state, action) => {
  switch (action.type) {
    case LogActionTypes.ADD_LOG:
      return [{ text: `[${new Date().toLocaleTimeString()}] ${action.payload.msg}`, type: action.payload.type || 'def' }, ...state].slice(0, APP_CONFIG.LOG_HISTORY_LIMIT);
    case LogActionTypes.CLEAR_LOGS:
      return [];
    default:
      return state;
  }
};

const initialEvolutionState = {
  status: EvolutionStatus.IDLE,
  isEvolutionActive: false,
  currentCoreCode: '',
  evolvedCode: '',
  error: null,
};

const evolutionReducer = (state, action) => {
  switch (action.type) {
    case EvolutionActionTypes.START_EVOLUTION:
      return { ...state, isEvolutionActive: true, status: EvolutionStatus.EVOLUTION_CYCLE_INITIATED, error: null };
    case EvolutionActionTypes.STOP_EVOLUTION:
      return { ...state, isEvolutionActive: false, status: EvolutionStatus.PAUSED };
    case EvolutionActionTypes.SET_STATUS:
      return { ...state, status: action.payload };
    case EvolutionActionTypes.SET_CURRENT_CORE_CODE:
      return { ...state, currentCoreCode: action.payload };
    case EvolutionActionTypes.SET_EVOLVED_CODE:
      return { ...state, evolvedCode: action.payload };
    case EvolutionActionTypes.SET_ERROR:
      return { ...state, error: action.payload, status: EvolutionStatus.ERROR, isEvolutionActive: false, evolvedCode: '' };
    case EvolutionActionTypes.RESET_STATE:
      return { ...initialEvolutionState };
    case EvolutionActionTypes.RESTART_EVOLUTION:
      return { ...initialEvolutionState, isEvolutionActive: true, status: EvolutionStatus.EVOLUTION_CYCLE_INITIATED, error: null };
    default:
      return state;
  }
};

const createApiClient = (baseURL, logger, defaultHeaders = {}) => {
  const request = async (method, endpoint, options, stepName = "API Request", logType = "def", signal = null) => {
    const url = `${baseURL}${endpoint}`;
    const allHeaders = { ...defaultHeaders, ...options.headers };

    try {
      logger(`API: Initiating ${stepName}...`, logType);
      const response = await safeFetch(url, { method, headers: allHeaders, ...options }, 3, signal);
      logger(`API: ${stepName} completed.`, "ok");
      return response;
    } catch (e) {
      if (e.name === 'AbortError') {
        logger(`API ${stepName.toUpperCase()} ABORTED.`, "warn");
        throw e;
      }
      logger(`API ${stepName.toUpperCase()} FAILED: ${e.message}.`, "le-err");
      throw e;
    }
  };

  return {
    get: (endpoint, options = {}, stepName, logType, signal) => request("GET", endpoint, options, stepName, logType, signal),
    post: (endpoint, options = {}, stepName, logType, signal) => request("POST", endpoint, options, stepName, logType, signal),
    put: (endpoint, options = {}, stepName, logType, signal) => request("PUT", endpoint, options, stepName, logType, signal),
  };
};

const useExternalClients = (tokens, addLog, geminiApiKey) => {
  const githubService = useMemo(() => {
    if (!tokens.github) return null;
    const githubClient = createApiClient(
      "https://api.github.com",
      addLog,
      {
        Authorization: `token ${tokens.github.trim()}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      }
    );

    return {
      getFile: async (filePath = APP_CONFIG.GITHUB_REPO.file, signal = null) => {
        const urlPath = `/repos/${APP_CONFIG.GITHUB_REPO.owner}/${APP_CONFIG.GITHUB_REPO.repo}/contents/${filePath}?ref=${APP_CONFIG.GITHUB_REPO.branch}`;
        const response = await githubClient.get(urlPath, {}, `GitHub Fetch ${filePath}`, "nexus", signal);
        if (!response || !response.content) {
          throw new Error(`Failed to fetch file content for ${filePath}. Response: ${JSON.stringify(response)}`);
        }
        return response;
      },
      updateFile: async (filePath, content, sha, message, signal = null) => {
        const urlPath = `/repos/${APP_CONFIG.GITHUB_REPO.owner}/${APP_CONFIG.GITHUB_REPO.repo}/contents/${filePath}`;
        const body = {
          message: message || `DALEK_EVOLUTION_${new Date().toISOString()}`,
          content: utf8B64Encode(content),
          sha,
          branch: APP_CONFIG.GITHUB_REPO.branch
        };
        await githubClient.put(urlPath, { body: JSON.stringify(body) }, `GitHub Commit ${filePath}`, "nexus", signal);
      }
    };
  }, [tokens.github, addLog]);

  const geminiService = useMemo(() => {
    if (!geminiApiKey) return null;
    const geminiClient = createApiClient(
      "https://generativelanguage.googleapis.com",
      addLog,
      { "Content-Type": "application/json" }
    );

    return {
      generateContent: async (systemInstruction, parts, stepName = "content generation", signal = null) => {
        const endpoint = `/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`;
        const res = await geminiClient.post(endpoint, {
          body: JSON.stringify({
            contents: [{ parts }],
            systemInstruction: { parts: [{ text: systemInstruction }] }
          })
        }, `Gemini ${stepName}`, "quantum", signal);
        const content = res.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (!content) {
          throw new Error(`Gemini returned empty content or no valid candidate found for ${stepName}.`);
        }
        return content;
      }
    };
  }, [geminiApiKey, addLog]);

  const cerebrasService = useMemo(() => {
    if (!tokens.cerebras) return null;
    const cerebrasClient = createApiClient(
      "https://api.cerebras.ai",
      addLog,
      {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tokens.cerebras.trim()}`
      }
    );

    return {
      completeChat: async (systemContent, userContent, stepName = "chat completion", signal = null) => {
        const data = await cerebrasClient.post("/v1/chat/completions", {
          body: JSON.stringify({
            model: "llama3.1-70b",
            messages: [
              { role: "system", content: systemContent },
              { role: "user", content: userContent }
            ]
          })
        }, `Cerebras ${stepName}`, "quantum", signal);
        const content = data.choices?.[0]?.message?.content || "";
        if (!content) {
          throw new Error(`Cerebras returned empty content or no valid choice found for ${stepName}.`);
        }
        return content;
      }
    };
  }, [tokens.cerebras, addLog]);

  return { github: githubService, gemini: geminiService, cerebras: cerebrasService };
};

const usePipelineExecutor = (steps, dispatchEvolution, addLog) => {
  const abortControllerRef = useRef(null);

  const runPipeline = useCallback(async (initialContext = {}) => {
    let success = false;
    let commitPerformed = false;

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const pipelineContext = { ...initialContext, commitPerformed: false };

    try {
      dispatchEvolution({ type: EvolutionActionTypes.SET_STATUS, payload: EvolutionStatus.EVOLUTION_CYCLE_INITIATED });
      addLog("AI: PROCESSING EVOLUTION...", "nexus");

      for (const stepDef of steps) {
        if (signal.aborted) {
          addLog("EVOLUTION: Abort signal received. Terminating pipeline.", "warn");
          throw Object.assign(new Error("Pipeline aborted."), { name: "AbortError" });
        }

        dispatchEvolution({ type: EvolutionActionTypes.SET_STATUS, payload: stepDef.name });
        addLog(`NEXUS: ${stepDef.name.replace(/_/g, ' ')} initiated.`, "nexus");

        try {
          await stepDef.action(pipelineContext, signal);
          addLog(`NEXUS: ${stepDef.name.replace(/_/g, ' ')} completed.`, "ok");
        } catch (stepError) {
          if (stepError.name === 'AbortError') {
             addLog(`NEXUS: ${stepDef.name.replace(/_/g, ' ')} ABORTED.`, "warn");
             throw stepError;
          }
          addLog(`NEXUS: ${stepDef.name.replace(/_/g, ' ')} FAILED: ${stepError.message}`, "le-err");
          if (!stepDef.allowFailure) {
            throw stepError;
          }
        }
      }
      success = true;
      commitPerformed = pipelineContext.commitPerformed;
    } catch (e) {
      if (e.name === 'AbortError') {
        success = true;
        addLog("NEXUS CYCLE INTERRUPTED BY USER.", "warn");
      } else {
        dispatchEvolution({ type: EvolutionActionTypes.SET_ERROR, payload: e });
        addLog(`CRITICAL NEXUS PIPELINE FAILURE: ${e.message}`, "le-err");
        success = false;
      }
    } finally {
      abortControllerRef.current = null;
    }
    return { success, commitPerformed };
  }, [steps, dispatchEvolution, addLog]);

  const abortPipeline = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      addLog("PIPELINE: Explicit abort requested.", "nexus");
    }
  }, [addLog]);

  return { runPipeline, abortPipeline };
};

const useEvolutionLoop = (performEvolutionCallback, isActive, addLog) => {
  const timeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const runCycle = async () => {
      if (!isMountedRef.current || !isActive) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        addLog("NEXUS: Loop terminated due to unmount or deactivation.", "warn");
        return;
      }

      const { success, commitPerformed } = await performEvolutionCallback();

      if (!isMountedRef.current || !isActive) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        addLog("NEXUS: Loop terminated after cycle completion due to unmount or deactivation.", "warn");
        return;
      }

      const delay = success ? APP_CONFIG.EVOLUTION_CYCLE_INTERVAL_MS : APP_CONFIG.EVOLUTION_CYCLE_INTERVAL_MS / 2;
      const message = success
        ? (commitPerformed ? `NEXUS CYCLE COMPLETE. Waiting for next evolution in ${delay / 1000}s.` : `NEXUS CYCLE COMPLETE (no commit needed). Waiting for next evolution in ${delay / 1000}s.`)
        : `NEXUS CYCLE FAILED. Retrying in ${delay / 1000}s.`;
      addLog(message, success ? "nexus" : "le-err");

      timeoutRef.current = setTimeout(runCycle, delay);
    };

    if (isActive) {
      addLog("NEXUS CYCLE INITIATED. Preparing for first evolution.", "nexus");
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(runCycle, 0);
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
  }, [isActive, performEvolutionCallback, addLog]);
};

const useEvolutionEngine = (tokens, addLog) => {
  const [engineState, dispatch] = useReducer(evolutionReducer, initialEvolutionState);
  const { status, isEvolutionActive, currentCoreCode, evolvedCode, error } = engineState;

  const { github, gemini, cerebras } = useExternalClients(tokens, addLog, API_KEYS.GEMINI);

  const displayCode = useMemo(() => {
    if (error) {
      return currentCoreCode || `// ERROR: ${error.message || String(error)}. Failed to retrieve core logic or evolution failed. Check logs.`;
    }
    return evolvedCode || currentCoreCode || "// Awaiting sequence initialization...";
  }, [error, evolvedCode, currentCoreCode]);

  const isCodeSafeToCommit = useCallback((evolvedCode, originalCode) => {
    if (!evolvedCode || evolvedCode.length < APP_CONFIG.MIN_EVOLVED_CODE_LENGTH) {
      addLog(`EVOLUTION SAFETY TRIGGER: Evolved code too short (${evolvedCode ? evolvedCode.length : 0} chars). Retaining current core.`, "le-err");
      return false;
    }
    if (evolvedCode.trim() === originalCode.trim()) {
      addLog("AI: Core logic unchanged after evolution. No commit necessary.", "def");
      return false;
    }
    return true;
  }, [addLog]);

  const fetchCoreAction = useCallback(async (ctx, signal) => {
    if (!github) throw new Error("GitHub client not initialized. Missing token?");
    const result = await github.getFile(APP_CONFIG.GITHUB_REPO.file, signal);
    ctx.fetchedCode = utf8B64Decode(result.content);
    ctx.fileRef = result;
    dispatch({ type: EvolutionActionTypes.SET_CURRENT_CORE_CODE, payload: ctx.fetchedCode });
  }, [github, dispatch]);

  const extractingPatternsAction = useCallback(async (ctx, signal) => {
    if (!gemini) {
      addLog("AI: Gemini client not initialized (API key missing). Skipping pattern extraction.", "warn");
      ctx.quantumPatterns = null;
      return;
    }
    if (!ctx.fetchedCode) {
      addLog("AI: No core code fetched for pattern extraction. Skipping.", "warn");
      ctx.quantumPatterns = null;
      return;
    }
    const cleanCode = sanitizeContent(ctx.fetchedCode, APP_CONFIG.CORE_CONTENT_MAX_LENGTH);
    const patterns = await gemini.generateContent(
      PROMPT_INSTRUCTIONS.GEMINI_PATTERN,
      [{ text: `CORE: ${cleanCode}` }],
      "pattern extraction",
      signal
    );
    if (!patterns || patterns.trim().length < 10) {
        addLog("AI: No meaningful quantum patterns extracted by Gemini. Synthesis might be less effective.", "warn");
        ctx.quantumPatterns = null;
    } else {
        ctx.quantumPatterns = patterns;
        addLog("AI: Quantum patterns extracted.", "quantum");
    }
  }, [gemini, addLog]);

  const synthesizingDraftAction = useCallback(async (ctx, signal) => {
    if (!cerebras) {
      addLog("AI: Cerebras client not initialized (API key missing). Skipping synthesis.", "warn");
      ctx.draftCode = null;
      return;
    }
    if (!ctx.fetchedCode) {
      addLog("AI: No core code available for draft synthesis. Skipping.", "warn");
      ctx.draftCode = null;
      return;
    }

    const sanitizedFetchedCode = sanitizeContent(ctx.fetchedCode, APP_CONFIG.CORE_CONTENT_MAX_LENGTH);
    const userContent = ctx.quantumPatterns
      ? `IMPROVEMENTS: ${ctx.quantumPatterns}\nCORE: ${sanitizedFetchedCode}`
      : `CORE: ${sanitizedFetchedCode}`;

    const rawDraft = await cerebras.completeChat(
      PROMPT_INSTRUCTIONS.CEREBRAS_SYNTHESIS,
      userContent,
      "code synthesis",
      signal
    );
    const cleanedDraft = cleanMarkdownCodeBlock(rawDraft);

    if (!cleanedDraft || cleanedDraft.trim().length < APP_CONFIG.MIN_SYNTHESIZED_DRAFT_LENGTH) {
      addLog(`AI: Synthesized draft was too short (${cleanedDraft ? cleanedDraft.length : 0} chars) or empty after cleanup. Will proceed with original code for finalization.`, "warn");
      ctx.draftCode = null;
    } else {
      ctx.draftCode = cleanedDraft;
      addLog("AI: Draft code synthesized.", "quantum");
    }
  }, [cerebras, addLog]);

  const finalizingCodeAction = useCallback(async (ctx, signal) => {
    if (!gemini) {
      throw new Error("AI: Gemini client not initialized (API key missing). Cannot finalize code.");
    }

    const codeForFinalization = ctx.draftCode || ctx.fetchedCode;
    if (!codeForFinalization) {
        throw new Error("No code available for finalization. This indicates a critical upstream failure.");
    }
    addLog(`AI: Proceeding with ${ctx.draftCode ? 'Cerebras draft' : 'original core'} for finalization.`, "def");

    const rawFinalCode = await gemini.generateContent(
      PROMPT_INSTRUCTIONS.GEMINI_FINALIZATION,
      [
        { text: `DRAFT_CODE: ${sanitizeContent(codeForFinalization, APP_CONFIG.CORE_CONTENT_MAX_LENGTH)}` },
        { text: `EXISTING_CORE_REFERENCE: ${sanitizeContent(ctx.fetchedCode, APP_CONFIG.CORE_CONTENT_MAX_LENGTH)}` }
      ],
      "core finalization",
      signal
    );
    const cleanedFinalCode = cleanMarkdownCodeBlock(rawFinalCode);

    if (!cleanedFinalCode || cleanedFinalCode.trim().length === 0) {
      throw new Error("Finalized code was empty after cleanup, indicating a critical AI failure.");
    }
    ctx.evolvedCode = cleanedFinalCode;
    dispatch({ type: EvolutionActionTypes.SET_EVOLVED_CODE, payload: ctx.evolvedCode });
    addLog("AI: Finalized code generated.", "quantum");
  }, [gemini, addLog, dispatch]);

  const committingCodeAction = useCallback(async (ctx, signal) => {
    if (!github) throw new Error("GitHub client not initialized. Missing token?");
    if (ctx.evolvedCode && isCodeSafeToCommit(ctx.evolvedCode, ctx.fetchedCode)) {
      if (!ctx.fileRef || !ctx.fileRef.sha) {
        throw new Error("Missing file reference (SHA) for committing code.");
      }
      await github.updateFile(
        APP_CONFIG.GITHUB_REPO.file, ctx.evolvedCode, ctx.fileRef.sha, `DALEK_EVOLUTION_${new Date().toISOString()}`, signal
      );
      addLog("NEXUS EVOLVED SUCCESSFULLY AND COMMITTED", "ok");
      ctx.commitPerformed = true;
    } else {
      addLog("AI: Evolved code deemed unsafe or unchanged. No commit.", "warn");
      dispatch({ type: EvolutionActionTypes.SET_EVOLVED_CODE, payload: '' });
      ctx.commitPerformed = false;
    }
  }, [github, addLog, dispatch, isCodeSafeToCommit]);

  const EVOLUTION_PIPELINE_STEPS = useMemo(() => [
    { name: EvolutionStatus.FETCHING_CORE, allowFailure: false, action: fetchCoreAction },
    { name: EvolutionStatus.EXTRACTING_PATTERNS, allowFailure: true, action: extractingPatternsAction },
    { name: EvolutionStatus.SYNTHESIZING_DRAFT, allowFailure: true, action: synthesizingDraftAction },
    { name: EvolutionStatus.FINALIZING_CODE, allowFailure: false, action: finalizingCodeAction },
    { name: EvolutionStatus.COMMITTING_CODE, allowFailure: false, action: committingCodeAction }
  ], [
    fetchCoreAction,
    extractingPatternsAction,
    synthesizingDraftAction,
    finalizingCodeAction,
    committingCodeAction
  ]);

  const { runPipeline, abortPipeline } = usePipelineExecutor(EVOLUTION_PIPELINE_STEPS, dispatch, addLog);

  const performEvolutionCycle = useCallback(async () => {
    const initialContext = {
      fileRef: null,
      fetchedCode: '',
      quantumPatterns: null,
      draftCode: null,
      evolvedCode: null,
    };
    const { success, commitPerformed } = await runPipeline(initialContext);

    if (success) { 
      dispatch({ type: EvolutionActionTypes.SET_STATUS, payload: EvolutionStatus.IDLE });
    }
    return { success, commitPerformed };
  }, [runPipeline, dispatch]);

  useEvolutionLoop(performEvolutionCycle, isEvolutionActive, addLog);

  const runEvolution = useCallback(() => {
    try {
      if (!tokens.github) {
        throw new Error("Missing GitHub token. Evolution halted.");
      }
      dispatch({ type: EvolutionActionTypes.RESTART_EVOLUTION });
    } catch (e) {
      addLog(`INITIATION ERROR: ${e.message}`, "le-err");
      dispatch({ type: EvolutionActionTypes.SET_ERROR, payload: e });
    }
  }, [tokens.github, addLog, dispatch]);

  const terminateEvolution = useCallback(() => {
    if (isEvolutionActive) {
      abortPipeline();
      addLog("TERMINATION PROTOCOL INITIATED...", "nexus");
      dispatch({ type: EvolutionActionTypes.STOP_EVOLUTION });
    } else {
      addLog("NEXUS CYCLE NOT ACTIVE. No termination needed.", "def");
    }
  }, [isEvolutionActive, addLog, dispatch, abortPipeline]);

  return {
    status,
    isEvolutionActive,
    displayCode,
    runEvolution,
    terminateEvolution,
    error
  };
};

const DalekHeader = memo(({ status }) => (
  <div className="header">
    <div className="title">DALEK CAAN :: BOOTSTRAPPER</div>
    <div style={{ fontSize: '0.7rem' }}>{status === EvolutionStatus.IDLE || status === EvolutionStatus.PAUSED ? "CORE_STABLE" : `STATUS: ${status.replace(/_/g, ' ')}...`}</div>
  </div>
));

const NexusControlPanel = memo(({
  tokens, setTokens, repoConfig,
  isEvolutionActive, logs, runEvolution, terminateEvolution
}) => {
  const handleTokenChange = useCallback((key, value) => {
    setTokens(prev => {
      const newTokens = { ...prev, [key]: value };
      localStorage.setItem(`dalek_token_${key}`, value);
      return newTokens;
    });
  }, [setTokens]);

  return (
    <div className="panel">
      <div className="panel-hdr">Nexus Configuration</div>
      <div className="panel-body">
        <input
          className="input-field"
          placeholder="GitHub Token"
          type="password"
          onChange={e => handleTokenChange('github', e.target.value)}
          value={tokens.github}
          spellCheck="false"
        />
        <input
          className="input-field"
          placeholder="Cerebras Key (Optional for synthesis)"
          type="password"
          onChange={e => handleTokenChange('cerebras', e.target.value)}
          value={tokens.cerebras}
          spellCheck="false"
        />
        <div style={{ fontSize: '0.6rem', color: 'var(--red-dim)' }}>TARGET: {`${repoConfig.owner}/${repoConfig.repo}/${repoConfig.file}`}</div>

        <button
          className={`btn-go ${isEvolutionActive ? 'btn-stop' : ''}`}
          onClick={isEvolutionActive ? terminateEvolution : runEvolution}
        >
          {isEvolutionActive ? "TERMINATE" : "EVOLVE"}
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
  const [tokens, setTokens] = useState(() => {
    const savedGithub = localStorage.getItem('dalek_token_github') || "";
    const savedCerebras = localStorage.getItem('dalek_token_cerebras') || "";
    return { github: savedGithub, cerebras: savedCerebras };
  });
  const [logs, dispatchLog] = useReducer(logReducer, []);

  const addLog = useCallback((msg, type = "def") => {
    dispatchLog({ type: LogActionTypes.ADD_LOG, payload: { msg, type } });
  }, []);

  const { isEvolutionActive, displayCode, status, runEvolution, terminateEvolution, error } = useEvolutionEngine(
    tokens, addLog
  );

  useEffect(() => {
    if (!API_KEYS.GEMINI) {
      addLog("WARNING: GEMINI_API_KEY is not configured. Full AI capabilities (pattern extraction, finalization) will be disabled.", "le-err");
      addLog("Please insert your Google AI Studio key in the CONFIGURATION section to enable full AI capabilities.", "le-err");
    } else {
      addLog("GEMINI_API_KEY detected. Gemini services enabled.", "ok");
    }

    if (!tokens.cerebras) {
      addLog("WARNING: Cerebras AI key is missing. The synthesis step will be skipped, impacting code generation.", "warn");
    } else {
      addLog("Cerebras AI key detected. Cerebras synthesis enabled.", "ok");
    }

    if (!tokens.github) {
      addLog("WARNING: GitHub token is missing. Core evolution and commits will be disabled.", "le-err");
    } else {
      addLog("GitHub token detected. Repository access enabled.", "ok");
    }
  }, [addLog, tokens.cerebras, tokens.github]);

  useEffect(() => {
    if (error) {
      addLog(`ENGINE ERROR: ${error.message || String(error)}`, "le-err");
    }
  }, [error, addLog]);

  const startEvolutionProcess = useCallback(() => {
    dispatchLog({ type: LogActionTypes.CLEAR_LOGS });
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
          repoConfig={APP_CONFIG.GITHUB_REPO}
          isEvolutionActive={isEvolutionActive}
          logs={logs}
          runEvolution={startEvolutionProcess}
          terminateEvolution={terminateEvolution}
        />
        <CoreDisplayPanel displayCode={displayCode} />
      </div>
    </div>
  );
}