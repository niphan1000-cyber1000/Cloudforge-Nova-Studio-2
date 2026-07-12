import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { AgentStep, Execution, DatabaseSchemaTable, PromptTemplate } from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// In-memory store for executions (Audit Logs)
const executionsStore: Execution[] = [
  {
    id: "exec-1",
    projectName: "E-Commerce Web Portal",
    prompt: "Highly scalable, secure web app with a load balancer, Auto Scaling group, and PostgreSQL DB on AWS.",
    cloudProvider: "AWS",
    status: "completed",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    steps: [
      {
        agentId: "analyst",
        name: "Requirement Analyst",
        role: "Translates high-level business ideas into clear, functional system requirements.",
        status: "completed",
        input: "Highly scalable, secure web app with a load balancer, Auto Scaling group, and PostgreSQL DB on AWS.",
        output: "### Functional Requirements\n- Publicly accessible Web Interface over HTTPS.\n- Dynamic Scaling based on traffic demand.\n- Persistent and ACID-compliant storage for transactions.\n\n### Non-Functional Requirements\n- **Scalability**: Target response time < 200ms at peak.\n- **Availability**: 99.9% uptime design target.\n- **Security**: Principle of Least Privilege, isolated database network tier.",
        durationMs: 850
      },
      {
        agentId: "architect",
        name: "Cloud Architect",
        role: "Designs standard, high-availability multi-tier cloud infrastructures.",
        status: "completed",
        input: "Functional spec mapping to AWS: Web Portal, Scalable tiers, PostgreSQL DB.",
        output: "### High-Level Cloud Architecture (AWS)\n- **VPC Configuration**: CIDR `10.0.0.0/16` with 2 Public Subnets and 2 Private Subnets across 2 Availability Zones.\n- **Compute Tier**: Application Load Balancer (ALB) routing to an Auto Scaling Group (ASG) of EC2 instances running Node.js.\n- **Database Tier**: Multi-AZ Amazon RDS PostgreSQL instance placed securely in Private Subnets.",
        durationMs: 1420
      },
      {
        agentId: "security",
        name: "Security Architect",
        role: "Reviews network access, IAM guidelines, and logs compliance controls.",
        status: "completed",
        input: "Cloud Architecture Layout (ALB -> EC2 ASG -> Multi-AZ RDS Postgres).",
        output: "### Security Controls & Compliance Guidelines\n- **Network Isolation**: RDS Security Group only allows ingress from EC2 Security Group on Port 5432.\n- **Data Protection**: AWS KMS encryption enabled at-rest for RDS and EBS volumes. SSL/TLS enforced in-transit.\n- **IAM Roles**: EC2 instances assume an IAM Role with minimum permissions (AmazonSSMManagedInstanceCore).\n- **Compliance Mapping**: SSL enforcement aligns with PCI-DSS Req 4.1; audit logging matches SOC2 CC6.",
        durationMs: 1100
      },
      {
        agentId: "terraform",
        name: "Terraform Generator",
        role: "Writes reusable, clean, and modular Infrastructure-as-Code.",
        status: "completed",
        input: "AWS multi-tier layout + isolated security group rules + IAM policies.",
        output: "```hcl\n# AWS Provider Configuration\nprovider \"aws\" {\n  region = \"us-east-1\"\n}\n\n# VPC and Networking\nresource \"aws_vpc\" \"main\" {\n  cidr_block           = \"10.0.0.0/16\"\n  enable_dns_hostnames = true\n  tags = {\n    Name = \"cloudforge-vpc\"\n  }\n}\n\n# Application Load Balancer\nresource \"aws_lb\" \"web_alb\" {\n  name               = \"web-alb\"\n  internal           = false\n  load_balancer_type = \"application\"\n  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]\n}\n\n# RDS PostgreSQL DB\nresource \"aws_db_instance\" \"postgres\" {\n  allocated_storage      = 20\n  engine                 = \"postgres\"\n  engine_version         = \"15.4\"\n  instance_class         = \"db.t4g.micro\"\n  db_name                = \"cloudforge_db\"\n  username               = \"dbadmin\"\n  password               = var.db_password\n  db_subnet_group_name   = aws_db_subnet_group.db_subnets.name\n  vpc_security_group_ids = [aws_security_group.db_sg.id]\n  storage_encrypted      = true\n  multi_az               = true\n  skip_final_snapshot    = true\n}\n```",
        durationMs: 1980
      },
      {
        agentId: "documentation",
        name: "Documentation & Diagram Generator",
        role: "Creates Architecture Blueprint text and beautiful topology diagrams.",
        status: "completed",
        input: "All prior architecture decisions + generated Terraform source.",
        output: "### Project Architecture Blueprint: E-Commerce Web Portal\nThis blueprint specifies a 3-tier high-availability infrastructure on AWS.\n\n```mermaid\ngraph TD\n    Internet((Internet)) --> ALB[Application Load Balancer]\n    subgraph Public Subnets\n        ALB --> EC2_A[EC2 Instance AZ-A]\n        ALB --> EC2_B[EC2 Instance AZ-B]\n    end\n    subgraph Private Subnets\n        EC2_A --> RDS[(RDS PostgreSQL Multi-AZ)]\n        EC2_B --> RDS\n    end\n    style Internet fill:#f9f,stroke:#333,stroke-width:2px\n    style ALB fill:#bbf,stroke:#333,stroke-width:2px\n    style RDS fill:#bfb,stroke:#333,stroke-width:2px\n```",
        durationMs: 1250
      }
    ]
  }
];

// Lazy Gemini Client Initialization Pattern
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please configure it in the Secrets panel in AI Studio.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// REST API for Executions History
app.get("/api/executions", (req, res) => {
  res.json(executionsStore);
});

// Detail schema specifications representing PostgreSQL Database design for storing Audit Logs
app.get("/api/schema-specs", (req, res) => {
  const schemas: DatabaseSchemaTable[] = [
    {
      name: "workspaces",
      description: "Stores Workspace organizational boundaries (tenants, teams).",
      columns: [
        { name: "id", type: "UUID", constraints: "PRIMARY KEY, DEFAULT gen_random_uuid()", description: "Unique workspace identifier." },
        { name: "name", type: "VARCHAR(255)", constraints: "NOT NULL", description: "Display name of the workspace." },
        { name: "slug", type: "VARCHAR(255)", constraints: "NOT NULL, UNIQUE", description: "URL friendly workspace slug." },
        { name: "created_at", type: "TIMESTAMP WITH TIME ZONE", constraints: "DEFAULT NOW()", description: "Creation timestamp." }
      ]
    },
    {
      name: "projects",
      description: "Stores system architectures or projects belonging to a Workspace.",
      columns: [
        { name: "id", type: "UUID", constraints: "PRIMARY KEY, DEFAULT gen_random_uuid()", description: "Unique project identifier." },
        { name: "workspace_id", type: "UUID", constraints: "NOT NULL, REFERENCES workspaces(id) ON DELETE CASCADE", description: "Belonging workspace." },
        { name: "name", type: "VARCHAR(255)", constraints: "NOT NULL", description: "Name of the project cloud system." },
        { name: "description", type: "TEXT", description: "Description or business objectives." },
        { name: "cloud_provider", type: "VARCHAR(50)", constraints: "NOT NULL", description: "AWS, Azure, or GCP." },
        { name: "created_at", type: "TIMESTAMP WITH TIME ZONE", constraints: "DEFAULT NOW()", description: "Creation timestamp." }
      ]
    },
    {
      name: "executions",
      description: "Represents a single automated Multi-Agent generation run.",
      columns: [
        { name: "id", type: "UUID", constraints: "PRIMARY KEY, DEFAULT gen_random_uuid()", description: "Unique run identifier." },
        { name: "project_id", type: "UUID", constraints: "NOT NULL, REFERENCES projects(id) ON DELETE CASCADE", description: "The project context." },
        { name: "user_prompt", type: "TEXT", constraints: "NOT NULL", description: "Raw business requirement entered by user." },
        { name: "status", type: "VARCHAR(50)", constraints: "NOT NULL", description: "running, completed, failed." },
        { name: "created_at", type: "TIMESTAMP WITH TIME ZONE", constraints: "DEFAULT NOW()", description: "Run trigger timestamp." }
      ]
    },
    {
      name: "audit_logs",
      description: "The core Audit Log storing granular trace entries for each specific Agent execution.",
      columns: [
        { name: "id", type: "UUID", constraints: "PRIMARY KEY, DEFAULT gen_random_uuid()", description: "Unique audit trace ID." },
        { name: "execution_id", type: "UUID", constraints: "NOT NULL, REFERENCES executions(id) ON DELETE CASCADE", description: "The orchestration run link." },
        { name: "agent_id", type: "VARCHAR(100)", constraints: "NOT NULL", description: "Identifier of the Agent (e.g., analyst, architect)." },
        { name: "agent_name", type: "VARCHAR(100)", constraints: "NOT NULL", description: "Display name of the Agent." },
        { name: "input_context", type: "TEXT", description: "Context payload sent into the Agent." },
        { name: "output_response", type: "TEXT", description: "Generated AI output payload." },
        { name: "duration_ms", type: "INTEGER", description: "Time taken in milliseconds." },
        { name: "status", type: "VARCHAR(50)", constraints: "NOT NULL", description: "completed, failed." },
        { name: "created_at", type: "TIMESTAMP WITH TIME ZONE", constraints: "DEFAULT NOW()", description: "Execution timestamp." }
      ]
    }
  ];
  res.json(schemas);
});

// Prompt Structures and templates for the 5 agents (Phase 2-3 specifications)
app.get("/api/prompt-specs", (req, res) => {
  const prompts: PromptTemplate[] = [
    {
      agentName: "Requirement Analyst Agent",
      role: "Analyze business descriptions to compile functional/non-functional requirements",
      systemInstruction: "You are the Lead Cloud Requirement Analyst. Your job is to dissect natural language requests for a cloud setup. Map user roles, identify business requirements, list key operations, and detail non-functional standards (reliability, latency, scale). Be structured, concise, and professional.",
      inputFormat: "User prompt describing business needs + Target Cloud Provider.",
      outputFormat: "Markdown formatting outlining Personas, Functional Specs, and Non-functional metrics."
    },
    {
      agentName: "Cloud Architect Agent",
      role: "Design multi-tier virtual network configurations and resource topology",
      systemInstruction: "You are a Principal Cloud Infrastructure Architect. Translate requirement specifications into concrete layout tiers (VPCs, Subnets, Gateways, VM clusters, load-balancers, database replications). Always follow the cloud provider's recommended blueprints. Ensure high availability and auto-scaling rules.",
      inputFormat: "Requirements document from the Requirement Analyst.",
      outputFormat: "Cloud network topologies, scaling policies, computing sizing, and storage choices in markdown."
    },
    {
      agentName: "Security Architect Agent",
      role: "Define firewalls, isolate layers, generate IAM policies, and trace audit controls",
      systemInstruction: "You are a Senior Cloud Security and Compliance Auditor. Audit the architectural layout. Add concrete security recommendations: port-level subnet ingress isolation, KMS key encryption structures, service IAM roles applying least-privilege, and logging setups. Map compliance metrics (e.g. SOC2, PCI-DSS, GDPR).",
      inputFormat: "Architecture design specifications from Cloud Architect.",
      outputFormat: "Security isolation rules, IAM policy blueprints, security mapping tables in markdown."
    },
    {
      agentName: "Terraform Generator Agent",
      role: "Formulate clean, structured Infrastructure as Code",
      systemInstruction: "You are an Expert DevOps and IaC Engineer. Take the architectural components and security specs, and write elegant, functional Terraform configuration. Always use the latest official provider versions. Modularize clearly. DO NOT include any explanatory text before or after the code block. Return ONLY standard Terraform block.",
      inputFormat: "Architecture design details + Security architecture parameters.",
      outputFormat: "Pure Terraform/HCL HCL source code blocks."
    },
    {
      agentName: "Documentation & Diagram Generator Agent",
      role: "Compile architectural manual & render graphic layout inside Mermaid",
      systemInstruction: "You are the Technical Documentation Architect. Gather all data. Compile a unified PDF-ready cloud blueprint including summary tables. You MUST also construct a beautiful, valid Mermaid.js graph visualization showing the packet flow or architecture topology. Output the Mermaid graph strictly within a ```mermaid block.",
      inputFormat: "Combined context of Requirements, Architecture Layout, Security Hardening, and Terraform IaC.",
      outputFormat: "Comprehensive Blueprint markdown containing detailed sections and a visual Mermaid diagram."
    }
  ];
  res.json(prompts);
});

// Live Multi-Agent Execution Chain via Gemini API
app.post("/api/generate", async (req, res) => {
  const { prompt, cloudProvider = "AWS", projectName = "Interactive Custom Infrastructure" } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "User Prompt is required to start the generation workflow." });
  }

  // Setup initial steps
  const steps: AgentStep[] = [
    {
      agentId: "analyst",
      name: "Requirement Analyst",
      role: "Translates high-level business ideas into clear, functional system requirements.",
      status: "idle"
    },
    {
      agentId: "architect",
      name: "Cloud Architect",
      role: "Designs standard, high-availability multi-tier cloud infrastructures.",
      status: "idle"
    },
    {
      agentId: "security",
      name: "Security Architect",
      role: "Reviews network access, IAM guidelines, and logs compliance controls.",
      status: "idle"
    },
    {
      agentId: "terraform",
      name: "Terraform Generator",
      role: "Writes reusable, clean, and modular Infrastructure-as-Code.",
      status: "idle"
    },
    {
      agentId: "documentation",
      name: "Documentation & Diagram Generator",
      role: "Creates Architecture Blueprint text and beautiful topology diagrams.",
      status: "idle"
    }
  ];

  const executionId = "exec-" + Math.random().toString(36).substring(2, 9);
  const activeExecution: Execution = {
    id: executionId,
    projectName,
    prompt,
    cloudProvider,
    status: "running",
    createdAt: new Date().toISOString(),
    steps
  };

  // Add immediately to history to trace execution
  executionsStore.unshift(activeExecution);

  try {
    const ai = getGeminiClient();

    // 1. REQUIREMENT ANALYST
    steps[0].status = "running";
    const t0 = performance.now();
    const analystResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Dissect the following user request and compile a structured cloud requirement specification (functional and non-functional) for ${cloudProvider}. Focus on user objectives.
User Prompt: "${prompt}"`,
      config: {
        systemInstruction: "You are the Requirement Analyst Agent for CloudForge Nova Studio. Your role is to analyze user business requirements, identify user personas, functional and non-functional requirements, and structure them into a clear cloud specification."
      }
    });
    steps[0].output = analystResponse.text || "Failed to analyze requirements.";
    steps[0].status = "completed";
    steps[0].durationMs = Math.round(performance.now() - t0);

    // 2. CLOUD ARCHITECT
    steps[1].status = "running";
    const t1 = performance.now();
    const architectResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Based on the requirement specification below, design a solid multi-tier architecture layout on ${cloudProvider}. Specify networking (subnets, gateways), compute nodes, storage and caching tiers.
Requirements Context:
${steps[0].output}`,
      config: {
        systemInstruction: "You are the Cloud Architect Agent for CloudForge Nova Studio. Based on the Requirement specification, design a robust architecture. Define the services, subnet sizing, scalability, high availability, and structural flow."
      }
    });
    steps[1].output = architectResponse.text || "Failed to design architecture.";
    steps[1].status = "completed";
    steps[1].durationMs = Math.round(performance.now() - t1);

    // 3. SECURITY ARCHITECT
    steps[2].status = "running";
    const t2 = performance.now();
    const securityResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Audit the cloud architecture layout below and provide strict security policies, network firewall isolates, service IAM role definitions, encryption requirements, and compliance metrics mapping.
Architecture Context:
${steps[1].output}`,
      config: {
        systemInstruction: "You are the Security Architect Agent for CloudForge Nova Studio. Review the cloud architecture design. Define IAM roles, encryption at rest and in transit, Security Group rules, KMS keys, compliance mapping, and logging/audit trail specifications."
      }
    });
    steps[2].output = securityResponse.text || "Failed to audit security.";
    steps[2].status = "completed";
    steps[2].durationMs = Math.round(performance.now() - t2);

    // 4. TERRAFORM GENERATOR
    steps[3].status = "running";
    const t3 = performance.now();
    const terraformResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Convert the following architecture and security designs into clean, modular, and deployable Terraform (HCL) code for ${cloudProvider}. Include standard variable declarations, resource blocks, and output values. Wrap inside HCL code blocks.
Architecture:
${steps[1].output}
Security:
${steps[2].output}`,
      config: {
        systemInstruction: "You are the Terraform Generator Agent for CloudForge Nova Studio. Based on the Cloud Architecture design and Security guidelines, generate clean, valid, and ready-to-deploy Terraform code. Do not output anything other than raw code inside a markdown block. Include standard resource definitions, variables, and outputs."
      }
    });
    steps[3].output = terraformResponse.text || "Failed to generate Terraform.";
    steps[3].status = "completed";
    steps[3].durationMs = Math.round(performance.now() - t3);

    // 5. DOCUMENTATION & DIAGRAM GENERATOR
    steps[4].status = "running";
    const t4 = performance.now();
    const documentationResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Compile a complete Unified Architecture Blueprint Document in Markdown summarizing all previous steps. You MUST also generate a beautiful, valid Mermaid.js graph diagram representing the cloud infrastructure layout, showing the traffic flow. Ensure the Mermaid code is valid, uses graph TD, starts with "graph TD", and is placed strictly inside a \`\`\`mermaid code block.
Requirements: ${steps[0].output}
Architecture Design: ${steps[1].output}
Security Policies: ${steps[2].output}
Terraform IaC: ${steps[3].output}`,
      config: {
        systemInstruction: "You are the Documentation Generator Agent for CloudForge Nova Studio. Compile the final Architecture Blueprint in markdown, summarizing the system architecture, network diagram, security controls, and resource inventory. You MUST also generate a clean, valid, and beautifully styled Mermaid.js graph visualizing the network topology, and return it inside a ```mermaid markdown block."
      }
    });
    steps[4].output = documentationResponse.text || "Failed to generate documentation.";
    steps[4].status = "completed";
    steps[4].durationMs = Math.round(performance.now() - t4);

    activeExecution.status = "completed";
    res.json(activeExecution);

  } catch (error: any) {
    console.error("Multi-Agent Chain Error:", error);
    // Mark unfinished steps as failed
    steps.forEach(s => {
      if (s.status === "running" || s.status === "idle") {
        s.status = "failed";
      }
    });
    activeExecution.status = "failed";
    res.status(500).json({
      error: error.message || "An unexpected error occurred during Multi-Agent orchestration.",
      partialExecution: activeExecution
    });
  }
});

// Vite & Static Asset Setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CloudForge Nova Studio server running on http://localhost:${PORT}`);
  });
}

startServer();
