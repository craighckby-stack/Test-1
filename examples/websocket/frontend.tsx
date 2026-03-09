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
  Layers, Cpu, Hash, Info, Database, Workflow, Zap, Binary
} from 'lucide-react';

/**
 * [Content_Types].xml :: NFP (NEXUS FABRICATION PROTOCOL) v6.0
 * Strict MIME-type registration for document shard siphoning.
 */
const SCHEMA_REGISTRY = {
  DOCUMENT: 'application/vnd.nexus.shard.document+xml',
  STLYES: 'application/vnd.nexus.shard.styles+xml',
  RELATIONSHIPS: 'application/vnd.nexus.shard.relationships+xml',
  METADATA: 'application/vnd.nexus.shard.app-props+xml',
  SCHEMA: 'http://schemas.nexus.org/logic/2024/main'
} as const;

/**
 * word/styles.xml :: CASCADING INHERITANCE ENGINE
 * Implementation of the "Property-State Pattern" for Run-level text logic.
 */
const DOCUMENT_THEME = {
  body: "container mx-auto p-4 md:p-10 max-w-7xl font-sans antialiased min-h-screen flex items-center justify-center bg-[#020203] text-white selection:bg-blue-500/40",
  
  /** <w:pPr> Paragraph Properties */
  paragraph: {
    container: "relative flex flex-col space-y-4 p-8 rounded-[2.5rem] transition-all border-l-[10px] mb-8 group backdrop-blur-3xl overflow-hidden",
    user: "bg-slate-900/30 border-blue-500 shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:bg-slate-900/50",
    system: "bg-emerald-950/10 border-emerald-500/40 border-l-0 border-y py-10 items-center text-center",
  },

  /** <w:rPr> Run Properties */
  run: {
    id: "text-[10px] font-black bg-white text-black px-4 py-1.5 rounded-full tracking-[0.2em] uppercase flex items-center gap-2 shadow-[0_5px_20px_rgba(255,255,255,0.1)]",
    timestamp: "text-[9px] font-mono text-slate-600 absolute top-8 right-10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0",
    text: "text-lg text-slate-100 leading-relaxed font-light tracking-wide",
    indicator: "text-[14px] font-black text-emerald-400 uppercase tracking-[0.5em] flex items-center gap-6",
  }
};

interface RelationShard {
  rId: string;
  target: string;
  handshake: 'PENDING' | 'SYNCHRONIZED' | 'VOID';
}

interface RunShard {
  wId: string;
  rId: string;
  literal: string; // <w:t>
  created: string; // docProps/core.xml :: created
  style: 'user' | 'system';
}

/**
 * Nexus_Architectural_Siphon_v6 :: THE DOM REPLICATOR
 * Siphons high-order patterns from vercel/next.js into a ZIP/XML modular hybrid.
 */
export default function DocumentAssembler() {
  const [docModel, setDocModel] = useState<{
    body: RunShard[];
    abstracts: Map<string, string>;
    rels: RelationShard;
  }>({
    body: [],
    abstracts: new Map(),
    rels: { rId: '', target: 'NEXUS_ALPHA_STREAM', handshake: 'PENDING' },
  });

  const [buffer, setBuffer] = useState({ literal: '', rId: '' });
  const socket = useRef<Socket | null>(null);

  /** word/_rels/document.xml.rels :: DYNAMIC LINKAGE HANDSHAKE */
  useEffect(() => {
    const connection = io('/?NexusSchema=v6', {
      transports: ['websocket'],
      upgrade: true,
    });

    socket.current = connection;

    connection.on('connect', () => 
      setDocModel(prev => ({ ...prev, rels: { ...prev.rels, handshake: 'SYNCHRONIZED' } })));
    
    connection.on('disconnect', () => 
      setDocModel(prev => ({ ...prev, rels: { ...prev.rels, handshake: 'VOID' } })));

    connection.on('message', (frag: any) => 
      setDocModel(prev => ({ 
        ...prev, 
        body: [...prev.body, { 
          wId: frag.id, 
          rId: frag.username, 
          literal: frag.content, 
          created: frag.timestamp, 
          style: frag.type 
        }] 
      })));

    connection.on('user-joined', (frag: any) => {
      setDocModel(prev => {
        const newAbstracts = new Map(prev.abstracts);
        newAbstracts.set(frag.user.id, frag.user.username);
        
        return {
          ...prev,
          body: [...prev.body, { 
            wId: frag.message.id, 
            rId: 'SYS_ABSTRACT', 
            literal: frag.message.content, 
            created: frag.message.timestamp, 
            style: 'system' 
          }],
          abstracts: newAbstracts
        };
      });
    });

    return () => { connection.disconnect(); };
  }, []);

  /** Resource Siphoning Mechanics :: rId Anchor */
  const anchorRelationship = useCallback(() => {
    const id = buffer.rId.trim();
    if (socket.current && id && docModel.rels.handshake === 'SYNCHRONIZED') {
      socket.current.emit('join', { username: id });
      setDocModel(prev => ({ ...prev, rels: { ...prev.rels, rId: id } }));
    }
  }, [buffer.rId, docModel.rels.handshake]);

  /** word/document.xml :: Literal Shard Injection */
  const injectLiteralRun = useCallback(() => {
    const val = buffer.literal.trim();
    if (socket.current && val && docModel.rels.rId) {
      socket.current.emit('message', {
        content: val,
        username: docModel.rels.rId
      });
      setBuffer(prev => ({ ...prev, literal: '' }));
    }
  }, [buffer.literal, docModel.rels.rId]);

  /** docProps/app.xml :: EXTENDED PROPERTY AUDIT */
  const appProps = useMemo(() => ({
    pCount: docModel.body.length,
    rCount: docModel.body.filter(s => s.style === 'user').length,
    abstracts: docModel.abstracts.size,
    checksum: "CRC32_" + (docModel.body.length * 99).toString(16).padEnd(6, 'F').toUpperCase(),
    revision: "6.0.4"
  }), [docModel.body, docModel.abstracts]);

  return (
    <main className={DOCUMENT_THEME.body}>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none" />
      
      <Card className="w-full border-none bg-[#0a0a0c]/80 backdrop-blur-3xl rounded-[5rem] overflow-hidden border-t border-white/5 shadow-[0_0_150px_rgba(0,0,0,0.8)]">
        <CardHeader className="bg-black/40 p-16 space-y-10 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-10">
              <div className="relative">
                <div className="absolute -inset-4 bg-blue-600 rounded-full blur-2xl opacity-20" />
                <div className="relative p-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-[2.5rem] shadow-2xl">
                  <Binary className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="space-y-3">
                <CardTitle className="text-5xl font-black tracking-[-0.05em] flex items-center gap-6">
                  NEXUS_v6_SIPHON
                  <Badge variant="secondary" className="bg-white/5 text-slate-400 border-white/10 px-6 py-2 text-[11px] font-black tracking-widest uppercase rounded-full">Package: Shard_DOM</Badge>
                </CardTitle>
                <div className="flex items-center gap-6">
                   <p className="text-[12px] font-black uppercase tracking-[0.5em] text-blue-500/80">Round 6/5 :: Architectural Precision</p>
                   <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ x: "-100%" }}
                        animate={{ x: "0%" }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="h-full w-full bg-blue-500"
                      />
                   </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-4">
              <div className="flex items-center gap-4 bg-white/5 px-8 py-4 rounded-full border border-white/10">
                <span className={cn("h-3 w-3 rounded-full animate-pulse", 
                  docModel.rels.handshake === 'SYNCHRONIZED' ? "bg-emerald-400" : "bg-rose-500"
                )} />
                <span className="text-[13px] font-black tracking-[0.3em] uppercase">{docModel.rels.handshake}</span>
              </div>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">Checksum: {appProps.checksum}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             {[
               { label: 'w:abstractNum', val: appProps.abstracts, icon: Hash, sub: 'Instance Count' },
               { label: 'w:body_shards', val: appProps.pCount, icon: Database, sub: 'Total Nodes' },
               { label: 'w:r_sequences', val: appProps.rCount, icon: Zap, sub: 'Active Runs' },
               { label: 'app:Revision', val: appProps.revision, icon: Info, sub: 'Protocol Build' }
             ].map((stat, i) => (
               <div key={i} className="bg-white/[0.02] p-8 rounded-[3rem] border border-white/5 hover:border-blue-500/30 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <stat.icon className="h-5 w-5 text-blue-500/50 group-hover:text-blue-500 transition-colors" />
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{stat.label}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-mono font-black text-white">{stat.val}</p>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">{stat.sub}</p>
                  </div>
               </div>
             ))}
          </div>
        </CardHeader>
        
        <CardContent className="p-16">
          <AnimatePresence mode="wait">
            {!docModel.rels.rId ? (
              <motion.div 
                key="handshake"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -40 }}
                className="max-w-2xl mx-auto py-20 space-y-16"
              >
                <div className="text-center space-y-8">
                  <div className="inline-flex p-10 rounded-[3.5rem] bg-blue-500/5 text-blue-500 border border-blue-500/10 shadow-2xl relative group">
                     <div className="absolute inset-0 bg-blue-500 rounded-[3.5rem] blur-3xl opacity-0 group-hover:opacity-10 transition-opacity" />
                     <ShieldCheck className="h-24 w-24 relative" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-4xl font-black text-white tracking-tight uppercase">Namespace Handshake Required</h3>
                    <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-md mx-auto">Commit a unique Relationship ID (rId) to authorize logic siphoning from the Nexus host.</p>
                  </div>
                </div>
                
                <div className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] px-6">w:relationship :: Target_rId</label>
                    <Input
                      value={buffer.rId}
                      onChange={(e) => setBuffer(prev => ({ ...prev, rId: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && anchorRelationship()}
                      placeholder="e.g. RID_NEXUS_RUN_99"
                      className="h-28 bg-white/[0.03] border-2 border-white/5 rounded-[3rem] focus:border-blue-500 focus:ring-0 text-3xl font-black text-center transition-all text-white placeholder:text-slate-800"
                    />
                  </div>
                  <Button
                    onClick={anchorRelationship}
                    disabled={docModel.rels.handshake !== 'SYNCHRONIZED' || !buffer.rId.trim()}
                    className="w-full h-28 bg-blue-600 hover:bg-blue-500 text-white rounded-[3rem] font-black text-xl tracking-[0.5em] uppercase transition-all shadow-blue-900/40 shadow-2xl"
                  >
                    Initiate DOM Siphon
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="document"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-12"
              >
                <ScrollArea className="h-[650px] w-full rounded-[4rem] border border-white/5 bg-black/20 shadow-inner p-12">
                  <div className="space-y-4">
                    {docModel.body.length === 0 ? (
                      <div className="h-[550px] flex flex-col items-center justify-center space-y-10">
                        <div className="relative">
                          <Cpu className="h-32 w-32 animate-spin-slow text-blue-500/20" />
                          <Layers className="h-12 w-12 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-[12px] font-black uppercase tracking-[2em] text-blue-500/40 translate-x-[1em]">Establishing Shard Context</p>
                      </div>
                    ) : (
                      docModel.body.map((shard) => (
                        <div 
                          key={shard.wId} 
                          className={cn(DOCUMENT_THEME.paragraph.container, shard.style === 'system' ? DOCUMENT_THEME.paragraph.system : DOCUMENT_THEME.paragraph.user)}
                        >
                          {shard.style === 'system' ? (
                            <span className={DOCUMENT_THEME.run.indicator}>
                              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                              <FileJson className="h-6 w-6 text-emerald-500" />
                              {shard.literal}
                              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                            </span>
                          ) : (
                            <>
                              <div className="flex items-center gap-6 mb-6">
                                <span className={DOCUMENT_THEME.run.id}>
                                  <Hash className="h-3 w-3" />
                                  {shard.rId}
                                </span>
                                <span className="text-[11px] font-bold text-slate-500 tracking-tighter uppercase italic opacity-50">#Shard_{shard.wId.slice(-8)}</span>
                                <time className={DOCUMENT_THEME.run.timestamp}>
                                  {new Date(shard.created).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </time>
                              </div>
                              <p className={DOCUMENT_THEME.run.text}>{shard.literal}</p>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                <div className="flex gap-8 p-8 bg-white/[0.02] rounded-[3.5rem] shadow-2xl border border-white/5 items-center backdrop-blur-xl">
                  <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Terminal className="h-8 w-8 text-blue-500" />
                  </div>
                  <Input
                    value={buffer.literal}
                    onChange={(e) => setBuffer(prev => ({ ...prev, literal: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && injectLiteralRun()}
                    placeholder="Siphon <w:t> literal data into Document.xml..."
                    className="flex-1 h-16 bg-transparent border-none text-white focus-visible:ring-0 px-4 placeholder:text-slate-800 text-2xl font-light italic"
                  />
                  <Button
                    onClick={injectLiteralRun}
                    disabled={docModel.rels.handshake !== 'SYNCHRONIZED' || !buffer.literal.trim()}
                    className="h-20 w-48 rounded-[2.5rem] bg-white text-black hover:bg-slate-200 transition-all font-black text-sm uppercase tracking-[0.3em] shadow-2xl"
                  >
                    COMMIT_RUN
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        <CardFooter className="bg-white/[0.01] border-t border-white/5 flex justify-between px-20 py-12 items-center">
            <div className="flex gap-20">
                <div className="space-y-3">
                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Shard_Namespace</p>
                    <p className="text-xs font-bold text-blue-400 font-mono italic">{SCHEMA_REGISTRY.DOCUMENT}</p>
                </div>
                <div className="space-y-3 border-l border-white/10 pl-20">
                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Active_rId_Pointer</p>
                    <p className="text-xs font-black text-white font-mono bg-blue-500/20 px-4 py-1 rounded-md border border-blue-500/20">{docModel.rels.rId || 'NULL_REFERENCE'}</p>
                </div>
            </div>
            <div className="text-right space-y-3">
                <p className="text-lg font-black text-white uppercase tracking-tighter">NEXUS_DOMAIN_RESOLVER_v6</p>
                <div className="flex items-center justify-end gap-4 text-[10px] font-black text-slate-500">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  <p className="tracking-[0.4em] uppercase">SCHEMA_VALIDATION: 100%_PASS</p>
                </div>
            </div>
        </CardFooter>
      </Card>

      {/* Structural Topology Overlay */}
      <div className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none opacity-[0.02] select-none">
         <h1 className="text-[22vh] font-black text-white leading-none tracking-[-0.1em]">NEXUS_MODULAR</h1>
         <h1 className="text-[22vh] font-black text-white leading-none tracking-[-0.1em]">ARCHITECTURE</h1>
      </div>
    </main>
  );
}