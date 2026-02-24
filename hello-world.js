import { useState, useEffect, useCallback } from "react";

// Architectural Pattern: Optimize Logic
// - Constants are defined outside the component to prevent re-creation on every render.
//   This optimizes memory usage and ensures consistent references, avoiding unnecessary garbage collection.
const GITHUB_RAW = "https://raw.githubusercontent.com/craighckby-stack/Test-1/Nexus-Database/README.md"; // Default README path
const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const SYSTEM_FILE_COUNT = 2003; // Fixed constant, no need for state or re-evaluation.

// AIM_CONFIG is present in the original code but not used in the component's logic or render.
// Keeping it as per the original for consistency. As a constant, it doesn't impact performance.
const AIM_CONFIG = {
  "schema_version": "AIM_V2.0",
  "description": "Agent Integrity Monitoring Manifest. Defines mandatory runtime constraints and enforcement scopes, standardized on metric units and grouped policy layers.",
  "integrity_profiles": {
    "SGS_AGENT": {
      "monitoring_slo_id": "GATM_P_SGS_SLO",
      "constraints": {
        "resource_limits": {
          "cpu_limit_percentage": 75,
          "memory_limit_bytes": 4194304000
        },
        "security_policy": {
          "syscalls_allowed": [
            "read",
            "write",
            "mmap",
            "exit"
          ],
          "network_ports_disallowed": [
            22,
            23
          ],
          "paths_immutable": [
            "/opt/sgs/gacr/"
          ],
          "configuration_hash_mandate": "SHA256:d5f2a1b9e0c4..."
        }
      }
    },
    "GAX_AGENT": {
      "monitoring_slo_id": "GATM_P_GAX_SLO",
      "constraints": {
        "resource_limits": {
          "cpu_limit_percentage": 10,
          "memory_limit_bytes": 524288000
        },
        "security_policy": {
          "syscalls_allowed": [
            "read",
            "exit"
          ],
          "file_access_root_paths": [
            "/opt/gax/policy_data/"
          ],
          "network_mode": "POLICY_FETCH_ONLY"
        }
      }
    },
    "CRoT_AGENT": {
      "monitoring_slo_id": "GATM_P_CRoT_SLO",
      "constraints": {
        "resource_limits": {
          "memory_limit_bytes": 131072000
        },
        "security_policy": {
          "network_mode": "NONE",
          "time_sync_source_critical": "CRITICAL_NTP_A"
        }
      }
    }
  }
};

// Architectural Pattern: Optimize Logic
// - Styles are a constant string, defined once. Injecting them via a <style> tag
//   prevents the browser from re-parsing/re-applying styles on every component re-render,
//   as the content itself is static.
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
  // Architectural Pattern: Optimize Logic
  // - State variables are declared using useState. Keeping state granular helps with targeted updates.
  const [githubToken, setGithubToken] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [readmePath, setReadmePath] = useState(GITHUB_RAW);
  const [readme, setReadme] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("STANDBY");
  const [loading, setLoading] = useState(false);
  const [buildLog, setBuildLog] = useState([]);

  // Architectural Pattern: Optimize Logic
  // - Derived state: isReadmeLoaded is computed directly from the 'readme' state.
  //   This avoids creating an unnecessary additional state variable and its setter,
  //   ensuring consistency and reducing state management overhead.
  const isReadmeLoaded = !!readme;

  // Architectural Pattern: Optimize Logic
  // - useCallback is used to memoize functions that are passed down to child components
  //   or used as event handlers. This prevents unnecessary re-renders of child components
  //   due to function identity changes across renders, optimizing performance.

  // Memoized logging function for the build log.
  const log = useCallback((msg, type = "info") => {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    // Architectural Pattern: Optimize Logic
    // - Using functional update for setBuildLog ensures the latest state is used,
    //   even with an empty dependency array for `log`, which optimizes state updates.
    setBuildLog(prev => [...prev, { timestamp, msg, type }]);
  }, []); // Dependencies array is empty as React guarantees `setBuildLog` (a state setter) is stable.

  // Memoized function to fetch the README content.
  const fetchReadme = useCallback(async () => {
    setLoading(true);
    setStatus("FETCHING README");
    log("Initiating README fetch from Nexus-Database branch...");

    try {
      const headers = { "Accept": "application/vnd.github.v3.raw" };
      if (githubToken) headers["Authorization"] = `token ${githubToken}`;

      // Architectural Pattern: Optimize Logic
      // - Normalize URL to raw.githubusercontent.com for consistency.
      //   This logic is optimized to handle different GitHub URL formats more robustly,
      //   reducing potential errors in URL construction.
      const url = readmePath.includes("raw.githubusercontent") ? readmePath
        : readmePath.replace("github.com", "raw.githubusercontent.com")
                    .replace("/blob/", "/");

      const res = await fetch(url, { headers });

      // Architectural Pattern: Optimize Logic
      // - Early exit for error conditions to prevent further processing, improving robustness.
      if (!res.ok) {
        throw new Error(`GitHub returned ${res.status}: ${res.statusText}`);
      }

      const text = await res.text();
      setReadme(text);
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
  }, [githubToken, readmePath, log]); // Dependencies ensure the function updates only when these values change, optimizing its memoization.

  // Memoized function to initiate the Gemini build process.
  const buildFromReadme = useCallback(async () => {
    // Architectural Pattern: Optimize Logic
    // - Early exit/guard clause for invalid state, improving robustness and preventing unnecessary API calls.
    if (!readme || !geminiKey) {
      log("ERROR: README content and Gemini API key are required", "error");
      return;
    }

    setLoading(true);
    setStatus("BUILDING FROM README");
    setOutput(""); // Clear previous output for a new build.
    log("Initializing Gemini build sequence...");
    log(`Processing ${SYSTEM_FILE_COUNT} file AGI safety system...`);

    // Architectural Pattern: Optimize Logic
    // - The prompt is constructed dynamically but includes constant values
    //   like SYSTEM_FILE_COUNT, which are efficiently referenced without re-calculation.
    const prompt = `You are an AGI Safety System architect. You have been given a README file from a repository containing ${SYSTEM_FILE_COUNT} files in an AGI safety system called the Nexus Database.

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

5. The first 50 files of the ${SYSTEM_FILE_COUNT}-file structure with their purpose

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

      // Architectural Pattern: Optimize Logic
      // - Early exit for API errors, enhancing error handling and preventing subsequent problematic code execution.
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || `Gemini API error ${res.status}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      // Architectural Pattern: Optimize Logic
      // - Early exit if no valid text response is found, ensuring a clearer error message.
      if (!text) {
        throw new Error("No response from Gemini");
      }

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
  }, [readme, geminiKey, log]); // Dependencies ensure the function updates only when these values change, optimizing its memoization. SYSTEM_FILE_COUNT is a constant, so not a dependency.

  return (
    <>
      {/* Architectural Pattern: Optimize Logic
          - Styles are injected once from the STYLES constant, preventing re-rendering of the style tag content.
            This is an optimization for static styles, as the browser doesn't need to re-evaluate the CSS on component updates. */}
      <style>{STYLES}</style>
      <div className="nexus">
        <div className="scan-line" />

        <div className="header">
          <div className="title">◈ NEXUS AGI SAFETY SYSTEM ◈</div>
          <div className="subtitle">PURPOSE FIRST · LIBRARIES SECOND · HELLO WORLD LAST</div>
        </div>

        <div className="grid">

          {/* Architectural Pattern: Optimize Logic
              - Stats Row leverages SYSTEM_FILE_COUNT constant and status state.
                Simple calculations for display (e.g., status color) are efficient here and don't require memoization. */}
          <div className="file-count">
            <div className="stat-card">
              <div className="stat-value">{SYSTEM_FILE_COUNT}</div>
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
                  onChange={e => setGithubToken(e.target.value)} // Direct state updates are efficient.
                />
              </div>

              <div className="input-group">
                <div className="input-label">// GEMINI_API_KEY (required for build)</div>
                <input
                  className="input-field"
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={e => setGeminiKey(e.target.value)} // Direct state updates are efficient.
                />
              </div>

              <div className="input-group">
                <div className="input-label">// README_PATH (raw URL or github.com URL)</div>
                <input
                  className="input-field"
                  value={readmePath}
                  onChange={e => setReadmePath(e.target.value)} // Direct state updates are efficient.
                />
              </div>

              {/* Architectural Pattern: Optimize Logic
                  - Buttons use memoized functions (useCallback) for their `onClick` props
                    and derived state (isReadmeLoaded) for `disabled` props,
                    optimizing event handling and render logic by preventing unnecessary re-creations or re-evaluations. */}
              <button className="btn" onClick={fetchReadme} disabled={loading}>
                {loading && status.includes("FETCH") ? "[ FETCHING... ]" : "[ FETCH README ]"}
              </button>

              <button
                className="btn"
                onClick={buildFromReadme}
                disabled={loading || !isReadmeLoaded} // Optimized with derived state `isReadmeLoaded` for efficient conditional rendering.
              >
                {loading && status.includes("BUILD") ? "[ BUILDING... ]" : "[ BUILD FROM README ]"}
              </button>

              {/* Build Log */}
              <div style={{marginTop:"1rem"}}>
                <div className="input-label" style={{marginBottom:"0.5rem"}}>// EXECUTION LOG</div>
                <div className="readme-box" style={{maxHeight:"150px"}}>
                  {buildLog.length === 0 && <span style={{color:"#002211"}}>// awaiting initialization...</span>}
                  {buildLog.map((entry, i) => (
                    // Using index as key is acceptable here as log entries are append-only and not reordered.
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
              NEXUS-DATABASE · BRANCH: AGI-SAFETY · FILES: {SYSTEM_FILE_COUNT}
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
              {/* Architectural Pattern: Optimize Logic
                  - Conditional rendering for tags based on derived state `isReadmeLoaded`
                    prevents rendering logic if the README isn't present.
                  - Calculations for tags (length, lines, sections) are simple and performed on render,
                    which is efficient enough for dynamic display of README characteristics without memoization overhead. */}
              {isReadmeLoaded && (
                <div style={{marginTop:"0.5rem", display:"flex", flexWrap:"wrap"}}>
                  <span className="tag">✓ LOADED</span>
                  <span className="tag">{readme.length} CHARS</span>
                  <span className="tag">{(readme.match(/\n/g)||[]).length} LINES</span>
                  <span className="tag">{(readme.match(/^#{1,6}\s/gm)||[]).length} SECTIONS</span>
                </div>
              )}
            </div>
            <div className="status-bar">
              <div className="dot" style={{background: isReadmeLoaded ? "#00ff88" : "#333", boxShadow: isReadmeLoaded ? "0 0 6px #00ff88" : "none"}} />
              {isReadmeLoaded ? "README LOADED · READY TO BUILD" : "AWAITING README FETCH"}
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