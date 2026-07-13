import React, { useState, useEffect } from 'react';
import { 
  Database, Terminal, Compass, ArrowRight, Code2, Loader2, Table, Key, 
  Info, Zap, Shield, Users, Layers, Activity, FileText, Settings, 
  Sparkles, Filter, CheckCircle2, AlertTriangle, RefreshCw
} from 'lucide-react';
import { DatabaseSchemaTable, PromptTemplate } from '../types';

export default function SpecsTab() {
  const [schemas, setSchemas] = useState<DatabaseSchemaTable[]>([]);
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTableIdx, setSelectedTableIdx] = useState(0);
  const [selectedPromptIdx, setSelectedPromptIdx] = useState(0);
  
  // Interactive Filter States
  const [statusFilter, setStatusFilter] = useState<'All' | 'Core' | 'Optional'>('All');
  const [groupFilter, setGroupFilter] = useState<string>('All');

  useEffect(() => {
    async function loadSpecs() {
      try {
        const [schemaRes, promptRes] = await Promise.all([
          fetch('/api/schema-specs'),
          fetch('/api/prompt-specs')
        ]);
        if (schemaRes.ok && promptRes.ok) {
          const schemaData = await schemaRes.json();
          const promptData = await promptRes.json();
          setSchemas(schemaData);
          setPrompts(promptData);
        }
      } catch (err) {
        console.error('Failed to load specifications:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSpecs();
  }, []);

  // Filter logic for 16-Agents Catalog
  const filteredPrompts = prompts.filter(p => {
    const matchStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchGroup = groupFilter === 'All' || p.group === groupFilter;
    return matchStatus && matchGroup;
  });

  // Ensure active selected prompt is valid post-filter
  const activePrompt = filteredPrompts[selectedPromptIdx] || filteredPrompts[0] || prompts[0];

  const groups = ['All', 'Intake', 'Design', 'Generation', 'Review', 'Support', 'Orchestration', 'Service'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
        <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
        <p className="text-xs font-mono">Loading Phase 2 Blueprint specs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn font-sans pb-12">
      
      {/* PHASE 2 OVERVIEW COMPASS */}
      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.02] p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cyan-500/10 p-2.5">
              <Compass className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-semibold">Development spec — Phase 2</span>
              <h2 className="text-lg font-bold text-white tracking-tight">สถาปัตยกรรมแบบ Multi-Agent และการประสานงานระบบ (Phase 2-3)</h2>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-xs font-mono text-cyan-400 font-semibold">
              v1.0.0
            </span>
            <span className="rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-mono text-slate-300">
              PostgreSQL Enabled
            </span>
          </div>
        </div>

        <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-5xl font-sans">
          ตามข้อกำหนดของ <strong>Phase 2 — Multi-Agent Architecture</strong> ระบบจะทำงานร่วมกันผ่าน AI Agent เฉพาะทางทั้งหมด <strong>16 ตัว</strong> ซึ่งแบ่งขอบเขตความเชี่ยวชาญอย่างชัดเจน (Network, IAM, Costs, Security) แทนที่จะรันโมเดลขนาดใหญ่ตัวเดียว เพื่อป้องกันความซ้ำซ้อน ลดความเสี่ยงในการคำนวณสถาปัตยกรรมคลาวด์ และรับประกันความน่าเชื่อถือผ่าน <strong>Workflow Orchestrator (AG015)</strong> และการทำ Semantic Search จากฐานข้อมูลความรู้ <strong>Knowledge Retrieval (AG016)</strong>
        </p>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-2">
            <div className="text-xs font-bold text-cyan-400 font-mono">1. MULTI-AGENT OVERVIEW</div>
            <p className="text-3xs text-slate-400 leading-relaxed">
              แบ่งกลุ่มความรับผิดชอบออกเป็น Intake, Design, Generation, Review, Support, Orchestration และ Service เพื่อตอบโจทย์ความถูกต้อง
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-2">
            <div className="text-xs font-bold text-sky-400 font-mono">2. PRINCIPLE OF LEAST CONTEXT</div>
            <p className="text-3xs text-slate-400 leading-relaxed">
              จำกัดขอบเขตหน่วยความจำ (Memory Scope) และเครื่องมือ (Allowed Tools) ของ Agent แต่ละตัวให้เหมาะสมที่สุดเพื่อรักษาความปลอดภัยและลด Token Usage
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-2">
            <div className="text-xs font-bold text-emerald-400 font-mono">3. FAIL-SAFE DESIGN</div>
            <p className="text-3xs text-slate-400 leading-relaxed">
              มี Stop Condition และ Retry Policy ชัดเจน หากทำงานล้มเหลวจะหยุดระบบและส่งคืนข้อผิดพลาดมาตรฐานแก่ Orchestrator
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-2">
            <div className="text-xs font-bold text-purple-400 font-mono">4. INTERACTION CONTRACT</div>
            <p className="text-3xs text-slate-400 leading-relaxed">
              การเชื่อมโยงสื่อสารระหว่าง Agent ดำเนินการผ่าน Message Schema มาตรฐาน (ID, Status, Payload, Error) คุ้มครองความต่อเนื่องของข้อมูล
            </p>
          </div>
        </div>
      </div>

      {/* 16-AGENTS CATALOG & DETAILED EXPLORER */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-800 gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-400" /> 16-Agent Complete Catalog (AG001 — AG016)
            </h3>
            <p className="text-2xs text-slate-400">สำรวจและศึกษาโครงสร้างและหน้าที่ของสถาปนิกปัญญาประดิษฐ์ทั้ง 16 ตัวอย่างเป็นทางการ</p>
          </div>

          {/* Interactive Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-lg p-1">
              <button
                onClick={() => setStatusFilter('All')}
                className={`rounded px-2.5 py-1 text-3xs font-bold transition ${
                  statusFilter === 'All' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => setStatusFilter('Core')}
                className={`rounded px-2.5 py-1 text-3xs font-bold transition ${
                  statusFilter === 'Core' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Core
              </button>
              <button
                onClick={() => setStatusFilter('Optional')}
                className={`rounded px-2.5 py-1 text-3xs font-bold transition ${
                  statusFilter === 'Optional' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Optional
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-lg p-1">
              <Filter className="h-3 w-3 text-slate-500 ml-1.5" />
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="bg-transparent text-3xs font-bold text-slate-400 focus:outline-none border-none py-0.5 pr-2"
              >
                {groups.map(g => (
                  <option key={g} value={g} className="bg-slate-900 text-slate-300">
                    {g === 'All' ? 'All Groups' : g}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* Agent selection sidebar list */}
          <div className="lg:col-span-4 space-y-2 max-h-[560px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredPrompts.map((p, idx) => {
              const isSelected = activePrompt?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    const originalIdx = filteredPrompts.findIndex(item => item.id === p.id);
                    setSelectedPromptIdx(originalIdx !== -1 ? originalIdx : 0);
                  }}
                  className={`w-full text-left rounded-xl border p-3.5 transition flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-cyan-500/[0.04] border-cyan-500/50 shadow-md shadow-cyan-950/10'
                      : 'bg-slate-900/10 border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/20'
                  }`}
                >
                  <div className="space-y-1 truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-cyan-400">{p.id}</span>
                      <h4 className="text-xs font-bold text-slate-100 truncate">{p.agentName}</h4>
                    </div>
                    <p className="text-3xs text-slate-400 truncate">{p.purpose}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      p.status === 'Core' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {p.status}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">{p.group}</span>
                  </div>
                </button>
              );
            })}
            {filteredPrompts.length === 0 && (
              <div className="text-center py-12 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No agents match the selected filter parameters.
              </div>
            )}
          </div>

          {/* Detailed Bento Spec panel */}
          {activePrompt && (
            <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-900/15 p-6 space-y-6">
              
              {/* Header block */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                      {activePrompt.id}
                    </span>
                    <h4 className="text-base font-bold text-white tracking-tight">{activePrompt.agentName}</h4>
                    <span className={`text-3xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      activePrompt.priority === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                      activePrompt.priority === 'High' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {activePrompt.priority}
                    </span>
                  </div>
                  <p className="text-2xs text-slate-400">Managed by: <span className="text-slate-300 font-semibold">{activePrompt.owner}</span> | Version: {activePrompt.version}</p>
                </div>
                
                <div className="flex gap-2">
                  <span className="rounded-full bg-cyan-500/5 border border-cyan-500/20 px-2.5 py-1 text-3xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                    {activePrompt.group} Agent
                  </span>
                </div>
              </div>

              {/* Purpose & Responsibilities */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-800/60 bg-slate-950/30 p-4 space-y-1">
                  <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest font-bold block">1. Purpose (จุดประสงค์)</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{activePrompt.purpose}</p>
                </div>
                <div className="rounded-xl border border-slate-800/60 bg-slate-950/30 p-4 space-y-1">
                  <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest font-bold block">2. Responsibilities (หน้าที่หลัก)</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{activePrompt.responsibilities}</p>
                </div>
              </div>

              {/* Core I/O & Memory Specifications */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-800/40 bg-slate-950/10 p-4 space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block font-bold">3. Input Format</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{activePrompt.inputFormat}</p>
                </div>
                <div className="rounded-xl border border-slate-800/40 bg-slate-950/10 p-4 space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block font-bold">4. Output Format</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{activePrompt.outputFormat}</p>
                </div>
                <div className="rounded-xl border border-slate-800/40 bg-slate-950/10 p-4 space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block font-bold">5. Memory Scope</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{activePrompt.memory}</p>
                </div>
              </div>

              {/* Advanced Operational Guardrails */}
              <div className="space-y-4">
                <h5 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Operational Guardrails & Policies</h5>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Allowed Tools
                    </div>
                    <p className="text-2xs text-slate-400 leading-relaxed">{activePrompt.allowedTools}</p>
                  </div>

                  <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                      <AlertTriangle className="h-4 w-4 text-red-400" /> STRICTLY PROHIBITED (ข้อห้าม)
                    </div>
                    <p className="text-2xs text-slate-400 leading-relaxed">{activePrompt.notAllowed}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 text-2xs">
                  <div className="border border-slate-800/40 p-3.5 rounded-lg space-y-1 bg-slate-950/10">
                    <span className="text-slate-500 font-mono uppercase tracking-wider">Dependencies</span>
                    <p className="text-slate-300 font-sans leading-relaxed">{activePrompt.dependencies}</p>
                  </div>
                  <div className="border border-slate-800/40 p-3.5 rounded-lg space-y-1 bg-slate-950/10">
                    <span className="text-slate-500 font-mono uppercase tracking-wider">Retry Policy</span>
                    <p className="text-slate-300 font-sans leading-relaxed">{activePrompt.retryPolicy}</p>
                  </div>
                  <div className="border border-slate-800/40 p-3.5 rounded-lg space-y-1 bg-slate-950/10">
                    <span className="text-slate-500 font-mono uppercase tracking-wider">Stop Condition</span>
                    <p className="text-slate-300 font-sans leading-relaxed">{activePrompt.stopCondition}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 text-2xs">
                  <div className="border border-slate-800/40 p-3.5 rounded-lg space-y-1 bg-slate-950/10">
                    <span className="text-slate-500 font-mono uppercase tracking-wider">Prompt Scope Limit</span>
                    <p className="text-slate-300 font-sans leading-relaxed">{activePrompt.promptScope}</p>
                  </div>
                  <div className="border border-slate-800/40 p-3.5 rounded-lg space-y-1 bg-slate-950/10">
                    <span className="text-slate-500 font-mono uppercase tracking-wider">Knowledge Source</span>
                    <p className="text-slate-300 font-sans leading-relaxed">{activePrompt.knowledge}</p>
                  </div>
                  <div className="border border-slate-800/40 p-3.5 rounded-lg space-y-1 bg-slate-950/10">
                    <span className="text-slate-500 font-mono uppercase tracking-wider">Success Criteria</span>
                    <p className="text-slate-300 font-sans leading-relaxed">{activePrompt.successCriteria}</p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* CORE AGENT CAPABILITY MATRIX */}
      <div className="space-y-4">
        <div className="pb-2 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-400" /> Agent Capability Matrix (ความสอดคล้องสถาปัตยกรรม)
          </h3>
          <p className="text-2xs text-slate-400">เปรียบเทียบขีดความสามารถเพื่อแยกประเภทความรับผิดชอบอย่างโปร่งใสตามข้อกำหนด 2.4.10</p>
        </div>

        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/30">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-left">
              <thead className="bg-slate-900/60 font-mono text-[9px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-extrabold text-slate-200">ID / Agent Name</th>
                  <th className="px-3 py-3 text-center">Requirements</th>
                  <th className="px-3 py-3 text-center">Architecture</th>
                  <th className="px-3 py-3 text-center">Generate IaC</th>
                  <th className="px-3 py-3 text-center">Review Security</th>
                  <th className="px-3 py-3 text-center">Docs & Diagrams</th>
                  <th className="px-3 py-3 text-center">Estimate Cost</th>
                  <th className="px-3 py-3 text-center">Manage IAM</th>
                  <th className="px-3 py-3 text-center">Audit Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-[10px] font-sans text-slate-300">
                {[
                  { id: 'AG001', name: 'Requirement Analyst', capabilities: [true, false, false, false, false, false, false, false] },
                  { id: 'AG002', name: 'Cloud Architect', capabilities: [true, true, false, false, false, false, false, false] },
                  { id: 'AG003', name: 'Solution Architect', capabilities: [false, true, false, false, false, false, false, false] },
                  { id: 'AG004', name: 'Network Architect', capabilities: [false, true, false, false, false, false, false, false] },
                  { id: 'AG005', name: 'Security Architect', capabilities: [false, true, false, true, false, false, false, false] },
                  { id: 'AG006', name: 'IAM Specialist', capabilities: [false, false, false, true, false, false, true, false] },
                  { id: 'AG007', name: 'Terraform Generator', capabilities: [false, false, true, false, false, false, false, false] },
                  { id: 'AG008', name: 'Documentation Generator', capabilities: [false, false, false, false, true, false, false, false] },
                  { id: 'AG009', name: 'Architecture Reviewer', capabilities: [false, false, false, true, false, false, false, false] },
                  { id: 'AG010', name: 'FinOps Analyst', capabilities: [false, false, false, false, false, true, false, false] },
                  { id: 'AG011', name: 'Kubernetes Specialist', capabilities: [false, false, true, false, false, false, false, false] },
                  { id: 'AG013', name: 'Compliance Auditor', capabilities: [false, false, false, true, false, false, false, true] },
                  { id: 'AG014', name: 'Diagram Generator', capabilities: [false, false, false, false, true, false, false, false] },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/10 transition">
                    <td className="px-4 py-3 font-semibold text-slate-200">
                      <span className="font-mono text-cyan-400 mr-2">{row.id}</span>
                      {row.name}
                    </td>
                    {row.capabilities.map((hasCap, cIdx) => (
                      <td key={cIdx} className="px-3 py-3 text-center">
                        {hasCap ? (
                          <span className="inline-flex items-center justify-center rounded bg-cyan-900/40 border border-cyan-500/20 px-1.5 py-0.5 text-[9px] font-mono font-bold text-cyan-400">
                            ✓
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SYSTEM COMMUNICATION & INTERACTION CONTRACT */}
      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* AGENT INTERACTION CONTRACT */}
        <div className="lg:col-span-6 space-y-4">
          <div className="pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Terminal className="h-4 w-4 text-sky-400" /> 2.4.11 Agent Interaction Contract
            </h3>
            <p className="text-2xs text-slate-400">แบบสัญญาและลักษณะการส่งข้อมูลความปลอดภัยระหว่าง Agent (Message Schema)</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#121824]/40 p-5 space-y-4">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
              JSON SCHEMA CONTRACT
            </span>

            <div className="rounded-lg bg-slate-950 p-4 border border-slate-900 font-mono text-[10px] text-slate-300 leading-relaxed overflow-x-auto">
{`{
  "message_id": "string (UUID)",
  "workflow_id": "string (UUID)",
  "from_agent": "string (Agent ID, e.g. AG001)",
  "to_agent": "string (Agent ID, e.g. AG002)",
  "task_type": "string (e.g. analyze_requirement)",
  "status": "Pending | Running | Completed | Failed",
  "payload": {
    "business_goals": [],
    "constraints": {},
    "resources": []
  },
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "error": {
    "error_code": "string",
    "error_message": "string",
    "retry_count": 0,
    "fallback_action": "string"
  }
}`}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-2xs">
              <div className="p-3 bg-slate-950/40 rounded border border-slate-800/80 space-y-1">
                <span className="font-mono text-cyan-400 font-bold block">Status Enum</span>
                <p className="text-slate-400 font-sans leading-relaxed">
                  <strong>Completed:</strong> ประมวลผลสำเร็จพร้อมส่งต่อ<br />
                  <strong>Failed:</strong> ตรวจไม่สำเร็จหลัง retry ครบตามนโยบาย
                </p>
              </div>
              <div className="p-3 bg-slate-950/40 rounded border border-slate-800/80 space-y-1">
                <span className="font-mono text-cyan-400 font-bold block">Error Handlers</span>
                <p className="text-slate-400 font-sans leading-relaxed">
                  Orchestrator จะใช้ฟิลด์ error ในการตรวจสอบ retry, การ fallback, หรือการบังคับยกเลิก workflow ทั้งหมด
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* POSTGRESQL DATABASE SCHEMA SPECIFICATIONS */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Database className="h-4 w-4 text-cyan-400" /> PostgreSQL Database Schema (Audit Trail)
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Drizzle / Prisma Compatible</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {schemas.map((s, idx) => (
              <button
                key={s.name}
                onClick={() => setSelectedTableIdx(idx)}
                className={`rounded-lg py-1.5 px-2.5 text-3xs font-bold border transition text-center ${
                  selectedTableIdx === idx
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                    : 'bg-[#121824]/40 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {schemas[selectedTableIdx] && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <Table className="h-4 w-4 text-sky-400" /> Table: <span className="text-cyan-400 font-mono">{schemas[selectedTableIdx].name}</span>
                </h4>
                <p className="text-2xs text-slate-400 mt-1 leading-relaxed">{schemas[selectedTableIdx].description}</p>
              </div>

              <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60">
                <table className="min-w-full divide-y divide-slate-800 text-left">
                  <thead className="bg-slate-900/60">
                    <tr>
                      <th className="px-3.5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Column</th>
                      <th className="px-3.5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</th>
                      <th className="px-3.5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-[10px] text-slate-300">
                    {schemas[selectedTableIdx].columns.map((col, cIdx) => (
                      <tr key={cIdx} className="hover:bg-slate-900/20 transition">
                        <td className="px-3.5 py-2.5 font-bold text-slate-200 flex items-center gap-1.5">
                          {col.constraints?.includes('PRIMARY KEY') && <Key className="h-3 w-3 text-cyan-400" />}
                          {col.constraints?.includes('REFERENCES') && <Key className="h-3 w-3 text-sky-500" />}
                          {col.name}
                        </td>
                        <td className="px-3.5 py-2.5 text-cyan-400/95">
                          {col.type}
                          {col.constraints && (
                            <span className="block text-[9px] text-slate-500 font-sans mt-0.5">{col.constraints}</span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-400 font-sans leading-relaxed">{col.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
