import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Languages, Play, RotateCcw, Copy, CheckCheck,
  ChevronRight, Terminal, FileCode2, BookOpen
} from 'lucide-react';
import { useOS } from '../context/OSContext';
import LangShiftEngine from '../engine/langshiftEngine.js';

type Mode = 'translate' | 'explain';

const TRANSLATE_PAIRS = [
  { source: 'Python', target: 'C#' },
  { source: 'C#', target: 'Python' },
];
const EXPLAIN_LANGS = ['Python', 'C#', 'JavaScript', 'TypeScript', 'Rust', 'Go'];

const engine = new LangShiftEngine();

const SAMPLE_PYTHON = `import math
import json

class Vehicle:
    def __init__(self, make, model):
        self.make = make
        self.model = model

class Car(Vehicle):
    def get_speed(self):
        return 120

    def get_price(self):
        return 29999.99

    def get_label(self):
        return "Orvane GT"

    def is_active(self):
        return True

    def get_tags(self):
        return ["fast", "electric", "smart"]

    def get_meta(self):
        return {"brand": "Orvane", "year": 2026}

    async def fetch_data(self, url):
        result = await get(url)
        return result

    def process(self, items):
        count = 0
        ratio = 3.14
        label = "processing"
        enabled = False
        output = []
        lookup = {}
        for item in items:
            if item and not item == None:
                count = count + 1
        return output`;

const SAMPLE_CSHARP = `using System;
using System.Collections.Generic;

public class Vehicle
{
    public string Make { get; set; }
    public string Model { get; set; }
}

public class Car : Vehicle
{
    public int Speed = 120;
    public double Price = 29999.99;
    public string Label = "Orvane GT";
    public bool Active = true;

    public object GetTags()
    {
        return new List<object> { "fast", "electric", "smart" };
    }

    public async Task<object> FetchData(object url)
    {
        var result = await Get(url);
        return result;
    }

    public object Process(object items)
    {
        var count = 0;
        var output = new List<object> {};
        foreach (var item in items)
        {
            if (item != null)
            {
                count = count + 1;
            }
        }
        return output;
    }
}`;

const SAMPLES: Record<string, string> = {
  'Python': SAMPLE_PYTHON,
  'C#': SAMPLE_CSHARP,
};

export const OrvanePCLingoFacilitator: React.FC = () => {
  const { logSysCall } = useOS();

  const [mode, setMode] = useState<Mode>('translate');
  const [sourceLang, setSourceLang] = useState('Python');
  const [targetLang, setTargetLang] = useState('C#');
  const [explainLang, setExplainLang] = useState('Python');
  const [input, setInput] = useState(SAMPLE_PYTHON);
  const [output, setOutput] = useState('');
  const [notes, setNotes] = useState('');
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  const addLog = (msg: string) => {
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const run = async () => {
    if (!input.trim()) return;
    setRunning(true);
    setOutput('');
    setNotes('');

    addLog(`Initializing LangShift engine (advanced mode)...`);
    await new Promise(r => setTimeout(r, 250));

    const effectiveSource = mode === 'explain' ? explainLang : sourceLang;
    const effectiveTarget = mode === 'explain' ? explainLang : targetLang;

    addLog(`Mode: ${mode.toUpperCase()} | ${effectiveSource}${mode === 'translate' ? ` → ${effectiveTarget}` : ''}`);
    await new Promise(r => setTimeout(r, 300));

    addLog('Scanning imports → using directives...');
    await new Promise(r => setTimeout(r, 200));
    addLog('Resolving class inheritance, async defs, list/dict types...');
    await new Promise(r => setTimeout(r, 250));
    addLog('Inferring typed declarations: int, double, string, bool...');
    await new Promise(r => setTimeout(r, 250));
    addLog('Running mapReturnType — inferring function return signatures...');
    await new Promise(r => setTimeout(r, 200));

    let result: { output: string; notes: string };
    try {
      result = engine.handle({
        sourceLanguage: effectiveSource,
        targetLanguage: effectiveTarget,
        mode,
        input,
      });
      addLog('Shift complete. Writing output buffer...');
    } catch (e: any) {
      result = { output: `// Engine error: ${e.message}`, notes: 'Runtime exception.' };
      addLog(`ENGINE_ERROR: ${e.message}`);
    }

    await new Promise(r => setTimeout(r, 200));
    setOutput(result.output);
    setNotes(result.notes);
    setRunning(false);

    addLog(`DONE — ${result.notes}`);

    logSysCall({
      source: 'LINGO_FACILITATOR',
      target: 'LANGSHIFT_ENGINE',
      command: `${mode}:${effectiveSource}${mode === 'translate' ? `_to_${effectiveTarget}` : ''}`,
      status: 'VERIFIED'
    });
  };

  const reset = () => {
    setInput(SAMPLES[sourceLang] ?? SAMPLE_PYTHON);
    setOutput('');
    setNotes('');
    setLog([]);
  };

  const copyOutput = () => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="h-full w-full bg-[#050505] text-white flex flex-col font-mono overflow-hidden">

      {/* Header */}
      <div className="p-5 border-b border-white/5 bg-black/40 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center">
            <Languages size={20} className="text-brand-cyan" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest text-white">Orvane PC Lingo Facilitator</h1>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-[9px] text-zinc-500">Engine: LangShift_v1.0</span>
              <div className="w-1 h-1 rounded-full bg-brand-cyan/40" />
              <span className="text-[9px] text-zinc-500">Orvane Engineering</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={reset}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
          <button
            onClick={run}
            disabled={running || !input.trim()}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-brand-cyan text-brand-dark rounded-lg text-[9px] font-black uppercase tracking-widest shadow-[0_0_16px_rgba(0,242,255,0.25)] hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play size={11} />
            <span>{running ? 'Processing...' : 'Run Shift'}</span>
          </button>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b border-white/5 shrink-0">
        {(['translate', 'explain'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex items-center space-x-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
              mode === m
                ? 'border-brand-cyan text-brand-cyan bg-brand-cyan/5'
                : 'border-transparent text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {m === 'translate' ? <FileCode2 size={12} /> : <BookOpen size={12} />}
            <span>{m}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-px bg-white/5 overflow-hidden min-h-0">

        {/* Left panel: Config + Input */}
        <div className="flex flex-col w-full lg:w-1/2 bg-[#050505] overflow-hidden">

          {/* Language Config */}
          <div className="p-4 border-b border-white/5 shrink-0">
            <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest mb-3">Language Config</p>

            {mode === 'translate' ? (
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <p className="text-[8px] text-zinc-600 uppercase mb-1">Source</p>
                  <select
                    value={sourceLang}
                    onChange={e => {
                      const newSrc = e.target.value;
                      const pair = TRANSLATE_PAIRS.find(p => p.source === newSrc);
                      if (pair) setTargetLang(pair.target);
                      if (input === SAMPLES[sourceLang]) setInput(SAMPLES[newSrc] ?? '');
                      setSourceLang(newSrc);
                      setOutput('');
                      setNotes('');
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-zinc-300 font-mono outline-none focus:border-brand-cyan/50 transition-colors"
                  >
                    {TRANSLATE_PAIRS.map(p => (
                      <option key={p.source} value={p.source}>{p.source}</option>
                    ))}
                  </select>
                </div>
                <div className="text-brand-cyan mt-4">→</div>
                <div className="flex-1">
                  <p className="text-[8px] text-zinc-600 uppercase mb-1">Target</p>
                  <select
                    value={targetLang}
                    onChange={e => setTargetLang(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-zinc-300 font-mono outline-none focus:border-brand-cyan/50 transition-colors"
                  >
                    {TRANSLATE_PAIRS.filter(p => p.source === sourceLang).map(p => (
                      <option key={p.target} value={p.target}>{p.target}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <p className="text-[8px] text-zinc-600 uppercase mb-1">Language to Explain</p>
                <select
                  value={explainLang}
                  onChange={e => setExplainLang(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-zinc-300 font-mono outline-none focus:border-brand-cyan/50 transition-colors"
                >
                  {EXPLAIN_LANGS.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Code Input */}
          <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Input Code</p>
              <span className="text-[8px] text-zinc-700 font-mono">{input.split('\n').length} lines</span>
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full bg-black/40 border border-white/5 rounded-xl p-4 text-[11px] text-zinc-300 font-mono resize-none outline-none focus:border-brand-cyan/30 transition-colors leading-relaxed"
              placeholder="// Paste your code here..."
            />
          </div>
        </div>

        {/* Right panel: Output + Log */}
        <div className="flex flex-col w-full lg:w-1/2 bg-[#080808] overflow-hidden">

          {/* Output */}
          <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-2 min-h-0">
            <div className="flex items-center justify-between shrink-0">
              <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Output</p>
              <button
                onClick={copyOutput}
                disabled={!output}
                className="flex items-center space-x-1.5 text-[8px] font-black uppercase text-zinc-600 hover:text-brand-cyan transition-colors disabled:opacity-30"
              >
                {copied ? <CheckCheck size={10} className="text-brand-cyan" /> : <Copy size={10} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex-1 relative overflow-hidden rounded-xl border border-white/5 bg-black/40">
              {output ? (
                <pre className="h-full overflow-auto p-4 text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {output}
                </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-3 p-8 text-center">
                  <Languages size={36} />
                  <p className="text-[9px] uppercase font-black tracking-[0.2em]">
                    {running ? 'Shifting...' : 'Awaiting Shift'}
                  </p>
                </div>
              )}

              {running && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-8 h-8 border-2 border-brand-cyan/20 border-t-brand-cyan rounded-full"
                  />
                </div>
              )}
            </div>

            {notes && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-3 py-2 rounded-lg bg-brand-cyan/5 border border-brand-cyan/20 text-[9px] text-brand-cyan font-mono"
              >
                {notes}
              </motion.div>
            )}
          </div>

          {/* Engine Log */}
          <div className="h-36 border-t border-white/5 flex flex-col shrink-0">
            <div className="px-4 py-2 border-b border-white/5 flex items-center space-x-2">
              <Terminal size={10} className="text-zinc-600" />
              <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Engine_Log</span>
              {running && (
                <span className="text-[9px] font-mono text-brand-cyan animate-pulse ml-auto">PROCESSING...</span>
              )}
            </div>
            <div ref={logRef} className="flex-1 overflow-y-auto p-3 space-y-1">
              {log.length === 0 ? (
                <p className="text-[9px] text-zinc-800 font-mono">// No activity yet</p>
              ) : (
                log.map((entry, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start space-x-2"
                  >
                    <ChevronRight size={8} className="mt-0.5 text-zinc-700 shrink-0" />
                    <span className="text-[9px] text-zinc-500 font-mono leading-relaxed break-all">{entry}</span>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
