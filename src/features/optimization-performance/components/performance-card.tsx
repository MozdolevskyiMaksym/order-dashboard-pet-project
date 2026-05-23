import type { JSX } from "react";

import Badge, { type BadgeVariant } from "./badge";

import "./performance-card.scss";

export default function PerformanceCard(
  props: Readonly<{
    title: string;
    subtitle: string;
    badge: Readonly<{ text: string; variant: BadgeVariant }>;
    children: React.ReactNode;
  }>,
): JSX.Element {
  return (
    <div className="performance-card">
      <div className="performance-card__head">
        <div className="performance-card__head-text">
          <div className="performance-card__title">{props.title}</div>
          <div className="performance-card__subtitle">{props.subtitle}</div>
        </div>

        <Badge text={props.badge.text} variant={props.badge.variant} />
      </div>

      <div className="performance-card__body">{props.children}</div>
    </div>
  );
}
