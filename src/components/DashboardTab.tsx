import React from 'react';
import { Activity, Clock, ShieldCheck, Cpu, Code2, Server, Play, ArrowRight, Zap, Database } from 'lucide-react';

interface DashboardTabProps {
  onSelectPrompt: (prompt: string, cloud: 'AWS' | 'Azure' | 'GCP') => void;
  onNavigate: (tab: 'workspace' | 'specs') => void;
}

export default function DashboardTab({ onSelectPrompt, onNavigate }: DashboardTabProps) {
  const metrics = [
    {
      label: 'Average Design Time',
      value: '-85%',
      subtext: 'From 2 weeks down to 1.5 minutes',
      icon: Clock,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10',
    },
    {
      label: 'IaC Deployability',
      value: '94.2%',
      subtext: 'Terraform plan success rate',
      icon: Code2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
    },
    {
      label: 'Audit Trace Coverage',
      value: '100%',
      subtext: 'Granular log on every agent action',
      icon: ShieldCheck,
      color: 'text-sky-400',
      bgColor: 'bg-sky-400/10',
    },
    {
      label: 'Compliance Standard Score',
      value: '99.8%',
      subtext: 'Automatic CIS benchmark review',
      icon: Activity,
      color: 'text-violet-400',
      bgColor: 'bg-violet-400/10',
    }
  ];

  const quickStarts = [
    {
      title: 'Multi-Tier Web Portal',
      description: 'Highly available ALB, EC2 Auto Scaling, and multi-AZ Amazon RDS PostgreSQL database.',
      cloud: 'AWS' as const,
      prompt: 'Design a highly available and auto-scaling web application layout with an Application Load Balancer routing to an EC2 group in public subnets, and a private Multi-AZ RDS PostgreSQL database.',
      tags: ['Compute', 'Database', 'Networking', 'High Availability']
    },
    {
      title: 'Serverless Image Pipeline',
      description: 'Event-driven architecture utilizing object storage, serverless functions, and notification queues.',
      cloud: 'AWS' as const,
      prompt: 'Create a serverless architecture where users upload images to an S3 raw bucket, triggering an AWS Lambda function that processes/sizes the image, saves the metadata in DynamoDB, and sends an SNS notification.',
      tags: ['Serverless', 'Event-Driven', 'Microservices']
    },
    {
      title: 'Secure Enterprise VPC Network',
      description: 'Hardened corporate networking with isolated database subnets, NAT Gateways, and strict IAM controls.',
      cloud: 'AWS' as const,
      prompt: 'Generate a highly secured enterprise VPC with private subnets for DBs, restricted ingress/egress firewalls (Security Groups), single NAT gateway, and full encryption at rest/in transit using KMS.',
      tags: ['Security', 'VPC Networking', 'KMS Encryption']
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[radial-gradient(circle_at_top_right,_#0f172a,_#020617)] p-8 md:p-10">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-cyan-500/5 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-sky-500/5 blur-[100px]" />
        
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            <Zap className="h-3 w-3 fill-cyan-400/20" /> MVP Release: 5-Agent Suite
          </div>
          <h1 className="font-sans text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            CloudForge <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-400">Nova Studio</span>
          </h1>
          <p className="text-sm md:text-base text-slate-400 font-sans leading-relaxed">
            An advanced Multi-Agent AI system that orchestrates specialized agents to parse requirements, draft cloud topologies, harden security rules, and generate deployment-ready Terraform IaC in seconds.
          </p>
          <div className="pt-4 flex flex-wrap gap-4">
            <button
              onClick={() => onNavigate('workspace')}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-500 hover:shadow-lg hover:shadow-cyan-900/30 active:scale-[0.98]"
            >
              <Cpu className="h-4 w-4" /> Start Architecting <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onNavigate('specs')}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-900 hover:text-white"
            >
              <Database className="h-4 w-4" /> Review Phase 2-3 Specifications
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 space-y-3 shadow-sm hover:border-slate-700 transition">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{m.label}</span>
                <div className={`p-2 rounded-lg ${m.bgColor}`}>
                  <Icon className={`h-4 w-4 ${m.color}`} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold font-mono text-white">{m.value}</div>
                <div className="text-xs text-slate-500">{m.subtext}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Start Blueprints */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Server className="h-4 w-4 text-cyan-400" /> Start with a Template Blueprint
          </h2>
          <span className="text-xs text-slate-500">Click a card to load into workspace</span>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          {quickStarts.map((qs, idx) => (
            <div
              key={idx}
              onClick={() => onSelectPrompt(qs.prompt, qs.cloud)}
              className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/20 p-5 hover:border-cyan-500/50 hover:bg-gradient-to-b hover:from-[#121824]/60 hover:to-cyan-500/[0.01] transition duration-200 flex flex-col justify-between h-[210px]"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="inline-flex rounded-md bg-sky-950 px-2 py-0.5 text-2xs font-bold text-sky-400 border border-sky-800">
                    {qs.cloud}
                  </span>
                  <div className="text-slate-600 group-hover:text-cyan-400 transition">
                    <Play className="h-4 w-4 fill-current" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-200 group-hover:text-white">{qs.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed font-sans">{qs.description}</p>
              </div>
              
              <div className="flex flex-wrap gap-1 pt-3">
                {qs.tags.map((tag, tIdx) => (
                  <span key={tIdx} className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
