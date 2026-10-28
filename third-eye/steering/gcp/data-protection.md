# GCP — Data Protection

Classify data and protect it at rest and in transit, while minimizing direct human access.

## Data Classification

- Define classification levels and apply them via **labels**.
- Use **Sensitive Data Protection (Cloud DLP)** to discover, classify, and de-identify PII in storage
  (Cloud Storage, BigQuery, Datastore) and in streaming data.
- Let classification drive controls: encryption keys, allowed locations, retention, and access.

## Encryption at Rest

- All data is **encrypted at rest by default** with Google-managed keys.
- For sensitive workloads, use **CMEK (Customer-Managed Encryption Keys)** via **Cloud KMS** so you control
  rotation and access; use **CMEK org policy** to require it.
- For strict control, use **Cloud HSM** (FIPS 140-2 L3) or **Cloud EKM** (external key manager).
- Enable **automatic key rotation**; separate key admins from key users via IAM.

## Encryption in Transit

- Traffic within Google's network and to Google APIs is encrypted; enforce **TLS 1.2+** for your endpoints.
- Use **Google-managed TLS certificates** on load balancers.
- Enforce HTTPS (redirect HTTP) and, for internal service-to-service, mutual TLS (e.g., via a service mesh /
  Anthos Service Mesh).

## Secrets Management

- Store secrets in **Secret Manager**; grant access via IAM; reference at runtime — never hardcode.
- Enable rotation; audit access via Cloud Audit Logs.
- Scan repos/images for leaked secrets and rotate anything exposed.

## Storage Hardening & Keeping People Away from Data

- Enforce **uniform bucket-level access** and block public access on Cloud Storage buckets (org policy).
- Use **VPC Service Controls** to prevent exfiltration of data from managed services.
- Minimize direct human access to production data; where required, make it just-in-time, logged, and time-boxed.
- Enable **object versioning**, retention policies, and bucket lock for critical/immutable data.

## Checklist

- [ ] Classification via labels; DLP discovering sensitive data.
- [ ] CMEK (Cloud KMS) for sensitive data with rotation; key admin/user separation.
- [ ] TLS 1.2+ enforced; managed certs; HTTP redirected to HTTPS.
- [ ] Secrets in Secret Manager with rotation; none hardcoded.
- [ ] Uniform bucket-level access + public access blocked; VPC-SC perimeter.
- [ ] Versioning/retention/bucket lock on critical data.

## References
- Cloud KMS: https://cloud.google.com/kms/docs
- Sensitive Data Protection (DLP): https://cloud.google.com/security/products/dlp
