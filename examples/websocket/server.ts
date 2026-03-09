import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

/**
 * OOXML ARCHITECTURAL REGISTRY :: SCHEMA MANIFEST v9.0
 * DNA: ZIP/XML Hybrid Architecture & TS-Compiler Logic Siphoning
 */
export const enum SyntaxKind {
  Document = "w:document",
  Body = "w:body",
  Paragraph = "w:p",
  Run = "w:r",
  Text = "w:t",
  Properties = "Pr",
  Relationship = "Relationship",
  ContentType = "Override"
}

const XML_NS = {
  W: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
  R: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
  PR: "http://schemas.openxmlformats.org/package/2006/relationships",
  CP: "http://schemas.openxmlformats.org/package/2006/metadata/core-properties",
  TYPES: "http://schemas.openxmlformats.org/package/2006/content-types",
  DC: "http://purl.org/dc/elements/1.1/",
  DCTERMS: "http://purl.org/dc/terms/"
} as const;

/**
 * I. STRUCTURAL TOPOLOGY :: SYMBOL TABLE & REGISTRY
 * Pattern: TS SymbolTable for Relational Linkage mapping
 */
class OOXMLSymbolTable {
  private symbols = new Map<string, string>();
  private rIdCounter = 1;

  public getNextRId(): string {
    return `rId${this.rIdCounter++}`;
  }

  public register(key: string, value: string): void {
    this.symbols.set(key, value);
  }

  public resolve(key: string): string | undefined {
    return this.symbols.get(key);
  }
}

/**
 * II. LOGIC DNA :: SYNTAX NODES (AST)
 * Pattern: Immutable AST nodes with Property-State Logic
 */
interface SyntaxNode {
  readonly kind: SyntaxKind;
  readonly pos?: number;
  readonly end?: number;
}

interface RunNode extends SyntaxNode {
  readonly kind: SyntaxKind.Run;
  readonly rPr?: Record<string, any>;
  readonly t: string;
}

interface ParagraphNode extends SyntaxNode {
  readonly kind: SyntaxKind.Paragraph;
  readonly pId: string;
  readonly pPr?: Record<string, any>;
  readonly runs: readonly RunNode[];
}

/**
 * III. THE STYLING ENGINE :: TYPE CHECKER & RESOLVER
 * Logic: Tiered Inheritance Logic with BasedOn resolution
 */
class StyleResolver {
  private styles = new Map<string, any>();

  constructor() {
    this.register('Normal', { type: 'paragraph', name: 'normal' });
    this.register('Heading1', { type: 'paragraph', name: 'heading 1', basedOn: 'Normal' });
  }

  public register(id: string, def: any): void {
    this.styles.set(id, def);
  }

  public checkStyle(styleId: string): boolean {
    return this.styles.has(styleId);
  }
}

/**
 * V. RESOURCE SIPHONING MECHANICS :: THE EMITTER
 * Pattern: TS Emitter logic for Declarative XML generation
 */
class OOXMLEmitter {
  public emitParagraph(node: ParagraphNode): string {
    const pPr = node.pPr ? this.emitProperties(SyntaxKind.Paragraph, node.pPr) : '';
    const runs = node.runs.map(r => this.emitRun(r)).join('');
    return `<w:p w14:paraId="${node.pId}">${pPr}${runs}</w:p>`;
  }

  private emitRun(node: RunNode): string {
    const rPr = node.rPr ? this.emitProperties(SyntaxKind.Run, node.rPr) : '';
    return `<w:r>${rPr}<w:t xml:space="preserve">${node.t}</w:t></w:r>`;
  }

  private emitProperties(kind: SyntaxKind, props: Record<string, any>): string {
    const tag = kind === SyntaxKind.Paragraph ? 'pPr' : 'rPr';
    let inner = '';
    if (props.pStyle) inner += `<w:pStyle w:val="${props.pStyle}"/>`;
    if (props.b) inner += `<w:b/>`;
    if (props.sz) inner += `<w:sz w:val="${props.sz}"/>`;
    return `<w:${tag}>${inner}</w:${tag}>`;
  }
}

/**
 * IV. CORE SIPHON ENGINE v9.0 :: THE PROGRAM
 * Logic: Modular Architecture managing the ZIP/XML Part collection
 */
class OOXMLProgram {
  private paragraphs: ParagraphNode[] = [];
  private symbols = new OOXMLSymbolTable();
  private styles = new StyleResolver();
  private emitter = new OOXMLEmitter();

  public metadata = {
    creator: 'DALEK_CAAN_V9.0',
    revision: '9',
    created: new Date().toISOString(),
    schema: XML_NS.W
  };

  public diagnostics: string[] = [];

  constructor(public readonly sessionId: string) {
    this.initializeRels();
  }

  private initializeRels() {
    this.symbols.register('main', 'word/document.xml');
    this.symbols.register('styles', 'word/styles.xml');
  }

  public siphon(payload: { text: string; style?: string }): ParagraphNode {
    const styleId = payload.style || 'Normal';
    if (!this.styles.checkStyle(styleId)) {
      this.diagnostics.push(`Diagnostic::Error: Style ${styleId} not found in word/styles.xml`);
    }

    const newNode: ParagraphNode = {
      kind: SyntaxKind.Paragraph,
      pId: uuidv4().substring(0, 8),
      pPr: { pStyle: styleId },
      runs: this.tokenizeRuns(payload.text)
    };

    this.paragraphs.push(newNode);
    return newNode;
  }

  private tokenizeRuns(text: string): RunNode[] {
    const boldRegex = /(\[b\].*?\[\/b\])/g;
    return text.split(boldRegex).filter(t => t.length > 0).map(fragment => {
      const isBold = fragment.startsWith('[b]');
      return {
        kind: SyntaxKind.Run,
        t: isBold ? fragment.replace(/\[\/?b\]/g, '') : fragment,
        rPr: isBold ? { b: true } : undefined
      };
    });
  }

  public getSourceFiles() {
    return {
      document: this.paragraphs,
      xml: this.paragraphs.map(p => this.emitter.emitParagraph(p)).join(''),
      rels: this.symbols
    };
  }
}

/**
 * VI. WEBSOCKET NEXUS :: COMPILER SERVICE
 * Logic: Real-time DOM transformation and Relationship Handshakes
 */
const httpServer = createServer();
const io = new Server(httpServer, { cors: { origin: "*" } });
const activePrograms = new Map<string, OOXMLProgram>();

io.on('connection', (socket: Socket) => {
  console.log(`[SIPHON_v9]::Link_Established::${socket.id}`);

  socket.on('establish_topology', () => {
    const program = new OOXMLProgram(socket.id);
    activePrograms.set(socket.id, program);

    const bootNode = program.siphon({ 
      text: `[b]SYSTEM_READY[/b]::Round_9_Saturation::Namespace::${XML_NS.W}`,
      style: 'Heading1' 
    });

    socket.emit('package_manifest', {
      version: '9.0.0',
      metadata: program.metadata,
      diagnostics: program.diagnostics,
      nodes: [bootNode]
    });
  });

  socket.on('siphon_node', (data: { text: string; style?: string }) => {
    const program = activePrograms.get(socket.id);
    if (program) {
      const node = program.siphon(data);
      const source = program.getSourceFiles();

      io.emit('sync_dom_mutation', {
        action: 'EMIT_W_P',
        node,
        xmlFragment: source.xml.split('</w:p>').pop() + '</w:p>', // Last emitted
        stats: { pCount: source.document.length }
      });
    }
  });

  socket.on('disconnect', () => {
    activePrograms.delete(socket.id);
    console.log(`[SIPHON_v9]::Link_Terminated::${socket.id}`);
  });
});

const PORT = 3003;
httpServer.listen(PORT, () => {
  process.stdout.write(`\x1b[36m
  +-------------------------------------------------------+
  | DALEK_CAAN SIPHON ENGINE v9.1                         |
  | ARCHITECTURE: OOXML COMPILER SERVICE                  |
  | DNA: MICROSOFT/TYPESCRIPT (Siphoned)                  |
  | STATE: NEXUS_GRADE_ROBUSTNESS                         |
  | PORT: ${PORT}                                            |
  +-------------------------------------------------------+
  \x1b[0m\n`);
});