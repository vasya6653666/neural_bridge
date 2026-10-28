# Security Checks Catalog

Every check below has a stable check ID owned by this power
(grouped by AWS service domain). Severity: **H**=High, **M**=Medium, **L**=Low.
Evaluate each finding as **PASS / WARN / FAIL** and carry the rule ID + severity into the report.

All discovery calls go through the `aws-mcp` server tools (read-only: `describe*`, `list*`, `get*`).

---

## Trusted Advisor (pull once)

- Use `Support:DescribeTrustedAdvisorChecks` (language=en, global via `us-east-1`), filter to **category = security**.
- `Support:DescribeTrustedAdvisorCheckResult` per security check ID; keep only `status in {warning, error}` (flagged).
- Cache the full result set in run state — do NOT re-poll per finding.
- If Support API is denied (no Business/Enterprise Support), skip and note "TA unavailable" in the report; the direct checks below still cover the same ground.

---

## IAM & credential checks

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 1 | Unused key pairs | `EC2KeyPairNotInUse` | L | List key pairs, cross-ref against running/stopped instances; FAIL any key pair referenced by 0 instances. |
| 2 | Un-rotated access / secret keys | `hasAccessKeyNoRotate30days` (M), `hasAccessKeyNoRotate90days` (H) | M/H | From credential report / `list-access-keys` + `get-access-key-last-used`: WARN >30d since rotation, FAIL >90d. |
| 3 | Over-permissive permissions | `wildcardActionsDetection` (H), `InlinePolicyFullAdminAccess` (H), `ManagedPolicyFullAccessOneServ` (H), `missingPermissionsBoundaries` (M), `missingPolicyConditions` (H) | H | FAIL policies with `Action:"*"` / `Resource:"*"` / full admin; WARN roles/users without permissions boundary. |
| 4 | IAM roles unaccessed 180+ days | `unusedRole` (L), `roleLongSession` (L) | L | `get-role` → `RoleLastUsed.LastUsedDate`; FAIL if null or older than `unusedRoleThresholdDays` (default 180). Also flag `MaxSessionDuration` > 12h. |
| 5 | Inactive IAM users | `userNoActivity90days` (H), `consoleLastAccess365` (H) | H | Credential report: FAIL users with no console/key activity in 90d; escalate at 365d. |
| 6 | MFA not enabled | `mfaActive` (H), `rootMfaActive` (H) | H | FAIL any console-enabled user without MFA; FAIL root without MFA (highest priority). |

---

## EC2 / network checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 7 | IMDSv2 not enforced | `EC2IMDSv2` (H), `ASGIMDSv2` (L) | H | `describe-instances` → `MetadataOptions.HttpTokens`; FAIL if not `required`. Also check launch templates behind ASGs. |
| 8 | Inbound open to 0.0.0.0/0 | `SGAllPortOpenToAll` (H), `SGAllPortOpen` (H) | H | `describe-security-groups`; FAIL any ingress rule with `0.0.0.0/0` or `::/0` on all ports / wide ranges. |
| 9 | SSH port 22 open to world | `SGSensitivePortOpenToAll` (H), `NACLSensitivePort` (H) | H | FAIL ingress allowing tcp/22 (and RDP 3389) from `0.0.0.0/0`; also inspect NACLs. |
| 10 | SSM not enabled | `EC2SSMNotManaged` (M) | M | Cross-ref `describe-instances` against SSM `describe-instance-information`; FAIL instances not registered as managed. |
| 11 | Termination protection off | `EC2NoTerminationProtection` (M) | M | `describe-instance-attribute` `disableApiTermination`; FAIL if `false`. Apply to all in-scope instances. |

---

## S3 checks (global + per bucket)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 12 | Account-level public access block | `S3AccountPublicAccessBlock` (H) | H | `get-public-access-block` at account level; FAIL if all four flags not enabled. |
| 13 | Bucket public access | `PublicAccessBlock` (H), `PublicReadAccessBlock` (H), `PublicWriteAccessBlock` (H) | H | Per bucket public access block + `get-bucket-policy-status`; FAIL any public read/write. |
| 14 | Wildcard bucket policy | `WildcardPrincipalsActions` (H) | H | FAIL bucket policies with `Principal:"*"` + broad actions and no condition. |
| 15 | Encryption at rest | `ServerSideEncrypted` (M), `SSEWithKMS` (M) | M | `get-bucket-encryption`; WARN if unencrypted; note SSE-S3 vs SSE-KMS. |
| 16 | TLS-only enforced | `TlsEnforced` (M) | M | FAIL if no `aws:SecureTransport=false` deny in bucket policy. |
| 17 | Versioning / MFA delete | `BucketVersioning` (L), `MFADelete` (M) | L/M | WARN if versioning suspended; note MFA-delete status. |
| 17a | Versioning enabled requires lifecycle | `BucketVersioning` + `BucketLifecycle` (M) | M | If `get-bucket-versioning` = Enabled, then `get-bucket-lifecycle-configuration` MUST return a rule that expires noncurrent versions (e.g. `NoncurrentVersionExpiration`). FAIL a versioning-enabled bucket with no lifecycle rule managing old versions. |
| 17b | Object-level write logging (CIS 3.8 / S3.22) | `S3ObjectWriteLogging` (M) | M | Cross-ref CloudTrail data events: for each bucket, check `cloudtrail:GetEventSelectors` / advanced event selectors on all trails for an S3 data-event selector covering the bucket with `WriteOnly` or `All` read/write type. FAIL buckets not covered by any trail logging object-level **write** events. |
| 17c | Object-level read logging (CIS 3.9 / S3.23) | `S3ObjectReadLogging` (M) | M | Same as 17b but for **read** events; FAIL buckets not covered by any trail logging object-level **read** events (`ReadOnly` or `All`). |

---


## RDS / data-protection checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 18 | RDS deletion protection off | `DeleteProtection` (H), `DeleteProtectionCluster` (H) | H | `describe-db-instances` / `describe-db-clusters` `DeletionProtection`; FAIL if `false`. Cluster-level applies to Aurora. |
| 19 | RDS publicly accessible | `PubliclyAccessible` (H), `SnapshotRDSIsPublic` (H) | H | FAIL instances with `PubliclyAccessible=true`; FAIL any public DB snapshot. |
| 20 | RDS storage not encrypted | `StorageEncrypted` (M) | M | `describe-db-instances` `StorageEncrypted`; FAIL if `false`. |
| 21 | RDS backups / cross-region | `Backup` (H), `BackupTooLow` (H), `CrossRegionBackupNotEnabled` (H) | H | FAIL if automated backups disabled or retention too low; WARN if no cross-region backup. |
| 22 | RDS secret rotation | `Secret__NoRotation` (M), `DBwithoutSecretManager` (M) | M | WARN DBs whose Secrets Manager secret has no rotation, or not using Secrets Manager at all. |
| 22a | RDS auto minor version upgrade off (CIS 2.3.2 / RDS.13) | `RdsNoMinorVersionUpgrade` (L) | L | `describe-db-instances`; FAIL instances with `AutoMinorVersionUpgrade=false` (security patches for the DB engine are not applied automatically). |

---

## Detective controls - GuardDuty & CloudTrail

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 23 | GuardDuty enabled + active findings | `Findings` (H), `Settings` (L), `FailMeetingCompliances` (H) | H | `list-detectors` per region; FAIL if no active detector. If enabled, surface open high/critical findings. |
| 24 | CloudTrail enabled | `NeedToEnableCloudTrail` (H), `EnableCloudTrailLogging` (H) | H | `describe-trails` + `get-trail-status`; FAIL if no trail or logging stopped. |
| 25 | Multi-region trail | `HasOneMultiRegionTrail` (H), `OrganizationTrailEnabled` (H) | H | FAIL if no multi-region trail; note org-trail status. |
| 26 | Log file validation | `LogFileValidationEnabled` (L) | L | WARN if `LogFileValidationEnabled=false`. |
| 26a | Trail not encrypted at rest with KMS (CIS 3.5 / CloudTrail.2) | `TrailKmsEncryption` (M) | M | `cloudtrail:DescribeTrails` / `GetTrail`; FAIL any trail where `KmsKeyId` is absent (logs use default SSE-S3 rather than a customer-managed KMS key — CIS requires SSE-KMS). |
| 27 | Trail S3 bucket hardening | `EnableTrailS3BucketLogging` (H), `EnableTrailS3BucketVersioning` (H), `EnableS3PublicAccessBlock` (H) | H | FAIL if the trail's S3 bucket lacks logging/versioning/public-access-block. |
| 28 | GuardDuty / Security Hub integration | `GuardDutyIntegration` (H), `SecurityHubIntegration` (H) | H | Note whether findings flow to Security Hub / GuardDuty. |

---

## KMS checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 29 | Key rotation disabled | `KeyRotationEnabled` (M) | M | `get-key-rotation-status` per CMK; FAIL customer-managed keys with rotation off. |
| 30 | Over-permissive key policy | `KeyPolicyWildcardPrincipal` (H), `KeyPolicyWildcardAction` (H), `GrantWildcardPrincipal` (H), `KeyPolicySensitiveActionsNotRestricted` (H) | H | FAIL key policies/grants with `Principal:"*"` or unrestricted sensitive actions and no conditions. |

---


## Container security - EKS / ECS / ECR (per region)

Container coverage for EKS, ECR, and ECS. These are this power's own checks.

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 31 | EKS public endpoint exposure | `eksEndpointPublicAccess`, `eksPublicEndpointNoCidrRestriction` | H | `describe-cluster`; FAIL if API endpoint is public with no CIDR restriction. |
| 32 | EKS secrets not encrypted (KMS) | `eksSecretsEncryption`, `eksSecretsEncryptionNoKMS` | H | FAIL if envelope encryption of secrets with a KMS key is not configured. |
| 33 | EKS control-plane logging off | `eksClusterLogging`, `eksClusterLoggingIncomplete` | L/H | FAIL/WARN if audit + authenticator control-plane logs are not all enabled. |
| 34 | EKS cluster role least-privilege / IRSA | `eksClusterRoleLeastPrivilege`, `eksNoIRSAConfigured` | H | FAIL over-privileged cluster role; FAIL if IRSA (IAM Roles for Service Accounts) not configured. |
| 35 | EKS SG restriction + version EOL | `eksClusterSGRestriction`, `eksClusterVersionEol` | H | FAIL wide cluster SG; FAIL clusters on end-of-life Kubernetes versions. |
| 36 | ECR image scan on push | `EcrScanOnPush` | H | `describe-repositories`; FAIL repos with `imageScanningConfiguration.scanOnPush=false`. |
| 37 | ECR tag immutability | `EcrTagImmutability` | M | FAIL repos with `imageTagMutability=MUTABLE`. |
| 38 | ECR no wildcard repo policy + lifecycle | `EcrWildcardRepoPolicy`, `EcrLifecyclePolicy`, `EcrEncryptionKms` | H | `get-repository-policy`; FAIL wildcard principal without conditions. WARN missing lifecycle policy / non-KMS encryption. |
| 39 | ECS task def no privileged / hardening | `EcsTaskPrivileged`, `EcsReadonlyRootFilesystem`, `EcsHostNetworkMode` | H | `describe-task-definition`; FAIL privileged containers or host networking; WARN writable root filesystem. |
| 40 | ECS no secrets in env vars | `EcsSecretsInEnv` | H | FAIL task defs passing secrets via plaintext `environment` instead of `secrets` (Secrets Manager/SSM). |
| 41 | ECS container logging | `EcsTaskDefLogging` | L | WARN containers with no `logConfiguration`. |

---


## Account-level foundations & governance

Account-level identity and governance foundations aligned to the AWS Well-Architected Security Pillar and the AWS security-review checklist (root hygiene, password policy, detective services).

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 42 | Root account has access keys | `rootHasAccessKey` | H | Credential report: FAIL if the root user has ANY access key (active or inactive). CRITICAL priority. |
| 43 | Root recent usage / console login | `rootConsoleLogin30days`, `rootConsoleLoginFail3x` | H | FAIL if root was used for daily ops in the last 30d; flag repeated root login failures. |
| 44 | Weak IAM password policy | `passwordPolicy`, `passwordPolicyWeak`, `passwordPolicyReuse`, `passwordPolicyLength` | L | `get-account-password-policy`; FAIL if missing/weak (length < 14, reuse allowed, no complexity). |
| 45 | Inline policies on users | `InlinePolicy`, `InlinePolicyFullAccessOneServ` | L/H | FAIL users/roles with inline policies (prefer managed); escalate if inline grants full service access. |
| 46 | AWS Config not enabled | `EnableConfigService`, `PartialEnableConfigService` | H | FAIL if AWS Config recording is off (or partial) in scanned regions. |
| 47 | Alternate contacts missing | `hasAlternateContact` | H | FAIL if billing/operations/security alternate contacts are not configured. |
| 48 | IAM Access Analyzer disabled | `IamAccessAnalyzerEnabled` | M | `access-analyzer list-analyzers`; WARN if no account/org analyzer active. |
| 48a | No AWS Support incident-management role (CIS 1.17 / IAM.18) | `SupportRoleExists` | L | `iam:ListEntitiesForPolicy` on the `AWSSupportAccess` managed policy (ARN `arn:aws:iam::aws:policy/AWSSupportAccess`); FAIL if no IAM user, group, or role is attached (no one can manage AWS Support incidents). |
| 48b | Expired SSL/TLS certificates in IAM (CIS 1.19 / IAM.26) | `ExpiredServerCertificate` | M | `iam:ListServerCertificates`; FAIL any server certificate whose `Expiration` is in the past (expired certs should be removed to prevent accidental use). |
| 48c | AWSCloudShellFullAccess attached (CIS 1.22 / IAM.27) | `CloudShellFullAccessAttached` | M | `iam:ListEntitiesForPolicy` on `arn:aws:iam::aws:policy/AWSCloudShellFullAccess`; FAIL any IAM user, group, or role with this policy attached (grants broad CloudShell access incl. file transfer / internet egress). |

---

## Lambda checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 53 | Lambda function public access | `LambdaPublicAccess` | H | `get-policy` per function; FAIL if resource-based policy grants invoke to `Principal:"*"` without conditions. |
| 54 | Lambda using deprecated runtime | `LambdaDeprecatedRuntime` | H | `list-functions` → `Runtime`; FAIL functions on EOL/deprecated runtimes (e.g. python3.7, nodejs14.x, dotnetcore3.1). |
| 55 | Lambda no VPC configured | `LambdaNoVpc` | L | WARN functions with no VPC configuration (acceptable for many use cases; flag for data-processing functions). |
| 56 | Lambda env vars with secrets | `LambdaEnvSecrets` | H | Inspect `Environment.Variables` keys/values for patterns like `PASSWORD`, `SECRET`, `API_KEY`, `TOKEN`; FAIL if plaintext secrets detected (should use Secrets Manager / SSM Parameter Store). |
| 57 | Lambda reserved concurrency not set | `LambdaNoReservedConcurrency` | L | WARN functions without `ReservedConcurrentExecutions` set — risk of noisy-neighbor throttling. |
| 58 | Lambda function URL auth | `LambdaFunctionUrlNoAuth` | H | `list-function-url-configs`; FAIL if `AuthType=NONE` (unauthenticated public endpoint). |
| 59 | Lambda code signing not configured | `LambdaNoCodeSigning` | M | WARN functions without a code-signing configuration (allows unsigned deployments). |
| 60 | Lambda tracing disabled | `LambdaTracingDisabled` | L | WARN if `TracingConfig.Mode` ≠ `Active` (X-Ray tracing not enabled). |

---

## API Gateway checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 61 | API Gateway no authorization | `ApiGwNoAuthorizer` | H | REST APIs: `get-resources` + `get-method`; FAIL methods with `authorizationType=NONE` on non-OPTIONS methods. HTTP APIs: `get-routes`; FAIL routes with no authorizer. |
| 62 | API Gateway no WAF association | `ApiGwNoWaf` | M | `wafv2:GetWebACLForResource` on stage ARN; WARN if no Web ACL attached. |
| 63 | API Gateway logging disabled | `ApiGwLoggingDisabled` | M | `get-stage`; FAIL if `accessLogSettings` is absent or `methodSettings` lack `loggingLevel` data/error. |
| 64 | API Gateway no throttling | `ApiGwNoThrottling` | M | WARN if stage/method default throttle limits are not explicitly configured (uses account-level defaults). |
| 65 | API Gateway mutual TLS disabled | `ApiGwNoMtls` | L | For custom domains; WARN if `mutualTlsAuthentication` is not configured. |
| 66 | API Gateway no client certificate | `ApiGwNoClientCert` | L | REST API stages; WARN if no `clientCertificateId` for backend TLS verification. |
| 67 | API Gateway REST API endpoint type | `ApiGwEdgeEndpoint` | L | WARN if REST API uses EDGE endpoint (prefer REGIONAL/PRIVATE for lower attack surface). |

---

## SNS checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 68 | SNS topic public access | `SnsTopicPublicAccess` | H | `get-topic-attributes`; FAIL if policy allows `Principal:"*"` publish/subscribe without conditions. |
| 69 | SNS topic not encrypted | `SnsTopicNotEncrypted` | M | WARN if `KmsMasterKeyId` is absent (server-side encryption disabled). |
| 70 | SNS no delivery logging | `SnsNoDeliveryLogging` | L | WARN if no delivery status logging configured for any protocol. |

---

## SQS checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 71 | SQS queue public access | `SqsQueuePublicAccess` | H | `get-queue-attributes`; FAIL if policy allows `Principal:"*"` send/receive without conditions. |
| 72 | SQS queue not encrypted | `SqsQueueNotEncrypted` | M | FAIL if neither `SqsManagedSseEnabled` nor `KmsMasterKeyId` is set. |
| 73 | SQS dead-letter queue not configured | `SqsNoDlq` | L | WARN if `RedrivePolicy` is absent (messages can be lost on failure). |

---

## DynamoDB checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 74 | DynamoDB table not encrypted with CMK | `DynamoDbNoCmkEncryption` | L | `describe-table`; WARN if `SSEDescription.SSEType` ≠ `KMS` (DEFAULT uses AWS-owned key — acceptable but less control). |
| 75 | DynamoDB PITR not enabled | `DynamoDbNoPitr` | M | `describe-continuous-backups`; FAIL if `PointInTimeRecoveryStatus` ≠ `ENABLED`. |
| 76 | DynamoDB deletion protection off | `DynamoDbNoDeletionProtection` | M | `describe-table`; FAIL if `DeletionProtectionEnabled` = `false`. |
| 77 | DynamoDB table no auto-scaling | `DynamoDbNoAutoScaling` | L | For provisioned tables, WARN if no auto-scaling policies registered (risk of throttling or over-provisioning). |

---

## CloudFront checks (global)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 78 | CloudFront no HTTPS-only | `CloudFrontNoHttpsOnly` | H | `list-distributions` + `get-distribution`; FAIL if `ViewerProtocolPolicy` = `allow-all` on any cache behavior. |
| 79 | CloudFront no WAF | `CloudFrontNoWaf` | M | FAIL if `WebACLId` / `WebACLArn` is empty. |
| 80 | CloudFront default certificate | `CloudFrontDefaultCert` | M | WARN if using the default `*.cloudfront.net` certificate instead of a custom SSL cert. |
| 81 | CloudFront access logging disabled | `CloudFrontNoLogging` | L | WARN if `Logging.Enabled` = `false`. |
| 82 | CloudFront origin not using OAC/OAI | `CloudFrontNoOac` | H | For S3 origins, FAIL if no Origin Access Control (OAC) or legacy OAI is configured (bucket is directly accessible). |
| 83 | CloudFront TLS minimum version | `CloudFrontOldTls` | M | WARN if `MinimumProtocolVersion` < `TLSv1.2_2021`. |
| 84 | CloudFront geo-restriction not set | `CloudFrontNoGeoRestriction` | L | WARN if `GeoRestriction.RestrictionType` = `none` (informational). |

---

## ELB / ALB / NLB checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 85 | ALB/NLB access logging disabled | `ElbNoAccessLogs` | M | `describe-load-balancer-attributes`; FAIL if `access_logs.s3.enabled` = `false`. |
| 86 | ALB no WAF associated | `AlbNoWaf` | M | `wafv2:GetWebACLForResource` on ALB ARN; WARN if no Web ACL. |
| 87 | ALB/NLB deletion protection off | `ElbNoDeletionProtection` | M | FAIL if `deletion_protection.enabled` = `false`. |
| 88 | ALB using insecure cipher/TLS | `AlbInsecureTls` | H | `describe-listeners` + `describe-ssl-policies`; FAIL listeners on policies older than `ELBSecurityPolicy-TLS13-1-2-2021-06` or equivalent. |
| 89 | ALB HTTP listener without redirect | `AlbHttpNoRedirect` | M | FAIL HTTP (port 80) listeners that don't have a redirect action to HTTPS. |
| 90 | Classic LB in use | `ClassicLbInUse` | L | WARN any classic ELB (recommend migration to ALB/NLB). |
| 91 | NLB cross-zone disabled | `NlbNoCrossZone` | L | WARN if cross-zone load balancing is not enabled. |

---

## Secrets Manager checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 92 | Secret not rotated | `SecretsManagerNoRotation` | M | `list-secrets` → `RotationEnabled`; FAIL if rotation not configured or `LastRotatedDate` > 90d. |
| 93 | Secret not encrypted with CMK | `SecretsManagerNoCmk` | L | WARN if `KmsKeyId` is absent or uses default `aws/secretsmanager` key (less control). |
| 94 | Secret unused / stale | `SecretsManagerStaleSecret` | L | WARN if `LastAccessedDate` > 90d (potential orphaned secret). |

---

## WAF checks (per region + global)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 95 | WAF Web ACL no rules | `WafNoRules` | H | `get-web-acl`; FAIL if `Rules` array is empty (ACL exists but blocks nothing). |
| 96 | WAF logging disabled | `WafNoLogging` | M | `get-logging-configuration`; FAIL if no logging destination configured. |
| 97 | WAF no rate-based rules | `WafNoRateLimit` | M | WARN if no rate-based rule present in the Web ACL (no DDoS/brute-force mitigation). |

---

## VPC & Networking checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 98 | VPC flow logs disabled | `VpcNoFlowLogs` | M | `describe-flow-logs` per VPC; FAIL if no flow log configured. |
| 99 | Default VPC in use | `DefaultVpcInUse` | L | WARN if the default VPC has any running resources (ENIs attached). |
| 100 | VPC endpoint not used for S3/DynamoDB | `VpcNoGatewayEndpoint` | L | WARN VPCs without gateway endpoints for S3/DynamoDB (traffic traverses internet). |

---

## Elasticsearch / OpenSearch checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 101 | OpenSearch domain publicly accessible | `OpenSearchPublicAccess` | H | `describe-domain`; FAIL if no VPC endpoint configured or access policy allows `Principal:"*"`. |
| 102 | OpenSearch encryption at rest | `OpenSearchNoEncryption` | M | FAIL if `EncryptionAtRestOptions.Enabled` = `false`. |
| 103 | OpenSearch node-to-node encryption | `OpenSearchNoNodeEncryption` | M | FAIL if `NodeToNodeEncryptionOptions.Enabled` = `false`. |
| 104 | OpenSearch audit logging | `OpenSearchNoAuditLogs` | L | WARN if audit logs not published to CloudWatch. |

---

## IAM Access Analyzer — External Access (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 49 | External access findings present | `IamAccessAnalyzerExternalFindings` | H | `accessanalyzer:ListFindings` (filter `analyzerArn` for ACCOUNT/ORG type, `status=ACTIVE`, `resourceType` not filtered). FAIL if any active external-access findings exist — each finding becomes a separate FAIL entry with the resource ARN and principal. |
| 50 | Unused access findings present | `IamAccessAnalyzerUnusedAccess` | M | If an UNUSED_ACCESS analyzer exists, `ListFindings` with `status=ACTIVE`. WARN for each active unused-access finding (unused role, unused permission, unused access key). |

---

## Compute Optimizer (global)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 51 | Compute Optimizer not enabled | `ComputeOptimizerNotEnabled` | M | `compute-optimizer:GetEnrollmentStatus`; FAIL if `status` ≠ `Active`. Note: requires `compute-optimizer:GetEnrollmentStatus` permission. If denied, mark as "unavailable" and continue. |
| 52 | Compute Optimizer over-provisioned resources | `ComputeOptimizerOverProvisioned` | L | If enrolled, call `GetEC2InstanceRecommendations` (and optionally `GetAutoScalingGroupRecommendations`). WARN for any resource with finding = `OVER_PROVISIONED`. Report the instance ID and recommended instance type. |

---

## Compliance Framework Mappings

Every check in this catalog maps to one or more industry compliance benchmarks. The mapping allows the report to show which frameworks a finding violates. Use the compliance tags in the report output alongside the check ID and severity.

### CIS AWS Foundations Benchmark v3.0.0

Aligned to the official AWS Security Hub CSPM control mapping for CIS AWS Foundations
Benchmark **v3.0.0** (37 controls). Source: [CIS AWS Foundations Benchmark in Security Hub CSPM](https://docs.aws.amazon.com/securityhub/latest/userguide/cis-aws-foundations-benchmark.html).
The `Security Hub Control` column is the canonical control ID; `CIS 3.0.0` is the CIS
requirement number. Content adapted from AWS documentation for compliance with licensing restrictions.

| Check ID(s) | Security Hub Control | CIS Control title | CIS 3.0.0 |
|-------------|----------------------|-------------------|-----------|
| `hasAlternateContact` | Account.1 | Security contact information should be provided for an AWS account | 1.2 |
| `NeedToEnableCloudTrail`, `EnableCloudTrailLogging`, `HasOneMultiRegionTrail` | CloudTrail.1 | CloudTrail enabled with at least one multi-Region trail (read + write management events) | 3.1 |
| `TrailKmsEncryption` | CloudTrail.2 | CloudTrail should have encryption at-rest enabled | 3.5 |
| `LogFileValidationEnabled` | CloudTrail.4 | CloudTrail log file validation should be enabled | 3.2 |
| `EnableTrailS3BucketLogging` | CloudTrail.7 | S3 bucket access logging enabled on the CloudTrail S3 bucket | 3.4 |
| `EnableConfigService`, `PartialEnableConfigService` | Config.1 | AWS Config should be enabled and use the service-linked role | 3.3 |
| `DefaultVpcInUse` | EC2.2 | VPC default security groups should not allow inbound or outbound traffic | 5.4 |
| `VpcNoFlowLogs` | EC2.6 | VPC flow logging should be enabled in all VPCs | 3.7 |
| `EbsDefaultEncryptionDisabled` | EC2.7 | EBS default encryption should be enabled | 2.2.1 |
| `EC2IMDSv2` | EC2.8 | EC2 instances should use Instance Metadata Service v2 (IMDSv2) | 5.6 |
| `NACLSensitivePort` | EC2.21 | Network ACLs should not allow ingress from 0.0.0.0/0 to port 22 or 3389 | 5.1 |
| `SGSensitivePortOpenToAll`, `SGAllPortOpenToAll` | EC2.53 | Security groups should not allow ingress from 0.0.0.0/0 to remote admin ports | 5.2 |
| `SGSensitivePortOpenToAll` | EC2.54 | Security groups should not allow ingress from ::/0 to remote admin ports | 5.3 |
| `EfsNotEncrypted` | EFS.1 | EFS should encrypt file data at rest using AWS KMS | 2.4.1 |
| `InlinePolicy`, `InlinePolicyFullAccessOneServ` | IAM.2 | IAM users should not have IAM policies attached | 1.15 |
| `hasAccessKeyNoRotate90days` | IAM.3 | IAM users' access keys should be rotated every 90 days or less | 1.14 |
| `rootHasAccessKey` | IAM.4 | IAM root user access key should not exist | 1.4 |
| `mfaActive` | IAM.5 | MFA enabled for all IAM users with a console password | 1.10 |
| `rootMfaActive` | IAM.6 | Hardware MFA should be enabled for the root user | 1.6 |
| `rootMfaActive` | IAM.9 | MFA should be enabled for the root user | 1.5 |
| `passwordPolicy`, `passwordPolicyLength` | IAM.15 | IAM password policy requires minimum length of 14 or greater | 1.8 |
| `passwordPolicyReuse` | IAM.16 | IAM password policy prevents password reuse | 1.9 |
| `SupportRoleExists` | IAM.18 | A support role should exist to manage incidents with AWS Support | 1.17 |
| `userNoActivity90days` | IAM.22 | IAM user credentials unused for 45 days should be removed | 1.12 |
| `ExpiredServerCertificate` | IAM.26 | Expired SSL/TLS certificates managed in IAM should be removed | 1.19 |
| `CloudShellFullAccessAttached` | IAM.27 | IAM identities should not have the AWSCloudShellFullAccess policy attached | 1.22 |
| `IamAccessAnalyzerEnabled` | IAM.28 | IAM Access Analyzer external access analyzer should be enabled | 1.20 |
| `KeyRotationEnabled` | KMS.4 | AWS KMS key rotation should be enabled | 3.6 |
| `PubliclyAccessible` | RDS.2 | RDS DB instances should prohibit public access | 2.3.3 |
| `StorageEncrypted` | RDS.3 | RDS DB instances should have encryption at rest enabled | 2.3.1 |
| `RdsNoMinorVersionUpgrade` | RDS.13 | RDS automatic minor version upgrades should be enabled | 2.3.2 |
| `S3AccountPublicAccessBlock` | S3.1 | S3 buckets should have block public access settings enabled | 2.1.4 |
| `TlsEnforced` | S3.5 | S3 buckets should require requests to use SSL | 2.1.1 |
| `PublicAccessBlock` | S3.8 | S3 buckets should block public access | 2.1.4 |
| `MFADelete` | S3.20 | S3 buckets should have MFA delete enabled | 2.1.2 |
| `S3ObjectWriteLogging` | S3.22 | S3 buckets should log object-level write events | 3.8 † |
| `S3ObjectReadLogging` | S3.23 | S3 buckets should log object-level read events | 3.9 † |

> † S3.22 / S3.23 are part of the official CIS v3.0.0 control set (per the AWS Security Hub
> CSPM standard). The AWS version-comparison table does not print an explicit CIS
> requirement number for them; 3.8 / 3.9 reflect the CIS Benchmark logging section for
> object-level write/read events. Verify against your CIS v3.0.0 PDF if an exact citation is required.

> **Note on manual checks:** CIS v3.0.0 removed the CloudWatch metric-filter/alarm
> requirements (root usage, unauthorized API calls, etc.) that existed in v1.4.0/v1.2.0.
> Those are now "manual checks" in CIS v3.0.0. This power still evaluates them via
> `CloudWatchNoRootAlarm` (root usage) and `CloudWatchNoUnauthorizedAlarm` (unauthorized
> API calls) as defense-in-depth, but they are **not** scored CIS v3.0.0 controls.

### HIPAA Security Rule (45 CFR Part 164, Subpart C)

HIPAA is **not** an AWS Security Hub standard. AWS delivers HIPAA alignment through the
**AWS Config "Operational Best Practices for HIPAA Security" conformance pack**, which
maps each AWS Config managed rule to one or more HIPAA Security Rule safeguard citations.
Source: [Operational Best Practices for HIPAA Security](https://docs.aws.amazon.com/config/latest/developerguide/operational-best-practices-for-hipaa_security.html).
The table below maps this power's checks to the same safeguard citations that the AWS
conformance pack uses for the equivalent Config rule. HIPAA safeguards are
implementation-flexible, so a single check can support several citations. Safeguard text
paraphrased from the HIPAA Security Rule; content adapted for compliance with licensing restrictions.

| Check ID(s) | Equivalent AWS Config rule | HIPAA Safeguard | Reference |
|-------------|----------------------------|-----------------|-----------|
| `mfaActive` | `mfa-enabled-for-iam-console-access` | Access Control — Unique User Identification | §164.312(a)(2)(i) |
| `mfaActive`, `rootMfaActive` | `root-account-mfa-enabled`, `iam-user-mfa-enabled` | Person or Entity Authentication | §164.312(d) |
| `rootHasAccessKey` | `iam-root-access-key-check` | Access Control — restrict privileged credentials | §164.312(a)(1) |
| `hasAccessKeyNoRotate90days` | `access-keys-rotated` | Access Control — credential lifecycle management | §164.308(a)(4)(ii)(B) |
| `userNoActivity90days` | `iam-user-unused-credentials-check` | Workforce Security — termination / access review | §164.308(a)(3)(ii)(C) |
| `wildcardActionsDetection`, `InlinePolicyFullAdminAccess` | `iam-policy-no-statements-with-admin-access` | Access Control — least privilege / minimum necessary | §164.308(a)(4), §164.502(b) |
| `ServerSideEncrypted`, `SSEWithKMS` | `s3-bucket-server-side-encryption-enabled` | Encryption at rest — ePHI protection | §164.312(a)(2)(iv), §164.312(e)(2)(ii) |
| `StorageEncrypted` | `rds-storage-encrypted` | Encryption at rest — ePHI protection | §164.312(a)(2)(iv) |
| `EbsVolumeNotEncrypted`, `EbsDefaultEncryptionDisabled` | `encrypted-volumes` / `ec2-ebs-encryption-by-default` | Encryption at rest — ePHI protection | §164.312(a)(2)(iv) |
| `EfsNotEncrypted` | `efs-encrypted-check` | Encryption at rest — ePHI protection | §164.312(a)(2)(iv) |
| `RedshiftNotEncrypted`, `ElastiCacheNoAtRestEncryption`, `OpenSearchNoEncryption` | `redshift-cluster-kms-enabled`, `elasticache-repl-grp-encrypted-at-rest`, `elasticsearch-encrypted-at-rest` | Encryption at rest — ePHI protection | §164.312(a)(2)(iv) |
| `TlsEnforced`, `AlbInsecureTls`, `CloudFrontNoHttpsOnly`, `AlbHttpNoRedirect` | `s3-bucket-ssl-requests-only`, `alb-http-to-https-redirection-check` | Transmission Security — ePHI in transit | §164.312(e)(1), §164.312(e)(2)(ii) |
| `RedshiftNoRequireSsl`, `ElastiCacheNoTransitEncryption`, `MskNoTransitEncryption`, `OpenSearchNoNodeEncryption` | `redshift-require-tls-ssl`, `elasticache-repl-grp-encrypted-in-transit` | Transmission Security — ePHI in transit | §164.312(e)(1) |
| `NeedToEnableCloudTrail`, `EnableCloudTrailLogging` | `cloudtrail-enabled`, `multi-region-cloudtrail-enabled` | Audit Controls — record/examine system activity | §164.312(b) |
| `TrailKmsEncryption` | `cloud-trail-encryption-enabled` | Risk management — protect audit data | §164.308(a)(1)(ii)(B) |
| `LogFileValidationEnabled` | `cloud-trail-log-file-validation-enabled` | Integrity — protect ePHI/audit data from alteration | §164.312(c)(1), §164.312(c)(2) |
| `VpcNoFlowLogs`, `ElbNoAccessLogs`, `RedshiftNoAuditLogging`, `S3ObjectWriteLogging`, `S3ObjectReadLogging` | `vpc-flow-logs-enabled`, `elb-logging-enabled` | Audit Controls — activity logging and monitoring | §164.312(b) |
| `Findings`, `Settings` | `guardduty-enabled-centralized` | Security Management — detect malicious activity | §164.308(a)(1)(ii)(D) |
| `InspectorNotEnabled`, `InspectorCriticalFindings`, `SsmPatchNonCompliant` | `ec2-managedinstance-patch-compliance-status-check` | Security Management — risk analysis / vuln management | §164.308(a)(1)(ii)(A), §164.308(a)(1)(ii)(B) |
| `PubliclyAccessible`, `RedshiftPublicAccess`, `SnsTopicPublicAccess`, `SqsQueuePublicAccess` | `rds-instance-public-access-check`, `redshift-cluster-public-access-check` | Access Control — minimum necessary access to ePHI | §164.502(b), §164.308(a)(4) |
| `S3AccountPublicAccessBlock`, `PublicAccessBlock` | `s3-bucket-public-read-prohibited`, `s3-account-level-public-access-blocks` | Access Control — prevent unauthorized ePHI access | §164.308(a)(3)(i), §164.312(a)(1) |
| `LambdaPublicAccess`, `LambdaFunctionUrlNoAuth`, `SageMakerNotebookPublic`, `eksEndpointPublicAccess` | `lambda-function-public-access-prohibited` | Access Control — restrict public access to compute | §164.312(a)(1) |
| `DeleteProtection`, `Backup`, `DynamoDbNoPitr`, `NoBackupPlan`, `BackupCoverageGap` | `db-instance-backup-enabled`, `dynamodb-pitr-enabled`, `backup-plan-min-frequency-and-min-retention-check` | Contingency Plan — data backup and recovery | §164.308(a)(7)(i), §164.308(a)(7)(ii)(A), §164.308(a)(7)(ii)(B) |
| `RdsNoMinorVersionUpgrade`, `LambdaDeprecatedRuntime`, `eksClusterVersionEol` | `rds-automatic-minor-version-upgrade-enabled` | Security Management — maintain secure systems | §164.308(a)(1)(ii)(B) |
| `SecretsManagerNoRotation` | `secretsmanager-rotation-enabled-check` | Access Control — credential management | §164.308(a)(4)(ii)(B) |
| `KeyRotationEnabled` | `cmk-backing-key-rotation-enabled` | Encryption — key management | §164.312(a)(2)(iv) |
| `WafNoRules`, `WafNoLogging`, `ApiGwNoAuthorizer` | `waf-classic-logging-enabled`, `api-gw-associated-with-waf` | Access Control — prevent unauthorized access | §164.312(a)(1) |
| `SupportRoleExists` | (support role) | Security Management — incident response roles | §164.308(a)(6)(i) |
| `ExpiredServerCertificate` | `acm-certificate-expiration-check` | Transmission Security — valid certificates | §164.312(e)(1) |

> **HIPAA scoring caveat:** HIPAA compliance is an organizational/legal determination, not
> a pure technical pass/fail. These checks provide **technical evidence** toward the cited
> safeguards but do not by themselves establish HIPAA compliance (which also requires BAAs,
> policies, workforce training, physical safeguards, etc.). Report HIPAA results as
> "technical-safeguard evidence" and include this disclaimer in the compliance report.

### SOC 2 Type II (Trust Services Criteria)

| Check ID(s) | SOC 2 Criteria | Category |
|-------------|----------------|----------|
| `mfaActive`, `rootMfaActive` | CC6.1 — Logical and physical access controls | Security |
| `hasAccessKeyNoRotate90days` | CC6.2 — Credentials are managed prior to access | Security |
| `userNoActivity90days`, `unusedRole` | CC6.3 — Access is removed when no longer needed | Security |
| `NeedToEnableCloudTrail`, `VpcNoFlowLogs` | CC7.1 — Detection of unauthorized activities | Security |
| `Findings` | CC7.2 — Monitoring of anomalies for incident response | Security |
| `ServerSideEncrypted`, `StorageEncrypted`, `SqsQueueNotEncrypted` | CC6.7 — Restrict access to information assets in transit/rest | Confidentiality |
| `DeleteProtection`, `Backup`, `DynamoDbNoPitr` | A1.2 — Recovery of infrastructure/data | Availability |
| `SGAllPortOpenToAll`, `LambdaPublicAccess` | CC6.6 — Restrict external access | Security |
| `wildcardActionsDetection` | CC6.3 — Least privilege access | Security |
| `CloudFrontNoHttpsOnly`, `TlsEnforced` | CC6.7 — Protection of data in transit | Confidentiality |

### PCI DSS v4.0.1

Aligned to the official **AWS Security Hub CSPM PCI DSS v4.0.1** standard control set.
Source: [PCI DSS in Security Hub CSPM](https://docs.aws.amazon.com/securityhub/latest/userguide/securityhub-standards-pcidss.html).
The `Security Hub Control` column is the canonical control ID in the AWS PCI DSS v4.0.1
standard; the `PCI DSS Req.` column is the PCI DSS v4.0.1 requirement family the control
supports. Rows below are the subset of the v4.0.1 standard that this power's checks
evaluate directly. Content adapted from AWS documentation for compliance with licensing restrictions.

| Check ID(s) | Security Hub Control | Control intent | PCI DSS Req. |
|-------------|----------------------|----------------|--------------|
| `SGSensitivePortOpenToAll` | EC2.13 / EC2.53 / EC2.54 | SGs should not allow ingress from 0.0.0.0/0 or ::/0 to admin ports (22/3389) | 1.2, 1.3 |
| `NACLSensitivePort` | EC2.21 | NACLs should not allow ingress from 0.0.0.0/0 to port 22/3389 | 1.2 |
| `DefaultVpcInUse` | EC2.2 | VPC default security groups should not allow traffic | 1.2 |
| `EbsSnapshotPublic` | EC2.1 | EBS snapshots should not be publicly restorable | 1.4 |
| `EC2IMDSv2` | EC2.8 | EC2 instances should use IMDSv2 | 2.2 |
| `TlsEnforced` | S3.5 | S3 buckets should require requests to use SSL | 4.2 |
| `CloudFrontNoHttpsOnly` | CloudFront.3 | CloudFront should require encryption in transit | 4.2 |
| `AlbInsecureTls` | ELB.8 | LB SSL listeners should use a strong predefined security policy | 4.2 |
| `AlbHttpNoRedirect` | ELB.1 | ALB should redirect HTTP requests to HTTPS | 4.2 |
| `ServerSideEncrypted`, `SSEWithKMS` | S3.17 | S3 buckets should be encrypted at rest with AWS KMS keys | 3.5 |
| `StorageEncrypted` | RDS.3 * | RDS DB instances should have encryption at rest enabled | 3.5 |
| `EbsVolumeNotEncrypted`, `EbsDefaultEncryptionDisabled` | EC2.3 / EC2.7 * | EBS encryption at rest | 3.5 |
| `ElastiCacheNoTransitEncryption` | ElastiCache.5 | ElastiCache replication groups encrypted in transit | 4.2 |
| `MskNoTransitEncryption` | MSK.1 | MSK clusters encrypted in transit among brokers | 4.2 |
| `mfaActive` | IAM.5 | MFA for all IAM users with a console password | 8.4, 8.5 |
| `rootMfaActive` | IAM.6 / IAM.9 | Hardware MFA / MFA enabled for the root user | 8.4, 8.5 |
| `hasAccessKeyNoRotate90days` | IAM.3 | IAM users' access keys rotated every 90 days or less | 8.3 |
| `userNoActivity90days` | IAM.8 | Unused IAM user credentials should be removed | 8.2 |
| `passwordPolicy`, `passwordPolicyReuse`, `passwordPolicyLength` | IAM.7 / IAM.16 / IAM.11-17 | IAM password policies should have strong configurations | 8.3 |
| `SupportRoleExists` | IAM.18 | A support role should exist to manage AWS Support incidents | 7.2 |
| `wildcardActionsDetection` | IAM.1 * | IAM policies should not allow full "*" admin privileges | 7.2 |
| `NeedToEnableCloudTrail`, `EnableCloudTrailLogging` | CloudTrail.3 | At least one CloudTrail trail should be enabled | 10.2 |
| `TrailKmsEncryption` | CloudTrail.2 | CloudTrail should have encryption at rest enabled | 10.3 |
| `LogFileValidationEnabled` | CloudTrail.4 | CloudTrail log file validation should be enabled | 10.3 |
| `EnableTrailS3BucketLogging` | CloudTrail.7 | S3 access logging enabled on the CloudTrail bucket | 10.2 |
| `VpcNoFlowLogs` | EC2.6 | VPC flow logging should be enabled in all VPCs | 10.2, 10.4 |
| `S3ObjectWriteLogging` | S3.22 | S3 buckets should log object-level write events | 10.2 |
| `S3ObjectReadLogging` | S3.23 | S3 buckets should log object-level read events | 10.2 |
| `ElbNoAccessLogs` | (ELB access logging) | Load balancer access logging | 10.2 |
| `Route53NoQueryLogging` | Route53.2 | Route 53 public hosted zones should log DNS queries | 10.2 |
| `StepFunctionsNoLogging` | StepFunctions.1 | Step Functions state machines should have logging on | 10.2 |
| `Findings`, `Settings` | GuardDuty.1 | GuardDuty should be enabled | 11.5 |
| `InspectorNotEnabled`, `InspectorCriticalFindings` | Inspector.1 / .2 / .3 / .4 | Amazon Inspector scanning (EC2/ECR/Lambda) should be enabled | 11.3, 6.3 |
| `SsmPatchNonCompliant` | SSM.2 / SSM.3 | SSM-managed instances patch/association compliance | 6.3, 11.3 |
| `WafNoRules`, `WafNoLogging` | WAF.1 / WAF.11 | WAF web ACL logging / protection for web apps | 6.4, 10.2 |
| `LambdaPublicAccess` | Lambda.1 | Lambda function policies should prohibit public access | 1.4, 7.2 |
| `LambdaDeprecatedRuntime` | Lambda.2 | Lambda functions should use supported runtimes | 6.3 |
| `LambdaNoVpc` | Lambda.3 | Lambda functions should be in a VPC | 1.3 |
| `PubliclyAccessible` | RDS.2 | RDS DB instances should prohibit public access | 1.4 |
| `RdsNoMinorVersionUpgrade` | RDS.13 | RDS automatic minor version upgrades should be enabled | 6.3 |
| `RedshiftPublicAccess` | Redshift.1 | Redshift clusters should prohibit public access | 1.4 |
| `RedshiftNoRequireSsl` | Redshift.2 | Connections to Redshift clusters encrypted in transit | 4.2 |
| `RedshiftNoAuditLogging` | Redshift.4 | Redshift clusters should have audit logging enabled | 10.2 |
| `SecretsManagerNoRotation` | SecretsManager.1 / .4 | Secrets Manager secrets rotation | 3.6, 8.3 |
| `KeyRotationEnabled` | KMS.4 | AWS KMS key rotation should be enabled | 3.6 |
| `OpenSearchPublicAccess` | ES.2 | OpenSearch/Elasticsearch domains not publicly accessible | 1.4 |
| `OpenSearchNoNodeEncryption` | ES.3 | Elasticsearch domains encrypt data between nodes | 4.2 |
| `OpenSearchNoAuditLogs` | Opensearch.5 | OpenSearch domains should have audit logging enabled | 10.2 |
| `EcrScanOnPush` | ECR.1 | ECR private repositories should have image scanning | 6.3, 11.3 |
| `EcsSecretsInEnv` | ECS.8 | Secrets should not be passed as container env vars | 8.3, 3.2 |
| `eksEndpointPublicAccess` | EKS.1 | EKS cluster endpoints should not be publicly accessible | 1.4 |
| `eksClusterVersionEol` | EKS.2 | EKS clusters should run a supported Kubernetes version | 6.3 |
| `eksSecretsEncryption` | EKS.3 | EKS clusters should use encrypted Kubernetes secrets | 3.5 |
| `eksClusterLogging` | EKS.8 | EKS clusters should have audit logging enabled | 10.2 |
| `ElastiCacheNoAtRestEncryption` | (ElastiCache at-rest) | ElastiCache at-rest encryption | 3.5 |
| `SageMakerNotebookPublic` | SageMaker.1 | SageMaker notebooks should not have direct internet access | 1.4 |

> `*` These control IDs (RDS.3, EC2.3/EC2.7, IAM.1) are FSBP/CIS control IDs referenced
> for context; PCI DSS v4.0.1 achieves the same intent through the listed requirement
> family. Where the AWS PCI DSS v4.0.1 standard lists a control this power does not yet
> implement (e.g. ACM.1/.2, DMS.*, DocumentDB.*, Neptune.*, RDS event subscriptions
> RDS.20/.21/.22, RDS.24/.25 custom admin usernames, S3.15 Object Lock, S3.7 CRR,
> CodeBuild.*, EMR.1/.2, Transfer.2, MQ.2, EC2.15/.16/.25/.51 public-IP/NACL hygiene),
> treat it as **out of current coverage** and note it in the report's gap list.

### AWS Foundational Security Best Practices (FSBP)

| Check ID(s) | FSBP Control | AWS Service |
|-------------|--------------|-------------|
| `EC2IMDSv2` | EC2.8 — IMDSv2 should be configured | EC2 |
| `SGAllPortOpenToAll` | EC2.19 — Security groups should not allow unrestricted ingress | EC2 |
| `S3AccountPublicAccessBlock` | S3.1 — S3 Block Public Access setting should be enabled | S3 |
| `ServerSideEncrypted` | S3.4 — S3 buckets should have server-side encryption enabled | S3 |
| `StorageEncrypted` | RDS.3 — RDS DB instances should have encryption at rest enabled | RDS |
| `DeleteProtection` | RDS.8 — RDS DB instances should have deletion protection enabled | RDS |
| `PubliclyAccessible` | RDS.2 — RDS DB instances should prohibit public access | RDS |
| `KeyRotationEnabled` | KMS.4 — AWS KMS key rotation should be enabled | KMS |
| `NeedToEnableCloudTrail` | CloudTrail.1 — CloudTrail should be enabled | CloudTrail |
| `HasOneMultiRegionTrail` | CloudTrail.5 — CloudTrail trails should be multi-region | CloudTrail |
| `Findings` | GuardDuty.1 — GuardDuty should be enabled | GuardDuty |
| `LambdaPublicAccess` | Lambda.1 — Lambda function policies should prohibit public access | Lambda |
| `LambdaDeprecatedRuntime` | Lambda.2 — Lambda functions should use supported runtimes | Lambda |
| `EcrScanOnPush` | ECR.1 — ECR repositories should have image scanning enabled | ECR |
| `eksEndpointPublicAccess` | EKS.1 — EKS cluster endpoints should not be publicly accessible | EKS |
| `eksSecretsEncryption` | EKS.2 — EKS clusters should use encrypted secrets | EKS |
| `CloudFrontNoHttpsOnly` | CloudFront.3 — CloudFront distributions should require HTTPS | CloudFront |
| `ElbNoAccessLogs` | ELB.5 — Application and Classic LBs logging should be enabled | ELB |
| `AlbInsecureTls` | ELB.8 — Classic LBs with SSL listeners should use a predefined security policy with strong TLS | ELB |
| `OpenSearchPublicAccess` | ES.2 — OpenSearch domains should not be publicly accessible | OpenSearch |
| `OpenSearchNoEncryption` | ES.1 — OpenSearch domains should have encryption at rest enabled | OpenSearch |
| `SqsQueueNotEncrypted` | SQS.1 — SQS queues should be encrypted at rest | SQS |
| `SnsTopicNotEncrypted` | SNS.1 — SNS topics should be encrypted at rest | SNS |
| `DynamoDbNoPitr` | DynamoDB.2 — DynamoDB tables should have PITR enabled | DynamoDB |
| `WafNoLogging` | WAF.1 — AWS WAF Classic global web ACL logging should be enabled | WAF |
| `SecretsManagerNoRotation` | SecretsManager.1 — Secrets Manager secrets should have rotation enabled | Secrets Manager |
| `VpcNoFlowLogs` | EC2.6 — VPC flow logging should be enabled in all VPCs | VPC |
| `IamAccessAnalyzerEnabled` | IAM.8 — IAM Access Analyzer should be enabled | IAM |
| `ComputeOptimizerNotEnabled` | Account.1 — AWS Compute Optimizer should be enabled | Account |

---

## EBS checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 105 | EBS volume not encrypted | `EbsVolumeNotEncrypted` | M | `ec2:DescribeVolumes`; FAIL volumes with `Encrypted=false`. |
| 106 | EBS default encryption disabled | `EbsDefaultEncryptionDisabled` | M | `ec2:GetEbsEncryptionByDefault`; FAIL if account-level default EBS encryption is not enabled in the region. |
| 107 | EBS public snapshot | `EbsSnapshotPublic` | H | `ec2:DescribeSnapshotAttribute` (createVolumePermission); FAIL snapshots shared with `all` (public). |
| 108 | EBS volume not attached (orphaned) | `EbsVolumeOrphaned` | L | `ec2:DescribeVolumes`; WARN volumes with `State=available` (not attached to any instance — potential waste + data exposure). |

---

## EFS checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 109 | EFS not encrypted at rest | `EfsNotEncrypted` | M | `efs:DescribeFileSystems`; FAIL if `Encrypted=false`. |
| 110 | EFS public mount target | `EfsPublicMountTarget` | H | `efs:DescribeMountTargets` → inspect associated security groups; FAIL if SG allows 0.0.0.0/0 on port 2049 (NFS). |
| 111 | EFS no backup policy | `EfsNoBackupPolicy` | L | `efs:DescribeBackupPolicy`; WARN if `Status` ≠ `ENABLED`. |
| 112 | EFS file system policy public access | `EfsPublicPolicy` | H | `efs:DescribeFileSystemPolicy`; FAIL if policy allows `Principal:"*"` without conditions. |

---

## ElastiCache checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 113 | ElastiCache cluster no encryption in transit | `ElastiCacheNoTransitEncryption` | H | `elasticache:DescribeReplicationGroups` / `DescribeCacheClusters`; FAIL if `TransitEncryptionEnabled=false`. |
| 114 | ElastiCache cluster no encryption at rest | `ElastiCacheNoAtRestEncryption` | M | FAIL if `AtRestEncryptionEnabled=false`. |
| 115 | ElastiCache no auth token | `ElastiCacheNoAuth` | H | FAIL Redis replication groups with `AuthTokenEnabled=false` (unauthenticated access). |
| 116 | ElastiCache cluster not in VPC | `ElastiCacheNoVpc` | M | WARN if cache cluster is not associated with a VPC subnet group (legacy EC2-Classic or default placement). |

---

## Redshift checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 117 | Redshift cluster publicly accessible | `RedshiftPublicAccess` | H | `redshift:DescribeClusters`; FAIL if `PubliclyAccessible=true`. |
| 118 | Redshift cluster not encrypted | `RedshiftNotEncrypted` | M | FAIL if `Encrypted=false`. |
| 119 | Redshift audit logging disabled | `RedshiftNoAuditLogging` | M | `redshift:DescribeLoggingStatus`; FAIL if `LoggingEnabled=false`. |
| 120 | Redshift no automated snapshots | `RedshiftNoSnapshots` | M | FAIL if `AutomatedSnapshotRetentionPeriod=0`. |
| 121 | Redshift parameter require SSL | `RedshiftNoRequireSsl` | H | Inspect cluster parameter group for `require_ssl=true`; FAIL if SSL not required. |

---

## SageMaker checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 122 | SageMaker notebook publicly accessible | `SageMakerNotebookPublic` | H | `sagemaker:ListNotebookInstances` → `DescribeNotebookInstance`; FAIL if `DirectInternetAccess=Enabled`. |
| 123 | SageMaker notebook not encrypted | `SageMakerNotebookNotEncrypted` | M | FAIL if `KmsKeyId` is absent (no CMK encryption for notebook storage). |
| 124 | SageMaker notebook root access | `SageMakerNotebookRootAccess` | M | WARN if `RootAccess=Enabled` (elevated privileges in the notebook container). |
| 125 | SageMaker endpoint no VPC | `SageMakerEndpointNoVpc` | M | `sagemaker:DescribeEndpointConfig`; WARN if no VPC config (endpoints accessible only via public API). |

---

## AMI checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 126 | AMI shared publicly | `AmiPublicSharing` | H | `ec2:DescribeImageAttribute` (launchPermission); FAIL any owned AMI shared with `all` (public). Potential data/IP leakage. |
| 127 | AMI not encrypted | `AmiNotEncrypted` | M | `ec2:DescribeImages` (owner=self); WARN AMIs with unencrypted EBS snapshots as block devices. |

---

## Inspector checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 128 | Inspector not enabled | `InspectorNotEnabled` | M | `inspector2:BatchGetAccountStatus`; FAIL if Inspector is not activated for EC2/ECR/Lambda scanning. |
| 129 | Inspector active critical/high findings | `InspectorCriticalFindings` | H | `inspector2:ListFindings` (filter severity=CRITICAL/HIGH, state=ACTIVE); FAIL if active critical/high vulnerability findings exist — report count and top affected resources. |
| 130 | Inspector ECR scan coverage gap | `InspectorEcrCoverageGap` | M | `inspector2:ListCoverageStatistics`; WARN if ECR repository scan coverage < 100% of active repos. |

---

## Security Hub checks (global + per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 131 | Security Hub not enabled | `SecurityHubNotEnabled` | H | `securityhub:DescribeHub`; FAIL if Security Hub is not enabled in the region. |
| 132 | Security Hub no standards enabled | `SecurityHubNoStandards` | M | `securityhub:GetEnabledStandards`; WARN if no security standards subscriptions (CIS, FSBP, PCI). |
| 133 | Security Hub critical findings unresolved | `SecurityHubCriticalFindings` | H | `securityhub:GetFindings` (filter SeverityLabel=CRITICAL, WorkflowStatus=NEW/NOTIFIED); FAIL if unresolved critical findings exist. |

---

## Compliance Framework Mappings — New Checks

### CIS AWS Foundations Benchmark v3.0.0 — supplementary (this power's own checks)

These are additional checks this power runs that relate to CIS v3.0.0 control areas.
`EbsDefaultEncryptionDisabled` maps to the official **EC2.7 / CIS 2.2.1** control (see
the main CIS table above). The rest are defense-in-depth checks with no direct CIS
v3.0.0 requirement — do NOT score them as CIS controls.

| Check ID(s) | Related area | CIS 3.0.0 status |
|-------------|--------------|------------------|
| `EbsDefaultEncryptionDisabled` | EBS default encryption (EC2.7) | 2.2.1 (scored — see main table) |
| `EbsVolumeNotEncrypted` | EBS per-volume encryption | Not a CIS v3.0.0 control (best practice) |
| `EbsSnapshotPublic` | EBS snapshot public exposure | Not a CIS v3.0.0 control (best practice) |
| `RedshiftPublicAccess` | Redshift public access | Not a CIS v3.0.0 control (best practice) |

### HIPAA

| Check ID(s) | HIPAA Safeguard | Reference |
|-------------|-----------------|-----------|
| `EbsVolumeNotEncrypted`, `EfsNotEncrypted`, `ElastiCacheNoAtRestEncryption`, `RedshiftNotEncrypted` | Encryption at rest — ePHI protection | §164.312(a)(2)(iv) |
| `ElastiCacheNoTransitEncryption`, `RedshiftNoRequireSsl` | Encryption in transit — ePHI transmission security | §164.312(e)(1) |
| `SageMakerNotebookPublic`, `RedshiftPublicAccess` | Access Control — minimum necessary access | §164.502(b) |
| `InspectorNotEnabled` | Security Management — risk analysis / vulnerability management | §164.308(a)(1)(ii)(A) |

### SOC 2

| Check ID(s) | SOC 2 Criteria | Category |
|-------------|----------------|----------|
| `EbsSnapshotPublic`, `AmiPublicSharing`, `EfsPublicPolicy` | CC6.6 — Restrict external access | Security |
| `EbsVolumeNotEncrypted`, `EfsNotEncrypted`, `RedshiftNotEncrypted` | CC6.7 — Restrict access to information assets at rest | Confidentiality |
| `InspectorCriticalFindings` | CC7.1 — Detection of vulnerabilities | Security |
| `SecurityHubNotEnabled` | CC7.2 — Monitoring for incident response | Security |

### PCI DSS v4.0.1

| Check ID(s) | PCI DSS intent | Req. |
|-------------|----------------|------|
| `EbsVolumeNotEncrypted`, `EfsNotEncrypted`, `RedshiftNotEncrypted`, `ElastiCacheNoAtRestEncryption` | Protect stored cardholder data with encryption | 3.5 |
| `ElastiCacheNoTransitEncryption`, `RedshiftNoRequireSsl` | Encrypt transmission of cardholder data | 4.2 |
| `InspectorNotEnabled`, `InspectorCriticalFindings` | Regularly test security systems | 11.3 |
| `SecurityHubNotEnabled` | Centralized security monitoring | 10.7 |

### AWS FSBP

| Check ID(s) | FSBP Control | AWS Service |
|-------------|--------------|-------------|
| `EbsVolumeNotEncrypted` | EC2.3 — EBS volumes should be encrypted | EC2/EBS |
| `EbsSnapshotPublic` | EC2.1 — EBS snapshots should not be public | EC2/EBS |
| `EbsDefaultEncryptionDisabled` | EC2.7 — EBS default encryption should be enabled | EC2/EBS |
| `EfsNotEncrypted` | EFS.1 — EFS should be configured to encrypt data at rest | EFS |
| `ElastiCacheNoTransitEncryption` | ElastiCache.1 — ElastiCache clusters should have encryption in transit | ElastiCache |
| `ElastiCacheNoAtRestEncryption` | ElastiCache.2 — ElastiCache clusters should have encryption at rest | ElastiCache |
| `RedshiftPublicAccess` | Redshift.1 — Redshift clusters should prohibit public access | Redshift |
| `RedshiftNotEncrypted` | Redshift.10 — Redshift clusters should be encrypted at rest | Redshift |
| `RedshiftNoAuditLogging` | Redshift.4 — Redshift clusters should have audit logging enabled | Redshift |
| `SageMakerNotebookPublic` | SageMaker.1 — SageMaker notebook instances should not have direct internet access | SageMaker |
| `SageMakerNotebookNotEncrypted` | SageMaker.2 — SageMaker notebook instances should be encrypted | SageMaker |
| `InspectorNotEnabled` | Inspector.1 — Amazon Inspector should be enabled | Inspector |
| `SecurityHubNotEnabled` | SecurityHub.1 — Security Hub should be enabled | Security Hub |
| `AmiPublicSharing` | EC2.2 — AMIs should not be publicly shared | EC2 |

---

## Athena checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 134 | Athena workgroup query results not encrypted | `AthenaWorkgroupNoEncryption` | M | `athena:GetWorkGroup`; FAIL if `EncryptionConfiguration` is absent or `EncryptionOption=NONE`. |
| 135 | Athena workgroup configuration not enforced | `AthenaWorkgroupNotEnforced` | M | FAIL if `EnforceWorkGroupConfiguration=false` (users can override encryption/output settings). |
| 136 | Athena workgroup no CloudWatch metrics | `AthenaNoMetrics` | L | WARN if `PublishCloudWatchMetricsEnabled=false` (no query performance monitoring). |

---

## Glue checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 137 | Glue Data Catalog not encrypted | `GlueCatalogNotEncrypted` | M | `glue:GetDataCatalogEncryptionSettings`; FAIL if `EncryptionAtRest.CatalogEncryptionMode=DISABLED`. |
| 138 | Glue connection passwords not encrypted | `GlueConnectionPasswordNotEncrypted` | M | FAIL if `ConnectionPasswordEncryption.ReturnConnectionPasswordEncrypted=false`. |
| 139 | Glue job no security configuration | `GlueJobNoSecurityConfig` | H | `glue:GetJobs`; FAIL jobs without `SecurityConfiguration` set (no S3/CloudWatch/bookmark encryption). |
| 140 | Glue crawler no security configuration | `GlueCrawlerNoSecurityConfig` | M | `glue:GetCrawlers`; WARN crawlers without `CrawlerSecurityConfiguration`. |
| 141 | Glue resource policy overly permissive | `GlueResourcePolicyPublic` | H | `glue:GetResourcePolicies`; FAIL if policy allows `Principal:"*"` without conditions. |

---

## MSK (Managed Streaming for Kafka) checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 142 | MSK cluster no encryption in transit | `MskNoTransitEncryption` | H | `kafka:DescribeClusterV2`; FAIL if `EncryptionInfo.EncryptionInTransit.ClientBroker` ≠ `TLS` (allows plaintext). |
| 143 | MSK cluster no encryption at rest | `MskNoAtRestEncryption` | M | FAIL if `EncryptionInfo.EncryptionAtRest` uses default AWS-managed key (WARN) or not configured (FAIL). |
| 144 | MSK no client authentication | `MskNoClientAuth` | H | FAIL if `ClientAuthentication` has no TLS, SASL, or IAM authentication enabled (unauthenticated access). |
| 145 | MSK enhanced monitoring disabled | `MskNoEnhancedMonitoring` | L | WARN if `EnhancedMonitoring=DEFAULT` (minimal metrics). |
| 146 | MSK logging disabled | `MskNoLogging` | M | FAIL if `LoggingInfo` shows no broker logs configured (CloudWatch, S3, or Firehose). |

---

## Kinesis checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 147 | Kinesis Data Stream not encrypted | `KinesisStreamNotEncrypted` | M | `kinesis:DescribeStreamSummary`; FAIL if `EncryptionType=NONE`. |
| 148 | Kinesis Data Stream short retention | `KinesisStreamShortRetention` | L | WARN if `RetentionPeriodHours` < 48 (data loss risk on consumer failure). |
| 149 | Firehose delivery stream not encrypted | `FirehoseNotEncrypted` | M | `firehose:DescribeDeliveryStream`; FAIL if `EncryptionConfiguration.KeyType` ≠ `CUSTOMER_MANAGED_CMK` or `AWS_OWNED_CMK`. |
| 150 | Firehose delivery stream no server-side encryption on S3 destination | `FirehoseS3NoEncryption` | M | WARN if S3 destination `EncryptionConfiguration` is not configured with KMS. |

---

## Step Functions checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 151 | Step Functions no logging | `StepFunctionsNoLogging` | M | `sfn:DescribeStateMachine`; FAIL if `loggingConfiguration.level=OFF`. |
| 152 | Step Functions no X-Ray tracing | `StepFunctionsNoTracing` | L | WARN if `tracingConfiguration.enabled=false`. |
| 153 | Step Functions no encryption | `StepFunctionsNoEncryption` | M | WARN if `encryptionConfiguration` is absent or uses default AWS-owned key (less visibility/control). |
| 154 | Step Functions execution role over-permissive | `StepFunctionsOverPermissiveRole` | H | Inspect IAM role attached; FAIL if role has `Action:"*"` or `Resource:"*"` without conditions. |

---

## AWS Backup checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 155 | Backup vault not encrypted with CMK | `BackupVaultNoCmk` | M | `backup:DescribeBackupVault`; WARN if `EncryptionKeyArn` uses default AWS Backup key (less control). |
| 156 | Backup vault not locked | `BackupVaultNotLocked` | M | WARN if `LockConfiguration` is absent (vault contents can be deleted). |
| 157 | Backup vault policy public access | `BackupVaultPublicPolicy` | H | `backup:GetBackupVaultAccessPolicy`; FAIL if policy allows `Principal:"*"` without conditions. |
| 158 | No backup plan configured | `NoBackupPlan` | H | `backup:ListBackupPlans`; FAIL if no backup plans exist in the region (no automated backups). |
| 159 | Critical resources not protected by backup | `BackupCoverageGap` | M | `backup:ListProtectedResources`; WARN if RDS instances, DynamoDB tables, EFS, or EBS volumes in the region are not covered by any backup plan. |

---

## CloudWatch checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 160 | Log groups with no retention (never expire) | `CloudWatchLogNoRetention` | L | `logs:DescribeLogGroups`; WARN log groups with `retentionInDays=null` (logs stored indefinitely — cost + compliance risk). |
| 161 | Log groups not encrypted with CMK | `CloudWatchLogNoCmk` | L | WARN log groups with `kmsKeyId` absent (encrypted with default service key — less control). |
| 162 | No alarm for root account usage | `CloudWatchNoRootAlarm` | H | `logs:DescribeMetricFilters`; FAIL if no metric filter + alarm for root login events (CIS 1.7/4.3). |
| 163 | No alarm for unauthorized API calls | `CloudWatchNoUnauthorizedAlarm` | M | WARN if no metric filter + alarm for `UnauthorizedOperation` / `AccessDenied` events (CIS 4.1). |

---

## EventBridge checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 164 | EventBridge bus public access | `EventBridgeBusPublicAccess` | H | `events:DescribeEventBus`; FAIL if resource policy allows `Principal:"*"` put-events without conditions. |
| 165 | No EventBridge rule for security events | `EventBridgeNoSecurityRules` | M | WARN if no rules targeting GuardDuty findings, Config compliance changes, or IAM events on any bus. |
| 166 | EventBridge cross-account access overly broad | `EventBridgeBroadCrossAccount` | M | WARN if bus policy allows entire external accounts (no condition/org restriction). |

---

## AppSync checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 167 | AppSync API using only API_KEY auth | `AppSyncApiKeyOnly` | H | `appsync:ListGraphqlApis`; FAIL if `authenticationType=API_KEY` with no additional auth providers (weakest auth, keys rotate manually). |
| 168 | AppSync no logging | `AppSyncNoLogging` | M | FAIL if `logConfig` is absent or `fieldLogLevel=NONE`. |
| 169 | AppSync no WAF | `AppSyncNoWaf` | M | WARN if `wafWebAclArn` is empty (no WAF protection). |
| 170 | AppSync no X-Ray tracing | `AppSyncNoTracing` | L | WARN if `xrayEnabled=false`. |

---

## Cognito checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 171 | Cognito User Pool no MFA | `CognitoNoMfa` | H | `cognito-idp:DescribeUserPool`; FAIL if `MfaConfiguration=OFF`. WARN if `OPTIONAL` (not enforced). |
| 172 | Cognito User Pool weak password policy | `CognitoWeakPasswordPolicy` | M | FAIL if `Policies.PasswordPolicy.MinimumLength` < 12 or missing complexity requirements. |
| 173 | Cognito User Pool no advanced security | `CognitoNoAdvancedSecurity` | M | WARN if `UserPoolAddOns.AdvancedSecurityMode` ≠ `ENFORCED` (no adaptive auth / compromised credential detection). |
| 174 | Cognito User Pool no deletion protection | `CognitoNoDeletionProtection` | M | FAIL if `DeletionProtection` ≠ `ACTIVE`. |
| 175 | Cognito Identity Pool allows unauthenticated | `CognitoIdentityUnauthenticated` | H | `cognito-identity:DescribeIdentityPool`; FAIL if `AllowUnauthenticatedIdentities=true` (anonymous access to AWS resources). |

---

## Systems Manager checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 176 | SSM document public sharing enabled | `SsmDocumentPublicSharing` | H | `ssm:GetServiceSetting` for `/ssm/documents/console/public-sharing-permission`; FAIL if public sharing is allowed. |
| 177 | SSM parameters unencrypted | `SsmParameterNotEncrypted` | M | `ssm:DescribeParameters`; WARN parameters of type `String` (not `SecureString`) that contain sensitive naming patterns (password, secret, key, token). |
| 178 | SSM patch compliance non-compliant | `SsmPatchNonCompliant` | H | `ssm:DescribePatchGroupState` or `ssm:DescribeInstancePatchStates`; FAIL instances with `NON_COMPLIANT` critical/security patches. |
| 179 | SSM managed instances low coverage | `SsmLowCoverage` | M | Cross-ref `ec2:DescribeInstances` (running) vs `ssm:DescribeInstanceInformation`; WARN if < 80% of instances are SSM-managed. |

---

## Network Firewall checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 180 | Network Firewall no logging | `NetworkFirewallNoLogging` | M | `network-firewall:DescribeLoggingConfiguration`; FAIL if no ALERT or FLOW log destinations configured. |
| 181 | Network Firewall policy empty rules | `NetworkFirewallNoRules` | H | `network-firewall:DescribeFirewallPolicy`; FAIL if both stateless and stateful rule group references are empty. |
| 182 | Network Firewall stateless default action pass-all | `NetworkFirewallDefaultPassAll` | H | FAIL if `StatelessDefaultActions` include `aws:pass` for full packets (traffic bypasses inspection). |
| 183 | Internet-facing VPC no Network Firewall | `VpcNoNetworkFirewall` | M | Cross-ref VPCs with internet gateways vs `network-firewall:ListFirewalls`; WARN VPCs with IGW but no associated firewall. |

---

## Transit Gateway checks (per region)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 184 | Transit Gateway auto-accept shared attachments | `TgwAutoAcceptAttachments` | H | `ec2:DescribeTransitGateways`; FAIL if `Options.AutoAcceptSharedAttachments=enable` (any shared account can attach without approval). |
| 185 | Transit Gateway no route table isolation | `TgwNoRouteTableIsolation` | M | WARN if `DefaultRouteTableAssociation=enable` AND `DefaultRouteTablePropagation=enable` (all attachments share routes — no segmentation). |
| 186 | Transit Gateway cross-account sharing too broad | `TgwBroadSharing` | M | `ram:GetResourceShares` (TGW resources); WARN if shared with external accounts outside the organization. |

---

## Global Accelerator checks (global)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 187 | Global Accelerator flow logs disabled | `GlobalAcceleratorNoFlowLogs` | M | `globalaccelerator:DescribeAcceleratorAttributes`; FAIL if `FlowLogsEnabled=false`. |
| 188 | Global Accelerator no listener | `GlobalAcceleratorNoListener` | L | WARN accelerators with no listeners configured (orphaned resource). |
| 189 | Global Accelerator endpoint health check disabled | `GlobalAcceleratorNoHealthCheck` | L | WARN endpoint groups with `HealthCheckPort` and `HealthCheckProtocol` not configured. |

---

## Route 53 checks (global)

| # | Requirement | Check ID(s) | Sev | How to evaluate |
|---|---|---|---|---|
| 190 | Route 53 public hosted zone DNSSEC not enabled | `Route53NoDnssec` | M | `route53:GetDNSSEC` per public zone; WARN if signing status ≠ `SIGNING` (vulnerable to DNS spoofing). |
| 191 | Route 53 domain transfer lock disabled | `Route53NoTransferLock` | H | `route53domains:GetDomainDetail`; FAIL if `TransferLock` is not enabled (domain can be hijacked). |
| 192 | Route 53 domain auto-renew disabled | `Route53NoAutoRenew` | M | FAIL if `AutoRenew=false` (risk of domain expiry and takeover). |
| 193 | Route 53 no DNS query logging | `Route53NoQueryLogging` | L | `route53:GetQueryLoggingConfig`; WARN if no query logging configured for the hosted zone. |
| 194 | Route 53 Resolver no query logging | `Route53ResolverNoLogging` | L | `route53resolver:ListResolverQueryLogConfigs`; WARN if no resolver query log config exists in the region. |

---

## Compliance Framework Mappings — Expanded Services

### CIS AWS Foundations Benchmark v3.0.0 — supplementary (defense-in-depth)

CIS v3.0.0 **removed** the CloudWatch metric-filter/alarm requirements that existed in
v1.4.0/v1.2.0 (root usage, unauthorized API calls, IAM/config/SG/NACL changes, etc.).
In v3.0.0 these are documented by AWS as **"manual checks"** and are not automated,
scored controls. The checks below are run by this power as defense-in-depth but must
**not** be counted toward the CIS v3.0.0 compliance score.

| Check ID(s) | Related CIS v1.x control (removed in v3.0.0) | CIS 3.0.0 status |
|-------------|----------------------------------------------|------------------|
| `CloudWatchNoRootAlarm` | Root-user usage alarm (v1.4.0 § 4.3) | Manual check — not scored in v3.0.0 |
| `CloudWatchNoUnauthorizedAlarm` | Unauthorized API calls alarm (v1.2.0 § 3.1) | Manual check — not scored in v3.0.0 |
| `CloudWatchLogNoRetention` | CloudWatch log retention | Not a CIS v3.0.0 control (best practice) |
| `Route53NoDnssec` | DNSSEC for Route 53 hosted zones | Not a CIS v3.0.0 control (best practice) |
| `TgwAutoAcceptAttachments` | Transit Gateway auto-accept attachments | Not a CIS v3.0.0 control (network segmentation) |

### HIPAA

| Check ID(s) | HIPAA Safeguard | Reference |
|-------------|-----------------|-----------|
| `GlueCatalogNotEncrypted`, `AthenaWorkgroupNoEncryption`, `KinesisStreamNotEncrypted`, `MskNoAtRestEncryption` | Encryption at rest — ePHI protection | §164.312(a)(2)(iv) |
| `MskNoTransitEncryption`, `ElastiCacheNoTransitEncryption` | Encryption in transit — ePHI transmission security | §164.312(e)(1) |
| `CognitoNoMfa` | Access Control — Unique User Identification + MFA | §164.312(d) |
| `CognitoIdentityUnauthenticated` | Access Control — prevent unauthorized access | §164.312(a)(1) |
| `BackupCoverageGap`, `NoBackupPlan` | Contingency Plan — data backup and disaster recovery | §164.308(a)(7) |
| `StepFunctionsNoLogging`, `NetworkFirewallNoLogging`, `MskNoLogging` | Audit Controls — activity logging | §164.312(b) |
| `SsmPatchNonCompliant` | Security Management — risk analysis / patch management | §164.308(a)(1)(ii)(A), §164.308(a)(1)(ii)(B) |

### SOC 2 Type II

| Check ID(s) | SOC 2 Criteria | Category |
|-------------|----------------|----------|
| `CognitoNoMfa`, `CognitoIdentityUnauthenticated`, `AppSyncApiKeyOnly` | CC6.1 — Logical access controls | Security |
| `MskNoClientAuth`, `TgwAutoAcceptAttachments` | CC6.6 — Restrict external access | Security |
| `CloudWatchNoRootAlarm`, `EventBridgeNoSecurityRules` | CC7.2 — Monitoring of anomalies | Security |
| `BackupVaultNotLocked`, `NoBackupPlan` | A1.2 — Recovery of infrastructure/data | Availability |
| `GlueCatalogNotEncrypted`, `KinesisStreamNotEncrypted`, `AthenaWorkgroupNoEncryption` | CC6.7 — Restrict access to information assets at rest | Confidentiality |
| `StepFunctionsNoLogging`, `NetworkFirewallNoLogging` | CC7.1 — Detection of unauthorized activities | Security |

### PCI DSS v4.0.1

| Check ID(s) | PCI DSS intent | Req. |
|-------------|----------------|------|
| `GlueCatalogNotEncrypted`, `KinesisStreamNotEncrypted`, `MskNoAtRestEncryption`, `AthenaWorkgroupNoEncryption` | Protect stored cardholder data with encryption | 3.5 |
| `MskNoTransitEncryption` | Encrypt transmission of cardholder data | 4.2 |
| `CognitoNoMfa` | Multi-factor authentication for access | 8.4, 8.5 |
| `NetworkFirewallNoRules`, `NetworkFirewallDefaultPassAll` | Install and maintain network security controls | 1.2 |
| `StepFunctionsNoLogging`, `CloudWatchNoRootAlarm`, `GlobalAcceleratorNoFlowLogs` | Audit trail — record activities | 10.2, 10.4 |
| `SsmPatchNonCompliant` | Protect systems from malware / maintain secure systems | 5.2, 6.3 |
| `AppSyncApiKeyOnly`, `CognitoIdentityUnauthenticated` | Restrict access to system components | 7.2 |

### AWS Foundational Security Best Practices (FSBP)

| Check ID(s) | FSBP Control | AWS Service |
|-------------|--------------|-------------|
| `GlueCatalogNotEncrypted` | Glue.1 — Glue Data Catalog encryption should be enabled | Glue |
| `GlueJobNoSecurityConfig` | Glue.2 — Glue jobs should have a security configuration | Glue |
| `KinesisStreamNotEncrypted` | Kinesis.1 — Kinesis streams should be encrypted at rest | Kinesis |
| `MskNoTransitEncryption` | MSK.1 — MSK clusters should be encrypted in transit | MSK |
| `MskNoClientAuth` | MSK.2 — MSK clusters should have client authentication | MSK |
| `StepFunctionsNoLogging` | StepFunctions.1 — Step Functions state machines should have logging enabled | Step Functions |
| `BackupVaultNotLocked` | Backup.1 — AWS Backup vaults should have a lock configuration | Backup |
| `CloudWatchLogNoRetention` | CloudWatch.1 — Log groups should have a retention period | CloudWatch |
| `CognitoNoMfa` | Cognito.1 — Cognito user pools should have MFA enabled | Cognito |
| `CognitoIdentityUnauthenticated` | Cognito.2 — Cognito identity pools should not allow unauthenticated access | Cognito |
| `AppSyncApiKeyOnly` | AppSync.1 — AppSync APIs should not use API_KEY auth exclusively | AppSync |
| `AppSyncNoLogging` | AppSync.2 — AppSync should have logging enabled | AppSync |
| `NetworkFirewallNoLogging` | NetworkFirewall.2 — Network Firewall should have logging enabled | Network Firewall |
| `NetworkFirewallNoRules` | NetworkFirewall.3 — Network Firewall policies should have at least one rule group | Network Firewall |
| `Route53NoDnssec` | Route53.1 — Route 53 public hosted zones should have DNSSEC signing enabled | Route 53 |
| `Route53NoTransferLock` | Route53.2 — Route 53 domains should have transfer lock enabled | Route 53 |
| `SsmDocumentPublicSharing` | SSM.4 — SSM documents should not be public | Systems Manager |
| `SsmPatchNonCompliant` | SSM.3 — Instances managed by SSM should have patch compliance status COMPLIANT | Systems Manager |
| `TgwAutoAcceptAttachments` | EC2.23 — Transit Gateways should not auto-accept VPC attachment requests | EC2/TGW |
| `GlobalAcceleratorNoFlowLogs` | GlobalAccelerator.1 — Accelerators should have flow logs enabled | Global Accelerator |

---

## Scoring

- **FAIL** = misconfiguration present (counts toward the risk total, weighted by severity: H=3, M=2, L=1).
- **WARN** = deviation from best practice but lower risk.
- **PASS** = compliant.
- Roll up per-service and overall counts for the report summary (see `steering/report-output.md`).
