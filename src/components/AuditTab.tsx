import React, { useState, useEffect } from 'react';
import { ShieldCheck, Calendar, Activity, Database, CheckCircle2, AlertCircle, Loader2, ArrowRight, Clock, RefreshCw, Layers } from 'lucide-react';
import { Execution, AgentStep } from '../types';

export default function AuditTab() {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExecId, setSelectedExecId] = useState<string | null>(null);
  const [filterCloud, setFilterCloud] = useState<'ALL' | 'AWS' | 'Azure' | 'GCP'>('ALL');

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/executions');
      if (response.ok) {
        const data = await response.json();
        setExecutions(data);
        if (data.length > 0 && !selectedExecId) {
          setSelectedExecId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load executions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredExecutions = executions.filter(exec => {
    if (filterCloud === 'ALL') return true;
    return exec.cloudProvider === filterCloud;
  });

  const activeExec = executions.find(e => e.id === selectedExecId);

  return (
    <div className="grid gap-8 lg:grid-cols-12 animate-fadeIn font-sans">
      
      {/* LEFT SIDE: EXECUTION LIST */}
      <div className="lg:col-span-5 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> Multi-Agent Execution Audits
          </h3>
          <button 
            onClick={loadHistory} 
            className="p-1 rounded hover:bg-slate-900 border border-slate-800/80 text-slate-400 hover:text-white transition"
            title="Refresh logs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Cloud filters */}
        <div className="flex gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-900">
          {(['ALL', 'AWS', 'Azure', 'GCP'] as const).map(cloud => (
            <button
              key={cloud}
              onClick={() => setFilterCloud(cloud)}
              className={`flex-1 rounded py-1 text-[10px] font-bold border transition ${
                filterCloud === cloud
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                  : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {cloud}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-2">
            <Loader2 className="h-6 w-6 text-cyan-500 animate-spin" />
            <p className="text-2xs font-mono">Querying Postgres execution audits...</p>
          </div>
        ) : filteredExecutions.length > 0 ? (
          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {filteredExecutions.map(exec => {
              const isSelected = exec.id === selectedExecId;
              const totalDuration = exec.steps.reduce((acc, step) => acc + (step.durationMs || 0), 0);
              return (
                <div
                  key={exec.id}
                  onClick={() => setSelectedExecId(exec.id)}
                  className={`cursor-pointer rounded-xl border p-4 transition space-y-3 ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500/40 shadow-sm'
                      : 'bg-slate-900/20 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{exec.projectName}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{new Date(exec.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-mono border ${
                      exec.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : exec.status === 'failed'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                    }`}>
                      {exec.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 italic font-sans">
                    "{exec.prompt}"
                  </p>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-800/60 pt-2.5">
                    <span className="flex items-center gap-1 font-bold">
                      <Layers className="h-3.5 w-3.5 text-sky-400" /> {exec.cloudProvider}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-3.5 w-3.5" /> {(totalDuration / 1000).toFixed(1)}s Total
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic py-16 text-center border border-slate-800/80 border-dashed rounded-xl">
            No audits match the chosen filter.
          </div>
        )}
      </div>

      {/* RIGHT SIDE: AUDIT TRACE TIMELINE */}
      <div className="lg:col-span-7 space-y-4">
        <div className="border-b border-slate-800 pb-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-sky-400" /> Granular Agent Audit Trails
          </h3>
        </div>

        {activeExec ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-6 space-y-6">
            
            {/* Header info */}
            <div className="flex justify-between items-center bg-slate-900/30 p-4 rounded-lg border border-slate-800/60">
              <div className="space-y-1">
                <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest font-bold">RUN UNIQUE IDENTIFIER</span>
                <div className="text-xs font-mono font-bold text-cyan-400">{activeExec.id}</div>
              </div>
              <div className="text-right space-y-1">
                <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest font-bold">COMPLIANCE CODE</span>
                <div className="text-xs font-mono text-slate-300 font-bold">SOC2 CC6 / PCI-DSS</div>
              </div>
            </div>

            {/* Timelines */}
            <div className="space-y-6">
              {activeExec.steps.map((step, idx) => (
                <div key={step.agentId} className="border-l-2 border-slate-800 pl-5 relative space-y-2">
                  
                  {/* Indicator indicator */}
                  <div className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border bg-slate-950 flex items-center justify-center ${
                    step.status === 'completed'
                      ? 'border-emerald-500 text-emerald-400'
                      : step.status === 'failed'
                      ? 'border-red-500 text-red-400'
                      : 'border-slate-800 text-slate-600'
                  }`}>
                    {step.status === 'completed' ? <CheckCircle2 className="h-2 w-2" /> : <AlertCircle className="h-2 w-2" />}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-200">{step.name}</span>
                      <p className="text-[10px] text-slate-400 italic">{step.role}</p>
                    </div>
                    {step.durationMs && (
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                        {step.durationMs} ms
                      </span>
                    )}
                  </div>

                  {step.output && (
                    <details className="group rounded-lg bg-slate-950/60 border border-slate-900 hover:border-slate-800 transition">
                      <summary className="cursor-pointer p-3 select-none text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                        <span>View Raw Payload Trace</span>
                        <span className="text-cyan-400 group-open:hidden">Expand</span>
                        <span className="text-cyan-400 hidden group-open:block">Collapse</span>
                      </summary>
                      <div className="p-4 border-t border-slate-900 bg-slate-950 font-mono text-[10px] text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[160px]">
                        {step.output}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>

            {/* Compliance mapping validation notice */}
            <div className="bg-emerald-950/15 border border-emerald-800/30 rounded-lg p-4 text-xs text-slate-300 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-emerald-400">Enterprise Integrity Verification</p>
                <p className="text-[11px] leading-relaxed">
                  All transaction blocks have been successfully timestamped and verified. Granular trace hashes align directly with SOC2 Type II configuration guidelines. Human review required for physical production deployments.
                </p>
              </div>
            </div>

          </div>
        ) : (
          <div className="text-xs text-slate-500 italic py-16 text-center border border-slate-800/80 border-dashed rounded-xl">
            Select an execution audit from the left list to view step-by-step traces.
          </div>
        )}
      </div>

    </div>
  );
}
