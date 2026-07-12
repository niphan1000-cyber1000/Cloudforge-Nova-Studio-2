import React, { useState, useEffect } from 'react';
import { Database, Terminal, Compass, ArrowRight, HelpCircle, Code2, Loader2, Table, Key, Info, Zap } from 'lucide-react';
import { DatabaseSchemaTable, PromptTemplate } from '../types';

export default function SpecsTab() {
  const [schemas, setSchemas] = useState<DatabaseSchemaTable[]>([]);
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTableIdx, setSelectedTableIdx] = useState(0);
  const [selectedPromptIdx, setSelectedPromptIdx] = useState(0);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
        <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
        <p className="text-xs font-mono">Loading Phase 2-3 Blueprint specs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn font-sans">
      
      {/* ROADMAP ACTION ADVICE IN THAI */}
      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.02] p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-cyan-500/10 p-2.5">
            <Compass className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-semibold">Development spec</span>
            <h2 className="text-lg font-bold text-white tracking-tight">ข้อเสนอแนะและขั้นตอนแรกสำหรับสัปดาห์ที่ 3 (Phase 2-3)</h2>
          </div>
        </div>

        <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-sans">
          ตามเอกสาร <strong>Phase 0 & Phase 1 Specification</strong> ที่วางเป็นแนวทาง และเป้าหมายการก้าวไปสู่สัปดาห์ที่ 3 ซึ่งครอบคลุมการออกแบบ <strong>Multi-Agent Architecture & System Architecture</strong> นี่คือ 3 ขั้นตอนแรกที่สถาปนิกคลาวด์และหัวหน้าฝ่าย DevOps แนะนำให้เริ่มลงมือทำทันที:
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          
          {/* STEP 1 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3 relative hover:border-cyan-500/30 transition">
            <div className="absolute top-4 right-4 text-2xs font-bold text-cyan-400/30 font-mono">STEP 01</div>
            <div className="inline-flex rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
              <Database className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-200">สร้าง Schema ฐานข้อมูล Audit Log</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              ติดตั้งโครงสร้าง PostgreSQL Schema (ตามรายละเอียดขวา) เชื่อมต่อแบบ Relation (Workspaces → Projects → Executions → Audit Logs) เพื่อให้มั่นใจได้ว่าระบบสามารถทำ Audit Trail ติดตามย้อนกลับการตัดสินใจของ AI ทุกขั้นตอน
            </p>
          </div>

          {/* STEP 2 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3 relative hover:border-cyan-500/30 transition">
            <div className="absolute top-4 right-4 text-2xs font-bold text-cyan-400/30 font-mono">STEP 02</div>
            <div className="inline-flex rounded-lg bg-sky-500/10 p-2 text-sky-400">
              <Terminal className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-200">ทำโครงสร้าง System Prompt เจาะจง</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              ร่างโครงสร้าง System Instructions และบังคับ Output Format ของ Agent โดยใช้ <strong>JSON Schema</strong> กำกับ เพื่อป้องกันปัญหา "Model Hallucination" และทำให้สถาปัตยกรรมที่ส่งต่อไปยัง Agent ถัดไปถูกต้องตามพิมพ์เขียว
            </p>
          </div>

          {/* STEP 3 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3 relative hover:border-cyan-500/30 transition">
            <div className="absolute top-4 right-4 text-2xs font-bold text-cyan-400/30 font-mono">STEP 03</div>
            <div className="inline-flex rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <Code2 className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-200">สร้าง Orchestrator State Machine</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              พัฒนา Core Sequence Orchestrator (ใน NestJS/Express) ที่รองรับ Stop Condition เมื่อ Agent ใดทำงานล้มเหลว เพื่อไม่ปล่อยโครงสร้างสถาปัตยกรรมที่ผิดพลาดผ่านไปยัง Agent ถัดไปตามกฎ <strong>Fail-Safe Orchestration</strong>
            </p>
          </div>

        </div>
      </div>

      {/* CORE SPECIFICATIONS INTERACTIVE AREA */}
      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* POSTGRESQL SCHEMA SPECIFICATIONS */}
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
                <p className="text-2xs text-slate-400 mt-1">{schemas[selectedTableIdx].description}</p>
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

        {/* AGENTS SYSTEM PROMPT BLUEPRINTS */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Terminal className="h-4 w-4 text-sky-400" /> Multi-Agent Prompt Specifications
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Gemini 3.5 System Prompt Drafts</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {prompts.map((p, idx) => (
              <button
                key={p.agentName}
                onClick={() => setSelectedPromptIdx(idx)}
                className={`rounded-lg py-1.5 px-1.5 text-[9px] font-bold border transition text-center truncate ${
                  selectedPromptIdx === idx
                    ? 'bg-sky-500/10 border-sky-500/50 text-sky-400'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title={p.agentName}
              >
                {p.agentName.split(' ')[0]}
              </button>
            ))}
          </div>

          {prompts[selectedPromptIdx] && (
            <div className="rounded-xl border border-slate-800 bg-[#121824]/40 p-5 space-y-5">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[9px] font-bold text-sky-400 uppercase tracking-wider">
                  <Zap className="h-2.5 w-2.5" /> Core Agent Blueprint
                </span>
                <h4 className="text-sm font-bold text-slate-200 mt-2 font-sans">{prompts[selectedPromptIdx].agentName}</h4>
                <p className="text-2xs text-slate-400 mt-0.5 leading-relaxed font-sans">{prompts[selectedPromptIdx].role}</p>
              </div>

              {/* System Instruction Panel */}
              <div className="space-y-1.5">
                <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider">System Instruction</div>
                <div className="rounded-lg bg-slate-950 p-3.5 border border-slate-800/80 font-mono text-[10px] text-slate-300 leading-relaxed">
                  {prompts[selectedPromptIdx].systemInstruction}
                </div>
              </div>

              {/* I/O Mapping */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Input Context</div>
                  <div className="rounded bg-slate-900/80 border border-slate-800 p-2 text-[10px] text-slate-400 leading-relaxed font-sans">
                    {prompts[selectedPromptIdx].inputFormat}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Output Format</div>
                  <div className="rounded bg-slate-900/80 border border-slate-800 p-2 text-[10px] text-slate-400 leading-relaxed font-sans">
                    {prompts[selectedPromptIdx].outputFormat}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
