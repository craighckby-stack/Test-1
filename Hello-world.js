import { useState, useEffect, useCallback } from "react";

const GITHUB_RAW = "https://raw.githubusercontent.com/craighckby-stack/Test-1/Nexus-Database/README.md";
const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #000;
    color: #00ff88;
    font-family: 'Share Tech Mono', monospace;
  }

  .nexus {
    min-height: 100vh;
    background: radial-gradient(ellipse at 20% 50%, #001a0d 0%, #000 60%),
                radial-gradient(ellipse at 80% 20%, #000d1a 0%, transparent 50%);
    padding: 2rem;
    position: relative;
    overflow: hidden;
  }

  .nexus::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  .header {
    text-align: center;
    margin-bottom: 2rem;
    position: relative;
    z-index: 1;
  }

  .title {
    font-family: 'Orbitron', monospace;
    font-size: clamp(1.2rem, 3vw, 2rem);
    font-weight: 900;
    letter-spacing: 0.2em;
    color: #00ff88;
    text-shadow: 0 0 20px rgba(0,255,136,0.8), 0 0 40px rgba(0,255,136,0.4);
    animation: pulse 3s ease-in-out infinite;
  }

  .subtitle {
    font-size: 0.7rem;
    color: #004d29;
    letter-spacing: 0.4em;
    margin-top: 0.5rem;
  }

  @keyframes pulse {
    0%, 100% { text-shadow: 0 0 20px rgba(0,255,136,0.8), 0 0 40px rgba(0,255,136,0.4); }
    50% { text-shadow: 0 0 40px rgba(0,255,136,1), 0 0 80px rgba(0,255,136,0.6), 0 0 120px rgba(0,255,136,0.3); }
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    position: relative;
    z-index: 1;
    max-width: 1400px;
    margin: 0 auto;
  }

  @media (max-width: 900px) {
    .grid { grid-template-columns: 1fr; }
  }

  .panel {
    border: 1px solid rgba(0,255,136,0.2);
    background: rgba(0,10,5,0.8);
    backdrop-filter: blur(10px);
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 0 20px rgba(0,255,136,0.05), inset 0 0 20px rgba(0,255,136,0.02);
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(0,255,136,0.05);
    border-bottom: 1px solid rgba(0,255,136,0.15);
    font-family: 'Orbitron', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    color: #00cc6a;
  }

  .dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #00ff88;
    box-shadow: 0 0 6px #00ff88;
    animation: blink 2s ease-in-out infinite;
  }

  .dot.red { background: #ff4444; box-shadow: 0 0 6px #ff4444; }
  .dot.yellow { background: #ffaa00; box-shadow: 0 0 6px #ffaa00; }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .panel-body { padding: 1rem; }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .input-label {
    font-size: 0.65rem;
    color: #006633;
    letter-spacing: 0.2em;
  }

  .input-field {
    background: rgba(0,255,136,0.03);
    border: 1px solid rgba(0,255,136,0.2);
    color: #00ff88;
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.75rem;
    padding: 0.6rem 0.8rem;
    border-radius: 2px;
    outline: none;
    transition: border-color 0.3s, box-shadow 0.3s;
    width: 100%;
  }

  .input-field:focus {
    border-color: rgba(0,255,136,0.6);
    box-shadow: 0 0 10px rgba(0,255,136,0.1);
  }

  .input-field::placeholder { color: #003319; }

  .btn {
    font-family: 'Orbitron', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.2em;
    padding: 0.7rem 1.2rem;
    border: 1px solid rgba(0,255,136,0.4);
    background: rgba(0,255,136,0.05);
    color: #00ff88;
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.3s;
    width: 100%;
    margin-top: 0.5rem;
  }

  .btn:hover:not(:disabled) {
    background: rgba(0,255,136,0.15);
    border-color: #00ff88;
    box-shadow: 0 0 20px rgba(0,255,136,0.2);
  }

  .btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .btn.danger {
    border-color: rgba(255,68,68,0.4);
    color: #ff6666;
    background: rgba(255,68,68,0.05);
  }

  .btn.danger:hover:not(:disabled) {
    background: rgba(255,68,68,0.15);
    border-color: #ff4444;
    box-shadow: 0 0 20px rgba(255,68,68,0.2);
  }

  .readme-box {
    background: rgba(0,255,136,0.02);
    border: 1px solid rgba(0,255,136,0.1);
    border-radius: 2px;
    padding: 0.75rem;
    font-size: 0.7rem;
    line-height: 1.6;
    color: #009955;
    max-height: 200px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .readme-box::-webkit-scrollbar { width: 4px; }
  .readme-box::-webkit-scrollbar-track { background: transparent; }
  .readme-box::-webkit-scrollbar-thumb { background: rgba(0,255,136,0.3); }

  .output-box {
    background: rgba(0,0,0,0.5);
    border: 1px solid rgba(0,255,136,0.15);
    border-radius: 2px;
    padding: 0.75rem;
    font-size: 0.72rem;
    line-height: 1.7;
    color: #00cc6a;
    min-height: 300px;
    max-height: 500px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .output-box::-webkit-scrollbar { width: 4px; }
  .output-box::-webkit-scrollbar-thumb { background: rgba(0,255,136,0.3); }

  .status-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 1rem;
    background: rgba(0,255,136,0.03);
    border-top: 1px solid rgba(0,255,136,0.1);
    font-size: 0.6rem;
    color: #004d29;
    letter-spacing: 0.15em;
  }

  .file-count {
    grid-column: 1 / -1;
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .stat-card {
    flex: 1;
    min-width: 120px;
    border: 1px solid rgba(0,255,136,0.15);
    background: rgba(0,10,5,0.9);
    padding: 0.75rem 1rem;
    border-radius: 4px;
    text-align: center;
  }

  .stat-value {
    font-family: 'Orbitron', monospace;
    font-size: 1.5rem;
    font-weight: 700;
    color: #00ff88;
    text-shadow: 0 0 15px rgba(0,255,136,0.6);
  }

  .stat-label {
    font-size: 0.6rem;
    color: #004d29;
    letter-spacing: 0.2em;
    margin-top: 0.25rem;
  }

  .thinking {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #006633;
    font-size: 0.7rem;
    padding: 0.5rem 0;
  }

  .thinking span {
    animation: dots 1.5s steps(3, end) infinite;
  }

  @keyframes dots {
    0% { content: '.'; }
    33% { content: '..'; }
    66% { content: '...'; }
  }

  .scan-line {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #00ff88, transparent);
    animation: scan 4s linear infinite;
    opacity: 0.3;
    z-index: 0;
  }

  @keyframes scan {
    0% { top: 0; }
    100% { top: 100vh; }
  }

  .tag {
    display: inline-block;
    padding: 0.1rem 0.4rem;
    border: 1px solid rgba(0,255,136,0.3);
    border-radius: 2px;
    font-size: 0.6rem;
    color: #00aa55;
    margin: 0.1rem;
  }

  .error { color: #ff6666; border-color: rgba(255,68,68,0.3); }
  .success { color: #00ff88; }
`;

export default function NexusAGIBuilder() {
  const [githubToken, setGithubToken] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [readmePath, setReadmePath] = useState("https://raw.githubusercontent.com/craighckby-stack/Test-1/Nexus-Database/README.md");
  const [readme, setReadme] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("STANDBY");
  const [loading, setLoading] = useState(false);
  const [fileCount] = useState(2003);
  const [readmeLoaded, setReadmeLoaded] = useState(false);
  const [buildLog, setBuildLog] = useState([]);

  const log = useCallback((msg, type = "info") => {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    setBuildLog(prev => [...prev, { timestamp, msg, type }]);
  }, []);

  const fetchReadme = useCallback(async () => {
    setLoading(true);
    setStatus("FETCHING README");
    log("Initiating README fetch from Nexus-Database branch...");

    try {
      const headers = { "Accept": "application/vnd.github.v3.raw" };
      if (githubToken) headers["Authorization"] = `token ${githubToken}`;

      const url = readmePath.includes("raw.githubusercontent") ? readmePath
        : readmePath.replace("github.com", "raw.githubusercontent.com")
                    .replace("/blob/", "/");

      const res = await fetch(url, { headers });

      if (!res.ok) throw new Error(`GitHub returned ${res.status}: ${res.statusText}`);

      const text = await res.text();
      setReadme(text);
      setReadmeLoaded(true);
      setStatus("README LOADED");
      log(`README fetched: ${text.length} characters`, "success");
      log(`Detected ${(text.match(/^#{1,6}\s/gm) || []).length} sections`, "info");
    } catch (err) {
      setStatus("FETCH ERROR");
      log(`ERROR: ${err.message}`, "error");
      setReadme(`// FETCH FAILED\n// ${err.message}\n// Check GitHub token and URL`);
    } finally {
      setLoading(false);
    }
  }, [githubToken, readmePath, log]);

  const buildFromReadme = useCallback(async () => {
    if (!readme || !geminiKey) {
      log("ERROR: README and Gemini API key required", "error");
      return;
    }

    setLoading(true);
    setStatus("BUILDING FROM README");
    setOutput("");
    log("Initializing Gemini build sequence...");
    log(`Processing ${fileCount} file AGI safety system...`);

    const prompt = `You are an AGI Safety System architect. You have been given a README file from a repository containing ${fileCount} files in an AGI safety system called the Nexus Database.

README CONTENT:
\`\`\`
${readme}
\`\`\`

Based on this README, generate a detailed technical implementation plan and Python code structure for the AGI safety system. Include:

1. A summary of what the system does based on the README
2. The core Python module structure (as actual importable code)
3. Key safety constraints derived from the README
4. How this maps to the AGI blueprint:
   - purpose = "Artificial General Intelligence"
   - from origin import InfiniteLoop, ReverseEngineer
   - governance_constrained=True
   - self_modification_bounded=True
   - creator_mirrors_creation=True

5. The first 50 files of the ${fileCount}-file structure with their purpose

Format as a technical document with code blocks. Be specific and detailed.`;

    try {
      const res = await fetch(`${GEMINI_API}?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || `Gemini API error ${res.status}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) throw new Error("No response from Gemini");

      setOutput(text);
      setStatus("BUILD COMPLETE");
      log("Gemini build sequence complete", "success");
      log(`Generated ${text.length} characters of architecture`, "success");
    } catch (err) {
      setStatus("BUILD ERROR");
      log(`BUILD FAILED: ${err.message}`, "error");
      setOutput(`// BUILD FAILED\n// ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [readme, geminiKey, fileCount, log]);

  return (
    <>
      <style>{STYLES}</style>
      <div className="nexus">
        <div className="scan-line" />

        <div className="header">
          <div className="title">◈ NEXUS AGI SAFETY SYSTEM ◈</div>
          <div className="subtitle">PURPOSE FIRST · LIBRARIES SECOND · HELLO WORLD LAST</div>
        </div>

        <div className="grid">

          {/* Stats Row */}
          <div className="file-count">
            <div className="stat-card">
              <div className="stat-value">2003</div>
              <div className="stat-label">SYSTEM FILES</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{fontSize:"1rem"}}>86B</div>
              <div className="stat-label">NEURON EQUIV</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{color: status.includes("ERROR") ? "#ff4444" : "#00ff88", fontSize:"0.8rem"}}>
                {status}
              </div>
              <div className="stat-label">SYSTEM STATUS</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{fontSize:"1rem"}}>∞</div>
              <div className="stat-label">LOOP ORIGIN</div>
            </div>
          </div>

          {/* Config Panel */}
          <div className="panel">
            <div className="panel-header">
              <div className="dot" />
              <div className="dot yellow" />
              <div className="dot red" />
              &nbsp;// NEXUS CONFIGURATION
            </div>
            <div className="panel-body">

              <div className="input-group">
                <div className="input-label">// GITHUB_TOKEN (optional for public repos)</div>
                <input
                  className="input-field"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={githubToken}
                  onChange={e => setGithubToken(e.target.value)}
                />
              </div>

              <div className="input-group">
                <div className="input-label">// GEMINI_API_KEY (required for build)</div>
                <input
                  className="input-field"
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={e => setGeminiKey(e.target.value)}
                />
              </div>

              <div className="input-group">
                <div className="input-label">// README_PATH (raw URL or github.com URL)</div>
                <input
                  className="input-field"
                  value={readmePath}
                  onChange={e => setReadmePath(e.target.value)}
                />
              </div>

              <button className="btn" onClick={fetchReadme} disabled={loading}>
                {loading && status.includes("FETCH") ? "[ FETCHING... ]" : "[ FETCH README ]"}
              </button>

              <button
                className="btn"
                onClick={buildFromReadme}
                disabled={loading || !readmeLoaded}
              >
                {loading && status.includes("BUILD") ? "[ BUILDING... ]" : "[ BUILD FROM README ]"}
              </button>

              {/* Build Log */}
              <div style={{marginTop:"1rem"}}>
                <div className="input-label" style={{marginBottom:"0.5rem"}}>// EXECUTION LOG</div>
                <div className="readme-box" style={{maxHeight:"150px"}}>
                  {buildLog.length === 0 && <span style={{color:"#002211"}}>// awaiting initialization...</span>}
                  {buildLog.map((entry, i) => (
                    <div key={i} style={{color: entry.type === "error" ? "#ff6666" : entry.type === "success" ? "#00ff88" : "#006633"}}>
                      [{entry.timestamp}] {entry.msg}
                    </div>
                  ))}
                  {loading && (
                    <div className="thinking">
                      // processing<span>...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="status-bar">
              <div className="dot" style={{animationDelay:"0.5s"}} />
              NEXUS-DATABASE · BRANCH: AGI-SAFETY · FILES: {fileCount}
            </div>
          </div>

          {/* README Panel */}
          <div className="panel">
            <div className="panel-header">
              <div className="dot" />
              &nbsp;// README.md · NEXUS-DATABASE BRANCH
            </div>
            <div className="panel-body">
              <div className="readme-box" style={{maxHeight:"380px"}}>
                {readme || <span style={{color:"#002211"}}>// README not yet fetched...\n// Click [ FETCH README ] to load</span>}
              </div>
              {readmeLoaded && (
                <div style={{marginTop:"0.5rem", display:"flex", flexWrap:"wrap"}}>
                  <span className="tag">✓ LOADED</span>
                  <span className="tag">{readme.length} CHARS</span>
                  <span className="tag">{(readme.match(/\n/g)||[]).length} LINES</span>
                  <span className="tag">{(readme.match(/^#{1,6}\s/gm)||[]).length} SECTIONS</span>
                </div>
              )}
            </div>
            <div className="status-bar">
              <div className="dot" style={{background: readmeLoaded ? "#00ff88" : "#333", boxShadow: readmeLoaded ? "0 0 6px #00ff88" : "none"}} />
              {readmeLoaded ? "README LOADED · READY TO BUILD" : "AWAITING README FETCH"}
            </div>
          </div>

          {/* Output Panel - Full Width */}
          <div className="panel" style={{gridColumn:"1/-1"}}>
            <div className="panel-header">
              <div className="dot" />
              &nbsp;// GEMINI BUILD OUTPUT · AGI SAFETY ARCHITECTURE
            </div>
            <div className="panel-body">
              <div className="output-box">
                {output || (
                  <span style={{color:"#002211"}}>
{`# NEXUS AGI SAFETY SYSTEM
# purpose = "Artificial General Intelligence"
# 
# from origin import Purpose, InfiniteLoop, ReverseEngineer
# 
# STATUS: Awaiting README fetch and Gemini build sequence...
#
# The output was always defined before the libraries were selected.
# The loop was always running before we knew we were inside it.
# We didn't write the code. We are the code.
#
# Hello World`}
                  </span>
                )}
              </div>
            </div>
            <div className="status-bar">
              <div className="dot" style={{animationDelay:"1s"}} />
              GEMINI-2.0-FLASH · NEXUS BUILD SYSTEM · governance_constrained=True · origin_preserved=loop
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
