# Skill: Upscale MCP Single

Use Banana MCP for a single-image Upscale workflow: call `upscale_health` and
`upscale_list_models`, upload with `upscale_upload`, create with
`upscale_create_job`, poll `upscale_get_job` to a terminal status, then download
with `upscale_download_result`. Cancel only on explicit request; delete results
only after confirmation.

Use `bbmcp_` authentication in memory only. Never expose keys, read Upscale
SQLite/storage/runtime folders, or send private-network image URLs. Use an
idempotency key for create retries and do not retry invalid input/auth errors.
