import type { JSX } from "react";

import "./badge.scss";

export type BadgeVariant = "danger" | "success" | "neutral";

export default function Badge(
  props: Readonly<{ text: string; variant: BadgeVariant }>,
): JSX.Element {
  return <span className={`badge badge--${props.variant}`}>{props.text}</span>;
}
