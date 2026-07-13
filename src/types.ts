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
  id: string;
  agentName: string;
  group: 'Intake' | 'Design' | 'Generation' | 'Review' | 'Support' | 'Orchestration' | 'Service';
  status: 'Core' | 'Optional';
  purpose: string;
  responsibilities: string;
  inputFormat: string;
  outputFormat: string;
  memory: string;
  knowledge: string;
  promptScope: string;
  allowedTools: string;
  notAllowed: string;
  dependencies: string;
  successCriteria: string;
  stopCondition: string;
  retryPolicy: string;
  logging: string;
  version: string;
  owner: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  systemInstruction?: string;
}
