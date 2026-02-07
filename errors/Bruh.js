import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { Shield, Cpu, Terminal as TermIcon, Zap, Globe, User } from 'lucide-react';

const CONFIG = {
  APP_ID: typeof __app_id !== 'undefined' ? __app_id : 'sovereign-dos-v97',
  PROMPT: "A:\\> ",
  CURSOR_BLINK: 400
};

export default function App() {
  // Navigation State: SPLASH -> SETUP -> RUNNING
  const [view, setView] = useState('SPLASH');
  
  // User Identity & Config
  const [profile, setProfile] = useState({
    name: '',
    directive: 'Optimize for maximum computational efficiency and recursive abstraction.',
    repo: '',
    token: '',
    key: ''
  });

  // Terminal State
  const [lines, setLines] = useState([
    "SOVEREIGN KERNEL v97.0 - (C) 2026 ARCHITECT GRP",
    "DECRYPTING BIOS... OK",
    "MEM_CHECK: 1024KB OK",
    " "
  ]);
  const [input, setInput] = useState("");
  const [inputStep, setInputStep] = useState('REPO'); 
  const [cursorVisible, setCursorVisible] = useState(true);
  
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const isBusy = useRef(false);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines, view]);

  useEffect(() => {
    const i = setInterval(() => setCursorVisible(v => !v), CONFIG.CURSOR_BLINK);
    return () => clearInterval(i);
  }, []);

  const addLine = (txt) => setLines(prev => [...prev, txt]);

  const startTerminal = () => {
    if (!profile.name) return;
    setView('SETUP');
    addLine(`GREETINGS, ${profile.name.toUpperCase()}.`);
    addLine(`MANIFESTO SET: "${profile.directive}"`);
    addLine(" ");
    addLine("ENTER TARGET REPOSITORY (owner/repo):");
  };

  const handleTerminalInput = async (e) => {
    if (e.key !== 'Enter') return;
    const val = input.trim();
    setInput("");

    if (inputStep === 'REPO') {
      addLine(`${CONFIG.PROMPT}SET REPO=${val}`);
      if (!val.includes('/')) {
        addLine("ERROR: INVALID REPO FORMAT.");
      } else {
        setProfile(p => ({ ...p, repo: val }));
        setInputStep('TOKEN');
        addLine("ENTER GITHUB_TOKEN (HIDDEN):");
      }
    } 
    else if (inputStep === 'TOKEN') {
      addLine(`${CONFIG.PROMPT}SET GITHUB_TOKEN=********`);
      setProfile(p => ({ ...p, token: val }));
      setInputStep('AI_KEY');
      addLine("ENTER GEMINI_API_KEY (HIDDEN):");
    } 
    else if (inputStep === 'AI_KEY') {
      addLine(`${CONFIG.PROMPT}SET AI_CORE_KEY=********`);
      setProfile(p => ({ ...p, key: val }));
      setInputStep('RUNNING');
      initializeEvolutionLoop({ ...profile, key: val });
    }
  };

  const initializeEvolutionLoop = async (finalData) => {
    addLine(" ");
    addLine("INITIALIZING CLOUD LEDGER...");
    try {
      const app = initializeApp(JSON.parse(__firebase_config));
      const auth = getAuth(app);
      const db = getFirestore(app);
      await signInAnonymously(auth);
      
      // Save identity to Firestore
      const userRef = doc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', auth.currentUser.uid, 'profile'));
      await setDoc(userRef, {
        name: finalData.name,
        directive: finalData.directive,
        timestamp: serverTimestamp()
      });
      
      addLine("HANDSHAKE: SUCCESSFUL.");
      addLine(`EVOLUTION COMMENCING FOR: ${finalData.repo}`);
      addLine(" ");
    } catch (e) {
      addLine("WARNING: CLOUD SYNC FAILED. RUNNING IN LOCAL_ONLY MODE.");
    }
  };

  const executeCycle = useCallback(async () => {
    if (isBusy.current || inputStep !== 'RUNNING') return;
    isBusy.current = true;
    
    try {
      addLine(`PROBING: ${profile.repo}...`);
      const headers = { 'Authorization': `token ${profile.token}`, 'Accept': 'application/vnd.github.v3+json' };
      const treeRes = await fetch(`https://api.github.com/repos/${profile.repo}/git/trees/main?recursive=1`, { headers });
      const treeData = await treeRes.json();
      const files = treeData.tree.filter(f => f.type === 'blob' && /\.(js|jsx|ts|py)$/.test(f.path));
      
      const target = files[Math.floor(Math.random() * files.length)].path;
      addLine(`EVOLVING: ${target}`);

      const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-09-2025:generateContent?key=${profile.key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Directive: ${profile.directive}. Refactor the following code. Return ONLY JSON: { "code": "string", "reason": "string" }. FILE: ${target}` }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      
      const data = await aiRes.json();
      const result = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
      
      if (result.code) {
        addLine(`RESULT: ${result.reason.substring(0, 50)}...`);
        addLine("STATUS: WAITING_FOR_NEXT_SYNAPSE");
      }
    } catch (e) {
      addLine(`ERROR: ${e.message.toUpperCase()}`);
    } finally {
      isBusy.current = false;
    }
  }, [profile, inputStep]);

  useEffect(() => {
    if (inputStep === 'RUNNING') {
      const t = setInterval(executeCycle, 45000);
      executeCycle();
      return () => clearInterval(t);
    }
  }, [inputStep, executeCycle]);

  // View: Splash Screen
  if (view === 'SPLASH') {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6 text-zinc-300 font-mono">
        <div className="max-w-md w-full space-y-8 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 shadow-2xl">
          <div className="text-center space-y-4">
            <div className="inline-block p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-2">
              <Shield className="text-emerald-500" size={48} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter italic">SOVEREIGN <span className="text-emerald-500 not-italic">OS</span></h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Recursive Autonomy Protocol v97</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-600 uppercase flex items-center gap-2"><User size={12}/> User_Identity</label>
              <input 
                type="text" 
                placeholder="Enter Operator Name..."
                className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-emerald-500/50 outline-none transition-all"
                value={profile.name}
                onChange={(e) => setProfile({...profile, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-600 uppercase flex items-center gap-2"><Zap size={12}/> Evolution_Manifesto</label>
              <textarea 
                rows="3"
                placeholder="What is the goal of this evolution?"
                className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-emerald-500/50 outline-none transition-all resize-none"
                value={profile.directive}
                onChange={(e) => setProfile({...profile, directive: e.target.value})}
              />
            </div>
          </div>

          <button 
            onClick={startTerminal}
            disabled={!profile.name}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-black font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3"
          >
            Initiate_Kernel <TermIcon size={18} />
          </button>

          <div className="flex justify-between text-[9px] text-zinc-700 font-bold uppercase tracking-widest pt-4">
            <span>Auth: Anonymous</span>
            <span>Link: Ready</span>
          </div>
        </div>
      </div>
    );
  }

  // View: Terminal
  return (
    <div 
      className="min-h-screen bg-black text-[#00FF41] font-mono p-4 md:p-10 text-sm md:text-base selection:bg-[#00FF41] selection:text-black overflow-hidden flex flex-col"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex-1 overflow-y-auto scrollbar-hide mb-4" ref={scrollRef}>
        {lines.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap leading-relaxed opacity-90">{line}</div>
        ))}
        
        {inputStep !== 'RUNNING' && (
          <div className="flex">
            <span>{CONFIG.PROMPT}</span>
            <input
              ref={inputRef}
              autoFocus
              className="bg-transparent border-none outline-none text-[#00FF41] flex-1 caret-transparent"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleTerminalInput}
              type={inputStep === 'TOKEN' || inputStep === 'AI_KEY' ? "password" : "text"}
            />
            <span className={`${cursorVisible ? 'opacity-100' : 'opacity-0'} w-2 bg-[#00FF41]`}>&nbsp;</span>
          </div>
        )}

        {inputStep === 'RUNNING' && (
          <div className="animate-pulse">_ EXECUTION_IN_PROGRESS</div>
        )}
      </div>

      <div className="border-t border-[#004400] pt-3 flex justify-between items-center opacity-40">
        <div className="flex gap-6">
          <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Globe size={10} /> {profile.repo || 'NO_REMOTE'}</span>
          <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Cpu size={10} /> Neural_Active</span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.4em]">SOVEREIGN_OS // {profile.name.toUpperCase()}</span>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        input::selection { background: #00FF41; color: black; }
      `}</style>
    </div>
  );
        }
