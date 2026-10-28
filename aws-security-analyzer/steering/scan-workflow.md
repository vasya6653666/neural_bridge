# Scan Workflow

Load scope from `.neuralbridge/security-analyzer.json`. All calls go through the `aws-mcp` server tools (read-only). Discover exact operation names before first use in a session.

## Phase 0 — Identity & scope
1. `aws sts get-caller-identity` → confirm account ID with the user.
2. Read `regions`, `outputDir`, `unusedRoleThresholdDays` from state. If missing, ask.
3. If `security-context/exceptions.csv` exists in the workspace, load it into run state as the accepted-risk list (columns: `resource_arn,check_id,reason,owner,review_date`). If absent, proceed with an empty list.

## Phase 0.5 — Account Resource Discovery & Scan Scope Confirmation

**Purpose**: Quickly discover which AWS services are actually in use in the account, present a summary to the user, and let them choose which categories to scan. This avoids running all 43 phases blindly.

### Discovery (lightweight — list-only calls, no deep inspection):
For EACH region in scope, run these fast discovery calls in parallel where possible:

| Service | Discovery Call | Indicator |
|---------|---------------|-----------|
| EC2 | `ec2:DescribeInstances` (max 5) | Any running/stopped instances |
| S3 | `s3:ListBuckets` | Any buckets exist |
| RDS | `rds:DescribeDBInstances` (max 5) | Any DB instances |
| Lambda | `lambda:ListFunctions` (max 5) | Any functions |
| EKS | `eks:ListClusters` | Any clusters |
| ECS | `ecs:ListClusters` | Any clusters |
| ECR | `ecr:DescribeRepositories` (max 5) | Any repos |
| DynamoDB | `dynamodb:ListTables` (max 5) | Any tables |
| API Gateway | `apigateway:GetRestApis` (max 5) + `apigatewayv2:GetApis` (max 5) | Any APIs |
| CloudFront | `cloudfront:ListDistributions` (max 5) | Any distributions |
| ELB/ALB/NLB | `elbv2:DescribeLoadBalancers` (max 5) | Any load balancers |
| OpenSearch | `es:ListDomainNames` | Any domains |
| Secrets Manager | `secretsmanager:ListSecrets` (max 5) | Any secrets |
| SNS | `sns:ListTopics` (max 5) | Any topics |
| SQS | `sqs:ListQueues` (max 5) | Any queues |
| KMS | `kms:ListKeys` (max 5) | Any customer-managed keys |
| WAF | `wafv2:ListWebACLs` (REGIONAL) | Any Web ACLs |
| VPC | `ec2:DescribeVpcs` | Any non-default VPCs |
| EBS | `ec2:DescribeVolumes` (max 5) | Any volumes |
| EFS | `efs:DescribeFileSystems` (max 5) | Any file systems |
| ElastiCache | `elasticache:DescribeCacheClusters` (max 5) | Any clusters |
| Redshift | `redshift:DescribeClusters` (max 5) | Any clusters |
| SageMaker | `sagemaker:ListNotebookInstances` (max 5) | Any notebooks/endpoints |
| Athena | `athena:ListWorkGroups` (max 5) | Any workgroups beyond "primary" |
| Glue | `glue:GetJobs` (max 5) | Any jobs |
| MSK | `kafka:ListClustersV2` (max 5) | Any clusters |
| Kinesis | `kinesis:ListStreams` (max 5) | Any streams |
| Step Functions | `sfn:ListStateMachines` (max 5) | Any state machines |
| AWS Backup | `backup:ListBackupVaults` (max 5) | Any vaults beyond default |
| AppSync | `appsync:ListGraphqlApis` (max 5) | Any APIs |
| Cognito | `cognito-idp:ListUserPools` (max 5) | Any user pools |
| Network Firewall | `network-firewall:ListFirewalls` | Any firewalls |
| Transit Gateway | `ec2:DescribeTransitGateways` | Any TGWs |
| Global Accelerator | `globalaccelerator:ListAccelerators` | Any accelerators |
| Route 53 | `route53:ListHostedZones` (max 5) | Any hosted zones |

### Present results to user:
Display a Markdown summary table like:

```
## Account Resource Discovery — <accountId>

| # | Category | Resources Found | Regions | Recommended |
|---|----------|----------------|---------|-------------|
| 1 | IAM & Credentials | (always) | global | ✅ Always |
| 2 | Trusted Advisor | (always) | global | ✅ Always |
| 3 | EC2 / Network | 12 instances, 8 SGs | us-east-1 | ✅ |
| 4 | S3 | 23 buckets | global | ✅ |
| 5 | RDS | 0 | — | ⬜ Skip |
| 6 | Lambda | 15 functions | us-east-1 | ✅ |
| ... | ... | ... | ... | ... |

💡 Categories with no resources will be skipped automatically.
❓ Which categories do you want to scan? (default: all with resources found)
   - Type "all" to scan everything with resources
   - Type numbers to select specific categories (e.g., "1,3,4,6")
   - Type "full" to force-scan all 44 phases regardless
```

### User confirmation:
- Wait for the user to confirm which categories to scan.
- **Default**: Scan all categories where resources were discovered + IAM + Trusted Advisor + Detective Controls (always included as foundational).
- **Always include** (even if user doesn't select them): IAM (Phase 2), Detective Controls (Phase 6), and account-level checks — these are foundational security.
- **Auto-skip**: Categories with zero resources found (unless user types "full").
- Record the selected scope in run state as `selectedPhases: [1, 2, 3, ...]`.

### Proceed:
Only execute the phases the user confirmed. Skip all others (note "Skipped — no resources / not selected" in the report for transparency).

## Phase 1 — Trusted Advisor (once)
1. `Support:DescribeTrustedAdvisorChecks` (en) → filter category = security.
2. For each security check, `DescribeTrustedAdvisorCheckResult`; keep flagged (`warning`/`error`).
3. Store the full flagged set in run state. If Support API denied → mark `trustedAdvisor: "unavailable"` and continue.

## Phase 2 — IAM (global)
1. Generate/read the IAM credential report (`GenerateCredentialReport` → `GetCredentialReport`); fall back to per-user `list-access-keys` + `get-access-key-last-used` if denied.
2. Run catalog checks 1–6: unused key pairs, key rotation (30/90d), wildcard/full-admin policies + permissions boundaries, unused roles (≥180d), inactive users (90/365d), MFA (users + root).
3. Run account-foundation checks 42-48: root access keys / root usage, password policy, inline policies, AWS Config enabled, alternate contacts, IAM Access Analyzer.
4. Run CIS coverage checks 48a-48c:
   - **48a `SupportRoleExists`** (CIS 1.17 / IAM.18): `iam:ListEntitiesForPolicy` on `arn:aws:iam::aws:policy/AWSSupportAccess`; FAIL if no user/group/role is attached.
   - **48b `ExpiredServerCertificate`** (CIS 1.19 / IAM.26): `iam:ListServerCertificates`; FAIL any certificate with `Expiration` in the past.
   - **48c `CloudShellFullAccessAttached`** (CIS 1.22 / IAM.27): `iam:ListEntitiesForPolicy` on `arn:aws:iam::aws:policy/AWSCloudShellFullAccess`; FAIL any attached user/group/role.

## Phase 3 — EC2 / network (per region)
For EACH region in scope:
1. `describe-instances`, `describe-security-groups`, `describe-network-acls`.
2. SSM `describe-instance-information`; `describe-instance-attribute` for termination protection.
3. Run catalog checks 7–11: IMDSv2, 0.0.0.0/0 ingress, SSH-22/RDP-3389 exposure, SSM-managed, termination protection.

## Phase 4 — S3 (global + per bucket)
1. Account-level `get-public-access-block`.
2. `list-buckets`; per bucket: public access block, policy status, encryption, bucket policy (wildcard + TLS), versioning/MFA-delete.
3. Run catalog checks 12–17.
4. Object-level logging (checks 17b/17c — CIS 3.8/3.9, S3.22/S3.23): read CloudTrail data-event coverage once via `cloudtrail:GetEventSelectors` (and advanced event selectors) across all trails discovered in Phase 6. For EACH bucket:
   - **17b `S3ObjectWriteLogging`**: FAIL if no trail has an S3 data-event selector covering the bucket with `WriteOnly` or `All` read/write type.
   - **17c `S3ObjectReadLogging`**: FAIL if no trail covers the bucket with `ReadOnly` or `All`.
   - A trail with an account-wide S3 data-event selector (`arn:aws:s3` with no bucket filter) covers every bucket — mark all buckets PASS for the matching read/write type.

## Phase 5 - RDS / data protection (per region)
For EACH region in scope:
1. `describe-db-instances`, `describe-db-clusters`, `describe-db-snapshots`.
2. Run catalog checks 18-22: deletion protection (instance + cluster), public accessibility, storage encryption, backups/cross-region, secret rotation.
3. Run check 22a `RdsNoMinorVersionUpgrade` (CIS 2.3.2 / RDS.13): from the same `describe-db-instances` response, FAIL any instance with `AutoMinorVersionUpgrade=false`.

## Phase 6 - Detective controls (per region + global)
1. GuardDuty `list-detectors` / `get-detector` per region; surface open high/critical findings.
2. CloudTrail `describe-trails` + `get-trail-status`; inspect multi-region, log-file validation, and the trail's S3 bucket hardening. Capture each trail's `KmsKeyId` and its event/data-event selectors (`GetEventSelectors`) — the S3 phase (Phase 4) reuses the data-event selectors for checks 17b/17c.
3. Run catalog checks 23-28.
4. Run check 26a `TrailKmsEncryption` (CIS 3.5 / CloudTrail.2): FAIL any trail whose `KmsKeyId` is absent (SSE-S3 default rather than customer-managed KMS).

## Phase 7 - KMS (per region)
1. `list-keys` -> `describe-key` (customer-managed only), `get-key-rotation-status`, `get-key-policy`.
2. Run catalog checks 29-30: rotation, over-permissive policy/grants.

## Phase 8 - Container security (per region)
1. EKS: `list-clusters` -> `describe-cluster` (endpoint access, secrets encryption, logging, cluster role, version). Run catalog checks 31-35.
2. ECR: `describe-repositories` + `get-repository-policy` (scan-on-push, tag immutability, wildcard policy). Run catalog checks 36-38.
3. ECS: `list-task-definitions` -> `describe-task-definition` and `describe-services` (privileged/host mode, plaintext secrets, public IP). Run catalog checks 39-41.

## Phase 9 — Lambda (per region)
For EACH region in scope:
1. `lambda:ListFunctions` (page through all); for each function: `get-function`, `get-policy` (resource-based policy), `list-function-url-configs`.
2. Inspect runtime, VPC config, environment variables, tracing, code-signing config, reserved concurrency.
3. Run catalog checks 53–60: public access, deprecated runtime, no VPC, env secrets, reserved concurrency, function URL auth, code signing, tracing.

## Phase 10 — API Gateway (per region)
For EACH region in scope:
1. REST APIs: `get-rest-apis` → `get-resources` → `get-method`; inspect authorizer, stage settings.
2. HTTP APIs: `get-apis` → `get-routes` → `get-stages`; inspect authorization, logging.
3. `wafv2:GetWebACLForResource` on stage ARNs.
4. Run catalog checks 61–67: no authorizer, no WAF, logging disabled, no throttling, mutual TLS, client cert, edge endpoint.

## Phase 11 — SNS / SQS (per region)
For EACH region in scope:
1. SNS: `list-topics` → `get-topic-attributes` (policy, encryption, delivery logging).
2. SQS: `list-queues` → `get-queue-attributes` (policy, encryption, DLQ).
3. Run catalog checks 68–73: public access, encryption, delivery logging, DLQ.

## Phase 12 — DynamoDB (per region)
For EACH region in scope:
1. `list-tables` → `describe-table`, `describe-continuous-backups`.
2. Check encryption type, PITR, deletion protection, auto-scaling policies.
3. Run catalog checks 74–77.

## Phase 13 — CloudFront (global)
1. `list-distributions` → `get-distribution` per distribution.
2. Inspect viewer protocol, WAF, certificate, logging, origin access, TLS version, geo-restriction.
3. Run catalog checks 78–84.

## Phase 14 — ELB / ALB / NLB (per region)
For EACH region in scope:
1. `describe-load-balancers` (v2: ALB/NLB), `describe-load-balancers` (classic).
2. `describe-load-balancer-attributes`, `describe-listeners`, `describe-ssl-policies`.
3. `wafv2:GetWebACLForResource` on ALB ARNs.
4. Run catalog checks 85–91: access logs, WAF, deletion protection, TLS policy, HTTP redirect, classic LB, cross-zone.

## Phase 15 — Secrets Manager (per region)
For EACH region in scope:
1. `list-secrets` (page through all); inspect rotation config, KMS key, last accessed date.
2. Run catalog checks 92–94: no rotation, no CMK, stale secrets.

## Phase 16 — WAF (per region + global CloudFront scope)
1. `wafv2:ListWebACLs` (REGIONAL scope per region, CLOUDFRONT scope in us-east-1).
2. Per ACL: `get-web-acl` (rules count, rate-based rules), `get-logging-configuration`.
3. Run catalog checks 95–97: no rules, no logging, no rate-limit.

## Phase 17 — VPC & Networking (per region)
For EACH region in scope:
1. `describe-vpcs`, `describe-flow-logs`, `describe-vpc-endpoints`.
2. Check for flow logs per VPC, default VPC usage (ENIs attached), gateway endpoints.
3. Run catalog checks 98–100.

## Phase 18 — OpenSearch (per region)
For EACH region in scope:
1. `es:ListDomainNames` → `es:DescribeDomain` per domain.
2. Inspect VPC config, access policy, encryption at rest, node-to-node encryption, audit logs.
3. Run catalog checks 101–104.

## Phase 19 — IAM Access Analyzer External Access (per region)
For EACH region in scope:
1. `accessanalyzer:ListAnalyzers` — identify ACCOUNT and ORGANIZATION-level analyzers; also check for UNUSED_ACCESS type analyzers.
2. For each active analyzer, `accessanalyzer:ListFindings` with filter `status=ACTIVE`.
3. Run catalog checks 49–50: external-access findings (FAIL per active finding), unused-access findings (WARN per active finding).
4. If no analyzer exists, check 48 already flags it — skip findings retrieval for that region.

## Phase 20 — Compute Optimizer (global)
1. `compute-optimizer:GetEnrollmentStatus` — confirm whether Compute Optimizer is active for the account. If denied, mark `computeOptimizer: "unavailable"` and continue.
2. If enrolled (`status=Active`), call `compute-optimizer:GetEC2InstanceRecommendations` (page through results); optionally `GetAutoScalingGroupRecommendations`.
3. Run catalog checks 51–52: enrollment status (FAIL if not active), over-provisioned resources (WARN per resource with `OVER_PROVISIONED` finding).

## Phase 21 — EBS (per region)
For EACH region in scope:
1. `ec2:GetEbsEncryptionByDefault` — check account-level default encryption setting.
2. `ec2:DescribeVolumes` (page through all) — check `Encrypted` flag and `State` (available = orphaned).
3. `ec2:DescribeSnapshots` (owner=self) → `ec2:DescribeSnapshotAttribute` (createVolumePermission) for each — check public sharing.
4. Run catalog checks 105–108.

## Phase 22 — EFS (per region)
For EACH region in scope:
1. `efs:DescribeFileSystems` — check encryption, then `efs:DescribeBackupPolicy` per filesystem.
2. `efs:DescribeMountTargets` per filesystem → inspect associated SGs for NFS (2049) open to 0.0.0.0/0.
3. `efs:DescribeFileSystemPolicy` — check for wildcard principal access.
4. Run catalog checks 109–112.

## Phase 23 — ElastiCache (per region)
For EACH region in scope:
1. `elasticache:DescribeReplicationGroups` (Redis) — check transit/at-rest encryption, auth token.
2. `elasticache:DescribeCacheClusters` (Memcached + Redis standalone) — check VPC subnet group.
3. Run catalog checks 113–116.

## Phase 24 — Redshift (per region)
For EACH region in scope:
1. `redshift:DescribeClusters` — check public access, encryption, snapshot retention.
2. `redshift:DescribeLoggingStatus` per cluster — check audit logging.
3. Inspect cluster parameter group for `require_ssl` setting.
4. Run catalog checks 117–121.

## Phase 25 — SageMaker (per region)
For EACH region in scope:
1. `sagemaker:ListNotebookInstances` → `sagemaker:DescribeNotebookInstance` — check internet access, encryption, root access.
2. `sagemaker:ListEndpoints` → `sagemaker:DescribeEndpointConfig` — check VPC config.
3. Run catalog checks 122–125.

## Phase 26 — AMI (per region)
For EACH region in scope:
1. `ec2:DescribeImages` (owner=self) — list owned AMIs.
2. `ec2:DescribeImageAttribute` (launchPermission) per AMI — check for public sharing.
3. Check block device mappings for unencrypted snapshots.
4. Run catalog checks 126–127.

## Phase 27 — Inspector (per region)
For EACH region in scope:
1. `inspector2:BatchGetAccountStatus` — check if Inspector is enabled for EC2/ECR/Lambda.
2. If enabled, `inspector2:ListFindings` (filter severity=CRITICAL/HIGH, state=ACTIVE) — surface active vulnerability findings.
3. `inspector2:ListCoverageStatistics` — check ECR scan coverage.
4. Run catalog checks 128–130.

## Phase 28 — Security Hub (per region)
For EACH region in scope:
1. `securityhub:DescribeHub` — check if Security Hub is enabled.
2. `securityhub:GetEnabledStandards` — check which standards are subscribed.
3. `securityhub:GetFindings` (filter SeverityLabel=CRITICAL, WorkflowStatus=NEW/NOTIFIED) — surface unresolved critical findings.
4. Run catalog checks 131–133.

## Phase 29 — Athena (per region)
For EACH region in scope:
1. `athena:ListWorkGroups` → `athena:GetWorkGroup` per workgroup.
2. Inspect `EncryptionConfiguration` (query results encryption), `EnforceWorkGroupConfiguration`, `PublishCloudWatchMetricsEnabled`, `RequesterPaysEnabled`.
3. `athena:ListNamedQueries` — count for posture awareness.
4. Run catalog checks 134–136.

## Phase 30 — Glue (per region)
For EACH region in scope:
1. `glue:GetDataCatalogEncryptionSettings` — check catalog encryption and connection password encryption.
2. `glue:GetSecurityConfigurations` — list security configurations (S3/CloudWatch/job bookmark encryption).
3. `glue:GetJobs` (page through all) → inspect each job's `SecurityConfiguration`, `WorkerType`, `GlueVersion`.
4. `glue:GetCrawlers` — inspect crawler security configuration.
5. `glue:GetResourcePolicies` — check for overly permissive catalog resource policies.
6. Run catalog checks 137–141.

## Phase 31 — MSK (Amazon Managed Streaming for Apache Kafka) (per region)
For EACH region in scope:
1. `kafka:ListClustersV2` → `kafka:DescribeClusterV2` per cluster.
2. Inspect `EncryptionInfo` (at-rest + in-transit settings), `ClientAuthentication` (TLS/SASL/IAM), `EnhancedMonitoring`, `LoggingInfo`.
3. `kafka:ListConfigurations` — check for insecure configuration overrides.
4. Run catalog checks 142–146.

## Phase 32 — Kinesis (per region)
For EACH region in scope:
1. `kinesis:ListStreams` → `kinesis:DescribeStreamSummary` per stream.
2. Check `EncryptionType` (NONE vs KMS), `StreamModeDetails`, `RetentionPeriodHours`.
3. `firehose:ListDeliveryStreams` → `firehose:DescribeDeliveryStream` per stream; inspect `EncryptionConfiguration`, `S3DestinationDescription` (encryption, compression).
4. Run catalog checks 147–150.

## Phase 33 — Step Functions (per region)
For EACH region in scope:
1. `sfn:ListStateMachines` → `sfn:DescribeStateMachine` per state machine.
2. Inspect `loggingConfiguration` (level, includeExecutionData), `tracingConfiguration`, `encryptionConfiguration`, `type` (STANDARD vs EXPRESS).
3. Check IAM role attached to each state machine for over-permissive policies.
4. Run catalog checks 151–154.

## Phase 34 — AWS Backup (per region)
For EACH region in scope:
1. `backup:ListBackupVaults` → `backup:DescribeBackupVault` per vault; inspect `EncryptionKeyArn`, `LockConfiguration`.
2. `backup:ListBackupPlans` — check existence and frequency of backup plans.
3. `backup:GetBackupVaultAccessPolicy` per vault — check for public/wildcard access.
4. `backup:ListProtectedResources` — cross-reference with critical resources (RDS, DynamoDB, EFS, EBS) for coverage gaps.
5. Run catalog checks 155–159.

## Phase 35 — CloudWatch (per region)
For EACH region in scope:
1. `logs:DescribeLogGroups` (page through all) — check `retentionInDays` (never-expire logs), `kmsKeyId` (encryption).
2. `cloudwatch:DescribeAlarms` — verify alarms exist for critical metrics (billing, root login, unauthorized API calls).
3. `logs:DescribeMetricFilters` — check for CIS-recommended metric filters (unauthorized API, root usage, IAM changes, etc.).
4. Run catalog checks 160–163.

## Phase 36 — EventBridge (per region)
For EACH region in scope:
1. `events:ListEventBuses` → `events:DescribeEventBus` per bus; inspect resource policy for public access.
2. `events:ListRules` per bus — check for security-relevant rules (GuardDuty findings, Config changes, CloudTrail events).
3. `schemas:ListRegistries` — informational posture awareness.
4. Run catalog checks 164–166.

## Phase 37 — AppSync (per region)
For EACH region in scope:
1. `appsync:ListGraphqlApis` → inspect each API's `authenticationType`, `logConfig`, `wafWebAclArn`, `xrayEnabled`.
2. Check for APIs using only `API_KEY` auth (weakest), missing WAF, or disabled logging.
3. Run catalog checks 167–170.

## Phase 38 — Cognito (per region)
For EACH region in scope:
1. `cognito-idp:ListUserPools` → `cognito-idp:DescribeUserPool` per pool.
2. Inspect `MfaConfiguration`, `Policies.PasswordPolicy`, `UserPoolAddOns.AdvancedSecurityMode`, `DeletionProtection`, `AccountRecoverySetting`.
3. `cognito-identity:ListIdentityPools` → `cognito-identity:DescribeIdentityPool`; check `AllowUnauthenticatedIdentities`.
4. Run catalog checks 171–175.

## Phase 39 — Systems Manager (per region)
For EACH region in scope:
1. `ssm:DescribeInstanceInformation` — identify unmanaged instances (cross-ref with EC2).
2. `ssm:GetServiceSetting` for `/ssm/documents/console/public-sharing-permission` — check if document sharing is restricted.
3. `ssm:DescribeParameters` (page through) — check for unencrypted SecureString parameters or parameters without KMS.
4. `ssm:DescribePatchBaselines` + `ssm:DescribePatchGroupState` — check patch compliance state.
5. Run catalog checks 176–179.

## Phase 40 — Network Firewall (per region)
For EACH region in scope:
1. `network-firewall:ListFirewalls` → `network-firewall:DescribeFirewall` per firewall.
2. `network-firewall:DescribeFirewallPolicy` — inspect stateless/stateful rule groups, default actions.
3. `network-firewall:DescribeLoggingConfiguration` — check logging is enabled (ALERT + FLOW).
4. Check if VPCs with internet gateways have Network Firewall protection.
5. Run catalog checks 180–183.

## Phase 41 — Transit Gateway (per region)
For EACH region in scope:
1. `ec2:DescribeTransitGateways` → inspect `AutoAcceptSharedAttachments`, `DefaultRouteTableAssociation`, `DefaultRouteTablePropagation`.
2. `ec2:DescribeTransitGatewayAttachments` — identify cross-account attachments.
3. `ram:GetResourceShares` (filter to TGW resources) — check sharing scope.
4. Run catalog checks 184–186.

## Phase 42 — Global Accelerator (global)
1. `globalaccelerator:ListAccelerators` → `globalaccelerator:DescribeAccelerator` per accelerator.
2. `globalaccelerator:ListListeners` → `globalaccelerator:ListEndpointGroups` — inspect health checks, traffic dial.
3. Check if flow logs are enabled via `globalaccelerator:DescribeAcceleratorAttributes`.
4. Run catalog checks 187–189.

## Phase 43 — Route 53 (global)
1. `route53:ListHostedZones` → for each zone check if private/public.
2. `route53domains:ListDomains` — check `AutoRenew`, `TransferLock`.
3. `route53:GetDNSSEC` per public hosted zone — check DNSSEC signing status.
4. `route53:GetQueryLoggingConfig` per zone — check DNS query logging.
5. `route53resolver:ListResolverQueryLogConfigs` — check resolver query logging in VPCs.
6. Run catalog checks 190–194.

## Phase 44 — Consolidate
1. Score every finding PASS/WARN/FAIL with check ID + severity.
2. **Validate resource identifiers**: For every finding, ensure `resourceArn`, `resourceName`, and `resourceId` are populated. Construct ARNs where APIs only return IDs (e.g., `arn:aws:ec2:<region>:<accountId>:security-group/<sg-id>`). Resolve Name tags where available.
3. **Compliance mapping (ONLY in compliance-scan mode)**:
   - If the scan was triggered by the `compliance-scan` skill, look up each check ID in `steering/checks-catalog.md` § "Compliance Framework Mappings" and attach ONLY the requested framework's control references.
   - Compute compliance posture: calculate pass rate for the requested framework (passing controls / total mapped controls).
   - If the scan was triggered by the `scan` skill (General Security Scan), **skip this step entirely** — no compliance mapping.
4. **Apply accepted-risk exceptions**: for each FAIL, if a row in the exceptions list matches on BOTH `check_id` AND `resource_arn` (exact, or the resource identifier is contained in the ARN), downgrade its status to `PASS (accepted)` and attach the row's `reason` + `owner`. An expired `review_date` (before today) does NOT auto-suppress — keep it as FAIL and add an `exceptionExpired` note so stale acceptances resurface.
5. Recompute the summary:
   - **General mode**: `PASS (accepted)` findings are excluded from the risk score.
   - **Compliance mode**: `PASS (accepted)` findings count as passing for the control.
6. Hand off to `steering/report-output.md` to write Markdown + HTML to `outputDir` using the appropriate mode (general or compliance).

## Hygiene
- Page through ALL results before scoring (don't stop at the first page).
- Surface a one-line progress note per phase to the user.
- Never mutate anything — this is a read-only posture scan. The `aws-mcp` proxy runs with `--read-only` and the IAM MCP server with `--readonly`, so write-capable tools are hidden.

## Sensitive data handling
This scan reads AWS metadata that is itself sensitive. Apply these rules when recording evidence and writing reports:
- **Lambda / ECS environment variables (Phase 9, checks 53–60)**: When flagging plaintext secrets in env vars, record the variable **name** and the fact that it looks secret-like — never the **value**. Do not copy environment-variable values into findings or reports.
- **IAM policy documents (Phase 2, checks 3/44)**: Summarize the risky statement (e.g., "allows `iam:*` on `*`"); do not paste full inline or managed policy JSON into evidence.
- **Secrets Manager / SSM SecureString (Phases 15, 39)**: Never retrieve or decrypt values (`GetSecretValue`, `GetParameter` with decryption). Use metadata only — name, ARN, rotation status, KMS key.
- **Credentials & tokens**: Never emit access key secrets, session tokens, or password values.
- **Resource identifiers** (ARNs, IPs, endpoints, account IDs): Included by design for remediation. Because reports contain this identifying data, they are written to `outputDir` locally only and are never uploaded anywhere.
