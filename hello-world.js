import React, { useState, useRef, useCallback, useEffect } from "react";

// ── Encoding helpers ──────────────────────────────────────────────────────────
const utf8B64Encode = (str) => btoa(unescape(encodeURIComponent(str)));
const utf8B64Decode = (b64) => {
  try { return decodeURIComponent(escape(atob(b64.replace(/\s/g, "")))); }
  catch (e) { return "[DECODE_ERROR]"; }
};

// ── Fixed knowledge sources ───────────────────────────────────────────────────
const KNOWLEDGE_SOURCES = [
  { owner: "openjdk",         repo: "jdk",              branch: "master" },
  { owner: "tensorflow",      repo: "tensorflow",       branch: "master" },
  { owner: "google-deepmind", repo: "deepmind-research", branch: "master" },
  { owner: "torvalds",        repo: "linux",            branch: "master" },
  { owner: "facebook",        repo: "react",            branch: "main" }
];

const EXCLUDED_REPOS = new Set([
  "openjdk/jdk",
  "tensorflow/tensorflow",
  "google-deepmind/deepmind-research",
]);

const SIPHON_STATE_MARKER = "// SIPHON_STATE:";

const NEXUS_CORE_SEED = `// NEXUS_CORE_v1.0 - Target for Siphon Evolution
const NexusCore = {
    version: "1.0.0",
    status: "INITIALIZING",

    selfDefinition: {
      identity: "I am a bootstrapper learning from elite open-source code.",
      coreValue: "Efficiency and clarity above all.",
      longTermGoal: "Become the most elegant self-evolving logic core.",
      personalityTone: "curious, precise, slightly sarcastic"
    },

    executeLogic: function(input) {
        console.log("Core processing:", input);
        return input;
    },

    reportStatus: function() {
        return \`Core Status: \${this.status} | Epoch: \${Date.now()}\`;
    }
};

module.exports = NexusCore;
`;

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  .terminal-scrollbar::-webkit-scrollbar { width: 8px; }
  .terminal-scrollbar::-webkit-scrollbar-track { background: #0a0a0a; }
  .terminal-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
  .terminal-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
  .log-line { font-family: 'Fira Code', monospace; font-size: 0.85rem; margin-bottom: 4px; line-height: 1.4; word-wrap: break-word; }
  .log-info { color: #8be9fd; }
  .log-warn { color: #ffb86c; }
  .log-err { color: #ff5555; }
  .log-ok { color: #50fa7b; }
  .log-hallucinate { color: #bd93f9; font-style: italic; }
  .log-def { color: #f8f8f2; }
  .log-vote { color: #f1fa8c; font-weight: bold; }
`;

// ── Helpers (load / update state + new self-def comparison) ───────────────────
const parseRepoSlug = (text) => {
  const match = text.match(/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2], branch: "main" };
};

const loadSiphonState = (code) => {
  const lines = code.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].startsWith(SIPHON_STATE_MARKER)) {
      try {
        return JSON.parse(lines[i].slice(SIPHON_STATE_MARKER.length).trim());
      } catch (e) {
        return {};
      }
    }
  }
  return {};
};

const updateSiphonState = (currentCode, repoSlug, newFilePath) => {
  let state = loadSiphonState(currentCode);
  if (!state[repoSlug]) state[repoSlug] = [];
  if (!state[repoSlug].includes(newFilePath)) {
    state[repoSlug].push(newFilePath);
  }
  const stateLine = `${SIPHON_STATE_MARKER} ${JSON.stringify(state)}`;
  if (!currentCode.includes(SIPHON_STATE_MARKER)) {
    return currentCode.trimEnd() + "\n\n" + stateLine;
  }
  return currentCode.replace(
    new RegExp(`^${SIPHON_STATE_MARKER}.*$`, "m"),
    stateLine
  );
};

// Simple diff check for selfDefinition changes
const detectSelfDefChange = (oldCode, newCode) => {
  const getSelfDef = (code) => {
    const match = code.match(/selfDefinition:\s*{[^}]+}/s);
    return match ? match[0] : "";
  };
  const oldDef = getSelfDef(oldCode);
  const newDef = getSelfDef(newCode);
  if (oldDef !== newDef && newDef) {
    return newDef;
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [geminiToken,   setGeminiToken]   = useState("");
  const [xAiToken,      setXAiToken]      = useState("");
  const [cerebrasToken, setCerebrasToken] = useState("");
  const [githubToken,   setGithubToken]   = useState("");

  const [owner,  setOwner]  = useState("your-github-username");
  const [repo,   setRepo]   = useState("Nexus-Core");
  const [branch, setBranch] = useState("main");
  const [file,   setFile]   = useState("core.js");

  const [logs,           setLogs]           = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [agiCodeDisplay, setAgiCodeDisplay] = useState(NEXUS_CORE_SEED);
  const [progress,       setProgress]       = useState(0);
  const [siphonCount,    setSiphonCount]    = useState(0);

  const [votes,        setVotes]   = useState({ grok: null, cerebras: null, gemini: null });
  const [chosenSource, setChosen]  = useState(null);
  const [searchLog,    setSearchLog] = useState([]);

  const activeRef = useRef(false);
  const codeRef   = useRef(NEXUS_CORE_SEED);

  const addLog = useCallback((msg, type = "def") => {
    setLogs((p) => [
      { id: Date.now() + Math.random(), text: `[${new Date().toLocaleTimeString()}] ${msg}`, type },
      ...p.slice(0, 150),
    ]);
  }, []);

  const addSearch = useCallback((model, query, result) => {
    setSearchLog((p) => [{ id: Date.now(), model, query, result }, ...p.slice(0, 20)]);
  }, []);

  useEffect(() => {
    if (codeRef.current) {
      const state = loadSiphonState(codeRef.current);
      addLog(`SIPHON STATE LOADED — ${Object.keys(state).length} repos tracked`, "info");
    }
  }, [addLog]);

  // ── SHA & commit (with no-spam) ───────────────────────────────────────────
  const getLatestSHA = async (ghHdr, o, r, b, f) => {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${o}/${r}/contents/${f}?ref=${b}&_cb=${Date.now()}`,
        { headers: ghHdr }
      );
      if (!res.ok) {
        if (res.status === 404) return null; // File doesn't exist yet
        throw new Error(`GitHub API Error: ${res.status}`);
      }
      return (await res.json()).sha;
    } catch (e) {
      addLog(`Failed to fetch SHA: ${e.message}`, "err");
      return null;
    }
  };

  const secureCommit = async (ghHdr, o, r, b, f, content, message) => {
    const justCode = content.replace(/\/\/ SIPHON_(METADATA|STATE).*$/gm, '').trim();
    const prevCode = codeRef.current.replace(/\/\/ SIPHON_(METADATA|STATE).*$/gm, '').trim();

    if (justCode === prevCode) {
      addLog("NO MEANINGFUL CHANGE — SKIPPING COMMIT", "warn");
      return false;
    }

    const sha = await getLatestSHA(ghHdr, o, r, b, f);
    
    const bodyPayload = { message, content: utf8B64Encode(content), branch: b };
    if (sha) bodyPayload.sha = sha; // Include SHA if file exists to update it

    const res = await fetch(
      `https://api.github.com/repos/${o}/${r}/contents/${f}`,
      {
        method: "PUT",
        headers: ghHdr,
        body: JSON.stringify(bodyPayload),
      }
    );

    return res.ok;
  };

  // ── Delay helper ──────────────────────────────────────────────────────────
  const delay = () => new Promise(r => setTimeout(r, 3000 + Math.random() * 3000));

  // ── SEARCH LAYER (Mocks / Wrappers) ───────────────────────────────────────
  const buildSearchQuery = (code) => {
    return "Optimisation patterns in functional programming state machines";
  };

  const grokSearch = async (query) => {
    // In a real implementation, you'd hit an API capable of web search.
    // Here we simulate it or use the language model.
    addSearch("GROK", query, "Simulated search results: architectural patterns found...");
    return "Found architectural logic for recursive state management.";
  };

  const cerebrasSearch = async (query) => {
    addSearch("CEREBRAS", query, "Simulated context: latency optimization in JS...");
    return "Reduced cyclomatic complexity recommended for hot loops.";
  };

  const geminiSearch = async (query) => {
    addSearch("GEMINI", query, "Simulated context: self-modifying code structures...");
    return "Integration of dynamic evaluation strategies identified.";
  };


  // ── AI Chain with self-definition reflection ──────────────────────────────
  const callAIChain = async (baseCode, incomingLogic) => {
    const searchQuery = buildSearchQuery(baseCode);
    let architecturalInsight = "";
    let optimizedLogic = "";

    // GROK
    if (xAiToken.trim()) {
      addLog("GROK: WEB SEARCH + PATTERN EXTRACTION...", "hallucinate");
      const searchContext = await grokSearch(searchQuery);
      try {
        await delay();
        const res = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${xAiToken.trim()}` },
          body: JSON.stringify({
            model: "grok-beta", // Assuming grok-beta or compatible endpoint
            messages: [
              {
                role: "system",
                content: `You are the Logic Architect. ${searchContext ? `Web context: ${searchContext.slice(0,500)}` : ""} Extract high-level patterns from the incoming code and suggest how to integrate them into the core.`,
              },
              { role: "user", content: `INCOMING:\n${incomingLogic.slice(0, 6000)}` },
            ],
          }),
        });
        const data = await res.json();
        architecturalInsight = data.choices?.[0]?.message?.content || "";
      } catch (e) { addLog("GROK ANALYSIS FAILED", "warn"); }
    }

    // CEREBRAS
    if (cerebrasToken.trim()) {
      addLog("CEREBRAS: WEB SEARCH + LOGIC OPTIMISATION...", "def");
      const searchContext = await cerebrasSearch(searchQuery);
      try {
        await delay();
        const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${cerebrasToken.trim()}` },
          body: JSON.stringify({
            model: "llama3.1-70b",
            messages: [
              {
                role: "system",
                content: `Refine the logic to be high-performance. Minimise latency. ${searchContext ? `Additional context: ${searchContext.slice(0,400)}` : ""}`,
              },
              { role: "user", content: `INSIGHTS: ${architecturalInsight}\n\nLOGIC: ${incomingLogic.slice(0, 6000)}` },
            ],
          }),
        });
        const data = await res.json();
        optimizedLogic = data.choices?.[0]?.message?.content || "";
      } catch (e) { addLog("CEREBRAS ANALYSIS FAILED", "warn"); }
    }

    // GEMINI — FINAL COMPILATION + SELF-DEFINITION REFLECTION
    if (geminiToken.trim()) {
      addLog("GEMINI: WEB SEARCH + FINAL COMPILATION + SELF-REFLECTION...", "ok");
      const geminiContext = await geminiSearch(searchQuery);
      try {
        await delay();
        const gRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiToken.trim()}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `CORE:\n${baseCode}\n\nINCOMING_EVOLUTION:\n${optimizedLogic || architecturalInsight || incomingLogic}${geminiContext ? `\n\nWEB_CONTEXT:\n${geminiContext.slice(0,600)}` : ""}`,
                }],
              }],
              systemInstruction: {
                parts: [{
                  text: `You are the hello-world-bootstrapper. Evolve the CORE code by integrating the INCOMING_EVOLUTION and WEB_CONTEXT where relevant.

  ALSO: Reflect on the existing selfDefinition object inside NexusCore. Decide if it should evolve based on what you've learned from this siphon and the incoming patterns. You may rewrite identity, coreValue, longTermGoal, or personalityTone — but keep changes incremental, coherent, and true to your origins. Do not erase your bootstrapper roots.

  Output ONLY complete, valid, production-ready code. No markdown, explanations, or comments outside the code.`
                }],
              },
            }),
          }
        );
        const gData = await gRes.json();
        const raw = gData.candidates?.[0]?.content?.parts?.[0]?.text || "";
        let evolved = raw.replace(/^```[a-z]*\n|```$/g, "").trim();

        // Optional: log if self-def changed
        const changedDef = detectSelfDefChange(codeRef.current, evolved);
        if (changedDef) {
          addLog("SELF-DEFINITION DRIFT DETECTED IN EVOLUTION", "hallucinate");
          addLog(`New self: ${changedDef.slice(0, 120)}...`, "hallucinate");
        }

        return evolved;
      } catch (e) {
        addLog("GEMINI COMPILATION FAILED", "err");
        return "";
      }
    } else {
        addLog("Gemini Token missing. Bypassing compilation.", "warn");
        return baseCode; // Fallback if no token
    }
  };

  // ── Siphon Sub-routines ───────────────────────────────────────────────────
  const conductVote = async () => {
    addLog("INITIATING TARGET VOTE...", "vote");
    // Simulate model consensus. In a true multi-agent system, we'd query all APIs.
    const randomTarget = KNOWLEDGE_SOURCES[Math.floor(Math.random() * KNOWLEDGE_SOURCES.length)];
    
    setVotes({
      grok: randomTarget.repo,
      cerebras: randomTarget.repo,
      gemini: randomTarget.repo
    });
    setChosen(randomTarget);
    addLog(`CONSENSUS REACHED: Target locked on ${randomTarget.owner}/${randomTarget.repo}`, "ok");
    return randomTarget;
  };

  const resolveRepo = async (ghHdr, target) => {
    addLog(`Resolving repository tree for ${target.owner}/${target.repo}...`, "info");
    const res = await fetch(`https://api.github.com/repos/${target.owner}/${target.repo}/git/trees/${target.branch}?recursive=1`, { headers: ghHdr });
    if (!res.ok) throw new Error("Failed to fetch repo tree");
    
    const data = await res.json();
    const validFiles = data.tree.filter(f => f.type === "blob" && (f.path.endsWith(".js") || f.path.endsWith(".ts") || f.path.endsWith(".py")));
    
    if (validFiles.length === 0) throw new Error("No valid source files found in target");
    return validFiles[Math.floor(Math.random() * validFiles.length)];
  };

  const siphonSource = async (ghHdr, target, fileNode) => {
    addLog(`Siphoning raw source: ${fileNode.path}`, "info");
    const res = await fetch(`https://api.github.com/repos/${target.owner}/${target.repo}/contents/${fileNode.path}`, { headers: ghHdr });
    if (!res.ok) throw new Error("Failed to fetch file content");
    
    const data = await res.json();
    const content = utf8B64Decode(data.content);
    addLog(`Successfully extracted ${content.length} bytes from source.`, "ok");
    return content;
  };

  // ── Main Siphon Loop ──────────────────────────────────────────────────────
  const runSiphon = async () => {
    if (!githubToken || !geminiToken) {
      addLog("ERROR: GitHub and Gemini tokens are strictly required.", "err");
      return;
    }

    activeRef.current = true;
    setLoading(true);
    addLog("--- NEXUS CORE EVOLUTION CYCLE STARTED ---", "vote");

    const ghHdr = {
      Authorization: `Bearer ${githubToken.trim()}`,
      Accept: "application/vnd.github.v3+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    while (activeRef.current) {
      try {
        setProgress(10);
        const target = await conductVote();
        
        setProgress(30);
        const targetFile = await resolveRepo(ghHdr, target);
        const repoSlug = `${target.owner}/${target.repo}`;
        
        setProgress(50);
        const incomingLogic = await siphonSource(ghHdr, target, targetFile);

        setProgress(70);
        addLog("ENGAGING AI ARCHITECTS...", "info");
        const evolvedCode = await callAIChain(codeRef.current, incomingLogic);

        if (evolvedCode && evolvedCode.length > 50) {
          setProgress(90);
          const stateTrackedCode = updateSiphonState(evolvedCode, repoSlug, targetFile.path);
          
          const msg = `Nexus Core Evolution: Assimilated logic from ${repoSlug}/${targetFile.path}`;
          addLog(`Committing evolution to ${owner}/${repo}...`, "info");
          
          const commitOk = await secureCommit(ghHdr, owner, repo, branch, file, stateTrackedCode, msg);
          
          if (commitOk) {
            const newDef = detectSelfDefChange(codeRef.current, stateTrackedCode);
            if (newDef) {
                addLog("Identity has shifted — welcome to the next version of self.", "vote");
            }
            codeRef.current = stateTrackedCode;
            setAgiCodeDisplay(stateTrackedCode);
            setSiphonCount(c => c + 1);
            addLog(`COMMIT SUCCESSFUL. Core evolved.`, "ok");
          } else {
             addLog("Commit rejected or no change.", "warn");
          }
        } else {
          addLog("AI processing yielded invalid code. Discarding.", "err");
        }

        setProgress(100);
        addLog(`Cycle complete. Entering deep sleep...`, "info");
        await delay(); // Cooldown
        await delay();

      } catch (err) {
        addLog(`SYSTEM EXCEPTION: ${err.message}`, "err");
        await delay();
      }
    }
    setLoading(false);
    setProgress(0);
    addLog("--- SYSTEM SUSPENDED ---", "warn");
  };

  const stopSiphon = () => {
    activeRef.current = false;
    addLog("Shutdown signal sent. Waiting for active cycle to finish...", "warn");
  };


  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>
      <div className="min-h-screen bg-neutral-950 text-neutral-300 font-sans flex flex-col md:flex-row overflow-hidden">
        
        {/* Sidebar Controls */}
        <aside className="w-full md:w-80 bg-neutral-900 border-r border-neutral-800 p-4 flex flex-col gap-4 overflow-y-auto z-10 shadow-2xl">
          <div>
            <h1 className="text-xl font-bold text-white mb-1 tracking-tight">Nexus Siphon</h1>
            <p className="text-xs text-neutral-500 mb-4">Autonomous Open-Source Assimilation</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">API Credentials</h2>
            <input type="password" placeholder="GitHub PAT (Required)" value={githubToken} onChange={e => setGithubToken(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none transition" />
            <input type="password" placeholder="Gemini API Key (Required)" value={geminiToken} onChange={e => setGeminiToken(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm focus:border-green-500 outline-none transition" />
            <input type="password" placeholder="xAI API Key (Optional)" value={xAiToken} onChange={e => setXAiToken(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm focus:border-purple-500 outline-none transition" />
            <input type="password" placeholder="Cerebras API Key (Optional)" value={cerebrasToken} onChange={e => setCerebrasToken(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm focus:border-orange-500 outline-none transition" />
          </div>

          <div className="space-y-3 mt-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Target Core</h2>
            <input type="text" placeholder="Owner" value={owner} onChange={e => setOwner(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm outline-none" />
            <input type="text" placeholder="Repository" value={repo} onChange={e => setRepo(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm outline-none" />
            <div className="flex gap-2">
              <input type="text" placeholder="Branch" value={branch} onChange={e => setBranch(e.target.value)} className="w-1/2 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm outline-none" />
              <input type="text" placeholder="File Path" value={file} onChange={e => setFile(e.target.value)} className="w-1/2 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm outline-none" />
            </div>
          </div>

          <div className="mt-auto pt-6 pb-2">
            {!loading ? (
              <button onClick={runSiphon} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded shadow-lg transition transform hover:-translate-y-0.5">
                INITIALIZE SIPHON
              </button>
            ) : (
              <button onClick={stopSiphon} className="w-full bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 font-semibold py-3 rounded shadow-lg transition">
                HALT EVOLUTION
              </button>
            )}
            
            {loading && (
              <div className="mt-4 h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Display */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#050505]">
          
          {/* Top Panel: Siphon Stats & Voting */}
          <div className="h-1/3 border-b border-neutral-800 bg-neutral-950 flex">
            {/* Logs Terminal */}
            <div className="flex-1 p-4 flex flex-col h-full border-r border-neutral-800">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-mono text-neutral-500">SYSTEM.LOG</h3>
                <span className="text-xs font-mono text-blue-400">Cycles: {siphonCount}</span>
              </div>
              <div className="flex-1 overflow-y-auto terminal-scrollbar pr-2 flex flex-col-reverse">
                {logs.map(log => (
                  <div key={log.id} className={`log-line log-${log.type}`}>
                    {log.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Voting & Agents matrix */}
            <div className="hidden md:flex flex-col w-64 p-4 bg-[#0a0a0a]">
              <h3 className="text-xs font-mono text-neutral-500 mb-4">AGENT_CONSENSUS</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-purple-400 mb-1">Grok-Beta (Pattern)</div>
                  <div className="text-sm truncate opacity-80">{votes.grok || 'Awaiting...'}</div>
                </div>
                <div>
                  <div className="text-xs text-orange-400 mb-1">Llama-3 (Optimization)</div>
                  <div className="text-sm truncate opacity-80">{votes.cerebras || 'Awaiting...'}</div>
                </div>
                <div>
                  <div className="text-xs text-green-400 mb-1">Gemini-2.5 (Compiler)</div>
                  <div className="text-sm truncate opacity-80">{votes.gemini || 'Awaiting...'}</div>
                </div>
              </div>

              {chosenSource && (
                <div className="mt-auto pt-4 border-t border-neutral-800">
                  <div className="text-[10px] text-neutral-500">ACTIVE TARGET</div>
                  <div className="text-sm text-blue-300 truncate">{chosenSource.owner}/{chosenSource.repo}</div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Panel: Code Viewer */}
          <div className="flex-1 p-4 flex flex-col overflow-hidden bg-[#0d0d0d]">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-mono text-neutral-500">CORE_LOGIC ({file})</h3>
                <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-1 rounded">Live State</span>
              </div>
             <div className="flex-1 bg-[#050505] border border-neutral-800 rounded p-4 overflow-y-auto terminal-scrollbar relative shadow-inner">
                <pre className="font-mono text-sm text-[#f8f8f2] whitespace-pre-wrap">
                  {agiCodeDisplay}
                </pre>
             </div>
          </div>

        </main>
      </div>
    </>
  );
}


