import React, { useState, useEffect, useRef, useCallback, useReducer, memo, useMemo } from "react";

const APP_EMBEDDED_API_KEYS = {
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
  API: {
    GEMINI: {
      MODEL: "gemini-2.5-flash-preview-09-2025",
      ENDPOINT_PATH: "/v1beta/models/{model}:generateContent",
      DEFAULT_KEY: APP_EMBEDDED_API_KEYS.GEMINI
    },
    CEREBRAS: {
      MODEL: "llama3.1-70b",
      ENDPOINT_PATH: "/v1/chat/completions"
    },
    GITHUB: {
      API_BASE_URL: "https://api.github.com"
    },
    GEMINI_BASE_URL: "https://generativelanguage.googleapis.com",
    CEREBRAS_BASE_URL: "https://api.cerebras.ai"
  }
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

// --- Utility Functions ---
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
        } catch (jsonParseError) { /* ignore */ }
        throw Object.assign(new Error(errorMessage), { httpStatus: response.status });
      }
      return await response.json();
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      if (i === retries - 1) throw e;
      await wait(1000 * (i + 1));
    }
  }
  throw new Error("safeFetch exhausted all retries.");
};

const cleanMarkdownCodeBlock = (code) => code ? code.replace(/^```[a-z]*\n|```$/gi, "").trim() : "";
const sanitizeContent = (content, maxLength) => content ? content.replace(/[^\x20-\x7E\n]/g, "").substring(0, maxLength) : "";
const validateJavaScriptSyntax = (code) => {
  try { new Function(code); return true; } catch (e) { return false; }
};

// --- Logging System ---
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
  }, []); // No dependencies for dispatchLog
  const clearLogs = useCallback(() => {
    dispatchLog({ type: LogActionTypes.CLEAR_LOGS });
  }, []); // No dependencies for dispatchLog
  return { logs, addLog, clearLogs };
};

// --- API Token Management ---
const useAppTokens = () => {
  const [tokens, setTokens] = useState(() => {
    // Initial state from localStorage
    const savedGithub = localStorage.getItem('dalek_token_github') || "";
    const savedCerebras = localStorage.getItem('dalek_token_cerebras') || "";
    const savedGemini = localStorage.getItem('dalek_token_gemini') || "";
    return { github: savedGithub, cerebras: savedCerebras, gemini: savedGemini };
  });

  const handleTokenChange = useCallback((key, value) => {
    setTokens(prev => {
      const newTokens = { ...prev, [key]: value };
      localStorage.setItem(`dalek_token_${key}`, value);
      return newTokens;
    });
  }, []); // No dependencies as setTokens is stable

  return { tokens, handleTokenChange };
};

// --- Evolution Engine State Management ---
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

const initialPipelineContext = {
  fileRef: null,
  fetchedCode: '',
  quantumPatterns: null,
  draftCode: null,
  isSyntaxValid: false,
  commitPerformed: false,
  evolvedCode: '',
};

const initialEvolutionEngineState = {
  status: EvolutionStatus.IDLE,
  isEvolutionActive: false,
  error: null,
  currentCoreCode: '',
  displayCode: '',
  pipeline: initialPipelineContext,
};

const EvolutionActionTypes = {
  START_EVOLUTION: 'START_EVOLUTION',
  STOP_EVOLUTION: 'STOP_EVOLUTION',
  SET_STATUS: 'SET_STATUS',
  SET_ERROR: 'SET_ERROR',
  RESET_ENGINE_STATE: 'RESET_ENGINE_STATE',
  MERGE_PIPELINE_CONTEXT: 'MERGE_PIPELINE_CONTEXT',
  SET_CURRENT_CORE_CODE: 'SET_CURRENT_CORE_CODE',
  SET_DISPLAY_CODE: 'SET_DISPLAY_CODE',
};

const evolutionEngineReducer = (state, action) => {
  switch (action.type) {
    case EvolutionActionTypes.START_EVOLUTION:
      return { ...state, isEvolutionActive: true, status: EvolutionStatus.EVOLUTION_CYCLE_INITIATED, error: null, pipeline: initialPipelineContext };
    case EvolutionActionTypes.STOP_EVOLUTION:
      return { ...state, isEvolutionActive: false, status: EvolutionStatus.PAUSED, error: null };
    case EvolutionActionTypes.SET_STATUS:
      return { ...state, status: action.payload };
    case EvolutionActionTypes.SET_ERROR:
      return { ...state, error: action.payload, status: EvolutionStatus.ERROR, isEvolutionActive: false, displayCode: state.currentCoreCode };
    case EvolutionActionTypes.RESET_ENGINE_STATE:
      return { ...initialEvolutionEngineState };
    case EvolutionActionTypes.MERGE_PIPELINE_CONTEXT:
      return { ...state, pipeline: { ...state.pipeline, ...action.payload } };
    case EvolutionActionTypes.SET_CURRENT_CORE_CODE:
      return { ...state, currentCoreCode: action.payload, displayCode: action.payload };
    case EvolutionActionTypes.SET_DISPLAY_CODE:
      return { ...state, displayCode: action.payload };
    default:
      return state;
  }
};

const useEvolutionState = () => {
  const [engineState, dispatchEvolution] = useReducer(evolutionEngineReducer, initialEvolutionEngineState);
  return { engineState, dispatchEvolution };
};

// --- API Client Factory ---
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

// Helper for clients that are not ready due to missing token
const createUnavailableClient = (serviceName, addLog) => {
  const errorMessage = `${serviceName} client not ready: API key missing.`;
  const errorObj = Object.assign(new Error(errorMessage), { code: `NO_${serviceName.toUpperCase()}_KEY` });
  
  // Return an object that mirrors the client's API but always throws
  return new Proxy({}, {
    get: (target, prop) => {
      // Don't log on every access, only when a method is called
      if (typeof prop === 'string' && prop !== 'then' && prop !== 'inspect' && prop !== 'valueOf') {
         return async () => { addLog(`${serviceName.toUpperCase()}: ${errorMessage}`, "le-warn"); throw errorObj; };
      }
      return Reflect.get(target, prop);
    }
  });
};

const useAIIntegrations = (tokens, addLog) => {
  const githubService = useMemo(() => {
    const githubToken = tokens.github;
    if (!githubToken) {
      return createUnavailableClient("GitHub", addLog);
    }
    const githubClient = createApiClient(
      APP_CONFIG.API.GITHUB.API_BASE_URL,
      addLog,
      {
        Authorization: `token ${githubToken.trim()}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      }
    );

    return {
      getFile: async (filePath = APP_CONFIG.GITHUB_REPO.file, signal = null) => {
        const urlPath = `/repos/${APP_CONFIG.GITHUB_REPO.owner}/${APP_CONFIG.GITHUB_REPO.repo}/contents/${filePath}?ref=${APP_CONFIG.GITHUB_REPO.branch}`;
        const response = await githubClient.get(urlPath, {}, `GitHub Fetch ${filePath}`, "nexus", signal);
        if (!response || !response.content) {
          throw Object.assign(new Error(`Failed to fetch file content for ${filePath}. Response: ${JSON.stringify(response)}`), { code: 'GITHUB_FETCH_FAILED' });
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
    const geminiApiKey = tokens.gemini || APP_CONFIG.API.GEMINI.DEFAULT_KEY;
    if (!geminiApiKey) {
      return createUnavailableClient("Gemini", addLog);
    }
    const geminiClient = createApiClient(
      APP_CONFIG.API.GEMINI_BASE_URL,
      addLog,
      { "Content-Type": "application/json" }
    );

    const geminiEndpoint = APP_CONFIG.API.GEMINI.ENDPOINT_PATH.replace("{model}", APP_CONFIG.API.GEMINI.MODEL) + `?key=${geminiApiKey.trim()}`;

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
          throw Object.assign(new Error(`Gemini returned empty content or no valid candidate found for ${stepName}.`), { code: 'GEMINI_EMPTY_RESPONSE' });
        }
        return content;
      }
    };
  }, [tokens.gemini, addLog]);

  const cerebrasService = useMemo(() => {
    const cerebrasToken = tokens.cerebras;
    if (!cerebrasToken) {
      return createUnavailableClient("Cerebras", addLog);
    }
    const cerebrasClient = createApiClient(
      APP_CONFIG.API.CEREBRAS_BASE_URL,
      addLog,
      {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${cerebrasToken.trim()}`
      }
    );

    const buildCerebrasChatCompletionBody = (systemContent, userContent) => ({
      model: APP_CONFIG.API.CEREBRAS.MODEL,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent }
      ]
    });

    return {
      completeChat: async (systemContent, userContent, stepName = "chat completion", signal = null) => {
        const body = buildCerebrasChatCompletionBody(systemContent, userContent);
        const data = await cerebrasClient.post(APP_CONFIG.API.CEREBRAS.ENDPOINT_PATH, { body: JSON.stringify(body) }, `Cerebras ${stepName}`, "quantum", signal);
        const content = data.choices?.[0]?.message?.content || "";
        if (!content) {
          throw Object.assign(new Error(`Cerebras returned empty content or no valid choice found for ${stepName}.`), { code: 'CEREBRAS_EMPTY_RESPONSE' });
        }
        return content;
      }
    };
  }, [tokens.cerebras, addLog]);

  return { github: githubService, gemini: geminiService, cerebras: cerebrasService };
};

// --- Pipeline Step Logic (Siphoned into pure functions) ---
const fetchCoreLogic = async (pipelineContext, { clients, addLog, config }, signal) => {
  addLog("NEXUS: Fetching current core logic from GitHub...", "nexus");
  const result = await clients.github.getFile(config.GITHUB_REPO.file, signal);
  const fetchedCode = utf8B64Decode(result.content);
  addLog(`NEXUS: Fetched core logic (${fetchedCode.length} bytes).`, "ok");

  return {
    context: {
      fetchedCode: fetchedCode,
      fileRef: result
    },
    currentCoreCode: fetchedCode,
    displayCode: fetchedCode,
  };
};

const extractingPatternsLogic = async (pipelineContext, { clients, addLog, config, prompts }, signal) => {
  if (!pipelineContext.fetchedCode) {
    addLog("AI: No core code fetched for pattern extraction. Skipping.", "warn");
    return { context: { quantumPatterns: null } };
  }
  try {
    addLog("AI: Extracting quantum patterns from core logic...", "quantum");
    const cleanCode = sanitizeContent(pipelineContext.fetchedCode, config.CORE_CONTENT_MAX_LENGTH);
    const patterns = await clients.gemini.generateContent(
      prompts.GEMINI_PATTERN,
      [{ text: `CORE: ${cleanCode}` }],
      "pattern extraction",
      signal
    );
    if (!patterns || patterns.trim().length < 10) {
      addLog("AI: No meaningful quantum patterns extracted by Gemini. Synthesis might be less effective.", "warn");
      return { context: { quantumPatterns: null } };
    } else {
      addLog("AI: Quantum patterns extracted.", "quantum");
      return { context: { quantumPatterns: patterns } };
    }
  } catch (e) {
    if (e.code === 'NO_GEMINI_KEY') { // Specific handling for unavailable client
      addLog("Gemini client not ready for pattern extraction. Skipping this step.", "le-warn");
      return { context: { quantumPatterns: null } };
    }
    throw e;
  }
};

const synthesizingDraftLogic = async (pipelineContext, { clients, addLog, config, prompts }, signal) => {
  if (!pipelineContext.fetchedCode) {
    addLog("AI: No core code available for draft synthesis. Skipping.", "warn");
    return { context: { draftCode: null } };
  }
  try {
    addLog("AI: Synthesizing evolutionary draft code...", "quantum");
    const sanitizedFetchedCode = sanitizeContent(pipelineContext.fetchedCode, config.CORE_CONTENT_MAX_LENGTH);
    const userContent = pipelineContext.quantumPatterns
      ? `IMPROVEMENTS: ${pipelineContext.quantumPatterns}\nCORE: ${sanitizedFetchedCode}`
      : `CORE: ${sanitizedFetchedCode}`;

    const rawDraft = await clients.cerebras.completeChat(
      prompts.CEREBRAS_SYNTHESIS,
      userContent,
      "code synthesis",
      signal
    );
    const cleanedDraft = cleanMarkdownCodeBlock(rawDraft);

    if (!cleanedDraft || cleanedDraft.trim().length < config.MIN_SYNTHESIZED_DRAFT_LENGTH) {
      addLog(`AI: Synthesized draft was too short (${cleanedDraft ? cleanedDraft.length : 0} chars) or empty after cleanup. Will proceed with original code for finalization.`, "warn");
      return { context: { draftCode: null } };
    } else {
      addLog("AI: Draft code synthesized.", "quantum");
      return { context: { draftCode: cleanedDraft } };
    }
  } catch (e) {
    if (e.code === 'NO_CEREBRAS_KEY') { // Specific handling for unavailable client
      addLog("Cerebras client not ready for synthesis. Skipping this step.", "le-warn");
      return { context: { draftCode: null } };
    }
    throw e;
  }
};

const finalizingCodeLogic = async (pipelineContext, { clients, addLog, config, prompts }, signal) => {
  const codeForFinalization = pipelineContext.draftCode || pipelineContext.fetchedCode;
  if (!codeForFinalization) {
    throw Object.assign(new Error("No code available for finalization. This indicates a critical upstream failure or missing API keys."), { code: 'NO_CODE_TO_FINALIZE' });
  }
  addLog(`AI: Proceeding with ${pipelineContext.draftCode ? 'Cerebras draft' : 'original core'} for finalization.`, "def");

  try {
    addLog("AI: Finalizing evolved code...", "quantum");
    const rawFinalCode = await clients.gemini.generateContent(
      prompts.GEMINI_FINALIZATION,
      [
        { text: `DRAFT_CODE: ${sanitizeContent(codeForFinalization, config.CORE_CONTENT_MAX_LENGTH)}` },
        { text: `EXISTING_CORE_REFERENCE: ${sanitizeContent(pipelineContext.fetchedCode, config.CORE_CONTENT_MAX_LENGTH)}` }
      ],
      "core finalization",
      signal
    );
    const cleanedFinalCode = cleanMarkdownCodeBlock(rawFinalCode);

    if (!cleanedFinalCode || cleanedFinalCode.trim().length === 0) {
      throw Object.assign(new Error("Finalized code was empty after cleanup, indicating a critical AI failure."), { code: 'GEMINI_EMPTY_RESPONSE_FINAL' });
    }
    addLog("AI: Finalized code generated.", "quantum");

    return {
      context: { evolvedCode: cleanedFinalCode },
      displayCode: cleanedFinalCode,
    };
  } catch (e) {
    if (e.code === 'NO_GEMINI_KEY') { // Specific handling for unavailable client
      addLog("Gemini client not initialized. Cannot finalize code. Evolution halted.", "le-err");
      throw Object.assign(new Error("Gemini API key is required for code finalization."), { code: 'NO_GEMINI_KEY_FINAL' });
    }
    throw e;
  }
};

const validatingSyntaxLogic = async (pipelineContext, { addLog }, signal) => {
  if (signal.aborted) throw Object.assign(new Error("Pipeline aborted."), { name: "AbortError" });

  if (!pipelineContext.evolvedCode) {
    addLog("SYNTAX VALIDATION: No evolved code to validate. Skipping.", "warn");
    throw Object.assign(new Error("Syntax validation skipped: no evolved code to validate."), { code: 'NO_EVOLVED_CODE' });
  }

  addLog("SYNTAX VALIDATION: Checking evolved code syntax...", "def");
  const isValid = validateJavaScriptSyntax(pipelineContext.evolvedCode);
  if (!isValid) {
    throw Object.assign(new Error("Evolved code contains JavaScript syntax errors. Preventing commit."), { code: 'SYNTAX_ERROR' });
  }
  addLog("SYNTAX VALIDATION: Evolved code is syntactically valid.", "ok");
  return { context: { isSyntaxValid: true } };
};

const committingCodeLogic = async (pipelineContext, { clients, addLog, config, isCodeSafeToCommitCheck }, signal) => {
  if (signal.aborted) throw Object.assign(new Error("Pipeline aborted."), { name: "AbortError" });

  if (!pipelineContext.isSyntaxValid) {
    addLog("AI: Code failed syntax validation. No commit.", "le-err");
    return { context: { commitPerformed: false } };
  }

  if (pipelineContext.evolvedCode && isCodeSafeToCommitCheck(pipelineContext.evolvedCode, pipelineContext.fetchedCode)) {
    if (!pipelineContext.fileRef || !pipelineContext.fileRef.sha) {
      throw Object.assign(new Error("Missing file reference (SHA) for committing code. Cannot proceed."), { code: 'MISSING_FILE_SHA' });
    }
    try {
      addLog("NEXUS: Committing evolved code to GitHub...", "nexus");
      await clients.github.updateFile(
        config.GITHUB_REPO.file, pipelineContext.evolvedCode, pipelineContext.fileRef.sha, `DALEK_EVOLUTION_${new Date().toISOString()}`, signal
      );
      addLog("NEXUS: EVOLVED SUCCESSFULLY AND COMMITTED.", "ok");
      
      return {
        context: { commitPerformed: true },
        currentCoreCode: pipelineContext.evolvedCode,
        displayCode: '',
      };
    } catch (e) {
      if (e.code === 'NO_GITHUB_TOKEN') { // Specific handling for unavailable client
        addLog("GitHub token missing. Cannot commit.", "le-err");
        throw Object.assign(new Error("GitHub token is required to commit changes."), { code: 'NO_GITHUB_TOKEN_COMMIT' });
      }
      throw e;
    }
  } else {
    addLog("AI: Evolved code deemed unsafe or unchanged. No commit.", "warn");
    return { context: { commitPerformed: false } };
  }
};

// --- Evolution Pipeline Orchestration ---
const useEvolutionPipelineExecutor = (steps, globalServices, dispatchEvolution) => {
  const abortControllerRef = useRef(null);

  const runPipeline = useCallback(async () => {
    dispatchEvolution({ type: EvolutionActionTypes.MERGE_PIPELINE_CONTEXT, payload: initialPipelineContext });
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    let successfulCommitThisCycle = false;

    try {
      dispatchEvolution({ type: EvolutionActionTypes.SET_STATUS, payload: EvolutionStatus.EVOLUTION_CYCLE_INITIATED });
      globalServices.addLog("AI: PROCESSING EVOLUTION...", "nexus");

      for (const stepDef of steps) {
        if (signal.aborted) {
          globalServices.addLog("EVOLUTION: Abort signal received. Terminating pipeline.", "warn");
          throw Object.assign(new Error("Pipeline aborted."), { name: "AbortError" });
        }

        dispatchEvolution({ type: EvolutionActionTypes.SET_STATUS, payload: stepDef.name });
        globalServices.addLog(`NEXUS: ${stepDef.name.replace(/_/g, ' ')} initiated.`, "nexus");

        try {
          // Pass the current pipeline context from engineStateRef and other global services
          const stepResult = await stepDef.action(
            globalServices.engineStateRef.current.pipeline, // Current pipeline context
            globalServices, // Clients, addLog, config, prompts, isCodeSafeToCommitCheck
            signal
          );
          
          if (stepResult.context) {
            dispatchEvolution({ type: EvolutionActionTypes.MERGE_PIPELINE_CONTEXT, payload: stepResult.context });
          }

          if (stepResult.currentCoreCode !== undefined) {
              dispatchEvolution({ type: EvolutionActionTypes.SET_CURRENT_CORE_CODE, payload: stepResult.currentCoreCode });
          }
          if (stepResult.displayCode !== undefined) {
              dispatchEvolution({ type: EvolutionActionTypes.SET_DISPLAY_CODE, payload: stepResult.displayCode });
          }

          if (stepDef.name === EvolutionStatus.COMMITTING_CODE && stepResult.context?.commitPerformed) {
            successfulCommitThisCycle = true;
          }

          globalServices.addLog(`NEXUS: ${stepDef.name.replace(/_/g, ' ')} completed.`, "ok");
        } catch (stepError) {
          if (stepError.name === 'AbortError') {
            globalServices.addLog(`NEXUS: ${stepDef.name.replace(/_/g, ' ')} ABORTED.`, "warn");
            throw stepError;
          }
          globalServices.addLog(`NEXUS: ${stepDef.name.replace(/_/g, ' ')} FAILED: ${stepError.message}`, "le-err");
          if (!stepDef.allowFailure) {
            throw stepError;
          }
        }
      }
      return { success: true, commitPerformed: successfulCommitThisCycle };
    } catch (e) {
      if (e.name === 'AbortError') {
        globalServices.addLog("NEXUS CYCLE INTERRUPTED BY USER.", "warn");
        return { success: false, commitPerformed: false, aborted: true };
      } else {
        dispatchEvolution({ type: EvolutionActionTypes.SET_ERROR, payload: e });
        globalServices.addLog(`CRITICAL NEXUS PIPELINE FAILURE: ${e.message}`, "le-err");
        return { success: false, commitPerformed: false, aborted: false };
      }
    } finally {
      if (abortControllerRef.current) {
        abortControllerRef.current = null;
      }
    }
  }, [steps, globalServices, dispatchEvolution]);

  const abortPipeline = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      globalServices.addLog("PIPELINE: Explicit abort requested.", "nexus");
    }
  }, [globalServices.addLog]);

  return { runPipeline, abortPipeline };
};

const useContinuousEvolutionLoop = (performEvolutionCallback, isActive, addLog) => {
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
      // Exit if component unmounted or evolution is no longer active
      if (!isMountedRef.current || !isActive) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        return;
      }

      const { success, commitPerformed, aborted } = await performEvolutionCallback();

      // Re-check state after async operation as it might have changed
      if (!isMountedRef.current || !isActive) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        return;
      }

      if (aborted) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
          addLog("NEXUS CYCLE ABORTED. Loop suspended.", "warn");
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
      timeoutRef.current = setTimeout(runCycle, 0); // Start immediately
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        addLog("NEXUS CYCLE PAUSED.", "nexus");
      }
    }

    // Cleanup function for useEffect
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isActive, performEvolutionCallback, addLog]);
};

// --- Main Application Core Hook ---
const useDalekCore = () => {
  const { logs, addLog, clearLogs } = useLogSystem();
  const { tokens, handleTokenChange } = useAppTokens();
  const { engineState, dispatchEvolution } = useEvolutionState();
  const { status, isEvolutionActive, displayCode, error } = engineState;

  const clients = useAIIntegrations(tokens, addLog);

  // Ref to hold the latest engine state for pipeline steps
  const engineStateRef = useRef(engineState);
  useEffect(() => {
    engineStateRef.current = engineState;
  }, [engineState]);

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

  const EVOLUTION_PIPELINE_STEPS = useMemo(() => [
    { name: EvolutionStatus.FETCHING_CORE, allowFailure: false, action: fetchCoreLogic },
    { name: EvolutionStatus.EXTRACTING_PATTERNS, allowFailure: true, action: extractingPatternsLogic }, // Can fail if Gemini key is missing
    { name: EvolutionStatus.SYNTHESIZING_DRAFT, allowFailure: true, action: synthesizingDraftLogic }, // Can fail if Cerebras key is missing
    { name: EvolutionStatus.FINALIZING_CODE, allowFailure: false, action: finalizingCodeLogic },
    { name: EvolutionStatus.VALIDATING_SYNTAX, allowFailure: false, action: validatingSyntaxLogic },
    { name: EvolutionStatus.COMMITTING_CODE, allowFailure: false, action: committingCodeLogic }
  ], []);

  // Consolidate global dependencies passed to pipeline steps
  const globalPipelineServices = useMemo(() => ({
    clients,
    addLog,
    config: APP_CONFIG,
    prompts: PROMPT_INSTRUCTIONS,
    isCodeSafeToCommitCheck: isCodeSafeToCommit,
    engineStateRef, // Pass ref to access current pipeline context within steps
  }), [clients, addLog, isCodeSafeToCommit]);

  const { runPipeline, abortPipeline } = useEvolutionPipelineExecutor(
    EVOLUTION_PIPELINE_STEPS,
    globalPipelineServices,
    dispatchEvolution
  );

  const performEvolutionCycle = useCallback(async () => {
    const { success, commitPerformed, aborted } = await runPipeline();
    // Update main engine status based on pipeline outcome
    if (success && !aborted) { 
      dispatchEvolution({ type: EvolutionActionTypes.SET_STATUS, payload: EvolutionStatus.IDLE });
    } else if (aborted) {
        dispatchEvolution({ type: EvolutionActionTypes.STOP_EVOLUTION }); // Sets status to PAUSED
    }
    // Note: If 'error' happened, SET_ERROR action already changed status to ERROR
    return { success, commitPerformed, aborted };
  }, [runPipeline, dispatchEvolution]); // runPipeline is memoized, dispatchEvolution is stable

  useContinuousEvolutionLoop(performEvolutionCycle, isEvolutionActive, addLog);

  const runEvolution = useCallback(() => {
    try {
      if (!tokens.github) {
        throw Object.assign(new Error("GitHub token missing. Evolution cannot start."), { code: 'NO_GITHUB_TOKEN_INIT' });
      }
      dispatchEvolution({ type: EvolutionActionTypes.START_EVOLUTION });
    } catch (e) {
      addLog(`INITIATION ERROR: ${e.message}`, "le-err");
      dispatchEvolution({ type: EvolutionActionTypes.SET_ERROR, payload: e });
    }
  }, [tokens.github, addLog, dispatchEvolution]);

  const terminateEvolution = useCallback(() => {
    if (isEvolutionActive) {
      abortPipeline(); // Signal pipeline to abort its current run
      addLog("TERMINATION PROTOCOL INITIATED...", "nexus");
      dispatchEvolution({ type: EvolutionActionTypes.STOP_EVOLUTION }); // Set engine to PAUSED status
    } else {
      addLog("NEXUS CYCLE NOT ACTIVE. No termination needed.", "def");
    }
  }, [isEvolutionActive, addLog, dispatchEvolution, abortPipeline]);

  // Initial checks and warnings based on API keys
  useEffect(() => {
    clearLogs();

    if (!tokens.github) {
      addLog("WARNING: GitHub token is missing. Core evolution and commits are disabled.", "le-err");
      addLog("Please provide a GitHub Personal Access Token with 'repo' scope.", "le-err");
    } else {
      addLog("GitHub token detected. Repository access enabled.", "ok");
    }

    const geminiKeyPresent = tokens.gemini || APP_EMBEDDED_API_KEYS.GEMINI;
    if (!geminiKeyPresent) { 
      addLog("WARNING: Gemini API Key is not configured. Full AI capabilities (pattern extraction, finalization) will be degraded.", "le-err");
      addLog("Please insert your Google AI Studio key in the CONFIGURATION section to enable full AI capabilities.", "le-err");
    } else {
      addLog("Gemini API Key detected. Gemini services enabled.", "ok");
    }

    if (!tokens.cerebras) {
      addLog("WARNING: Cerebras AI key is missing. The code synthesis step will be skipped, impacting code generation.", "warn");
      addLog("Please provide a Cerebras API Key to enable advanced code synthesis.", "warn");
    } else {
      addLog("Cerebras AI key detected. Cerebras synthesis enabled.", "ok");
    }
  }, [addLog, clearLogs, tokens.cerebras, tokens.github, tokens.gemini]);

  // Log engine errors when they occur
  useEffect(() => {
    if (error) {
      addLog(`ENGINE ERROR: ${error.message || String(error)}`, "le-err");
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
    currentCoreCode: engineState.currentCoreCode
  };
};

// --- Presentational Components ---
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
  return (
    <div className="panel">
      <div className="panel-hdr">Nexus Configuration</div>
      <div className="panel-body">
        <input
          className="input-field"
          placeholder="GitHub Token"
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
          value={tokens.gemini}
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
          disabled={!tokens.github && !isEvolutionActive}
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

// --- Main App Component ---
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
        />
        <CoreDisplayPanel displayCode={displayCode} />
      </div>
    </div>
  );
}