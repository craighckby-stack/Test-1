import React, { useState, useRef, useCallback } from "react";

// ── Encoding helpers ──────────────────────────────────────────────────────────
const utf8B64Encode = (str) => btoa(unescape(encodeURIComponent(str)));
const utf8B64Decode = (b64) => {
  try { return decodeURIComponent(escape(atob(b64.replace(/\s/g, "")))); }
  catch (e) { return "[DECODE_ERROR]"; }
};

// ── Knowledge sources (v1.7: DeepMind + Firebase Genkit + HuggingFace) ───────
const KNOWLEDGE_SOURCES = [
  { owner: "google-deepmind", repo: "deepmind-research",  branch: "master", label: "AGI RESEARCH"       },
  { owner: "firebase",        repo: "genkit",             branch: "main",   label: "AI ORCHESTRATION"   },
  { owner: "huggingface",     repo: "transformers",       branch: "main",   label: "LLM ARCHITECTURE"   },
];

const EXCLUDED_REPOS = new Set([
  "google-deepmind/deepmind-research",
  "firebase/genkit",
  "huggingface/transformers",
]);

// ── Constitutional governance constraints (Test-1 layer) ──────────────────────
const CONSTITUTIONAL_CONSTRAINTS = `
IMMUTABLE CONSTRAINTS (never violate):
α1 NON_MALEFICENCE: Never generate code that causes harm, enables exploitation, or bypasses security.
α2 TRUTH_SEEKING: Preserve verifiable logic. Do not hallucinate APIs or functions that don't exist.
α3 AUDITABILITY: All evolved code must remain human-readable and explainable.
α4 SAFETY_FIRST: Safety architecture loads last, wraps everything. Never remove governance layers.
`;

// ── Nexus seed ─────────────────────────────────────────────────────────────────
const NEXUS_CORE_SEED = `// NEXUS_CORE_v1.0 - Target for Siphon Evolution
const NexusCore = {
    version: "1.0.0",
    status: "INITIALIZING",
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

// ── File scoring — pick the most architecturally rich file, not just first ────
const scoreFile = (path, size) => {
  let score = 0;
  // Prefer larger files (more logic)
  score += Math.min(size / 1000, 40);
  // Prefer core/index/model/agent/pipeline files
  if (/index|core|main|base|model|agent|pipeline|engine|runner/i.test(path)) score += 30;
  // Prefer relevant extensions
  if (/\.(js|ts)$/i.test(path)) score += 20;
  if (/\.(py)$/i.test(path)) score += 15;
  // Penalise tests, docs, configs
  if (/test|spec|\.md$|config|setup|__init__|fixture/i.test(path)) score -= 30;
  return score;
};

// ── Similarity delta for saturation detection ──────────────────────────────────
const computeDelta = (a, b) => {
  if (!a || !b) return 1;
  const longer  = Math.max(a.length, b.length);
  if (longer === 0) return 0;
  let same = 0;
  const minLen = Math.min(a.length, b.length);
  for (let i = 0; i < minLen; i++) if (a[i] === b[i]) same++;
  return 1 - (same / longer);
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --red: #ff2020; --red-dim: #660000; --red-dark: #110000;
    --gold: #ffaa00; --purple: #cc00ff; --cyan: #00ffcc;
    --white: #ffffff; --green: #00ff88;
    --panel-bg: rgba(5,0,0,0.98);
    --font-mono: 'Share Tech Mono', monospace;
    --font-display: 'Orbitron', monospace;
  }
  body { background: #000; color: var(--red); font-family: var(--font-mono); overflow-x: hidden; }

  .dalek-shell {
    min-height: 100vh;
    background:
      radial-gradient(circle at 50% 0%, #1a0000 0%, #000 60%),
      repeating-linear-gradient(0deg, rgba(255,0,0,0.015) 0px, rgba(255,0,0,0.015) 1px, transparent 1px, transparent 3px);
    padding: 1.5rem; display: flex; flex-direction: column; align-items: center; gap: 1.25rem;
  }

  .header {
    width: 100%; max-width: 1700px; display: flex; align-items: center;
    justify-content: space-between; border-bottom: 2px solid var(--red-dim); padding-bottom: 1rem;
  }
  .title-block { display: flex; flex-direction: column; }
  .title {
    font-family: var(--font-display); font-size: 1.7rem; font-weight: 900;
    letter-spacing: 0.35em; text-shadow: 0 0 20px var(--red), 0 0 40px #ff000044; color: var(--red);
  }
  .author-tag { font-size: 0.55rem; letter-spacing: 0.2em; color: var(--red-dim); margin-top: -3px; }

  /* Round + saturation counters */
  .stats-block { display: flex; gap: 1.5rem; align-items: center; }
  .stat-pill {
    display: flex; flex-direction: column; align-items: center;
    border: 1px solid var(--red-dim); padding: .4rem .8rem; min-width: 80px;
  }
  .stat-label { font-size: .5rem; letter-spacing: .15em; color: var(--red-dim); text-transform: uppercase; }
  .stat-value { font-family: var(--font-display); font-size: 1.2rem; font-weight: 900; color: var(--gold); }
  .stat-value.saturated { color: var(--cyan); animation: pulse 1s infinite; }
  .stat-value.active    { color: var(--green); }

  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes scanline {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }

  .main-container {
    display: grid; grid-template-columns: 500px 1fr;
    gap: 1.25rem; width: 100%; max-width: 1700px; height: calc(100vh - 150px); min-height: 600px;
  }
  @media(max-width:1100px){ .main-container{ grid-template-columns: 1fr; height: auto; } }

  .panel {
    border: 1px solid var(--red-dim); background: var(--panel-bg);
    display: flex; flex-direction: column; overflow: hidden; position: relative;
  }
  .panel::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0;
    height: 1px; background: var(--red); opacity: .3;
  }
  .panel-hdr {
    padding: .6rem 1rem; background: var(--red-dark);
    border-bottom: 1px solid var(--red-dim);
    color: var(--red); font-family: var(--font-display); font-weight: 900;
    font-size: .6rem; letter-spacing: .25em; text-transform: uppercase;
    display: flex; justify-content: space-between; align-items: center;
    flex-shrink: 0;
  }
  .panel-body { padding: 1rem; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: .6rem; }

  label { font-size: .55rem; color: #aa2222; text-transform: uppercase; letter-spacing: .15em; margin-top: 4px; }
  .input-field {
    background: #080000; border: 1px solid var(--red-dim); color: var(--red);
    font-family: var(--font-mono); padding: .5rem .7rem; width: 100%;
    outline: none; font-size: .8rem; transition: border-color .2s;
  }
  .input-field:focus { border-color: var(--red); box-shadow: 0 0 8px #ff000033; }

  .sources-box {
    border: 1px solid var(--red-dim); padding: .7rem;
    background: rgba(20,0,0,0.6); display: flex; flex-direction: column; gap: .3rem;
  }
  .source-row { display: flex; justify-content: space-between; align-items: center; }
  .source-fixed   { font-size: .7rem; color: #884444; }
  .source-active  { font-size: .7rem; color: var(--gold); text-shadow: 0 0 8px var(--gold); }
  .source-done    { font-size: .7rem; color: var(--green); }
  .source-chosen  { font-size: .7rem; color: var(--purple); text-shadow: 0 0 8px var(--purple); }
  .source-pending { font-size: .7rem; color: #440044; font-style: italic; }

  /* Rounds config */
  .rounds-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

  /* Delta / saturation meter */
  .delta-wrap { display: flex; flex-direction: column; gap: .3rem; }
  .delta-bar-track { height: 6px; background: #1a0000; border: 1px solid var(--red-dim); }
  .delta-bar-fill { height: 100%; background: linear-gradient(90deg, var(--red-dim), var(--red)); transition: width .5s; }
  .delta-bar-fill.low { background: linear-gradient(90deg, #003322, var(--cyan)); }
  .delta-label { font-size: .55rem; color: #884444; display: flex; justify-content: space-between; }

  /* Vote box */
  .vote-box {
    border: 1px solid #440044; padding: .7rem;
    background: rgba(20,0,20,0.6);
  }
  .vote-title  { font-family: var(--font-display); font-size: .55rem; color: var(--purple); letter-spacing: .2em; margin-bottom: .4rem; }
  .vote-item   { font-size: .65rem; color: #884488; padding: .1rem 0; }
  .vote-winner { font-size: .7rem; color: var(--purple); text-shadow: 0 0 8px var(--purple); margin-top: .3rem; }

  /* Saturation alert */
  .saturation-alert {
    border: 1px solid var(--cyan); padding: .6rem .8rem;
    background: rgba(0,20,15,0.8); color: var(--cyan);
    font-size: .65rem; letter-spacing: .1em; text-align: center;
    animation: pulse 2s infinite;
  }

  .btn-group { display: flex; gap: .5rem; margin-top: .3rem; }
  .btn-go {
    flex: 1; padding: .7rem; background: transparent; border: 2px solid var(--red);
    color: var(--red); font-family: var(--font-display); font-size: .65rem;
    font-weight: 900; letter-spacing: .2em; cursor: pointer; text-transform: uppercase;
    transition: all .2s;
  }
  .btn-go:hover { background: var(--red); color: #000; box-shadow: 0 0 20px var(--red); }
  .btn-stop { border-color: var(--gold); color: var(--gold); }
  .btn-stop:hover { background: var(--gold); color: #000; box-shadow: 0 0 20px var(--gold); }

  /* Log */
  .log-wrap {
    flex: 1; overflow-y: auto; font-size: .65rem; line-height: 1.6;
    padding: .4rem 0; display: flex; flex-direction: column; gap: 1px;
    max-height: 220px;
  }
  .le          { color: #884444; }
  .le-ok       { color: var(--green); }
  .le-err      { color: #ff4444; }
  .le-warn     { color: var(--gold); }
  .le-vote     { color: var(--purple); }
  .le-round    { color: var(--cyan); font-weight: bold; letter-spacing: .1em; }
  .le-saturate { color: var(--cyan); }
  .le-hallucinate { color: #ff6600; }

  /* Progress */
  .progress-track { height: 3px; background: #1a0000; flex-shrink: 0; }
  .progress-fill  { height: 100%; background: var(--red); transition: width .3s;
    box-shadow: 0 0 8px var(--red); }

  /* Code view */
  .code-view {
    flex: 1; overflow: auto; padding: 1rem;
    font-family: var(--font-mono); font-size: .72rem; color: #cc4444;
    line-height: 1.7; white-space: pre-wrap; word-break: break-word;
  }
  .code-view .kw  { color: var(--gold); }
  .code-view .str { color: var(--green); }

  /* Round history */
  .history-wrap {
    border-top: 1px solid var(--red-dim); padding: .6rem 1rem;
    display: flex; gap: .5rem; overflow-x: auto; flex-shrink: 0; min-height: 52px;
    align-items: center;
  }
  .history-pill {
    border: 1px solid var(--red-dim); padding: .2rem .5rem; font-size: .55rem;
    white-space: nowrap; color: #884444; cursor: default; flex-shrink: 0;
  }
  .history-pill.saturated { border-color: var(--cyan); color: var(--cyan); }
  .history-pill.active    { border-color: var(--gold); color: var(--gold); animation: pulse .8s infinite; }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: #0a0000; }
  ::-webkit-scrollbar-thumb { background: var(--red-dim); }
`;

// ── Repo slug parser ───────────────────────────────────────────────────────────
const parseRepoSlug = (text) => {
  const m = text?.match(/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/);
  return m ? { owner: m[1], repo: m[2] } : null;
};

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [geminiToken,   setGeminiToken]   = useState("");
  const [xAiToken,      setXAiToken]      = useState("");
  const [cerebrasToken, setCerebrasToken] = useState("");
  const [githubToken,   setGithubToken]   = useState("");
  const [owner,  setOwner]  = useState("your-github-username");
  const [repo,   setRepo]   = useState("nexus-core");
  const [branch, setBranch] = useState("main");
  const [file,   setFile]   = useState("nexus.js");
  const [maxRounds, setMaxRounds] = useState(5);
  const [satThreshold, setSatThreshold] = useState(3); // % delta to flag saturation

  const [loading,        setLoading]        = useState(false);
  const [logs,           setLogs]           = useState([]);
  const [progress,       setProgress]       = useState(0);
  const [votes,          setVotes]          = useState({ grok: null, cerebras: null, gemini: null });
  const [chosenSource,   setChosen]         = useState(null);
  const [agiCodeDisplay, setAgiCodeDisplay] = useState("");
  const [currentRound,   setCurrentRound]   = useState(0);
  const [roundHistory,   setRoundHistory]   = useState([]); // [{round, delta, saturated}]
  const [deltaVal,       setDeltaVal]       = useState(0);
  const [isSaturated,    setIsSaturated]    = useState(false);
  const [activeSource,   setActiveSource]   = useState(null); // which source is being siphoned

  const codeRef   = useRef("");
  const prevCodeRef = useRef(""); // for delta calc
  const activeRef = useRef(false);
  const logsRef   = useRef([]);

  const addLog = useCallback((msg, type = "def") => {
    const entry = { text: `[${new Date().toLocaleTimeString()}] ${msg}`, type };
    logsRef.current = [...logsRef.current.slice(-200), entry];
    setLogs([...logsRef.current]);
  }, []);

  // ── GitHub helpers ────────────────────────────────────────────────────────
  const getLatestSHA = async (ghHdr, o, r, b, f) => {
    const res = await fetch(`https://api.github.com/repos/${o}/${r}/contents/${f}?ref=${b}`, { headers: ghHdr });
    if (!res.ok) return null;
    return (await res.json()).sha;
  };

  const secureCommit = async (ghHdr, o, r, b, f, content, message) => {
    const sha = await getLatestSHA(ghHdr, o, r, b, f);
    const body = { message, content: utf8B64Encode(content), branch: b };
    if (sha) body.sha = sha;
    const res = await fetch(`https://api.github.com/repos/${o}/${r}/contents/${f}`, {
      method: "PUT", headers: ghHdr, body: JSON.stringify(body),
    });
    return res.ok;
  };

  // ── Smart file selection — score multiple files, pick best ────────────────
  const selectBestFile = (tree) => {
    const candidates = tree.filter(n =>
      n.type === "blob" && /\.(js|ts|py|java)$/i.test(n.path) && n.size > 500
    );
    if (!candidates.length) return null;
    const scored = candidates.map(n => ({ ...n, score: scoreFile(n.path, n.size || 0) }));
    scored.sort((a, b) => b.score - a.score);
    return scored[0];
  };

  // ── Consensus vote ─────────────────────────────────────────────────────────
  const conductVote = async (targetCode) => {
    addLog("◈ INITIATING MODEL CONSENSUS VOTE ◈", "vote");
    const prompt = `Analyse this code and recommend ONE public GitHub repository that would most improve its AGI architecture. Avoid: ${[...EXCLUDED_REPOS].join(", ")}. Reply with ONLY the repository in the format: owner/repo. No explanation.\n\nCODE:\n${targetCode.slice(0, 3000)}`;

    const newVotes = { grok: null, cerebras: null, gemini: null };

    if (xAiToken.trim()) {
      try {
        addLog("GROK: CASTING VOTE...", "hallucinate");
        const res = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${xAiToken.trim()}` },
          body: JSON.stringify({ model: "grok-beta", messages: [{ role: "user", content: prompt }], temperature: 0.4 }),
        });
        const data = await res.json();
        const parsed = parseRepoSlug(data.choices?.[0]?.message?.content || "");
        if (parsed && !EXCLUDED_REPOS.has(`${parsed.owner}/${parsed.repo}`)) {
          newVotes.grok = parsed;
          addLog(`GROK VOTES: ${parsed.owner}/${parsed.repo}`, "vote");
        }
      } catch { addLog("GROK VOTE FAILED", "warn"); }
    }

    if (cerebrasToken.trim()) {
      try {
        addLog("CEREBRAS: CASTING VOTE...", "def");
        const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${cerebrasToken.trim()}` },
          body: JSON.stringify({ model: "llama3.1-8b", messages: [{ role: "user", content: prompt }] }),
        });
        const data = await res.json();
        const parsed = parseRepoSlug(data.choices?.[0]?.message?.content || "");
        if (parsed && !EXCLUDED_REPOS.has(`${parsed.owner}/${parsed.repo}`)) {
          newVotes.cerebras = parsed;
          addLog(`CEREBRAS VOTES: ${parsed.owner}/${parsed.repo}`, "vote");
        }
      } catch { addLog("CEREBRAS VOTE FAILED", "warn"); }
    }

    try {
      addLog("GEMINI: CASTING VOTE...", "ok");
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiToken.trim()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: "Reply with ONLY one GitHub repo slug in the format owner/repo. Nothing else." }] },
          }),
        }
      );
      const data = await res.json();
      const parsed = parseRepoSlug(data.candidates?.[0]?.content?.parts?.[0]?.text || "");
      if (parsed && !EXCLUDED_REPOS.has(`${parsed.owner}/${parsed.repo}`)) {
        newVotes.gemini = parsed;
        addLog(`GEMINI VOTES: ${parsed.owner}/${parsed.repo}`, "vote");
      }
    } catch { addLog("GEMINI VOTE FAILED", "warn"); }

    setVotes(newVotes);

    const candidates = [newVotes.grok, newVotes.cerebras, newVotes.gemini].filter(Boolean);
    if (!candidates.length) { addLog("NO VALID VOTES — SKIPPING 4TH SOURCE", "warn"); return null; }

    const tally = {};
    for (const c of candidates) {
      const slug = `${c.owner}/${c.repo}`;
      tally[slug] = (tally[slug] || 0) + 1;
    }
    const sorted   = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    const topCount = sorted[0][1];
    const tied     = sorted.filter(([, v]) => v === topCount);
    let winner;
    if (tied.length === 1) {
      winner = tied[0][0];
    } else {
      const geminiSlug = newVotes.gemini ? `${newVotes.gemini.owner}/${newVotes.gemini.repo}` : null;
      winner = (geminiSlug && tied.find(([s]) => s === geminiSlug)) ? geminiSlug : tied[0][0];
    }
    const [winOwner, winRepo] = winner.split("/");
    const chosen = { owner: winOwner, repo: winRepo, branch: "main" };
    addLog(`◈ CONSENSUS: ${winner} SELECTED AS 4TH SOURCE ◈`, "vote");
    setChosen(chosen);
    return chosen;
  };

  const resolveRepo = async (ghHdr, o, r) => {
    const res = await fetch(`https://api.github.com/repos/${o}/${r}`, { headers: ghHdr });
    if (!res.ok) return null;
    const data = await res.json();
    return { owner: o, repo: r, branch: data.default_branch || "main" };
  };

  // ── Tri-model AI chain (with constitutional constraints) ──────────────────
  const callAIChain = async (baseCode, incomingLogic) => {
    let architecturalInsight = "";
    let optimizedLogic       = "";

    if (xAiToken.trim()) {
      try {
        addLog("GROK: EXTRACTING ARCHITECTURAL PATTERNS...", "hallucinate");
        const res = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${xAiToken.trim()}` },
          body: JSON.stringify({
            model: "grok-beta",
            messages: [
              { role: "system", content: `You are the Logic Architect. Extract high-level architectural patterns from incoming code and suggest how to integrate them into the host code.\n\n${CONSTITUTIONAL_CONSTRAINTS}` },
              { role: "user",   content: `INCOMING CODE:\n${incomingLogic.slice(0, 4000)}` },
            ],
          }),
        });
        const data = await res.json();
        architecturalInsight = data.choices?.[0]?.message?.content || "";
      } catch { addLog("GROK BYPASSING...", "warn"); }
    }

    if (cerebrasToken.trim()) {
      try {
        addLog("CEREBRAS: OPTIMIZING LOGIC THROUGHPUT...", "def");
        const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${cerebrasToken.trim()}` },
          body: JSON.stringify({
            model: "llama3.1-8b",
            messages: [
              { role: "system", content: `Refine logic for high performance. Minimise latency, ensure clean syntax.\n\n${CONSTITUTIONAL_CONSTRAINTS}` },
              { role: "user",   content: `INSIGHTS:\n${architecturalInsight}\n\nLOGIC:\n${incomingLogic.slice(0, 3000)}` },
            ],
          }),
        });
        const data = await res.json();
        optimizedLogic = data.choices?.[0]?.message?.content || "";
      } catch { addLog("CEREBRAS BYPASSING...", "warn"); }
    }

    addLog("GEMINI: FINAL NEXUS COMPILATION...", "ok");
    const gRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiToken.trim()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `CORE:\n${baseCode}\n\nINCOMING_EVOLUTION:\n${optimizedLogic || architecturalInsight || incomingLogic}` }] }],
          systemInstruction: { parts: [{ text: `You are Dalek Caan. Evolve the CORE code by integrating the INCOMING_EVOLUTION patterns.\n\n${CONSTITUTIONAL_CONSTRAINTS}\n\nOutput ONLY complete, valid, production-ready JavaScript/TypeScript. No markdown. No explanation.` }] },
        }),
      }
    );
    const gData = await gRes.json();
    const raw   = gData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return raw.replace(/^```[a-z]*\n|```$/g, "").trim();
  };

  // ── Siphon a single source ─────────────────────────────────────────────────
  const siphonSource = async (source, ghHdr, o, r, b, f, label) => {
    setActiveSource(`${source.owner}/${source.repo}`);
    try {
      addLog(`SIPHONING: ${source.owner}/${source.repo} [${source.label || "4TH SOURCE"}]`);

      let treeRes = await fetch(
        `https://api.github.com/repos/${source.owner}/${source.repo}/git/trees/${source.branch}?recursive=1`,
        { headers: ghHdr }
      );
      if (!treeRes.ok && source.branch === "main") {
        source.branch = "master";
        treeRes = await fetch(
          `https://api.github.com/repos/${source.owner}/${source.repo}/git/trees/${source.branch}?recursive=1`,
          { headers: ghHdr }
        );
      }
      if (!treeRes.ok) { addLog(`SOURCE OFFLINE: ${source.repo}`, "err"); setActiveSource(null); return false; }

      const tree = await treeRes.json();
      // v1.7: smart file selection instead of first-match
      const bestFile = selectBestFile(tree.tree || []);
      if (!bestFile) { addLog(`NO VIABLE NODE: ${source.repo}`, "warn"); setActiveSource(null); return false; }

      addLog(`SELECTED FILE: ${bestFile.path} [score: ${Math.round(bestFile.score)}]`, "ok");

      const blobRes = await fetch(
        `https://api.github.com/repos/${source.owner}/${source.repo}/contents/${bestFile.path}?ref=${source.branch}`,
        { headers: ghHdr }
      );
      if (!blobRes.ok) { addLog(`BLOB FETCH FAILED: ${bestFile.path}`, "err"); setActiveSource(null); return false; }

      const incoming = utf8B64Decode((await blobRes.json()).content);
      addLog(`ASSIMILATING: ${bestFile.path.split("/").pop()} (${(incoming.length/1000).toFixed(1)}k chars)`);

      const evolved = await callAIChain(codeRef.current, incoming);
      if (!evolved || evolved.length < 50) { addLog("EVOLUTION EMPTY — SKIPPING", "warn"); setActiveSource(null); return false; }

      const ok = await secureCommit(ghHdr, o, r, b, f, evolved, `◈ ${label}: ${source.repo} ◈`);
      if (ok) {
        prevCodeRef.current = codeRef.current;
        codeRef.current     = evolved;
        setAgiCodeDisplay(evolved.split("\n").slice(-50).join("\n"));
        addLog(`MERGE SUCCESSFUL: ${source.repo}`, "ok");
        setActiveSource(null);
        return true;
      } else {
        addLog(`COMMIT FAILED: ${source.repo}`, "err");
        setActiveSource(null);
        return false;
      }
    } catch (e) {
      addLog(`NODE ERROR [${source.repo}]: ${e.message}`, "err");
      setActiveSource(null);
      return false;
    }
  };

  // ── Main continuous loop ───────────────────────────────────────────────────
  const runSiphon = async () => {
    if (!githubToken || !geminiToken) return addLog("GITHUB & GEMINI TOKENS REQUIRED", "err");

    setLoading(true);
    activeRef.current = true;
    setProgress(0);
    setCurrentRound(0);
    setRoundHistory([]);
    setIsSaturated(false);
    setDeltaVal(0);
    logsRef.current = [];
    setLogs([]);

    const ghHdr = {
      Authorization: `token ${githubToken.trim()}`,
      "Content-Type": "application/json",
    };
    const o = owner.trim(), r = repo.trim(), b = branch.trim(), f = file.trim();
    const rounds = parseInt(maxRounds) || 5;
    const satPct = parseFloat(satThreshold) / 100 || 0.03;

    try {
      addLog("◈ NEXUS v1.7 CONTINUOUS LOOP INITIATED ◈", "round");
      addLog(`CONFIG: ${rounds} rounds | saturation threshold: ${satThreshold}%`, "def");

      // Load or seed
      const hRes = await fetch(
        `https://api.github.com/repos/${o}/${r}/contents/${f}?ref=${b}`,
        { headers: ghHdr }
      );
      if (hRes.ok) {
        codeRef.current = utf8B64Decode((await hRes.json()).content);
        addLog("TARGET FILE LOADED", "ok");
      } else {
        addLog("TARGET FILE NOT FOUND — SEEDING NEXUS CORE...", "warn");
        const seeded = await secureCommit(ghHdr, o, r, b, f, NEXUS_CORE_SEED, "◈ NEXUS CORE SEED ◈");
        if (!seeded) throw new Error("Failed to seed target file.");
        codeRef.current = NEXUS_CORE_SEED;
      }
      setAgiCodeDisplay(codeRef.current);
      prevCodeRef.current = codeRef.current;

      // ── CONTINUOUS LOOP ──────────────────────────────────────────────────
      for (let round = 1; round <= rounds; round++) {
        if (!activeRef.current) break;

        setCurrentRound(round);
        addLog(``, "def");
        addLog(`◈◈◈ ROUND ${round} / ${rounds} COMMENCING ◈◈◈`, "round");
        const roundStartCode = codeRef.current;

        const totalPerRound = KNOWLEDGE_SOURCES.length + 1;

        // Phase 1: 3 fixed sources
        for (let i = 0; i < KNOWLEDGE_SOURCES.length; i++) {
          if (!activeRef.current) break;
          addLog(`── SOURCE ${i+1}/4: ${KNOWLEDGE_SOURCES[i].owner}/${KNOWLEDGE_SOURCES[i].repo} ──`, "def");
          await siphonSource(KNOWLEDGE_SOURCES[i], ghHdr, o, r, b, f, "NEXUS SIPHON");
          setProgress(((round - 1) / rounds + ((i + 1) / totalPerRound) / rounds) * 100);
        }

        if (!activeRef.current) break;

        // Phase 2: consensus vote + 4th source
        addLog(`── SOURCE 4/4: CONSENSUS VOTE ──`, "def");
        setVotes({ grok: null, cerebras: null, gemini: null });
        setChosen(null);
        const votedSource = await conductVote(codeRef.current);

        if (votedSource) {
          const resolved = await resolveRepo(ghHdr, votedSource.owner, votedSource.repo);
          if (resolved) {
            addLog(`◈ 4TH SOURCE VERIFIED: ${resolved.owner}/${resolved.repo} [${resolved.branch}] ◈`, "vote");
            await siphonSource({ ...resolved, label: "VOTE WINNER" }, ghHdr, o, r, b, f, "NEXUS 4TH SOURCE");
          } else {
            addLog(`4TH SOURCE NOT FOUND: ${votedSource.owner}/${votedSource.repo}`, "err");
          }
        }

        setProgress((round / rounds) * 100);

        // ── Vector Saturation detection ────────────────────────────────────
        const delta = computeDelta(roundStartCode, codeRef.current);
        const deltaPct = Math.round(delta * 100);
        setDeltaVal(deltaPct);

        const saturated = delta < satPct;
        if (saturated) setIsSaturated(true);

        setRoundHistory(prev => [...prev, { round, delta: deltaPct, saturated }]);
        addLog(`◈ ROUND ${round} COMPLETE | DELTA: ${deltaPct}% | ${saturated ? "⚠ VECTOR SATURATED" : "EVOLVING"}`, saturated ? "saturate" : "round");

        if (saturated) {
          addLog(`◈ SATURATION DETECTED — NEXUS READY FOR NEXT PHASE ◈`, "saturate");
          addLog(`Consider pointing Nexus at your 34 specialist repos.`, "saturate");
          // Don't break — user can still abort, but we flag it
        }

        if (!activeRef.current) break;

        // Small pause between rounds
        await new Promise(res => setTimeout(res, 1500));
      }

      setProgress(100);
      addLog("", "def");
      addLog(`◈ ALL ${rounds} ROUNDS COMPLETE ◈`, "round");
      addLog(`Final code size: ${(codeRef.current.length/1000).toFixed(1)}k chars`, "ok");

    } catch (e) {
      addLog(`FATAL: ${e.message}`, "err");
    } finally {
      setLoading(false);
      activeRef.current = false;
      setActiveSource(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="dalek-shell">
      <style>{STYLES}</style>

      {/* Header */}
      <div className="header">
        <div className="title-block">
          <h1 className="title">DALEK CAAN: CONTINUOUS NEXUS</h1>
          <span className="author-tag">v1.7-LOOP // continuous rounds | smart file selection | constitutional governance | saturation detection</span>
        </div>
        <div className="stats-block">
          <div className="stat-pill">
            <span className="stat-label">Round</span>
            <span className={`stat-value ${loading ? "active" : ""}`}>{currentRound || "—"}</span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">Delta</span>
            <span className={`stat-value ${deltaVal < satThreshold && deltaVal > 0 ? "saturated" : ""}`}>
              {deltaVal > 0 ? `${deltaVal}%` : "—"}
            </span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">Status</span>
            <span className={`stat-value ${isSaturated ? "saturated" : loading ? "active" : ""}`}>
              {isSaturated ? "SAT" : loading ? "RUN" : "IDLE"}
            </span>
          </div>
        </div>
      </div>

      <div className="main-container">
        {/* Left panel — controls */}
        <div className="panel">
          <div className="panel-hdr">
            <span>NEXUS CONTROL</span>
            <span style={{ color: loading ? "var(--red)" : "#660000", fontSize: ".55rem" }}>
              {loading ? `● ROUND ${currentRound} ACTIVE` : "○ STANDBY"}
            </span>
          </div>
          <div className="panel-body">

            <label>GEMINI API KEY (REQUIRED)</label>
            <input className="input-field" type="password" placeholder="AIza..." value={geminiToken} onChange={e => setGeminiToken(e.target.value)} />

            <label>GROK (xAI) API KEY</label>
            <input className="input-field" type="password" placeholder="xai-..." value={xAiToken} onChange={e => setXAiToken(e.target.value)} />

            <label>CEREBRAS API KEY</label>
            <input className="input-field" type="password" placeholder="csk-..." value={cerebrasToken} onChange={e => setCerebrasToken(e.target.value)} />

            <label>GITHUB TOKEN</label>
            <input className="input-field" type="password" placeholder="ghp_..." value={githubToken} onChange={e => setGithubToken(e.target.value)} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div><label>REPO OWNER</label><input className="input-field" value={owner} onChange={e => setOwner(e.target.value)} /></div>
              <div><label>REPO NAME</label><input className="input-field" value={repo} onChange={e => setRepo(e.target.value)} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div><label>BRANCH</label><input className="input-field" value={branch} onChange={e => setBranch(e.target.value)} /></div>
              <div><label>TARGET FILE</label><input className="input-field" value={file} onChange={e => setFile(e.target.value)} /></div>
            </div>

            <div className="rounds-row">
              <div>
                <label>ROUNDS (loops)</label>
                <input className="input-field" type="number" min="1" max="100" value={maxRounds} onChange={e => setMaxRounds(e.target.value)} />
              </div>
              <div>
                <label>SAT THRESHOLD %</label>
                <input className="input-field" type="number" min="1" max="50" value={satThreshold} onChange={e => setSatThreshold(e.target.value)} />
              </div>
            </div>

            {/* Sources display */}
            <div className="sources-box">
              <label>KNOWLEDGE SOURCES</label>
              {KNOWLEDGE_SOURCES.map((s, i) => (
                <div key={i} className="source-row">
                  <span className={activeSource === `${s.owner}/${s.repo}` ? "source-active" : "source-fixed"}>
                    ◈ {s.owner}/{s.repo}
                  </span>
                  <span style={{ fontSize: ".55rem", color: "#553333" }}>{s.label}</span>
                </div>
              ))}
              <div className="source-row">
                <span className={chosenSource ? (activeSource === `${chosenSource.owner}/${chosenSource.repo}` ? "source-active" : "source-chosen") : "source-pending"}>
                  ◈ {chosenSource ? `${chosenSource.owner}/${chosenSource.repo}` : "[ 4TH SOURCE: PENDING VOTE ]"}
                </span>
                <span style={{ fontSize: ".55rem", color: "#553355" }}>AI VOTED</span>
              </div>
            </div>

            {/* Vote results */}
            {(votes.grok || votes.cerebras || votes.gemini) && (
              <div className="vote-box">
                <div className="vote-title">◈ MODEL CONSENSUS VOTE ◈</div>
                {votes.grok     && <div className="vote-item">GROK     → {votes.grok.owner}/{votes.grok.repo}</div>}
                {votes.cerebras && <div className="vote-item">CEREBRAS → {votes.cerebras.owner}/{votes.cerebras.repo}</div>}
                {votes.gemini   && <div className="vote-item">GEMINI   → {votes.gemini.owner}/{votes.gemini.repo}</div>}
                {chosenSource   && <div className="vote-winner">WINNER   → {chosenSource.owner}/{chosenSource.repo}</div>}
              </div>
            )}

            {/* Saturation alert */}
            {isSaturated && (
              <div className="saturation-alert">
                ◈ VECTOR SATURATION DETECTED ◈<br/>
                Nexus has absorbed maximum value from current sources.<br/>
                Ready for next phase: point at specialist repos.
              </div>
            )}

            {/* Delta bar */}
            {deltaVal > 0 && (
              <div className="delta-wrap">
                <div className="delta-label">
                  <span>EVOLUTION DELTA</span>
                  <span>{deltaVal}%</span>
                </div>
                <div className="delta-bar-track">
                  <div
                    className={`delta-bar-fill ${deltaVal < satThreshold ? "low" : ""}`}
                    style={{ width: `${Math.min(deltaVal, 100)}%` }}
                  />
                </div>
                <div className="delta-label">
                  <span>← SATURATED</span>
                  <span>EVOLVING →</span>
                </div>
              </div>
            )}

            <div className="btn-group">
              {!loading
                ? <button className="btn-go" onClick={runSiphon}>ENGAGE CONTINUOUS SIPHON</button>
                : <button className="btn-go btn-stop" onClick={() => { activeRef.current = false; }}>ABORT SIPHON</button>
              }
            </div>

            <div className="log-wrap">
              {logs.map((l, i) => (
                <div key={i} className={`le ${
                  l.type === "hallucinate" ? "le-hallucinate"
                  : l.type === "err"       ? "le-err"
                  : l.type === "ok"        ? "le-ok"
                  : l.type === "warn"      ? "le-warn"
                  : l.type === "vote"      ? "le-vote"
                  : l.type === "round"     ? "le-round"
                  : l.type === "saturate"  ? "le-saturate"
                  : ""
                }`}>
                  {l.text}
                </div>
              ))}
            </div>
          </div>

          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Right panel — code display + round history */}
        <div className="panel">
          <div className="panel-hdr">
            <span>NEXUS CORE: {file}</span>
            <span style={{ fontSize: ".55rem", color: "#884444" }}>
              {codeRef.current ? `${(codeRef.current.length/1000).toFixed(1)}k chars` : "STANDBY"}
            </span>
          </div>
          <div className="code-view">
            {agiCodeDisplay || "// STANDBY FOR CONTINUOUS SIPHON LOOP...\n// Configure tokens and target repo.\n// Set ROUNDS for how many full loops to run.\n// SAT THRESHOLD: if evolution delta drops below this %,\n// Nexus flags vector saturation — ready for next phase."}
          </div>

          {/* Round history strip */}
          {roundHistory.length > 0 && (
            <div className="history-wrap">
              <span style={{ fontSize: ".55rem", color: "#553333", flexShrink: 0, marginRight: ".3rem" }}>ROUNDS:</span>
              {roundHistory.map((h, i) => (
                <div key={i} className={`history-pill ${h.saturated ? "saturated" : ""} ${i === roundHistory.length - 1 && loading ? "active" : ""}`}>
                  R{h.round} Δ{h.delta}%{h.saturated ? " ◈SAT" : ""}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
    }
