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
} from 'firebase/app';
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
} from 'github-api';
import {
  useAuthState
} from 'react-firebase-hooks/auth';

// ============================================================================
// 1. ERROR HANDLING CLASSES
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
// 2. CONFIGURATION & ENVIRONMENT
// ============================================================================

// Configuration settings for the AI and system operations
const appConfig = {
  // Operational timings
  CYCLE_INTERVAL: 6000, // Time in ms between each processing cycle
  MAX_API_RETRIES: 5, // Maximum retries for API calls for Gemini
  GEMINI_INITIAL_BACKOFF_MS: 100, // Initial backoff delay for Gemini API retries
  GEMINI_BACKOFF_MULTIPLIER: 2, // Multiplier for exponential backoff
  GEMINI_MAX_BACKOFF_MS: 5000, // Maximum backoff delay
  RATE_LIMIT_STATUS_CODE: 429, // HTTP status code for rate limiting

  // Model configuration (Gemini models as per README)
  MODELS: [{
    id: 'gemini-2.5-flash-lite-preview-09-2025',
    label: 'Flash Lite (Speed)'
  }, {
    id: 'gemini-2.5-flash-preview-09-2025',
    label: 'Flash 2.5 (Pro)'
  }, {
    id: 'gemini-3-flash-preview-09-2025',
    label: 'Flash 3.0 (Exp)'
  }, ],

  // File processing limits and storage
  MAX_FILE_SIZE_BYTES: Math.pow(10, 6), // Maximum file size to process (1MB)
  LOCAL_STORAGE_PREFIX: 'emg_v86_', // Prefix for localStorage keys
  LOG_HISTORY_LIMIT: 60, // Maximum number of logs to keep in memory

  // API Endpoints
  GITHUB_API_BASE: 'https://api.github.com',
  GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta',
};

// Batch processing configuration
const batchConfig = {
  maxRetries: 5,
  backoffMultiplier: 2,
  initialBackoffMs: 100,
  rateLimitStatusCode: 429,
  batchSize: 100,
  maxBackoffMs: 5000,
  apiEndpoint: 'https://api.sovereign.com/v1/batch', // Example batch API endpoint
};


// Pipeline steps define AI prompts for different file categories
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

// Regular expressions to categorize file types
const fileExtensions = {
  CODE: /\.(js|jsx|ts|tsx|py|html|css|scss|sql|sh|java|go|rs|rb|php|cpp|c|h|kt|swift|dart)$/i,
  CONFIG: /\.(json|yaml|yml|toml|ini)$/i,
  DOCS: /\.(md|txt|rst|adoc|text)$/i,
};

// Patterns to skip specific files or directories during repository indexing
const skipPatterns = [
  /node_modules\//, /\.min\./, /-lock\./, /dist\//, /build\//, /\.git\//, /\.log$/,
  /\/\.\.(?!\/|$)/i, // Skips dot files/directories
  /^\.github\//, // Skips .github directory
  /^\.vscode\//, // Skips .vscode directory
  /\.env(\..*)?$/, // Skips .env files
  /\.DS_Store$/, // Skips macOS specific files
];

// Special documentation files that receive chronicler updates
const todoFileNames = ['.sovereign-instructions.md', 'sovereign-todo.md', 'instructions.md', 'README.md', 'TODO.md'];

// Inlined environment variable loading for React
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
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ============================================================================
// 4. UTILITY FUNCTIONS & MOCK SERVICES
// ============================================================================

/**
 * Calculates exponential backoff delay for Gemini API retries.
 * @param {number} retryCount - The current retry attempt number.
 * @returns {number} The delay in milliseconds.
 */
function calculateGeminiBackoffDelay(retryCount) {
  const baseDelay = appConfig.GEMINI_INITIAL_BACKOFF_MS * Math.pow(appConfig.GEMINI_BACKOFF_MULTIPLIER, retryCount);
  return Math.min(baseDelay, appConfig.GEMINI_MAX_BACKOFF_MS);
}

/**
 * Calculates exponential backoff delay for general batch API retries.
 * @param {number} retryCount - The current retry attempt number.
 * @returns {number} The delay in milliseconds.
 */
function calculateBatchBackoffDelay(retryCount) {
  const baseDelay = batchConfig.initialBackoffMs * Math.pow(batchConfig.backoffMultiplier, retryCount);
  return Math.min(baseDelay, batchConfig.maxBackoffMs);
}

/**
 * Decodes a base64 string to a UTF-8 string.
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
    return '';
  }
};

/**
 * Encodes a UTF-8 string to a base64 string.
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
    return '';
  }
};

/**
 * Parses a GitHub repository path from various URL formats.
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
 * Determines the processing pipeline for a given file path based on its extension.
 * @param {string} filePath - The path of the file.
 * @returns {Array} The pipeline steps (e.g., CODE, CONFIG, DOCS).
 */
const getPipeline = (filePath) => {
  if (fileExtensions.CONFIG.test(filePath)) return pipelineSteps.CONFIG;
  if (fileExtensions.DOCS.test(filePath)) return pipelineSteps.DOCS;
  return pipelineSteps.CODE; // Default to CODE pipeline
};

/**
 * MOCK SERVICE: Simulates sending a batch of items to an API.
 */
class ApiService {
  async sendBatch(batch) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 40)); // Simulate network latency

    if (Math.random() < 0.3) { // Simulate transient API failures
      const isRateLimited = Math.random() < 0.1;
      const statusCode = isRateLimited ? batchConfig.rateLimitStatusCode : 503;

      throw new ApiError(
        `API request failed with status ${statusCode}`,
        statusCode, {
          endpoint: batchConfig.apiEndpoint,
          batchSize: batch.length
        },
      );
    }

    return {
      success: true,
      processedCount: batch.length
    };
  }
}
const apiServiceInstance = new ApiService(); // Singleton instance

// ============================================================================
// 5. STATE MANAGEMENT (Reducer and Core State - Enhanced with Logic Analyzer)
// ============================================================================

// Main Application State
const initialState = {
  isLive: false, // Indicates if the AI loop is active
  isAcknowledged: false, // Firebase authentication status
  isIndexed: false, // Flag: current target repo files have been indexed
  isComplete: false, // Flag: all cycles completed (if single pass)
  status: 'IDLE', // Current operational status (e.g., IDLE, INDEXING, REFACTORING)
  activePath: 'Ready', // Path of the file currently being processed
  selectedModel: process.env.REACT_APP_ACTIVE_MODEL ?? appConfig.MODELS[0].id, // Active AI model
  targetRepo: process.env.REACT_APP_TARGET_REPO ?? '', // Target GitHub repository
  geminiKeys: Array(10).fill(''), // Array of Gemini API keys
  keyHealth: {}, // Health status of each Gemini key (for rate limiting)
  currentCycle: 1, // Current self-improvement cycle number
  logs: [], // Operational logs
  metrics: { // Performance and activity metrics
    mutations: 0,
    progress: 0,
    steps: 0,
    errors: 0
  },
  logicalSignals: {}, // For visual logic analysis
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_VAL':
      // Persist certain values to local storage
      if (action.key === 'targetRepo') localStorage.setItem(`${appConfig.LOCAL_STORAGE_PREFIX}targetRepo`, action.value);
      if (action.key === 'selectedModel') localStorage.setItem(`${appConfig.LOCAL_STORAGE_PREFIX}selectedModel`, action.value);
      return { ...state,
        [action.key]: action.value
      };
    case 'MARK_KEY_HEALTH':
      // Update Gemini key health status
      return { ...state,
        keyHealth: { ...state.keyHealth,
          [action.index]: {
            blocked: action.blocked,
            resetAt: action.resetAt
          }
        }
      };
    case 'INCREMENT_CYCLE':
      // Advance to the next self-improvement cycle
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
      // Toggle the live status of the AI loop
      return { ...state,
        isLive: !state.isLive,
        status: !state.isLive ? 'BOOTING' : 'IDLE',
        isIndexed: !state.isLive ? false : state.isIndexed, // Reset indexed status when stopping
      };
    case 'LOG':
      // Add a new log entry
      return { ...state,
        logs: [{
          id: uuidv4(),
          ...action.payload
        }, ...state.logs].slice(0, appConfig.LOG_HISTORY_LIMIT)
      };
    case 'UPDATE_METRICS':
      // Update performance metrics
      return { ...state,
        metrics: { ...state.metrics,
          ...action.payload
        }
      };
    case 'SET_STATUS':
      // Update the current operational status
      return { ...state,
        status: action.value,
        activePath: action.path || state.activePath
      };
    case 'SET_SIGNAL':
      // Set a logical signal for the logic analyzer
      return { ...state,
        logicalSignals: { ...state.logicalSignals,
          [action.signalKey]: action.signalValue
        }
      };
    case 'SET_INDEXED':
      // Mark repository indexing status
      return { ...state,
        isIndexed: action.value
      };
    case 'RESET_SESSION':
      // Reset the session to initial state, preserving essential configurations
      return {
        ...initialState,
        targetRepo: localStorage.getItem(`${appConfig.LOCAL_STORAGE_PREFIX}targetRepo`) || process.env.REACT_APP_TARGET_REPO || '',
        selectedModel: localStorage.getItem(`${appConfig.LOCAL_STORAGE_PREFIX}selectedModel`) || process.env.REACT_APP_ACTIVE_MODEL || appConfig.MODELS[0].id,
        geminiKeys: state.geminiKeys,
        isAcknowledged: state.isAcknowledged,
        logicalSignals: {}
      };
    default:
      return state;
  }
};

// Batch Processing State and Reducer
const batchActionTypes = {
  ENQUEUE_ITEMS: 'ENQUEUE_ITEMS',
  START_PROCESSING: 'START_PROCESSING',
  FINISH_PROCESSING: 'FINISH_PROCESSING',
  INCREMENT_SUCCESS: 'INCREMENT_SUCCESS',
  INCREMENT_FAILURE: 'INCREMENT_FAILURE',
  CLEAR_PROCESSED_QUEUE: 'CLEAR_PROCESSED_QUEUE',
  SET_ITEM_PROCESSED: 'SET_ITEM_PROCESSED',
};

const initialBatchState = {
  queue: [],
  processedCount: 0,
  failedCount: 0,
  isProcessing: false,
};

function batchReducer(state, action) {
  switch (action.type) {
    case batchActionTypes.ENQUEUE_ITEMS:
      return { ...state,
        queue: [...state.queue, ...action.payload]
      };
    case batchActionTypes.CLEAR_PROCESSED_QUEUE:
      return { ...state,
        queue: state.queue.filter((item) => !item.processed)
      };
    case batchActionTypes.START_PROCESSING:
      return { ...state,
        isProcessing: true
      };
    case batchActionTypes.FINISH_PROCESSING:
      return { ...state,
        isProcessing: false
      };
    case batchActionTypes.INCREMENT_SUCCESS:
      return { ...state,
        processedCount: state.processedCount + action.payload
      };
    case batchActionTypes.INCREMENT_FAILURE:
      return { ...state,
        failedCount: state.failedCount + action.payload
      };
    case batchActionTypes.SET_ITEM_PROCESSED:
      return {
        ...state,
        queue: state.queue.map(item =>
          item.id === action.payload.id ? { ...item,
            processed: true
          } : item
        )
      };
    default:
      return state;
  }
}

// ============================================================================
// 6. REACT HOOKS AND COMPONENTS
// ============================================================================

// Hook to load environment variables
const useEnvironment = () => {
  const loadEnvData = useCallback(() => loadEnv(), []);
  return { ...loadEnvData()
  };
};

// Hook to initialize and provide GitHub API client
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
 * React component to display logical signals for debugging/monitoring.
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
  const [batchState, batchDispatch] = useReducer(batchReducer, initialBatchState); // New batch processing reducer
  const [user, loading, error] = useAuthState(getAuth());

  // Refs for managing state that shouldn't trigger re-renders
  const ghTokenRef = useRef('');
  const geminiKeyIndexRef = useRef(0);
  const isBusy = useRef(false); // Prevents overlapping runCycle calls
  const queueRef = useRef([]); // Stores file paths to process
  const indexRef = useRef(0); // Current position in the processing queue
  const mutationsHistory = useRef([]); // Records changes for chronicler documentation

  // Load environment variables using the custom hook
  const {
    REACT_APP_ACTIVE_MODEL,
    REACT_APP_TARGET_REPO,
    REACT_APP_INITIAL_AUTH_TOKEN,
    REACT_APP_GH_TOKEN,
    REACT_APP_GEMINI_KEYS
  } = useEnvironment();

  // Initialize state from environment variables and local storage on mount
  useEffect(() => {
    const storedTargetRepo = localStorage.getItem(`${appConfig.LOCAL_STORAGE_PREFIX}targetRepo`);
    const storedSelectedModel = localStorage.getItem(`${appConfig.LOCAL_STORAGE_PREFIX}selectedModel`);
    const storedIndex = parseInt(localStorage.getItem(`${appConfig.LOCAL_STORAGE_PREFIX}index`) || "0", 10);

    if (storedTargetRepo) {
      dispatch({
        type: 'SET_VAL',
        key: 'targetRepo',
        value: storedTargetRepo
      });
    } else if (REACT_APP_TARGET_REPO) {
      dispatch({
        type: 'SET_VAL',
        key: 'targetRepo',
        value: REACT_APP_TARGET_REPO
      });
    }

    if (storedSelectedModel) {
      dispatch({
        type: 'SET_VAL',
        key: 'selectedModel',
        value: storedSelectedModel
      });
    } else if (REACT_APP_ACTIVE_MODEL) {
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

    indexRef.current = storedIndex; // Restore processing index
  }, [dispatch, REACT_APP_ACTIVE_MODEL, REACT_APP_TARGET_REPO, REACT_APP_GH_TOKEN, REACT_APP_GEMINI_KEYS]);

  // Firebase authentication handling
  useEffect(() => {
    const initAuth = async () => {
      if (!loading && !user && !error) {
        dispatch({
          type: 'SET_SIGNAL',
          signalKey: 'firebase_auth_start',
          signalValue: true
        });
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
          });
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
          });
          new LoggingError(`Firebase Authentication failed: ${authError.message}`, 500, authError);
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
          });
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

  // Function to get the next available Gemini API key, handling health checks
  const getNextKey = () => {
    const validKeys = state.geminiKeys.map((k, i) => ({
      k: k.trim(),
      i
    }));
    const filteredKeys = validKeys.filter(node => node.k !== '');

    if (filteredKeys.length === 0) {
      throw new Error("Cluster Empty: No Gemini API keys provided.");
    }

    for (let i = 0; i < filteredKeys.length; i++) {
      const candidateIndex = (geminiKeyIndexRef.current + i) % filteredKeys.length;
      const keyNode = filteredKeys[candidateIndex];
      const health = state.keyHealth[keyNode.i];

      if (!health?.blocked || health.resetAt < Date.now()) {
        geminiKeyIndexRef.current = (candidateIndex + 1) % filteredKeys.length;
        return keyNode.k;
      }
    }
    throw new Error("Cluster Overheat: All Gemini API keys are blocked or rate-limited.");
  };

  // Initialize GitHub API client
  const github = useGithub(ghTokenRef.current);

  // Function to update project documentation (README, TODO files) with audit logs
  const syncProjectDocs = async (owner, repoName) => {
    if (mutationsHistory.current.length === 0) return; // Only sync if there are mutations
    dispatch({
      type: 'SET_STATUS',
      value: 'CHRONICLING'
    });
    dispatch({
      type: 'SET_SIGNAL',
      signalKey: 'github_sync_start',
      signalValue: true
    });

    try {
      for (const docName of todoFileNames) {
        let currentContentData;
        try {
          currentContentData = await github.repos.getContents(owner, repoName, docName);
        } catch (e) {
          if (e.response && e.response.status === 404) {
            // File doesn't exist, create it with a default header
            currentContentData = {
              content: base64Encode(`# ${docName.replace(/\.md$/, '').replace(/-/g, ' ').toUpperCase()}\n\n`),
              sha: null
            };
            dispatch({
              type: 'LOG',
              payload: {
                id: uuidv4(),
                message: `Creating new document: ${docName}`,
                type: 'info',
                timestamp: new Date().toLocaleString()
              }
            });
          } else {
            throw e;
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

        await github.repos.updateContents(owner, repoName, docName, {
          message: `[Chronicler] Update ${docName} - Pass ${state.currentCycle}`,
          content: base64Encode(content),
          sha: currentContentData.sha
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
      });
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
      });
      new LoggingError(`GitHub Sync failed: ${e.message}`, e.response?.status || 500, e);
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
      });
    }
    mutationsHistory.current = []; // Clear history after sync
  };


  // Core batch processing logic (useCallback for stability)
  const flushBatch = useCallback(async () => {
    if (batchState.isProcessing || batchState.queue.length === 0) return;

    batchDispatch({
      type: batchActionTypes.START_PROCESSING
    });
    console.log(`[BATCHER] Starting flush for ${batchState.queue.length} items.`);

    let workingQueueItems = batchState.queue.filter((item) => !item.processed);
    let totalSuccessfulItems = 0;
    let totalFailedItems = 0;

    const processChunk = async (batch) => {
      let retryCount = 0;
      let chunkHandled = false;

      while (!chunkHandled && retryCount < batchConfig.maxRetries) {
        try {
          await apiServiceInstance.sendBatch(batch);
          totalSuccessfulItems += batch.length;
          batch.forEach(item => batchDispatch({
            type: batchActionTypes.SET_ITEM_PROCESSED,
            payload: {
              id: item.id
            }
          }));
          chunkHandled = true;
          console.log(`[BATCHER] Chunk processed successfully. Size: ${batch.length}`);
        } catch (error) {
          if (error instanceof ApiError && error.statusCode === batchConfig.rateLimitStatusCode && retryCount < batchConfig.maxRetries - 1) {
            const delay = calculateBatchBackoffDelay(retryCount);
            console.warn(`[BATCHER] Rate limit hit. Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${batchConfig.maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            retryCount++;
          } else {
            const reason = error instanceof ApiError ? `Max retries reached or permanent error (${error.statusCode || 'Unknown'})` : `Unexpected error: ${error.message}`;
            console.error(`[BATCHER] Chunk failed (${reason}). Size: ${batch.length}.`);
            totalFailedItems += batch.length;
            batch.forEach(item => batchDispatch({ // Mark as processed/failed
              type: batchActionTypes.SET_ITEM_PROCESSED,
              payload: {
                id: item.id
              }
            }));
            chunkHandled = true;
          }
        }
      }
    };

    while (workingQueueItems.length > 0) {
      const batchData = workingQueueItems.slice(0, batchConfig.batchSize);
      await processChunk(batchData);
      // After processing a chunk, re-filter the queue to get remaining unprocessed items
      workingQueueItems = batchState.queue.filter(item => !item.processed);
    }

    if (totalSuccessfulItems > 0) {
      batchDispatch({
        type: batchActionTypes.INCREMENT_SUCCESS,
        payload: totalSuccessfulItems
      });
    }
    if (totalFailedItems > 0) {
      batchDispatch({
        type: batchActionTypes.INCREMENT_FAILURE,
        payload: totalFailedItems
      });
    }

    batchDispatch({
      type: batchActionTypes.CLEAR_PROCESSED_QUEUE
    });
    batchDispatch({
      type: batchActionTypes.FINISH_PROCESSING
    });
    console.log(`[BATCHER] Flush complete. Successful: ${totalSuccessfulItems}, Failed: ${totalFailedItems}. Remaining in queue (unprocessed): ${batchState.queue.filter(item => !item.processed).length}`);
  }, [batchState.isProcessing, batchState.queue, batchDispatch]);


  // Effect to trigger batch flush when queue size changes or periodically
  useEffect(() => {
    // Only trigger flush if not already processing and there are items in the queue
    if (!batchState.isProcessing && batchState.queue.length > 0) {
      const timer = setTimeout(() => {
        flushBatch();
      }, 500); // Small delay to allow more items to accumulate before flushing
      return () => clearTimeout(timer);
    }
  }, [batchState.queue.length, batchState.isProcessing, flushBatch]);


  // The main self-improvement loop cycle
  const runCycle = useCallback(async () => {
    if (!state.isLive || isBusy.current || !user || !github || !state.isAcknowledged) {
      return;
    }
    isBusy.current = true; // Set busy flag to prevent concurrent runs

    try {
      const parsedRepo = parseRepoPath(state.targetRepo);
      if (!parsedRepo) {
        throw new Error("Invalid target repository format. Use 'owner/repo'.");
      }
      const [owner, repoName] = parsedRepo;

      // Stage 1: Indexing the repository if not already indexed for the current cycle
      if (!state.isIndexed || queueRef.current.length === 0) {
        dispatch({
          type: 'SET_STATUS',
          value: 'INDEXING'
        });
        dispatch({
          type: 'SET_SIGNAL',
          signalKey: 'github_indexing_start',
          signalValue: true
        });

        const {
          data
        } = await github.repos.get(owner, repoName);
        const {
          data: treeData
        } = await github.repos.getTree(owner, repoName, data.default_branch, {
          recursive: true
        });

        const filteredFiles = treeData.tree.filter(f =>
          f.type === 'blob' &&
          f.size < appConfig.MAX_FILE_SIZE_BYTES &&
          !skipPatterns.some(pattern => pattern.test(f.path))
        ).map(f => f.path);

        queueRef.current = filteredFiles;
        localStorage.setItem(`${appConfig.LOCAL_STORAGE_PREFIX}index`, "0");
        indexRef.current = 0;
        dispatch({
          type: 'SET_INDEXED',
          value: true
        });
        dispatch({
          type: 'SET_SIGNAL',
          signalKey: 'github_indexing_success',
          signalValue: true
        });
        dispatch({
          type: 'LOG',
          payload: {
            id: uuidv4(),
            message: `Indexed ${filteredFiles.length} files. Starting processing.`,
            timestamp: new Date().toLocaleString()
          }
        });
      }

      // Stage 2: Cycle completion check and chronicler sync
      if (indexRef.current >= queueRef.current.length) {
        await syncProjectDocs(owner, repoName); // Update README/TODO
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
        isBusy.current = false;
        return;
      }

      // Stage 3: Process the next file in the queue
      const path = queueRef.current[indexRef.current];
      // Skip markdown files here as they are handled by chronicler (syncProjectDocs)
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
      });

      // Fetch the file content from GitHub
      const {
        data: fileContentData
      } = await github.repos.getContents(owner, repoName, path);
      const fileContent = base64Decode(fileContentData.content);
      dispatch({
        type: 'SET_SIGNAL',
        signalKey: 'github_fetch_file_success',
        signalValue: true
      });

      let geminiResponse;
      let retryCount = 0;
      let geminiSuccess = false;

      const pipeline = getPipeline(path);
      const currentStep = pipeline[0];
      const systemPrompt = currentStep.prompt;
      const fileExtension = path.split('.').pop();

      // Stage 4: Call Gemini API with retries and key rotation
      while (!geminiSuccess && retryCount < appConfig.MAX_API_RETRIES) {
        const geminiKey = getNextKey();
        dispatch({
          type: 'SET_SIGNAL',
          signalKey: 'gemini_api_call_start',
          signalValue: true
        });

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
          });
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
          });
          if (e.response && (e.response.status === appConfig.RATE_LIMIT_STATUS_CODE || e.response.status === 403) && retryCount < appConfig.MAX_API_RETRIES - 1) {
            const delay = calculateGeminiBackoffDelay(retryCount);
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
          });
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

      // Extract code and log from Gemini's response
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

      // Stage 5: Update GitHub if code has changed
      if (newCode.trim() !== fileContent.trim()) {
        dispatch({
          type: 'SET_SIGNAL',
          signalKey: 'github_update_file_start',
          signalValue: true
        });
        await github.repos.updateContents(owner, repoName, path, {
          message: `[Refactor] Optimize and refactor ${path} - Pass ${state.currentCycle}`,
          content: base64Encode(newCode),
          sha: fileContentData.sha
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
        });
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
      new LoggingError(`Error during runCycle for ${state.activePath}: ${e.message}`, e.statusCode || 500, e);
      dispatch({
        type: 'UPDATE_METRICS',
        payload: {
          errors: state.metrics.errors + 1
        }
      });
      // Reset signals in case of error for cleaner visualization
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
      });
    } finally {
      // Advance to the next file and update progress
      indexRef.current++;
      localStorage.setItem(`${appConfig.LOCAL_STORAGE_PREFIX}index`, indexRef.current.toString());
      dispatch({
        type: 'UPDATE_METRICS',
        payload: {
          progress: Math.round((indexRef.current / queueRef.current.length) * 100)
        }
      });
      isBusy.current = false; // Release busy flag
    }
  }, [state.isLive, state.isAcknowledged, user, github, state.targetRepo, state.selectedModel, state.metrics.mutations, state.currentCycle, state.metrics.errors, state.metrics.steps, state.activePath, state.isIndexed, dispatch, state.keyHealth]);


  // Effect to trigger runCycle at a fixed interval when live
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (state.isLive && state.isAcknowledged && user && github) {
        runCycle();
      }
    }, appConfig.CYCLE_INTERVAL);
    return () => clearInterval(intervalId);
  }, [state.isLive, state.isAcknowledged, user, github, runCycle]);

  const handleEnqueueBatchItems = () => {
    const itemCount = Math.floor(Math.random() * 50) + 10;
    const newItems = Array.from({
      length: itemCount
    }, (_, i) => ({
      id: uuidv4(),
      content: `Batch item ${Date.now()}-${i}`,
      processed: false
    }));
    batchDispatch({
      type: batchActionTypes.ENQUEUE_ITEMS,
      payload: newItems
    });
    console.log(`Enqueued ${itemCount} batch items.`);
  };


  // Main UI rendering
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

      <div style={{ marginTop: '20px', borderTop: '1px solid #61dafb', paddingTop: '10px' }}>
        <h3>Batch Processing Status</h3>
        <p>Queue Size: {batchState.queue.filter(item => !item.processed).length}</p>
        <p>Currently Processing: {batchState.isProcessing ? 'Yes' : 'No'}</p>
        <p>Successful Batches: {batchState.processedCount}</p>
        <p>Failed Batches: {batchState.failedCount}</p>
        <button onClick={handleEnqueueBatchItems} style={{
          padding: '8px 15px',
          fontSize: '14px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Enqueue Random Batch Items
        </button>
      </div>

      <SignalDisplay signals={state.logicalSignals} />
    </div>
  );
};

export default App;