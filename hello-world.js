import {
  useState,
  useEffect,
  useReducer,
  useRef,
  useCallback
} from 'react';
import {
  initializeApp,
  getApps,
  getApp
} from 'firebase/app'; // Ensure getApps and getApp are imported
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged
} from 'firebase/auth';
import axios from 'axios';
import {
  v4 as uuidv4
} from 'uuid';
import {
  GitHub
} from 'github-api'; // Assuming 'github-api' npm package
import {
  useAuthState
} from 'react-firebase-hooks/auth'; // Assuming 'react-firebase-hooks' npm package

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
// 2. CONFIGURATION & ENVIRONMENT (Consolidated from CORE and NEW)
// ============================================================================

const appConfig = {
  // CORE's original config values
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

  // NEW's config values, integrated and prioritized
  MAX_FILE_SIZE_BYTES: Math.pow(10, 6),
  MAX_API_RETRIES: 5, // Replaces GEMINI_MAX_RETRIES for consistency
  LOCAL_STORAGE_PREFIX: 'emg_v86_',
  LOG_HISTORY_LIMIT: 60,
  GITHUB_API_BASE: 'https://api.github.com',
  GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta',

  // CORE's retry values, adapted to NEW's MAX_API_RETRIES
  GEMINI_INITIAL_BACKOFF_MS: 100,
  GEMINI_BACKOFF_MULTIPLIER: 2,
  GEMINI_MAX_BACKOFF_MS: 5000,
  RATE_LIMIT_STATUS_CODE: 429, // HTTP status code for rate limiting
};

// Pipeline steps from NEW
const pipelineSteps = {
  CODE: [{
    id: 'refactor',
    label: 'Refactor',
    prompt: 'Act as a Senior Software Engineer adhering strictly to the Rock Principle. ' +
      'MANDATORY: Fully optimize and refactor the following code snippet for modern best practices, improved clarity, and optimized performance. Consider potential quantum-inspired architectural patterns (e.g., modularity, error handling for uncertainty, parallelism). ' +
      'MANDATORY: Return the full, refactored code block first. ' +
      'MANDATORY: After the code, append a detailed "Full log" section describing the changes made, the reasoning, and any quantum-inspired insights applied. ' +
      'MANDATORY: The output must be valid code for the original file type.'
  }, ],
  CONFIG: [{
    id: 'validate',
    label: 'Lint',
    prompt: 'Act as a DevOps Engineer. Optimize configurations. ' +
      'MANDATORY: Fully optimize and refactor the following configuration snippet for modern best practices, improved clarity, and optimized performance. Consider potential quantum-inspired architectural patterns. ' +
      'MANDATORY: Return the full, refactored configuration block first. ' +
      'MANDATORY: After the config, append a detailed "Full log" section describing the changes made, the reasoning, and any quantum-inspired insights applied. ' +
      'MANDATORY: The output must be valid for the original file type.'
  }, ],
  DOCS: [{
    id: 'clarify',
    label: 'Editor',
    prompt: 'Act as a Technical Writer. Improve clarity of documentation. ' +
      'MANDATORY: Fully optimize and refactor the following documentation for modern best practices, improved clarity, and conciseness. Consider potential quantum-inspired architectural patterns (e.g., structured information flow, explicit uncertainty handling). ' +
      'MANDATORY: Return the full, refactored document first. ' +
      'MANDATORY: After the document, append a detailed "Full log" section describing the changes made, the reasoning, and any quantum-inspired insights applied. ' +
      'MANDATORY: The output must be valid for the original file type.'
  }, ],
};

// File extension categories from NEW
const fileExtensions = {
  CODE: /\.(js|jsx|ts|tsx|py|html|css|scss|sql|sh|java|go|rs|rb|php|cpp|c|h)$/i,
  CONFIG: /\.(json|yaml|yml|toml|ini)$/i,
  DOCS: /\.(md|txt|rst|adoc|text)$/i,
};

// Skip patterns for files/directories from NEW
const skipPatterns = [
  /node_modules\//, /\.min\./, /-lock\./, /dist\//, /build\//, /\.git\//, /\.log$/,
  /\/\.\.(?!\/|$)/i, // Added pattern to skip dot files
  /^\.github\//, // Skip .github directory
  /^\.vscode\//, // Skip .vscode directory
  /\.env(\..*)?$/, // Skip .env files
  /\.DS_Store$/, // Skip macOS specific files
];

const todoFileNames = ['.sovereign-instructions.md', 'sovereign-todo.md', 'instructions.md', 'README.md', 'TODO.md'];

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
// Check if a Firebase app instance already exists to prevent re-initialization in dev mode
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// getFirestore(app); // Not explicitly used in App.js but typically part of firebase setup

// ============================================================================
// 4. UTILITY FUNCTIONS (Consolidated from CORE and NEW)
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

/**
 * Decodes a base64 string to a UTF-8 string. (From NEW, adapted)
 * @param {string} str - The base64 encoded string.
 * @returns {string} The decoded string.
 */
const base64Decode = (str) => {
  if (!str) return '';
  try {
    const binaryString = atob(str);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (e) {
    console.error("Base64 decoding failed:", e);
    return ''; // Return empty string or throw error based on desired behavior
  }
};

/**
 * Encodes a UTF-8 string to a base64 string. (From NEW, adapted)
 * @param {string} str - The string to encode.
 * @returns {string} The base64 encoded string.
 */
const base64Encode = (str) => {
  if (!str) return '';
  try {
    const bytes = new TextEncoder().encode(str);
    const binaryString = String.fromCharCode(...bytes);
    return btoa(binaryString);
  } catch (e) {
    console.error("Base64 encoding failed:", e);
    return ''; // Return empty string or throw error based on desired behavior
  }
};

/**
 * Parses a GitHub repository path from various URL formats. (From NEW)
 * @param {string} repoString - The repository URL or 'owner/repo' string.
 * @returns {[string, string]|null} An array [owner, repoName] or null if parsing fails.
 */
const parseRepoPath = (repoString) => {
  if (!repoString) return null;
  const cleanString = repoString
    .replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '')
    .replace(/\/$/, '');
  const match = cleanString.match(/^([^/]+)\/([^/]+)$/);
  return match ? [match[1], match[2]] : null;
};

/**
 * Determines the processing pipeline for a given file path based on its extension. (From NEW)
 * @param {string} filePath - The path of the file.
 * @returns {Array} The pipeline steps (e.g., CODE, CONFIG, DOCS).
 */
const getPipeline = (filePath) => {
  if (fileExtensions.CONFIG.test(filePath)) return pipelineSteps.CONFIG;
  if (fileExtensions.DOCS.test(filePath)) return pipelineSteps.DOCS;
  return pipelineSteps.CODE; // Default to CODE pipeline
};

// ============================================================================
// 5. STATE MANAGEMENT (Reducer and Core State - Enhanced with Logic Analyzer)
// ============================================================================

const initialState = {
  isLive: false,
  isAcknowledged: false, // Firebase auth acknowledged
  isIndexed: false, // NEW: Indexing of repo files complete for current cycle
  isComplete: false, // NEW: All cycles completed (or if only one cycle, then after that)
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
    progress: 0,
    steps: 0, // NEW: Number of processing steps taken
    errors: 0 // NEW: Number of errors encountered
  },
  logicalSignals: {}, // New: Added for logic analyzer (from ABSTRACTIONS)
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_VAL':
      if (action.key === 'targetRepo') localStorage.setItem(`${appConfig.LOCAL_STORAGE_PREFIX}targetRepo`, action.value);
      if (action.key === 'selectedModel') localStorage.setItem(`${appConfig.LOCAL_STORAGE_PREFIX}selectedModel`, action.value);
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
        },
        isIndexed: false, // Reset indexed status for next cycle
      };
    case 'ACKNOWLEDGE':
      return { ...state,
        isAcknowledged: true
      };
    case 'TOGGLE':
      return { ...state,
        isLive: !state.isLive,
        status: !state.isLive ? 'BOOTING' : 'IDLE',
        // Reset isIndexed when stopping, so it re-indexes on next start
        isIndexed: !state.isLive ? false : state.isIndexed,
      };
    case 'LOG':
      return { ...state,
        logs: [{
          id: uuidv4(),
          ...action.payload
        }, ...state.logs].slice(0, appConfig.LOG_HISTORY_LIMIT)
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
    case 'SET_INDEXED': // NEW: Action for indexing status
      return { ...state,
        isIndexed: action.value
      };
    case 'RESET_SESSION': // NEW: Reset state for a new session
      return {
        ...initialState,
        // Preserve values that might come from env or local storage
        targetRepo: localStorage.getItem(`${appConfig.LOCAL_STORAGE_PREFIX}targetRepo`) || process.env.REACT_APP_TARGET_REPO || '',
        selectedModel: localStorage.getItem(`${appConfig.LOCAL_STORAGE_PREFIX}selectedModel`) || process.env.REACT_APP_ACTIVE_MODEL || appConfig.MODELS[0].id,
        geminiKeys: state.geminiKeys, // Preserve keys
        isAcknowledged: state.isAcknowledged, // Preserve auth status
        logicalSignals: {} // Clear signals
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
              color: signals[signalKey] === true ? 'lightgreen' : (signals[signalKey] === false ? 'indianred' : '#ccc')
            }}>
              {signals[signalKey] === true ? 'ACTIVE' : (signals[signalKey] === false ? 'INACTIVE' : String(signals[signalKey]).toUpperCase())}
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
  const queueRef = useRef([]); // Files to process
  const indexRef = useRef(0); // Current index in queueRef
  const mutationsHistory = useRef([]); // Logs for README/TODO updates

  const {
    REACT_APP_ACTIVE_MODEL,
    REACT_APP_TARGET_REPO,
    REACT_APP_INITIAL_AUTH_TOKEN,
    REACT_APP_GH_TOKEN,
    REACT_APP_GEMINI_KEYS
  } = useEnvironment();

  // Populate initial state from environment variables and localStorage
  useEffect(() => {
    const storedTargetRepo = localStorage.getItem(`${appConfig.LOCAL_STORAGE_PREFIX}targetRepo`);
    const storedSelectedModel = localStorage.getItem(`${appConfig.LOCAL_STORAGE_PREFIX}selectedModel`);
    const storedIndex = parseInt(localStorage.getItem(`${appConfig.LOCAL_STORAGE_PREFIX}index`) || "0", 10);

    if (storedTargetRepo && storedTargetRepo !== state.targetRepo) {
      dispatch({
        type: 'SET_VAL',
        key: 'targetRepo',
        value: storedTargetRepo
      });
    } else if (REACT_APP_TARGET_REPO && REACT_APP_TARGET_REPO !== state.targetRepo) {
      dispatch({
        type: 'SET_VAL',
        key: 'targetRepo',
        value: REACT_APP_TARGET_REPO
      });
    }

    if (storedSelectedModel && storedSelectedModel !== state.selectedModel) {
      dispatch({
        type: 'SET_VAL',
        key: 'selectedModel',
        value: storedSelectedModel
      });
    } else if (REACT_APP_ACTIVE_MODEL && REACT_APP_ACTIVE_MODEL !== state.selectedModel) {
      dispatch({
        type: 'SET_VAL',
        key: 'selectedModel',
        value: REACT_APP_ACTIVE_MODEL
      });
    }

    if (REACT_APP_GH_TOKEN) {
      ghTokenRef.current = REACT_APP_GH_TOKEN;
    }

    if (REACT_APP_GEMINI_KEYS && REACT_APP_GEMINI_KEYS.length > 0) {
      dispatch({
        type: 'SET_VAL',
        key: 'geminiKeys',
        value: REACT_APP_GEMINI_KEYS
      });
    }

    indexRef.current = storedIndex; // Restore index
  }, [dispatch, REACT_APP_ACTIVE_MODEL, REACT_APP_TARGET_REPO, REACT_APP_GH_TOKEN, REACT_APP_GEMINI_KEYS, state.targetRepo, state.selectedModel]);


  useEffect(() => {
    const initAuth = async () => {
      if (!loading && !user && !error) {
        dispatch({
          type: 'SET_SIGNAL',
          signalKey: 'firebase_auth_start',
          signalValue: true
        }); // Signal: Auth Start
        try {
          if (REACT_APP_INITIAL_AUTH_TOKEN) {
            await signInWithCustomToken(getAuth(), REACT_APP_INITIAL_AUTH_TOKEN);
          } else {
            await signInAnonymously(getAuth());
          }
          dispatch({
            type: 'ACKNOWLEDGE'
          });
          dispatch({
            type: 'SET_SIGNAL',
            signalKey: 'firebase_auth_success',
            signalValue: true
          }); // Signal: Auth Success
        } catch (authError) {
          dispatch({
            type: 'LOG',
            payload: {
              id: uuidv4(),
              message: `Auth Error: ${authError.message}`,
              type: 'error',
              timestamp: new Date().toLocaleString()
            }
          });
          dispatch({
            type: 'SET_SIGNAL',
            signalKey: 'firebase_auth_failure',
            signalValue: true
          }); // Signal: Auth Failure
          new LoggingError(`Firebase Authentication failed: ${authError.message}`, 500, authError); // Use LoggingError
          dispatch({
            type: 'UPDATE_METRICS',
            payload: {
              errors: state.metrics.errors + 1
            }
          });
        } finally {
          dispatch({
            type: 'SET_SIGNAL',
            signalKey: 'firebase_auth_start',
            signalValue: false
          }); // Signal: Auth End
        }
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(getAuth(), (currentUser) => {
      if (currentUser && !state.isAcknowledged) {
        dispatch({
          type: 'ACKNOWLEDGE'
        });
      }
    });
    return () => unsubscribe();
  }, [loading, user, error, REACT_APP_INITIAL_AUTH_TOKEN, state.isAcknowledged, dispatch, state.metrics.errors]);


  const getNextKey = () => {
    const validKeys = state.geminiKeys.map((k, i) => ({
      k: k.trim(),
      i
    }));
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

  const syncProjectDocs = async (owner, repoName) => {
    if (mutationsHistory.current.length === 0) return;
    dispatch({
      type: 'SET_STATUS',
      value: 'CHRONICLING'
    });
    dispatch({
      type: 'SET_SIGNAL',
      signalKey: 'github_sync_start',
      signalValue: true
    }); // Signal: GitHub Sync Start

    try {
      for (const docName of todoFileNames) { // Iterate through all potential doc files
        let currentContentData;
        try {
          // Fetch current content to get SHA
          currentContentData = await github.repos.getContents(owner, repoName, docName);
        } catch (e) {
          if (e.response && e.response.status === 404) {
            // File doesn't exist, create it from scratch with a default header
            currentContentData = { content: base64Encode(`# ${docName.replace(/\.md$/, '').replace(/-/g, ' ').toUpperCase()}\n\n`), sha: null };
            dispatch({ type: 'LOG', payload: { id: uuidv4(), message: `Creating new document: ${docName}`, type: 'info', timestamp: new Date().toLocaleString() } });
          } else {
            throw e; // Re-throw other errors
          }
        }

        let content = base64Decode(currentContentData.content);
        const timestamp = new Date().toLocaleString();

        const logEntry = `\n\n### 🏛️ Sovereign Pass ${state.currentCycle} [${timestamp}]\n` +
          mutationsHistory.current.map(m => `- **${m.path}**: ${m.change}`).join('\n');

        if (docName.toLowerCase().includes('readme')) {
          content = content.includes('## 📜 Audit Log') ?
            content.replace('## 📜 Audit Log', `## 📜 Audit Log${logEntry}`) :
            content + `\n\n## 📜 Audit Log${logEntry}`;
        } else if (docName.toLowerCase().includes('todo') || docName.toLowerCase().includes('instructions')) {
          content += `\n\n- [x] Completed Architectural Pass ${state.currentCycle} (${timestamp})`;
        }

        // Encode content for GitHub API
        const encodedContent = base64Encode(content);

        await github.repos.updateContents(owner, repoName, docName, {
          message: `[Chronicler] Update ${docName} - Pass ${state.currentCycle}`,
          content: encodedContent,
          sha: currentContentData.sha // Will be null if new file, GitHub API handles it
        });
        dispatch({
          type: 'LOG',
          payload: {
            id: uuidv4(),
            message: `Synchronized ${docName}`,
            timestamp: new Date().toLocaleString()
          }
        });
      }
      dispatch({
        type: 'SET_SIGNAL',
        signalKey: 'github_sync_success',
        signalValue: true
      }); // Signal: GitHub Sync Success
    } catch (e) {
      dispatch({
        type: 'LOG',
        payload: {
          id: uuidv4(),
          message: "Sync Error: " + e.message,
          type: 'error',
          timestamp: new Date().toLocaleString()
        }
      });
      dispatch({
        type: 'SET_SIGNAL',
        signalKey: 'github_sync_failure',
        signalValue: true
      }); // Signal: GitHub Sync Failure
      new LoggingError(`GitHub Sync failed: ${e.message}`, e.response?.status || 500, e); // Use LoggingError
      dispatch({
        type: 'UPDATE_METRICS',
        payload: {
          errors: state.metrics.errors + 1
        }
      });
    } finally {
      dispatch({
        type: 'SET_SIGNAL',
        signalKey: 'github_sync_start',
        signalValue: false
      }); // Signal: GitHub Sync End
    }
    mutationsHistory.current = [];
  };

  const runCycle = useCallback(async () => {
    if (!state.isLive || isBusy.current || !user || !github || !state.isAcknowledged) {
      return;
    }
    isBusy.current = true;

    try {
      const parsedRepo = parseRepoPath(state.targetRepo);
      if (!parsedRepo) {
        throw new Error("Invalid target repository format. Use 'owner/repo'.");
      }
      const [owner, repoName] = parsedRepo;

      if (!state.isIndexed || queueRef.current.length === 0) {
        dispatch({
          type: 'SET_STATUS',
          value: 'INDEXING'
        });
        dispatch({
          type: 'SET_SIGNAL',
          signalKey: 'github_indexing_start',
          signalValue: true
        }); // Signal: GitHub Indexing Start
        const {
          data
        } = await github.repos.get(owner, repoName);

        // Fetch the full tree recursively. This might hit API limits for *extremely* large repos
        // or be slow, but it's the simplest way to get all file paths.
        const {
          data: treeData
        } = await github.repos.getTree(owner, repoName, data.default_branch, {
          recursive: true
        });

        const filteredFiles = treeData.tree.filter(f =>
          f.type === 'blob' && // Only files
          f.size < appConfig.MAX_FILE_SIZE_BYTES && // Skip excessively large files
          !skipPatterns.some(pattern => pattern.test(f.path)) // Skip files matching patterns
        ).map(f => f.path);

        queueRef.current = filteredFiles;
        localStorage.setItem(`${appConfig.LOCAL_STORAGE_PREFIX}index`, "0");
        indexRef.current = 0;
        dispatch({
          type: 'SET_INDEXED',
          value: true
        }); // Mark as indexed
        dispatch({
          type: 'SET_SIGNAL',
          signalKey: 'github_indexing_success',
          signalValue: true
        }); // Signal: GitHub Indexing Success
        dispatch({
          type: 'LOG',
          payload: {
            id: uuidv4(),
            message: `Indexed ${filteredFiles.length} files. Starting processing.`,
            timestamp: new Date().toLocaleString()
          }
        });
      }

      if (indexRef.current >= queueRef.current.length) {
        await syncProjectDocs(owner, repoName);
        dispatch({
          type: 'LOG',
          payload: {
            id: uuidv4(),
            message: `Pass ${state.currentCycle} Complete.`,
            timestamp: new Date().toLocaleString()
          }
        });
        indexRef.current = 0;
        localStorage.setItem(`${appConfig.LOCAL_STORAGE_PREFIX}index`, "0");
        queueRef.current = []; // Clear queue to force re-indexing on next cycle
        dispatch({
          type: 'INCREMENT_CYCLE'
        });
        dispatch({
          type: 'SET_STATUS',
          value: 'IDLE'
        });
        // Optionally toggle off or mark as complete if it's a single pass loop
        // dispatch({ type: 'TOGGLE' }); // This would stop the process after one full pass
        isBusy.current = false;
        return;
      }

      const path = queueRef.current[indexRef.current];
      // Skip markdown files during the main processing loop, they are handled by syncProjectDocs
      if (todoFileNames.includes(path)) {
        dispatch({
          type: 'LOG',
          payload: {
            id: uuidv4(),
            message: `Skipping documentation file (handled by chronicler): ${path}`,
            type: 'info',
            timestamp: new Date().toLocaleString()
          }
        });
        indexRef.current++;
        localStorage.setItem(`${appConfig.LOCAL_STORAGE_PREFIX}index`, indexRef.current.toString());
        dispatch({
          type: 'UPDATE_METRICS',
          payload: {
            progress: Math.round((indexRef.current / queueRef.current.length) * 100)
          }
        });
        isBusy.current = false;
        return;
      }


      dispatch({
        type: 'SET_STATUS',
        value: 'REFACTORING',
        path
      });
      dispatch({
        type: 'SET_SIGNAL',
        signalKey: 'github_fetch_file_start',
        signalValue: true
      }); // Signal: GitHub File Fetch Start

      // Fetch the file content from GitHub
      const {
        data: fileContentData
      } = await github.repos.getContents(owner, repoName, path);
      const fileContent = base64Decode(fileContentData.content); // Use robust decoder
      dispatch({
        type: 'SET_SIGNAL',
        signalKey: 'github_fetch_file_success',
        signalValue: true
      }); // Signal: GitHub File Fetch Success

      let geminiResponse;
      let retryCount = 0;
      let geminiSuccess = false;

      const pipeline = getPipeline(path);
      const currentStep = pipeline[0]; // Assuming only one step per file type for now
      const systemPrompt = currentStep.prompt;
      const fileExtension = path.split('.').pop();

      while (!geminiSuccess && retryCount < appConfig.MAX_API_RETRIES) {
        const geminiKey = getNextKey(); // Get a key, handles health checks
        dispatch({
          type: 'SET_SIGNAL',
          signalKey: 'gemini_api_call_start',
          signalValue: true
        }); // Signal: Gemini API Call Start

        try {
          geminiResponse = await axios.post(
            `${appConfig.GEMINI_API_BASE}/models/${state.selectedModel}:generateContent`, {
              contents: [{
                parts: [{
                  text: `${systemPrompt}\n\nCODE START:\n\`\`\`${fileExtension}\n${fileContent}\n\`\`\`\nCODE END.`
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
          dispatch({
            type: 'SET_SIGNAL',
            signalKey: 'gemini_api_call_success',
            signalValue: true
          }); // Signal: Gemini API Call Success
          dispatch({
            type: 'UPDATE_METRICS',
            payload: {
              steps: state.metrics.steps + 1
            }
          });
        } catch (e) {
          dispatch({
            type: 'SET_SIGNAL',
            signalKey: 'gemini_api_call_failure',
            signalValue: true
          }); // Signal: Gemini API Call Failure
          if (e.response && (e.response.status === appConfig.RATE_LIMIT_STATUS_CODE || e.response.status === 403) && retryCount < appConfig.MAX_API_RETRIES - 1) {
            const delay = calculateBackoffDelay(retryCount);
            dispatch({
              type: 'LOG',
              payload: {
                id: uuidv4(),
                message: `Gemini API rate limit/error (${e.response.status}). Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${appConfig.MAX_API_RETRIES})`,
                type: 'warn',
                timestamp: new Date().toLocaleString()
              }
            });
            dispatch({
              type: 'MARK_KEY_HEALTH',
              index: geminiKeyIndexRef.current,
              blocked: true,
              resetAt: Date.now() + delay
            });
            await new Promise(resolve => setTimeout(resolve, delay));
            retryCount++;
          } else {
            throw new ApiError("Gemini API call failed after retries.", e.response?.status || 500, e);
          }
        } finally {
          dispatch({
            type: 'SET_SIGNAL',
            signalKey: 'gemini_api_call_start',
            signalValue: false
          }); // Signal: Gemini API Call End
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
      const codeEndIndex = generatedText.toLowerCase().indexOf("full log");
      let newCode = generatedText;
      let changeLog = "No detailed log provided by AI.";

      if (codeEndIndex !== -1) {
        newCode = generatedText.substring(0, codeEndIndex).trim();
        changeLog = generatedText.substring(codeEndIndex).trim();
      }

      // Clean up common LLM code block wrappers
      newCode = newCode
        .replace(/^```\w*\n/i, '')
        .replace(/\n```$/i, '')
        .trim();

      // Simple diff check (more robust diffing would be ideal)
      if (newCode.trim() !== fileContent.trim()) {
        dispatch({
          type: 'SET_SIGNAL',
          signalKey: 'github_update_file_start',
          signalValue: true
        }); // Signal: GitHub Update File Start
        await github.repos.updateContents(owner, repoName, path, {
          message: `[Refactor] Optimize and refactor ${path} - Pass ${state.currentCycle}`,
          content: base64Encode(newCode), // Use robust encoder
          sha: fileContentData.sha // Use original SHA for update
        });
        mutationsHistory.current.push({
          path,
          change: changeLog.split('\n')[0] || "Code refactored and optimized."
        });
        dispatch({
          type: 'UPDATE_METRICS',
          payload: {
            mutations: state.metrics.mutations + 1
          }
        });
        dispatch({
          type: 'LOG',
          payload: {
            id: uuidv4(),
            message: `Refactored: ${path}`,
            type: 'success',
            timestamp: new Date().toLocaleString()
          }
        });
        dispatch({
          type: 'SET_SIGNAL',
          signalKey: 'github_update_file_success',
          signalValue: true
        }); // Signal: GitHub Update File Success
      } else {
        dispatch({
          type: 'LOG',
          payload: {
            id: uuidv4(),
            message: `No significant changes for: ${path}`,
            type: 'info',
            timestamp: new Date().toLocaleString()
          }
        });
      }

    } catch (e) {
      dispatch({
        type: 'LOG',
        payload: {
          id: uuidv4(),
          message: `Error in runCycle for ${state.activePath}: ${e.message}`,
          type: 'error',
          timestamp: new Date().toLocaleString()
        }
      });
      new LoggingError(`Error during runCycle for ${state.activePath}: ${e.message}`, e.statusCode || 500, e); // Use LoggingError
      dispatch({
        type: 'UPDATE_METRICS',
        payload: {
          errors: state.metrics.errors + 1
        }
      });
      // Reset signals in case of error
      dispatch({
        type: 'SET_SIGNAL',
        signalKey: 'github_indexing_start',
        signalValue: false
      });
      dispatch({
        type: 'SET_SIGNAL',
        signalKey: 'github_fetch_file_start',
        signalValue: false
      });
      dispatch({
        type: 'SET_SIGNAL',
        signalKey: 'github_update_file_start',
        signalValue: false
      });
      dispatch({
        type: 'SET_SIGNAL',
        signalKey: 'gemini_api_call_start',
        signalValue: false
      });
      dispatch({
        type: 'SET_STATUS',
        value: 'ERROR'
      }); // Indicate an error state
    } finally {
      indexRef.current++;
      localStorage.setItem(`${appConfig.LOCAL_STORAGE_PREFIX}index`, indexRef.current.toString());
      dispatch({
        type: 'UPDATE_METRICS',
        payload: {
          progress: Math.round((indexRef.current / queueRef.current.length) * 100)
        }
      });
      isBusy.current = false;
    }
  }, [state.isLive, state.isAcknowledged, user, github, state.targetRepo, state.selectedModel, state.metrics.mutations, state.currentCycle, state.metrics.errors, state.metrics.steps, state.activePath, state.isIndexed, dispatch]); // Added dispatch to dependency array


  useEffect(() => {
    const intervalId = setInterval(() => {
      if (state.isLive && state.isAcknowledged && user && github) {
        runCycle();
      }
    }, appConfig.CYCLE_INTERVAL);
    return () => clearInterval(intervalId);
  }, [state.isLive, state.isAcknowledged, user, github, runCycle]);

  // Minimal UI to satisfy "valid React component"
  return (
    <div style={{ fontFamily: 'monospace', padding: '20px', background: '#282c34', color: '#fff' }}>
      <h1>Tri-Model Nexus</h1>
      <p>Status: {state.status}</p>
      <p>Active Path: {state.activePath}</p>
      <p>Cycle: {state.currentCycle}</p>
      <p>Progress: {state.metrics.progress}%</p>
      <p>Mutations: {state.metrics.mutations}</p>
      <p>Steps Taken: {state.metrics.steps}</p>
      <p>Errors: {state.metrics.errors}</p>
      <button onClick={() => dispatch({ type: 'TOGGLE' })} style={{
        padding: '10px 20px',
        fontSize: '16px',
        backgroundColor: state.isLive ? '#ff4d4d' : '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        marginRight: '10px'
      }}>
        {state.isLive ? 'Stop' : 'Start'}
      </button>
      <button onClick={() => {
        dispatch({ type: 'RESET_SESSION' });
        // Also clear local storage for the specific items
        localStorage.removeItem(`${appConfig.LOCAL_STORAGE_PREFIX}targetRepo`);
        localStorage.removeItem(`${appConfig.LOCAL_STORAGE_PREFIX}selectedModel`);
        localStorage.removeItem(`${appConfig.LOCAL_STORAGE_PREFIX}index`);
        // Force a re-render by resetting state for user-facing inputs
        // (If not handled by SET_VAL and initial load effect)
        window.location.reload(); // Simple way to clear all volatile state and local storage effects.
      }} style={{
        padding: '10px 20px',
        fontSize: '16px',
        backgroundColor: '#f0ad4e',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
      }}>
        Reset Session
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