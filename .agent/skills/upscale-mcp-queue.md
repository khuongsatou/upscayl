# Skill: Upscale MCP Queue

Use `upscale_upload` for each source, then `upscale_queue_create` so each upload
has an independent job and progress. Use `upscale_queue_summary` and
`upscale_queue_list` for totals, search, status filtering and pagination. Poll
active jobs with `upscale_get_job` and preserve per-image errors.

Use `upscale_queue_cancel` only for an explicit stop request and
`upscale_queue_retry` only for terminal jobs. Download successful results with
`upscale_download_result`; use `upscale_delete_result` only for explicit
cleanup. Keep concurrency within service limits and never access Upscale
storage or SQLite directly.
