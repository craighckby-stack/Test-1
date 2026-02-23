import React, { useState, useEffect, useRef, useCallback, useReducer, memo, useMemo } from "react";

// Centralized API keys (PLACEHOLDER - in a real app, use environment variables)
const APP_EMBEDDED_API_KEYS = {
  GEMINI: "", // Placeholder for embedded key
};

// Core application configuration
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
  API: {
    GEMINI: {
      MODEL: "gemini-2.5-flash-preview-09-2025",
      ENDPOINT: "/v1beta/models/{model}:generateContent",
      BASE_URL: "https://generativelanguage.googleapis.com",
      DEFAULT_KEY: APP_EMBEDDED_API_KEYS.GEMINI
    },
    CEREBRAS: {
      MODEL: "llama3.1-70b",
      ENDPOINT: "/v1/chat/completions",
      BASE_URL: "https://api.cerebras.ai"
    },
    GITHUB: {
      BASE_URL: "https://api.github.com"
    }
  }
};

// AI prompt instructions
const PROMPT_INSTRUCTIONS = {
  GEMINI_PATTERN: "Extract 5 architectural logic improvements from source to apply to core. Return bullet points ONLY.",
  CEREBRAS_SYNTHESIS: "Expert Dalek Caan Architect. Merge logic improvements. PURE CODE ONLY. Ensure all original React structure, API keys, and configurations are preserved and correctly integrated, especially if they are at the top-level of the module. Do NOT wrap the entire code in a function. Output ONLY the raw JavaScript file content.",
  GEMINI_FINALIZATION: "ACT AS: Dalek Caan Architect. Finalize the evolved source code. NO MARKDOWN. NO BACKTICKS. Preserve all API keys, styles, and the React structure. Output ONLY pure JavaScript. Do NOT wrap the entire code in a function. Output ONLY the raw JavaScript file content.",
};

// Global CSS styles for the application
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

// Custom error class for application-specific errors
class AppError extends Error {
  constructor(message, code = 'GENERIC_ERROR', originalError = null, httpStatus = null, isUserAbort = false) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.originalError = originalError;
    this.httpStatus = httpStatus;
    this.isAppError = true;
    this.isUserAbort = isUserAbort;
  }
}

// Utility functions
const utf8B64Encode = (str) => btoa(unescape(encodeURIComponent(str)));
const utf8B64Decode = (b64) => {
  try { return decodeURIComponent(escape(atob(b64.replace(/\s/g, "")))) }
  catch (e) { throw new AppError(`Failed to decode Base64 content: ${e.message}`, 'BASE64_DECODE_ERROR', e); }
};
const wait = (ms) => new Promise(res => setTimeout(res, ms));

const safeFetch = async (url, options, retries = 3, signal = null) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { ...options, signal });
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status} for ${url}`;
        let errorBody = {};
        try {
          errorBody = await response.json();
          errorMessage = errorBody.message || JSON.stringify(errorBody);
        } catch (jsonParseError) { /* ignore, body might not be JSON */ }
        throw new AppError(errorMessage, 'HTTP_REQUEST_FAILED', null, response.status);
      }
      return await response.json();
    } catch (e) {
      if (e.name === 'AbortError' || (e.isAppError && e.isUserAbort)) throw e;
      
      const isNetworkOrHttpError = (e.isAppError && e.code === 'HTTP_REQUEST_FAILED') || (e.name === 'TypeError' && e.message === 'Failed to fetch');
      
      if (isNetworkOrHttpError && i < retries - 1) {
          await wait(1000 * (i + 1));
          continue;
      }
      if (e.isAppError) throw e; // Re-throw custom AppErrors as is
      throw new AppError(`Network or unexpected error on ${url}: ${e.message}`, 'NETWORK_ERROR', e);
    }
  }
  throw new AppError("safeFetch exhausted all retries.", 'FETCH_RETRY_EXHAUSTED');
};

const cleanMarkdownCodeBlock = (code) => code ? code.replace(/^```[a-z]*\n|```$/gi, "").trim() : "";
const sanitizeContent = (content, maxLength) => content ? content.replace(/[^\x20-\x7E\n]/g, "").substring(0, maxLength) : "";
const validateJavaScriptSyntax = (code) => {
  try { new Function(code); return true; } catch (e) { return false; }
};

// Log system reducer and hook
const LogActionTypes = {
  ADD_LOG: 'ADD_LOG',
  CLEAR_LOGS: 'CLEAR_LOGS',
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

const useLogSystem = () => {
  const [logs, dispatchLog] = useReducer(logReducer, []);
  const addLog = useCallback((msg, type = "def") => {
    dispatchLog({ type: LogActionTypes.ADD_LOG, payload: { msg, type } });
  }, []);
  const clearLogs = useCallback(() => {
    dispatchLog({ type: LogActionTypes.CLEAR_LOGS });
  }, []);
  return { logs, addLog, clearLogs };
};

// Application token management hook
const useAppTokens = () => {
  const [tokens, setTokens] = useState(() => {
    try {
      const savedGithub = localStorage.getItem('dalek_token_github') || "";
      const savedCerebras = localStorage.getItem('dalek_token_cerebras') || "";
      const savedGemini = localStorage.getItem('dalek_token_gemini') || "";
      return { github: savedGithub, cerebras: savedCerebras, gemini: savedGemini };
    } catch (e) {
      console.error("Failed to read tokens from localStorage:", e);
      return { github: "", cerebras: "", gemini: "" };
    }
  });

  const handleTokenChange = useCallback((key, value) => {
    setTokens(prev => {
      const newTokens = { ...prev, [key]: value };
      try {
        localStorage.setItem(`dalek_token_${key}`, value);
      } catch (e) {
        console.error(`Failed to save token ${key} to localStorage:`, e);
      }
      return newTokens;
    });
  }, []);

  return { tokens, handleTokenChange };
};

// Evolution engine status definitions
const EvolutionStatus = {
  IDLE: 'IDLE',
  PAUSED: 'PAUSED',
  ERROR: 'ERROR',
  EVOLUTION_CYCLE_INITIATED: 'EVOLUTION_CYCLE_INITIATED',
  FETCHING_CORE: 'FETCHING_CORE',
  EXTRACTING_PATTERNS: 'EXTRACTING_PATTERNS',
  SYNTHESIZING_DRAFT: 'SYNTHESIZING_DRAFT',
  FINALIZING_CODE: 'FINALIZING_CODE',
  VALIDATING_SYNTAX: 'VALIDATING_SYNTAX',
  COMMITTING_CODE: 'COMMITTING_CODE',
};

// Initial state for the evolution engine
const initialEvolutionEngineState = {
  status: EvolutionStatus.IDLE,
  isEvolutionActive: false,
  error: null,
  currentCoreCode: '',
  displayCode: '',
  pipeline: {
    fileRef: null,
    fetchedCode: '',
    quantumPatterns: null,
    draftCode: null,
    isSyntaxValid: false,
    commitPerformed: false,
    evolvedCode: '',
  },
};

// Evolution engine action types
const EvolutionActionTypes = {
  START_EVOLUTION: 'START_EVOLUTION',
  STOP_EVOLUTION: 'STOP_EVOLUTION',
  SET_STATUS: 'SET_STATUS',
  SET_ERROR: 'SET_ERROR',
  RESET_ENGINE_STATE: 'RESET_ENGINE_STATE',
  UPDATE_STATE_FROM_STEP: 'UPDATE_STATE_FROM_STEP', // Unified update action
};

// Evolution engine reducer
const evolutionEngineReducer = (state, action) => {
  switch (action.type) {
    case EvolutionActionTypes.START_EVOLUTION:
      return { ...initialEvolutionEngineState, isEvolutionActive: true, status: EvolutionStatus.EVOLUTION_CYCLE_INITIATED, currentCoreCode: state.currentCoreCode, displayCode: state.currentCoreCode };
    case EvolutionActionTypes.STOP_EVOLUTION:
      return { ...state, isEvolutionActive: false, status: EvolutionStatus.PAUSED, error: null };
    case EvolutionActionTypes.SET_STATUS:
      return { ...state, status: action.payload };
    case EvolutionActionTypes.SET_ERROR:
      return { ...state, error: action.payload, status: EvolutionStatus.ERROR, isEvolutionActive: false, displayCode: state.currentCoreCode || '' };
    case EvolutionActionTypes.RESET_ENGINE_STATE:
      // When resetting, preserve the last known `currentCoreCode` and `displayCode` to prevent display flicker
      return { ...initialEvolutionEngineState, currentCoreCode: state.currentCoreCode, displayCode: state.currentCoreCode };
    case EvolutionActionTypes.UPDATE_STATE_FROM_STEP:
      return {
        ...state,
        ...(action.payload.pipeline && { pipeline: { ...state.pipeline, ...action.payload.pipeline } }),
        ...(action.payload.currentCoreCode !== undefined && { currentCoreCode: action.payload.currentCoreCode }),
        ...(action.payload.displayCode !== undefined && { displayCode: action.payload.displayCode }),
        ...(action.payload.status !== undefined && { status: action.payload.status }),
        ...(action.payload.error !== undefined && { error: action.payload.error }),
      };
    default:
      return state;
  }
};

// Hook for evolution engine state management
const useEvolutionState = () => {
  const [engineState, dispatchEvolution] = useReducer(evolutionEngineReducer, initialEvolutionEngineState);
  return { engineState, dispatchEvolution };
};

// Generic API client creation factory
const createApiClient = (baseURL, logger, defaultHeaders = {}) => {
  const request = async (method, endpoint, options, stepName = "API Request", logType = "def", signal = null) => {
    const url = `${baseURL}${endpoint}`;
    const allHeaders = { ...defaultHeaders, ...options.headers };

    try {
      logger(`API: Initiating ${stepName}...`, logType);
      const response = await safeFetch(url, { method, headers: allHeaders, body: options.body, signal }, 3, signal);
      logger(`API: ${stepName} completed.`, "ok");
      return response;
    } catch (e) {
      if (e.name === 'AbortError' || (e.isAppError && e.isUserAbort)) {
        throw e; // Re-throw aborts immediately
      }
      const errorMsg = e.isAppError ? `${e.message} (Code: ${e.code || 'N/A'})` : `An unexpected API error occurred: ${e.message}`;
      const errorCode = e.isAppError ? e.code : 'UNKNOWN_API_ERROR';
      logger(`API ${stepName.toUpperCase()} FAILED: ${errorMsg}.`, "le-err");
      throw new AppError(errorMsg, errorCode, e, e.httpStatus);
    }
  };

  return {
    get: (endpoint, options = {}, stepName, logType, signal) => request("GET", endpoint, options, stepName, logType, signal),
    post: (endpoint, options = {}, stepName, logType, signal) => request("POST", endpoint, options, stepName, logType, signal),
    put: (endpoint, options = {}, stepName, logType, signal) => request("PUT", endpoint, options, stepName, logType, signal),
  };
};

// Hook for AI service integrations (GitHub, Gemini, Cerebras)
const useAIIntegrations = (tokens, addLog) => {
  // Memoize API client instances based on tokens
  const clients = useMemo(() => {
    const getApiClientInstance = (apiConfig, token, name, defaultHeaders = {}, isKeyInUrl = false) => {
      const effectiveToken = token.trim() || apiConfig.DEFAULT_KEY;

      if (!effectiveToken && name !== "GitHub" && apiConfig.DEFAULT_KEY === '') { // Only warn if no key (user or embedded)
        addLog(`WARNING: ${name} client not fully operational: API key missing or not embedded.`, `NO_${name.toUpperCase()}_KEY_WARN`);
        return null;
      }
      
      let authHeader = {};
      if (effectiveToken && !isKeyInUrl) {
          authHeader = { Authorization: `Bearer ${effectiveToken}` };
      }

      return createApiClient(
        apiConfig.BASE_URL,
        addLog,
        { ...defaultHeaders, ...authHeader }
      );
    };

    const githubClient = getApiClientInstance(
      APP_CONFIG.API.GITHUB,
      tokens.github,
      "GitHub",
      { Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" }
    );

    const geminiClient = getApiClientInstance(
      APP_CONFIG.API.GEMINI,
      tokens.gemini,
      "Gemini",
      { "Content-Type": "application/json" },
      true
    );

    const cerebrasClient = getApiClientInstance(
      APP_CONFIG.API.CEREBRAS,
      tokens.cerebras,
      "Cerebras",
      { "Content-Type": "application/json" }
    );

    // GitHub Service
    const githubService = githubClient ? {
      getFile: async (filePath = APP_CONFIG.GITHUB_REPO.file, signal = null) => {
        const urlPath = `/repos/${APP_CONFIG.GITHUB_REPO.owner}/${APP_CONFIG.GITHUB_REPO.repo}/contents/${filePath}?ref=${APP_CONFIG.GITHUB_REPO.branch}`;
        const response = await githubClient.get(urlPath, {}, `GitHub Fetch ${filePath}`, "nexus", signal);
        if (!response || !response.content) {
          throw new AppError(`Failed to fetch file content for ${filePath}. Response was empty or invalid.`, 'GITHUB_FETCH_FAILED');
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
    } : null;

    // Gemini Service
    const geminiService = geminiClient ? (() => {
      // Use the already determined effectiveToken here
      const geminiApiKey = tokens.gemini.trim() || APP_CONFIG.API.GEMINI.DEFAULT_KEY;
      const geminiEndpoint = APP_CONFIG.API.GEMINI.ENDPOINT.replace("{model}", APP_CONFIG.API.GEMINI.MODEL) + `?key=${geminiApiKey}`;

      const buildGeminiGenerateContentBody = (systemInstruction, userParts) => ({
        contents: [{ parts: userParts }],
        systemInstruction: { parts: [{ text: systemInstruction }] }
      });

      return {
        generateContent: async (systemInstruction, parts, stepName = "content generation", signal = null) => {
          const body = buildGeminiGenerateContentBody(systemInstruction, parts);
          const res = await geminiClient.post(geminiEndpoint, { body: JSON.stringify(body) }, `Gemini ${stepName}`, "quantum", signal); 
          const content = res.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (!content) {
            throw new AppError(`Gemini returned empty content or no valid candidate found for ${stepName}.`, 'GEMINI_EMPTY_RESPONSE');
          }
          return content;
        }
      };
    })() : null;

    // Cerebras Service
    const cerebrasService = cerebrasClient ? {
      completeChat: async (systemContent, userContent, stepName = "chat completion", signal = null) => {
        const body = {
          model: APP_CONFIG.API.CEREBRAS.MODEL,
          messages: [
            { role: "system", content: systemContent },
            { role: "user", content: userContent }
          ]
        };
        const data = await cerebrasClient.post(APP_CONFIG.API.CEREBRAS.ENDPOINT, { body: JSON.stringify(body) }, `Cerebras ${stepName}`, "quantum", signal);
        const content = data.choices?.[0]?.message?.content || "";
        if (!content) {
          throw new AppError(`Cerebras returned empty content or no valid choice found for ${stepName}.`, 'CEREBRAS_EMPTY_RESPONSE');
        }
        return content;
      }
    } : null;

    return { github: githubService, gemini: geminiService, cerebras: cerebrasService };
  }, [tokens.github, tokens.gemini, tokens.cerebras, addLog]);

  return clients;
};

// Pipeline Step Definitions
const fetchCoreLogic = async (currentEngineState, { clients, config, addLog }, signal) => {
  if (!clients.github) {
    throw new AppError("GitHub client not available. Cannot fetch core logic. Please provide a token.", "GITHUB_CLIENT_UNAVAILABLE");
  }
  const result = await clients.github.getFile(config.GITHUB_REPO.file, signal);
  const fetchedCode = utf8B64Decode(result.content);
  addLog("NEXUS: Core code fetched successfully.", "ok");
  return {
    pipeline: {
      fetchedCode: fetchedCode,
      fileRef: result // Contains SHA and other metadata for commit
    },
    currentCoreCode: fetchedCode, // Update engine's current core
    displayCode: fetchedCode, // Display the fetched code
  };
};

const extractingPatternsLogic = async (currentEngineState, { clients, config, prompts, addLog }, signal) => {
  const { fetchedCode } = currentEngineState.pipeline;
  if (!fetchedCode) {
    throw new AppError("No core code available for pattern extraction. Critical upstream failure.", "MISSING_FETCHED_CODE");
  }
  if (!clients.gemini) {
    addLog("WARNING: Gemini client not available. Skipping pattern extraction.", "warn");
    return { pipeline: { quantumPatterns: null } }; // Allow failure, continue without patterns
  }

  const cleanCode = sanitizeContent(fetchedCode, config.CORE_CONTENT_MAX_LENGTH);
  const patterns = await clients.gemini.generateContent(
    prompts.GEMINI_PATTERN,
    [{ text: `CORE: ${cleanCode}` }],
    "pattern extraction",
    signal
  );
  if (!patterns || patterns.trim().length < 10) {
    throw new AppError("No meaningful quantum patterns extracted by Gemini.", "NO_QUANTUM_PATTERNS");
  }
  addLog("QUANTUM: Patterns extracted.", "quantum");
  return { pipeline: { quantumPatterns: patterns } };
};

const synthesizingDraftLogic = async (currentEngineState, { clients, config, prompts, addLog }, signal) => {
  const { fetchedCode, quantumPatterns } = currentEngineState.pipeline;
  if (!fetchedCode) {
    throw new AppError("No core code available for draft synthesis. Critical upstream failure.", "MISSING_FETCHED_CODE");
  }
  if (!clients.cerebras) {
    addLog("WARNING: Cerebras client not available. Skipping synthesis step.", "warn");
    return { pipeline: { draftCode: null } }; // Allow failure, continue without a draft
  }

  const sanitizedFetchedCode = sanitizeContent(fetchedCode, config.CORE_CONTENT_MAX_LENGTH);
  const userContent = quantumPatterns
    ? `IMPROVEMENTS: ${quantumPatterns}\nCORE: ${sanitizedFetchedCode}`
    : `CORE: ${sanitizedFetchedCode}`;

  const rawDraft = await clients.cerebras.completeChat(
    prompts.CEREBRAS_SYNTHESIS,
    userContent,
    "code synthesis",
    signal
  );
  const cleanedDraft = cleanMarkdownCodeBlock(rawDraft);

  if (!cleanedDraft || cleanedDraft.trim().length < config.MIN_SYNTHESIZED_DRAFT_LENGTH) {
    throw new AppError(`Synthesized draft was too short (${cleanedDraft ? cleanedDraft.length : 0} chars) or empty. Minimum: ${config.MIN_SYNTHESIZED_DRAFT_LENGTH} chars.`, "SYNTHESIS_TOO_SHORT");
  }
  addLog("QUANTUM: Draft synthesized by Cerebras.", "quantum");
  return { pipeline: { draftCode: cleanedDraft } };
};

const finalizingCodeLogic = async (currentEngineState, { clients, addLog, config, prompts }, signal) => {
  const { draftCode, fetchedCode } = currentEngineState.pipeline;
  const codeForFinalization = draftCode || fetchedCode; // Use Cerebras draft if available, else the original fetched code
  if (!codeForFinalization) {
    throw new AppError("No code available for finalization. Critical upstream failure.", 'NO_CODE_TO_FINALIZE');
  }
  if (!clients.gemini) {
    throw new AppError("Gemini client not available. Cannot finalize code. Please provide a token.", "GEMINI_CLIENT_UNAVAILABLE");
  }

  addLog(`AI: Proceeding with ${draftCode ? 'Cerebras draft' : 'original core'} for finalization.`, "def");

  const rawFinalCode = await clients.gemini.generateContent(
    prompts.GEMINI_FINALIZATION,
    [
      { text: `DRAFT_CODE: ${sanitizeContent(codeForFinalization, config.CORE_CONTENT_MAX_LENGTH)}` },
      { text: `EXISTING_CORE_REFERENCE: ${sanitizeContent(fetchedCode, config.CORE_CONTENT_MAX_LENGTH)}` } // Provide original as reference
    ],
    "core finalization",
    signal
  );
  const cleanedFinalCode = cleanMarkdownCodeBlock(rawFinalCode);

  if (!cleanedFinalCode || cleanedFinalCode.trim().length === 0) {
    throw new AppError("Finalized code was empty after cleanup, indicating a critical AI failure.", 'GEMINI_EMPTY_RESPONSE_FINAL');
  }
  addLog("QUANTUM: Code finalized by Gemini.", "quantum");
  return {
    pipeline: { evolvedCode: cleanedFinalCode },
    displayCode: cleanedFinalCode, // Update display with finalized code
  };
};

const validatingSyntaxLogic = async (currentEngineState, { addLog }, signal) => {
  // Signal is unused but kept for consistent signature for potential future use (e.g., long-running validation)
  if (signal && signal.aborted) throw new AppError("Syntax validation aborted.", "ABORTED", null, null, true);

  const { evolvedCode } = currentEngineState.pipeline;
  if (!evolvedCode) {
    throw new AppError("No evolved code to validate. Critical upstream failure.", 'NO_EVOLVED_CODE');
  }

  const isValid = validateJavaScriptSyntax(evolvedCode);
  if (!isValid) {
    throw new AppError("Evolved code contains JavaScript syntax errors. Preventing commit.", 'SYNTAX_ERROR');
  }
  addLog("NEXUS: Evolved code syntax validated.", "ok");
  return { pipeline: { isSyntaxValid: true } };
};

const committingCodeLogic = async (currentEngineState, { clients, addLog, config, isCodeSafeToCommitCheck }, signal) => {
  const { isSyntaxValid, evolvedCode, fileRef, fetchedCode } = currentEngineState.pipeline;
  
  if (!clients.github) {
    throw new AppError("GitHub client not available. Cannot commit code. Please provide a token.", "GITHUB_CLIENT_UNAVAILABLE");
  }
  if (!isSyntaxValid) {
    throw new AppError("Code failed syntax validation. No commit.", 'COMMIT_PREVENTED_SYNTAX');
  }
  if (!evolvedCode) {
    throw new AppError("No evolved code to commit. Critical upstream failure.", 'NO_EVOLVED_CODE_FOR_COMMIT');
  }

  if (!isCodeSafeToCommitCheck(evolvedCode, fetchedCode)) {
    throw new AppError("Evolved code deemed unsafe or unchanged. No commit.", 'COMMIT_PREVENTED_SAFETY');
  }

  if (!fileRef || !fileRef.sha) {
    throw new AppError("Missing file reference (SHA) for committing code. Cannot proceed.", 'MISSING_FILE_SHA');
  }
  
  await clients.github.updateFile(
    config.GITHUB_REPO.file, evolvedCode, fileRef.sha, `DALEK_EVOLUTION_${new Date().toISOString()}`, signal
  );
  addLog("NEXUS: EVOLVED SUCCESSFULLY AND COMMITTED.", "ok");
  
  return {
    pipeline: { commitPerformed: true },
    currentCoreCode: evolvedCode, // Update engine's core code to the newly committed version
    displayCode: evolvedCode, // Display the committed code
  };
};

// Hook for executing the evolution pipeline
const useEvolutionPipelineExecutor = (steps, globalServices, dispatchEvolution) => {
  const abortControllerRef = useRef(null);
  const { addLog } = globalServices;

  const runPipeline = useCallback(async (initialEngineState) => {
    // Reset state and set initial status
    dispatchEvolution({ type: EvolutionActionTypes.RESET_ENGINE_STATE });
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    let successfulCommitThisCycle = false;
    let pipelineAborted = false;

    // Use a local mutable state for the pipeline execution to ensure sequential updates
    // between steps before dispatching to the global state. This prevents race conditions or stale
    // state being passed between synchronous step actions within the loop.
    let currentPipelineLocalState = { ...initialEngineState }; 

    try {
      dispatchEvolution({ type: EvolutionActionTypes.SET_STATUS, payload: EvolutionStatus.EVOLUTION_CYCLE_INITIATED });
      addLog("AI: PROCESSING EVOLUTION...", "nexus");

      for (const stepDef of steps) {
        if (signal.aborted) {
          pipelineAborted = true;
          throw new AppError("Pipeline aborted by user.", "PIPELINE_ABORTED", null, null, true);
        }

        const stepDisplayName = stepDef.name.replace(/_/g, ' ');
        dispatchEvolution({ type: EvolutionActionTypes.SET_STATUS, payload: stepDef.name });
        addLog(`NEXUS: ${stepDisplayName} initiated.`, "nexus");

        try {
          // Pass the current *local* state to the step action
          const stepResult = await stepDef.action(currentPipelineLocalState, globalServices, signal);
          
          // Update the local state with the results for subsequent steps
          currentPipelineLocalState = {
            ...currentPipelineLocalState,
            ...(stepResult.pipeline && { pipeline: { ...currentPipelineLocalState.pipeline, ...stepResult.pipeline } }),
            ...(stepResult.currentCoreCode !== undefined && { currentCoreCode: stepResult.currentCoreCode }),
            ...(stepResult.displayCode !== undefined && { displayCode: stepResult.displayCode }),
          };
          
          // Dispatch the result to update the global React state for UI reflection
          dispatchEvolution({ type: EvolutionActionTypes.UPDATE_STATE_FROM_STEP, payload: stepResult });

          if (stepDef.name === EvolutionStatus.COMMITTING_CODE && stepResult.pipeline?.commitPerformed) {
            successfulCommitThisCycle = true;
          }

          if (stepDef.name !== EvolutionStatus.COMMITTING_CODE) { 
              addLog(`NEXUS: ${stepDisplayName} completed.`, "ok");
          }
        } catch (stepError) {
          if (stepError.name === 'AbortError' || (stepError.isAppError && stepError.isUserAbort)) {
            pipelineAborted = true;
            addLog(`NEXUS: ${stepDisplayName} ABORTED.`, "warn");
            throw stepError;
          }
          
          addLog(`NEXUS: ${stepDisplayName} FAILED: ${stepError.message || String(stepError)}. Code: ${stepError.code || 'N/A'}`, "le-err");
          if (!stepDef.allowFailure) {
            throw stepError;
          } else {
            addLog(`NEXUS: ${stepDisplayName} failed but allowed to continue due to configuration.`, "warn");
          }
        }
      }
      return { success: true, commitPerformed: successfulCommitThisCycle, aborted: false };
    } catch (e) {
      if (pipelineAborted || e.name === 'AbortError' || (e.isAppError && e.isUserAbort)) {
        addLog("NEXUS CYCLE INTERRUPTED BY USER.", "warn");
        return { success: false, commitPerformed: false, aborted: true };
      } else {
        dispatchEvolution({ type: EvolutionActionTypes.SET_ERROR, payload: e });
        const errorMsg = e.isAppError ? `${e.message} (Code: ${e.code})` : e.message || String(e);
        addLog(`CRITICAL NEXUS PIPELINE FAILURE: ${errorMsg}`, "le-err");
        return { success: false, commitPerformed: false, aborted: false };
      }
    } finally {
      if (abortControllerRef.current) {
        abortControllerRef.current = null; // Clean up controller
      }
    }
  }, [steps, globalServices, dispatchEvolution, addLog]); // Dependencies ensure the function is stable

  const abortPipeline = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      addLog("PIPELINE: Explicit abort requested.", "nexus");
    }
  }, [addLog]);

  return { runPipeline, abortPipeline };
};

// Hook for managing the continuous evolution loop
const useContinuousEvolutionLoop = (performEvolutionCallback, isActive, addLog, initialEngineState) => {
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
  }, []); // Run once on mount, clean up on unmount

  useEffect(() => {
    const runCycle = async () => {
      if (!isMountedRef.current || !isActive) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        return;
      }

      const { success, commitPerformed, aborted } = await performEvolutionCallback(initialEngineState);

      if (!isMountedRef.current) { // Check mount status again after async operation
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        return;
      }

      if (aborted) {
          addLog("NEXUS CYCLE ABORTED. Loop suspended.", "warn");
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
          return;
      }

      if (isActive) {
        const delay = success ? APP_CONFIG.EVOLUTION_CYCLE_INTERVAL_MS : APP_CONFIG.EVOLUTION_CYCLE_INTERVAL_MS / 2;
        const message = success
          ? (commitPerformed ? `NEXUS CYCLE COMPLETE. Waiting for next evolution in ${delay / 1000}s.` : `NEXUS CYCLE COMPLETE (no commit). Waiting in ${delay / 1000}s.`)
          : `NEXUS CYCLE FAILED. Retrying in ${delay / 1000}s.` ;
        addLog(message, success ? "nexus" : "le-err");

        timeoutRef.current = setTimeout(runCycle, delay);
      } else {
        addLog("NEXUS CYCLE PAUSED.", "nexus");
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    if (isActive) {
      addLog("NEXUS CYCLE INITIATED. Preparing for first evolution.", "nexus");
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current); // Clear any existing timeouts before starting a new one
      }
      timeoutRef.current = setTimeout(runCycle, 0); // Start the first cycle immediately
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
  }, [isActive, performEvolutionCallback, addLog, initialEngineState]);

};

// Main application logic hook
const useDalekCore = () => {
  const { logs, addLog, clearLogs } = useLogSystem();
  const { tokens, handleTokenChange } = useAppTokens();
  const { engineState, dispatchEvolution } = useEvolutionState();
  const { status, isEvolutionActive, displayCode, error, currentCoreCode } = engineState;

  const clients = useAIIntegrations(tokens, addLog);

  const isCodeSafeToCommit = useCallback((code, originalCode) => {
    if (!code || code.length < APP_CONFIG.MIN_EVOLVED_CODE_LENGTH) {
      addLog(`EVOLUTION SAFETY TRIGGER: Evolved code too short (${code ? code.length : 0} chars). Retaining current core.`, "le-err");
      return false;
    }
    if (code.trim() === originalCode.trim()) {
      addLog("AI: Core logic unchanged after evolution. No commit necessary.", "def");
      return false;
    }
    return true;
  }, [addLog]);

  // Define the pipeline steps and memoize them
  const EVOLUTION_PIPELINE_STEPS = useMemo(() => [
    { name: EvolutionStatus.FETCHING_CORE, action: fetchCoreLogic, allowFailure: false },
    { name: EvolutionStatus.EXTRACTING_PATTERNS, action: extractingPatternsLogic, allowFailure: true }, 
    { name: EvolutionStatus.SYNTHESIZING_DRAFT, action: synthesizingDraftLogic, allowFailure: true }, 
    { name: EvolutionStatus.FINALIZING_CODE, action: finalizingCodeLogic, allowFailure: false },
    { name: EvolutionStatus.VALIDATING_SYNTAX, action: validatingSyntaxLogic, allowFailure: false },
    { name: EvolutionStatus.COMMITTING_CODE, action: committingCodeLogic, allowFailure: false }
  ], []);

  // Memoize global services for dependency injection into pipeline steps
  const globalServices = useMemo(() => ({
    clients,
    addLog,
    config: APP_CONFIG,
    prompts: PROMPT_INSTRUCTIONS,
    isCodeSafeToCommitCheck: isCodeSafeToCommit,
  }), [clients, addLog, isCodeSafeToCommit]);

  const { runPipeline, abortPipeline } = useEvolutionPipelineExecutor(
    EVOLUTION_PIPELINE_STEPS,
    globalServices,
    dispatchEvolution
  );

  const performEvolutionCycle = useCallback(async (initialEngineStateForCycle) => {
    // Pass the current *actual* engineState to runPipeline for its initial local state setup.
    // This ensures that `runPipeline` starts with the very latest state, including `currentCoreCode`.
    const { success, commitPerformed, aborted } = await runPipeline(initialEngineStateForCycle);
    if (success && !aborted) { 
      dispatchEvolution({ type: EvolutionActionTypes.SET_STATUS, payload: EvolutionStatus.IDLE });
    } else if (aborted) {
        dispatchEvolution({ type: EvolutionActionTypes.STOP_EVOLUTION });
    } else {
        dispatchEvolution({ type: EvolutionActionTypes.SET_STATUS, payload: EvolutionStatus.ERROR });
    }
    return { success, commitPerformed, aborted };
  }, [runPipeline, dispatchEvolution]);

  useContinuousEvolutionLoop(performEvolutionCycle, isEvolutionActive, addLog, engineState);

  const runEvolution = useCallback(() => {
    try {
      if (!tokens.github) {
        throw new AppError("GitHub token missing. Evolution cannot start.", 'NO_GITHUB_TOKEN_INIT');
      }
      if (!clients.github) {
        throw new AppError("GitHub client is not initialized. Check your tokens or network.", 'GITHUB_CLIENT_NOT_INIT');
      }
      // Trigger the loop by setting isEvolutionActive to true. The loop will then call performEvolutionCycle.
      dispatchEvolution({ type: EvolutionActionTypes.START_EVOLUTION });
    } catch (e) {
      addLog(`INITIATION ERROR: ${e.message}`, "le-err");
      dispatchEvolution({ type: EvolutionActionTypes.SET_ERROR, payload: e });
    }
  }, [tokens.github, clients.github, addLog, dispatchEvolution]);

  const terminateEvolution = useCallback(() => {
    if (isEvolutionActive) {
      abortPipeline();
      addLog("TERMINATION PROTOCOL INITIATED...", "nexus");
      dispatchEvolution({ type: EvolutionActionTypes.STOP_EVOLUTION });
    } else {
      addLog("NEXUS CYCLE NOT ACTIVE. No termination needed.", "def");
    }
  }, [isEvolutionActive, addLog, dispatchEvolution, abortPipeline]);

  useEffect(() => {
    clearLogs();
    addLog("NEXUS: System initializing...", "nexus");

    const tokenStatus = [
      { key: 'github', present: !!tokens.github, required: true, name: "GitHub", messages: { present: "GitHub token detected. Repository access enabled.", missing: "WARNING: GitHub token is missing. Core evolution and commits are disabled.\nPlease provide a GitHub Personal Access Token with 'repo' scope." } },
      { key: 'gemini', present: !!(tokens.gemini || APP_EMBEDDED_API_KEYS.GEMINI), required: true, name: "Gemini", messages: { present: "Gemini API Key detected. Gemini services enabled.", missing: "WARNING: Gemini API Key is not configured. Full AI capabilities (pattern extraction, finalization) will be degraded.\nPlease insert your Google AI Studio key in the CONFIGURATION section to enable full AI capabilities." } },
      { key: 'cerebras', present: !!tokens.cerebras, required: false, name: "Cerebras", messages: { present: "Cerebras AI key detected. Cerebras synthesis enabled.", missing: "WARNING: Cerebras AI key is missing. The code synthesis step will be skipped, impacting code generation.\nPlease provide a Cerebras API Key to enable advanced code synthesis." } },
    ];

    tokenStatus.forEach(status => {
      addLog(status.present ? status.messages.present : status.messages.missing, status.present ? "ok" : (status.required ? "le-err" : "warn"));
    });
    addLog("NEXUS: System Ready.", "nexus");
  }, [addLog, clearLogs, tokens.cerebras, tokens.github, tokens.gemini]);

  useEffect(() => {
    if (error) {
      // Ensure error object is properly stringified if it's not a custom AppError
      const errorMsg = error.isAppError ? `${error.message} (Code: ${error.code || 'UNKNOWN'})` : String(error);
      addLog(`ENGINE ERROR: ${errorMsg}`, "le-err");
    }
  }, [error, addLog]);

  return {
    logs,
    tokens,
    setTokens: handleTokenChange,
    status,
    isEvolutionActive,
    displayCode,
    runEvolution,
    terminateEvolution,
    error,
    currentCoreCode,
  };
};

// UI Components (memoized for performance)
const DalekHeader = memo(({ status }) => (
  <div className="header">
    <div className="title">DALEK CAAN :: BOOTSTRAPPER</div>
    <div style={{ fontSize: '0.7rem' }}>{status === EvolutionStatus.IDLE || status === EvolutionStatus.PAUSED ? "CORE_STABLE" : `STATUS: ${status.replace(/_/g, ' ')}...`}</div>
  </div>
));

const NexusControlPanel = memo(({
  tokens, setTokens, repoConfig,
  isEvolutionActive, logs, runEvolution, terminateEvolution,
  geminiDefaultKey
}) => {
  const effectiveGeminiToken = tokens.gemini || geminiDefaultKey;
  return (
    <div className="panel">
      <div className="panel-hdr">Nexus Configuration</div>
      <div className="panel-body">
        <input
          className="input-field"
          placeholder="GitHub Token (Required)"
          type="password"
          onChange={e => setTokens('github', e.target.value)}
          value={tokens.github}
          spellCheck="false"
        />
        <input
          className="input-field"
          placeholder="Gemini API Key (Required for patterns & finalization)"
          type="password"
          onChange={e => setTokens('gemini', e.target.value)}
          value={effectiveGeminiToken}
          spellCheck="false"
        />
        <input
          className="input-field"
          placeholder="Cerebras Key (Optional for synthesis)"
          type="password"
          onChange={e => setTokens('cerebras', e.target.value)}
          value={tokens.cerebras}
          spellCheck="false"
        />
        <div style={{ fontSize: '0.6rem', color: 'var(--red-dim)' }}>TARGET: {`${repoConfig.owner}/${repoConfig.repo}/${repoConfig.file} (Branch: ${repoConfig.branch})`}</div>

        <button
          className={`btn-go ${isEvolutionActive ? 'btn-stop' : ''}`}
          onClick={isEvolutionActive ? terminateEvolution : runEvolution}
          disabled={!tokens.github && !isEvolutionActive} // Disable evolve if GitHub token is missing AND not already active
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

// Main App component
export default function App() {
  const {
    logs,
    tokens,
    setTokens,
    status,
    isEvolutionActive,
    displayCode,
    runEvolution,
    terminateEvolution,
  } = useDalekCore();

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
          runEvolution={runEvolution}
          terminateEvolution={terminateEvolution}
          geminiDefaultKey={APP_EMBEDDED_API_KEYS.GEMINI}
        />
        <CoreDisplayPanel displayCode={displayCode} />
      </div>
    </div>
  );
}