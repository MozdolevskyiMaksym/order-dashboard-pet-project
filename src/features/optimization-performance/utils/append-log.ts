import type { LogEntry, LogLevel } from "../types";

export default function appendLog(
  setLog: React.Dispatch<React.SetStateAction<ReadonlyArray<LogEntry>>>,
  level: LogLevel,
  text: string,
) {
  setLog((prev) => {
    const next: LogEntry[] = [
      {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        time: new Date().toLocaleTimeString([], { hour12: false }),
        level,
        text,
      },
      ...prev,
    ];
    return next.slice(0, 140);
  });
}
