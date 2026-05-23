import type { ReactNode } from "react";

import type { CardVariant } from "@/shared/types/concurrency";

import Badge from "./badge";
import "./card.scss";

interface Props {
  title: string;
  subtitle: string;
  badge: Readonly<{ text: string; variant: CardVariant }>;
  children: ReactNode;
}

export default function Card({
  title,
  subtitle,
  badge,
  children,
}: Readonly<Props>) {
  return (
    <div className="concurrency-card">
      <div className="concurrency-card__header">
        <div className="concurrency-card__heading">
          <div className="concurrency-card__title">{title}</div>
          <div className="concurrency-card__subtitle">{subtitle}</div>
        </div>
        <Badge text={badge.text} variant={badge.variant} />
      </div>

      {children}
    </div>
  );
}
