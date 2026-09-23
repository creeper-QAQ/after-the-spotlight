import { useEffect, useRef } from 'react';
import { sources, type SourceTopic } from '../content/story';
import { Icon } from './Icon';

export function SourceDialog({
  topic,
  onClose,
}: {
  topic: SourceTopic | null;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!topic) return;
    const element = dialog.current!;
    const trigger = document.activeElement as HTMLElement;
    element.showModal();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = oldOverflow;
      trigger?.focus();
    };
  }, [topic]);
  const source = topic ? sources[topic] : null;
  return (
    <dialog
      ref={dialog}
      className="source-dialog"
      onCancel={onClose}
      aria-labelledby="source-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {source && (
        <div className="dialog-inner">
          <div className="dialog-top">
            <span className="eyebrow">NOTES & SOURCES</span>
            <button className="icon-button" onClick={onClose} aria-label="关闭来源">
              <Icon name="close" />
            </button>
          </div>
          <h2 id="source-title">{source.title}</h2>
          <p className="dialog-description">{source.description}</p>
          {source.items.map((item, i) => (
            <article className="source-item" key={item.title}>
              <span className="mono">0{i + 1}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer">
                    访问公开来源 <Icon name="arrow" size={15} />
                  </a>
                )}
              </div>
            </article>
          ))}
          <div className="dialog-foot">
            <span className="status-dot" /> 视觉初版 · 数据待核验
          </div>
        </div>
      )}
    </dialog>
  );
}
