import type { CardVariant } from "@/shared/types/concurrency";

import "./badge.scss";

interface Props {
  text: string;
  variant: CardVariant;
}

export default function Badge({ text, variant }: Readonly<Props>) {
  const variantClass = `concurrency-badge--${variant}`;
  return <span className={`concurrency-badge ${variantClass}`}>{text}</span>;
}
