import { spawn, type ChildProcess } from "node:child_process";
import { isAbsolute, resolve } from "node:path";

export type RemoveBackgroundRequest = {
  inputPath: string;
  outputPath: string;
};

export type RemoveBackgroundResult = {
  outputPath: string;
  width: number;
  height: number;
};

export type RemoveBackgroundJob = {
  promise: Promise<RemoveBackgroundResult>;
  cancel: () => void;
};

const assertAbsolutePath = (label: string, value: string) => {
  if (!isAbsolute(value)) {
    throw new Error(`${label} must be an absolute path`);
  }
};

export function removeBackground(
  request: RemoveBackgroundRequest,
  options: {
    binaryPath: string;
    modelPath: string;
    onProgress?: (stage: string) => void;
  },
): RemoveBackgroundJob {
  assertAbsolutePath("inputPath", request.inputPath);
  assertAbsolutePath("outputPath", request.outputPath);
  assertAbsolutePath("binaryPath", options.binaryPath);
  assertAbsolutePath("modelPath", options.modelPath);

  if (resolve(request.inputPath) === resolve(request.outputPath)) {
    throw new Error("outputPath must not overwrite inputPath");
  }

  let child: ChildProcess | undefined;
  let cancelled = false;
  let settled = false;

  const promise = new Promise<RemoveBackgroundResult>(
    (resolvePromise, reject) => {
      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        reject(error);
        if (child && !child.killed) child.kill();
      };

      try {
        child = spawn(
          options.binaryPath,
          [
            "--input",
            request.inputPath,
            "--output",
            request.outputPath,
            "--model",
            options.modelPath,
            "--json",
          ],
          { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
        );
      } catch (error) {
        fail(error instanceof Error ? error : new Error(String(error)));
        return;
      }

      let stderr = "";
      let stdoutBuffer = "";
      let result: RemoveBackgroundResult | undefined;

      const processLine = (line: string) => {
        if (!line.trim() || settled) return;

        let event: {
          event: string;
          stage?: string;
          output?: string;
          width?: number;
          height?: number;
          message?: string;
          code?: number;
        };

        try {
          event = JSON.parse(line) as typeof event;
        } catch (error) {
          fail(
            new Error(
              `Invalid WithoutBG event: ${error instanceof Error ? error.message : String(error)}`,
            ),
          );
          return;
        }

        if (event.event === "progress" && event.stage) {
          options.onProgress?.(event.stage);
        }

        if (event.event === "error") {
          fail(
            new Error(
              `WithoutBG failed (${event.code ?? "unknown"}): ${event.message ?? "unknown error"}`,
            ),
          );
          return;
        }

        if (event.event !== "result") return;

        if (
          !event.output ||
          typeof event.width !== "number" ||
          typeof event.height !== "number" ||
          event.width <= 0 ||
          event.height <= 0
        ) {
          fail(new Error("WithoutBG returned an invalid result event"));
          return;
        }

        if (resolve(event.output) !== resolve(request.outputPath)) {
          fail(new Error("WithoutBG returned an unexpected output path"));
          return;
        }

        result = {
          outputPath: event.output,
          width: event.width,
          height: event.height,
        };
      };

      child.stdout?.on("data", (chunk: Buffer) => {
        stdoutBuffer += chunk.toString("utf8");
        const lines = stdoutBuffer.split("\n");
        stdoutBuffer = lines.pop() ?? "";
        lines.forEach(processLine);
      });
      child.stderr?.on("data", (chunk: Buffer) => {
        stderr += chunk.toString("utf8");
      });
      child.on("error", (error) => fail(error));
      child.on("close", (code) => {
        if (stdoutBuffer.trim()) processLine(stdoutBuffer);
        if (settled) return;

        if (cancelled) {
          fail(new Error("Background removal was cancelled"));
          return;
        }

        if (code === 0 && result) {
          settled = true;
          resolvePromise(result);
          return;
        }

        fail(
          new Error(
            stderr.trim() ||
              `WithoutBG exited with code ${code ?? "unknown"} without a result event`,
          ),
        );
      });
    },
  );

  return {
    promise,
    cancel: () => {
      if (settled) return;
      cancelled = true;
      if (child && !child.killed) child.kill();
    },
  };
}
