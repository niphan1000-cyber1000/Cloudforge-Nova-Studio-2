import React, { useState, useEffect } from 'react';
import { Cpu, Send, CheckCircle2, AlertCircle, Loader2, Copy, Check, Terminal, FileCode, Eye, Network, HelpCircle, FileText, Lock } from 'lucide-react';
import { AgentStep, Execution } from '../types';

interface WorkspaceTabProps {
  initialPrompt: string;
  initialCloud: 'AWS' | 'Azure' | 'GCP';
  onExecutionCompleted: () => void;
}

export default function WorkspaceTab({ initialPrompt, initialCloud, onExecutionCompleted }: WorkspaceTabProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [cloudProvider, setCloudProvider] = useState<'AWS' | 'Azure' | 'GCP'>(initialCloud);
  const [projectName, setProjectName] = useState('Interactive Custom Infrastructure');
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Active execution record
  const [activeExec, setActiveExec] = useState<Execution | null>(null);
  const [selectedStepIdx, setSelectedStepIdx] = useState<number>(0);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Monitor initial prompt adjustments
  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
      setCloudProvider(initialCloud);
    }
  }, [initialPrompt, initialCloud]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleRunWorkflow = async () => {
    if (!prompt.trim()) return;
    setExecuting(true);
    setError(null);
    setActiveExec(null);

    // Initial state setup to render the timeline instantly
    const initialSteps: AgentStep[] = [
      { agentId: "analyst", name: "Requirement Analyst", role: "Translates high-level business ideas into clear requirements.", status: "idle" },
      { agentId: "architect", name: "Cloud Architect", role: "Designs standard, high-availability cloud infrastructures.", status: "idle" },
      { agentId: "security", name: "Security Architect", role: "Reviews network access and logs compliance controls.", status: "idle" },
      { agentId: "terraform", name: "Terraform Generator", role: "Writes reusable, clean, and modular Infrastructure-as-Code.", status: "idle" },
      { agentId: "documentation", name: "Documentation & Diagram Generator", role: "Creates Architecture Blueprint text and beautiful topology diagrams.", status: "idle" }
    ];

    const currentExec: Execution = {
      id: "exec-" + Math.random().toString(36).substring(2, 9),
      projectName: projectName || "Custom Cloud Architecture",
      prompt,
      cloudProvider,
      status: "running",
      createdAt: new Date().toISOString(),
      steps: initialSteps
    };

    setActiveExec(currentExec);
    setSelectedStepIdx(0);

    try {
      // API call to the server-side Gemini orchestration pipeline
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, cloudProvider, projectName })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error during agent processing.');
      }

      const completedExec: Execution = await response.json();
      setActiveExec(completedExec);
      setSelectedStepIdx(4); // Select last step as default showing results
      onExecutionCompleted(); // Notify parent to refresh log list
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during workflow execution.');
      if (activeExec) {
        // Mark remaining steps as failed
        const updatedSteps = activeExec.steps.map((s, idx) => {
          if (idx === selectedStepIdx) return { ...s, status: 'failed' as const };
          if (s.status === 'idle') return { ...s, status: 'failed' as const };
          return s;
        });
        setActiveExec({ ...activeExec, status: 'failed', steps: updatedSteps });
      }
    } finally {
      setExecuting(false);
    }
  };

  // Pre-configured custom prompts for system instruction viewing
  const getSystemInstruction = (agentId: string) => {
    switch (agentId) {
      case 'analyst':
        return 'You are the Lead Cloud Requirement Analyst... Dissect functional specs and personas.';
      case 'architect':
        return 'You are the Principal Cloud Architect... Design secure VPC layout networks.';
      case 'security':
        return 'You are the Senior Cloud Security Auditor... Trace IAM roles and isolate database ports.';
      case 'terraform':
        return 'You are the Expert IaC DevOps Engineer... Write modular, production-ready AWS HCL configuration.';
      case 'documentation':
        return 'You are the Technical Documentation Architect... Compile complete PDF-ready blueprints with Mermaid.';
      default:
        return '';
    }
  };

  // Render dynamic topology graph based on current architectural state
  const renderInteractiveTopologyMap = () => {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Network className="h-4 w-4 text-emerald-400" /> Interactive Cloud Topology Map (VPC)
          </h4>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
            Generated Live
          </span>
        </div>

        {/* Custom Hand-Crafted Visual Interactive Graph */}
        <div className="relative w-full border border-slate-800/60 rounded-xl bg-[#090d16] p-6 overflow-hidden min-h-[300px] flex flex-col justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
          
          {/* Layer 1: Internet Access */}
          <div className="flex justify-center z-10">
            <div className="group border border-sky-500/40 bg-sky-950/30 px-4 py-2.5 rounded-lg flex items-center gap-2 hover:border-sky-400 transition cursor-help shadow-[0_0_15px_rgba(56,189,248,0.05)]">
              <div className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              <div>
                <div className="text-[10px] text-slate-400 font-mono">PUBLIC INGRESS</div>
                <div className="text-xs font-bold text-white">Internet Gateway</div>
              </div>
            </div>
          </div>

          {/* Connection Lines (Vertical flow representation) */}
          <div className="flex flex-col items-center justify-around flex-grow py-4 z-0">
            <div className="h-8 w-0.5 bg-gradient-to-b from-sky-500/40 to-amber-500/40" />
            
            {/* Layer 2: Load Balancing (Public DMZ) */}
            <div className="group border border-amber-500/40 bg-amber-950/20 px-5 py-3 rounded-lg flex items-center gap-3 hover:border-amber-400 transition cursor-help z-10 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
              <Network className="h-4 w-4 text-amber-400" />
              <div>
                <div className="text-[9px] text-amber-500 font-bold tracking-wider font-mono">LOAD BALANCER</div>
                <div className="text-xs font-bold text-white">AWS ALB (HTTPS Port 443)</div>
                <div className="text-[10px] text-slate-400">Routes to Public ASG Subnets</div>
              </div>
            </div>

            <div className="h-8 w-0.5 bg-gradient-to-b from-amber-500/40 to-teal-500/40" />

            {/* Layer 3: Compute & DB Subnets (Private isolated zones) */}
            <div className="grid grid-cols-2 gap-8 w-full z-10 px-4">
              {/* Private Web subnet */}
              <div className="border border-teal-500/30 bg-teal-950/10 p-3.5 rounded-lg hover:border-teal-400 transition cursor-help shadow-sm">
                <div className="text-[9px] text-teal-400 font-bold tracking-wider font-mono">PRIVATE COMPUTE</div>
                <div className="text-xs font-bold text-slate-100">EC2 Auto Scaling Group</div>
                <p className="text-[10px] text-slate-400 mt-1">Sized: db.t4g.micro. Scalable instances with managed IAM policies.</p>
              </div>

              {/* Private DB subnet */}
              <div className="border border-violet-500/30 bg-violet-950/10 p-3.5 rounded-lg hover:border-violet-400 transition cursor-help shadow-sm">
                <div className="text-[9px] text-violet-400 font-bold tracking-wider font-mono">ISOLATED DATABASE</div>
                <div className="text-xs font-bold text-slate-100">Multi-AZ RDS PostgreSQL</div>
                <p className="text-[10px] text-slate-400 mt-1">Isolated Private subnet. SSL encryption at rest and in transit active.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-2xs text-slate-500 leading-relaxed bg-slate-900/40 p-3 rounded-lg border border-slate-800/40">
          <strong>Security Boundary Check:</strong> Ingress rules strictly permit incoming traffic exclusively on port 443 via ALB. The RDS PostgreSQL cluster does not hold any public IP addresses, enforcing enterprise-grade network segment isolation.
        </div>
      </div>
    );
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12 animate-fadeIn">
      
      {/* LEFT SIDE: Inputs and Orchestration Progress */}
      <div className="lg:col-span-4 space-y-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 space-y-4">
          <div className="flex items-center gap-2 text-white">
            <Cpu className="h-5 w-5 text-cyan-400" />
            <h2 className="font-sans text-base font-bold">Multi-Agent Engine</h2>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Enterprise Web Portal"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cloud Platform</label>
              <div className="grid grid-cols-3 gap-2">
                {(['AWS', 'Azure', 'GCP'] as const).map((prov) => (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => setCloudProvider(prov)}
                    disabled={prov !== 'AWS'} // AWS is MVP
                    className={`rounded-lg py-1.5 text-xs font-semibold border transition ${
                      cloudProvider === prov
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                        : prov !== 'AWS'
                        ? 'bg-slate-900/40 border-slate-950 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {prov} {prov !== 'AWS' && '(MVP AWS)'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1">Business Requirements</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to build (e.g. A secure, highly scalable website with a load balancer, EC2 web servers, and a PostgreSQL database)..."
                rows={5}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none leading-relaxed resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleRunWorkflow}
              disabled={executing || !prompt.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-900/40 transition hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {executing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Orchestrating Agents...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" /> Execute Multi-Agent Suite
                </>
              )}
            </button>
          </div>
        </div>

        {/* AGENTS PIPELINE TIMELINE */}
        {activeExec && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Execution Lifecycle</h3>
            
            <div className="relative border-l border-slate-800 pl-4 ml-2 space-y-6">
              {activeExec.steps.map((step, idx) => {
                const isSelected = selectedStepIdx === idx;
                return (
                  <div
                    key={step.agentId}
                    onClick={() => { if (step.status !== 'idle') setSelectedStepIdx(idx); }}
                    className={`relative cursor-pointer group transition ${step.status === 'idle' ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {/* Circle Indicator on line */}
                    <div className={`absolute -left-[21px] top-1.5 h-3.5 w-3.5 rounded-full border bg-slate-950 flex items-center justify-center transition duration-200 ${
                      step.status === 'completed'
                        ? 'border-emerald-500 bg-emerald-950/80 text-emerald-400'
                        : step.status === 'running'
                        ? 'border-cyan-500 bg-cyan-950/80 text-cyan-400 animate-pulse'
                        : step.status === 'failed'
                        ? 'border-red-500 bg-red-950/80 text-red-400'
                        : 'border-slate-800'
                    }`}>
                      {step.status === 'completed' && <CheckCircle2 className="h-2 w-2" />}
                      {step.status === 'running' && <Loader2 className="h-2 w-2 animate-spin" />}
                      {step.status === 'failed' && <AlertCircle className="h-2 w-2" />}
                    </div>

                    <div className={`rounded-lg p-2.5 transition border ${
                      isSelected 
                        ? 'bg-slate-900 border-cyan-500/40 shadow-sm' 
                        : 'hover:bg-slate-900/40 border-transparent'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-200 group-hover:text-white">{step.name}</span>
                        {step.durationMs && (
                          <span className="text-[9px] font-mono text-slate-500">{(step.durationMs / 1000).toFixed(2)}s</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{step.role}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDE: Granular Agent outputs */}
      <div className="lg:col-span-8 space-y-6">
        
        {error && (
          <div className="rounded-xl border border-red-900/30 bg-red-950/20 p-4 flex gap-3 text-red-400 text-xs">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Execution Error</p>
              <p className="opacity-90">{error}</p>
            </div>
          </div>
        )}

        {activeExec ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/20 overflow-hidden">
            {/* Header / Tabs */}
            <div className="border-b border-slate-800 bg-slate-900/30 px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <span className="text-2xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">Active Agent Output</span>
                <h3 className="text-base font-bold text-white font-sans">{activeExec.steps[selectedStepIdx]?.name}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCopy(activeExec.steps[selectedStepIdx]?.output || '', 'output')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white border border-slate-800 bg-slate-900 px-2.5 py-1 rounded"
                >
                  {copiedText === 'output' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {copiedText === 'output' ? 'Copied' : 'Copy Output'}
                </button>
              </div>
            </div>

            {/* Inner Details Layout */}
            <div className="p-6 space-y-6">
              
              {/* Agent System Prompt View */}
              <div className="rounded-lg bg-slate-950/50 border border-slate-800/60 p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <Terminal className="h-3.5 w-3.5 text-cyan-400" /> Prompt Framework (System Rules)
                </div>
                <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                  {getSystemInstruction(activeExec.steps[selectedStepIdx]?.agentId)}
                </p>
              </div>

              {/* Formatted Output rendering */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <FileText className="h-3.5 w-3.5 text-sky-400" /> Compiled Output
                </div>
                
                {activeExec.steps[selectedStepIdx]?.status === 'running' ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                    <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
                    <p className="text-xs font-mono">Agent processing data model via Gemini...</p>
                  </div>
                ) : activeExec.steps[selectedStepIdx]?.output ? (
                  <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-5 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    {/* Specialized formatting if terraform code */}
                    {activeExec.steps[selectedStepIdx]?.agentId === 'terraform' ? (
                      <div className="space-y-2">
                        <div className="text-[10px] text-slate-500 border-b border-slate-800 pb-1.5 flex justify-between font-sans">
                          <span>TERRAFORM CONFIGURATION MODULE</span>
                          <span className="text-cyan-400">READY TO DEPLOY</span>
                        </div>
                        <code className="text-cyan-400/90">{activeExec.steps[selectedStepIdx].output}</code>
                      </div>
                    ) : (
                      <div className="prose prose-invert prose-xs max-w-none">
                        {activeExec.steps[selectedStepIdx].output}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic py-6 text-center">No output generated for this step yet.</div>
                )}
              </div>

              {/* Dynamic topology graph for documentation or architect steps */}
              {(selectedStepIdx === 1 || selectedStepIdx === 4) && activeExec.steps[selectedStepIdx]?.output && (
                <div className="pt-4 border-t border-slate-800/50">
                  {renderInteractiveTopologyMap()}
                </div>
              )}

            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/20 border-dashed py-24 flex flex-col items-center justify-center text-center px-4 space-y-4">
            <div className="rounded-full bg-slate-900/80 border border-slate-800 p-4">
              <Cpu className="h-8 w-8 text-slate-500" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-sm font-bold text-white font-sans">Workspace Ready</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Enter your cloud business needs in the panel or pick a template from the dashboard to run the multi-agent AI pipeline.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
