---
name: "checkmarx"
displayName: "Checkmarx"
description: "Application security scanning with Checkmarx. AI-powered security vulnerability detection and remediation for SAST, secrets, IaC, containers, and open source dependencies directly from the NeuralBridge IDE."
keywords: ["checkmarx", "appsec", "security", "vulnerability", "sast", "secrets", "iac", "containers", "security remediation"]
author: "Checkmarx"
---

# Checkmarx

## Overview

Checkmarx One Developer Assist is an advanced security agent that delivers real-time context-aware prevention, remediation, and guidance to developers from the IDE. It empowers developers to identify risks in their code in realtime and harness the power of AI to remediate the risks on the spot.

The Checkmarx MCP Server is a secure gateway that bridge the AI-powered development IDE in NeuralBridge with Checkmarx. It defines the tools and APIs that allow AI agents to interact safely with Checkmarx's cloud services directly from within the NeuralBridge IDE.

**Key Capabilities:**

- **ASCA (Application Security Code Analysis)** - Lightweight source code scanner for secure coding best practices
- **Secret Detection** - Identifies 170+ types of exposed credentials, tokens, and keys
- **IaC Security** - Scans infrastructure configuration files (based on KICS)
- **OSS Security** - Analyzes open source dependencies for vulnerabilities and malicious packages
- **Container Security** - Scans Docker, Helm, and Docker Compose files for image vulnerabilities
- **AI-Powered Remediation** - Automated fix suggestions with context-aware code changes
- **Safe Refactor** - Project-wide package update analysis and refactoring

## Onboarding

### Prerequisites

- Active Checkmarx One account with Developer Assist enabled. You can subscribe to Checkmarx One using the [AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-xbxjoco7f6xwi)

- Retrieve your Checkmarx One base URL (e.g., `https://deu.ast.checkmarx.net`).
  **How to get it:**
    1. Log in to your Checkmarx One portal
    2. Copy the base URL from your browser (e.g., `https://deu.ast.checkmarx.net`, `https://us.ast.checkmarx.net`) to be used in the mcp.json configuration for the Checkmarx MCP server
    Do NOT include `/api/security-mcp/mcp` - just the base URL

- Create a Checkmarx One API key using the [API key documentation](https://docs.checkmarx.com/en/34965-68618-generating-an-api-key.html). The API Key should have the role `plugin-scanner`. Alternatively, they can have at a minimum the out-of-the-box composite role `ast-scanner` as well as the IAM role `default-roles`.
Copy the Checkmarx API Key token value to be used in the mcp.json configuration for the Checkmarx MCP Server

### Installation

To install Checkmarx One Developer Assist plugin in NeuralBridge IDE main menu click on the `Extensions`icon. Search for the Checkmarx extension, then click Install.
After installing the Checkmarx One Developer Assist plugin authenticate it with your Checkmarx One account (see the Checkmarx One documentation).

The Checkmarx MCP Server is automatically installed when you authenticate in your IDE with the Checkmarx One Developer Assist plugin or when you install this Checkmarx NeuralBridge Power.

### Configuration

#### Step 1: Obtain Your API Key

1. Log in to your Checkmarx One portal
2. Navigate to your account settings
3. Generate a Checkmarx API key token
4. Copy the token for use in the MCP configuration

#### Step 2: Configure MCP Server

The MCP server requires two configuration values:

- **Base URL**: Your Checkmarx One instance Base URL e.g., `https://deu.ast.checkmarx.net`
- **API Key**: Your Checkmarx API Key token from Step 1 should be pasted as a value under the "Authorization" key in your NeuralBridge MCP config.json

```json
{
  "mcpServers": {
    "checkmarx": {
      "url": "https://deu.ast.checkmarx.net/api/security-mcp/mcp",
      "headers": {
        "cx-origin": "NeuralBridge",
        "Authorization": "<YOUR_CHECKMARX_API_KEY_TOKEN>"
      }
    }
  }
}
```

> **Note**: Replace `<YOUR_CHECKMARX_API_KEY_TOKEN>` with your actual Checkmarx One API key token.

#### Step 3: Verify Connection

Once configured, the MCP server will connect to Checkmarx One and enable security scanning capabilities in your NeuralBridge IDE.

## MCP Tools Reference

The Checkmarx MCP Server provides three main remediation tools:

### codeRemediation

Provides remediation suggestions for code vulnerabilities (sast), secrets, and IaC issues.

### packageRemediation

Analyzes and provides remediation for package security issues including malicious packages and CVEs.

### imageRemediation

Analyzes and provides remediation for container image security issues including malicious images and CVEs.

## Common Workflows

### Workflow 1: Code Vulnerability Remediation (SAST)

**Goal:** Identify and fix security vulnerabilities in your source code

**Steps:**

1. Edit a source file in your IDE (Java, JavaScript, C#, Go, or Python)
2. ASCA scanner automatically runs and identifies vulnerabilities
3. Review the vulnerability details in your IDE
4. Request AI remediation for the vulnerability
5. Review and accept the suggested code fix

**Example:**

```text
Agent: "I found a SQL injection vulnerability in user-service.js. 
Let me get remediation suggestions from Checkmarx."

[Uses codeRemediation tool with type: 'sast']

Agent: "Here's the recommended fix: Use parameterized queries 
instead of string concatenation..."
```

**Common Errors:**

- **Error:** "SAST remediation not available"
  - **Cause:** Language not supported by ASCA
  - **Solution:** ASCA currently supports Java, JavaScript, C#, Go, and Python only

### Workflow 2: Secret Detection and Remediation

**Goal:** Find and secure exposed credentials in your code

**Steps:**

1. Edit a file containing hardcoded secrets
2. Secret Detection scanner automatically identifies exposed credentials
3. Review the detected secret type (API key, password, token, etc.)
4. Request remediation to replace with environment variables
5. Accept the suggested code changes

**Example:**

```text
Agent: "I detected an exposed API key in config.js. 
Let me get remediation steps from Checkmarx."

[Uses codeRemediation tool with type: 'secret', sub_type: 'api_key']

Agent: "The secret should be moved to an environment variable. 
Here's the updated code using process.env.API_KEY..."
```

**Supported Secret Types:**

- API keys, passwords, tokens
- Private keys, SSH keys
- Database URLs and connection strings
- AWS access keys, JWT secrets
- Webhook URLs and OAuth tokens
- 170+ credential types total

### Workflow 3: Infrastructure as Code (IaC) Security

**Goal:** Ensure infrastructure configurations are secure

**Steps:**

1. Edit an infrastructure file (Terraform, CloudFormation, Kubernetes, etc.)
2. IaC scanner automatically analyzes the configuration
3. Review security misconfigurations identified
4. Request AI remediation for the issue
5. Apply the recommended configuration changes

**Example:**

```text
Agent: "I found an insecure S3 bucket configuration in terraform/main.tf. 
Let me get remediation from Checkmarx."

[Uses codeRemediation tool with type: 'iac']

Agent: "The S3 bucket should have encryption enabled. 
Here's the updated Terraform configuration..."
```

### Workflow 4: Open Source Package Vulnerability Remediation

**Goal:** Fix vulnerabilities in open source dependencies

**Steps:**

1. Open or edit a manifest file (package.json, requirements.txt, pom.xml, go.mod, etc.)
2. OSS scanner analyzes dependencies for vulnerabilities and malicious packages
3. Review identified vulnerable packages
4. Request remediation to upgrade or replace the package
5. Review Safe Refactor suggestions for project-wide changes

**Example:**

```text
Agent: "I found a critical vulnerability in lodash@4.17.15 in package.json. 
Let me check for remediation options."

[Uses packageRemediation tool with packageName: 'lodash', 
packageVersion: '4.17.15', packageManager: 'npm', issueType: 'CVE']

Agent: "Upgrade to lodash@4.17.21 which fixes this CVE. 
Safe Refactor found 3 files that need updates..."
```

**Supported Package Managers:**

- npm (Node.js)
- PyPI (Python)
- Maven (Java)
- NuGet (.NET)
- Go modules

**Version Specifier Handling:**

- `^`, `~`, `*` default to "latest" version analysis
- Exception: `^0.x.y` analyzes `0.x.y` specifically
- No version specified defaults to "latest"

### Workflow 5: Container Image Security

**Goal:** Identify and fix vulnerabilities in container images

**Steps:**

1. Edit a Dockerfile, Helm chart, or Docker Compose file
2. Container scanner analyzes the images and packages
3. Review vulnerabilities in base images and packages
4. Request remediation for vulnerable images or packages
5. Update to secure image versions

**Example:**

```text
Agent: "I found vulnerabilities in the nginx:1.19 base image in Dockerfile. 
Let me get remediation suggestions."

[Uses imageRemediation tool with imageName: 'nginx', 
imageTag: '1.19', fileType: 'Dockerfile']

Agent: "Upgrade to nginx:1.21.6-alpine which resolves these CVEs. 
Here's the updated Dockerfile..."
```

**Supported File Types:**

- Dockerfile
- Helm Charts
- Docker Compose files

### Workflow 6: Ignore and Revive Risks

**Goal:** Focus on actionable risks by ignoring false positives

**Steps:**

1. Review a risk identified by any scanner
2. Mark the risk as "Ignore" if it's not actionable
3. Choose to ignore this specific instance or all instances
4. Risk will no longer appear in your IDE
5. Revive the risk later if needed

**Use Cases:**

- False positives that don't apply to your context
- Accepted risks with compensating controls
- Risks planned for future remediation

## Troubleshooting

### MCP Server Connection Issues

**Problem:** MCP server won't connect to Checkmarx One

**Symptoms:**

- Error: "Connection refused"
- Error: "Authentication failed"
- Server not responding

**Solutions:**

1. Verify your Checkmarx One base URL is correct
2. Check that your API key (offline token) is valid and not expired
3. Ensure the URL format is: `<base_url>/api/security-mcp/mcp`
4. Verify network connectivity to Checkmarx One
5. Check that your Checkmarx account has Developer Assist enabled
6. Restart your IDE and try reconnecting

### Remediation Tool Errors

**Error:** "Remediation not available for this risk type"

**Cause:** Risk type not supported for AI remediation

**Solution:** Some risk types may require manual remediation. Check the documentation for supported remediation types.

**Error:** "Package remediation failed"

**Cause:** No safe upgrade path available or package not found

**Solution:**

1. Verify the package name and version are correct
2. Check if a remediated version exists in the package registry
3. Consider alternative packages with equivalent functionality

**Error:** "Language not supported"

**Cause:** ASCA scanner doesn't support the file's programming language

**Solution:** ASCA currently supports Java, JavaScript (Node.js), C#, Go, and Python. Other languages may be added in future releases.

### Scanning Issues

**Problem:** Realtime scans not triggering

**Symptoms:**

- No scan results appear after editing files
- Scanner seems inactive

**Solutions:**

1. Verify the file type is supported by the scanner
2. Check that the Checkmarx plugin is enabled in your IDE
3. Ensure you're authenticated with Checkmarx One
4. Try closing and reopening the file
5. Check IDE logs for error messages

**Problem:** Manifest file not being scanned

**Cause:** Unsupported manifest format or version specifiers

**Solution:**

1. Verify your manifest file type is supported (package.json, requirements.txt, pom.xml, go.mod, *.csproj)
2. Check for unsupported version specifiers (most default to "latest")
3. Ensure the manifest file is properly formatted

## Best Practices

- **Scan Early and Often** - Realtime scanning runs automatically as you code, catching issues before they reach production
- **Address High Severity First** - Prioritize critical and high severity vulnerabilities for immediate remediation
- **Use AI Remediation** - Leverage AI-powered fix suggestions to quickly resolve security issues with context-aware code changes
- **Review Safe Refactor** - When updating packages, review project-wide refactoring suggestions to ensure compatibility
- **Secure Secrets Properly** - Always use environment variables or secret management systems instead of hardcoded credentials
- **Keep Dependencies Updated** - Regularly update open source packages to remediated versions to minimize vulnerability exposure
- **Validate IaC Configurations** - Scan infrastructure files before deployment to prevent security misconfigurations
- **Use Ignore Wisely** - Only ignore risks that are truly false positives or have documented compensating controls
- **Monitor Container Images** - Regularly scan and update base images to address newly discovered vulnerabilities

## Checkmarx MCP License and Support

This power integrates with Checkmarx MCP Server (Proprietary).

- [Privacy Policy](https://checkmarx.com/legal/privacy-policy/)
- [Support](https://support.checkmarx.com/CheckmarxCustomerServiceCommunity/s/)

---

**Documentation:** <https://docs.checkmarx.com/en/34965-405960-checkmarx-developer-assist.html>
