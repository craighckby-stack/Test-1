import React, { useState, useEffect, useRef, useCallback } from "react";

const appId = typeof __app_id !== "undefined" ? __app_id : "dalek-caan-bootstrapper";
const geminiApiKey = ""; // Standard key assignment for this environment

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
    transition: all 0.2s;
  }

  .btn-go:hover { opacity: 0.8; }
  .btn-stop { background: #330000 !important; color: var(--red) !important; border: 1px solid var(--red); box-shadow: inset 0 0 10px rgba(255,0,0,0.5); }
  
  .btn-reset {
    background: transparent;
    color: var(--red-dim);
    border: 1px solid var(--red-dim);
    padding: 0.3rem;
    font-size: 0.6rem;
    margin-top: 5px;
    cursor: pointer;
  }
  .btn-reset:hover { color: var(--red); border-color: var(--red); }

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

  .le { border-left: 2px solid var(--red-dim); padding-left: 8px; line-height: 1.4; word-break: break-all; }
  .le-err { color: #ff5555; border-left-color: #ff0000; background: rgba(255,0,0,0.05); }
  .le-hallucinate { color: #cc00ff; border-left-color: #cc00ff; }
  .le-ok { color: #00ff00; border-left-color: #00ff00; }
  .le-info { color: #aaa; border-left-color: #333; }

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

  .progress-track { width: 100%; height: 3px; background: #110000; }
  .progress-fill { height: 100%; background: var(--red); transition: width 0.4s ease; }
`;

const utf8B64Encode = (str) => btoa(unescape(encodeURIComponent(str)));
const utf8B64Decode = (b64) => {
  try { return decodeURIComponent(escape(atob(b64.replace(/\s/g, "")))); } 
  catch (e) { return "[BASE64_DECODE_ERR]"; }
};

export default function App() {
  const [tokens, setTokens] = useState({ cerebras: "", github: "" });
  const [config, setConfig] = useState({ 
    owner: "TheAlgorithms", 
    repo: "Python", 
    branch: "master", 
    file: "hello-world.js" 
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [displayCode, setDisplayCode] = useState("");
  const [progress, setProgress] = useState(0);

  const activeRef = useRef(false);
  const codeRef = useRef("");
  const logEndRef = useRef(null);
  const fileCursorRef = useRef(0);
  const fullTreeRef = useRef([]);
  const instructionContextRef = useRef(""); // Stores README context
  const enhancementHistoryRef = useRef(""); // Stores README-ENHANCER history

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = useCallback((msg, type = "def") => {
    setLogs((p) => [...p, { text: `[${new Date().toLocaleTimeString()}] ${msg}`, type }].slice(-150));
  }, []);

  const clearMemory = () => {
    codeRef.current = "";
    setDisplayCode("");
    setProgress(0);
    fileCursorRef.current = 0;
    fullTreeRef.current = [];
    instructionContextRef.current = "";
    enhancementHistoryRef.current = "";
    addLog("LOCAL SYNTHESIS MEMORY & CURSOR PURGED", "hallucinate");
  };

  const haltProcess = () => {
    activeRef.current = false;
    setLoading(false);
    addLog("HALT COMMAND RECEIVED - TERMINATING PROCESS", "err");
  };

  const wait = (ms) => new Promise(resolve => {
    const start = Date.now();
    const interval = setInterval(() => {
        if (!activeRef.current || (Date.now() - start >= ms)) {
            clearInterval(interval);
            resolve();
        }
    }, 100);
  });

  const safeFetch = async (url, options) => {
    const response = await fetch(url, options);
    const raw = await response.text();
    let result;
    try {
        result = JSON.parse(raw);
    } catch (e) {
        throw new Error(`JSON_PARSE_ERR: ${raw.substring(0, 50)}...`);
    }
    if (!response.ok) {
        const errorMsg = result.error?.message || result.message || "Unknown API Error";
        throw new Error(`API_${response.status}: ${errorMsg}`);
    }
    return result;
  };

  const generateReadmeUpdate = async (batchFiles) => {
    addLog("GEMINI: DRAFTING ENHANCEMENT SUMMARY...", "hallucinate");
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
    try {
      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `INSTRUCTIONS: ${instructionContextRef.current}\nHISTORY: ${enhancementHistoryRef.current}\nNEW FILES: ${batchFiles.join(", ")}. Write a short, professional English summary of these enhancements. SCI-FI tone.` }] }]
        })
      });
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Batch synchronization complete.";
    } catch (e) {
      return `Synchronized batch files: ${batchFiles.join(", ")}`;
    }
  };

  const callAIChainWithRetry = async (nodeContent, currentCore, retries = 5) => {
    const delays = [1000, 2000, 4000, 8000, 16000];
    for (let attempt = 0; attempt < retries; attempt++) {
      if (!activeRef.current) return null;
      try {
        let abstraction = "";
        const cleanContent = nodeContent.replace(/[^\x20-\x7E\n]/g, "").substring(0, 3000);
        const cleanCore = (currentCore || "").replace(/[^\x20-\x7E\n]/g, "").substring(0, 2000);

        if (tokens.cerebras) {
          addLog(`CEREBRAS: GENERATING ABSTRACTIONS (A:${attempt + 1})...`, "hallucinate");
          const data = await safeFetch("https://api.cerebras.ai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokens.cerebras}` },
            body: JSON.stringify({
              model: "llama3.1-8b",
              messages: [
                { role: "system", content: "Analyze algorithm logic and generate 5 extensions. Contextualize using instructions." },
                { role: "user", content: `GUIDELINES: ${instructionContextRef.current}\nHISTORY: ${enhancementHistoryRef.current}\nCONTEXT: ${cleanCore}\nDATA: ${cleanContent}` }
              ]
            })
          });
          abstraction = data.choices[0].message.content;
        }

        if (!activeRef.current) return null;
        addLog("GEMINI: SEALING REALITY...", "ok");
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `INSTRUCTIONS: ${instructionContextRef.current}\nABSTRACTIONS: ${abstraction}\nCORE: ${currentCore}\nNEW: ${nodeContent}` }] }],
            systemInstruction: { parts: [{ text: "Consolidate into a single valid Python function: calculate_nexus_branch_synthesis. Focus on strictly following the instructions from the README." }] }
          })
        });

        const rawText = await res.text();
        const data = JSON.parse(rawText);
        const final = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (!final) throw new Error("EMPTY_GEMINI_PAYLOAD");
        return final.replace(/^```[a-z]*\n|```$/g, "").trim();
      } catch (e) {
        if (attempt === retries - 1 || !activeRef.current) {
          addLog(`AI CHAIN ERROR: ${e.message}`, "err");
          return null;
        }
        addLog(`RETRYING AI (${attempt+1}/${retries}): ${e.message}`, "info");
        await wait(delays[attempt]);
      }
    }
  };

  const runSync = async () => {
    if (!tokens.github || !tokens.cerebras) return addLog("CRITICAL: API KEYS NOT SET", "err");
    setLoading(true); activeRef.current = true;
    const ghHdr = { Authorization: `token ${tokens.github}`, "Content-Type": "application/json" };

    try {
      while (activeRef.current) {
        // --- STEP 1: KNOWLEDGE PRE-LOADING (Instructions & History) ---
        if (!instructionContextRef.current) {
          addLog("LOADING INSTRUCTION SET (README.md)...", "info");
          const r1 = await fetch(`https://api.github.com/repos/craighckby-stack/Test-1/contents/README.md?ref=Nexus-Database`, { headers: ghHdr });
          if (r1.ok) {
            const d1 = await r1.json();
            instructionContextRef.current = utf8B64Decode(d1.content).substring(0, 1500);
            addLog("INSTRUCTIONS LOADED INTO MEMORY", "ok");
          }

          addLog("LOADING ENHANCEMENT HISTORY (README-ENHANCER.md)...", "info");
          const r2 = await fetch(`https://api.github.com/repos/craighckby-stack/Test-1/contents/README-ENHANCER.md?ref=Nexus-Database`, { headers: ghHdr });
          if (r2.ok) {
            const d2 = await r2.json();
            enhancementHistoryRef.current = utf8B64Decode(d2.content).slice(-1500); // Last 1500 chars for context
            addLog("ENHANCEMENT HISTORY LOADED", "ok");
          } else {
            addLog("NO PREVIOUS ENHANCER LOG - HISTORY EMPTY", "info");
          }
        }

        if (!codeRef.current) {
          addLog(`RECOVERING BASE FROM: ${config.file}...`, "info");
          const targetUrl = `https://api.github.com/repos/craighckby-stack/Test-1/contents/${config.file}`;
          const existing = await fetch(`${targetUrl}?ref=Nexus-Database`, { headers: ghHdr });
          if (existing.ok) {
             const existingData = await existing.json();
             codeRef.current = utf8B64Decode(existingData.content);
             setDisplayCode(codeRef.current);
             addLog("BASE STATE RECOVERED", "ok");
          } else {
             addLog("NO PREVIOUS STATE FOUND - STARTING FRESH", "info");
             codeRef.current = "# Nexus System Initialized";
          }
        }

        if (fullTreeRef.current.length === 0) {
          addLog(`INDEXING REPO: ${config.owner}/${config.repo}...`, "info");
          const treeRes = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/git/trees/${config.branch}?recursive=1`, { headers: ghHdr });
          const treeData = await treeRes.json();
          if (!treeData.tree) throw new Error("REPO_ACCESS_FAILED");
          fullTreeRef.current = treeData.tree.filter(n => n.type === "blob" && n.path.endsWith(".py"));
          addLog(`INDEXED ${fullTreeRef.current.length} SOURCE FILES`, "ok");
        }

        const startIndex = fileCursorRef.current;
        const batch = fullTreeRef.current.slice(startIndex, startIndex + 5);
        if (batch.length === 0) {
          addLog("INDEX EXHAUSTED - RESTARTING FROM FILE 0", "hallucinate");
          fileCursorRef.current = 0; continue;
        }

        addLog(`STARTING BATCH: [${startIndex + 1} TO ${startIndex + batch.length}]`, "info");
        const processedInThisBatch = [];

        for (let i = 0; i < batch.length; i++) {
          if (!activeRef.current) break;
          const currentNode = batch[i];
          addLog(`READING SOURCE: ${currentNode.path}`, "info");
          const nodeRes = await fetch(currentNode.url, { headers: ghHdr });
          const nodeData = await nodeRes.json();
          const nodeContent = utf8B64Decode(nodeData.content);

          addLog(`SYNTHESIZING: ${currentNode.path.split('/').pop()}`, "ok");
          const nextCode = await callAIChainWithRetry(nodeContent, codeRef.current);
          
          if (nextCode && activeRef.current) {
            codeRef.current = nextCode;
            setDisplayCode(nextCode);
            processedInThisBatch.push(currentNode.path);
            
            const targetUrl = `https://api.github.com/repos/craighckby-stack/Test-1/contents/${config.file}`;
            const cur = await fetch(`${targetUrl}?ref=Nexus-Database`, { headers: ghHdr });
            const curData = cur.ok ? await cur.json() : null;

            const putRes = await fetch(targetUrl, {
              method: "PUT", headers: ghHdr,
              body: JSON.stringify({
                message: `◈ SYNTHESIS CYCLE: ${currentNode.path} ◈`,
                content: utf8B64Encode(nextCode),
                sha: curData?.sha,
                branch: "Nexus-Database"
              })
            });
            if (putRes.ok) addLog(`SUCCESSFULLY ASSIMILATED: ${currentNode.path}`, "ok");
            else addLog(`SYNC FAILED [${putRes.status}]: ${currentNode.path}`, "err");
          }
          setProgress(((i + 1) / batch.length) * 100);
          if (activeRef.current) { addLog("STABILIZING (25s COOLDOWN)..."); await wait(25000); }
        }

        if (activeRef.current && processedInThisBatch.length > 0) {
          addLog("BATCH COMPLETE: UPDATING ENHANCER LOG...", "hallucinate");
          const readmeText = await generateReadmeUpdate(processedInThisBatch);
          const enhancerLogUrl = `https://api.github.com/repos/craighckby-stack/Test-1/contents/README-ENHANCER.md`;
          
          const existingLog = await fetch(`${enhancerLogUrl}?ref=Nexus-Database`, { headers: ghHdr });
          let newContent = "";
          let logSha = null;

          if (existingLog.ok) {
            const logData = await existingLog.json();
            logSha = logData.sha;
            newContent = utf8B64Decode(logData.content) + "\n\n---\n\n### Batch Enhancement: " + new Date().toLocaleString() + "\n" + readmeText;
          } else {
            newContent = "# NEXUS ENHANCER LOG\n\nThis document tracks enhancements.\n\n" + readmeText;
          }

          const logPut = await fetch(enhancerLogUrl, {
            method: "PUT", headers: ghHdr,
            body: JSON.stringify({
              message: "◈ LOGGING CORE ENHANCEMENTS ◈",
              content: utf8B64Encode(newContent),
              sha: logSha,
              branch: "Nexus-Database"
            })
          });

          if (logPut.ok) {
            addLog("ENHANCER LOG UPDATED SUCCESSFULLY", "ok");
            enhancementHistoryRef.current = newContent.slice(-1500); // Update history memory
          } else {
            addLog("ENHANCER LOG SYNC FAILED", "err");
          }
        }

        if (activeRef.current) {
          fileCursorRef.current += batch.length;
          addLog(`BATCH FINISHED. CURSOR AT ${fileCursorRef.current}. PURGING LOCAL MEMORY.`, "hallucinate");
          codeRef.current = ""; await wait(2000); 
        }
      }
    } catch (e) { addLog(`CRITICAL ERROR: ${e.message}`, "err"); haltProcess(); }
  };

  return (
    <div className="dalek-shell">
      <style>{STYLES}</style>
      <div className="header"><h1 className="title">BOOTSTRAPPER</h1></div>
      <div className="main-container">
        <div className="panel">
          <div className="panel-hdr">NEXUS CONTROL SYSTEM</div>
          <div className="panel-body">
            <input className="input-field" type="password" placeholder="CEREBRAS API" value={tokens.cerebras} onChange={e => setTokens({...tokens, cerebras: e.target.value})} />
            <input className="input-field" type="password" placeholder="GITHUB TOKEN" value={tokens.github} onChange={e => setTokens({...tokens, github: e.target.value})} />
            <div style={{display:'flex', gap:'5px', fontSize:'0.7rem', color:'#660000', marginBottom:'5px'}}>
              Source: {config.owner}/{config.repo} | Global Index: {fileCursorRef.current}
            </div>
            <div style={{display:'flex', gap:'5px'}}>
              <input className="input-field" placeholder="Target Branch" value="Nexus-Database" disabled />
              <input className="input-field" placeholder="Target File" value={config.file} onChange={e => setConfig({...config, file: e.target.value})} />
            </div>
            <button className={`btn-go ${loading ? 'btn-stop' : ''}`} onClick={loading ? haltProcess : runSync}>
              {loading ? "HALT ASSIMILATION" : "ENGAGE PERPETUAL SYNTHESIS"}
            </button>
            <button className="btn-reset" onClick={clearMemory}>WIPE CACHE & PROGRESS</button>
            <div className="log-wrap">
              {logs.map((l, i) => <div key={i} className={`le le-${l.type}`}>{l.text}</div>)}
              <div ref={logEndRef} />
            </div>
          </div>
          <div className="progress-track"><div className="progress-fill" style={{width:`${progress}%`}}></div></div>
        </div>
        <div className="panel">
          <div className="panel-hdr">ALGORITHMIC REALITY STREAM</div>
          <div className="code-view">{displayCode || "# STANDBY FOR ASSIMILATION PROTOCOLS..."}</div>
        </div>
      </div>
    </div>
  );
}


from __future__ import annotations
import collections
import functools
import nltk
import math
import itertools
from typing import Dict, List, Optional, Set, Union, Literal, Any, Callable, Tuple

# --- NLTK Resource Downloads & Caching ---

@functools.lru_cache(maxsize=1)
def _download_nltk_stopwords(language: str):
    """
    Downloads NLTK stopwords for the specified language.
    Uses lru_cache to ensure it's downloaded only once per session.
    """
    try:
        nltk.data.find(f'corpora/stopwords/{language}.zip')
    except nltk.downloader.DownloadError:
        nltk.download('stopwords', quiet=True)

@functools.lru_cache(maxsize=1)
def _download_nltk_punkt():
    """
    Downloads NLTK 'punkt' tokenizer.
    Uses lru_cache to ensure it's downloaded only once per session.
    """
    try:
        nltk.data.find('tokenizers/punkt')
    except nltk.downloader.DownloadError:
        nltk.download('punkt', quiet=True)

@functools.lru_cache(maxsize=1)
def _download_nltk_wordnet():
    """
    Downloads NLTK WordNet lexical database.
    Uses lru_cache to ensure it's downloaded only once per session.
    """
    try:
        nltk.data.find('corpora/wordnet')
    except nltk.downloader.DownloadError:
        nltk.download('wordnet', quiet=True)

@functools.lru_cache(maxsize=None)
def _get_stopwords_set(language: str) -> Set[str]:
    """
    Retrieves the set of NLTK stopwords for a given language.
    Uses lru_cache to ensure the set is built only once per language.
    """
    _download_nltk_stopwords(language)
    return set(nltk.corpus.stopwords.words(language))

@functools.lru_cache(maxsize=None)
def _get_wordnet_synonyms(word: str, language: str) -> Set[str]:
    """
    Retrieves the set of WordNet synonyms for a given word and language.
    Uses lru_cache to ensure the set is built only once per (word, language) pair.
    """
    _download_nltk_wordnet()
    from nltk.corpus import wordnet as wn
    # NLTK WordNet expects language codes like 'eng'
    # Defaulting to 'eng' if the provided language is not directly supported by WordNet lemmas
    # or requires a specific conversion.
    # For simplicity, we assume NLTK's stopwords_language is compatible or default.
    wordnet_lang = language[:3].lower() if len(language) >= 3 else 'eng' 

    synsets = list(wn.synsets(word))
    synonyms = set()
    for synset in synsets:
        for lemma in synset.lemmas(lang=wordnet_lang):
            synonyms.add(lemma.name())
    return synonyms

# --- String Processing & Similarity Helpers ---

def _levenshtein_distance(word1: str, word2: str) -> int:
    """
    Calculates the Levenshtein distance between two words (edit distance).
    Time complexity: O(len(word1) * len(word2))
    Space complexity: O(len(word1) * len(word2))
    """
    m = len(word1)
    n = len(word2)
    
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            cost = 0 if word1[i - 1] == word2[j - 1] else 1
            dp[i][j] = min(dp[i - 1][j] + 1,      # Deletion
                           dp[i][j - 1] + 1,      # Insertion
                           dp[i - 1][j - 1] + cost) # Substitution

    return dp[m][n]

def _levenshtein_distance_matrix(words: List[str]) -> List[List[int]]:
    """
    Returns a matrix of Levenshtein distances between each pair of words in the input list.
    """
    matrix = [[0] * len(words) for _ in range(len(words))]
    for i, word1 in enumerate(words):
        for j, word2 in enumerate(words):
            if i == j:
                matrix[i][j] = 0
            elif i < j: # Calculate only upper triangle to avoid redundant calculations
                matrix[i][j] = _levenshtein_distance(word1, word2)
                matrix[j][i] = matrix[i][j] # Mirror for symmetry
    return matrix

def longest_common_substring(text1: str, text2: str) -> str:
    """
    Finds the longest common substring between two input strings.
    """
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    max_length = 0
    end_index_text1 = 0

    for i in range(m):
        for j in range(n):
            if text1[i] == text2[j]:
                dp[i + 1][j + 1] = dp[i][j] + 1
                if dp[i + 1][j + 1] > max_length:
                    max_length = dp[i + 1][j + 1]
                    end_index_text1 = i + 1

    return text1[end_index_text1 - max_length : end_index_text1]

def _cosine_similarity(vector1: List[float], vector2: List[float]) -> float:
    """
    Calculates the cosine similarity between two vectors.
    """
    if not vector1 or not vector2 or len(vector1) != len(vector2):
        raise ValueError("Vectors must be non-empty and of equal length.")

    dot_product = sum(a * b for a, b in zip(vector1, vector2))
    magnitude1 = math.sqrt(sum(a ** 2 for a in vector1))
    magnitude2 = math.sqrt(sum(a ** 2 for a in vector2))
    return dot_product / (magnitude1 * magnitude2) if magnitude1 * magnitude2 != 0 else 0

def _jaccard_similarity(set1: Set[str], set2: Set[str]) -> float:
    """
    Calculates the Jaccard similarity between two sets.
    """
    intersection = set1.intersection(set2)
    union = set1.union(set2)
    return len(intersection) / len(union) if union else 1 # If union is empty (both sets empty), similarity is 1.0

# --- Bitwise Operation Helpers ---

def get_index_of_rightmost_set_bit(number: int) -> int:
    """
    Take in a positive integer 'number'.
    Returns the zero-based index of first set bit in that 'number' from right.
    Returns -1, If no set bit found.
    """
    if not isinstance(number, int) or number < 0:
        raise ValueError("Input must be a non-negative integer")

    if number == 0:
        return -1
    
    intermediate = number & ~(number - 1)
    
    index = 0
    while intermediate > 1:
        intermediate >>= 1
        index += 1
    return index

def get_index_of_first_set_bit(number: int) -> int:
    """
    Takes in a positive integer 'number'.
    Returns the zero-based index of first set bit in that 'number' from left (Most Significant Bit).
    Returns -1, If no set bit found.
    """
    if not isinstance(number, int) or number < 0:
        raise ValueError("Input must be a non-negative integer")
    if number == 0:
        return -1
    
    return number.bit_length() - 1

# --- Numerical List Processing Helper ---

def find_missing_number(numbers: List[int]) -> int:
    """
    Finds the missing number in a list of positive integers.
    Assumes the list represents a consecutive sequence with exactly one number missing
    within the range defined by `min(numbers)` and `max(numbers)`.
    """
    if not numbers:
        raise ValueError("Input list cannot be empty")
    if len(numbers) == 1:
        raise ValueError("Cannot determine a missing number from a single-element list without broader context.")

    min_val = min(numbers)
    max_val = max(numbers)
    
    # If the list itself is complete, and no number is missing.
    if len(numbers) == (max_val - min_val + 1):
        # This case implicitly contradicts "exactly one number missing",
        # but is a good robustness check.
        raise ValueError("No number is missing in the provided sequence within its min-max range.")

    expected_sum = (max_val - min_val + 1) * (min_val + max_val) // 2
    actual_sum = sum(numbers)
    
    return expected_sum - actual_sum

# --- Combination Generation Helpers ---

def _create_all_state(
    increment: int,
    total_number: int,
    level: int,
    current_list: list[int],
    total_list: list[list[int]],
) -> None:
    """
    Helper function to recursively build all combinations using backtracking.
    """
    if level == 0:
        total_list.append(current_list[:])
        return

    for i in range(increment, total_number - level + 2):
        current_list.append(i)
        _create_all_state(i + 1, total_number, level - 1, current_list, total_list)
        current_list.pop()

def _generate_all_combinations_backtracking(n: int, k: int) -> list[list[int]]:
    """
    Generates all possible combinations of k numbers out of 1 ... n using backtracking.
    """
    if k < 0:
        raise ValueError("k must not be negative")
    if n < 0:
        raise ValueError("n must not be negative")
    if k > n:
        return []

    result: list[list[int]] = []
    _create_all_state(1, n, k, [], result)
    return result

def _combination_lists_itertools(n: int, k: int) -> list[list[int]]:
    """
    Generates all possible combinations of k numbers out of 1 ... n using itertools.
    """
    if k < 0:
        raise ValueError("k must not be negative")
    if n < 0:
        raise ValueError("n must not be negative")
    if k > n:
        return []
        
    return [list(x) for x in itertools.combinations(range(1, n + 1), k)]

# --- Subsequence Generation Helpers ---

def _generate_subsequences_recursive(
    sequence: List[Any],
    index: int,
    current_subsequence: List[Any],
    results: List[List[Any]],
    selector: Optional[Callable[[int, Any, List[Any]], Tuple[bool, bool]]]
) -> None:
    """
    Recursive helper function to generate all possible subsequences using backtracking.
    This function collects the subsequences into the 'results' list.
    """
    # Base case: Reached the end of the sequence
    if index == len(sequence):
        results.append(current_subsequence[:])
        return

    element = sequence[index]
    can_exclude, can_include = (True, True)

    if selector:
        try:
            selector_result = selector(index, element, current_subsequence)
            if not isinstance(selector_result, tuple) or len(selector_result) != 2 or \
               not isinstance(selector_result[0], bool) or not isinstance(selector_result[1], bool):
                raise TypeError("Subsequence selector must return a tuple of two booleans (can_exclude, can_include).")
            can_exclude, can_include = selector_result
        except Exception as e:
            raise ValueError(f"Error executing subsequence_selector at index {index} with element {element}: {e}")

    # Path 1: Exclude the current element
    if can_exclude:
        _generate_subsequences_recursive(sequence, index + 1, current_subsequence, results, selector)
    
    # Path 2: Include the current element
    if can_include:
        current_subsequence.append(element)
        _generate_subsequences_recursive(sequence, index + 1, current_subsequence, results, selector)
        current_subsequence.pop()

def calculate_nexus_branch_synthesis(
    mode: Literal['text_analysis', 'combination_generation', 'subsequence_generation'] = 'text_analysis',
    
    # Text Analysis Parameters
    sentence: Optional[str] = None,
    case_insensitive: bool = True,
    remove_stopwords: bool = False,
    stopwords_language: str = 'english',
    min_frequency: int = 0,
    max_frequency: Optional[int] = None,
    similarity_threshold: Optional[int] = None,

    # Combination Generation Parameters
    n_combinations: Optional[int] = None,
    k_combinations: Optional[int] = None,
    use_backtracking_for_combinations: bool = False,
    generate_all_k_combinations: bool = False,
    
    # Subsequence Generation Parameters
    input_sequence: Optional[List[Any]] = None,
    subsequence_selector: Optional[Callable[[int, Any, List[Any]], Tuple[bool, bool]]] = None,
    subsequence_min_length: Optional[int] = None,
    subsequence_max_length: Optional[int] = None,
    subsequence_filter_func: Optional[Callable[[List[Any]], bool]] = None,
    subsequence_sort_key: Optional[Callable[[List[Any]], Any]] = None,
    subsequence_reverse_sort: bool = False,

) -> Union[Dict[str, int], List[List[int]], Dict[int, List[List[int]]], List[List[Any]]]:
    """
    Consolidates various functionalities for text analysis, combination generation,
    and subsequence generation into a single high-performance function.

    Args:
        mode (Literal['text_analysis', 'combination_generation', 'subsequence_generation']):
            Determines the operation mode.
            - 'text_analysis': Performs word counting, stopword removal, and optionally
              Levenshtein distance-based similarity counting on a given sentence.
            - 'combination_generation': Generates all possible combinations of k numbers
              out of 1...n.
            - 'subsequence_generation': Generates all possible subsequences of a given sequence,
              with optional dynamic generation, filtering, and sorting.

        # --- Text Analysis Parameters (used when mode='text_analysis') ---
        sentence (Optional[str]): The input text sentence for 'text_analysis' mode.
                                  Required for 'text_analysis'.
        case_insensitive (bool): If True, converts all words to lowercase before counting.
                                 Defaults to True.
        remove_stopwords (bool): If True, removes common words (stopwords) based on NLTK.
                                 Defaults to False.
        stopwords_language (str): The language for stopwords (e.g., 'english').
                                  Only used if `remove_stopwords` is True. Defaults to 'english'.
        min_frequency (int): Only counts words that occur at least `min_frequency` times.
                             A value of 0 (default) means no minimum frequency filter.
        max_frequency (Optional[int]): Only counts words that occur at most `max_frequency` times.
                                       None (default) means no maximum frequency filter.
        similarity_threshold (Optional[int]): If not None, calculates "similar word" counts
                                                using Levenshtein distance. A word's count
                                                will be the number of other *distinct tokens*
                                                in the sentence that are within this threshold
                                                of similarity. Overrides basic frequency counting.
                                                None (default) means no similarity calculation.

        # --- Combination Generation Parameters (used when mode='combination_generation') ---
        n_combinations (Optional[int]): The upper limit number 'n' for combination generation (1...n).
                                        Required for 'combination_generation'.
        k_combinations (Optional[int]): The size 'k' of combinations to generate.
                                        Required for 'combination_generation' unless
                                        `generate_all_k_combinations` is True.
        use_backtracking_for_combinations (bool): If True, uses the backtracking algorithm.
                                                  If False (default), uses `itertools.combinations`
                                                  which is generally faster.
        generate_all_k_combinations (bool): If True, generates combinations for all `k` from 0 to `n_combinations`.
                                            Overrides `k_combinations`.

        # --- Subsequence Generation Parameters (used when mode='subsequence_generation') ---
        input_sequence (Optional[List[Any]]): The input sequence for which to generate subsequences.
                                              Required for 'subsequence_generation'.
        subsequence_selector (Optional[Callable[[int, Any, List[Any]], Tuple[bool, bool]]]):
            A function taking `(index, element_at_index, current_subsequence_built_so_far)`
            and returning `(can_exclude_current_element: bool, can_include_current_element: bool)`.
            Allows dynamic control over subsequence generation paths. Defaults to `(True, True)`
            for all elements if not provided.
        subsequence_min_length (Optional[int]): Filters subsequences to include only those
                                                with at least this length. None for no minimum.
        subsequence_max_length (Optional[int]): Filters subsequences to include only those
                                                with at most this length. None for no maximum.
        subsequence_filter_func (Optional[Callable[[List[Any]], bool]]):
            A custom function taking a generated subsequence (`List[Any]`) and returning `True`
            if it should be included in the results, `False` otherwise. Applied after length filters.
        subsequence_sort_key (Optional[Callable[[List[Any]], Any]]):
            A key function for sorting the final list of subsequences (e.g., `len` for sorting by length).
        subsequence_reverse_sort (bool): If True, sorts the subsequences in descending order.
                                         Defaults to False.


    Returns:
        Union[Dict[str, int], List[List[int]], Dict[int, List[List[int]]], List[List[Any]]]:
        - If `mode` is 'text_analysis': A dictionary where keys are words and values are their counts.
        - If `mode` is 'combination_generation' and `generate_all_k_combinations` is False:
          A list of lists, where each inner list is a combination of `k_combinations` numbers.
        - If `mode` is 'combination_generation' and `generate_all_k_combinations` is True:
          A dictionary mapping `k` (int) to a list of lists of combinations for that `k`.
        - If `mode` is 'subsequence_generation': A list of lists, where each inner list is a subsequence.

    Raises:
        ValueError: If required parameters for a given mode are missing or invalid.
        TypeError: If a provided selector or filter function returns an unexpected type.
    """

    if mode == 'text_analysis':
        if sentence is None:
            raise ValueError("Parameter 'sentence' is required for 'text_analysis' mode.")
        if not sentence.strip():
            return {}

        # Step 1: Tokenization and initial processing (case_insensitive, remove_stopwords)
        _download_nltk_punkt()
        
        raw_tokens = nltk.word_tokenize(sentence, language=stopwords_language)

        processed_words: List[str] = []
        
        stopwords_set = _get_stopwords_set(stopwords_language) if remove_stopwords else set()

        for token in raw_tokens:
            current_token = token.lower() if case_insensitive else token
            if current_token.isalpha() and current_token not in stopwords_set:
                processed_words.append(current_token)

        if not processed_words:
            return {}

        # Step 2: Determine the base occurrence dictionary (standard frequency or similarity-based)
        final_occurrence_basis: collections.defaultdict[str, int]

        if similarity_threshold is not None:
            # Calculate similarity counts based on Levenshtein distance.
            # O(U^2 * L^2) where U is unique tokens, L is avg word length.
            final_occurrence_basis = collections.defaultdict(int)
            
            unique_processed_words = list(set(processed_words)) 

            for i, word_token_outer in enumerate(unique_processed_words):
                for j, word_token_inner in enumerate(unique_processed_words):
                    if i != j and \
                       _levenshtein_distance(word_token_outer, word_token_inner) <= similarity_threshold:
                        final_occurrence_basis[word_token_outer] += 1
        else:
            # Standard word frequency count. Time complexity: O(N_tokens).
            final_occurrence_basis = collections.defaultdict(int)
            for word in processed_words:
                final_occurrence_basis[word] += 1
        
        # Step 3: Apply frequency filtering (min_frequency and max_frequency)
        # Time complexity: O(U), where U is the number of unique words.
        result_dict: Dict[str, int] = {}
        
        for word, count in final_occurrence_basis.items():
            if (min_frequency == 0 or count >= min_frequency) and \
               (max_frequency is None or count <= max_frequency):
                result_dict[word] = count

        return result_dict

    elif mode == 'combination_generation':
        if n_combinations is None:
            raise ValueError("Parameter 'n_combinations' is required for 'combination_generation' mode.")
        if n_combinations < 0:
            raise ValueError("Parameter 'n_combinations' must not be negative.")

        combination_func = _generate_all_combinations_backtracking if use_backtracking_for_combinations else _combination_lists_itertools

        if generate_all_k_combinations:
            if n_combinations == 0:
                return {0: [[]]} 
            
            all_combinations_by_k: Dict[int, List[List[int]]] = {}
            for k_val in range(n_combinations + 1):
                all_combinations_by_k[k_val] = combination_func(n_combinations, k_val)
            return all_combinations_by_k
        else:
            if k_combinations is None:
                raise ValueError("Parameter 'k_combinations' is required for 'combination_generation' mode "
                                 "unless 'generate_all_k_combinations' is True.")
            if k_combinations < 0:
                raise ValueError("Parameter 'k_combinations' must not be negative.")
            return combination_func(n_combinations, k_combinations)

    elif mode == 'subsequence_generation':
        if input_sequence is None:
            raise ValueError("Parameter 'input_sequence' is required for 'subsequence_generation' mode.")
        if not isinstance(input_sequence, list):
            raise ValueError("Parameter 'input_sequence' must be a list.")
        
        all_subsequences: List[List[Any]] = []
        _generate_subsequences_recursive(
            sequence=input_sequence,
            index=0,
            current_subsequence=[],
            results=all_subsequences,
            selector=subsequence_selector
        )

        # Apply filtering
        filtered_subsequences: List[List[Any]] = []
        for subseq in all_subsequences:
            length_ok = (subsequence_min_length is None or len(subseq) >= subsequence_min_length) and \
                        (subsequence_max_length is None or len(subseq) <= subsequence_max_length)
            
            filter_func_ok = True
            if subsequence_filter_func:
                try:
                    filter_func_ok = subsequence_filter_func(subseq)
                except Exception as e:
                    raise ValueError(f"Error executing subsequence_filter_func for subsequence {subseq}: {e}")

            if length_ok and filter_func_ok:
                filtered_subsequences.append(subseq)

        # Apply sorting
        if subsequence_sort_key is not None:
            filtered_subsequences.sort(key=subsequence_sort_key, reverse=subsequence_reverse_sort)
        elif subsequence_reverse_sort: # Apply default lexicographical sort if only reverse is specified
             filtered_subsequences.sort(reverse=True) 

        return filtered_subsequences

    else:
        raise ValueError(f"Invalid mode: '{mode}'. Must be 'text_analysis', 'combination_generation', or 'subsequence_generation'.")
