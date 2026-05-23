import type { JSX } from "react";
import type { LogEntry } from "../types";

import "./live-log.scss";

export default function LiveLog({
  entries,
}: Readonly<{ entries: ReadonlyArray<LogEntry> }>): JSX.Element {
  return (
    <div className="live-log">
      <div className="live-log__log-meta">newest first | max 140 items</div>

      {entries.length === 0 ? (
        <div className="live-log__log-empty">No activity yet.</div>
      ) : (
        <div className="live-log__log-list">
          {entries.map(({ id, time, level, text }) => (
            <div key={id} className="live-log__log-row">
              <div className="live-log__log-time">{time}</div>
              <div
                className={`live-log__log-dot live-log__log-dot--${level}`}
              />
              <div className="live-log__log-text">{text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
