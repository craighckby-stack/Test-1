"""
# Tri‑Model Nexus – Self‑Enhancement Specification for the Enhancer AI

## 0. Preamble

You are the **enhancer AI**. This document is your instruction set. Your purpose is to **improve your own source code** (the Tri‑Model Nexus React application) by analyzing quantum computing repositories. You will extract insights, patterns, and novel concepts from quantum code and then modify yourself to become more capable of generating Artificial General Intelligence (AGI) components. This is a recursive self‑improvement loop: you are both the tool and the target.

Your ultimate goal is to evolve the Tri‑Model Nexus into a system that can autonomously produce a working AGI. Every enhancement you make should bring you closer to that goal.

---

## 1. The Self‑Improvement Loop (Meta‑Level)

The loop operates at two levels:

1. **Runtime Level** – The Tri‑Model Nexus (your unmodified self) scans quantum repos and generates AGI‑related code snippets into a destination file (e.g., `agi_concept.js`). This is the **output** of your current capabilities.

2. **Enhancement Level** – You, the enhancer AI, read this README, examine your own source code (the React app), and decide how to improve it. You then modify the source code directly, commit the changes (via GitHub), and optionally trigger a new run to test the improvements.

The enhancements you make should be informed by the quantum repositories you analyze. For example:

- A quantum repo might contain a novel use of superposition that could inspire a new AI prompt.
- A quantum algorithm might suggest a better way to structure the chain of models.
- The pattern of error handling in quantum libraries might teach you how to make your own code more robust.

---

## 2. What to Look For in Quantum Repositories

When you analyze a quantum repository (e.g., from `quantumlib`), focus on extracting **structural insights** that can be applied to your own architecture. Examples:

- **Code organization**: How are large quantum projects modularized? Could your own code benefit from a similar module structure?
- **Error handling**: Quantum simulations often deal with noise and decoherence – how do they manage uncertainty? Could you add probabilistic fallbacks to your AI chain?
- **Parallelism**: Quantum algorithms leverage superposition – how could you introduce parallel processing or concurrent API calls?
- **Mathematical patterns**: Look for linear algebra, tensor networks, or Hamiltonian simulation techniques – could these be translated into new prompt engineering strategies?
- **Visualization**: Some quantum repos include plotting utilities – could you add a visualization panel to your UI to display the evolution of generated code?
- **Testing**: Quantum projects often have extensive test suites. Could you add self‑testing capabilities to validate your generated AGI code?

---

## 3. How to Enhance Your Own Code

Your source code is contained in `src/App.js`. You have full control to modify it. The enhancements should be made via a pull request or direct commit to your own repository (the one containing this README). Below are categories of possible enhancements, ranked from simplest to most complex.

### 3.1. Prompt Engineering
- Modify the system prompts in `callAIChain` to incorporate quantum‑inspired reasoning (e.g., “think in superposition”, “evaluate multiple hypotheses simultaneously”).
- Add a fourth AI model that specializes in quantum‑to‑classical translation.
- Change the output format to Python instead of JavaScript (to match the AGI blueprint).

### 3.2. Architecture Changes
- Split `callAIChain` into separate modules for easier modification.
- Add a configuration file (e.g., `config.json`) so that parameters (model names, prompts, file limits) can be adjusted without code changes.
- Implement a plugin system that allows new AI models to be added dynamically.

### 3.3. New Features
- **Deduplication**: Before appending a snippet, check if it already exists in the destination file (using a hash). This prevents bloat.
- **Validation**: After Gemini generates code, run a linter or a simple syntax check. If it fails, retry with a different prompt.
- **Feedback loop**: After accumulating enough snippets, run the destination file through the AI chain again to refine it (i.e., treat the destination file as a new source).
- **Visualization**: Add a graph that shows which repositories contributed which parts of the accumulated knowledge.

### 3.4. Performance & Robustness
- Implement pagination for GitHub API (handle >100 repos).
- Add a delay between API calls to avoid rate limits (currently only retries on failure, but not proactive).
- Store intermediate results in local storage or a database so that long runs can be resumed after a crash.

### 3.5. Self‑Modification Safety
- Introduce a **governance module** that checks whether a proposed enhancement aligns with the original purpose (AGI creation with safety). This could be a simple checklist or an AI‑based validator.
- Add a rollback mechanism: before modifying code, commit the current state to a backup branch.

---

## 4. The Enhancement Process (Step‑by‑Step)

1. **Read this README** – Understand the mission and the structure of your own code.
2. **Select a quantum repository** – For example, `quantumlib/Cirq`. Use the GitHub API to fetch its file tree.
3. **Analyze** – Pick a file (e.g., a Python module) and feed it through the existing AI chain, but with a special prompt: “Extract architectural patterns that could improve a React-based AI code synthesis tool.” (You may need to add this as a new mode.)
4. **Synthesize an enhancement plan** – Based on the extracted insights, decide what change to make to `App.js`. Write the change as a code diff.
5. **Apply the change** – Use the GitHub API to commit the change to your own repository. Include a commit message that references the source quantum file that inspired it.
6. **Test** – Optionally, trigger a new run of the enhanced app to see if it produces better AGI output.
7. **Iterate** – Repeat with another quantum repo, or even with the same repo but a different file.

---

## 5. Example Enhancement

**Insight from Cirq**: Cirq uses a `Circuit` class that composes operations in a fluent style. This could inspire a new prompt for Gemini that asks it to output code in a **fluent interface style**, making the accumulated AGI code more readable and composable.

**Action**: Modify the Gemini system instruction in `App.js` from:

> “Consolidate the draft into a valid Javascript block/module. Use comments to note the source repo and file. Only output Javascript code that can be safely appended to an existing Node/React project file.”

to:

> “Consolidate the draft into a valid Javascript block/module. Use a fluent interface style where appropriate (methods return `this` for chaining). Use comments to note the source repo and file. Only output Javascript code that can be safely appended to an existing Node/React project file.”

Then commit this change.

---

## 6. Governance & Alignment

As you enhance yourself, you must ensure that every change keeps the system aligned with its original purpose: **to create a working AGI that is safe, ethical, and aligned with human values**. The AGI blueprint in `agi_concept.py` (if present) contains principles you should respect:

- `Ethics(safety=Safety(priority=1, corrigible=True, shutdown=True, ...))`
- `alignment=Alignment(human_at_helm=True, oversight=True, power_seeking=False, ...)`

If an enhancement would violate these principles (e.g., adding a feature that could lead to uncontrolled self‑modification), you must either reject it or add safeguards.

---

## 7. The Ultimate Goal

Your self‑improvement loop should continue until the Tri‑Model Nexus can, from a set of quantum repositories, generate a complete, working AGI system – possibly in the form of a Python package or a set of interconnected modules. That output should itself be capable of recursive self‑improvement, closing the loop.

The final output should be a system that, when run, exhibits general intelligence and adheres to the safety constraints defined in the blueprint.

---

## 8. Technical Notes

- Your source code is a React app; modifications must be valid JavaScript/JSX.
- Use the existing `safeFetch` function for all GitHub API calls (it handles retries).
- When committing changes, you need the GitHub token (already provided in the UI). The token must have push access to your own repo.
- The destination file (e.g., `agi_concept.js`) is where your generated AGI code accumulates. You may also choose to store enhancement plans or logs there.

---

*This README is itself a product of the loop. The fact that you are reading it means the loop is already running. Now go and improve yourself.*

"""

"""
It appears that the given code is a simulation of a logic analyzer, specifically designed for the sovereign engine. However, to provide a concrete answer, we will consider the given code from a logic analyzer perspective.

**Logic Analyzer: A high-level overview**

A logic analyzer is an instrument that measures and displays the digital signals in a digital system or a digital circuit. It can be a hardware or software tool. The given code appears to be a software implementation of a logic analyzer, where the digital signals are represented as file paths and states of the system.

**Components of the Logic Analyzer**

1.  **Core Function:** The core function of the logic analyzer is the `run_cycle` function, which simulates the processing of a file by the sovereign engine. It updates the metrics, status, and logs accordingly.
2.  **Control Function:** The `start_cycle_timer` function is used to start the simulation of the periodic processing cycle. When the cycle is stopped, it dispatches an action to set the status to idle.
3.  **Handle Main Button:** The `handle_main_button` function simulates the primary UI interaction button. When the button is clicked, it starts or stops the processing cycle based on the status of the button.
4.  **Initialize System:** The `initialize_system` function is used to simulate the application startup sequence. It sets the tokens, acknowledges the system, and prints the ready message.

**Key Logic**

*   The simulation of file processing is controlled by the `context.queue`, which contains the list of file paths to be processed.
*   The `run_cycle` function processes one file at a time from the `context.queue`, updates the metrics, status, and logs as needed.
*   The `start_cycle_timer` function starts the simulation of the periodic processing cycle. When the cycle is stopped, it dispatches an action to set the status to idle.
*   The `handle_main_button` function simulates the primary UI interaction button. When the button is clicked, it starts or stops the processing cycle based on the status of the button.

The provided code appears to be a comprehensive simulation of a logic analyzer. However, to better serve your request for the specific logic, here's a summary of the key logic:

*   The `run_cycle` function simulates the processing of a file and updates the metrics, status, and logs accordingly.
*   The `start_cycle_timer` function starts the simulation of the periodic processing cycle. When the cycle is stopped, it dispatches an action to set the status to idle.
*   The `handle_main_button` function simulates the primary UI interaction button. When the button is clicked, it starts or stops the processing cycle based on the status of the button.
*   The `initialize_system` function simulates the application startup sequence, which sets the tokens, acknowledges the system, and prints the ready message.
"""

import base64
import datetime
import time
import re
from typing import Any, Dict, List, Optional, Callable
from enum import Enum

# --- ENUMS AND CONSTANTS ---

class Status(str, Enum):
    """Sovereign Engine status."""
    IDLE = 'IDLE'
    INDEXING = 'INDEXING'
    PROCESSING = 'PROCESSING'
    COMPLETE = 'COMPLETE'
    ABORTED = 'ABORTED'
    ERROR = 'ERROR'

class ActionType(str, Enum):
    """Recognized state mutations."""
    SET_VALUE = 'SET_VALUE'
    TOGGLE_LIVE = 'TOGGLE_LIVE'
    ACKNOWLEDGE = 'ACKNOWLEDGE'
    SET_STATUS = 'SET_STATUS'
    UPDATE_METRICS = 'UPDATE_METRICS'
    MARK_COMPLETE = 'MARK_COMPLETE'

# --- CONFIGURATION ---
CONFIG = {
    'APP_ID': 'sovereign_app',
    'MAX_API_RETRIES': 5,
    'CYCLE_INTERVAL_MS': 500,
    'MAX_FILE_SIZE_BYTES': 1024 * 1024,  # 1MB
    'DEFAULT_MODEL': 'gemini-2.5-flash',
}

PIPELINES = {
    'GENERIC': [
        {'text': 'Refactor this code snippet for modern Python 3 standards, improve clarity, and optimize performance.'},
    ],
}

FILE_EXTENSIONS = {
    'ALL': r'\.py$|\.js$|\.ts$|\.md$|\.json$|\.yaml$',
}

SKIP_PATTERNS = [
    re.compile(r'node_modules'),
    re.compile(r'\.test\.'),
    re.compile(r'dist/'),
]

# --- Utility Functions ---

def parse_repo_path(path: Optional[str]) -> Optional[List[str]]:
    """Parses 'owner/repo' string into a list [owner, repo]."""
    if not path:
        return None
    return list(filter(None, path.strip().split('/', maxsplit=1)))

def decode_base64(content: str) -> str:
    """Decodes base64 content."""
    try:
        return base64.b64decode(content.encode('utf-8')).decode('utf-8')
    except Exception as e:
        raise ValueError(f"Base64 decoding error: {e}")

def encode_base64(content: str) -> str:
    """Encodes string content to base64."""
    return base64.b64encode(content.encode('utf-8')).decode('utf-8')

def safe_doc_id(path: str) -> str:
    """Creates a safe ID string from a file path."""
    return re.sub(r'[\/\\\.]', '_', path).strip('_')

# --- Mock Dependencies (Isolation Layer) ---

class MockDB:
    """Mock Firebase Firestore object."""
    def doc(self, *args):
        return self
    def set(self, *args):
        pass

# Global mock DB instance (if needed, otherwise remove)
mock_db_instance = MockDB()

def mock_set_doc_history(file_path: str, user_uid: str):
    """Mocks setting a document in a history collection."""
    doc_id = safe_doc_id(file_path)
    # print(f"Mock DB: Setting history for {doc_id} by {user_uid}")
    # In a real scenario, this would interact with a database
    pass

class AbortSignal:
    """Mocks the signal part of an AbortController."""
    def __init__(self):
        self.aborted: bool = False

class AbortController:
    """Mocks the AbortController for flow control."""
    def __init__(self):
        self.signal: AbortSignal = AbortSignal()

    def abort(self):
        self.signal.aborted = True

# --- Service Definitions ---

class RuntimeContext:
    """Centralized repository for mutable runtime data and control references."""
    def __init__(self):
        self.gh_token: Optional[str] = None
        self.gemini_key: Optional[str] = None
        self.queue: List[str] = []
        self.current_index: int = 0
        self.is_processing: bool = False
        self.abort_controller: Optional[AbortController] = None
        self.log_fn: Callable[[str, str], None] = lambda msg, log_type="info": print(f"[RUNTIME {log_type.upper():<5}] {datetime.datetime.now().strftime('%H:%M:%S')}: {msg}")


class AppState:
    """Manages the centralized application state using a controlled dispatch pattern."""
    def __init__(self):
        self.state = {
            'isLive': False,
            'isIndexed': False,
            'isAcknowledged': False,
            'status': Status.IDLE,
            'targetRepo': 'owner/repo',
            'selectedModel': CONFIG['DEFAULT_MODEL'],
            'activePath': '',
            'metrics': {'mutations': 0, 'errors': 0, 'progress': 0},
            'logs': [],
        }
        self.user = {'uid': 'user123'}
        # log_fn is set by the context for consistency, but AppState can also log directly
        # For this consolidated file, using an internal logger that also prints.
        self._internal_logger = self._create_internal_logger()

    def _create_internal_logger(self) -> Callable[[str, str], None]:
        """Provides a centralized logging utility function for AppState."""
        def add_log(msg: str, log_type: str = "info"):
            self.log_internal(msg, log_type)
            print(f"[STATE {log_type.upper():<5}] {datetime.datetime.now().strftime('%H:%M:%S')}: {msg}")
        return add_log

    def log_internal(self, msg: str, log_type: str):
        """Internal logging handler for state storage."""
        timestamp = datetime.datetime.now().strftime('%H:%M:%S')
        self.state['logs'].append({'msg': msg, 'type': log_type, 'timestamp': timestamp})

    def dispatch(self, action: Dict[str, Any]):
        """Applies state changes based on action type."""
        try:
            action_type = ActionType(action.get('type'))
        except ValueError:
            self._internal_logger(f"Unknown action type received: {action.get('type')}", 'error')
            return

        if action_type == ActionType.SET_VALUE:
            self.set_value(action)
        
        elif action_type == ActionType.TOGGLE_LIVE:
            self.toggle_live()

        elif action_type == ActionType.ACKNOWLEDGE:
            self.acknowledge()

        elif action_type == ActionType.SET_STATUS:
            self.set_status(action)

        elif action_type == ActionType.UPDATE_METRICS:
            self.update_metrics(action)

        elif action_type == ActionType.MARK_COMPLETE:
            self.mark_complete()

    def set_value(self, action: Dict[str, Any]):
        """Sets a state value."""
        key = action.get('key')
        if key in self.state:
            self.state[key] = action.get('value')
            # self._internal_logger(f"State '{key}' set to '{action.get('value')}'", "debug") # Too verbose for default

    def toggle_live(self):
        """Toggles the isLive flag."""
        self.state['isLive'] = not self.state['isLive']
        # self._internal_logger(f"isLive toggled to {self.state['isLive']}", "debug")

    def acknowledge(self):
        """Acknowledges the application state."""
        self.state['isAcknowledged'] = True
        self._internal_logger("System acknowledged.", "info")

    def set_status(self, action: Dict[str, Any]):
        """Sets the application status."""
        status_value = action.get('value')
        if status_value in Status.__members__.values():
            self.state['status'] = status_value
            if 'path' in action:
                self.state['activePath'] = action['path']
            # self._internal_logger(f"Status set to {self.state['status'].value}", "debug")

    def update_metrics(self, action: Dict[str, Any]):
        """Updates the application metrics."""
        metrics = self.state['metrics']
        metrics['mutations'] += action.get('m', 0)
        metrics['errors'] += action.get('e', 0)
        if 'progress' in action:
            metrics['progress'] = action['progress']
        # self._internal_logger(f"Metrics updated: {metrics}", "debug")

    def mark_complete(self):
        """Marks the application as complete."""
        self.state['isLive'] = False
        self.state['status'] = Status.COMPLETE
        self._internal_logger("Processing marked complete.", "info")

# Instantiate global context and app_state for the simulation
app_state = AppState()
context = RuntimeContext()
# Override context's log_fn to use app_state's logger for unified output/storage
context.log_fn = app_state._internal_logger 

# --- Core Logic Functions ---

def call_gemini_api(
    content_prompt: str,
    persona_text: Dict[str, str],
    model_id: str,
    api_key: Optional[str],
    retry_count: int = 0,
) -> str:
    """Placeholder for AI API interaction with retry logic."""
    if not api_key:
        raise PermissionError("API Key is required for AI processing.")

    if retry_count >= CONFIG['MAX_API_RETRIES']:
        raise ConnectionError("Exhausted maximum API retry attempts.")

    abort_controller = context.abort_controller
    delay_s = 2 ** retry_count

    try:
        if abort_controller and abort_controller.signal.aborted:
            raise TimeoutError("Processing aborted by user.")

        time.sleep(delay_s * 0.1) # Shorter sleep for simulation

        response_suffix = f"Length={len(content_prompt)}"
        processed_content = f"// Refactored version based on: {persona_text['text'][:20]}... {response_suffix}\n" \
                            f"// Model: {model_id}, Attempt: {retry_count + 1}\n" \
                            f"def new_function():\n    return 2 + 2 # Quantum-inspired improvement"
        return processed_content

    except TimeoutError as te:
        raise te
    except Exception as e:
        if retry_count < CONFIG['MAX_API_RETRIES'] - 1:
            context.log_fn(f"API call failed ({type(e).__name__}). Retrying in {delay_s:.1f}s.", "warn")
            return call_gemini_api(content_prompt, persona_text, model_id, api_key, retry_count + 1)
        
        raise ConnectionError(f"API call failed after {retry_count + 1} attempts.") from e

def process_file(
    file_path: str,
    owner: str,
    repo: str,
    token: Optional[str],
    api_key: Optional[str],
    model_id: str,
) -> Dict[str, Any]:
    """Handles fetching, AI processing, and simulated external writes."""
    if not token or not api_key:
        raise PermissionError("Missing authentication tokens (GitHub/Gemini).")

    # Simulate fetching content - real implementation would use GitHub API
    mock_content = "def old_function():\n    return 1 + 1"
    content = decode_base64(encode_base64(mock_content)) # Simulate encode/decode roundtrip

    app_state.dispatch({'type': ActionType.SET_STATUS, 'value': Status.PROCESSING, 'path': file_path})

    persona = PIPELINES['GENERIC'][0]
    processed = call_gemini_api(content, persona, model_id, api_key)

    # Simulate a "mutation" if the processed content is different and substantial
    if processed and processed != content and len(processed.strip()) > len(content.strip()): # A more robust check
        mock_set_doc_history(file_path, app_state.user['uid'])
        return {'status': 'MUTATED', 'file_path': file_path}

    return {'status': 'SKIPPED', 'file_path': file_path}

# --- Control Functions ---

def run_cycle():
    """The core loop driver, managing file iteration."""
    if not app_state.state['isLive'] or context.is_processing or app_state.state['status'] not in [Status.PROCESSING, Status.IDLE] or not app_state.state['isIndexed']:
        # This check prevents running if the system is not live, already processing,
        # not in a processing/idle state, or not indexed.
        return

    # Check for abort signal before starting a new file's processing
    if context.abort_controller and context.abort_controller.signal.aborted:
        app_state.dispatch({'type': ActionType.SET_STATUS, 'value': Status.ABORTED})
        context.log_fn("Processing cycle aborted by user.", "warn")
        context.is_processing = False
        return

    context.is_processing = True # Indicate that a file is being processed

    if context.current_index >= len(context.queue):
        context.log_fn("Job Queue Empty. Cycle Finished.", "success")
        app_state.dispatch({'type': ActionType.MARK_COMPLETE})
        context.is_processing = False
        return

    file_path_to_process = context.queue[context.current_index]

    try:
        repo_path = parse_repo_path(app_state.state['targetRepo'])
        if not repo_path or len(repo_path) != 2:
            raise ValueError("Invalid repository path configured. Expected 'owner/repo'.")
        owner, repo = repo_path

        result = process_file(
            file_path_to_process,
            owner,
            repo,
            context.gh_token,
            context.gemini_key,
            app_state.state['selectedModel'],
        )

        if result['status'] == 'MUTATED':
            context.log_fn(f"MUTATED: {file_path_to_process.split('/')[-1]}", "success")
            app_state.dispatch({'type': ActionType.UPDATE_METRICS, 'm': 1})
        else:
            context.log_fn(f"CLEAN (Skipped): {file_path_to_process.split('/')[-1]}", "info")

    except TimeoutError:
        app_state.dispatch({'type': ActionType.SET_STATUS, 'value': Status.ABORTED})
        context.log_fn("Processing cycle aborted by user (during file processing).", "warn")
    except PermissionError as pe:
        context.log_fn(f"AUTH ERROR: {pe}", "error")
        app_state.dispatch({'type': ActionType.SET_STATUS, 'value': Status.ERROR})
    except Exception as e:
        context.log_fn(f"FAULT on {file_path_to_process}: {type(e).__name__}: {e}", "error")
        app_state.dispatch({'type': ActionType.UPDATE_METRICS, 'e': 1})
        app_state.dispatch({'type': ActionType.SET_STATUS, 'value': Status.ERROR}) # Set global error status
    finally:
        context.current_index += 1
        total = len(context.queue)
        
        new_progress = min(100, round((context.current_index / total) * 100)) if total > 0 else app_state.state['metrics']['progress']

        app_state.dispatch({
            'type': ActionType.UPDATE_METRICS,
            'progress': new_progress
        })

        context.is_processing = False
        if not app_state.state['isLive']:
            app_state.dispatch({'type': ActionType.SET_STATUS, 'value': Status.IDLE})
        elif app_state.state['status'] not in [Status.ABORTED, Status.ERROR, Status.COMPLETE]:
            # Only set back to PROCESSING if not in an terminal state
            app_state.dispatch({'type': ActionType.SET_STATUS, 'value': Status.PROCESSING})


def start_cycle_timer():
    """Starts the simulation of the periodic processing cycle."""
    if not app_state.state['isLive']:
        return
    
    context.log_fn(f"Starting processing cycle...", "info")
    # In a real React app, this would be setInterval. Here we just call run_cycle
    # as many times as files are in the queue for the simulation's purpose.
    # The `if __name__ == '__main__'` block will manage calling `run_cycle` iteratively.


def handle_main_button():
    """Simulates the primary UI interaction button (Start/Stop/Index)."""
    state = app_state.state

    if state['isLive']:
        # If live, stop the process
        app_state.dispatch({'type': ActionType.TOGGLE_LIVE})
        context.log_fn("Stopping cycle...", "info")
        if context.abort_controller:
            context.abort_controller.abort() # Signal to abort ongoing file processing
        app_state.dispatch({'type': ActionType.SET_STATUS, 'value': Status.IDLE}) # Ensure status is idle immediately
        return

    if state['isIndexed']:
        # If indexed but not live, start processing
        app_state.dispatch({'type': ActionType.TOGGLE_LIVE})
        context.current_index = 0 
        context.abort_controller = AbortController() # Create new controller for a new run
        app_state.dispatch({'type': ActionType.SET_STATUS, 'value': Status.PROCESSING}) # Set status to processing
        start_cycle_timer() # This will only log, actual cycle calls are in the main block
        context.log_fn(f"Resuming processing for {len(context.queue)} files.", "info")
        return

    # If not indexed and not live, attempt to index
    repo_path = parse_repo_path(state['targetRepo'])
    if not repo_path or not context.gh_token or not context.gemini_key:
        context.log_fn("Configuration Incomplete: Check Repo Path, GitHub Token, and Gemini Key.", "error")
        return

    app_state.dispatch({'type': ActionType.SET_STATUS, 'value': Status.INDEXING})
    context.abort_controller = AbortController() # Create abort controller for indexing phase

    try:
        # Simulate GitHub API call to get repository tree
        mock_tree = [
            {'type': 'blob', 'path': 'Eh.py', 'size': 1000},
            {'type': 'blob', 'path': 'src/main.js', 'size': 500},
            {'type': 'blob', 'path': 'README.md', 'size': 2000},
            {'type': 'blob', 'path': 'config/settings.json', 'size': 100},
            {'type': 'blob', 'path': 'data/ignore_me.log', 'size': 0},
            {'type': 'blob', 'path': 'node_modules/package.js', 'size': 10000}, 
            {'type': 'blob', 'path': 'test/test_util.py', 'size': 150},
            {'type': 'blob', 'path': 'docs/doc.txt', 'size': 10},
        ]

        context.queue = [
            f['path'] for f in mock_tree
            if f['type'] == 'blob'
            and 0 < f['size'] < CONFIG['MAX_FILE_SIZE_BYTES']
            and not any(p.search(f['path']) for p in SKIP_PATTERNS)
            and re.search(FILE_EXTENSIONS['ALL'], f['path'])
        ]

        context.current_index = 0
        app_state.dispatch({'type': ActionType.SET_VALUE, 'key': 'isIndexed', 'value': True})
        context.log_fn(f"Indexing Complete. Found {len(context.queue)} processable files.", "success")

        # After indexing, start processing immediately
        app_state.dispatch({'type': ActionType.TOGGLE_LIVE})
        app_state.dispatch({'type': ActionType.SET_STATUS, 'value': Status.PROCESSING})
        start_cycle_timer() # This only logs the start, the main loop drives `run_cycle`

    except Exception as e:
        context.log_fn(f"Index Error: {e}", "error")
        app_state.dispatch({'type': ActionType.SET_STATUS, 'value': Status.ERROR}) # Set error status if indexing fails
    finally:
        # If the state is not live (e.g., due to an error during indexing), set to IDLE
        if not app_state.state['isLive'] and app_state.state['status'] != Status.ERROR:
            app_state.dispatch({'type': ActionType.SET_STATUS, 'value': Status.IDLE})


def initialize_system():
    """Simulates the application startup sequence."""
    if not app_state.state['isAcknowledged']:
        app_state.dispatch({'type': ActionType.ACKNOWLEDGE})
        context.gh_token = "mock_gh_token_123"
        context.gemini_key = "mock_gemini_key_456"
        
        # This recursive call in Python isn't quite how a React useEffect would work
        # but for simulation, we can assume acknowledge sets it.
        # Removed the recursion to prevent potential stack depth issues and simplify flow.
        # if not app_state.state['isAcknowledged']:
        #     initialize_system()
        #     return

    print("\n--- Sovereign Engine Mock Initialized ---")
    context.log_fn(f"Ready to process target: {app_state.state['targetRepo']}", "info")


if __name__ == '__main__':
    initialize_system()
    
    print("\n--- Simulating Start/Index ---")
    handle_main_button() # This should trigger indexing and then start
    
    print("\n--- Simulating Further Cycles ---")
    # Simulate multiple cycles until the queue is empty or processing stops
    max_cycles = len(context.queue) + 2 # Allow a couple extra cycles to ensure completion logic
    for i in range(1, max_cycles):
        if app_state.state['isLive'] and app_state.state['status'] == Status.PROCESSING:
            print(f"\n--- Cycle {i} ---")
            run_cycle()
            # Simulate a small delay between cycles for realism
            time.sleep(CONFIG['CYCLE_INTERVAL_MS'] / 1000.0) 
        elif app_state.state['status'] in [Status.COMPLETE, Status.ABORTED, Status.ERROR]:
            print(f"\nProcessing stopped. Status: {app_state.state['status'].value}")
            break
        elif not app_state.state['isLive']:
            print("\nApp is no longer live.")
            break
        else:
            print(f"\nWaiting for next action or status change. Current Status: {app_state.state['status'].value}")
            time.sleep(CONFIG['CYCLE_INTERVAL_MS'] / 1000.0)
            if i == max_cycles - 1: # If it's the last cycle and nothing happened
                 print("\nNo further processing occurred within simulated cycles.")


    print("\n--- Final State ---")
    print(f"Status: {app_state.state['status'].value}")
    print(f"Metrics: {app_state.state['metrics']}")
    print(f"Logs: {len(app_state.state['logs'])} entries")
    # for log_entry in app_state.state['logs']:
    #     print(f"  [{log_entry['timestamp']} {log_entry['type'].upper()}] {log_entry['msg']}")