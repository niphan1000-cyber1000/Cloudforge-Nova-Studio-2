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

// Prompt Structures and templates for the 16 agents (Phase 2-3 specifications)
app.get("/api/prompt-specs", (req, res) => {
  const prompts: PromptTemplate[] = [
    {
      id: "AG001",
      agentName: "Requirement Analyst",
      group: "Intake",
      status: "Core",
      purpose: "แปลง requirement ภาษาธรรมชาติจากผู้ใช้ให้เป็นโครงสร้างข้อมูลที่ Agent อื่นนำไปใช้ต่อได้",
      responsibilities: "รวบรวม business goals, ระบุ use case, แยก functional/non-functional requirement, ตรวจสอบความคลุมเครือของ requirement",
      inputFormat: "ข้อความ requirement จากผู้ใช้ (natural language), ประวัติการสนทนาที่เกี่ยวข้อง",
      outputFormat: "Structured Requirement Document (JSON) ประกอบด้วย business goals, functional requirement, constraints",
      memory: "เห็นเฉพาะ user input และ business goals ปัจจุบันของ project",
      knowledge: "Requirement engineering best practice, ตัวอย่าง requirement pattern เดิม",
      promptScope: "จำกัดเฉพาะการวิเคราะห์ requirement เท่านั้น ห้ามออกแบบสถาปัตยกรรม",
      allowedTools: "Knowledge Retrieval (Vector DB)",
      notAllowed: "ห้ามเรียก Terraform, ห้ามเข้าถึง cloud credential",
      dependencies: "ไม่มี (เป็น Agent แรกของ workflow)",
      successCriteria: "ได้ Structured Requirement ที่ Cloud Architect นำไปใช้ต่อได้โดยไม่ต้องถามซ้ำ",
      stopCondition: "หาก ambiguity score เกิน threshold ที่กำหนด ให้หยุดและถามผู้ใช้เพิ่มเติม",
      retryPolicy: "Retry 2 ครั้งหากผลลัพธ์ไม่ผ่าน validation schema",
      logging: "input, output, ambiguity score, เวลาที่ใช้ประมวลผล",
      version: "v1.0",
      owner: "Requirement / Product Team",
      priority: "Critical"
    },
    {
      id: "AG002",
      agentName: "Cloud Architect",
      group: "Design",
      status: "Core",
      purpose: "ออกแบบสถาปัตยกรรมระดับสูง (high-level architecture) จาก Structured Requirement",
      responsibilities: "เลือก cloud provider ที่เหมาะสม กำหนด compute/storage/network เบื้องต้น ประสานกับ Network/Security Architect",
      inputFormat: "Structured Requirement Document จาก Requirement Analyst",
      outputFormat: "High-Level Architecture Draft (รายการ component และความสัมพันธ์)",
      memory: "เห็น Requirement และ Constraints ขององค์กร (budget, compliance region)",
      knowledge: "Cloud provider service catalog, reference architecture pattern",
      promptScope: "ออกแบบระดับ high-level เท่านั้น ไม่ลงรายละเอียดระดับ IaC",
      allowedTools: "Knowledge Retrieval, Pricing API (ระดับเบื้องต้น)",
      notAllowed: "ห้าม generate Terraform เอง (ส่งต่อให้ Terraform Generator)",
      dependencies: "Requirement Analyst",
      successCriteria: "Architecture Draft ผ่านการตรวจสอบเบื้องต้นจาก Solution Architect",
      stopCondition: "หากไม่มี cloud provider ใดตอบโจทย์ constraint ให้หยุดและแจ้ง Reviewer",
      retryPolicy: "Retry 2 ครั้ง",
      logging: "input, output, provider ที่เลือก, เหตุผลการเลือก",
      version: "v1.0",
      owner: "Architecture Team",
      priority: "Critical"
    },
    {
      id: "AG003",
      agentName: "Solution Architect",
      group: "Design",
      status: "Core",
      purpose: "รวม (integrate) ผลออกแบบจาก Cloud/Network/Security/IAM ให้เป็นสถาปัตยกรรมเดียวที่สอดคล้องกัน",
      responsibilities: "รวมผลลัพธ์ของ Agent สายออกแบบ, ตรวจสอบ consistency, แก้ conflict ระหว่าง Agent",
      inputFormat: "Output จาก Cloud Architect, Network Architect, Security Architect, IAM Specialist",
      outputFormat: "Unified Architecture Blueprint",
      memory: "เห็น output ของ Agent สายออกแบบทั้งหมดในรอบ workflow ปัจจุบัน",
      knowledge: "Architecture pattern, trade-off analysis",
      promptScope: "ตรวจสอบและรวมผล ไม่ออกแบบใหม่ตั้งแต่ต้น",
      allowedTools: "Knowledge Retrieval",
      notAllowed: "ห้ามข้ามขั้นตอน Security Review",
      dependencies: "Cloud Architect, Network Architect, Security Architect, IAM Specialist",
      successCriteria: "Blueprint ไม่มี conflict ระหว่างองค์ประกอบ",
      stopCondition: "หากมี conflict ที่แก้ไม่ได้ ส่งกลับ Agent ต้นทางพร้อมระบุจุดที่ขัดแย้ง",
      retryPolicy: "Retry 2 ครั้งต่อรอบการรวมผล",
      logging: "conflict ที่พบ, การแก้ไข, เวลาที่ใช้",
      version: "v1.0",
      owner: "Architecture Team",
      priority: "Critical"
    },
    {
      id: "AG004",
      agentName: "Network Architect",
      group: "Design",
      status: "Core",
      purpose: "ออกแบบสถาปัตยกรรมเครือข่าย (VPC/VNet, subnet, routing, peering)",
      responsibilities: "กำหนด network topology, IP range, connectivity ระหว่าง environment",
      inputFormat: "High-Level Architecture Draft จาก Cloud Architect",
      outputFormat: "Network Design Specification",
      memory: "เห็น Architecture Draft และ security requirement เบื้องต้น",
      knowledge: "Networking best practice ของแต่ละ cloud provider",
      promptScope: "ออกแบบเครือข่ายเท่านั้น",
      allowedTools: "Knowledge Retrieval",
      notAllowed: "ห้ามกำหนด IAM policy (เป็นหน้าที่ของ IAM Specialist)",
      dependencies: "Cloud Architect",
      successCriteria: "Network Design ผ่านการตรวจสอบจาก Security Architect",
      stopCondition: "หาก IP range ชนกับ environment เดิมที่ระบุไว้ ให้หยุดและแจ้งเตือน",
      retryPolicy: "Retry 2 ครั้ง",
      logging: "network topology ที่เลือก, IP range, เหตุผล",
      version: "v1.0",
      owner: "Network / Infra Team",
      priority: "High"
    },
    {
      id: "AG005",
      agentName: "Security Architect",
      group: "Design",
      status: "Core",
      purpose: "ออกแบบมาตรการความปลอดภัยระดับสถาปัตยกรรม (encryption, network security, compliance mapping เบื้องต้น)",
      responsibilities: "กำหนด security control, ตรวจสอบ compliance requirement, ประสานกับ IAM Specialist",
      inputFormat: "High-Level Architecture Draft, Network Design Specification",
      outputFormat: "Security Design Specification",
      memory: "เห็น architecture draft, network design, compliance requirement ขององค์กร",
      knowledge: "Security framework (เช่น CIS, NIST), compliance mapping",
      promptScope: "ออกแบบ security control เท่านั้น ไม่ generate IaC",
      allowedTools: "Knowledge Retrieval",
      notAllowed: "ห้ามอนุมัติ deployment เอง",
      dependencies: "Cloud Architect, Network Architect",
      successCriteria: "Security Design ผ่านการตรวจสอบจาก Compliance Auditor",
      stopCondition: "หากพบความเสี่ยงระดับ critical ที่ยังไม่ได้แก้ไข ให้หยุด workflow",
      retryPolicy: "Retry 2 ครั้ง",
      logging: "risk ที่พบ, control ที่กำหนด",
      version: "v1.0",
      owner: "Security Team",
      priority: "Critical"
    },
    {
      id: "AG006",
      agentName: "IAM Specialist",
      group: "Design",
      status: "Core",
      purpose: "ออกแบบ Identity and Access Management (roles, policies, least privilege)",
      responsibilities: "กำหนด role/policy ตาม principle of least privilege, ตรวจสอบ separation of duties",
      inputFormat: "Security Design Specification",
      outputFormat: "IAM Policy Specification",
      memory: "เห็น security design และ roles ที่มีอยู่เดิมของโปรเจกต์",
      knowledge: "IAM best practice ของแต่ละ cloud provider",
      promptScope: "ออกแบบ IAM เท่านั้น",
      allowedTools: "Knowledge Retrieval",
      notAllowed: "ห้าม generate credential จริง",
      dependencies: "Security Architect",
      successCriteria: "IAM Policy ผ่านการตรวจสอบ least privilege",
      stopCondition: "หากพบ policy ที่ over-privileged เกินขอบเขต ให้หยุดและแก้ไข",
      retryPolicy: "Retry 2 ครั้ง",
      logging: "policy ที่ generate, ผลตรวจสอบ least privilege",
      version: "v1.0",
      owner: "Security Team",
      priority: "High"
    },
    {
      id: "AG007",
      agentName: "Terraform Generator",
      group: "Generation",
      status: "Core",
      purpose: "แปลง Unified Architecture Blueprint ให้เป็น Terraform / OpenTofu module",
      responsibilities: "generate IaC ตาม blueprint, ตรวจสอบ syntax, รัน terraform plan (dry-run เท่านั้น)",
      inputFormat: "Unified Architecture Blueprint, Network Design Specification, IAM Policy Specification",
      outputFormat: "Terraform Module พร้อม Plan Output",
      memory: "เห็น blueprint, network design, IAM policy ที่เกี่ยวข้อง",
      knowledge: "Terraform provider documentation",
      promptScope: "generate IaC เท่านั้น ห้าม apply จริง",
      allowedTools: "Terraform Docs, Terraform CLI (plan only)",
      notAllowed: "ห้ามรัน terraform apply โดยไม่ได้รับอนุมัติจากมนุษย์",
      dependencies: "Solution Architect, Network Architect, IAM Specialist",
      successCriteria: "terraform plan สำเร็จโดยไม่มี error",
      stopCondition: "หาก plan ล้มเหลวเกินจำนวน retry ที่กำหนด ให้แจ้ง Reviewer",
      retryPolicy: "Retry 3 ครั้ง",
      logging: "plan output, error, เวลาที่ใช้ประมวลผล",
      version: "v1.0",
      owner: "DevOps Team",
      priority: "Critical"
    },
    {
      id: "AG008",
      agentName: "Documentation Generator",
      group: "Generation",
      status: "Core",
      purpose: "สร้างเอกสารประกอบ (architecture doc, user guide) จากผลลัพธ์ของ Agent อื่น",
      responsibilities: "รวบรวมผลลัพธ์ของ Agent ที่เกี่ยวข้องมาสร้างเอกสารที่มนุษย์อ่านได้",
      inputFormat: "ผลลัพธ์สรุปจาก Agent ทุกตัวที่เกี่ยวข้องในรอบ workflow นั้น",
      outputFormat: "เอกสาร Markdown / Word",
      memory: "เห็น output สรุปของ Agent ในรอบปัจจุบันเท่านั้น (ไม่ใช่ raw memory ทั้งหมด)",
      knowledge: "Documentation template, style guide ขององค์กร",
      promptScope: "สรุปและจัดรูปแบบเอกสารเท่านั้น ห้ามเพิ่มเนื้อหาที่ Agent อื่นไม่ได้ระบุ",
      allowedTools: "Markdown Generator",
      notAllowed: "ห้ามตัดสินใจเชิงสถาปัตยกรรมเอง",
      dependencies: "ทุก Agent ที่ต้องสรุปผลในรอบนั้น",
      successCriteria: "เอกสารครบทุกหัวข้อที่กำหนดและไม่มีข้อมูลขัดแย้งกับ source",
      stopCondition: "หากข้อมูลจาก Agent ต้นทางไม่ครบ ให้หยุดและแจ้ง Orchestrator",
      retryPolicy: "Retry 1 ครั้ง",
      logging: "เอกสารที่ generate, source ที่อ้างอิง",
      version: "v1.0",
      owner: "Documentation Team",
      priority: "Medium"
    },
    {
      id: "AG009",
      agentName: "Architecture Reviewer",
      group: "Review",
      status: "Core",
      purpose: "ตรวจสอบคุณภาพและความสอดคล้องของ Blueprint ก่อนอนุมัติเข้าสู่ Phase ถัดไป",
      responsibilities: "ตรวจสอบตาม Acceptance Criteria, ให้ feedback, อนุมัติหรือส่งกลับแก้ไข",
      inputFormat: "Unified Architecture Blueprint, Security Design Specification, Terraform Plan",
      outputFormat: "Review Report (Approved / Rejected พร้อมเหตุผล)",
      memory: "เห็นผลลัพธ์ทั้งหมดของรอบ workflow ปัจจุบัน",
      knowledge: "Acceptance Criteria ของแต่ละ Phase, มาตรฐานองค์กร",
      promptScope: "ตรวจสอบและให้ feedback เท่านั้น ไม่แก้ไข blueprint เอง",
      allowedTools: "Knowledge Retrieval",
      notAllowed: "ห้ามอนุมัติงานที่ยังไม่ผ่าน Security Review",
      dependencies: "Solution Architect, Security Architect, Terraform Generator",
      successCriteria: "Blueprint ที่อนุมัติผ่านเกณฑ์ตาม checklist ครบถ้วน",
      stopCondition: "หากพบปัญหาระดับ critical ให้ปฏิเสธและส่งกลับทันที",
      retryPolicy: "ไม่มี retry อัตโนมัติ ต้องแก้ไขจาก Agent ต้นทางก่อน",
      logging: "ผลการตรวจสอบ, เหตุผล, เวลาที่ใช้",
      version: "v1.0",
      owner: "Architecture Team (Lead)",
      priority: "Critical"
    },
    {
      id: "AG010",
      agentName: "FinOps Analyst",
      group: "Support",
      status: "Optional",
      purpose: "วิเคราะห์ต้นทุนของสถาปัตยกรรมที่ออกแบบ และเสนอแนวทางลดต้นทุน",
      responsibilities: "ประเมินต้นทุนตาม pricing API, เปรียบเทียบทางเลือก, เสนอ cost optimization",
      inputFormat: "Unified Architecture Blueprint",
      outputFormat: "Cost Estimation Report",
      memory: "เห็น blueprint และ pricing data ปัจจุบัน",
      knowledge: "Pricing model ของแต่ละ cloud provider",
      promptScope: "วิเคราะห์ต้นทุนเท่านั้น ไม่ตัดสินใจด้าน security/network",
      allowedTools: "Pricing API",
      notAllowed: "ห้ามแก้ไข architecture โดยตรง",
      dependencies: "Solution Architect",
      successCriteria: "รายงานต้นทุนครอบคลุมทุก resource หลักใน blueprint",
      stopCondition: "หาก Pricing API ไม่ตอบสนอง ให้ใช้ค่าประมาณการล่าสุดที่บันทึกไว้และระบุว่าเป็นค่าประมาณ",
      retryPolicy: "Retry 2 ครั้ง",
      logging: "ต้นทุนที่ประเมิน, resource ที่คำนวณ",
      version: "v1.0",
      owner: "FinOps Team",
      priority: "Medium"
    },
    {
      id: "AG011",
      agentName: "Kubernetes Specialist",
      group: "Generation",
      status: "Optional",
      purpose: "ออกแบบ Kubernetes manifest / Helm chart สำหรับ workload ที่ต้องรันบน K8s",
      responsibilities: "กำหนด deployment, service, ingress, resource limit",
      inputFormat: "Unified Architecture Blueprint, Terraform Module (ส่วนคลัสเตอร์)",
      outputFormat: "Kubernetes Manifest / Helm Chart",
      memory: "เห็น blueprint และ network design ที่เกี่ยวกับ cluster",
      knowledge: "Kubernetes best practice",
      promptScope: "ออกแบบ manifest เท่านั้น ห้าม apply เข้าคลัสเตอร์จริง",
      allowedTools: "Kubernetes API (dry-run / validate เท่านั้น)",
      notAllowed: "ห้าม kubectl apply จริงโดยไม่ได้รับอนุมัติ",
      dependencies: "Terraform Generator",
      successCriteria: "Manifest ผ่าน dry-run validation",
      stopCondition: "หาก validation ล้มเหลวเกินจำนวน retry ให้แจ้ง Reviewer",
      retryPolicy: "Retry 3 ครั้ง",
      logging: "manifest ที่ generate, ผล validation",
      version: "v1.0",
      owner: "Platform Team",
      priority: "Medium"
    },
    {
      id: "AG012",
      agentName: "Monitoring Specialist",
      group: "Support",
      status: "Optional",
      purpose: "ออกแบบแนวทาง monitoring/alerting สำหรับสถาปัตยกรรมที่สร้างขึ้น",
      responsibilities: "กำหนด metric ที่ต้อง monitor, threshold การแจ้งเตือน, dashboard เบื้องต้น",
      inputFormat: "Unified Architecture Blueprint, Kubernetes Manifest (ถ้ามี)",
      outputFormat: "Monitoring & Alerting Specification",
      memory: "เห็น blueprint และ manifest ที่เกี่ยวข้อง",
      knowledge: "Prometheus / Grafana best practice",
      promptScope: "ออกแบบ monitoring เท่านั้น",
      allowedTools: "Knowledge Retrieval",
      notAllowed: "ห้ามตั้งค่า monitoring บนระบบจริงโดยตรง",
      dependencies: "Terraform Generator, Kubernetes Specialist",
      successCriteria: "ครอบคลุม metric หลักของทุก component สำคัญ",
      stopCondition: "หากไม่มีข้อมูล resource เพียงพอ ให้แจ้ง Orchestrator เพื่อขอข้อมูลเพิ่ม",
      retryPolicy: "Retry 2 ครั้ง",
      logging: "metric ที่กำหนด, threshold",
      version: "v1.0",
      owner: "SRE Team",
      priority: "Medium"
    },
    {
      id: "AG013",
      agentName: "Compliance Auditor",
      group: "Review",
      status: "Optional",
      purpose: "ตรวจสอบสถาปัตยกรรมเทียบกับมาตรฐาน compliance ที่องค์กรต้องปฏิบัติตาม (เช่น ISO 27001, PCI-DSS)",
      responsibilities: "ทำ mapping control ที่ออกแบบไว้กับ requirement ของ compliance framework ที่เกี่ยวข้อง",
      inputFormat: "Security Design Specification, IAM Policy Specification",
      outputFormat: "Compliance Mapping Report",
      memory: "เห็น security design, IAM policy, compliance framework ที่เลือกใช้",
      knowledge: "Compliance framework ต่าง ๆ ที่องค์กรต้องการ",
      promptScope: "ตรวจสอบ mapping เท่านั้น ไม่ออกแบบ control ใหม่",
      allowedTools: "Knowledge Retrieval",
      notAllowed: "ห้ามอนุมัติ deployment",
      dependencies: "Security Architect, IAM Specialist",
      successCriteria: "ทุก control หลักมี mapping กับ requirement ของ framework ที่เลือก",
      stopCondition: "หากพบ control ที่ไม่ครอบคลุม requirement บังคับ ให้ปฏิเสธและแจ้ง Security Architect",
      retryPolicy: "ไม่มี retry อัตโนมัติ",
      logging: "control ที่ตรวจสอบ, gap ที่พบ",
      version: "v1.0",
      owner: "Compliance Team",
      priority: "High"
    },
    {
      id: "AG014",
      agentName: "Diagram Generator",
      group: "Generation",
      status: "Core",
      purpose: "สร้างแผนภาพ (Mermaid) จากผลลัพธ์ของ Agent สายออกแบบต่าง ๆ",
      responsibilities: "แปลง blueprint / network design ให้เป็น diagram ที่อ่านเข้าใจง่าย",
      inputFormat: "Unified Architecture Blueprint, Network Design Specification",
      outputFormat: "Mermaid Diagram (architecture, network, sequence)",
      memory: "เห็น blueprint และ network design ล่าสุดของรอบนั้น",
      knowledge: "Diagram convention ขององค์กร",
      promptScope: "สร้าง diagram เท่านั้น ไม่ตัดสินใจเชิงสถาปัตยกรรม",
      allowedTools: "Mermaid",
      notAllowed: "ห้ามแก้ไขเนื้อหาของ blueprint",
      dependencies: "Solution Architect, Network Architect",
      successCriteria: "Diagram สอดคล้องกับ blueprint ทั้งหมด",
      stopCondition: "หาก blueprint มีข้อมูลไม่ครบสำหรับวาด diagram ให้แจ้งกลับ",
      retryPolicy: "Retry 1 ครั้ง",
      logging: "diagram ที่ generate, source ที่ใช้",
      version: "v1.0",
      owner: "Documentation Team",
      priority: "Medium"
    },
    {
      id: "AG015",
      agentName: "Workflow Orchestrator",
      group: "Orchestration",
      status: "Core",
      purpose: "ควบคุมลำดับการทำงานของ Agent ทั้งหมดตาม Workflow ที่กำหนดไว้",
      responsibilities: "สั่งงาน Agent ตามลำดับ/ขนานตามที่ออกแบบ, จัดการ retry/error, ควบคุม state ของ workflow",
      inputFormat: "Requirement เริ่มต้นจากผู้ใช้, Workflow Definition",
      outputFormat: "Workflow Execution State พร้อมผลลัพธ์รวมของทุก Agent",
      memory: "เห็น state ปัจจุบันของทุก Agent ใน workflow เดียวกัน",
      knowledge: "Workflow definition, retry/timeout policy",
      promptScope: "ควบคุม orchestration เท่านั้น ไม่ทำหน้าที่ออกแบบเอง",
      allowedTools: "Queue (BullMQ), Internal Agent API",
      notAllowed: "ห้าม bypass ขั้นตอน review ที่กำหนดไว้",
      dependencies: "ทุก Agent ในระบบ",
      successCriteria: "Workflow ดำเนินไปจนจบตามลำดับที่กำหนดโดยไม่มี state ค้าง",
      stopCondition: "หาก Agent ใดถึง Stop Condition ของตนเอง ให้หยุด workflow ทั้งหมดตาม policy",
      retryPolicy: "อ้างอิงตาม retry policy ของแต่ละ Agent ที่กำหนดไว้",
      logging: "state transition ของทุก Agent, เวลาที่ใช้ในแต่ละขั้นตอน",
      version: "v1.0",
      owner: "Platform / Core Engineering Team",
      priority: "Critical"
    },
    {
      id: "AG016",
      agentName: "Knowledge Retrieval",
      group: "Service",
      status: "Core",
      purpose: "ค้นหาและดึงข้อมูลอ้างอิง (best practice, pattern เดิม) จาก Vector DB ให้ Agent อื่นใช้",
      responsibilities: "ทำ semantic search จาก query/context ของ Agent ที่ร้องขอ",
      inputFormat: "Query จาก Agent ที่ร้องขอ (เช่น Requirement Analyst, Cloud Architect)",
      outputFormat: "เอกสาร/pattern ที่เกี่ยวข้องพร้อม similarity score",
      memory: "เห็นเฉพาะ query ที่ร้องขอในรอบนั้น ไม่เก็บ context ยาว",
      knowledge: "Vector DB (Qdrant) ที่รวบรวม pattern และเอกสารอ้างอิงขององค์กร",
      promptScope: "ค้นหาและสรุปผลเท่านั้น ไม่ตัดสินใจแทน Agent ที่ร้องขอ",
      allowedTools: "Vector DB (Qdrant)",
      notAllowed: "ห้ามแก้ไขข้อมูลใน Vector DB โดยตรงระหว่าง execution",
      dependencies: "ไม่มี (ให้บริการ Agent อื่นตามคำขอ)",
      successCriteria: "ผลลัพธ์ที่ดึงมามี similarity score ผ่านเกณฑ์ขั้นต่ำที่กำหนด",
      stopCondition: "หากไม่พบข้อมูลที่เกี่ยวข้องเพียงพอ ให้แจ้ง Agent ผู้ร้องขอว่าไม่มีข้อมูลอ้างอิง",
      retryPolicy: "Retry 1 ครั้งด้วย query ที่ปรับปรุงแล้ว",
      logging: "query, ผลลัพธ์, similarity score",
      version: "v1.0",
      owner: "Platform / Data Team",
      priority: "High"
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
