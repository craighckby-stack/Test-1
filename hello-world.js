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


// BlochSphereBundle (IIFE structure, content extracted)
(function() {
  "use strict";

  // --- Enums & Interaction Modes ---
  const InteractionMode = {
    ROTATE: 0,
    DOLLY: 1,
    PAN: 2,
  };

  const OrbitControlsMode = {
    ROTATE: 0,
    PAN: 1,
    DOLLY_PAN: 2,
    DOLLY_ROTATE: 3,
  };

  // --- WebGL Constants (Commonly found in THREE.js) ---
  const WebGLConstants = {
    // Blending, Depth, Stencil, etc.
    ZERO: 0,
    ONE: 1,
    ADD: 2,
    NEVER: 1,
    LESS: 2,
    EQUAL: 3,
    LEQUAL: 4,
    GREATER: 5,
    NOTEQUAL: 6,
    GEQUAL: 7,
    ALWAYS: 8,

    FRONT: 1028,
    BACK: 1029,
    FRONT_AND_BACK: 1032,

    SRC_ALPHA_SATURATE: 776,
    BLEND_EQUATION_RGB: 32777,
    BLEND_EQUATION_ALPHA: 34877,
    BLEND_DST_RGB: 32968,
    BLEND_SRC_RGB: 32969,
    BLEND_DST_ALPHA: 32970,
    BLEND_SRC_ALPHA: 32971,

    // Data Types
    BYTE: 5120,
    UNSIGNED_BYTE: 5121,
    SHORT: 5122,
    UNSIGNED_SHORT: 5123,
    INT: 5124,
    UNSIGNED_INT: 5125,
    FLOAT: 5126,
    HALF_FLOAT: 36193,
    UNSIGNED_SHORT_4_4_4_4: 32819,
    UNSIGNED_SHORT_5_5_5_1: 32820,
    UNSIGNED_SHORT_5_6_5: 33635,
    UNSIGNED_INT_2_10_10_10_REV: 33640,
    UNSIGNED_INT_24_8: 34042,
    UNSIGNED_INT_10F_11F_11F_REV: 35899,
    UNSIGNED_INT_5_9_9_9_REV: 35902,
    FLOAT_32_UNSIGNED_INT_24_8_REV: 36269,

    // Buffer Usage
    STATIC_DRAW: 35044,
    DYNAMIC_DRAW: 35048,
    STREAM_DRAW: 35040,

    // Textures
    TEXTURE_2D: 3553,
    TEXTURE_CUBE_MAP: 34067,
    TEXTURE_BINDING_2D: 32873,
    TEXTURE_BINDING_CUBE_MAP: 34068,
    TEXTURE_MIN_FILTER: 10241,
    TEXTURE_MAG_FILTER: 10240,
    TEXTURE_WRAP_S: 10242,
    TEXTURE_WRAP_T: 10243,
    TEXTURE_WRAP_R: 32882, // WebGL2
    REPEAT: 10497,
    CLAMP_TO_EDGE: 33071,
    MIRRORED_REPEAT: 33648,
    NEAREST: 9728,
    LINEAR: 9729,
    NEAREST_MIPMAP_NEAREST: 9984,
    LINEAR_MIPMAP_NEAREST: 9985,
    NEAREST_MIPMAP_LINEAR: 9986,
    LINEAR_MIPMAP_LINEAR: 9987,

    // Formats
    ALPHA: 6406,
    RGB: 6407,
    RGBA: 6408,
    LUMINANCE: 6409,
    LUMINANCE_ALPHA: 6410,
    DEPTH_COMPONENT: 6402,
    DEPTH_STENCIL: 34041,
    RED_INTEGER: 36244,
    RGB_INTEGER: 36248,
    RGBA_INTEGER: 36249,
    RG_INTEGER: 33320, // WebGL2

    // Internal Formats
    R8: 33321,
    R8_SNORM: 36760,
    R16F: 33325,
    R32F: 33326,
    R8I: 33329,
    R8UI: 33330,
    R16I: 33331,
    R16UI: 33332,
    R32I: 33333,
    R32UI: 33334,
    RG8: 33323,
    RG8_SNORM: 36761,
    RG16F: 33327,
    RG32F: 33328,
    RG8I: 33335,
    RG8UI: 33336,
    RG16I: 33337,
    RG16UI: 33338,
    RG32I: 33339,
    RG32UI: 33340,
    RGB8: 32849,
    SRGB8: 35905,
    RGB565: 36194,
    RGB9_E5: 35901,
    RGB16F: 34843,
    RGB32F: 34837,
    RGBM7C0: 34849, // Custom format?
    RGB8I: 36227,
    RGB8UI: 36221,
    RGB16I: 36233,
    RGB16UI: 36224,
    RGB32I: 36225,
    RGB32UI: 36226,
    RGBA8: 32856,
    SRGB8_ALPHA8: 35907,
    RGBA4: 32854,
    RGB5_A1: 32855,
    RGBA16F: 34842,
    RGBA32F: 34836,
    RGBA8I: 36238,
    RGBA8UI: 36220,
    RGBA16I: 36239,
    RGBA16UI: 36222,
    RGBA32I: 36240,
    RGBA32UI: 36223,
    DEPTH_COMPONENT16: 33189,
    DEPTH_COMPONENT24: 33190,
    DEPTH_COMPONENT32F: 36012,
    DEPTH24_STENCIL8: 35056,
    DEPTH32F_STENCIL8: 36013,

    // Compressed Formats
    COMPRESSED_RGB_S3TC_DXT1_EXT: 33776,
    COMPRESSED_RGBA_S3TC_DXT1_EXT: 33777,
    COMPRESSED_RGBA_S3TC_DXT3_EXT: 33778,
    COMPRESSED_RGBA_S3TC_DXT5_EXT: 33779,
    COMPRESSED_SRGB_S3TC_DXT1_EXT: 35916,
    COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT: 35917,
    COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT: 35918,
    COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT: 35919,
    COMPRESSED_RED_RGTC1: 36283,
    COMPRESSED_SIGNED_RED_RGTC1: 36284,
    COMPRESSED_RG_RGTC2: 36285,
    COMPRESSED_SIGNED_RG_RGTC2: 36286,
    COMPRESSED_RGBA_BPTC_UNORM_ARB: 36492,
    COMPRESSED_SRGB_ALPHA_BPTC_UNORM_ARB: 36493,
    COMPRESSED_RGB_BPTC_SIGNED_FLOAT_ARB: 36494,
    COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_ARB: 36495,

    // Texture Anisotropy
    MAX_TEXTURE_MAX_ANISOTROPY_EXT: 34047,

    // Sync objects (WebGL2)
    SYNC_GPU_COMMANDS_COMPLETE: 37496,
    WAIT_FAILED: 37488,
    TIMEOUT_EXPIRED: 37489,
    CONDITION_SATISFIED: 37490,
    ALREADY_SIGNALED: 37491,
    SYNC_FLUSH_COMMANDS_BIT: 1,

    // Framebuffer
    COLOR_ATTACHMENT0: 36064,
    DEPTH_ATTACHMENT: 36096,
    STENCIL_ATTACHMENT: 36128,
    DEPTH_STENCIL_ATTACHMENT: 33306,
  };

  // --- Core Constants ---
  const GL_EXTENSIONS = {
    WEBGL_DEPTH_TEXTURE: 33776,
    OES_TEXTURE_FLOAT: 33777,
    OES_TEXTURE_HALF_FLOAT: 33778,
    WEBGL_COLOR_BUFFER_FLOAT: 33779,
  };

  const ColorSpace = {
    UNKNOWN: "",
    SRGB: "srgb",
    SRGB_LINEAR: "srgb-linear",
    LINEAR: "linear",
    DEFAULT_SRGB: "srgb", // Renamed from Yt
  };

  const RendererConstants = {
    // Other common THREE.js renderer constants might be here, e.g., mapping types.
    BASIC_SHADOW_MAP: 0,
    PCF_SHADOW_MAP: 1,
    PCF_SOFT_SHADOW_MAP: 2,
    VSM_SHADOW_MAP: 3,

    ALPHA_FORMAT: 1000,
    RGB_FORMAT: 1001,
    RGBA_FORMAT: 1002,
    LUMINANCE_FORMAT: 1003,
    LUMINANCE_ALPHA_FORMAT: 1004,
    RED_FORMAT: 1005,
    RED_INTEGER_FORMAT: 1006,
    RG_FORMAT: 1007,
    RG_INTEGER_FORMAT: 1008,
    RGB_INTEGER_FORMAT: 1009,
    RGBA_INTEGER_FORMAT: 1010,
    DEPTH_COMPONENT_FORMAT: 1011,
    DEPTH_STENCIL_FORMAT: 1012,
    RGB_ETC1_FORMAT: 1013,
    RGBA_ETC1_FORMAT: 1014,
    RGBA_ASTC_4X4_FORMAT: 1015,
    RGBA_ASTC_5X4_FORMAT: 1016,
    RGBA_ASTC_5X5_FORMAT: 1017,
    RGBA_ASTC_6X5_FORMAT: 1018,
    RGBA_ASTC_6X6_FORMAT: 1019,
    RGBA_ASTC_8X5_FORMAT: 1020,
    RGBA_ASTC_8X6_FORMAT: 1021,
    RGBA_ASTC_8X8_FORMAT: 1022,
    RGBA_ASTC_10X5_FORMAT: 1023,
    RGBA_ASTC_10X6_FORMAT: 1024,
    RGBA_ASTC_10X8_FORMAT: 1025,
    RGBA_ASTC_10X10_FORMAT: 1026,
    RGBA_ASTC_12X10_FORMAT: 1027,
    RGBA_ASTC_12X12_FORMAT: 1028,
    RGB_PVRTC1_4_FORMAT: 1029,
    RGB_PVRTC1_2_FORMAT: 1030,
    RGBA_PVRTC1_4_FORMAT: 1031,
    RGBA_PVRTC1_2_FORMAT: 1032,
    RGB_ETC2_FORMAT: 1033,
    RGBA_ETC2_EAC_FORMAT: 1034,

    UnsignedByteType: 1000, // Renamed from Ql
    HalfFloatType: 1001, // Renamed from Qa
    FloatType: 1002, // Renamed from tc
  };

  const MiscConstants = {
    // Animation/Timing
    EASE_OUT_EXPO_CSS: "300 es", // Renamed from eo
    DEFAULT_MAX_ANISOTROPY: 2e3, // Renamed from Je
    TEXEL_BUFFER_TEXTURE: 2001, // Renamed from ji
  };

  // Hexadecimal string lookup table (for color conversion or similar)
  const HexLookup = [
    "00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "0a", "0b", "0c", "0d", "0e", "0f",
    "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "1a", "1b", "1c", "1d", "1e", "1f",
    "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "2a", "2b", "2c", "2d", "2e", "2f",
    "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "3a", "3b", "3c", "3d", "3e", "3f",
    "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "4a", "4b", "4c", "4d", "4e", "4f",
    "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "5a", "5b", "5c", "5d", "5e", "5f",
    "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "6a", "6b", "6c", "6d", "6e", "6f",
    "70", "71", "72", "73", "74", "75", "76", "77", "78", "79", "7a", "7b", "7c", "7d", "7e", "7f",
    "80", "81", "82", "83", "84", "85", "86", "87", "88", "89", "8a", "8b", "8c", "8d", "8e", "8f",
    "90", "91", "92", "93", "94", "95", "96", "97", "98", "99", "9a", "9b", "9c", "9d", "9e", "9f",
    "a0", "a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "aa", "ab", "ac", "ad", "ae", "af",
    "b0", "b1", "b2", "b3", "b4", "b5", "b6"
  ];


  // --- Global State / Cache ---
  const threeWarningCache = {}; // Renamed from io

  // --- Utility Functions ---

  /**
   * Checks if any element in the array is greater than or equal to 65535.
   * @param {number[]} array
   * @returns {boolean}
   */
  function containsLargeValue(array) {
    for (let i = array.length - 1; i >= 0; --i) {
      if (array[i] >= 65535) return true;
    }
    return false;
  }

  /**
   * Creates an HTML element in the XHTML namespace.
   * @param {string} tagName
   * @returns {HTMLElement}
   */
  function createElementNs(tagName) {
    return document.createElementNS("http://www.w3.org/1999/xhtml", tagName);
  }

  /**
   * Creates a canvas element with display: block style.
   * @returns {HTMLCanvasElement}
   */
  function createCanvasElement() {
    const canvas = createElementNs("canvas");
    canvas.style.display = "block";
    return canvas;
  }

  /**
   * Logs a message with a "THREE." prefix.
   * @param {...any} messages
   */
  function logThreeMessage(...messages) {
    const prefix = "THREE." + messages.shift();
    console.log(prefix, ...messages);
  }

  /**
   * Warns a message with a "THREE." prefix.
   * @param {...any} messages
   */
  function warnThreeMessage(...messages) {
    const prefix = "THREE." + messages.shift();
    console.warn(prefix, ...messages);
  }

  /**
   * Errors a message with a "THREE." prefix.
   * @param {...any} messages
   */
  function errorThreeMessage(...messages) {
    const prefix = "THREE." + messages.shift();
    console.error(prefix, ...messages);
  }

  /**
   * Warns a message with a "THREE." prefix, but only once for a given message.
   * Uses `threeWarningCache` to prevent repetitive warnings.
   * @param {...any} messages
   */
  function warnThreeOnce(...messages) {
    const messageKey = messages.join(" ");
    if (!(messageKey in threeWarningCache)) {
      threeWarningCache[messageKey] = true;
      warnThreeMessage(...messages);
    }
  }

  /**
   * Returns a Promise that resolves when a WebGLSync object is signaled.
   * @param {WebGLRenderingContext} gl - The WebGL rendering context.
   * @param {WebGLSync} syncObject - The sync object to wait for.
   * @param {number} timeoutMs - The maximum time to wait in milliseconds.
   * @returns {Promise<void>}
   */
  function clientWaitSyncPromise(gl, syncObject, timeoutMs) {
    return new Promise(function(resolve, reject) {
      function checkSyncStatus() {
        switch (gl.clientWaitSync(syncObject, gl.SYNC_FLUSH_COMMANDS_BIT, 0)) {
          case gl.WAIT_FAILED:
            reject();
            break;
          case gl.TIMEOUT_EXPIRED:
            setTimeout(checkSyncStatus, timeoutMs);
            break;
          default:
            resolve();
        }
      }
      setTimeout(checkSyncStatus, timeoutMs);
    });
  }

  // --- Classes ---

  /**
   * A basic EventDispatcher implementation.
   */
  class EventDispatcher {
    constructor() {
      this._listeners = undefined;
    }

    /**
     * Adds an event listener.
     * @param {string} type - The type of event.
     * @param {Function} listener - The function to call when the event is dispatched.
     */
    addEventListener(type, listener) {
      if (this._listeners === undefined) {
        this._listeners = {};
      }
      const listeners = this._listeners;
      if (listeners[type] === undefined) {
        listeners[type] = [];
      }
      if (listeners[type].indexOf(listener) === -1) {
        listeners[type].push(listener);
      }
    }

    /**
     * Checks if an event listener is registered for a given type.
     * @param {string} type - The type of event.
     * @param {Function} listener - The listener function.
     * @returns {boolean}
     */
    hasEventListener(type, listener) {
      const listeners = this._listeners;
      return listeners === undefined ? false : listeners[type] !== undefined && listeners[type].indexOf(listener) !== -1;
    }

    /**
     * Removes an event listener.
     * @param {string} type - The type of event.
     * @param {Function} listener - The listener function to remove.
     */
    removeEventListener(type, listener) {
      const listeners = this._listeners;
      if (listeners === undefined) {
        return;
      }
      const typeListeners = listeners[type];
      if (typeListeners !== undefined) {
        const index = typeListeners.indexOf(listener);
        if (index !== -1) {
          typeListeners.splice(index, 1);
        }
      }
    }

    /**
     * Dispatches an event.
     * The event object must have a `type` property.
     * Listeners will be called with the event object, and `event.target` will be set to this dispatcher.
     * @param {object} event - The event object to dispatch.
     */
    dispatchEvent(event) {
      const listeners = this._listeners;
      if (listeners === undefined) {
        return;
      }
      const typeListeners = listeners[event.type];
      if (typeListeners !== undefined) {
        event.target = this;
        // Make a copy to prevent issues if listeners are added/removed during dispatch
        const copiedListeners = typeListeners.slice(0);
        for (let i = 0, l = copiedListeners.length; i < l; i++) {
          copiedListeners[i].call(this, event);
        }
        event.target = null; // Clean up
      }
    }
  }

  // Exposed API (example, assuming this is how BlochSphereBundle uses these)
  // This part would typically be defined by the `Bs` parameter or the return value
  // of the IIFE. For this synthesis, we're just making the extracted parts available.
  /*
  return {
    InteractionMode,
    OrbitControlsMode,
    WebGLConstants,
    ColorSpace,
    RendererConstants,
    MiscConstants,
    HexLookup,
    containsLargeValue,
    createElementNs,
    createCanvasElement,
    logThreeMessage,
    warnThreeMessage,
    errorThreeMessage,
    warnThreeOnce,
    clientWaitSyncPromise,
    EventDispatcher,
    // ... potentially other exports
  };
  */

})();

const puppeteer = require('puppeteer');
const {beforeAll, describe, it, expect} = require('vitest');
const {readFileSync} = require('fs');
const pixelmatch = require('pixelmatch');
const PNG = require('pngjs').PNG;
const temp = require('temp');
const path = require('path');

/**
 * Generates an HTML script with the current repository bundle
 * that we will use to compare.
 */
const bundleString = readFileSync('dist/bloch_sphere.bundle.js', 'utf8');

function htmlContent(clientCode) {
  return `
    <!doctype html>
    <meta charset="UTF-8">
    <html lang="en">
      <head>
      <title>Cirq Web Development page</title>
      </head>
      <body>
      <div id="container"></div>
      <script>${bundleString}</script>
      <script>${clientCode}</script>
      </body>
    </html>
    `;
}

/**
 * Helper to take a screenshot with a given client code.
 */
async function takeScreenshot(clientCode, outputPath) {
  const browser = await puppeteer.launch({args: ['--app']});
  const page = await browser.newPage();
  await page.setContent(htmlContent(clientCode));
  await page.screenshot({path: `${outputPath}.png`});
  await browser.close();
}

/**
 * Helper to compare two images using pixelmatch.
 */
function compareImages(expectedPath, actualPath) {
  const expected = PNG.sync.read(readFileSync(expectedPath));
  const actual = PNG.sync.read(readFileSync(actualPath));
  const {width, height} = expected;
  const diff = new PNG({width, height});

  const pixels = pixelmatch(expected.data, actual.data, diff.data, width, height, {
    threshold: 0.1,
  });

  expect(pixels).toBe(0);
}

// Automatically track and cleanup files on exit
temp.track();

describe('Bloch sphere', () => {
  const dirPath = temp.mkdirSync('tmp');
  const outputPath = path.join(dirPath, 'bloch_sphere');
  const newVectorOutputPath = path.join(dirPath, 'bloch_sphere_vec');

  beforeAll(async () => {
    await takeScreenshot("renderBlochSphere('container')", outputPath);
  });

  it('with no vector matches the gold PNG', () => {
    compareImages('e2e/bloch_sphere/bloch_sphere_expected.png', `${outputPath}.png`);
  });

  beforeAll(async () => {
    await takeScreenshot("renderBlochSphere('container').addVector(0.5, 0.5, 0.5)", newVectorOutputPath);
  });

  it('with custom statevector matches the gold PNG', () => {
    compareImages('e2e/bloch_sphere/bloch_sphere_expected_custom.png', `${newVectorOutputPath}.png`);
  });
});

_forceIdleTriggerAfter(duration) {
        this._state = 'waiting';
        if (this._waitWithRequestAnimationFrame) {
            const startTime = performance.now();
            const animate = () => {
                if (performance.now() - startTime >= duration) {
                    this._triggerIdle();
                } else {
                    requestAnimationFrame(animate);
                }
            };
            requestAnimationFrame(animate);
        } else {
            setTimeout(() => {
                this._triggerIdle();
            }, duration);
        }
    }
}

const COLLECTION_CUTOFF = 1000;
const BAD_TO_STRING_RESULT = new (function(){})().toString();
const RECURSE_LIMIT_DESCRIPTION = "!recursion-limit!";
const DEFAULT_RECURSION_LIMIT = 10;

function try_describe_atomic(value) {
    if (value === null) {
        return "null";
    }
    if (value === undefined) {
        return "undefined";
    }
    if (typeof value === "string") {
        return `"${value}"`;
    }
    if (typeof value === "number") {
        return "" + value;
    }
    if (typeof value === "bigint") {
        return `${value}n`;
    }
    if (typeof value === "boolean") {
        return String(value);
    }
    if (typeof value === "symbol") {
        return String(value);
    }
    return undefined;
}

function try_describe_collection(value, recursionLimit) {
    if (recursionLimit === 0) {
        return RECURSE_LIMIT_DESCRIPTION;
    }
    if (value instanceof Map) {
        return describe_Map(value, recursionLimit);
    }
    if (value instanceof Set) {
        return describe_Set(value, recursionLimit);
    }
    if (typeof value === 'object' && value !== null && typeof value[Symbol.iterator] === 'function') {
        return describe_Iterable(value, recursionLimit);
    }
    return undefined;
}

function describe_Object(value, recursionLimit) {
    if (recursionLimit === 0) {
        return RECURSE_LIMIT_DESCRIPTION;
    }
    const properties = [];
    try {
        for (let k in value) {
            if (properties.length > COLLECTION_CUTOFF) {
                properties.push("[...]");
                break;
            }
            // Check if the property is directly on the object (not prototype chain)
            if (Object.prototype.hasOwnProperty.call(value, k)) {
                let keyDesc = describe(k, recursionLimit - 1);
                let valDesc = describe(value[k], recursionLimit - 1);
                properties.push(`${keyDesc}: ${valDesc}`);
            }
        }
    } catch (e) {
        // Fallback if iterating properties fails (e.g., proxy that throws)
        return `Object{<error getting properties: ${e.message}>}`;
    }
    const constructorName = value.constructor ? value.constructor.name : 'Object';
    return `${constructorName}{${properties.join(", ")}}`;
}

function describe_fallback(value, recursionLimit) {
    try {
        let defaultString = String(value);
        if (defaultString !== BAD_TO_STRING_RESULT) {
            return defaultString;
        }
    } catch {
        // ignored
    }
    return describe_Object(value, recursionLimit);
}

/**
 * Attempts to give a useful and unambiguous description of the given value.
 *
 * @param {*} value
 * @param {!number=} recursionLimit
 * @returns {!string}
 */
function describe(value, recursionLimit = DEFAULT_RECURSION_LIMIT) {
    return try_describe_atomic(value) ||
        try_describe_collection(value, recursionLimit) ||
        describe_fallback(value, recursionLimit);
}

/**
 * @param {!Map} map
 * @param {!number} limit
 * @returns {!string}
 */
function describe_Map(map, limit) {
    let entries = [];
    for (let [k, v] of map.entries()) {
        if (entries.length > COLLECTION_CUTOFF) {
            entries.push("[...]");
            break;
        }
        let keyDesc = describe(k, limit - 1);
        let valDesc = describe(v, limit - 1);
        entries.push(`${keyDesc}: ${valDesc}`);
    }
    return `Map{${entries.join(", ")}}`;
}

/**
 * @param {!Set} set
 * @param {!number} limit
 * @returns {!string}
 */
function describe_Set(set, limit) {
    let entries = [];
    for (let e of set) {
        if (entries.length > COLLECTION_CUTOFF) {
            entries.push("[...]");
            break;
        }
        entries.push(describe(e, limit - 1));
    }
    return `Set{${entries.join(", ")}}`;
}

/**
 * @param {!Iterable} seq
 * @param {!number} limit
 * @returns {!string}
 */
function describe_Iterable(seq, limit) {
    let entries = [];
    try {
        for (let e of seq) {
            if (entries.length > COLLECTION_CUTOFF) {
                entries.push("[...]");
                break;
            }
            entries.push(describe(e, limit - 1));
        }
    } catch (e) {
        return `Iterable{<error getting entries: ${e.message}>}`;
    }

    const constructorName = seq.constructor && seq.constructor.name !== 'Object' ? seq.constructor.name : 'Iterable';
    return `${constructorName}{${entries.join(", ")}}`;
}

// Export describe for external use if this is a module.
// This example assumes a global context or explicit export later.
// For CommonJS:
// module.exports = { describe };
// For ES Modules:
// export { describe };

assertThat(describe(s, 10)).isEqualTo(
        "Set{Set{Set{Set{Set{Set{Set{Set{Set{Set{!recursion-limit!}}}}}}}}}}");
});

const r = 3;
const xType = d3.scaleLinear; // type of x-scale
const yType = d3.scaleLinear; // type of y-scale
const marginTop = 20; // top margin, in pixels
const marginRight = 30; // right margin, in pixels
const marginBottom = 30; // bottom margin, in pixels
const marginLeft = 40; // left margin, in pixels
const inset = r * 2; // inset the default range, in pixels
const insetTop = inset; // inset the default y-range
const insetRight = inset; // inset the default x-range
const insetBottom = inset; // inset the default y-range
const insetLeft = inset; // inset the default x-range

const halfHeight = 14;
const halfWidth = 22;

// These variables are assumed to be defined elsewhere in the user's context.
// For the purpose of completing the code, dummy values are used if not provided.
const xDomain = typeof xDomain !== 'undefined' ? xDomain : [0, 10];
const yDomain = typeof yDomain !== 'undefined' ? yDomain : [0, 10];

const n_x = xDomain[1] - xDomain[0];
const n_y = yDomain[1] - yDomain[0];
const width = n_x * (halfWidth * 2.5) + marginLeft + marginRight + insetLeft + insetRight;
const height = n_y * (3 * halfHeight) + marginBottom + insetBottom + marginTop + insetTop;
const xRange = [marginLeft + insetLeft, width - marginRight - insetRight];
const yRange = [height - marginBottom - insetBottom, marginTop + insetTop];

// Construct scales and axes.
const xScale = xType(xDomain, xRange);
const yScale = yType([yDomain[1], yDomain[0]], yRange);
const xAxis = d3.axisBottom(xScale).ticks(width / 80);
const yAxis = d3.axisLeft(yScale).ticks(height / 50);

// Placeholder for d3 if not globally available in this context.
// In a typical browser environment with D3 loaded, this is not needed.
const d3 = typeof d3 !== 'undefined' ? d3 : {
  scaleLinear: (domain, range) => {
    const scale = v => range[0] + (v - domain[0]) / (domain[1] - domain[0]) * (range[1] - range[0]);
    scale.domain = () => domain;
    scale.range = () => range;
    return scale;
  },
  axisBottom: scale => ({
    ticks: () => ({
      call: () => ({
        select: () => ({
          remove: () => {}
        })
      })
    })
  }),
  axisLeft: scale => ({
    ticks: () => ({
      call: () => ({
        select: () => ({
          remove: () => {}
        })
      })
    })
  }),
  select: selector => {
    if (typeof document === 'undefined') return { append: () => ({ attr: () => ({ attr: () => ({ attr: () => ({}) }) }) }) }; // Dummy for server-side
    return d3.select(selector);
  }
};


function makeCanvas(sel) {
  const svg = sel.append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(xAxis)
    .call(g => g.select(".domain").remove())

  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(yAxis)
    .call(g => g.select(".domain").remove())

  const datag = svg.append("g")
    .attr("id", "datag");

  return [svg, datag];
}

// Assuming `d3.select("#content")` will work in the environment.
// If run in a non-browser environment, this might need a mock or different initialization.
const [canvas, DATA_G] = makeCanvas(d3.select("#content"));

function drawVlines(vlines, tt) {
  DATA_G.selectAll('line.v')
    .data(vlines, d => d.x)
    .join(
      enter => enter.append("line")
        .attr("class", "v")
        .attr("stroke", "black")
        .attr('x1', d => xScale(d.x))
        .attr('x2', d => xScale(d.x))
        .attr('y1', d => yScale(d.bottom_y))
        .attr('y2', d => yScale(d.bottom_y))
        .call(enter => enter.transition(tt)
          .attr('y2', d => yScale(d.top_y))
        )
        .lower(),
      update => update
        .call(update => update.transition(tt)
          .attr('x1', d => xScale(d.x))
          .attr('x2', d => xScale(d.x))
          .attr('y1', d => yScale(d.bottom_y))
          .attr('y2', d => yScale(d.top_y))
        )
        .lower(),
      exit => exit
        .call(exit => exit.transition(tt)
          .attr('y2', d => yScale(d.bottom_y))
          .remove()
        ),
    );

}

function drawHlines(hlines, tt) {
  DATA_G.selectAll('line.h')
    .data(hlines, d => `${d.y}-${d.left_x}-${d.right_x}`) // Compound key for unique horizontal lines
    .join(
      enter => enter.append("line")
        .attr("class", "h")
        .attr("stroke", "black")
        .attr('x1', d => xScale(d.left_x))
        .attr('x2', d => xScale(d.left_x)) // Start from left edge for animation
        .attr('y1', d => yScale(d.y))
        .attr('y2', d => yScale(d.y))
        .call(enter => enter.transition(tt)
          .attr('x2', d => xScale(d.right_x)) // Animate to right_x
        )
        .lower(),
      update => update
        .call(update => update.transition(tt)
          .attr('x1', d => xScale(d.left_x))
          .attr('x2', d => xScale(d.right_x))
          .attr('y1', d => yScale(d.y))
          .attr('y2', d => yScale(d.y))
        )
        .lower(),
      exit => exit
        .call(exit => exit.transition(tt)
          .attr('x2', d => xScale(d.left_x)) // Animate back to left_x before removing
          .remove()
        ),
    );
  }
