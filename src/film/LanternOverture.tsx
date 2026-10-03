import { interpolate, useCurrentFrame } from 'remotion';

const body = 'M260 410 C340 248 550 222 696 314 Q790 375 738 427 C623 560 372 578 260 410Z';
const sparks = Array.from({ length: 64 }, (_, i) => ({
  x: 90 + ((i * 137.51) % 810),
  y: 65 + ((i * 93.73) % 710),
  r: i % 5 === 0 ? 2 : 0.9,
}));

/** Original graphic interpretation, never a reconstruction or data encoding. */
export function LanternOverture() {
  const frame = useCurrentFrame();
  const paper = interpolate(frame, [0, 85, 135, 260, 359], [0.08, 0.16, 1, 1, 0.08]);
  const scatter = interpolate(frame, [0, 235, 290, 330, 359], [0, 0, 0.6, 1, 0]);
  const drift = Math.sin((frame / 360) * Math.PI * 2);
  const glow = interpolate(frame, [0, 100, 180, 265, 359], [0.3, 0.4, 1, 0.65, 0.3]);
  return (
    <svg viewBox="0 0 1000 880" width="100%" height="100%" aria-hidden="true" data-frame={frame}>
      <defs>
        <radialGradient id="overture-halo">
          <stop stopColor="#ca8b41" stopOpacity=".21" />
          <stop offset="1" stopColor="#ca8b41" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="overture-paper" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#cf4c32" />
          <stop offset=".45" stopColor="#f3bc72" />
          <stop offset=".73" stopColor="#e8dcb4" />
          <stop offset="1" stopColor="#8c3d28" />
        </linearGradient>
        <linearGradient id="overture-tail" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#872b26" stopOpacity=".2" />
          <stop offset="1" stopColor="#db7152" stopOpacity=".8" />
        </linearGradient>
        <clipPath id="overture-body">
          <path d={body} />
        </clipPath>
        <filter id="overture-soft">
          <feGaussianBlur stdDeviation="30" />
        </filter>
      </defs>
      <ellipse cx="540" cy="435" rx="450" ry="360" fill="url(#overture-halo)" opacity={glow} />
      <g
        fill="none"
        stroke="#b9a477"
        strokeWidth=".65"
        opacity=".3"
        transform={`rotate(${-28 + drift * 2} 510 420)`}
      >
        <ellipse cx="510" cy="420" rx="443" ry="270" />
        <ellipse cx="510" cy="420" rx="403" ry="325" strokeDasharray="2 9" />
        <path d="M40 420H975M510 70V790" strokeDasharray="2 11" />
      </g>
      {sparks.map((spark, i) => (
        <circle
          key={i}
          cx={spark.x + drift * (i % 4) * 6}
          cy={spark.y + Math.sin(frame / 60 + i) * 8}
          r={spark.r}
          fill={i % 3 ? '#d4b983' : '#e97f53'}
          opacity={0.2 + (Math.sin(frame / 35 + i) + 1) * 0.2}
        />
      ))}
      <g
        opacity={1 - scatter * 0.88}
        transform={`translate(${drift * 9} ${drift * 8}) rotate(${-17 + drift * 2} 520 425)`}
      >
        <path
          d="M280 405 C187 382 132 289 53 269 C116 359 98 435 155 471 C91 508 108 590 50 640 C156 641 221 524 282 443"
          fill="url(#overture-tail)"
          stroke="#d29468"
          strokeWidth="1.2"
        />
        {Array.from({ length: 12 }, (_, i) => (
          <path
            key={i}
            d={`M${265 + i} ${410 + i * 2} Q${130 + i * 5} ${360 + i * 17 + drift * 9} ${64 + i * 7} ${292 + i * 29}`}
            stroke="#e5b077"
            fill="none"
            opacity={0.18 + (i % 3) * 0.1}
            strokeWidth=".8"
          />
        ))}
        <path
          d="M414 295 C410 220 490 247 535 188 Q570 203 596 282M389 505 Q450 612 566 517"
          fill="url(#overture-tail)"
          stroke="#cf9d72"
        />
        <path
          d={body}
          fill="url(#overture-paper)"
          fillOpacity={paper * 0.85}
          stroke="#efc694"
          strokeWidth="1.5"
        />
        <g clipPath="url(#overture-body)">
          <ellipse
            cx="552"
            cy="406"
            rx="125"
            ry="92"
            fill="#ffe0a6"
            opacity={glow * 0.7}
            filter="url(#overture-soft)"
          />
          {Array.from({ length: 10 }, (_, i) => (
            <path
              key={i}
              d={`M${320 + i * 43} 210 Q${240 + i * 46} 405 ${331 + i * 42} 593`}
              fill="none"
              stroke="#51291f"
              strokeWidth={i % 3 === 0 ? 3 : 1}
              opacity=".5"
            />
          ))}
          {Array.from({ length: 6 }, (_, row) =>
            Array.from({ length: 11 }, (_, col) => (
              <path
                key={`${row}-${col}`}
                d={`M${283 + col * 43 + (row % 2) * 21} ${282 + row * 43} q21 -30 43 0`}
                fill="none"
                stroke="#642d20"
                strokeWidth="1.2"
                opacity={paper * 0.45}
              />
            )),
          )}
          <path d="M245 398 Q520 440 790 376" fill="none" stroke="#f3dbab" strokeWidth="2" />
          <path d="M262 406 Q520 368 748 405" fill="none" stroke="#f3dbab" strokeWidth=".7" />
        </g>
        <path
          d="M657 299 Q597 382 672 493"
          stroke="#6b2e20"
          fill="none"
          strokeWidth="4"
          opacity={paper}
        />
        <circle cx="704" cy="358" r="17" fill="#aa482d" stroke="#eac692" strokeWidth="1.5" />
        <circle cx="707" cy="357" r="8" fill="#111c19" />
        <circle cx="709" cy="354" r="2" fill="#fce7b5" />
        <path
          d="M745 389 Q783 397 761 414M475 451Q530 424 567 458Q518 537 475 451"
          fill="url(#overture-tail)"
          stroke="#6b2e20"
          strokeWidth="2"
        />
        <path
          d={`M290 439 C105 ${510 + drift * 15} 381 640 187 731 C97 773 229 792 365 747`}
          fill="none"
          stroke="#bd4d37"
          strokeWidth="3"
        />
        <path
          d={`M315 477 C170 626 411 613 350 735 S502 816 571 724`}
          fill="none"
          stroke="#d4ac73"
          strokeWidth=".8"
          opacity=".6"
        />
      </g>
      <g opacity={scatter} stroke="#e7c28a" fill="#f2d39b">
        {sparks.map((spark, i) => {
          const angle = i * 2.39996;
          const x = 510 + Math.cos(angle) * (70 + i * 2 + scatter * 190);
          const y = 410 + Math.sin(angle) * (35 + i + scatter * 175);
          return (
            <path
              key={i}
              d={`M${x} ${y} l${Math.cos(angle) * (4 + scatter * 18)} ${Math.sin(angle) * (4 + scatter * 18)}`}
              strokeWidth={spark.r}
              opacity={0.3 + (i % 5) * 0.13}
            />
          );
        })}
      </g>
      <g stroke="#b9a477" fill="none" opacity=".5">
        <path d="M813 264h63v-26M202 625h-58v28" />
        <circle cx="813" cy="264" r="3" />
        <circle cx="202" cy="625" r="3" />
      </g>
      <g fill="#c8b993" fontFamily="serif" fontSize="16" letterSpacing="5">
        <text x="831" y="227">
          形与光
        </text>
        <text x="82" y="680">
          纸与骨
        </text>
      </g>
    </svg>
  );
}
