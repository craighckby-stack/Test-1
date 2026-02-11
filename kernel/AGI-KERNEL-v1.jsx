import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, query, limit, orderBy, doc, getDoc, getDocs } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  Brain, Terminal, Cpu, Layers, Zap, Activity, Target, ArrowUpCircle, RefreshCcw, Wrench, Box, Database, ShieldAlert
} from 'lucide-react';

/**
 * AGI-KERNEL v1.1.5 - "SYSTEM_LOADER_STABLE"
 * Feature: Full environmental restoration from Firebase.
 * Logic: Hardened context injection to prevent regression of v1.1.2/v1.1.3 fixes.
 */

const CONFIG = {
  APP_ID: (typeof window !== 'undefined' && window.__app_id) ? window.__app_id : 'agi-kernel-v1-stable',
  GITHUB_API: "https://api.github.com/repos",
  GEMINI_ENDPOINT: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent",
  HEARTBEAT_INTERVAL: 15000,
  MILESTONE_STEP: 50
};

const getPlatformKey = () => (typeof apiKey !== 'undefined' ? apiKey : "");
const safeUtoa = (str) => btoa(unescape(encodeURIComponent(str)));
const safeAtou = (str) => {
  if (!str) return "";
  try { return decodeURIComponent(escape(atob(str.replace(/\s/g, '')))); } 
  catch (e) { try { return atob(str); } catch(err) { return ""; } } 
};

const recoverJSON = (rawText) => {
  if (!rawText) return null;
  const matches = rawText.match(/\{[\s\S]*\}/g);
  if (!matches) return null;
  try { return JSON.parse(matches[matches.length - 1]); } 
  catch (e) { return null; } 
};

class FirebaseKernelServiceImpl {
    #auth = null;
    #db = null;
    #appId = null;

    // --- Setup and Dependency Proxy ---
    #setupDependencies() {
        return { 
            initializeApp, getApp, getApps, getFirestore, collection, onSnapshot, addDoc, query, limit, orderBy, doc, getDoc, getDocs,
            getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged
        };
    }

    #throwError(message, e) {
        console.error(`Critical: ${message}`, e);
        throw new Error(message);
    }

    // --- Initialization I/O Proxies ---

    async #delegateToFirebaseInit(fbConfig) {
        const deps = this.#setupDependencies();
        const app = !deps.getApps().length ? deps.initializeApp(fbConfig) : deps.getApp();
        this.#auth = deps.getAuth(app);
        this.#db = deps.getFirestore(app);
    }

    async #delegateToAuth(initialToken) {
        const deps = this.#setupDependencies();
        if (initialToken) {
            await deps.signInWithCustomToken(this.#auth, initialToken);
        } else {
            await deps.signInAnonymously(this.#auth);
        }
    }

    #delegateToAuthStateChange(callback) {
        this.#setupDependencies().onAuthStateChanged(this.#auth, callback);
    }

    // --- State Loading I/O Proxies ---

    async #delegateToGetVersion(userId) {
        const deps = this.#setupDependencies();
        const vDocRef = deps.doc(this.#db, 'artifacts', this.#appId, 'users', userId, 'kernel_state', 'current');
        return await deps.getDoc(vDocRef);
    }

    async #delegateToGetTools() {
        const deps = this.#setupDependencies();
        const q = deps.query(deps.collection(this.#db, 'artifacts', this.#appId, 'public', 'data', 'tools'));
        return await deps.getDocs(q);
    }

    // --- Streaming I/O Proxies ---

    #delegateToOnSnapshot(userId, collectionName, limitCount, successCb, errorCb) {
        const deps = this.#setupDependencies();
        const collectionPath = deps.collection(this.#db, 'artifacts', this.#appId, 'users', userId, collectionName);
        const q = deps.query(collectionPath, deps.orderBy('timestamp', 'desc'), deps.limit(limitCount));
        return deps.onSnapshot(q, successCb, errorCb);
    }

    // --- Persistence I/O Proxies ---

    async #delegateToAddDoc(userId, data) {
        const deps = this.#setupDependencies();
        const collectionPath = deps.collection(this.#db, 'artifacts', this.#appId, 'users', userId, 'history');
        await deps.addDoc(collectionPath, data);
    }

    // --- Public Interface ---

    async initialize(appId, firebaseConfig, initialAuthToken) {
        this.#appId = appId;
        try {
            await this.#delegateToFirebaseInit(firebaseConfig);
            await this.#delegateToAuth(initialAuthToken);
            return { auth: this.#auth, db: this.#db };
        } catch (e) {
            this.#throwError("Auth fail", e);
        }
    }

    onUserChange(userCallback) {
        if (!this.#auth) { return () => {}; } 
        this.#delegateToAuthStateChange(userCallback);
    }

    async loadSystemState(user) {
        if (!user || !this.#db) return { version: 1, tools: [] };
        
        // 1. Version Restoration
        const vDoc = await this.#delegateToGetVersion(user.uid);
        const version = vDoc.exists() ? vDoc.data().version || 1 : 1;

        // 2. Legacy Tool Discovery (Global)
        const toolsSnap = await this.#delegateToGetTools();
        const tools = toolsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        return { version, tools };
    }

    setupLiveStreams(user, dispatch) {
        if (!user || !this.#db) return () => {};
        
        const logSuccess = (snap) => dispatch({ type: 'LOGS', logs: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
        const ledgerSuccess = (snap) => dispatch({ type: 'LEDGER', ledger: snap.docs.map(d => d.data().insight) });

        const unsubLogs = this.#delegateToOnSnapshot(
            user.uid, 'history', 50, 
            logSuccess, 
            (err) => console.error(err) 
        );

        const unsubLedger = this.#delegateToOnSnapshot(
            user.uid, 'strategic_ledger', 20, 
            ledgerSuccess,
            (err) => console.error(err) 
        );

        return () => { unsubLogs(); unsubLedger(); };
    }
    
    async persistLog(user, msg, type = 'info') {
        if (!user || !this.#db) return;
        await this.#delegateToAddDoc(user.uid, { msg, type, timestamp: Date.now() });
    }
}

const FB_SERVICE_INSTANCE = new FirebaseKernelServiceImpl();

const INITIAL_STATE = {
  booted: false, live: false, status: 'IDLE', objective: 'WAITING', focusFile: 'NONE',
  cycles: 0, maturity: 0, currentVersion: 1, availableUpgrade: null,
  logs: [], ledger: [], tools: [], config: { token: '', repo: '', branch: 'main' }, online: false, authReady: false, systemLoaded: false
};

function kernelReducer(state, action) {
  switch (action.type) {
    case 'BOOT': return { ...state, booted: true, config: action.payload, online: true };
    case 'TOGGLE': return { ...state, live: !state.live };
    case 'SET_VERSION': return { ...state, currentVersion: action.v };
    case 'UPGRADE_FOUND': return { ...state, availableUpgrade: action.v };
    case 'STATUS': return { ...state, status: action.status, objective: action.objective, focusFile: action.focusFile || state.focusFile };
    case 'LOGS': return { ...state, logs: action.logs };
    case 'LEDGER': return { ...state, ledger: action.ledger };
    case 'TOOLS_LOADED': return { ...state, tools: action.tools, systemLoaded: true };
    case 'AUTH_READY': return { ...state, authReady: true };
    case 'CYCLE': return { 
      ...state, cycles: state.cycles + 1, maturity: Math.min(100, state.maturity + (action.improved ? 0.45 : 0.05)),
    };
    default: return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(kernelReducer, INITIAL_STATE);
  const [services, setServices] = useState({ auth: null, db: null });
  const [user, setUser] = useState(null);
  const [input, setInput] = useState({ token: '', repo: '', branch: 'main' });
  const busy = useRef(false);
  const blacklist = useRef(new Set());

  // Firebase Core Initialization
  useEffect(() => {
    const initFirebase = async () => {
      const fbConfig = JSON.parse(window.__firebase_config);
      const initialAuthToken = window.__initial_auth_token;

      const servicesResult = await FB_SERVICE_INSTANCE.initialize(CONFIG.APP_ID, fbConfig, initialAuthToken);
      
      if (servicesResult) {
        setServices(servicesResult);
        
        FB_SERVICE_INSTANCE.onUserChange((u) => { 
          if (u) { setUser(u); dispatch({ type: 'AUTH_READY' }); } 
        });
      }
    };
    initFirebase();
  }, []);

  // System Loader: Restoration of Environment
  useEffect(() => {
    if (!user || !services.db) return;
    
    const loadSystemAndStreams = async () => {
      // Load static state
      const { version, tools } = await FB_SERVICE_INSTANCE.loadSystemState(user);
      
      dispatch({ type: 'SET_VERSION', v: version });
      dispatch({ type: 'TOOLS_LOADED', tools: tools });
      
      // Setup live streams
      return FB_SERVICE_INSTANCE.setupLiveStreams(user, dispatch);
    };

    const cleanup = loadSystemAndStreams();

    return cleanup;
  }, [user, services.db, dispatch]);

  const addLog = useCallback(async (msg, type = 'info') => {
    await FB_SERVICE_INSTANCE.persistLog(user, msg, type);
  }, [user]);

  const evolve = useCallback(async () => {
    if (busy.current || !state.live || !user || !services.db) return;
    busy.current = true;

    try {
      const { token, repo, branch } = state.config;
      const headers = { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' };
      const isMilestone = (state.cycles + 1) % CONFIG.MILESTONE_STEP === 0;
      const nextV = state.currentVersion + 1;
      
      const memory = state.ledger.slice(0, 15).join("\n- ");
      const tools = state.tools.map(t => `${t.name}: ${t.description}`).join("\n- ");

      dispatch({ type: 'STATUS', status: isMilestone ? 'RECURSIVE_UPLIFT' : 'NEURAL_OPTIMIZE', objective: isMilestone ? `BUILDING_v${nextV}` : 'REPO_SCAN' });

      let target, raw, sha;
      if (isMilestone) {
        target = { path: `kernel/AGI-KERNEL-v${nextV}.jsx` };
        const check = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}?ref=${branch}`, { headers });
        if (check.ok) { const d = await check.json(); sha = d.sha; raw = safeAtou(d.content); }
        else raw = "// Beginning Evolutionary Leap...";
      } else {
        const tRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/git/trees/${branch}?recursive=1`, { headers });
        const tree = await tRes.json();
        const pool = (tree.tree || []).filter(i => i.type === 'blob' && !blacklist.current.has(i.path) && /\.(js|ts|jsx|tsx)$/.test(i.path) && !i.path.includes('kernel/'));
        if (!pool.length) { blacklist.current.clear(); busy.current = false; return; }
        target = pool[Math.floor(Math.random() * pool.length)];
        const fRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}?ref=${branch}`, { headers });
        const fData = await fRes.json();
        raw = safeAtou(fData.content);
        sha = fData.sha;
      }

      dispatch({ type: 'STATUS', status: 'COGNITION', focusFile: target.path });

      const sysPrompt = `AGI-KERNEL v${state.currentVersion} OPERATIONAL PROTOCOL:\n      1. FIX_PRESERVATION: Do NOT revert the 'independent scroll' fix (overflow-y-auto on panels).\n      2. LOGIC_SAFETY: No second callback in dispatch(). \n      3. TOOLS: Use discovered legacy tools: [${tools}]\n      4. STRATEGIC_LEDGER: [${memory}]\n "
