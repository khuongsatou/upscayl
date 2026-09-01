import { logAtom } from "@/atoms/log-atom";
import { useAtomValue, useSetAtom } from "jotai";
import { useMemo, useState } from "react";
import { Clipboard, Download, Trash2 } from "lucide-react";

type LogLevel = "info" | "success" | "warning" | "error";

const classify = (line: string): LogLevel => {
  if (/error|fail|exception|uncaught|🚫/i.test(line)) return "error";
  if (/warn|warning|⚠️/i.test(line)) return "warning";
  if (/done|success|complete|🏁|✅/i.test(line)) return "success";
  return "info";
};

const LogManager = () => {
  const logs = useAtomValue(logAtom);
  const setLogs = useSetAtom(logAtom);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<"all" | LogLevel>("all");
  const [copied, setCopied] = useState(false);

  const visibleLogs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return logs
      .map((message, index) => ({ message, index, level: classify(message) }))
      .filter((entry) => level === "all" || entry.level === level)
      .filter((entry) => !normalized || entry.message.toLowerCase().includes(normalized))
      .slice(-500);
  }, [level, logs, query]);

  const copyLogs = async () => {
    await navigator.clipboard.writeText(visibleLogs.map((entry) => entry.message).join("\n"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const exportLogs = () => {
    const blob = new Blob([visibleLogs.map((entry) => entry.message).join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `upscayl-logs-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="mt-4 flex min-h-0 flex-col gap-2" aria-labelledby="log-manager-title">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p id="log-manager-title" className="text-sm font-semibold uppercase">Log Manager</p>
          <span className="badge badge-ghost badge-sm">{logs.length}</span>
        </div>
        <div className="flex gap-1">
          <button className="btn btn-ghost btn-xs" title="Copy logs" aria-label="Copy logs" onClick={copyLogs}>
            <Clipboard size={14} />{copied ? "Copied" : ""}
          </button>
          <button className="btn btn-ghost btn-xs" title="Export logs" aria-label="Export logs" onClick={exportLogs}>
            <Download size={14} />
          </button>
          <button className="btn btn-ghost btn-xs text-error" title="Clear logs" aria-label="Clear logs" onClick={() => setLogs([])}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="flex gap-2">
        <input className="input input-bordered input-xs min-w-0 flex-1" placeholder="Search logs" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select className="select select-bordered select-xs w-24" value={level} onChange={(event) => setLevel(event.target.value as "all" | LogLevel)} aria-label="Filter log level">
          <option value="all">All</option><option value="info">Info</option><option value="success">Success</option><option value="warning">Warning</option><option value="error">Error</option>
        </select>
      </div>
      <div className="max-h-48 min-h-20 overflow-y-auto rounded-btn bg-base-200 p-3 font-mono text-[11px]" aria-live="polite">
        {visibleLogs.length === 0 ? <p className="text-base-content/60">No logs yet.</p> : visibleLogs.map((entry) => (
          <p key={`${entry.index}-${entry.message}`} className={entry.level === "error" ? "text-error" : entry.level === "warning" ? "text-warning" : entry.level === "success" ? "text-success" : "text-base-content/80"}>{entry.message}</p>
        ))}
      </div>
    </section>
  );
};

export default LogManager;
