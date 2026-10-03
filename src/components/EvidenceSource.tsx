import { publicSource } from '../content/evidence';

export function EvidenceSource({ id, compact = false }: { id: string; compact?: boolean }) {
  const source = publicSource(id);
  return (
    <a
      className="evidence-source-link"
      href={source.url}
      target="_blank"
      rel="noreferrer"
      data-source-id={id}
    >
      <span>
        {source.publisher} · {source.publishedAt}
      </span>
      {!compact && <span>《{source.title}》</span>}
      <span aria-hidden="true">↗</span>
    </a>
  );
}
