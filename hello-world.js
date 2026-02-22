To consolidate the provided code into a single, valid file, the core React application (`CORE`) will be enhanced with features and patterns suggested in the `ABSTRACTIONS` and `NEW` sections. The goal is to integrate the "Logic Analyzer" concept and robust API call patterns (like retries with backoff) into the existing `App.js` structure, while avoiding conflicting declarations or entirely replacing the application's core logic with the standalone batch processing system from `NEW`.

Here's the consolidated file:

```jsx
import {
  useState,
  useEffect,
  useReducer,
  useRef,
  useCallback
} from 'react';
import { initializeApp, getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/app';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { GitHub } from 'github-api'; // Assuming 'github-api' npm package
import { useAuthState } from 'react-firebase-hooks/auth'; // Assuming 'react-firebase-hooks' npm package

// ============================================================================
// 1. ERROR HANDLING CLASSES (From NEW, adapted)
// ============================================================================

/**
 * Custom error class for API-related issues, including status codes and details.
 */
class ApiError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Custom error class for logging failures, with a built-in reporting mechanism.
 */
class LoggingError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'LoggingError';
    this.statusCode = statusCode;
    this.details = details;
    this.reportError(); // Automatically report the error upon creation
  }

  async reportError() {
    try {
      // In a production environment, this would send the error to a logging service.
      // For now, it just logs to the console.
      console.error(`[LoggingError] ${this.message}`, this.details);
    } catch (error) {
      console.error('Error reporting failed:', error);
    }
  }
}

// ============================================================================
// 2. CONFIGURATION & ENVIRONMENT (Inlined src/config.json and src/env.js)
// ============================================================================

// Inlined src/config.json
const appConfig = {
  CYCLE_INTERVAL: 6000,
  MODELS: [{
    id: 'gemini-2.5-flash-lite-preview-09-2025',
    label: 'Flash Lite (Speed)'
  }, {
    id: 'gemini-2.5-flash-preview-09-2025',
    label: 'Flash 2.5 (Pro)'
  }, {
    id: 'gemini-3-flash-preview-09-2025',
    label: 'Flash 3.0 (Exp)'
  }],
  GEMINI_MAX_RETRIES: 5, // Max retries for Gemini API calls (from NEW concept)
  GEMINI_INITIAL_BACKOFF_MS: 100, // Initial backoff delay (from NEW concept)
  GEMINI_BACKOFF_MULTIPLIER: 2, // Multiplier for backoff delay (from NEW concept)
  GEMINI_MAX_BACKOFF_MS: 5000, // Maximum backoff delay (from NEW concept)
  RATE_LIMIT_STATUS_CODE: 429, // HTTP status code for rate limiting (from NEW concept)
};

// Inlined and Adapted src/env.js
// In a real React app, environment variables are loaded at build time and accessed via process.env.
// This adaptation assumes these variables are correctly set in the build environment.
const loadEnv = () => {
  return {
    REACT_APP_ACTIVE_MODEL: process.env.REACT_APP_ACTIVE_MODEL,
    REACT_APP_TARGET_REPO: process.env.REACT_APP_TARGET_REPO,
    REACT_APP_INITIAL_AUTH_TOKEN: process.env.REACT_APP_INITIAL_AUTH_TOKEN,
    REACT_APP_GH_TOKEN: process.env.REACT_APP_GH_TOKEN,
    REACT_APP_GEMINI_KEYS: process.env.REACT_APP_GEMINI_KEYS ? process.env.REACT_APP_GEMINI_KEYS.split(',') : [],
    REACT_APP_FIREBASE_API_KEY: process.env.REACT_APP_FIREBASE_API_KEY,
    REACT_APP_FIREBASE_AUTH_DOMAIN: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    REACT_APP_FIREBASE_PROJECT_ID: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    REACT_APP_FIREBASE_STORAGE_BUCKET: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    REACT_APP_FIREBASE_APP_ID: process.env.REACT_APP_FIREBASE_APP_ID,
    REACT_APP_FIREBASE_MEASUREMENT_ID: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  };
};

// ============================================================================
// 3. FIREBASE CONFIGURATION AND INITIALIZATION
// ============================================================================

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only once
const app = initializeApp(firebaseConfig);
// getFirestore(app); // Not explicitly used in App.js but typically part of firebase setup

// ============================================================================
// 4. UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculates exponential backoff delay for retries.
 * @param {number} retryCount - The current retry attempt number.
 * @returns {number} The delay in milliseconds.
 */
function calculateBackoffDelay(retryCount) {
  const baseDelay = appConfig.GEMINI_INITIAL_BACKOFF_MS * Math.pow(appConfig.GEMINI_BACKOFF_MULTIPLIER, retryCount);
  return Math.min(baseDelay, appConfig.GEMINI_MAX_BACKOFF_MS);
}

// ============================================================================
// 5. STATE MANAGEMENT (Reducer and Core State - Enhanced with Logic Analyzer)
// ============================================================================

const initialState = {
  isLive: false,
  isAcknowledged: false,
  status: 'IDLE',
  activePath: 'Ready',
  selectedModel: process.env.REACT_APP_ACTIVE_MODEL ?? appConfig.MODELS[0].id,
  targetRepo: process.env.REACT_APP_TARGET_REPO ?? '',
  geminiKeys: Array(10).fill(''), // Will be overwritten by env variables if present
  keyHealth: {},
  currentCycle: 1,
  logs: [],
  metrics: {
    mutations: 0,
    progress: 0
  },
  logicalSignals: {}, // New: Added for logic analyzer (from ABSTRACTIONS)
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_VAL':
      if (action.key === 'targetRepo') localStorage.setItem('targetRepo', action.value);
      if (action.key === 'selectedModel') localStorage.setItem('selectedModel', action.value);
      return { ...state,
        [action.key]: action.value
      };
    case 'MARK_KEY_HEALTH':
      return { ...state,
        keyHealth: { ...state.keyHealth,
          [action.index]: {
            blocked: action.blocked,
            resetAt: action.resetAt
          }
        }
      };
    case 'INCREMENT_CYCLE':
      return { ...state,
        currentCycle: state.currentCycle + 1,
        metrics: { ...state.metrics,
          progress: 0
        }
      };
    case 'ACKNOWLEDGE':
      return { ...state,
        isAcknowledged: true
      };
    case 'TOGGLE':
      return { ...state,
        isLive: !state.isLive,
        status: !state.isLive ? 'BOOTING' : 'IDLE'
      };
    case 'LOG':
      return { ...state,
        logs: [{
          id: uuidv4(),
          ...action.payload
        }, ...state.logs].slice(0, 50)
      };
    case 'UPDATE_METRICS':
      return { ...state,
        metrics: { ...state.metrics,
          ...action.payload
        }
      };
    case 'SET_STATUS':
      return { ...state,
        status: action.value,
        activePath: action.path || state.activePath
      };
    case 'SET_SIGNAL': // New: Logic Analyzer action (from ABSTRACTIONS)
      return { ...state,
        logicalSignals: { ...state.logicalSignals,
          [action.signalKey]: action.signalValue
        }
      };
    default:
      return state;
  }
};

// ============================================================================
// 6. REACT HOOKS AND COMPONENTS
// ============================================================================

const useEnvironment = () => {
  const loadEnvData = useCallback(() => loadEnv(), []);
  return { ...loadEnvData()
  };
};

const useGithub = (token) => {
  const [github, setGithub] = useState(null);
  useEffect(() => {
    if (!token) return;
    setGithub(new GitHub({
      token
    }));
  }, [token]);
  return github;
};

/**
 * Displays logical signals in a simple UI. (From ABSTRACTIONS, adapted for useReducer)
 * @param {{signals: object}} props - The logical signals object from the state.
 */
function SignalDisplay({
  signals
}) {
  return (
    <div style={{ marginTop: '20px', borderTop: '1px solid #61dafb', paddingTop: '10px' }}>
      <h3>Logical Signals</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
        {Object.keys(signals).map((signalKey) => (
          <div key={signalKey} style={{
            background: '#3a3f4a',
            padding: '8px',
            borderRadius: '4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#aaa' }}>{signalKey}:</span>
            <span style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: signals[signalKey] === true ? 'green' : (signals[signalKey] === false ? 'red' : '#ccc')
            }}>
              {signals[signalKey] === true ? 'ACTIVE' : (signals[signalKey] === false ? 'INACTIVE' : 'UNKNOWN')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}


const App = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [user, loading, error] = useAuthState(getAuth());
  const ghTokenRef = useRef('');
  const geminiKeyIndexRef = useRef(0);
  const isBusy = useRef(false);
  const queueRef = useRef([]);
  const indexRef = useRef(0);
  const mutationsHistory = useRef([]);

  const { REACT_APP_ACTIVE_MODEL, REACT_APP_TARGET_REPO, REACT_APP_INITIAL_AUTH_TOKEN, REACT_APP_GH_TOKEN, REACT_APP_GEMINI_KEYS } = useEnvironment();

  // Populate initial state from environment variables and localStorage
  useEffect(() => {
    const storedTargetRepo = localStorage.getItem('targetRepo');
    const storedSelectedModel = localStorage.getItem('selectedModel');
    const storedIndex = parseInt(localStorage.getItem('index') || "0", 10);

    if (storedTargetRepo && storedTargetRepo !== state.targetRepo) {
      dispatch({ type: 'SET_VAL', key: 'targetRepo', value: storedTargetRepo });
    } else if (REACT_APP_TARGET_REPO && REACT_APP_TARGET_REPO !== state.targetRepo) {
      dispatch({ type: 'SET_VAL', key: 'targetRepo', value: REACT_APP_TARGET_REPO });
    }

    if (storedSelectedModel && storedSelectedModel !== state.selectedModel) {
      dispatch({ type: 'SET_VAL', key: 'selectedModel', value: storedSelectedModel });
    } else if (REACT_APP_ACTIVE_MODEL && REACT_APP_ACTIVE_MODEL !== state.selectedModel) {
      dispatch({ type: 'SET_VAL', key: 'selectedModel', value: REACT_APP_ACTIVE_MODEL });
    }

    if (REACT_APP_GH_TOKEN) {
      ghTokenRef.current = REACT_APP_GH_TOKEN;
    }

    if (REACT_APP_GEMINI_KEYS && REACT_APP_GEMINI_KEYS.length > 0) {
      dispatch({ type: 'SET_VAL', key: 'geminiKeys', value: REACT_APP_GEMINI_KEYS });
    }

    indexRef.current = storedIndex; // Restore index
  }, [dispatch, REACT_APP_ACTIVE_MODEL, REACT_APP_TARGET_REPO, REACT_APP_GH_TOKEN, REACT_APP_GEMINI_KEYS]);


  useEffect(() => {
    const initAuth = async () => {
      if (!loading && !user && !error) {
        dispatch({ type: 'SET_SIGNAL', signalKey: 'firebase_auth_start', signalValue: true }); // Signal: Auth Start
        try {
          if (REACT_APP_INITIAL_AUTH_TOKEN) {
            await signInWithCustomToken(getAuth(), REACT_APP_INITIAL_AUTH_TOKEN);
          } else {
            await signInAnonymously(getAuth());
          }
          dispatch({ type: 'ACKNOWLEDGE' });
          dispatch({ type: 'SET_SIGNAL', signalKey: 'firebase_auth_success', signalValue: true }); // Signal: Auth Success
        } catch (authError) {
          dispatch({ type: 'LOG', payload: { id: uuidv4(), message: `Auth Error: ${authError.message}`, type: 'error', timestamp: new Date().toLocaleString() } });
          dispatch({ type: 'SET_SIGNAL', signalKey: 'firebase_auth_failure', signalValue: true }); // Signal: Auth Failure
          new LoggingError(`Firebase Authentication failed: ${authError.message}`, 500, authError); // Use LoggingError
        } finally {
          dispatch({ type: 'SET_SIGNAL', signalKey: 'firebase_auth_start', signalValue: false }); // Signal: Auth End
        }
      }
    };
    initAuth();

    // Ensure runCycle is called when user state changes and is acknowledged
    // The interval in the other useEffect will handle this.
    // If auth is acknowledged and user exists, the interval will pick it up.

    const unsubscribe = onAuthStateChanged(getAuth(), (currentUser) => {
      if (currentUser && !state.isAcknowledged) {
        dispatch({ type: 'ACKNOWLEDGE' });
      }
    });
    return () => unsubscribe();
  }, [loading, user, error, REACT_APP_INITIAL_AUTH_TOKEN, state.isAcknowledged, dispatch]); // Added dispatch to dependency array


  const getNextKey = () => {
    const validKeys = state.geminiKeys.map((k, i) => ({ k: k.trim(), i }));
    const filteredKeys = validKeys.filter(node => node.k !== '');

    if (filteredKeys.length === 0) {
      throw new Error("Cluster Empty: No Gemini API keys provided.");
    }

    // Find the next available key, respecting health
    for (let i = 0; i < filteredKeys.length; i++) {
      const candidateIndex = (geminiKeyIndexRef.current + i) % filteredKeys.length;
      const keyNode = filteredKeys[candidateIndex];
      const health = state.keyHealth[keyNode.i];

      if (!health?.blocked || health.resetAt < Date.now()) {
        geminiKeyIndexRef.current = (candidateIndex + 1) % filteredKeys.length; // Advance index for next call
        return keyNode.k;
      }
    }
    throw new Error("Cluster Overheat: All Gemini API keys are blocked or rate-limited.");
  };

  const github = useGithub(ghTokenRef.current);

  const syncProjectDocs = async (repo) => {
    if (mutationsHistory.current.length === 0) return;
    dispatch({ type: 'SET_STATUS', value: 'CHRONICLING' });
    dispatch({ type: 'SET_SIGNAL', signalKey: 'github_sync_start', signalValue: true }); // Signal: GitHub Sync Start

    try {
      const docs = ['README.md', 'TODO.md'];
      for (const docName of docs) {
        // Fetch current content to get SHA
        const { data: currentContentData } = await github.repos.getContents(repo, docName);
        let content = atob(currentContentData.content);
        const timestamp = new Date().toLocaleString();

        const logEntry = `\n\n### 🏛️ Sovereign Pass ${state.currentCycle} [${timestamp}]\n` +
          mutationsHistory.current.map(m => `- **${m.path}**: ${m.change}`).join('\n');

        if (docName === 'README.md') {
          content = content.includes('## 📜 Audit Log') ?
            content.replace('## 📜 Audit Log', `## 📜 Audit Log${logEntry}`) :
            content + `\n\n## 📜 Audit Log${logEntry}`;
        } else if (docName === 'TODO.md') {
          content += `\n\n- [x] Completed Architectural Pass ${state.currentCycle} (${timestamp})`;
        }

        // Encode content for GitHub API
        const encodedContent = btoa(unescape(encodeURIComponent(content)));

        await github.repos.updateContents(repo, docName, {
          message: `[Chronicler] Update ${docName} - Pass ${state.currentCycle}`,
          content: encodedContent,
          sha: currentContentData.sha
        });
        dispatch({ type: 'LOG', payload: { id: uuidv4(), message: `Synchronized ${docName}`, timestamp: new Date().toLocaleString() } });
      }
      dispatch({ type: 'SET_SIGNAL', signalKey: 'github_sync_success', signalValue: true }); // Signal: GitHub Sync Success
    } catch (e) {
      dispatch({ type: 'LOG', payload: { id: uuidv4(), message: "Sync Error: " + e.message, type: 'error', timestamp: new Date().toLocaleString() } });
      dispatch({ type: 'SET_SIGNAL', signalKey: 'github_sync_failure', signalValue: true }); // Signal: GitHub Sync Failure
      new LoggingError(`GitHub Sync failed: ${e.message}`, e.response?.status || 500, e); // Use LoggingError
    } finally {
      dispatch({ type: 'SET_SIGNAL', signalKey: 'github_sync_start', signalValue: false }); // Signal: GitHub Sync End
    }
    mutationsHistory.current = [];
  };

  const runCycle = async () => {
    if (!state.isLive || isBusy.current || !user || !github) {
      return;
    }
    isBusy.current = true;

    try {
      const repo = state.targetRepo.trim().replace(/^https?:\/\/github\.com\//, '');
      if (!repo) {
        throw new Error("Target repository not configured.");
      }

      if (queueRef.current.length === 0) {
        dispatch({ type: 'SET_STATUS', value: 'INDEXING' });
        dispatch({ type: 'SET_SIGNAL', signalKey: 'github_indexing_start', signalValue: true }); // Signal: GitHub Indexing Start
        const { data } = await github.repos.get(repo);
        // Note: For very large repos, this `getTree` call might still hit limitations
        // or be slow. Pagination for `getTree` itself would require more complex logic
        // or using other GitHub API endpoints to list files in chunks.
        const { data: treeData } = await github.repos.getTree(repo, data.default_branch, { recursive: true });
        queueRef.current = treeData.tree.filter(f => f.type === 'blob' && f.path.match(/\.(js|jsx|ts|tsx|py|html|css|json)$/i)).map(f => f.path);
        localStorage.setItem('index', "0");
        indexRef.current = 0;
        dispatch({ type: 'SET_SIGNAL', signalKey: 'github_indexing_success', signalValue: true }); // Signal: GitHub Indexing Success
      }

      if (indexRef.current >= queueRef.current.length) {
        await syncProjectDocs(repo);
        dispatch({ type: 'LOG', payload: { id: uuidv4(), message: `Pass ${state.currentCycle} Complete.`, timestamp: new Date().toLocaleString() } });
        indexRef.current = 0;
        localStorage.setItem('index', "0");
        dispatch({ type: 'INCREMENT_CYCLE' });
        dispatch({ type: 'SET_STATUS', value: 'IDLE' });
        dispatch({ type: 'TOGGLE' });
        isBusy.current = false;
        return;
      }

      const path = queueRef.current[indexRef.current];
      if (['README.md', 'TODO.md'].includes(path)) {
        indexRef.current++;
        localStorage.setItem('index', indexRef.current.toString());
        dispatch({ type: 'UPDATE_METRICS', payload: { progress: Math.round((indexRef.current / queueRef.current.length) * 100) } });
        isBusy.current = false;
        return;
      }

      dispatch({ type: 'SET_STATUS', value: 'REFACTORING', path });
      dispatch({ type: 'SET_SIGNAL', signalKey: 'github_fetch_file_start', signalValue: true }); // Signal: GitHub File Fetch Start

      // Fetch the file content from GitHub
      const { data: fileContentData } = await github.repos.getContents(repo, path);
      const fileContent = atob(fileContentData.content);
      dispatch({ type: 'SET_SIGNAL', signalKey: 'github_fetch_file_success', signalValue: true }); // Signal: GitHub File Fetch Success

      let geminiResponse;
      let retryCount = 0;
      let geminiSuccess = false;

      while (!geminiSuccess && retryCount < appConfig.GEMINI_MAX_RETRIES) {
        const geminiKey = getNextKey(); // Get a key, handles health checks
        dispatch({ type: 'SET_SIGNAL', signalKey: 'gemini_api_call_start', signalValue: true }); // Signal: Gemini API Call Start

        try {
          geminiResponse = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${state.selectedModel}:generateContent`, {
              contents: [{
                parts: [{
                  text: `TASK: Fully optimize and refactor the following code snippet for modern best practices, improved clarity, and optimized performance. Consider potential quantum-inspired architectural patterns (e.g., modularity, error handling for uncertainty, parallelism).

            MANDATORY: Return the full, refactored code block first.
            MANDATORY: After the code, append a detailed "Full log" section describing the changes made, the reasoning, and any quantum-inspired insights applied.
            MANDATORY: The output must be valid code for the original file type.

            CODE START:
            \`\`\`${path.split('.').pop()}
            ${fileContent}
            \`\`\`
            CODE END.
            `
                }]
              }]
            }, {
              headers: {
                'x-goog-api-key': geminiKey,
                'Content-Type': 'application/json'
              }
            }
          );
          geminiSuccess = true;
          dispatch({ type: 'SET_SIGNAL', signalKey: 'gemini_api_call_success', signalValue: true }); // Signal: Gemini API Call Success
        } catch (e) {
          dispatch({ type: 'SET_SIGNAL', signalKey: 'gemini_api_call_failure', signalValue: true }); // Signal: Gemini API Call Failure
          if (e.response && (e.response.status === appConfig.RATE_LIMIT_STATUS_CODE || e.response.status === 403) && retryCount < appConfig.GEMINI_MAX_RETRIES - 1) {
            const delay = calculateBackoffDelay(retryCount);
            dispatch({ type: 'LOG', payload: { id: uuidv4(), message: `Gemini API rate limit/error (${e.response.status}). Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${appConfig.GEMINI_MAX_RETRIES})`, type: 'warn', timestamp: new Date().toLocaleString() } });
            dispatch({ type: 'MARK_KEY_HEALTH', index: geminiKeyIndexRef.current, blocked: true, resetAt: Date.now() + delay });
            await new Promise(resolve => setTimeout(resolve, delay));
            retryCount++;
          } else {
            throw new ApiError("Gemini API call failed after retries.", e.response?.status || 500, e);
          }
        } finally {
          dispatch({ type: 'SET_SIGNAL', signalKey: 'gemini_api_call_start', signalValue: false }); // Signal: Gemini API Call End
        }
      }

      if (!geminiSuccess || !geminiResponse) {
        throw new Error("Gemini API call ultimately failed.");
      }

      // Process the generated content
      const generatedText = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error("Gemini API returned no generated text.");
      }

      // Split generated text into code and log
      const codeEndIndex = generatedText.indexOf("Full log");
      let newCode = generatedText;
      // let changeLog = "No detailed log provided by AI."; // Currently unused

      if (codeEndIndex !== -1) {
        newCode = generatedText.substring(0, codeEndIndex).trim();
        // changeLog = generatedText.substring(codeEndIndex).trim(); // Currently unused
      }

      // Simple diff check (more robust diffing would be ideal)
      if (newCode.trim() !== fileContent.trim()) {
        dispatch({ type: 'SET_SIGNAL', signalKey: 'github_update_file_start', signalValue: true }); // Signal: GitHub Update File Start
        await github.repos.updateContents(repo, path, {
          message: `[Refactor] Optimize and refactor ${path} - Pass ${state.currentCycle}`,
          content: btoa(unescape(encodeURIComponent(newCode))), // Encode for GitHub API
          sha: fileContentData.sha // Use original SHA for update
        });
        mutationsHistory.current.push({ path, change: "Code refactored and optimized." });
        dispatch({ type: 'UPDATE_METRICS', payload: { mutations: state.metrics.mutations + 1 } });
        dispatch({ type: 'LOG', payload: { id: uuidv4(), message: `Refactored: ${path}`, type: 'success', timestamp: new Date().toLocaleString() } });
        dispatch({ type: 'SET_SIGNAL', signalKey: 'github_update_file_success', signalValue: true }); // Signal: GitHub Update File Success
      } else {
        dispatch({ type: 'LOG', payload: { id: uuidv4(), message: `No significant changes for: ${path}`, type: 'info', timestamp: new Date().toLocaleString() } });
      }

    } catch (e) {
      dispatch({ type: 'LOG', payload: { id: uuidv4(), message: "Error in runCycle: " + e.message, type: 'error', timestamp: new Date().toLocaleString() } });
      new LoggingError(`Error during runCycle for ${state.activePath}: ${e.message}`, e.statusCode || 500, e); // Use LoggingError
      dispatch({ type: 'SET_SIGNAL', signalKey: 'github_indexing_start', signalValue: false }); // Reset indexing signal
      dispatch({ type: 'SET_SIGNAL', signalKey: 'github_fetch_file_start', signalValue: false }); // Reset file fetch signal
      dispatch({ type: 'SET_SIGNAL', signalKey: 'github_update_file_start', signalValue: false }); // Reset file update signal
      dispatch({ type: 'SET_STATUS', value: 'ERROR' }); // Indicate an error state
    } finally {
      indexRef.current++;
      localStorage.setItem('index', indexRef.current.toString());
      dispatch({ type: 'UPDATE_METRICS', payload: { progress: Math.round((indexRef.current / queueRef.current.length) * 100) } });
      isBusy.current = false;
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (state.isLive && state.isAcknowledged && user) {
        runCycle();
      }
    }, appConfig.CYCLE_INTERVAL);
    return () => clearInterval(intervalId);
  }, [state.isLive, state.isAcknowledged, user, github, state.targetRepo, state.selectedModel, state.metrics.mutations, state.currentCycle, dispatch]); // Added dispatch to dependency array

  // Minimal UI to satisfy "valid React component"
  return (
    <div style={{ fontFamily: 'monospace', padding: '20px', background: '#282c34', color: '#fff' }}>
      <h1>Tri-Model Nexus</h1>
      <p>Status: {state.status}</p>
      <p>Active Path: {state.activePath}</p>
      <p>Cycle: {state.currentCycle}</p>
      <p>Progress: {state.metrics.progress}%</p>
      <p>Mutations: {state.metrics.mutations}</p>
      <button onClick={() => dispatch({ type: 'TOGGLE' })}>
        {state.isLive ? 'Stop' : 'Start'}
      </button>
      <input
        type="text"
        placeholder="Target GitHub Repo (e.g., owner/repo)"
        value={state.targetRepo}
        onChange={(e) => dispatch({ type: 'SET_VAL', key: 'targetRepo', value: e.target.value })}
        style={{
          width: 'calc(100% - 22px)',
          padding: '10px',
          margin: '10px 0',
          backgroundColor: '#3a3f4a',
          border: '1px solid #61dafb',
          color: '#fff',
          borderRadius: '4px'
        }}
      />
      <select
        value={state.selectedModel}
        onChange={(e) => dispatch({ type: 'SET_VAL', key: 'selectedModel', value: e.target.value })}
        style={{
          width: '100%',
          padding: '10px',
          margin: '10px 0',
          backgroundColor: '#3a3f4a',
          border: '1px solid #61dafb',
          color: '#fff',
          borderRadius: '4px'
        }}
      >
        {appConfig.MODELS.map((model) => (
          <option key={model.id} value={model.id}>
            {model.label} ({model.id})
          </option>
        ))}
      </select>
      <div style={{ marginTop: '20px', maxHeight: '300px', overflowY: 'scroll', border: '1px solid #61dafb', padding: '10px', background: '#3a3f4a' }}>
        <h3>Logs</h3>
        {state.logs.map(log => (
          <p key={log.id} style={{ color: log.type === 'error' ? 'red' : (log.type === 'warn' ? 'yellow' : 'white') }}>
            [{log.timestamp}] {log.message}
          </p>
        ))}
      </div>
      <SignalDisplay signals={state.logicalSignals} /> {/* Render the logic analyzer display */}
    </div>
  );
};

export default App;