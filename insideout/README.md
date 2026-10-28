<p align="center">
  <img src="assets/banner.svg" alt="InsideOut — AI-Powered Cloud Infrastructure Design" width="100%">
</p>

<p align="center">
  <strong>Design, price, and deploy production-ready AWS & GCP infrastructure through conversational AI</strong>
</p>

<p align="center">
  <a href="https://neuralbridge.ru/powers">NeuralBridge Power</a> &bull;
  <a href="https://insideout.luthersystems.com">InsideOut</a> &bull;
  <a href="https://luthersystems.com">Luther Systems</a> &bull;
  <a href="https://insideout.luthersystems.com/discord"><img src="https://img.shields.io/badge/Discord-Join%20Us-5865F2?logo=discord&logoColor=white" alt="Discord"></a>
</p>

---

## What is InsideOut?

InsideOut is a NeuralBridge IDE power that brings AI-powered cloud infrastructure design directly into your editor. Describe what you want to build in plain language, and Riley — your AI infrastructure advisor — guides you through selecting services, configuring them, estimating costs, generating Terraform, and deploying to AWS or GCP.

**No authentication or API keys required.** Install the power and start designing.

### What You Can Do

- **Design infrastructure conversationally** — describe your app, get expert recommendations
- **Get real-time cost estimates** — see monthly costs as components are added
- **Generate Terraform** — production-ready, modular code with security best practices
- **Deploy with one command** — deploy directly to AWS or GCP from the conversation
- **Inspect deployments** — verify what was actually provisioned in your cloud account
- **Compare providers** — evaluate AWS vs GCP options side-by-side

### Supported Services (50+)

| Category | AWS | GCP |
|----------|-----|-----|
| **Compute** | EC2, ECS, EKS, Lambda | Compute Engine, Cloud Run, GKE, Cloud Functions |
| **Database** | RDS PostgreSQL, DynamoDB, ElastiCache, OpenSearch | Cloud SQL, Firestore, Memorystore |
| **Networking** | VPC, ALB, CloudFront, API Gateway | VPC, Load Balancing, Cloud CDN, API Gateway |
| **Storage** | S3 | Cloud Storage |
| **Security** | WAF, KMS, Secrets Manager, Cognito | Cloud Armor, Cloud KMS, Secret Manager, Identity Platform |
| **Messaging** | SQS, MSK (Kafka) | Pub/Sub |
| **Observability** | CloudWatch, Managed Grafana | Cloud Logging, Cloud Monitoring |
| **AI/ML** | Bedrock | Vertex AI |
| **CI/CD** | CodePipeline, GitHub Actions | Cloud Build |
| **Backup** | AWS Backup | GCP Backups |

## Installation

### From GitHub (recommended)

Install the power from the **Powers** panel in NeuralBridge IDE.

### After Installation

MCP support must be enabled in NeuralBridge:

1. Open Settings (`Cmd + ,` / `Ctrl + ,`)
2. Search for "MCP"
3. Enable the MCP support setting

That's it. No API keys, no local binaries, no additional setup.

### Tool Approval Prompts

NeuralBridge asks for approval before each MCP tool call. InsideOut ships with `autoApprove` configured for its safe, read-only tools, but **NeuralBridge does not currently honor the `autoApprove` field** — this is a known NeuralBridge bug. Until it's fixed, you'll need to click "Allow" for each tool call the first time it's used in a session.

We've pre-configured `autoApprove` in `mcp.json` so that once NeuralBridge fixes this, the conversational and monitoring tools will auto-approve and only `tfgenerate` and `tfdeploy` (which create or modify real cloud infrastructure) will prompt for confirmation.

## Quick Start

Once installed, mention anything about infrastructure, cloud, AWS, GCP, Terraform, or deployment in a NeuralBridge chat. The power activates automatically.

```
You: "I need to set up cloud infrastructure for a web app"

NeuralBridge: [Activates InsideOut power, calls convoopen]

Riley: "Hi! I'm Riley, your infrastructure advisor. Tell me about the app
        you're building — what does it do, who uses it, and what scale
        are you planning for?"

You: "It's an e-commerce platform expecting 50k monthly users on AWS"

Riley: "Great! I'd recommend ECS for your containers, RDS PostgreSQL
        for your database, ElastiCache Redis for sessions, and an ALB.
        Estimated cost: ~$350/month. Want me to adjust anything?"

You: "Looks good, generate the Terraform"

NeuralBridge: [Calls tfgenerate — downloads production-ready Terraform files]

You: "Deploy it"

NeuralBridge: [Calls tfdeploy — deploys to AWS, streams logs via tflogs]
```

## Available Tools

| Tool | Description |
|------|-------------|
| `convoopen` | Start a new infrastructure design session |
| `convoreply` | Continue the design conversation with Riley |
| `convoawait` | Wait for long-running operations |
| `convostatus` | View current components, config, and pricing |
| `tfgenerate` | Generate production-ready Terraform files |
| `tfdeploy` | Deploy generated Terraform to AWS or GCP |
| `tfstatus` | Check deployment progress |
| `tflogs` | Stream real-time deployment logs |
| `awsinspect` | Inspect deployed AWS resources |
| `gcpinspect` | Inspect deployed GCP resources |
| `help` | Get workflow guidance |

## Directory Structure

```
insideout-power/
├── POWER.md                    # Power metadata, onboarding, and agent instructions
├── mcp.json                    # MCP server configuration (remote HTTP)
├── README.md                   # This file
├── SECURITY.md                 # Security policy and data flow documentation
├── LICENSE                     # Apache 2.0
├── assets/
│   ├── banner.svg              # GitHub banner
│   └── logo.svg                # InsideOut logo
└── steering/                   # Workflow-specific guidance for the agent
    ├── getting-started.md      # First-time setup walkthrough
    ├── aws-design-patterns.md  # AWS architecture patterns and prompts
    ├── gcp-design-patterns.md  # GCP architecture patterns and prompts
    └── troubleshooting-guide.md
```

## How It Works

InsideOut uses a multi-agent AI system behind a single MCP server:

| Agent | Role |
|-------|------|
| **Riley** | Infrastructure advisor — leads the design conversation |
| **Hippo** | Cost estimation and pricing optimization |
| **Joy** | User experience and requirement gathering |
| **Etch** | Terraform code generation |
| **Core** | Architecture validation and best practices |
| **Axel** | Deployment orchestration |

The conversation flows through these agents automatically. From NeuralBridge's perspective, you're talking to Riley — the other agents work behind the scenes.

## Contributing

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/my-improvement`
3. Make your changes
4. Test locally: install your copy with **Add Custom Power** in the **Powers** panel of NeuralBridge IDE
5. Submit a pull request

### Development Tips

- Test POWER.md changes by reinstalling your copy with **Add Custom Power**
- Verify MCP connectivity with the `help` tool after changes
- Steering files are loaded on-demand — test each workflow independently

## License

[Apache License 2.0](LICENSE)

## Links

- [InsideOut Platform](https://insideout.luthersystems.com)
- [Demo Video](https://insideout.luthersystems.com/demo-video)
- [Standalone Web App](https://insideout.luthersystemsapp.com/) — try InsideOut without NeuralBridge
- [Luther Systems](https://luthersystems.com)
- NeuralBridge IDE
- NeuralBridge Powers Documentation
- [MCP Protocol](https://modelcontextprotocol.io)

## Community & Support

- [Discord](https://insideout.luthersystems.com/discord) — chat with the devs and InsideOut users
- [General Inquiry Call](https://insideout.luthersystems.com/general-call) — talk with us
- [Tech Call](https://insideout.luthersystems.com/tech-call) — talk with the devs
