export interface AgentStep {
  agentId: string;
  name: string;
  role: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  input?: string;
  output?: string;
  durationMs?: number;
}

export interface Execution {
  id: string;
  projectName: string;
  prompt: string;
  cloudProvider: 'AWS' | 'Azure' | 'GCP';
  status: 'running' | 'completed' | 'failed';
  createdAt: string;
  steps: AgentStep[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  cloudProvider: 'AWS' | 'Azure' | 'GCP';
  createdAt: string;
}

export interface DatabaseSchemaTable {
  name: string;
  description: string;
  columns: {
    name: string;
    type: string;
    constraints?: string;
    description: string;
  }[];
}

export interface PromptTemplate {
  agentName: string;
  role: string;
  systemInstruction: string;
  inputFormat: string;
  outputFormat: string;
}
