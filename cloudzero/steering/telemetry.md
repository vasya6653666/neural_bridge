# Telemetry Workflow

Use this workflow when the user wants to explore telemetry metrics and streams from their cloud infrastructure.

## Steps

1. **List streams** - Call `get_telemetry_streams` to see available telemetry streams.
2. **Query data** - Call `get_telemetry_data` to retrieve metrics from a specific stream.

## Best Practices

- Always call `get_telemetry_streams` first to discover what streams are configured before querying data.
- Both telemetry tools require the **Telemetry Stream Settings (View Telemetry Streams)** permission set. If the user gets an access error, inform them about this requirement.
- When presenting telemetry data, include the stream name, time range, and any relevant units.
- Correlate telemetry data with cost data when the user is investigating cost anomalies that may be driven by usage changes.
