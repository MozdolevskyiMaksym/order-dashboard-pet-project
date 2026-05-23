import type { CSSProperties } from "react";

import "./mini-timeline.scss";

type TimelineLine = Readonly<{
  label: string;
  note: string;
  widthPct: number;
  color: string;
  endTag: string;
}>;

interface Props {
  title: string;
  lines: ReadonlyArray<TimelineLine>;
}

export default function MiniTimeline({ title, lines }: Readonly<Props>) {
  return (
    <div className="concurrency-timeline">
      <div className="concurrency-timeline__header">
        <div className="concurrency-timeline__title">{title}</div>
        <div className="concurrency-timeline__subtitle">
          Visual hint: longer bar means later finish.
        </div>
      </div>

      <div className="concurrency-timeline__lines">
        {lines.map((l) => (
          <div key={l.label} className="concurrency-timeline__line">
            <div className="concurrency-timeline__line-header">
              <div className="concurrency-timeline__line-label">{l.label}</div>
              <div className="concurrency-timeline__line-note">{l.note}</div>
            </div>

            <div className="concurrency-timeline__bar">
              <div
                className="concurrency-timeline__bar-fill"
                style={
                  {
                    "--bar-width": `${Math.max(2, Math.min(100, l.widthPct))}%`,
                    "--bar-color": l.color,
                  } as CSSProperties
                }
              />
            </div>

            <div className="concurrency-timeline__end">
              End: <b>{l.endTag}</b>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
