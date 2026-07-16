import React, { useState } from 'react';
import { Cpu, ShieldCheck, Server, Layers, ExternalLink, Menu, X } from 'lucide-react';
import DashboardTab from './components/DashboardTab';
import WorkspaceTab from './components/WorkspaceTab';
import AuditTab from './components/AuditTab';

type TabType = 'dashboard' | 'workspace' | 'audit';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // States passed from Dashboard templates to Workspace
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [selectedCloud, setSelectedCloud] = useState<'AWS' | 'Azure' | 'GCP'>('AWS');
  
  // Triggers reload of logs list when workspace completes a run
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSelectPrompt = (prompt: string, cloud: 'AWS' | 'Azure' | 'GCP') => {
    setSelectedPrompt(prompt);
    setSelectedCloud(cloud);
    setActiveTab('workspace');
  };

  const navItems = [
    { id: 'dashboard' as const, label: 'Overview Dashboard', icon: Layers },
    { id: 'workspace' as const, label: 'Orchestrator Workspace', icon: Cpu },
    { id: 'audit' as const, label: 'Audit Log & History', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-white">
      
      {/* GLOBAL HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-900/20">
              <div className="w-5 h-5 border-2 border-white/80 rounded-sm rotate-45 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-tight uppercase">
                CLOUDFORGE <span className="text-cyan-400 font-medium">NOVA STUDIO</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider">v1.0 • PHASE 01: ARCHITECTURE BLUEPRINT</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-slate-900 text-cyan-400 border border-slate-800 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* External Links / Session Indicator */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 border border-slate-700/80 rounded-full">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Workspace Active</span>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE NAVIGATION DROPDOWN */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-900 bg-slate-950 px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 rounded-lg px-4 py-2.5 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-slate-900 text-cyan-400 border border-slate-800'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-grow mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {activeTab === 'dashboard' && (
          <DashboardTab
            onSelectPrompt={handleSelectPrompt}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}
        
        {activeTab === 'workspace' && (
          <WorkspaceTab
            initialPrompt={selectedPrompt}
            initialCloud={selectedCloud}
            onExecutionCompleted={() => setRefreshTrigger((prev) => prev + 1)}
          />
        )}
        
        {activeTab === 'audit' && <AuditTab key={refreshTrigger} />}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 font-sans">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <p>© 2026 CloudForge Nova Studio. Enterprise-Grade Multi-Agent Architect Engine.</p>
          <div className="flex justify-center gap-4 text-[11px] font-semibold text-slate-400">
            <a href="#" className="hover:text-cyan-400 transition flex items-center gap-1">
              Architecture Guidelines <ExternalLink className="h-3 w-3" />
            </a>
            <span className="text-slate-800">|</span>
            <a href="#" className="hover:text-cyan-400 transition flex items-center gap-1">
              Enterprise Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
