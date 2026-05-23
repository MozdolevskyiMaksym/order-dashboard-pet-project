export type LogLevel = "info" | "warn" | "ok";

export type LogEntry = Readonly<{
  id: string;
  time: string;
  level: LogLevel;
  text: string;
}>;

export type Logger = Readonly<{
  info: (text: string) => void;
  ok: (text: string) => void;
  warn: (text: string) => void;
  clear: () => void;
}>;
