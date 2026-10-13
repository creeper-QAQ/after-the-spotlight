import { useEffect, useRef, useState } from 'react';
import { createFollowupCard, followupPrompts, followupStages } from '../content/followup';
import { composeLocalReply, type LocalReply, type ReplyContext } from '../content/local-reply';
import { EvidenceSource } from './EvidenceSource';

type Phase = 'idle' | 'writing' | 'paused' | 'done';
type Exchange = { question: string; reply: string };

export function ContinuityLoom() {
  const [letter, setLetter] = useState('');
  const [reply, setReply] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [plan, setPlan] = useState<LocalReply | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [history, setHistory] = useState<Exchange[]>([]);
  const [error, setError] = useState('');
  const [downloadNotice, setDownloadNotice] = useState('');
  const input = useRef<HTMLTextAreaElement>(null);
  const context = useRef<ReplyContext | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const characters = useRef<string[]>([]);
  const position = useRef(0);
  const activePlan = useRef<LocalReply | null>(null);
  const reducedMotion = useRef(false);

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      const choice = document.documentElement.dataset.motion;
      reducedMotion.current = choice ? choice === 'off' : media.matches;
    };
    update();
    media.addEventListener('change', update);
    const preference = new MutationObserver(update);
    preference.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-motion'],
    });
    return () => {
      media.removeEventListener('change', update);
      preference.disconnect();
      clearTimeout(timer.current);
    };
  }, []);

  const reveal = () => {
    const remaining = characters.current.length - position.current;
    const amount = reducedMotion.current ? remaining : 2 + (position.current % 3 === 0 ? 1 : 0);
    position.current = Math.min(characters.current.length, position.current + amount);
    setReply(characters.current.slice(0, position.current).join(''));
    if (position.current >= characters.current.length) {
      timer.current = undefined;
      context.current = activePlan.current?.context;
      setPhase('done');
      return;
    }
    const punctuation = /[。？！；\n]/.test(characters.current[position.current - 1]);
    timer.current = setTimeout(reveal, punctuation ? 100 : 16 + (position.current % 4) * 4);
  };

  const editLetter = (value: string) => {
    setLetter(value);
    setDownloadNotice('');
    setError('');
  };
  const chooseQuestion = (value: string) => {
    editLetter(value);
    input.current?.focus();
  };
  const downloadCard = () => {
    if (!letter.trim()) return;
    const file = new Blob(['\uFEFF', createFollowupCard(letter)], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = '被看见之后-回访问题卡.txt';
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloadNotice('问题卡已生成，请在浏览器下载中查看。');
  };

  const sendLetter = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (phase === 'writing') return;
    try {
      const next = composeLocalReply(letter, context.current);
      clearTimeout(timer.current);
      if (submitted && reply)
        setHistory((values) => [...values, { question: submitted, reply }].slice(-5));
      setSubmitted(letter.trim());
      setReply('');
      setError('');
      setPlan(next);
      activePlan.current = next;
      characters.current = Array.from(next.text);
      position.current = 0;
      setPhase('writing');
      if (reducedMotion.current) reveal();
      else timer.current = setTimeout(reveal, 180);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '请换一种问法再试。');
    }
  };
  const pause = () => {
    clearTimeout(timer.current);
    timer.current = undefined;
    setPhase('paused');
  };
  const resume = () => {
    setPhase('writing');
    reveal();
  };
  const clearConversation = () => {
    clearTimeout(timer.current);
    timer.current = undefined;
    context.current = undefined;
    activePlan.current = null;
    characters.current = [];
    position.current = 0;
    setLetter('');
    setReply('');
    setSubmitted('');
    setPlan(null);
    setHistory([]);
    setPhase('idle');
    setError('');
    setDownloadNotice('');
    input.current?.focus();
  };

  return (
    <section
      id="continuity-loom"
      className="continuity-loom future-letter question-kit"
      aria-labelledby="question-kit-title"
      data-ink-exclude
    >
      <div className="future-letter-heading">
        <span className="eyebrow">回访准备 / 问题与资料</span>
        <h3 id="question-kit-title">
          有些后来，<em>值得接着问。</em>
        </h3>
        <p>写下想了解的事，参考本文资料整理提问，下载问题卡后带去现场。</p>
      </div>
      <div className="future-letter-layout">
        <aside className="question-card-outline" aria-label="问题卡内容">
          <div className="letter-stamp" aria-hidden="true">
            <span>AFTER</span>
            <b>回访</b>
            <span>TO THE FUTURE</span>
          </div>
          <p>卡片里的三次相遇</p>
          <ol>
            {followupStages.map((stage) => (
              <li key={stage.title}>{stage.title}</li>
            ))}
          </ol>
          <small>附匿名编号、日期、具体行为与核对记录的留白。</small>
        </aside>
        <form className="letter-form" onSubmit={sendLetter}>
          {history.length > 0 && (
            <details className="reply-history">
              <summary>之前的 {history.length} 次问答</summary>
              {history.map((exchange, index) => (
                <div className="reply-history-item" key={index}>
                  <b>你的问题</b>
                  <p>{exchange.question}</p>
                  <b>回访建议</b>
                  <p>{exchange.reply}</p>
                </div>
              ))}
            </details>
          )}
          <label htmlFor="future-letter-input">我的问题 / 你想知道什么？</label>
          <textarea
            id="future-letter-input"
            ref={input}
            value={letter}
            onChange={(event) => editLetter(event.target.value)}
            maxLength={1200}
            aria-describedby="letter-input-note"
            placeholder="比如：我挺喜欢鱼灯，但一次体验之后，怎么知道自己有没有真正学会？"
            onKeyDown={(event) => {
              if (
                (event.ctrlKey || event.metaKey) &&
                event.key === 'Enter' &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <div className="letter-suggestions" aria-label="问题灵感">
            {followupPrompts.map((prompt) => (
              <button type="button" key={prompt} onClick={() => chooseQuestion(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
          <div className="letter-submit-row">
            <small>{letter.length} / 1200</small>
            <button type="submit" disabled={!letter.trim() || phase === 'writing'}>
              {phase === 'writing' ? '正在回复…' : '发送问题'} <span aria-hidden="true">↗</span>
            </button>
            <button
              className="letter-download"
              type="button"
              onClick={downloadCard}
              disabled={!letter.trim()}
            >
              下载回访问题卡 <span aria-hidden="true">↓</span>
            </button>
          </div>
          <p id="letter-input-note" className="letter-input-note">
            问答只保留在当前页面，不会发送你的输入。支持 Ctrl / ⌘ + Enter 发送。
          </p>
          <p className="letter-availability" role="status">
            {downloadNotice}
          </p>
          {error && (
            <p role="alert" className="letter-error">
              {error}
            </p>
          )}
          {plan && (
            <div className="letter-reply" data-state={phase}>
              <div className="reply-heading">
                <span role="status" aria-live="polite">
                  {phase === 'writing'
                    ? '回访助手正在逐字回复…'
                    : phase === 'paused'
                      ? '回复已暂停'
                      : '回访助手 / 把问题带到现场'}
                </span>
                <div>
                  {phase === 'writing' && (
                    <button type="button" onClick={pause}>
                      停止回复
                    </button>
                  )}
                  {phase === 'paused' && (
                    <button type="button" onClick={resume}>
                      继续回复
                    </button>
                  )}
                  <button type="button" onClick={clearConversation}>
                    清空对话
                  </button>
                </div>
              </div>
              <blockquote className="reply-question">{submitted}</blockquote>
              <p aria-live="off">
                {reply}
                {phase === 'writing' && (
                  <span className="reply-cursor" aria-hidden="true">
                    ▍
                  </span>
                )}
              </p>
              {phase === 'done' && (
                <>
                  {plan.sourceIds.length > 0 && (
                    <details className="reply-sources">
                      <summary>这次建议涉及的资料 · {plan.sourceIds.length} 份</summary>
                      {plan.sourceIds.map((id) => (
                        <EvidenceSource id={id} key={id} compact />
                      ))}
                    </details>
                  )}
                  <div className="letter-suggestions reply-followups" aria-label="继续追问">
                    {plan.followups.map((prompt) => (
                      <button type="button" key={prompt} onClick={() => chooseQuestion(prompt)}>
                        {prompt}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </form>
      </div>
      <small className="loom-boundary">
        建议依据本作品资料与回访提纲自动整理，不含实际采访结果。未收录的信息仍需向真实的人核实。
      </small>
    </section>
  );
}
