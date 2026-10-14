import { publicEvidence } from '../content/evidence';

export function SourceNote({ id }: { id: string }) {
  const index = publicEvidence.sources.findIndex((s) => s.id === id);
  if (index < 0) throw new Error(`Unresolved story source: ${id}`);
  return (
    <a
      className="story-source-note"
      href={`#source-${id}`}
      onClick={() => {
        let parent = document.getElementById(`source-${id}`)?.parentElement;
        while (parent) {
          if (parent instanceof HTMLDetailsElement) parent.open = true;
          parent = parent.parentElement;
        }
      }}
    >
      资料 {String(index + 1).padStart(2, '0')} ↗
    </a>
  );
}
