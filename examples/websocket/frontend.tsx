'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Terminal, ShieldCheck, Activity, FileJson, 
  Layers, Cpu, Hash, Info, Database, Workflow, Zap, Binary,
  Link2, Box, FileCode, GitBranch, Share2, FileStack, HardDrive,
  Package, Scissors, Microscope, Network, Settings
} from 'lucide-react';

/**
 * [Content_Types].xml :: MIME TYPE REGISTRY
 * Maps the package topology to strict schema definitions.
 */
const SCHEMA_MAP = {
  main: "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
  styles: "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml",
  rels: "application/vnd.openxmlformats-package.relationships+xml",
  app: "application/vnd.openxmlformats-officedocument.extended-properties+xml",
  nexus: "application/vnd.nexus.logic.shard+json"
};

/**
 * word/styles.xml :: TIERED INHERITANCE ENGINE
 * Implementation of the "BasedOn" logic pattern using Tailwind cascades.
 */
const DOC_STYLES = {
  /** <w:docDefaults> */
  root: "min-h-screen bg-[#050505] text-slate-50 font-sans selection:bg-cyan-500/30 selection:text-white antialiased overflow-hidden p-6",
  
  /** <w:style w:styleId="ParagraphBlock"> */
  p: {
    container: "relative group mb-6 transition-all duration-700",
    pPr: "absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl -z-10 transition-opacity",
    user: "border border-white/5 bg-zinc-900/40 p-8 rounded-[2rem] shadow-xl hover:border-cyan-500/20",
    system: "border-y border-dashed border-zinc-800 bg-zinc-950/50 py-12 flex flex-col items-center justify-center text-center px-12"
  },

  /** <w:style w:styleId="RunLogic"> */
  r: {
    rId: "text-[10px] font-black bg-cyan-500 text-black px-3 py-1 rounded-full flex items-center gap-1.5 uppercase shadow-[0_0_15px_rgba(6,182,212,0.3)]",
    t: "text-lg text-zinc-400 leading-relaxed font-medium tracking-tight group-hover:text-zinc-100 transition-colors",
    abstract: "text-xs font-bold text-cyan-500/60 uppercase tracking-[0.5em] flex items-center gap-3",
    meta: "text-[8px] font-mono text-zinc-700 absolute top-4 right-8 select-none"
  }
};

interface WordRun {
  rId: string;      // Relationship Reference
  t: string;        // Text Content (Literal)
  rPr: string;      // Run Properties (Metadata)
  type: 'user' | 'system';
}

interface WordParagraph {
  pId: string;
  runs: WordRun[];
  created: string;
}

/**
 * Nexus_Siphon_v9.5 :: ARCHITECTURAL PRECISION ENGINE
 * Siphoning high-order patterns from vercel/next.js into an OOXML-structured DOM.
 */
export default function NexusPackageEngine() {
  /** word/document.xml :: BODY CONTENT STORE */
  const [packageBody, setPackageBody] = useState<WordParagraph[]>([]);
  
  /** _rels/.rels :: RELATIONSHIP MAP */
  const [rels, setRels] = useState<{
    activeRId: string | null;
    status: 'DISCONNECTED' | 'SYNCHRONIZING' | 'ACTIVE';
  }>({
    activeRId: null,
    status: 'DISCONNECTED'
  });

  const [inputBuffer, setInputBuffer] = useState('');
  const [pendingRId, setPendingRId] = useState('');
  const socketRef = useRef<Socket | null>(null);

  /** RELATIONSHIP HANDSHAKE :: WebSocket Initialization */
  useEffect(() => {
    const socket = io('/?v=9.5&schema=OOXML', {
      transports: ['websocket'],
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setRels(prev => ({ ...prev, status: 'ACTIVE' }));
    });

    socket.on('message', (payload: any) => {
      setPackageBody(prev => [
        ...prev,
        {
          pId: payload.id || crypto.randomUUID(),
          created: payload.timestamp || new Date().toISOString(),
          runs: [{
            rId: payload.username,
            t: payload.content,
            rPr: payload.type || 'user',
            type: payload.type || 'user'
          }]
        }
      ]);
    });

    socket.on('user-joined', (data: any) => {
      setPackageBody(prev => [
        ...prev,
        {
          pId: data.message.id,
          created: data.message.timestamp,
          runs: [{
            rId: 'SYS_REL_INIT',
            t: data.message.content,
            rPr: 'system_log',
            type: 'system'
          }]
        }
      ]);
    });

    return () => { socket.disconnect(); };
  }, []);

  /** Resource Siphoning Mechanics :: w:r Alignment */
  const commitRelationship = useCallback(() => {
    const cleanId = pendingRId.trim();
    if (socketRef.current && cleanId) {
      socketRef.current.emit('join', { username: cleanId });
      setRels(prev => ({ ...prev, activeRId: cleanId }));
    }
  }, [pendingRId]);

  /** <w:t> :: Literal Data Injection */
  const siphonRun = useCallback(() => {
    const content = inputBuffer.trim();
    if (socketRef.current && content && rels.activeRId) {
      socketRef.current.emit('message', {
        content,
        username: rels.activeRId
      });
      setInputBuffer('');
    }
  }, [inputBuffer, rels.activeRId]);

  /** docProps/app.xml :: EXTENDED PROPERTY STATISTICS */
  const appProps = useMemo(() => ({
    paragraphs: packageBody.length,
    runs: packageBody.flatMap(p => p.runs).length,
    revision: 9,
    fingerprint: `0x${(packageBody.length * 777).toString(16).toUpperCase()}`
  }), [packageBody]);

  return (
    <main className={DOC_STYLES.root}>
      {/* Background Schema Overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.05),transparent_50%)] pointer-events-none" />

      <div className="relative grid grid-cols-12 gap-8 max-w-[1800px] mx-auto h-[calc(100vh-8rem)]">
        
        {/* [Content_Types].xml :: MANIFEST EXPLORER */}
        <aside className="col-span-3 space-y-6">
          <Card className="bg-zinc-900/20 border-white/[0.03] backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border-t-white/[0.05]">
            <CardHeader className="p-8 border-b border-white/[0.03]">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-500/20 p-2.5 rounded-2xl">
                  <Package className="h-5 w-5 text-cyan-500" />
                </div>
                <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Package Manifest</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-2">
              {[
                { label: '[Content_Types].xml', icon: FileJson, color: 'text-zinc-600' },
                { label: '_rels/.rels', icon: Link2, color: 'text-zinc-600' },
                { label: 'word/document.xml', icon: FileCode, color: 'text-cyan-400' },
                { label: 'word/styles.xml', icon: Layers, color: 'text-zinc-600' },
                { label: 'word/numbering.xml', icon: Hash, color: 'text-zinc-600' },
                { label: 'docProps/app.xml', icon: Activity, color: 'text-zinc-600' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/[0.03] group cursor-pointer transition-all">
                  <div className="flex items-center gap-4">
                    <item.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", item.color)} />
                    <span className="text-[11px] font-mono text-zinc-500 group-hover:text-zinc-200 transition-colors">{item.label}</span>
                  </div>
                  <div className="h-1 w-1 rounded-full bg-zinc-800 group-hover:bg-cyan-500 transition-colors" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* extended-properties :: APP.XML */}
          <Card className="bg-gradient-to-br from-cyan-950/20 to-black/40 border-cyan-500/10 backdrop-blur-2xl rounded-[2.5rem]">
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <Microscope className="h-6 w-6 text-cyan-500/50" />
                <Badge className="bg-cyan-500/10 text-cyan-400 text-[9px] border-none font-black tracking-widest px-3">APP_STATS_V9</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Rev_ID</p>
                  <p className="text-xl font-mono text-cyan-200 font-bold tracking-tighter">00{appProps.revision}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Checksum</p>
                  <p className="text-xl font-mono text-zinc-300 font-bold tracking-tighter">{appProps.fingerprint}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* word/document.xml :: CORE DOM BODY */}
        <section className="col-span-9 flex flex-col gap-6">
          <Card className="flex-1 bg-zinc-900/10 border-white/[0.03] backdrop-blur-3xl rounded-[3.5rem] overflow-hidden flex flex-col border-t-white/[0.05]">
            <CardHeader className="bg-white/[0.01] p-10 border-b border-white/[0.03]">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-4xl font-black tracking-tighter italic text-white flex items-baseline gap-4">
                    DOCUMENT.XML
                    <span className="text-[10px] font-black text-cyan-500/40 uppercase tracking-[0.4em] italic leading-none">v9.5 Build</span>
                  </CardTitle>
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Schema: {SCHEMA_MAP.main.split('/').pop()}</p>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Relational_Handshake</p>
                    <p className={cn("text-xs font-black tracking-widest uppercase", 
                      rels.status === 'ACTIVE' ? "text-cyan-400" : "text-amber-500")}>
                      {rels.status}
                    </p>
                  </div>
                  <div className={cn("h-14 w-1 rounded-full", 
                    rels.status === 'ACTIVE' ? "bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.5)]" : "bg-zinc-800")} />
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 relative overflow-hidden">
              <ScrollArea className="h-full w-full">
                <div className="p-12">
                  <AnimatePresence mode="popLayout">
                    {!rels.activeRId ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="h-[500px] flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-10"
                      >
                        <div className="relative">
                          <div className="absolute inset-0 bg-cyan-500/20 blur-[50px] rounded-full" />
                          <div className="relative bg-zinc-950 border border-white/5 p-10 rounded-[3rem]">
                            <ShieldCheck className="h-16 w-16 text-cyan-500 animate-pulse" />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-2xl font-black uppercase tracking-tight text-white">Relationship Required</h3>
                          <p className="text-zinc-500 text-sm leading-relaxed italic px-8">Establish a Relational ID (rId) mapping to authorized the ingestion of logic shards into the primary document body.</p>
                        </div>
                        <div className="w-full flex gap-3 p-2 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-xl">
                          <Input 
                            value={pendingRId}
                            onChange={(e) => setPendingRId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && commitRelationship()}
                            placeholder="Input target rId..."
                            className="h-14 bg-transparent border-none focus-visible:ring-0 text-center font-mono text-lg tracking-widest placeholder:text-zinc-700"
                          />
                          <Button onClick={commitRelationship} className="h-14 w-14 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg">
                            <Link2 className="h-6 w-6" />
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="space-y-6">
                        {packageBody.map((paragraph) => (
                          <motion.div
                            key={paragraph.pId}
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={cn(
                              DOC_STYLES.p.container,
                              paragraph.runs[0].type === 'system' ? DOC_STYLES.p.system : DOC_STYLES.p.user
                            )}
                          >
                            <div className={DOC_STYLES.p.pPr} />
                            <span className={DOC_STYLES.r.meta}>{new Date(paragraph.created).toLocaleTimeString()}</span>
                            
                            {paragraph.runs.map((run, rIdx) => (
                              <div key={rIdx} className="space-y-6">
                                {run.type === 'system' ? (
                                  <div className={DOC_STYLES.r.abstract}>
                                    <Workflow className="h-4 w-4" />
                                    {run.t}
                                    <div className="h-px flex-1 bg-cyan-500/10" />
                                  </div>
                                ) : (
                                  <div className="space-y-5">
                                    <div className="flex items-center gap-4">
                                      <div className={DOC_STYLES.r.rId}>
                                        <Hash className="h-3 w-3" />
                                        {run.rId}
                                      </div>
                                      <div className="h-px flex-1 bg-white/[0.03]" />
                                      <Badge variant="outline" className="text-[8px] font-mono border-zinc-800 text-zinc-600 uppercase px-2">
                                        pId_{paragraph.pId.slice(0, 4)}
                                      </Badge>
                                    </div>
                                    <p className={DOC_STYLES.r.t}>{run.t}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </ScrollArea>

              {/* Watermark/DNA Branding */}
              <div className="absolute bottom-12 right-12 opacity-5 pointer-events-none select-none">
                <Binary className="h-64 w-64 text-cyan-500" />
              </div>
            </CardContent>

            <CardFooter className="p-10 border-t border-white/[0.03] bg-zinc-950/20">
              <div className="flex w-full gap-4 items-center bg-black/40 p-3 rounded-[2.5rem] border border-white/5 focus-within:border-cyan-500/30 transition-all group shadow-inner">
                <div className="p-4 rounded-[1.5rem] bg-zinc-900 group-focus-within:bg-cyan-500/10 group-focus-within:text-cyan-400 transition-colors">
                  <Terminal className="h-6 w-6 text-zinc-700 transition-colors" />
                </div>
                <Input 
                  value={inputBuffer}
                  onChange={(e) => setInputBuffer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && siphonRun()}
                  disabled={!rels.activeRId}
                  placeholder={rels.activeRId ? "Inject run-level literal data into <w:t>..." : "Awaiting relationship mapping..."}
                  className="bg-transparent border-none focus-visible:ring-0 text-xl font-light italic placeholder:text-zinc-800"
                />
                <Button 
                  onClick={siphonRun}
                  disabled={!inputBuffer.trim() || !rels.activeRId}
                  className="rounded-full h-16 w-16 bg-zinc-50 text-black hover:bg-white shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  <Zap className="h-7 w-7" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </section>
      </div>

      {/* CORE PROPERTIES AUDIT BAR */}
      <footer className="fixed bottom-0 left-0 right-0 h-12 bg-black border-t border-white/[0.03] flex items-center px-10 justify-between">
        <div className="flex items-center gap-12 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600">
          <div className="flex items-center gap-2">
            <span className="text-zinc-800 font-mono italic tracking-normal">cp:creator :</span>
            <span className="text-zinc-400">DALEK_CAAN_V9.5</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-800 font-mono italic tracking-normal">cp:revision :</span>
            <span className="text-cyan-500">ENGINE_ROUND_09</span>
          </div>
        </div>
        
        <div className="flex items-center gap-10 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">
           <span className="flex items-center gap-2.5">
             <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
             Paragraphs: {appProps.paragraphs}
           </span>
           <span className="flex items-center gap-2.5 text-zinc-700">
             <div className="h-1.5 w-1.5 rounded-full bg-zinc-800" />
             Runs: {appProps.runs}
           </span>
           <div className="h-4 w-px bg-zinc-900 mx-2" />
           <span className="text-zinc-800 font-mono">NS: WPROCESSING_ML_MAIN</span>
        </div>
      </footer>
    </main>
  );
}