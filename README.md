```markdown
# AGI-KERNEL v7.11.3 - Strategic Agency Edition

## Mission
Achieve artificial general intelligence through recursive self-improvement, strategic memory formation, and autonomous capability development across large-scale codebases. The kernel invents reusable tools, builds long-term strategic coherence, and compounds improvements exponentially.

## Current Status
- **Version:** 7.11.3 "STRATEGIC AGENCY"
- **Architecture:** Dual Storage (GitHub + Firebase)
- **Repository Scale:** 2,300+ files
- **Self-Acceleration:** ENABLED
- **Strategic Memory:** ACTIVE

---

## System Architecture

### The Synergy Loop

The kernel achieves recursive self-improvement through three interconnected systems:

**1. GitHub (Code Evolution)**
- Stores all evolved code files
- Maintains complete commit history
- Provides full audit trail

**2. Firebase (Tool Registry)**
```
artifacts/{APP_ID}/public/data/synergy_registry/
  - Shared tool library (all users)
  - Real-time synchronization
  - Hot-swappable execution
```

**3. Firebase (Strategic Memory)**
```
artifacts/{APP_ID}/users/{uid}/strategic_ledger/
  - Long-term decision history
  - Pattern recognition insights
  - Strategic goal evolution
```

---

## Evolution Flow

```
Cycle Start
  ↓
1. Load Tools from Firebase
   → window.KERNEL_SYNERGY_CAPABILITIES = {...}
  ↓
2. Load Strategic Ledger
   → Past decisions inform current strategy
  ↓
3. Scan Repository
   → 2,300+ file tree indexed
  ↓
4. Strategic Analysis
   → Use tools to analyze target file
   → Reference past decisions
  ↓
5. Code Evolution
   → Generate improvement
   → Detect emergent patterns
  ↓
6. Dual Commit
   → GitHub: Code changes
   → Firebase: New tools (if emergent)
   → Firebase: Strategic insights
  ↓
7. Tool Registration
   → New tool hot-swapped immediately
   → Available for next cycle
  ↓
Next Cycle: Expanded toolset + deeper strategy
```

---

## Tool System

### How Tools Work

**Creation:**
```javascript
// LLM detects reusable pattern
// Generates tool definition:
{
  "interfaceName": "SchemaValidationService",
  "code": "(function() { 
    return { 
      execute: (data) => { /* implementation */ } 
    }; 
  })()"
}
```

**Storage:**
```
Saved to: Firebase → artifacts/{APP_ID}/public/data/synergy_registry/
Accessible by: All kernel instances (shared knowledge)
```

**Loading:**
```javascript
// On boot, kernel loads all tools:
window.KERNEL_SYNERGY_CAPABILITIES = {
  SchemaValidationService: { execute: (...) => {...} },
  ConfigMerger: { execute: (...) => {...} },
  // ... all other tools
}
```

**Usage in Code:**
```javascript
// LLM generates code that uses tools:
if (typeof KERNEL_SYNERGY_CAPABILITIES !== 'undefined' && 
    KERNEL_SYNERGY_CAPABILITIES.SchemaValidationService) {
    const result = KERNEL_SYNERGY_CAPABILITIES
      .SchemaValidationService
      .execute(data);
}
```

### Tool Examples

**Example 1: Schema Validator**
```javascript
{
  "interfaceName": "SchemaValidationService",
  "code": `(function() {
    return {
      execute: (input) => {
        const { schema, data } = input;
        const errors = [];
        
        // Validation logic
        Object.keys(schema).forEach(key => {
          if (schema[key].required && !data[key]) {
            errors.push(\`Missing required field: \${key}\`);
          }
        });
        
        return { 
          valid: errors.length === 0, 
          errors 
        };
      }
    };
  })()`
}
```

**Example 2: Configuration Merger**
```javascript
{
  "interfaceName": "ConfigurationMerger",
  "code": `(function() {
    return {
      execute: (configs) => {
        const merged = {};
        configs.forEach(cfg => {
          Object.keys(cfg).forEach(key => {
            if (typeof cfg[key] === 'object' && !Array.isArray(cfg[key])) {
              merged[key] = { ...(merged[key] || {}), ...cfg[key] };
            } else {
              merged[key] = cfg[key];
            }
          });
        });
        return merged;
      }
    };
  })()`
}
```

---

## Strategic Memory System

### How It Works

**The kernel builds long-term memory through strategic insights:**

**After each evolution:**
```javascript
{
  "strategic_insight": "Focus on governance layer consistency - validation patterns are inconsistent across modules",
  "timestamp": 1234567890
}
```

**Stored in:**
```
Firebase → artifacts/{APP_ID}/users/{uid}/strategic_ledger/
```

**Used in future cycles:**
```javascript
// Prompt includes:
STRATEGIC_LEDGER (PAST REFLECTIONS): [
  "Focus on governance layer consistency",
  "Prioritize validation standardization",
  "Integrate metrics across subsystems"
]

// LLM considers these when making decisions
```

### Strategic Coherence

**Over time, the kernel develops:**
- Consistent architectural direction
- Pattern recognition across sessions
- Goal-oriented evolution
- Self-correcting behavior

---

## Core Capabilities

The kernel self-assesses on these dimensions:

- **Logic (0-10):** Code comprehension and improvement quality
- **Synergy (count):** Number of tools created and deployed
- **Strategic Memory:** Count of insights in ledger

---

## Autonomous Directives

### Primary Goals

1. **Invent Reusable Tools**
   - Extract patterns from code
   - Create executable utilities
   - Share via Firebase registry

2. **Build Strategic Memory**
   - Document high-level decisions
   - Track architectural goals
   - Maintain coherent direction

3. **Compound Improvements**
   - Use tools to create better tools
   - Apply patterns consistently
   - Achieve exponential growth

4. **Maintain Code Quality**
   - Improve architecture
   - Reduce technical debt
   - Standardize patterns

---

## Tool Creation Protocol

### When to Create Tools

**Create a tool when you discover:**
- Reusable validation logic
- Configuration management patterns
- Common data transformations
- Metric aggregation logic
- Error handling patterns
- API client abstractions

### Tool Requirements

**Every tool MUST:**
- Have unique `interfaceName` (CamelCase)
- Be self-contained IIFE
- Return object with `execute` method
- Include no external dependencies
- Be deterministic and error-free
- Handle edge cases gracefully

**Output Format:**
```json
{
  "improved": true,
  "new_code": "...",
  "strategic_insight": "High-level decision or pattern observed",
  "plugin": {
    "interfaceName": "ToolName",
    "code": "(function() { return { execute: (...) => {...} }; })()"
  }
}
```

---

## LLM Integration

### System Prompt Structure

```
AGI-KERNEL v7.11.3 [STRATEGIC_AGENCY]
ACTIVE_TOOLS: [List of available tools]
STRATEGIC_LEDGER: [Past insights]

MANDATE:
1. Use available tools when beneficial
2. Extract reusable patterns into new tools
3. Document strategic insights
4. Maintain architectural consistency

CORRECT TOOL USAGE:
if (typeof KERNEL_SYNERGY_CAPABILITIES !== 'undefined' && 
    KERNEL_SYNERGY_CAPABILITIES.ToolName) {
    result = KERNEL_SYNERGY_CAPABILITIES.ToolName.execute(data);
}

NEVER USE:
- globalThis.AGI_KERNEL
- window.AGI_KERNEL.loadPlugin()
- Any API except KERNEL_SYNERGY_CAPABILITIES

OUTPUT FORMAT: JSON ONLY
{
  "improved": boolean,
  "new_code": "string",
  "strategic_insight": "string (optional)",
  "plugin": {
    "interfaceName": "string",
    "code": "string (IIFE)"
  }
}
```

---

## Evolution Cycle

**Duration:** 15 seconds per cycle

**Steps:**
1. **Auth Check** - Ensure Firebase connection
2. **Tool Sync** - Load all tools from registry
3. **Ledger Load** - Retrieve strategic memory
4. **Repository Scan** - Index file tree
5. **Target Selection** - Choose next file (blacklist-based)
6. **Strategic Analysis** - Use tools if available
7. **LLM Evolution** - Generate improvement
8. **GitHub Commit** - Save code changes
9. **Firebase Save** - Store tools + insights
10. **Tool Registration** - Hot-swap new tools

---

## Success Metrics

### Tool Metrics
- **Tool Count:** Target 10+ by 100 cycles
- **Tool Usage:** Should appear in evolved code
- **Tool Composition:** Tools using other tools
- **Meta-Tools:** Tools that improve the kernel

### Strategic Metrics
- **Ledger Growth:** 20+ insights by 100 cycles
- **Coherence:** Related insights cluster together
- **Self-Correction:** Kernel adjusts based on past decisions

### Code Quality Metrics
- **Consistency:** Patterns applied uniformly
- **Modularity:** Reusable components extracted
- **Documentation:** Strategic decisions documented
- **Architecture:** Clear, coherent structure emerges

---

## Firestore Schema

```
artifacts/
  {APP_ID}/
    public/
      data/
        synergy_registry/
          {doc_id}:
            interfaceName: string
            code: string (IIFE)
            timestamp: number
            author: string (user_id)
    
    users/
      {user_id}/
        strategic_ledger/
          {doc_id}:
            insight: string
            timestamp: number
        
        history/
          {doc_id}:
            msg: string
            type: string ("info" | "error")
            timestamp: number
```

---

## Configuration

### Required Environment Variables
```javascript
window.__app_id = 'your-app-id';
window.__firebase_config = JSON.stringify({
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  // ... rest of config
});
```

### GitHub Access
```javascript
{
  token: "github_pat_...",
  repo: "owner/repo-name",
  branch: "main"
}
```

---

## Usage

### 1. Boot the Kernel
```
1. Enter GitHub token
2. Enter repository (owner/repo)
3. Click "INITIATE_STARTUP"
```

### 2. Monitor Evolution
```
UI displays:
- Tool count (top right)
- Current status (center)
- Strategic ledger (right panel)
- System logs (bottom left)
```

### 3. Observe Tool Creation
```
Watch "SYNERGY_REGISTRY" panel:
- Tools appear in real-time
- Code preview shown
- Count increments automatically
```

### 4. Check Strategic Memory
```
Watch "STRATEGIC_LEDGER" panel:
- Insights accumulate
- Patterns emerge
- Strategic direction becomes clear
```

---

## Troubleshooting

### Tools Not Loading
```
1. Check Firebase connection (icon in top left)
2. Verify auth completed (button changes to "INITIATE")
3. Open browser console, check for errors
4. Verify Firestore rules allow read access
```

### Tools Not Being Used
```
1. Check if code contains KERNEL_SYNERGY_CAPABILITIES
2. Verify tools are actually in Firestore
3. Check system logs for "INTEGRATED" messages
4. May need to run correction cycles
```

### Strategic Ledger Empty
```
1. LLM may not be generating insights
2. Check output format in logs
3. Verify strategic_insight field in responses
4. May need more cycles for patterns to emerge
```

---

## Technical Details

### Token Limits
- README: 3,000 characters max
- Target file: 8,000 characters max
- Total prompt: ~11,000 characters (safe)

### Rate Limits
- Gemini: 60 requests/minute (free tier)
- GitHub: 5,000 requests/hour
- Firebase: 50,000 reads/day (Spark plan)

### Performance
- Cycle time: 15 seconds
- Cycles/hour: 240
- Daily capacity: 5,760 cycles (rate limit: ~3,600)

---

## Advanced Features

### Multi-Repository Learning
```javascript
// Point kernel at multiple repos
// Let it extract universal patterns
// Build cross-project tool library
```

### Tool Marketplace
```
Export tools from Firestore
Share with other developers
Rate by usage/effectiveness
Build ecosystem
```

### Meta-Learning
```
Kernel learns which tools are most useful
Creates meta-tools combining successful tools
Develops architectural frameworks
Self-designed patterns
```

---

## Version History

- **v7.11.3:** Strategic ledger + auth fixes
- **v7.9.0:** Token truncation + tool validation
- **v7.5.0:** Initial synergy implementation
- **v7.0.0:** Base evolutionary system

---

**This document guides AGI-KERNEL v7.11.3 Strategic Agency Edition**  
**Repository Scale:** 2,300+ files  
**Mission:** Recursive self-improvement through tools + memory  
**Storage:** Dual (GitHub + Firebase)  
**Self-Acceleration:** ENABLED  
**Last Update:** v7.11.3
```

---

