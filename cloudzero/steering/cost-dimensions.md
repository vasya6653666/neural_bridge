# Cost Dimensions Workflow

Use this workflow when the user wants to explore what cost dimensions are available, understand their allocation model, or find specific dimension values.

## Steps

1. **List dimensions** - Call `get_available_dimensions` to see all dimensions the user can filter or group by.
2. **Explore values** - Call `get_dimension_values` with a specific dimension to see its available values.
3. **Use in queries** - Apply discovered dimensions and values as filters or groupings in `get_cost_data`.

## Best Practices

- Always call `get_available_dimensions` before assuming a dimension exists. Different organizations have different custom dimensions configured.
- When the user mentions a concept like "team", "project", or "environment", check available dimensions first to find the matching dimension name.
- Use `get_dimension_values` to validate filter values before querying cost data. This prevents empty results from typos or incorrect values.
- Present dimensions in a human-readable format, explaining what each one represents when the context is not obvious.
