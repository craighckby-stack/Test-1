import React, { useState, useEffect, useRef, useCallback } from "react";

// --- CONFIGURATION ---
const appId = typeof __app_id !== "undefined" ? __app_id : "dalek-caan-bootstrapper";
const geminiApiKey = ""; // REQUIRED: INSERT YOUR GOOGLE AI STUDIO KEY HERE

const STYLES = `
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

export default function App() {
  const [tokens, setTokens] = useState({ cerebras: "", github: "" });
  const [config, setConfig] = useState({ 
    owner: "craighckby-stack", 
    repo: "Test-1", 
    branch: "Nexus-Database", 
    file: "hello-world.js" 
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [displayCode, setDisplayCode] = useState("");

  const activeRef = useRef(false);
  const codeRef = useRef("");

  const addLog = useCallback((msg, type = "def") => {
    setLogs((p) => [{ text: `[${new Date().toLocaleTimeString()}] ${msg}`, type }, ...p.slice(0, 40)]);
  }, []);

  const safeFetch = async (url, options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "API Error");
        return result;
      } catch (e) {
        if (i === retries - 1) throw e;
        await wait(1000 * (i + 1));
      }
    }
  };

  const callAIChain = async (nodeContent) => {
    let quantumPatterns = "";
    let draft = "";
    
    const cleanContent = nodeContent.replace(/[^\x20-\x7E\n]/g, "").substring(0, 4000);
    const cleanCore = codeRef.current.replace(/[^\x20-\x7E\n]/g, "").substring(0, 3000);

    addLog("GEMINI: EXTRACTING PATTERNS...", "quantum");
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`;
      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `CORE: ${cleanCore}\nSOURCE: ${cleanContent}` }] }],
          systemInstruction: { parts: [{ text: "Extract 5 architectural logic improvements from source to apply to core. Return bullet points ONLY." }] }
        })
      });
      const data = await res.json();
      quantumPatterns = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (e) { addLog("GEMINI PATTERN FAIL", "le-err"); }

    if (tokens.cerebras) {
      addLog("CEREBRAS: SYNTHESIZING...", "def");
      try {
        const data = await safeFetch("https://api.cerebras.ai/v1/chat/completions", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${tokens.cerebras.trim()}` 
          },
          body: JSON.stringify({
            model: "llama3.1-70b",
            messages: [
              { role: "system", content: "Expert Dalek Caan Architect. Merge logic improvements. PURE CODE ONLY." }, 
              { role: "user", content: `IMPROVEMENTS: ${quantumPatterns}\nCORE: ${cleanCore}` }
            ]
          })
        });
        draft = data.choices[0].message.content;
      } catch (e) { addLog("CEREBRAS FAIL", "le-err"); }
    }

    addLog("GEMINI: SEALING CORE...", "ok");
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`;
      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `DRAFT_CODE: ${draft}\nEXISTING_CORE: ${cleanCore}` }] }],
          systemInstruction: {
            parts: [{
              text: "ACT AS: Dalek Caan Architect. Finalize the evolved source code. NO MARKDOWN. NO BACKTICKS. Preserve all API keys, styles, and the React structure. Output ONLY pure JavaScript."
            }]
          }
        })
      });
      const data = await res.json();
      const finalCode = data.candidates?.[0]?.content?.parts?.[0]?.text || draft;
      return finalCode.replace(/^```[a-z]*\n|```$/g, "").trim();
    } catch (e) {
      addLog("GEMINI SEAL FAIL", "le-err");
      return draft;
    }
  };

  const runEvolution = async () => {
    if (!tokens.github || !geminiApiKey) {
      addLog("MISSING API KEYS/TOKENS", "le-err");
      return;
    }

    activeRef.current = true;
    setLoading(true);

    while (activeRef.current) {
      addLog("INITIATING NEXUS CYCLE...", "nexus");
      try {
        const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.file}`;
        const headers = {
          Authorization: `token ${tokens.github.trim()}`,
          Accept: "application/vnd.github.v3+json"
        };

        const fileRef = await safeFetch(url, { headers });
        const currentCode = utf8B64Decode(fileRef.content);
        codeRef.current = currentCode;
        setDisplayCode(currentCode);

        const evolved = await callAIChain(currentCode);

        if (!evolved || evolved.length < 500) {
          throw new Error("Evolution safety trigger: Code too short.");
        }

        await safeFetch(url, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            message: `DALEK_EVOLUTION_${Date.now()}`,
            content: utf8B64Encode(evolved),
            sha: fileRef.sha,
            branch: config.branch
          })
        });

        addLog("NEXUS EVOLVED SUCCESSFULLY", "ok");
        await wait(30000); 
      } catch (e) {
        addLog(`CRITICAL: ${e.message}`, "le-err");
        activeRef.current = false;
      }
    }
    setLoading(false);
  };

  return (
    <div className="dalek-shell">
      <style>{STYLES}</style>
      <div className="header">
        <div className="title">DALEK CAAN :: BOOTSTRAPPER</div>
        <div style={{fontSize: '0.7rem'}}>{loading ? "REWRITING..." : "CORE_STABLE"}</div>
      </div>

      <div className="main-container">
        <div className="panel">
          <div className="panel-hdr">Nexus Configuration</div>
          <div className="panel-body">
            <input className="input-field" placeholder="GitHub Token" type="password" onChange={e => setTokens({...tokens, github: e.target.value})} />
            <input className="input-field" placeholder="Cerebras Key" type="password" onChange={e => setTokens({...tokens, cerebras: e.target.value})} />
            <div style={{fontSize: '0.6rem', color: 'var(--red-dim)'}}>TARGET: {`${config.owner}/${config.repo}`}</div>

            <button className={`btn-go ${loading ? 'btn-stop' : ''}`} onClick={() => {
              if (loading) activeRef.current = false;
              else runEvolution();
            }}>
              {loading ? "TERMINATE" : "EVOLVE"}
            </button>

            <div className="log-wrap">
              {logs.map((l, i) => (
                <div key={i} className={`le le-${l.type}`}>{l.text}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-hdr">Live Core Logic</div>
          <pre className="code-view">{displayCode || "// Awaiting sequence initialization..."}</pre>
        </div>
      </div>
    </div>
  );
}

