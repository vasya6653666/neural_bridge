---
name: scan
description: General Security Scan — discovers account resources, asks the user which categories to scan, then runs security best-practice checks producing a consolidated report with full resource identification (ARN, Name, ID). No compliance framework mapping (use compliance-scan for that).
---

# General Security Scan

**When to use**: Default scan mode. When the user says "run a security scan", "check my account", "scan my AWS", or any general security request WITHOUT mentioning a specific compliance framework.

**Do NOT use for**:
- Compliance-specific scans (CIS, HIPAA, SOC2, PCI DSS, FSBP) → use `compliance-scan` skill
- Well-Architected Security assessment → use `well-architected-assessment` skill

---

## Step 1: Validate AWS session
- Run `aws sts get-caller-identity` via `aws-mcp` to confirm credentials are valid.
- If expired, instruct the user to re-authenticate (`aws login` or `aws sso login`).
- Record the account ID and default region.

## Step 2: Confirm scan scope
- Load `.neuralbridge/security-analyzer.json` if it exists. Otherwise ask the user for:
  - Target region(s)
  - Output directory (default `./security-reports`)
  - Whether to include Trusted Advisor (requires Business/Enterprise Support)
- Save scope to `.neuralbridge/security-analyzer.json`.

## Step 2.5: Account Resource Discovery & User Confirmation
**Do NOT run all checks blindly.** First discover what resources exist in the account:
1. Run lightweight `list*` calls (max 5 results each) across all service categories for the target region(s) to detect which services are in use.
2. Present a Markdown summary table to the user showing:
   - Each service category
   - Number of resources found
   - Which regions they exist in
   - A recommendation (scan / skip based on resource presence)
3. **Wait for user confirmation** before proceeding. Options:
   - "all" — scan all categories with resources found (default)
   - Specific numbers — scan only selected categories
   - "full" — force all 44 phases regardless of resource discovery
4. **Always include** (non-optional): IAM, Detective Controls (GuardDuty/CloudTrail), and Trusted Advisor — these are foundational account-level security regardless of workloads.
5. **Auto-skip** categories with zero resources unless user picks "full".
6. Record selected phases in run state. In the final report, note skipped categories with "Skipped — no resources / not selected".

## Step 3: Resource identification requirements
For EVERY finding, capture the following resource identifiers wherever the AWS API provides them:
- **resourceArn**: The full ARN (e.g., `arn:aws:ec2:us-east-1:123456789012:security-group/sg-0abc123`). Construct it from API responses if not returned directly.
- **resourceName**: The human-readable name (e.g., Name tag value, bucket name, function name, role name, cluster name).
- **resourceId**: The AWS-assigned unique ID (e.g., `sg-0abc123`, `i-0def456`, `vol-789`, `AKIAIOSFODNN7EXAMPLE`).

If an API does not return all three, populate what is available:
- Security Groups: ARN (construct from region+account+sg-id), Name tag or GroupName, GroupId.
- EC2 instances: ARN (construct), Name tag, InstanceId.
- S3 buckets: ARN (`arn:aws:s3:::bucket-name`), bucket name, bucket name (same).
- IAM users/roles: ARN (from API), UserName/RoleName, UserId/RoleId.
- RDS instances: DBInstanceArn, DBInstanceIdentifier, DbiResourceId.
- Lambda functions: FunctionArn, FunctionName, RevisionId.
- KMS keys: KeyArn (from metadata), alias if any, KeyId.
- EKS clusters: cluster ARN, cluster name, cluster name.
- VPCs: ARN (construct), Name tag, VpcId.
- For account-level findings: use `arn:aws:iam::<accountId>:root` as ARN, "Account" as name, accountId as ID.
- Athena workgroups: ARN (`arn:aws:athena:<region>:<accountId>:workgroup/<name>`), workgroup name, workgroup name.
- Glue jobs: ARN (`arn:aws:glue:<region>:<accountId>:job/<name>`), job name, job name.
- Glue Data Catalog: ARN (`arn:aws:glue:<region>:<accountId>:catalog`), "DataCatalog", accountId.
- MSK clusters: cluster ARN (from API), cluster name, cluster UUID.
- Kinesis streams: stream ARN (from API), stream name, stream name.
- Firehose delivery streams: ARN (`arn:aws:firehose:<region>:<accountId>:deliverystream/<name>`), stream name, stream name.
- Step Functions state machines: state machine ARN (from API), state machine name, state machine name.
- AWS Backup vaults: ARN (`arn:aws:backup:<region>:<accountId>:backup-vault:<name>`), vault name, vault name.
- CloudWatch log groups: ARN (from API), log group name, log group name.
- EventBridge event buses: ARN (`arn:aws:events:<region>:<accountId>:event-bus/<name>`), bus name, bus name.
- AppSync APIs: ARN (`arn:aws:appsync:<region>:<accountId>:apis/<apiId>`), API name, API ID.
- Cognito User Pools: ARN (from API), pool name, pool ID.
- Cognito Identity Pools: ARN (`arn:aws:cognito-identity:<region>:<accountId>:identitypool/<poolId>`), pool name, pool ID.
- SSM parameters: ARN (`arn:aws:ssm:<region>:<accountId>:parameter/<name>`), parameter name, parameter name.
- Network Firewalls: firewall ARN (from API), firewall name, firewall name.
- Transit Gateways: ARN (`arn:aws:ec2:<region>:<accountId>:transit-gateway/<tgw-id>`), Name tag, TGW ID.
- Global Accelerator: accelerator ARN (from API), accelerator name, accelerator name.
- Route 53 hosted zones: ARN (`arn:aws:route53:::hostedzone/<zoneId>`), zone name, zone ID.
- Route 53 domains: ARN (`arn:aws:route53domains:::domain/<domainName>`), domain name, domain name.

## Step 4: Execute the scan
- Load `steering/scan-workflow.md` and execute **only the phases confirmed by the user in Step 2.5**.
- Always execute these foundational phases regardless of user selection:
  - Phase 1: Trusted Advisor (global, once)
  - Phase 2: IAM & credentials (global)
  - Phase 6: Detective controls — GuardDuty & CloudTrail (per region + global)
- Execute user-selected phases from the list below:
  1. Trusted Advisor (global, once) — **always**
  2. IAM & credentials (global) — **always**
  3. EC2 / network (per region)
  4. S3 (global + per bucket)
  5. RDS / data protection (per region)
  6. Detective controls — GuardDuty & CloudTrail (per region + global) — **always**
  7. KMS (per region)
  8. Container security — EKS / ECS / ECR (per region)
  9. IAM Access Analyzer external access (per region)
  10. Compute Optimizer (global)
  11. Lambda (per region)
  12. API Gateway (per region)
  13. SNS / SQS (per region)
  14. DynamoDB (per region)
  15. CloudFront (global)
  16. ELB / ALB / NLB (per region)
  17. Secrets Manager (per region)
  18. WAF (per region + global)
  19. VPC & Networking (per region)
  20. OpenSearch (per region)
  21. EBS (per region)
  22. EFS (per region)
  23. ElastiCache (per region)
  24. Redshift (per region)
  25. SageMaker (per region)
  26. AMI (per region)
  27. Inspector (per region)
  28. Security Hub (per region)
  29. Athena (per region)
  30. Glue (per region)
  31. MSK — Managed Streaming for Kafka (per region)
  32. Kinesis (per region)
  33. Step Functions (per region)
  34. AWS Backup (per region)
  35. CloudWatch (per region)
  36. EventBridge (per region)
  37. AppSync (per region)
  38. Cognito (per region)
  39. Systems Manager (per region)
  40. Network Firewall (per region)
  41. Transit Gateway (per region)
  42. Global Accelerator (global)
  43. Route 53 (global)
  44. Consolidate & score
- For any skipped phase, record it in the report as "Skipped — no resources detected / not selected by user".

## Step 5: Enrich findings
- Use `iam-mcp-server` (read-only) for deeper IAM analysis: simulate principal policies for over-permissive findings, retrieve inline policy documents.
- Use `aws-documentation-mcp-server` to attach relevant AWS documentation links to recommendations.
- **Do NOT** map findings to compliance frameworks — this is a general security scan. Compliance mapping happens only in the `compliance-scan` skill.
- **Do NOT** run Well-Architected assessment — that is a separate skill (`well-architected-assessment`).

## Step 6: Produce the report
- Follow `steering/report-output.md` **general mode** (no Compliance column, no WAF Mapping column).
- Write both Markdown and HTML files to `outputDir`.
- Print the absolute paths and offer to open the HTML.

## Step 7: Summary
- Present a brief summary to the user: total FAIL/WARN/PASS, risk score, top 5 critical findings, and the report file paths.

## Guardrails
- Read-only. Never create, modify, or delete any AWS resource.
- Page through ALL results before scoring.
- If any API is denied, note it in the report and continue.
- Never invent operation names — discover via `aws-mcp` tools first.
- No compliance mapping in general scan mode.
