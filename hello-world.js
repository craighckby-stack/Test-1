import React, { useState, useEffect, useRef, useCallback, useReducer, memo } from "react";

// --- CONFIGURATION ---
const GEMINI_API_KEY = ""; // REQUIRED: INSERT YOUR GOOGLE AI STUDIO KEY HERE

// Static configuration for the GitHub repository
const GITHUB_REPO_CONFIG = {
  owner: "craighckby-stack",
  repo: "Test-1",
  branch: "Nexus-Database",
  file: "hello-world.js"
};

// --- CONSTANTS ---
const EVOLUTION_CYCLE_INTERVAL_MS = 30000; // 30 seconds
const GITHUB_CONTENT_MAX_LENGTH = 4000; // Max length for content fetched from GitHub
const CORE_CONTENT_MAX_LENGTH = 3000;   // Max length for core logic sent to AIs for processing
const LOG_HISTORY_LIMIT = 40;
const MIN_EVOLVED_CODE_LENGTH = 500;   // Safety check for generated code

// AI System Instructions
const GEMINI_PATTERN_INSTRUCTION = "Extract 5 architectural logic improvements from source to apply to core. Return bullet points ONLY.";
const CEREBRAS_SYNTHESIS_INSTRUCTION = "Expert Dalek Caan Architect. Merge logic improvements. PURE CODE ONLY. Ensure all original React structure, API keys, and configurations are preserved and correctly integrated, especially if they are at the top-level of the module. Do NOT wrap the entire code in a function. Output ONLY the raw JavaScript file content.";
const GEMINI_FINALIZATION_INSTRUCTION = "ACT AS: Dalek Caan Architect. Finalize the evolved source code. NO MARKDOWN. NO BACKTICKS. Preserve all API keys, styles, and the React structure. Output ONLY pure JavaScript. Do NOT wrap the entire code in a function. Output ONLY the raw JavaScript file content.";

// --- STYLES ---
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

// --- HELPERS ---
const utf8B64Encode = (str) => btoa(unescape(encodeURIComponent(str)));
const utf8B64Decode = (b64) => {
  try { return decodeURIComponent(escape(atob(b64.replace(/\s/g, "")))); }
  catch (e) { return `[BASE64_DECODE_ERR: ${e.message}]`; } // More informative error
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
      await wait(1000 * (i + 1)); // Exponential backoff
    }
  }
};

const cleanMarkdownCodeBlock = (code) => {
  if (!code) return "";
  const cleaned = code.replace(/^```[a-z]*\n|```$/g, "").trim();
  return cleaned;
};
const sanitizeContent = (content, maxLength) =>
  content ? content.replace(/[^\x20-\x7E\n]/g, "").substring(0, maxLength) : "";

// --- STATE MANAGEMENT ---
const logReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_LOG':
      return [{ text: `[${new Date().toLocaleTimeString()}] ${action.payload.msg}`, type: action.payload.type }, ...state.slice(0, LOG_HISTORY_LIMIT - 1)];
    case 'CLEAR_LOGS':
      return [];
    default:
      return state;
  }
};

// --- API UTILITIES (CUSTOM HOOKS) ---

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

const useGeminiApi = (apiKey, addLog) => {
  const generateContent = useCallback(async (systemInstruction, parts) => {
    if (!apiKey) {
      throw new Error("Gemini API key is missing. Cannot generate content.");
    }
    addLog("GEMINI: Generating content...", "quantum");
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
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
      addLog("GEMINI: No content generated. AI response was empty.", "def");
    }
    return content;
  }, [apiKey, addLog]);

  return { generateContent };
};

const useCerebrasApi = (token, addLog) => {
  const completeChat = useCallback(async (systemContent, userContent) => {
    if (!token) {
      throw new Error("Cerebras API key is missing. Cannot complete chat.");
    }
    addLog("CEREBRAS: Completing chat...", "def");
    const data = await safeFetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token.trim()}`
      },
      body: JSON.stringify({
        model: "llama3.1-70b",
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: userContent }
        ]
      })
    });
    const content = data.choices[0].message.content;
    if (!content) {
      addLog("CEREBRAS: No content generated. AI response was empty.", "def");
    }
    return content;
  }, [token, addLog]);

  return { completeChat };
};

// --- COMPONENTS ---
const DalekHeader = memo(({ isLoading }) => (
  <div className="header">
    <div className="title">DALEK CAAN :: BOOTSTRAPPER</div>
    <div style={{ fontSize: '0.7rem' }}>{isLoading ? "REWRITING CORE LOGIC..." : "CORE_STABLE"}</div>
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
        />
        <input
          className="input-field"
          placeholder="Cerebras Key (Optional for synthesis)"
          type="password"
          onChange={e => setTokens(p => ({ ...p, cerebras: e.target.value }))}
          value={tokens.cerebras}
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

// --- MAIN APP COMPONENT ---
export default function App() {
  const [tokens, setTokens] = useState({ cerebras: "", github: "" });
  const [logs, dispatchLog] = useReducer(logReducer, []);
  const [loading, setLoading] = useState(false);
  const [displayCode, setDisplayCode] = useState("");

  const activeRef = useRef(false);
  // displayCodeRef is crucial for callbacks to read the *latest* displayCode without stale closures
  const displayCodeRef = useRef(""); 

  // Update the ref whenever displayCode changes, ensuring callbacks have the freshest value
  useEffect(() => {
    displayCodeRef.current = displayCode;
  }, [displayCode]);

  const addLog = useCallback((msg, type = "def") => {
    dispatchLog({ type: 'ADD_LOG', payload: { msg, type } });
  }, []);

  const githubApi = useGithubApi(tokens.github, GITHUB_REPO_CONFIG.owner, GITHUB_REPO_CONFIG.repo, GITHUB_REPO_CONFIG.branch, addLog);
  const geminiApi = useGeminiApi(GEMINI_API_KEY, addLog);
  const cerebrasApi = useCerebrasApi(tokens.cerebras, addLog);

  const callAIChain = useCallback(async (currentCodeFromGithub) => {
    addLog("INITIATING QUANTUM ANALYSIS...", "quantum");

    let quantumPatterns = null;
    let draftCode = null;
    // finalCodeOutput defaults to the original code, providing a robust fallback
    let finalCodeOutput = currentCodeFromGithub; 

    // Sanitize current code for AI inputs, applying specific length limits
    const cleanCurrentCodeForGemini = sanitizeContent(currentCodeFromGithub, CORE_CONTENT_MAX_LENGTH);
    const cleanCurrentCodeForCerebras = sanitizeContent(currentCodeFromGithub, CORE_CONTENT_MAX_LENGTH);

    // 1. Gemini: Extract Patterns
    try {
      addLog("GEMINI: EXTRACTING PATTERNS...", "quantum");
      quantumPatterns = await geminiApi.generateContent(
        GEMINI_PATTERN_INSTRUCTION,
        [{ text: `CORE: ${cleanCurrentCodeForGemini}` }]
      );
      if (!quantumPatterns || quantumPatterns.trim().length === 0) {
        addLog("GEMINI: Pattern extraction yielded no results.", "def");
        quantumPatterns = null; // Ensure it's explicitly null if empty
      } else {
        addLog("GEMINI: PATTERNS EXTRACTED", "ok");
      }
    } catch (e) {
      addLog(`GEMINI PATTERN EXTRACTION FAILED: ${e.message}. Skipping pattern application.`, "le-err");
      quantumPatterns = null;
    }

    // 2. Cerebras: Synthesize Draft - Only if Cerebras token and patterns are available
    if (tokens.cerebras) {
      if (quantumPatterns) {
        try {
          addLog("CEREBRAS: SYNTHESIZING DRAFT...", "def");
          const rawDraftCode = await cerebrasApi.completeChat(
            CEREBRAS_SYNTHESIS_INSTRUCTION,
            `IMPROVEMENTS: ${quantumPatterns}\nCORE: ${cleanCurrentCodeForCerebras}`
          );
          draftCode = cleanMarkdownCodeBlock(rawDraftCode);
          if (!draftCode || draftCode.trim().length === 0) {
            addLog("CEREBRAS: No draft code synthesized. Using original core for finalization.", "def");
            draftCode = null;
          } else {
            addLog("CEREBRAS: DRAFT SYNTHESIZED", "ok");
          }
        } catch (e) {
          addLog(`CEREBRAS DRAFT SYNTHESIS FAILED: ${e.message}. Using original core for finalization.`, "le-err");
          draftCode = null;
        }
      } else {
        addLog("CEREBRAS: Synthesis skipped. No quantum patterns available for merging.", "def");
      }
    } else {
      addLog("CEREBRAS: Synthesis skipped. Cerebras API key missing.", "warn");
    }

    // Determine the base code for Gemini finalization: prefer draft, fallback to original GitHub content
    let codeToFinalize = draftCode || currentCodeFromGithub;
    addLog(`AI: Proceeding with ${draftCode ? 'Cerebras draft' : 'original core'} for finalization.`, "def");
    
    // Sanitize the code chosen for finalization for Gemini, ensuring length limits
    const cleanCodeToFinalize = sanitizeContent(codeToFinalize, CORE_CONTENT_MAX_LENGTH);

    // 3. Gemini: Finalize and Seal Core
    try {
      addLog("GEMINI: SEALING CORE...", "quantum");
      const rawFinalCode = await geminiApi.generateContent(
        GEMINI_FINALIZATION_INSTRUCTION,
        [{ text: `DRAFT_CODE: ${cleanCodeToFinalize}\nEXISTING_CORE: ${cleanCurrentCodeForGemini}` }]
      );
      const cleanedFinalCode = cleanMarkdownCodeBlock(rawFinalCode);
      if (!cleanedFinalCode || cleanedFinalCode.trim().length === 0) {
        addLog("GEMINI: Finalization yielded empty code. Reverting to prior state.", "le-err");
        finalCodeOutput = codeToFinalize; // Fallback to the code that was supposed to be finalized
      } else {
        finalCodeOutput = cleanedFinalCode;
        addLog("GEMINI: CORE SEALED", "ok");
      }
    } catch (e) {
      addLog(`GEMINI CORE SEALING FAILED: ${e.message}. Returning best effort (prior state).`, "le-err");
      finalCodeOutput = codeToFinalize; // Fallback to the code that was supposed to be finalized
    }
    
    return finalCodeOutput; 
  }, [addLog, tokens.cerebras, cerebrasApi, geminiApi]);

  const validateInitialEvolutionConfig = useCallback(() => {
    if (!tokens.github) {
      addLog("MISSING GITHUB TOKEN. Evolution halted.", "le-err");
      return false;
    }
    if (!GEMINI_API_KEY) {
      addLog("MISSING GEMINI_API_KEY. Evolution halted. Please insert your Google AI Studio key.", "le-err");
      return false;
    }
    return true;
  }, [addLog, tokens.github]);

  const isCodeSafeToCommit = useCallback((evolvedCode, currentCode) => {
    if (!evolvedCode || evolvedCode.length < MIN_EVOLVED_CODE_LENGTH) {
      addLog(`EVOLUTION SAFETY TRIGGER: Evolved code too short (${evolvedCode ? evolvedCode.length : 0} chars). Retaining current core.`, "le-err");
      return false;
    }
    if (evolvedCode.trim() === currentCode.trim()) {
      addLog("AI: Core logic unchanged after evolution. No commit necessary.", "def");
      return false; // Not unsafe, but not worth committing
    }
    return true;
  }, [addLog]);

  const runEvolution = useCallback(async () => {
    if (!validateInitialEvolutionConfig()) {
      return;
    }

    activeRef.current = true;
    setLoading(true);
    dispatchLog({ type: 'CLEAR_LOGS' });
    addLog("INITIATING NEXUS CYCLE...", "nexus");

    const performSingleEvolutionStep = async () => {
      let fileRef = null;
      let currentCodeFromGithub = "";
      let evolvedCode = "";
      let stepSuccessful = false;
      let commitPerformed = false;
      let codeToDisplayAtEndOfStep = displayCodeRef.current; // Initial fallback to current UI state

      try {
        addLog("GITHUB: Fetching current core logic...", "nexus");
        fileRef = await githubApi.getFile(GITHUB_REPO_CONFIG.file);
        currentCodeFromGithub = utf8B64Decode(fileRef.content);
        
        // This is the new baseline for display. Update immediately to show the fetched code.
        codeToDisplayAtEndOfStep = currentCodeFromGithub; 
        setDisplayCode(currentCodeFromGithub); 

        addLog("AI: PROCESSING EVOLUTION...", "nexus");
        evolvedCode = await callAIChain(currentCodeFromGithub);
        
        if (!isCodeSafeToCommit(evolvedCode, currentCodeFromGithub)) {
          addLog("AI: Evolved code deemed unsafe or unchanged. No commit.", "warn");
          // If unsafe/unchanged, `codeToDisplayAtEndOfStep` correctly remains `currentCodeFromGithub`
          stepSuccessful = true; 
        } else {
          addLog("AI: Evolution complete. New code generated and validated.", "ok");
          await githubApi.updateFile(
            GITHUB_REPO_CONFIG.file, evolvedCode, fileRef.sha, `DALEK_EVOLUTION_${Date.now()}`
          );
          addLog("NEXUS EVOLVED SUCCESSFULLY AND COMMITTED", "ok");
          codeToDisplayAtEndOfStep = evolvedCode; // Update to show the committed evolved code
          commitPerformed = true;
          stepSuccessful = true;
        }
      } catch (e) {
        addLog(`CRITICAL NEXUS FAILURE DURING STEP: ${e.message}`, "le-err");
        // On error, revert the display to the last successfully fetched code from GitHub (if available)
        // or the previous UI state if even fetching failed.
        if (currentCodeFromGithub) {
          codeToDisplayAtEndOfStep = currentCodeFromGithub;
        } else {
          codeToDisplayAtEndOfStep = displayCodeRef.current; // Fallback to what was last seen in UI
        }
        stepSuccessful = false;
      } finally {
        // Ensure display is updated if the final state for display is different from what was shown post-fetch
        if (displayCodeRef.current !== codeToDisplayAtEndOfStep) {
          setDisplayCode(codeToDisplayAtEndOfStep);
        }
      }
      return { stepSuccessful, commitPerformed };
    };

    while (activeRef.current) {
      const { stepSuccessful, commitPerformed } = await performSingleEvolutionStep();
      if (!activeRef.current) { // Check again if termination was requested during the step
        break;
      }
      
      if (stepSuccessful) {
        if (commitPerformed) {
          addLog(`NEXUS CYCLE COMPLETE. Waiting for next evolution in ${EVOLUTION_CYCLE_INTERVAL_MS / 1000}s.`, "nexus");
        } else {
          addLog(`NEXUS CYCLE COMPLETE (no commit). Waiting for next evolution in ${EVOLUTION_CYCLE_INTERVAL_MS / 1000}s.`, "nexus");
        }
        await wait(EVOLUTION_CYCLE_INTERVAL_MS);
      } else {
        // If a step failed (e.g., API error), log and wait, then try again
        addLog(`NEXUS CYCLE FAILED. Retrying in ${EVOLUTION_CYCLE_INTERVAL_MS / 2 / 1000}s.`, "nexus");
        await wait(EVOLUTION_CYCLE_INTERVAL_MS / 2); // Shorter wait for recovery
      }
    }
    setLoading(false);
    addLog("NEXUS CYCLE TERMINATED.", "nexus");
  }, [addLog, callAIChain, validateInitialEvolutionConfig, isCodeSafeToCommit, githubApi, setDisplayCode]); 

  const terminateEvolution = useCallback(() => {
    if (activeRef.current) {
      activeRef.current = false;
      addLog("TERMINATION PROTOCOL INITIATED...", "nexus");
    } else {
      addLog("NEXUS CYCLE NOT ACTIVE.", "def");
    }
  }, [addLog]);

  // Initial warnings on load
  useEffect(() => {
    if (!GEMINI_API_KEY) {
      addLog("WARNING: GEMINI_API_KEY is not configured.", "le-err");
      addLog("Please insert your Google AI Studio key in the CONFIGURATION section to enable full AI capabilities.", "le-err");
    }
    if (!tokens.cerebras) {
      addLog("WARNING: Cerebras AI key is missing. The synthesis step will be skipped, impacting code generation.", "warn");
    }
  }, [addLog, tokens.cerebras]);

  return (
    <div className="dalek-shell">
      <style>{GLOBAL_STYLES}</style>
      <DalekHeader isLoading={loading} />

      <div className="main-container">
        <NexusControlPanel
          tokens={tokens}
          setTokens={setTokens}
          repoConfig={GITHUB_REPO_CONFIG}
          isLoading={loading}
          logs={logs}
          runEvolution={runEvolution}
          terminateEvolution={terminateEvolution}
        />
        <CoreDisplayPanel displayCode={displayCode} />
      </div>
    </div>
  );
}