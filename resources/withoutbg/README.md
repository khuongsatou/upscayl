# WithoutBG runtime bundle

The packaged app expects the platform-specific WithoutBG MNN binary and model in this directory:

- `native/<platform>-<architecture>/withoutbg-mnn` (or `native/darwin-universal/withoutbg-mnn` on macOS)
- `models/withoutbg.mnn`

During development, Upscayl also resolves the sibling `~/Public/unbackground/withoutbg-mnn` checkout. The `WITHOUTBG_ROOT` environment variable is available for local development and validation when the built runtime lives elsewhere.
