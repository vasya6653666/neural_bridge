---
name: "incident-investigation"
description: "How to investigate a production problem from the IDE with the obs_* tools: check which services are configured, read firing alerts, confirm the symptom in metrics, then find the cause in logs and dashboards. Use whenever the user asks why something is slow, failing, or alerting, or asks to look at metrics, logs, alerts or dashboards."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---
# Investigating an incident

The power's MCP server queries the user's own Prometheus, Loki, Grafana and Alertmanager over their HTTP APIs. Every tool is
read-only: it never changes anything, so you may query freely. Work from the symptom outward.

## 1. See what is available

Call `obs_detect` first. It lists which services are configured and which use authentication. If a service you need is not
configured, tell the user to set its `<SERVICE>_URL` (and token if needed) and restart the IDE — do not guess an address.

## 2. Start from the alerts

Call `obs_alertmanager_alerts` (or `obs_prometheus_alerts` if only Prometheus is configured) to see what is firing right
now. The alert labels (`alertname`, `service`, `instance`, `severity`) tell you where to look and give you label values to
reuse in the next queries.

## 3. Confirm the symptom in metrics

Use `obs_prometheus_query` for the current value and `obs_prometheus_range` to see how a metric moved over the incident
window. Pick the metric from the alert or from the user's description, for example:
- error rate: `sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)`;
- latency: a histogram quantile over `*_duration_seconds_bucket`;
- saturation: CPU, memory, queue depth for the affected `instance`.
For a range query choose a `step` that fits the window (`30s` for minutes, `5m` for hours) so the series stays readable.

## 4. Find the cause in logs

Narrow Loki to the same labels and time window with `obs_loki_query`, e.g. `{service="api"} |= "error"` or a LogQL filter on
the request id. Keep `limit` modest and widen it only if needed. Match log timestamps against the metric change from step 3.

## 5. Use dashboards for context

`obs_grafana_search` finds a dashboard by title; `obs_grafana_dashboard` lists its panels by uid so you can point the user to
the right view. Dashboards are for orientation, not a substitute for the metric and log queries above.

## Reporting back

The user cannot see the raw API output. Summarise what you found: which alert, which metric moved and by how much, the
matching log lines, and your best explanation of the cause. Never print tokens or credentials; the tools already keep them
out of their output. This power only reads — any fix (restart, rollback, config change) is done with other tools and only
after you have told the user what you intend to do.
