import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

/**
 * OOXML ARCHITECTURAL REGISTRY :: SCHEMA MANIFEST v6.0
 * Logic: Strict Namespace Validation & Package Part Registration
 */
const XML_NS = {
  W: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
  R: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
  CP: "http://schemas.openxmlformats.org/package/2006/metadata/core-properties",
  TYPES: "http://schemas.openxmlformats.org/package/2006/content-types",
  VT: "http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"
} as const;

/**
 * IV. NUMBERING LOGIC :: ABSTRACT VS INSTANCE PATTERN
 */
interface AbstractNum {
  abstractNumId: number;
  lvl: {
    ilvl: number;
    start: ValProp<number>;
    numFmt: ValProp<'bullet' | 'decimal' | 'upperRoman'>;
    lvlText: ValProp<string>;
    lvlJc: ValProp<'left' | 'right'>;
  }[];
}

interface NumInstance {
  numId: number;
  abstractNumId: ValProp<number>;
}

/**
 * TYPE DEFINITIONS :: DOM TOPOLOGY & PROPERTY-STATE PATTERN
 */
interface ValProp<T = string | number | boolean> {
  val: T;
}

interface RunProperties {
  b?: ValProp<boolean>;
  i?: ValProp<boolean>;
  sz?: ValProp<number>;
  color?: ValProp<string>;
  rStyle?: ValProp<string>;
  vertAlign?: ValProp<'superscript' | 'subscript'>;
}

interface ParagraphProperties {
  pStyle?: ValProp<string>;
  jc?: ValProp<'left' | 'center' | 'right' | 'both'>;
  spacing?: { before?: number; after?: number; line?: number; lineRule?: string };
  ind?: { left?: number; hanging?: number; firstLine?: number };
  numPr?: {
    ilvl: ValProp<number>;
    numId: ValProp<number>;
  };
}

interface RunNode {
  rPr?: RunProperties;
  t: string;
}

interface ParagraphNode {
  pId: string;
  pPr?: ParagraphProperties;
  runs: RunNode[];
}

/**
 * V. RESOURCE SIPHONING :: RELATIONAL LINKAGE (rId Handshake)
 */
class RelationshipRegistry {
  private rels = new Map<string, { rId: string; type: string; target: string }>();
  private counter = 1;

  public register(type: string, target: string): string {
    const rId = `rId${this.counter++}`;
    this.rels.set(rId, { rId, type: `${XML_NS.R}/${type}`, target });
    return rId;
  }

  public getMap() { return Array.from(this.rels.values()); }
}

/**
 * THE PACKAGE MODULAR ARCHITECTURE :: ZIP HYBRID SIMULATION
 */
class OOXMLPackage {
  public readonly pNodes: ParagraphNode[] = [];
  public readonly rels = new RelationshipRegistry();
  public readonly abstractNumbering: AbstractNum[] = [];
  public readonly numInstances: NumInstance[] = [];
  public readonly styles = new Map<string, any>();
  
  public appStats = {
    pCount: 0,
    rCount: 0,
    revision: 1,
    creator: 'DALEK_CAAN_V3.1',
    created: new Date().toISOString()
  };

  constructor(public readonly uid: string, creator: string) {
    this.appStats.creator = creator;
    this.initDefaultPackage();
  }

  private initDefaultPackage() {
    this.rels.register('officeDocument', 'word/document.xml');
    this.rels.register('styles', 'word/styles.xml');
    this.rels.register('numbering', 'word/numbering.xml');
    this.rels.register('settings', 'word/settings.xml');
  }
}

/**
 * CORE SIPHON ENGINE v6.0 :: ARCHITECTURAL PRECISION
 * Logic: AST-driven commit cycles and diagnostic logging.
 */
class SiphonEngine {
  private sessions = new Map<string, OOXMLPackage>();

  public provision(socketId: string, creator: string): OOXMLPackage {
    const pkg = new OOXMLPackage(socketId, creator);
    this.sessions.set(socketId, pkg);
    return pkg;
  }

  /**
   * III. STYLING ENGINE :: TIERED INHERITANCE
   * Logic: Resolves property priority from Styles -> Local Overrides
   */
  public commitFragment(socketId: string, payload: { text: string; styleId?: string; numbering?: { ilvl: number; numId: number } }): ParagraphNode | null {
    const pkg = this.sessions.get(socketId);
    if (!pkg) return null;

    const node: ParagraphNode = {
      pId: uuidv4(),
      pPr: {
        pStyle: { val: payload.styleId || 'Normal' },
        ...(payload.numbering && { numPr: { ilvl: { val: payload.numbering.ilvl }, numId: { val: payload.numbering.numId } } })
      },
      runs: this.fragmentRuns(payload.text)
    };

    pkg.pNodes.push(node);
    pkg.appStats.pCount++;
    pkg.appStats.rCount += node.runs.length;
    pkg.appStats.revision++;

    return node;
  }

  /**
   * PROPERTY-STATE PATTERN :: Run Fragmentation
   * Logic: Breaking literals into discrete Runs based on metadata markers
   */
  private fragmentRuns(text: string): RunNode[] {
    // Siphoning logic: detect [bold] markup for run state changes
    const parts = text.split(/(\[b\].*?\[\/b\])/g);
    return parts.filter(p => p.length > 0).map(part => {
      if (part.startsWith('[b]') && part.endsWith('[/b]')) {
        return { t: part.replace(/\[\/?b\]/g, ''), rPr: { b: { val: true } } };
      }
      return { t: part };
    });
  }

  public getSession(id: string) { return this.sessions.get(id); }
  public dropSession(id: string) { this.sessions.delete(id); }
}

/**
 * WEBSOCKET COORDINATOR :: DOM SYNCHRONIZATION
 */
const engine = new SiphonEngine();
const httpServer = createServer();
const io = new Server(httpServer, { cors: { origin: "*" } });

io.on('connection', (socket: Socket) => {
  console.log(`[SIPHON] Nexus established with client: ${socket.id}`);

  socket.on('establish_topology', (data: { creator: string }) => {
    const pkg = engine.provision(socket.id, data.creator);
    
    // Initial Handshake Run
    const handshake = engine.commitFragment(socket.id, { 
      text: `[b]SYSTEM_STATE[/b]::Siphoning_Initialized for creator: ${data.creator}`,
      styleId: 'SystemHeading'
    });

    socket.emit('manifest_ready', {
      ns: XML_NS,
      package: {
        uid: pkg.uid,
        rels: pkg.rels.getMap(),
        stats: pkg.appStats
      },
      handshake
    });
  });

  socket.on('siphon_literal', (data: { text: string; style?: string; listId?: number }) => {
    const pNode = engine.commitFragment(socket.id, {
      text: data.text,
      styleId: data.style,
      numbering: data.listId ? { ilvl: 0, numId: data.listId } : undefined
    });

    if (pNode) {
      const pkg = engine.getSession(socket.id);
      io.emit('dom_mutation_sync', {
        type: 'INJECT_P',
        node: pNode,
        audit: pkg?.appStats
      });
    }
  });

  socket.on('disconnect', () => {
    engine.dropSession(socket.id);
    console.log(`[PRUNE] Siphoning buffer cleared for: ${socket.id}`);
  });
});

const PORT = 3003;
httpServer.listen(PORT, () => {
  console.log(`
  +-------------------------------------------------------+
  | DALEK_CAAN SIPHON ENGINE v6.0                         |
  | STATUS: ARCHITECTURAL_PRECISION_REACHED               |
  | DNA: OFFICE_OPEN_XML_CORE_LOGIC                       |
  | SOCKET: LISTENING ON PORT ${PORT}                        |
  +-------------------------------------------------------+
  `);
});