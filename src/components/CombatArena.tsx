'use client'

/* hit point in the SVG arena */
const HX = 215
const HY = 80

const CSS = `
  /* ═══════════════════════════════════════════
     ARENA
  ═══════════════════════════════════════════ */
  .fight-overlay {
    position: relative;
    width: 100%;
    min-height: 520px;
    background: radial-gradient(ellipse 80% 60% at 50% 55%, #0d1a2e 0%, #06090f 100%);
    overflow: hidden;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    animation: fogOut 0.5s ease-in 9.1s forwards;
    border-radius: 1rem;
  }
  @keyframes fogOut { to { opacity: 0; pointer-events: none; } }

  /* ═══════════════════════════════════════════
     SCREEN FLASHES  (absolute overlays)
  ═══════════════════════════════════════════ */
  .sf { position: absolute; inset: 0; opacity: 0; pointer-events: none; }
  /* hit 1 – 1.30s */
  .sf1 { background: rgba(255,255,255,0.30); animation: sfQ 0.28s 1.30s ease-out forwards; }
  /* hit 2 – 2.50s */
  .sf2 { background: rgba(56,189,248,0.25); animation: sfQ 0.28s 2.50s ease-out forwards; }
  /* hit 3 big – 3.75s */
  .sf3 { background: rgba(251,191,36,0.40); animation: sfM 0.45s 3.75s ease-out forwards; }
  /* hit 4 – 5.00s */
  .sf4 { background: rgba(255,255,255,0.28); animation: sfQ 0.28s 5.00s ease-out forwards; }
  /* jump kick – 6.10s */
  .sf5 { background: rgba(129,140,248,0.35); animation: sfM 0.40s 6.10s ease-out forwards; }
  /* FINAL – 7.80s */
  .sf6 { background: rgba(255,255,255,0.95); animation: sfFinal 0.85s 7.80s ease-out forwards; }
  @keyframes sfQ     { 0%{opacity:0} 25%{opacity:1} 100%{opacity:0} }
  @keyframes sfM     { 0%{opacity:0} 15%{opacity:1} 100%{opacity:0} }
  @keyframes sfFinal { 0%{opacity:0}  8%{opacity:1} 100%{opacity:0} }

  /* ═══════════════════════════════════════════
     FIGHT!  announcement
  ═══════════════════════════════════════════ */
  .fight-shout {
    position: absolute;
    font-size: 4rem; font-weight: 900; letter-spacing: 0.18em;
    background: linear-gradient(180deg, #ffffff 20%, #38bdf8 90%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 28px #38bdf8cc);
    opacity: 0; transform: scale(4);
    animation: shoutIn 0.42s cubic-bezier(0.1,0.9,0.3,1.4) 0.10s forwards,
               shoutOut 0.30s ease-in 0.88s forwards;
    pointer-events: none;
  }
  @keyframes shoutIn  { to { opacity:1; transform: scale(1); } }
  @keyframes shoutOut { to { opacity:0; transform: scale(0.5) translateY(-30px); } }

  /* ═══════════════════════════════════════════
     K.O.!  finale
  ═══════════════════════════════════════════ */
  .ko-shout {
    position: absolute;
    font-size: 5.5rem; font-weight: 900; letter-spacing: 0.10em;
    color: #f59e0b;
    text-shadow: 0 0 40px #f59e0b, 0 5px 0 #78350f, 0 0 80px #fde68a;
    opacity: 0; transform: scale(5) rotate(-12deg);
    animation: koIn 0.55s cubic-bezier(0.1,0.9,0.2,1.5) 8.20s forwards;
    pointer-events: none;
  }
  @keyframes koIn { to { opacity:1; transform: scale(1) rotate(-8deg); } }

  /* ═══════════════════════════════════════════
     ARENA WRAPPER  (receives shake)
  ═══════════════════════════════════════════ */
  .arena-wrap {
    display: flex; flex-direction: column; align-items: center;
    animation: bigShake 9s linear forwards;
  }
  @keyframes bigShake {
    /* hit 1  @ 1.30s = 14.4% */
    0%,14.3%      { transform: translate(0,0) }
    14.4%         { transform: translate(-5px, 3px) }
    14.6%         { transform: translate( 5px,-3px) }
    14.8%         { transform: translate(-3px, 1px) }
    15.0%,41.5%   { transform: translate(0,0) }
    /* hit 3 big  @ 3.75s = 41.7% */
    41.6%         { transform: translate(-8px, 4px) }
    41.9%         { transform: translate( 8px,-4px) }
    42.2%         { transform: translate(-5px, 2px) }
    42.5%,67.7%   { transform: translate(0,0) }
    /* jump kick  @ 6.10s = 67.8% */
    67.8%         { transform: translate(-6px, 3px) }
    68.1%         { transform: translate( 6px,-3px) }
    68.4%         { transform: translate(0,0) }
    /* FINAL BLOW @ 7.80s = 86.7% */
    86.6%         { transform: translate(-14px, 7px) }
    87.2%         { transform: translate( 14px,-7px) }
    87.8%         { transform: translate(-10px, 5px) }
    88.4%         { transform: translate( 10px,-5px) }
    89.0%         { transform: translate(-6px, 3px) }
    89.6%,100%    { transform: translate(0,0) }
  }

  /* ═══════════════════════════════════════════
     TITLE
  ═══════════════════════════════════════════ */
  .arena-title {
    font-size: 0.5rem; letter-spacing: 0.25em; color: #1e3a5f;
    text-transform: uppercase; font-weight: 700; margin-bottom: 8px;
  }

  /* ═══════════════════════════════════════════
     HEALTH BARS
  ═══════════════════════════════════════════ */
  .hb-row   { display: flex; gap: 14px; margin-bottom: 6px; align-items: flex-start; }
  .hb-col   { display: flex; flex-direction: column; gap: 3px; }
  .hb-name  { font-size: 0.65rem; font-weight: 700; }
  .hb-name-l{ color: #38bdf8; text-align: right; }
  .hb-name-r{ color: #f87171; text-align: left; }
  .hb-track {
    width: 90px; height: 7px; background: #0a1220;
    border-radius: 4px; border: 1px solid #1e293b; overflow: hidden;
  }
  .vs-badge { font-size: 0.8rem; font-weight: 900; color: #1e3a5f; padding: 10px 4px 0; }

  .mia-hp {
    height: 100%; border-radius: 3px;
    background: linear-gradient(90deg, #0284c7, #38bdf8, #bae6fd);
    box-shadow: 0 0 8px #38bdf8;
    animation: miaHp 9s linear forwards;
  }
  @keyframes miaHp {
    0%,36%  { width: 90px }
    43%     { width: 68px }
    59%,64% { width: 68px }
    69%     { width: 50px }
    100%    { width: 50px }
  }
  .ec-hp {
    height: 100%; border-radius: 3px;
    background: linear-gradient(90deg, #b91c1c, #f87171, #fecaca);
    box-shadow: 0 0 8px #f87171;
    animation: ecHp 9s linear forwards;
  }
  @keyframes ecHp {
    0%,13%  { width: 90px; box-shadow: 0 0 8px #f87171 }
    20%     { width: 70px }
    47%,53% { width: 70px }
    57%     { width: 42px }
    76%,82% { width: 42px }
    85%     { width: 14px; box-shadow: 0 0 14px #ef4444 }
    86%     { box-shadow: 0 0 26px #fff, 0 0 8px #ef4444 }
    87%     { box-shadow: 0 0 14px #ef4444 }
    88%     { box-shadow: 0 0 26px #fff, 0 0 8px #ef4444 }
    89%     { box-shadow: 0 0 14px #ef4444 }
    93%     { width: 14px }
    97%,100%{ width: 0px; box-shadow: none }
  }

  /* ═══════════════════════════════════════════
     MIHAJA  (left fighter, faces right)
  ═══════════════════════════════════════════ */
  .mia-g {
    transform-box: fill-box; transform-origin: 50% 80%;
    animation: miaBody 9s ease-in-out forwards, miaSurge 9s linear forwards;
  }
  /* charge glow before final blow */
  @keyframes miaSurge {
    0%,77%   { filter: drop-shadow(0 0 5px #38bdf8aa) }
    83%      { filter: drop-shadow(0 0 18px #38bdf8) drop-shadow(0 0 36px #0ea5e9) }
    88%,100% { filter: drop-shadow(0 0 8px #38bdf8bb) }
  }
  @keyframes miaBody {
    0%       { transform: translate(-60px, 130px) }
    7%       { transform: translate(100px, 130px) }
    9%       { transform: translate(100px, 130px) }
    /* HIT 1 @ 1.30s – Mihaja punches EC */
    15%      { transform: translate(130px, 130px) rotate(-10deg) }
    19%      { transform: translate(100px, 130px) rotate(0deg) }
    /* HIT 2 @ 2.50s – EC counter, Mihaja staggers back */
    27%      { transform: translate(74px,  130px) rotate(8deg) }
    31%      { transform: translate(100px, 130px) rotate(0deg) }
    /* HIT 3 @ 3.75s – Mihaja big lunge */
    41%      { transform: translate(136px, 130px) rotate(-14deg) }
    45%      { transform: translate(100px, 130px) rotate(0deg) }
    /* HIT 4 @ 5.00s – EC desperate, Mihaja recoils */
    55%      { transform: translate(78px,  130px) rotate(9deg) }
    59%      { transform: translate(100px, 130px) rotate(0deg) }
    /* JUMP KICK @ 6.10s */
    64%      { transform: translate(100px, 114px) rotate(-5deg) }
    67%      { transform: translate(140px, 100px) rotate(-18deg) }
    70%      { transform: translate(100px, 130px) rotate(0deg) }
    /* CHARGE UP 7.00–7.70s */
    78%      { transform: translate(100px, 136px) rotate(5deg) }
    84%      { transform: translate(100px, 130px) rotate(0deg) }
    /* FINAL DEVASTATING BLOW @ 7.80s */
    87%      { transform: translate(154px, 128px) rotate(-22deg) }
    91%      { transform: translate(100px, 130px) rotate(0deg) }
    100%     { transform: translate(100px, 130px) rotate(0deg) }
  }

  .mia-arm-rest  { animation: miaRest  9s linear forwards }
  .mia-arm-punch { animation: miaPunch 9s linear forwards }
  .mia-arm-kick  { animation: miaKick  9s linear forwards }
  .mia-leg-r     { animation: miaLegR  9s linear forwards }
  .mia-arm-vic   { animation: miaVic   9s linear forwards }

  @keyframes miaRest  {
    0%,13%  {opacity:1} 16%,18% {opacity:0}
    20%,39% {opacity:1} 42%,44% {opacity:0}
    46%,62% {opacity:1} 65%,70% {opacity:0}
    71%,84% {opacity:1} 87%,92% {opacity:0}
    93%,100%{opacity:0}
  }
  @keyframes miaPunch {
    0%,13%  {opacity:0} 16%,18% {opacity:1}
    20%,39% {opacity:0} 42%,44% {opacity:1}
    46%,62% {opacity:0} 65%,70% {opacity:0}
    71%,84% {opacity:0} 87%,92% {opacity:1}
    93%,100%{opacity:0}
  }
  @keyframes miaKick {
    0%,64%  {opacity:0} 65%,71% {opacity:1}
    72%,100%{opacity:0}
  }
  @keyframes miaLegR {
    0%,63%  {opacity:1} 65%,71% {opacity:0}
    72%,100%{opacity:1}
  }
  @keyframes miaVic {
    0%,91%  {opacity:0} 93%,100%{opacity:1}
  }

  /* ═══════════════════════════════════════════
     ESPACE COUILLE  (right fighter, faces left)
  ═══════════════════════════════════════════ */
  .ec-g {
    transform-box: fill-box; transform-origin: 50% 80%;
    filter: drop-shadow(0 0 5px #f87171aa);
    animation: ecBody 9s ease-in-out forwards;
  }
  @keyframes ecBody {
    0%       { transform: translate(660px, 130px) }
    7%       { transform: translate(342px, 130px) }
    9%       { transform: translate(342px, 130px) }
    /* HIT 1 – recoils */
    15%      { transform: translate(364px, 130px) rotate(10deg) }
    19%      { transform: translate(342px, 130px) rotate(0deg) }
    /* HIT 2 – EC punches back */
    25%      { transform: translate(314px, 130px) rotate(-8deg) }
    31%      { transform: translate(342px, 130px) rotate(0deg) }
    /* HIT 3 – takes big hit */
    41%      { transform: translate(368px, 130px) rotate(16deg) }
    45%      { transform: translate(342px, 130px) rotate(0deg) }
    /* HIT 4 – desperate punch */
    52%      { transform: translate(316px, 130px) rotate(-7deg) }
    59%      { transform: translate(342px, 130px) rotate(0deg) }
    /* JUMP KICK impact */
    65%      { transform: translate(360px, 130px) rotate(14deg) }
    68%      { transform: translate(354px, 130px) rotate(22deg) }
    71%      { transform: translate(342px, 130px) rotate(4deg) }
    73%      { transform: translate(342px, 130px) rotate(0deg) }
    /* Charging – EC backs off slightly */
    80%      { transform: translate(348px, 130px) rotate(2deg) }
    84%      { transform: translate(342px, 130px) rotate(0deg) }
    /* FINAL BLOW reaction – KNOCKED OUT */
    87%      { transform: translate(372px, 131px) rotate(26deg) }
    90%      { transform: translate(388px, 139px) rotate(58deg) }
    93%      { transform: translate(402px, 154px) rotate(84deg) }
    100%     { transform: translate(406px, 162px) rotate(90deg) }
  }

  .ec-arm-rest  { animation: ecRest  9s linear forwards }
  .ec-arm-punch { animation: ecPunch 9s linear forwards }

  @keyframes ecRest {
    0%,23%  {opacity:1} 26%,30% {opacity:0}
    32%,55% {opacity:1} 58%,62% {opacity:0}
    64%,100%{opacity:1}
  }
  @keyframes ecPunch {
    0%,23%  {opacity:0} 26%,30% {opacity:1}
    32%,55% {opacity:0} 58%,62% {opacity:1}
    64%,100%{opacity:0}
  }

  /* ═══════════════════════════════════════════
     SVG HIT FLASH CIRCLES
  ═══════════════════════════════════════════ */
  .flash { opacity: 0 }
  .f1 { animation: fQ 0.30s 1.30s ease-out forwards }
  .f2 { animation: fQ 0.30s 2.50s ease-out forwards }
  .f3 { animation: fM 0.45s 3.75s ease-out forwards }
  .f4 { animation: fQ 0.30s 5.00s ease-out forwards }
  .f5 { animation: fM 0.40s 6.10s ease-out forwards }
  .f6 { animation: fG 0.80s 7.80s ease-out forwards }
  @keyframes fQ { 0%{opacity:0} 25%{opacity:1} 100%{opacity:0} }
  @keyframes fM { 0%{opacity:0} 18%{opacity:1} 100%{opacity:0} }
  @keyframes fG { 0%{opacity:0}  9%{opacity:1} 100%{opacity:0} }

  /* ═══════════════════════════════════════════
     SPARK LINES
  ═══════════════════════════════════════════ */
  .spark { opacity: 0 }
  .sp1 { animation: spQ 0.38s 1.30s ease-out forwards }
  .sp2 { animation: spQ 0.38s 2.50s ease-out forwards }
  .sp3 { animation: spM 0.55s 3.75s ease-out forwards }
  .sp4 { animation: spQ 0.38s 5.00s ease-out forwards }
  .sp5 { animation: spM 0.48s 6.10s ease-out forwards }
  .sp6 { animation: spG 0.90s 7.80s ease-out forwards }
  @keyframes spQ { 0%{opacity:1} 100%{opacity:0} }
  @keyframes spM { 0%{opacity:1} 100%{opacity:0} }
  @keyframes spG { 0%{opacity:1} 100%{opacity:0} }

  /* ═══════════════════════════════════════════
     HIT TEXT LABELS  (CRACK! POW! etc.)
  ═══════════════════════════════════════════ */
  .htxt { opacity:0; transform-box:fill-box; transform-origin:50% 50% }
  .ht1 { animation: htPop 0.55s 1.30s ease-out forwards }
  .ht2 { animation: htPop 0.55s 2.50s ease-out forwards }
  .ht3 { animation: htM   0.62s 3.75s ease-out forwards }
  .ht4 { animation: htPop 0.55s 5.00s ease-out forwards }
  .ht5 { animation: htM   0.55s 6.10s ease-out forwards }
  .ht6 { animation: htBig 0.95s 7.80s ease-out forwards }
  @keyframes htPop {
    0%  { opacity:0; transform:scale(0.3) rotate(-15deg) }
    35% { opacity:1; transform:scale(1.15) rotate(6deg) }
    65% { opacity:1; transform:scale(1) rotate(4deg) }
    100%{ opacity:0; transform:scale(0.8) rotate(4deg) translateY(-12px) }
  }
  @keyframes htM {
    0%  { opacity:0; transform:scale(0.3) rotate(-12deg) }
    28% { opacity:1; transform:scale(1.2) rotate(5deg) }
    58% { opacity:1; transform:scale(1.05) rotate(3deg) }
    100%{ opacity:0; transform:scale(0.85) rotate(3deg) translateY(-15px) }
  }
  @keyframes htBig {
    0%  { opacity:0; transform:scale(0.15) rotate(-18deg) }
    22% { opacity:1; transform:scale(1.45) rotate(-6deg) }
    55% { opacity:1; transform:scale(1.15) rotate(-4deg) }
    100%{ opacity:0; transform:scale(0.9) rotate(-4deg) translateY(-22px) }
  }

  /* ═══════════════════════════════════════════
     VICTORY
  ═══════════════════════════════════════════ */
  .mia-wins {
    margin-top: 10px; font-size: 1.2rem; font-weight: 900; letter-spacing: 0.06em;
    background: linear-gradient(90deg, #38bdf8, #a78bfa, #fb7185);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    opacity: 0; transform: scale(0.2) translateY(10px);
    animation: winsIn 0.7s cubic-bezier(0.34,1.56,0.64,1) 8.65s forwards;
  }
  @keyframes winsIn { to { opacity:1; transform: scale(1) translateY(0) } }
`

function sparks(n: number, inner: number, outer: number, stroke: string, w: number) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    return (
      <line
        key={i}
        x1={HX + Math.cos(a) * inner} y1={HY + Math.sin(a) * inner}
        x2={HX + Math.cos(a) * outer} y2={HY + Math.sin(a) * outer}
        stroke={stroke} strokeWidth={w} strokeLinecap="round"
      />
    )
  })
}

function finalSparks() {
  const colors = ['#ffffff', '#fbbf24', '#f87171', '#38bdf8']
  return Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2
    const len = i % 3 === 0 ? 52 : i % 3 === 1 ? 38 : 28
    return (
      <line
        key={i}
        x1={HX + Math.cos(a) * 13} y1={HY + Math.sin(a) * 13}
        x2={HX + Math.cos(a) * len} y2={HY + Math.sin(a) * len}
        stroke={colors[i % 4]} strokeWidth={i % 3 === 0 ? 4 : 2.5}
        strokeLinecap="round"
      />
    )
  })
}

export default function CombatArena() {
  return (
    <>
      <style>{CSS}</style>
      <div className="fight-overlay">

        {/* ── screen flash layers ── */}
        <div className="sf sf1" />
        <div className="sf sf2" />
        <div className="sf sf3" />
        <div className="sf sf4" />
        <div className="sf sf5" />
        <div className="sf sf6" />

        {/* ── FIGHT! ── */}
        <div className="fight-shout">FIGHT!</div>

        {/* ── K.O.! ── */}
        <div className="ko-shout">K.O.!</div>

        {/* ══════════════════════════════════════
            MAIN ARENA  (shakeable wrapper)
        ══════════════════════════════════════ */}
        <div className="arena-wrap">

          <div className="arena-title">Combat de développeurs</div>

          {/* Health bars */}
          <div className="hb-row">
            <div className="hb-col" style={{ alignItems: 'flex-end' }}>
              <div className="hb-name hb-name-l">Mihaja</div>
              <div className="hb-track"><div className="mia-hp" /></div>
            </div>
            <div className="vs-badge">VS</div>
            <div className="hb-col" style={{ alignItems: 'flex-start' }}>
              <div className="hb-name hb-name-r">Espace Couille</div>
              <div className="hb-track"><div className="ec-hp" /></div>
            </div>
          </div>

          {/* ══ FIGHT ARENA SVG ══ */}
          <svg width={500} height={220} style={{ display: 'block', overflow: 'visible' }}>
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3.5" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="bigGlow">
                <feGaussianBlur stdDeviation="7" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* crowd silhouettes */}
            {[18, 36, 54].map((x, i) => (
              <g key={`lc${i}`} opacity={0.13}>
                <circle cx={x} cy={126} r={7} fill="#64748b" />
                <rect x={x - 5} y={133} width={10} height={18} rx={2} fill="#64748b" />
              </g>
            ))}
            {[446, 464, 482].map((x, i) => (
              <g key={`rc${i}`} opacity={0.13}>
                <circle cx={x} cy={126} r={7} fill="#64748b" />
                <rect x={x - 5} y={133} width={10} height={18} rx={2} fill="#64748b" />
              </g>
            ))}

            {/* arena floor */}
            <line x1={20} y1={155} x2={480} y2={155} stroke="#1e3a5f" strokeWidth={2} />
            <line x1={20} y1={155} x2={480} y2={155} stroke="#38bdf820" strokeWidth={8} />

            {/* ── MIHAJA ── */}
            <g className="mia-g">
              <circle cx={0} cy={-52} r={11} stroke="#38bdf8" strokeWidth={2.5} fill="#06090f" />
              <line x1={0} y1={-41} x2={0}   y2={-10} stroke="#38bdf8" strokeWidth={2.8} strokeLinecap="round" />
              {/* rear arm */}
              <line x1={0} y1={-31} x2={-20} y2={-14} stroke="#38bdf8" strokeWidth={2.5} strokeLinecap="round" />
              {/* right arm – rest */}
              <line className="mia-arm-rest"  x1={0} y1={-31} x2={ 22} y2={-14} stroke="#38bdf8" strokeWidth={2.5} strokeLinecap="round" />
              {/* right arm – punch */}
              <line className="mia-arm-punch" x1={0} y1={-31} x2={ 42} y2={-24} stroke="#38bdf8" strokeWidth={2.5} strokeLinecap="round" />
              {/* right leg – flying kick */}
              <line className="mia-arm-kick"  x1={0} y1={-10} x2={ 40} y2={-28} stroke="#38bdf8" strokeWidth={2.5} strokeLinecap="round" />
              {/* left arm – victory */}
              <line className="mia-arm-vic"   x1={0} y1={-31} x2={-26} y2={-58} stroke="#38bdf8" strokeWidth={2.5} strokeLinecap="round" />
              {/* left leg */}
              <line x1={0} y1={-10} x2={-15} y2={22} stroke="#38bdf8" strokeWidth={2.5} strokeLinecap="round" />
              {/* right leg (hides during kick) */}
              <line className="mia-leg-r" x1={0} y1={-10} x2={16} y2={22} stroke="#38bdf8" strokeWidth={2.5} strokeLinecap="round" />
            </g>

            {/* ── ESPACE CLEF ── */}
            <g className="ec-g">
              <circle cx={0} cy={-52} r={11} stroke="#f87171" strokeWidth={2.5} fill="#06090f" />
              <line x1={0} y1={-41} x2={0}  y2={-10} stroke="#f87171" strokeWidth={2.8} strokeLinecap="round" />
              {/* rear arm */}
              <line x1={0} y1={-31} x2={20} y2={-14} stroke="#f87171" strokeWidth={2.5} strokeLinecap="round" />
              {/* left arm – rest */}
              <line className="ec-arm-rest"  x1={0} y1={-31} x2={-22} y2={-14} stroke="#f87171" strokeWidth={2.5} strokeLinecap="round" />
              {/* left arm – punch */}
              <line className="ec-arm-punch" x1={0} y1={-31} x2={-42} y2={-24} stroke="#f87171" strokeWidth={2.5} strokeLinecap="round" />
              {/* legs */}
              <line x1={0} y1={-10} x2={ 15} y2={22} stroke="#f87171" strokeWidth={2.5} strokeLinecap="round" />
              <line x1={0} y1={-10} x2={-16} y2={22} stroke="#f87171" strokeWidth={2.5} strokeLinecap="round" />
            </g>

            {/* ══ HIT EFFECTS ══ */}

            {/* flash circles */}
            <circle className="flash f1" cx={HX} cy={HY} r={14} fill="#ffffffbb" filter="url(#glow)" />
            <circle className="flash f2" cx={HX} cy={HY} r={14} fill="#38bdf8aa" filter="url(#glow)" />
            <circle className="flash f3" cx={HX} cy={HY} r={22} fill="#fbbf24cc" filter="url(#glow)" />
            <circle className="flash f4" cx={HX} cy={HY} r={14} fill="#ffffffbb" filter="url(#glow)" />
            <circle className="flash f5" cx={HX} cy={HY} r={19} fill="#818cf8bb" filter="url(#glow)" />
            <circle className="flash f6" cx={HX} cy={HY} r={30} fill="#ffffffcc" filter="url(#bigGlow)" />

            {/* spark sets */}
            <g className="spark sp1">{sparks(5, 14, 30, '#facc15', 2.5)}</g>
            <g className="spark sp2">{sparks(5, 14, 30, '#38bdf8', 2.5)}</g>
            <g className="spark sp3">{sparks(8, 14, 36, '#fbbf24', 3)}</g>
            <g className="spark sp4">{sparks(5, 14, 30, '#facc15', 2.5)}</g>
            <g className="spark sp5">{sparks(6, 14, 30, '#818cf8', 2.5)}</g>
            <g className="spark sp6">{finalSparks()}</g>

            {/* hit text labels */}
            {([
              ['ht1', '#facc15', 14, 'CRACK!'],
              ['ht2', '#38bdf8', 14, 'POW!'],
              ['ht3', '#fbbf24', 19, 'SMASH!'],
              ['ht4', '#f87171', 14, 'BANG!'],
              ['ht5', '#818cf8', 16, 'KI-YA!'],
              ['ht6', '#ffffff', 24, 'FINAL!!'],
            ] as const).map(([cls, fill, size, label]) => (
              <text
                key={cls}
                className={`htxt ${cls}`}
                x={HX} y={HY - 22}
                textAnchor="middle"
                fill={fill}
                stroke="#000" strokeWidth={1.5} paintOrder="stroke"
                fontSize={size} fontWeight={900} fontFamily="monospace"
              >
                {label}
              </text>
            ))}
          </svg>

          {/* victory */}
          <div className="mia-wins">Mihaja gagne ! 🏆</div>
        </div>
      </div>
    </>
  )
}
