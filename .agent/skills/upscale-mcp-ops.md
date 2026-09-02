# Skill: Upscale MCP Operations

For readiness, call `upscale_health` then `upscale_list_models`; record only
status, limits, worker counts, model IDs, request IDs and sanitized errors.
For queue incidents, inspect `upscale_queue_summary`, a narrow
`upscale_queue_list`, and affected jobs with `upscale_get_job`.

Treat HTTP 401 as an authentication/configuration failure and keep access
fail-closed. Stop new job creation when health is unavailable. Never log API
keys or image content and never inspect Upscale databases, runtime folders,
Docker volumes or binaries.
