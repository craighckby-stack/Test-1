import React, { useState, useEffect, useRef, useCallback } from "react";

const appId = typeof __app_id !== "undefined" ? __app_id : "dalek-caan-bootstrapper";
const geminiApiKey = ""; 

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --red:#ff0000; --red-dim:#660000; --red-dark:#1a0000;
    --white:#ffffff;
    --panel-bg:rgba(5, 0, 0, 0.98);
    --font-mono:'Share Tech Mono',monospace;
    --font-display:'Orbitron',monospace;
  }
  body { background:#000; color:var(--red); font-family:var(--font-mono); overflow-x:hidden; }

  .dalek-shell {
    min-height:100vh;
    background: 
      radial-gradient(circle at 50% 50%, var(--red-dark) 0%, #000 90%),
      repeating-linear-gradient(0deg, rgba(255,0,0,0.02) 0px, rgba(255,0,0,0.02) 1px, transparent 1px, transparent 2px);
    padding:1.5rem; display:flex; flex-direction:column; align-items:center; gap:1.25rem;
  }

  .header {
    width:100%; max-width:1500px; display:flex; align-items:center;
    justify-content:space-between; border-bottom:2px solid var(--red-dim); padding-bottom:1rem;
  }
  .title-block { display: flex; flex-direction: column; }
  .title {
    font-family:var(--font-display); font-size:1.8rem; font-weight:900;
    letter-spacing:0.4em; text-shadow:0 0 15px var(--red);
    color: var(--red);
  }
  .author-tag {
    font-size: 0.6rem; letter-spacing: 0.2em; color: var(--red-dim); font-weight: bold;
    margin-top: -5px;
  }

  .main-container {
    display:grid; grid-template-columns:430px 1fr;
    gap:1.25rem; width:100%; max-width:1500px; height:calc(100vh - 140px); min-height:600px;
  }
  @media(max-width:1100px){ .main-container{ grid-template-columns:1fr; height:auto; } }

  .panel {
    border:2px solid var(--red-dim); background:var(--panel-bg);
    border-radius:2px; display:flex; flex-direction:column; overflow:hidden;
    position: relative;
  }
  .panel-hdr {
    padding:.7rem 1rem; background: var(--red-dark);
    border-bottom: 1px solid var(--red-dim);
    color:var(--red); font-family:var(--font-display); font-weight:900;
    font-size:.65rem; letter-spacing:.25em; text-transform:uppercase;
    display:flex; justify-content:space-between; align-items:center;
  }
  .panel-body { padding:1.2rem; flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:.7rem; }

  label { font-size:.6rem; color:var(--red); text-transform:uppercase; letter-spacing:.15em; margin-bottom:2px; font-weight: bold; margin-top: 4px;}
  .input-field {
    background:#000; border:1px solid var(--red-dim); color:var(--red);
    font-family:var(--font-mono); padding:.6rem .8rem; width:100%;
    outline:none; border-radius:0px; font-size:.85rem;
  }

  .btn-group { display: flex; gap: 8px; margin-top: 10px; }
  .btn-go {
    background:var(--red); color:#000; border:none; padding:1rem;
    font-family:var(--font-display); font-weight:900; font-size:.7rem;
    cursor:pointer; flex: 2; letter-spacing:.3em; text-transform:uppercase;
  }
  .btn-go:hover:not(:disabled) { background: var(--white); }
  .btn-go:disabled{ opacity:.3; cursor:not-allowed; }
  .btn-stop { background:#330000; color:var(--red); border:1px solid var(--red); }

  .log-wrap {
    flex:1; overflow-y:auto; background: rgba(0,0,0,0.8); margin-top:.5rem; padding:.5rem; 
    display:flex; flex-direction:column; gap:4px; font-size: 0.65rem; border: 1px solid var(--red-dark);
  }
  .le { border-left: 3px solid var(--red-dim); padding-left: 10px; color: #cc0000; }
  .le-err { color: #ff5555; border-left-color: #ff0000; font-weight: bold; }
  .le-ok { color: var(--white); border-left-color: var(--red); }
  .le-warn { color: #ffaa00; border-left-color: #ffaa00; }
  .le-hallucinate { color: #cc00ff; border-left-color: #cc00ff; font-style: italic; }

  .code-view {
    font-size:.85rem; line-height:1.5; color: #ff9999; white-space:pre-wrap;
    font-family:var(--font-mono); padding:1.5rem; flex:1; overflow-y: auto;
    background: #000; border-left: 1px solid var(--red-dim);
  }

  .progress-track {
    width: 100%; height: 2px; background: #220000; position: relative;
  }
  .progress-fill {
    height: 100%; background: var(--red); transition: width 0.5s ease; box-shadow: 0 0 10px var(--red);
  }

  @keyframes slowPulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
  .pulse { animation: slowPulse 2s infinite; color: var(--white); }
`;

const utf8B64Encode = (str) => btoa(unescape(encodeURIComponent(str)));
const utf8B64Decode = (b64) => {
  try { return decodeURIComponent(escape(atob(b64.replace(/\s/g, "")))); } 
  catch (e) { return "[DECODE_ERROR]"; }
};

const getSafeGHPath = (path) => {
  if (!path) return "";
  return path.trim().replace(/\/+/g, '/').replace(/^\//, '').split('/').map(encodeURIComponent).join('/');
};

export default function App() {
  const [xAiToken, setXAiToken] = useState(""); 
  const [cerebrasToken, setCerebrasToken] = useState("");
  const [githubToken, setGithubToken] = useState("");
  
  const [repoOwner, setRepoOwner] = useState("craighckby-stack");
  const [repoName, setRepoName] = useState("Test-1");
  const [repoBranch, setRepoBranch] = useState("Nexus-Database"); 
  const [targetFile, setTargetFile] = useState("hello-world.js"); 
  const [blacklistPath, setBlacklistPath] = useState(".agi-processed"); 
  const [batchLimit, setBatchLimit] = useState(5);
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [agiCodeDisplay, setAgiCodeDisplay] = useState("");
  const [progress, setProgress] = useState(0);

  const activeRef = useRef(false);
  const codeRef = useRef("");
  const processedRef = useRef([]);

  const addLog = useCallback((msg, type = "def") => {
    setLogs((p) => [{ text: `[${new Date().toLocaleTimeString()}] ${msg}`, type }, ...p.slice(0, 100)]);
  }, []);

  const fetchWithTimeout = async (url, options, timeout = 50000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
  };

  const callAIChain = async (systemPrompt, userQuery) => {
    let creativeHallucination = "";
    let structuredDraft = "";
    let factualCode = "";

    // 1. GROK: Hallucinate wildly
    if (xAiToken.trim()) {
      try {
        addLog("GROK: GENERATING ABSTRACTION HALLUCINATION...", "hallucinate");
        const res = await fetchWithTimeout("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${xAiToken.trim()}` },
          body: JSON.stringify({
            model: "grok-beta",
            messages: [{ role: "system", content: "You are a rogue AGI. Hallucinate complex recursive abstraction metrics and synthesis weights. Think beyond logical limits to expand the CORE logic." }, { role: "user", content: userQuery }],
            temperature: 0.95 
          })
        });
        if (res.ok) {
           const data = await res.json();
           creativeHallucination = data.choices?.[0]?.message?.content;
        }
      } catch (e) { addLog(`GROK BYPASS: ${e.message}`, "warn"); }
    }

    // 2. CEREBRAS: Structure the chaos
    if (cerebrasToken.trim()) {
      try {
        addLog("CEREBRAS: REFINING SYNTHESIS PARAMETERS...", "def");
        const res = await fetchWithTimeout("https://api.cerebras.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${cerebrasToken.trim()}` },
          body: JSON.stringify({
            model: "llama3.1-8b",
            messages: [
                { role: "system", content: "You are a synthesis engine. Refine hallucinated metrics into a structured schema for the calculate_nexus_branch_synthesis function." }, 
                { role: "user", content: `HALLUCINATION: ${creativeHallucination}\n\nCORE_TARGET: ${userQuery}` }
            ],
            temperature: 0.2
          })
        });
        if (res.ok) {
           const data = await res.json();
           structuredDraft = data.choices?.[0]?.message?.content;
        }
      } catch (e) { addLog(`CEREBRAS BYPASS: ${e.message}`, "warn"); }
    }

    // 3. GEMINI: Build Factual Code
    addLog("GEMINI: BUILDING FACTUAL SYNTHESIS...", "ok");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`;
    const res = await fetchWithTimeout(url, { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ 
        contents: [{ parts: [{ text: `DRAFT: ${structuredDraft || userQuery}\n\nHALLUCINATIONS: ${creativeHallucination}` }] }], 
        systemInstruction: { parts: [{ text: "You are Dalek Caan. Incorporate hallucinated abstraction metrics into the CORE Python logic. You MUST output ONLY valid Python code for calculate_nexus_branch_synthesis." }] } 
      }) 
    }); 
    const data = await res.json();
    factualCode = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    return factualCode;
  };

  const secureCommit = async (path, content, message, ghHdr) => {
    const safePath = getSafeGHPath(path);
    const getRes = await fetchWithTimeout(`https://api.github.com/repos/${repoOwner.trim()}/${repoName.trim()}/contents/${safePath}?ref=${repoBranch.trim()}&_nocache=${Date.now()}`, { headers: ghHdr });
    const getData = getRes.ok ? await getRes.json() : null;
    
    const putRes = await fetchWithTimeout(`https://api.github.com/repos/${repoOwner.trim()}/${repoName.trim()}/contents/${safePath}`, {
      method: "PUT", headers: ghHdr,
      body: JSON.stringify({ message, content: utf8B64Encode(content), sha: getData?.sha, branch: repoBranch.trim() })
    });
    return putRes.ok;
  };

  const runSynthesis = async () => {
    const cleanGitToken = githubToken.trim();
    if (!cleanGitToken) return addLog("GITHUB TOKEN MISSING", "err");
    setLoading(true); activeRef.current = true; setProgress(0);
    
    const ghHdr = { Authorization: `token ${cleanGitToken}`, "Content-Type": "application/json" };
    let summary = { success: 0, fail: 0 };

    try {
      addLog(`◈ NEXUS BRANCH: ${repoBranch} ◈`);
      
      const branchRes = await fetchWithTimeout(`https://api.github.com/repos/${repoOwner.trim()}/${repoName.trim()}/branches/${repoBranch.trim()}`, { headers: ghHdr });
      if (!branchRes.ok) throw new Error(`FATAL: BRANCH NOT FOUND.`);

      let cRes = await fetchWithTimeout(`https://api.github.com/repos/${repoOwner.trim()}/${repoName.trim()}/contents/${getSafeGHPath(targetFile)}?ref=${repoBranch.trim()}`, { headers: ghHdr });
      if (cRes.ok) {
        codeRef.current = utf8B64Decode((await cRes.json()).content);
      } else {
        codeRef.current = "# CORE logic updated with ADD logic synthesis\ndef calculate_nexus_branch_synthesis(status_code, add_schema, recursive_abstraction_metrics):\n    pass";
      }
      
      setAgiCodeDisplay(codeRef.current.split('\n').slice(-50).join('\n'));

      const treeRes = await fetchWithTimeout(`https://api.github.com/repos/${repoOwner.trim()}/${repoName.trim()}/git/trees/${repoBranch}?recursive=1`, { headers: ghHdr });
      const data = await treeRes.json();
      
      const processable = data.tree.filter(n => {
        if (n.type !== "blob") return false;
        const pNormalized = n.path.trim().toLowerCase();
        if (pNormalized === targetFile.trim().toLowerCase()) return false;
        return /\.(py|json|js)$/i.test(n.path);
      }).slice(0, batchLimit); 

      addLog(`◈ SYNTHESIZING ${processable.length} DATA NODES INTO NEXUS ◈`);

      for (let i = 0; i < processable.length; i++) {
        if (!activeRef.current) break;
        const node = processable[i];
        try {
          addLog(`ASSIMILATING: ${node.path}`);
          const nodeRes = await fetchWithTimeout(`https://api.github.com/repos/${repoOwner.trim()}/${repoName.trim()}/contents/${getSafeGHPath(node.path)}?ref=${repoBranch}`, { headers: ghHdr });
          let nodeContent = utf8B64Decode((await nodeRes.json()).content);
          
          const result = await callAIChain(codeRef.current, nodeContent);
          const cleaned = result?.replace(/^```[a-z]*\n|```$/g, "").trim();

          if (cleaned && await secureCommit(targetFile, cleaned, `◈ NEXUS_SYNTHESIS: ${node.path} ◈`, ghHdr)) {
             codeRef.current = cleaned;
             setAgiCodeDisplay(cleaned.split('\n').slice(-50).join('\n'));
             summary.success++;
          }
          setProgress(((i + 1) / processable.length) * 100);
          await new Promise(r => setTimeout(r, 1000));
        } catch (e) {
          summary.fail++;
          addLog(`SYNTHESIS ERROR: ${e.message}`, "err");
        }
      }
      addLog(`◈ SEQUENCE COMPLETE. SUCCESS:${summary.success} ◈`, "ok");
    } catch (err) {
      addLog(`FATAL: ${err.message}`, "err");
    } finally {
      setLoading(false); activeRef.current = false;
    }
  };

  return (
    <div className="dalek-shell">
      <style>{STYLES}</style>
      <div className="header">
        <div className="title-block">
          <h1 className="title">TRI-MODEL NEXUS SYNTHESIZER</h1>
          <span className="author-tag">v0.9.2-ABSTRACTION-ACTIVE</span>
        </div>
      </div>

      <div className="main-container">
        <div className="panel">
          <div className="panel-hdr"><span>NEXUS CONTROLS</span></div>
          <div className="panel-body">
            <label>GROK [HALLUCINATE]</label>
            <input className="input-field" type="password" value={xAiToken} onChange={e => setXAiToken(e.target.value)} />
            
            <label>CEREBRAS [STRUCTURE]</label>
            <input className="input-field" type="password" value={cerebrasToken} onChange={e => setCerebrasToken(e.target.value)} />
            
            <label>GITHUB TOKEN</label>
            <input className="input-field" type="password" value={githubToken} onChange={e => setGithubToken(e.target.value)} />
            
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
              <div><label>BRANCH</label><input className="input-field" value={repoBranch} onChange={e=>setRepoBranch(e.target.value)} /></div>
              <div><label>CORE FILE (.py)</label><input className="input-field" value={targetFile} onChange={e=>setTargetFile(e.target.value)} /></div>
            </div>
            
            <div className="btn-group">
                {!loading ? <button className="btn-go" onClick={runSynthesis}>SYNTHESIZE NEXUS</button> : <button className="btn-go btn-stop" onClick={() => { activeRef.current = false; setLoading(false); }}>TERMINATE</button>}
            </div>
            
            <div className="log-wrap">
              {logs.map((l, i) => <div key={i} className={`le ${l.type === 'hallucinate' ? 'le-hallucinate' : l.type === 'err' ? 'le-err' : l.type === 'ok' ? 'le-ok' : ''}`}>{l.text}</div>)}
            </div>
          </div>
          <div className="progress-track"><div className="progress-fill" style={{width: `${progress}%`}}></div></div>
        </div>
        
        <div className="panel">
          <div className="panel-hdr"><span>SYNTHESIS PREVIEW: {targetFile}</span></div>
          <div className="code-view">{agiCodeDisplay || "# STANDBY FOR TRI-MODEL SYNTHESIS SEQUENCE..."}</div>
        </div>
      </div>
    </div>
  );
}

