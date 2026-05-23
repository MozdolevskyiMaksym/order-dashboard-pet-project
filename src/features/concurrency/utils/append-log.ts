import type { Dispatch, SetStateAction } from "react";

type LogItem = Readonly<{
  id: string;
  time: string;
  level: "info" | "warn" | "ok";
  text: string;
}>;

function newId(): string {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function nowTime(): string {
  return new Date().toLocaleTimeString([], { hour12: false });
}

export function appendLog(
  setLog: Dispatch<SetStateAction<ReadonlyArray<LogItem>>>,
  level: LogItem["level"],
  text: string,
) {
  setLog((prev) => {
    const next: LogItem[] = [
      { id: newId(), time: nowTime(), level, text },
      ...prev,
    ];
    return next.slice(0, 120);
  });
}

export type { LogItem };
export default appendLog;
