# Local Mac Processing

The web app can send upscale jobs to this Mac instead of the VPS. The worker
listens only on `127.0.0.1:3047` and uses the bundled macOS binary/models.

From the project directory, run the one-time setup:

```sh
npm install
npm run local:mac:install
```

This builds the `/upscale` bundle and registers a LaunchAgent that starts on
login and restarts the worker if it exits. Use `npm run local:mac:status` to
check it. Logs are in `~/Library/Logs/mtips5s-upscale/`.

Then open `https://bb.1nutnhan.com/upscale`, go to Settings, enable **Use Local
Mac Processing**, and upscale an image. If the worker is offline, the job
fails explicitly and is not sent to the VPS.
