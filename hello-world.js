import React, { useState, useEffect, useRef, useCallback } from "react";

// --- CONFIGURATION ---
const APP_ID = typeof __app_id !== "undefined" ? __app_id : "dalek-caan-bootstrapper";
const GEMINI_API_KEY = ""; // REQUIRED: INSERT YOUR GOOGLE AI STUDIO KEY HERE

// --- CONSTANTS ---
const EVOLUTION_CYCLE_INTERVAL_MS = 30000; // 30 seconds
const GITHUB_CONTENT_MAX_LENGTH = 4000;
const CORE_CONTENT_MAX_LENGTH = 3000;
const LOG_HISTORY_LIMIT = 40;

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
  catch (e) { return "[BASE64_DECODE_ERR]"; }
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

const cleanMarkdownCodeBlock = (code) => code.replace(/^```[a-z]*\n|```$/g, "").trim();
const sanitizeContent = (content, maxLength) => 
  content.replace(/[^\x20-\x7E\n]/g, "").substring(0, maxLength);

// --- API UTILITIES ---
const githubRequest = async (token, owner, repo, filePath, method, body = {}, sha = null, branch = "main") => {
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
};

const geminiRequest = async (systemInstruction, parts) => {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured. Please insert your Google AI Studio key.");
  }
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
  const res = await safeFetch(geminiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      systemInstruction: { parts: [{ text: systemInstruction }] }
    })
  });
  return res.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

const cerebrasRequest = async (token, systemContent, userContent) => {
  if (!token) throw new Error("Cerebras API key is not configured.");
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
  return data.choices[0].message.content;
};

// --- COMPONENTS ---
const DalekHeader = ({ isLoading }) => (
  <div className="header">
    <div className="title">DALEK CAAN :: BOOTSTRAPPER</div>
    <div style={{fontSize: '0.7rem'}}>{isLoading ? "REWRITING..." : "CORE_STABLE"}</div>
  </div>
);

const NexusControlPanel = ({
  tokens, setTokens, config, 
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
          onChange={e => setTokens(p => ({...p, github: e.target.value}))} 
          value={tokens.github}
        />
        <input 
          className="input-field" 
          placeholder="Cerebras Key" 
          type="password" 
          onChange={e => setTokens(p => ({...p, cerebras: e.target.value}))} 
          value={tokens.cerebras}
        />
        <div style={{fontSize: '0.6rem', color: 'var(--red-dim)'}}>TARGET: {`${config.owner}/${config.repo}/${config.file}`}</div>

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
};

const CoreDisplayPanel = ({ displayCode }) => (
  <div className="panel">
    <div className="panel-hdr">Live Core Logic</div>
    <pre className="code-view">{displayCode || "// Awaiting sequence initialization..."}</pre>
  </div>
);

// --- MAIN APP COMPONENT ---
export default function App() {
  const [tokens, setTokens] = useState({ cerebras: "", github: "" });
  const [config] = useState({ // Fixed config, not directly user-editable via UI in this version
    owner: "craighckby-stack", 
    repo: "Test-1", 
    branch: "Nexus-Database", 
    file: "hello-world.js" 
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [displayCode, setDisplayCode] = useState("");

  const activeRef = useRef(false);
  const codeRef = useRef(""); // Stores the current code from GitHub for AI processing

  const addLog = useCallback((msg, type = "def") => {
    setLogs((p) => [{ text: `[${new Date().toLocaleTimeString()}] ${msg}`, type }, ...p.slice(0, LOG_HISTORY_LIMIT -1)]);
  }, []);

  const callAIChain = useCallback(async (currentCodeFromGithub) => {
    addLog("INITIATING QUANTUM ANALYSIS...", "quantum");
    
    let quantumPatterns = "";
    let draftCode = "";
    
    // Sanitize and truncate inputs for AI
    const cleanCurrentCode = sanitizeContent(currentCodeFromGithub, CORE_CONTENT_MAX_LENGTH);
    // Note: If an external 'nodeContent' was provided, it would be sanitized here
    // For this app, the 'source' is the 'core' itself for self-evolution.
    const cleanSourceContent = sanitizeContent(currentCodeFromGithub, GITHUB_CONTENT_MAX_LENGTH); 

    // 1. Gemini: Extract Patterns
    try {
      addLog("GEMINI: EXTRACTING PATTERNS...", "quantum");
      quantumPatterns = await geminiRequest(
        "Extract 5 architectural logic improvements from source to apply to core. Return bullet points ONLY.",
        [{ text: `CORE: ${cleanCurrentCode}\nSOURCE: ${cleanSourceContent}` }]
      );
      if (!quantumPatterns) throw new Error("No useful patterns extracted.");
      addLog("GEMINI: PATTERNS EXTRACTED", "ok");
    } catch (e) { 
      addLog(`GEMINI PATTERN FAIL: ${e.message}`, "le-err"); 
      quantumPatterns = ""; // Ensure it's empty on critical failure
    }

    // 2. Cerebras: Synthesize Draft (only if Cerebras key and patterns are available)
    if (tokens.cerebras && quantumPatterns) {
      try {
        addLog("CEREBRAS: SYNTHESIZING DRAFT...", "def");
        draftCode = await cerebrasRequest(
          tokens.cerebras,
          "Expert Dalek Caan Architect. Merge logic improvements. PURE CODE ONLY.",
          `IMPROVEMENTS: ${quantumPatterns}\nCORE: ${cleanCurrentCode}`
        );
        if (!draftCode) throw new Error("No draft code synthesized.");
        addLog("CEREBRAS: DRAFT SYNTHESIZED", "ok");
      } catch (e) { 
        addLog(`CEREBRAS FAIL: ${e.message}`, "le-err"); 
        draftCode = ""; // Ensure it's empty on critical failure
      }
    } else if (!tokens.cerebras) {
      addLog("CEREBRAS skipped: API key missing.", "le-err");
    } else { // !quantumPatterns
      addLog("CEREBRAS skipped: No quantum patterns to apply.", "def");
    }

    // Determine the code to send to Gemini for finalization
    let codeToFinalize = draftCode || cleanCurrentCode;
    if (!draftCode) {
        addLog("AI: Using current core as base for finalization due to previous failures or skips.", "def");
    }

    // 3. Gemini: Finalize and Seal Core
    try {
      addLog("GEMINI: SEALING CORE...", "ok");
      const finalCode = await geminiRequest(
        "ACT AS: Dalek Caan Architect. Finalize the evolved source code. NO MARKDOWN. NO BACKTICKS. Preserve all API keys, styles, and the React structure. Output ONLY pure JavaScript.",
        [{ text: `DRAFT_CODE: ${codeToFinalize}\nEXISTING_CORE: ${cleanCurrentCode}` }]
      );
      // Even with strict instructions, a final cleanup is a good safeguard.
      return cleanMarkdownCodeBlock(finalCode);
    } catch (e) {
      addLog(`GEMINI SEAL FAIL: ${e.message}. Returning best effort.`, "le-err");
      return cleanMarkdownCodeBlock(codeToFinalize); // Return best effort, cleaned.
    }
  }, [addLog, tokens.cerebras]); // Depend on addLog and cerebras token

  const runEvolution = useCallback(async () => {
    if (!tokens.github || !GEMINI_API_KEY) {
      addLog("MISSING REQUIRED API KEYS/TOKENS. Evolution halted. Check GitHub Token and GEMINI_API_KEY.", "le-err");
      return;
    }

    activeRef.current = true;
    setLoading(true);
    addLog("INITIATING NEXUS CYCLE...", "nexus");

    while (activeRef.current) {
      try {
        // 1. Fetch current file
        addLog("GITHUB: FETCHING CORE...", "nexus");
        const fileRef = await githubRequest(
          tokens.github, config.owner, config.repo, config.file, "GET"
        );
        const currentCode = utf8B64Decode(fileRef.content);
        codeRef.current = currentCode; // Update ref for AI chain
        setDisplayCode(currentCode); // Display current code

        // 2. Call AI Chain for evolution
        addLog("AI: PROCESSING EVOLUTION...", "nexus");
        const evolvedCode = await callAIChain(currentCode);

        // Safety check for code integrity
        if (!evolvedCode || evolvedCode.length < 500) { // Minimum reasonable code length
          addLog("Evolution safety trigger: Evolved code too short or empty. Retaining current core.", "le-err");
          await wait(EVOLUTION_CYCLE_INTERVAL_MS / 2); // Short wait before re-attempt
          continue; // Skip commit, try again sooner
        }

        if (evolvedCode === currentCode) {
            addLog("AI: Code unchanged, awaiting new patterns or external stimulus.", "def");
        } else {
            addLog("AI: Evolution complete. New code generated.", "ok");
            // 3. Commit evolved code back to GitHub
            addLog("GITHUB: COMMITTING EVOLVED CORE...", "nexus");
            await githubRequest(
                tokens.github, config.owner, config.repo, config.file, "PUT",
                { content: evolvedCode, message: `DALEK_EVOLUTION_${Date.now()}` },
                fileRef.sha, config.branch
            );
            addLog("NEXUS EVOLVED SUCCESSFULLY", "ok");
        }

        await wait(EVOLUTION_CYCLE_INTERVAL_MS); // Wait before next cycle
      } catch (e) {
        addLog(`CRITICAL NEXUS FAILURE: ${e.message}. Halting cycle.`, "le-err");
        activeRef.current = false; // Stop the loop on critical error
      }
    }
    setLoading(false);
    addLog("NEXUS CYCLE TERMINATED.", "nexus");
  }, [addLog, tokens.github, config, callAIChain]);

  const terminateEvolution = useCallback(() => {
    if (activeRef.current) {
      activeRef.current = false;
      addLog("TERMINATION PROTOCOL INITIATED...", "nexus");
    } else {
      addLog("NEXUS CYCLE NOT ACTIVE.", "def");
    }
  }, [addLog]);

  // Initial check for global GEMINI_API_KEY
  useEffect(() => {
    if (!GEMINI_API_KEY) {
      addLog("WARNING: GEMINI_API_KEY is not configured.", "le-err");
      addLog("Please insert your Google AI Studio key in the CONFIGURATION section.", "le-err");
    }
  }, [addLog]);

  return (
    <div className="dalek-shell">
      <style>{GLOBAL_STYLES}</style>
      <DalekHeader isLoading={loading} />

      <div className="main-container">
        <NexusControlPanel 
          tokens={tokens} 
          setTokens={setTokens} 
          config={config}
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