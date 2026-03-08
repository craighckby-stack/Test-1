# AGI Core

Autonomous General Intelligence system for code analysis, pattern extraction, and self-evolution.

## What It Does

- **Analyzes Code** - Extracts patterns and architectures from repositories
- **Learns Patterns** - Identifies reusable design patterns across codebases
- **Generates Code** - Creates new code based on learned patterns
- **Self-Improves** - Runs evolution cycles to enhance capabilities

## Architecture

| Component | Purpose |
|-----------|---------|
| Cognitive Core | LLM-powered reasoning, thinking, and learning |
| Code Analyzer | Pattern extraction from multi-language codebases |
| Code Generator | Autonomous code creation and mutations |
| Evolution Engine | Self-improvement cycles |
| Governance | GAX validation, GODM decisions, TCRM consensus |
| Meta System | File introspection and lifecycle tracking |

## Tech Stack

- Next.js 16 + TypeScript
- Prisma (SQLite)
- z-ai-web-dev-sdk (AI processing)
- Socket.io (real-time communication)

## API Endpoints

- `/api/agi/chat` - Chat with AGI
- `/api/agi/analyze` - Analyze code
- `/api/agi/generate` - Generate code
- `/api/agi/evolution` - Run evolution cycles
- `/api/agi/meta` - Meta system operations

## Getting Started

```bash
bun install
bun run db:push
bun run dev
```

Open the Preview Panel to interact with the AGI.
