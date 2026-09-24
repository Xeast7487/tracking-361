'use client'

/* hit point in the SVG arena */
const HX = 215
const HY = 80

/* Kamehameha beam geometry */
const KBX = 138  /* beam start X (Will's extended hands) */
const KBY = 100  /* beam Y center */
const KIX = 342  /* beam impact X (Jasmine position) */
const KIY = 108  /* beam impact Y */

const CSS = `
  .wj-overlay {
    position: relative;
    width: 100%;
    min-height: 560px;
    background: radial-gradient(ellipse 80% 60% at 50% 55%, #1a0d0d 0%, #06090f 100%);
    overflow: hidden;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    animation: wjFogOut 0.5s ease-in 9.1s forwards;
    border-radius: 1rem;
  }
  @keyframes wjFogOut { to { opacity: 0; pointer-events: none; } }

  /* screen flashes */
  .wsf { position: absolute; inset: 0; opacity: 0; pointer-events: none; }
  .wsf1 { background: rgba(255,255,255,0.30); animation: wsfQ 0.28s 1.20s ease-out forwards; }
  .wsf2 { background: rgba(251,146,60,0.30);  animation: wsfQ 0.28s 2.40s ease-out forwards; }
  .wsf3 { background: rgba(251,191,36,0.45);  animation: wsfM 0.45s 3.60s ease-out forwards; }
  .wsf4 { background: rgba(255,255,255,0.28); animation: wsfQ 0.28s 4.90s ease-out forwards; }
  .wsf5 { background: rgba(239,68,68,0.40);   animation: wsfM 0.40s 6.00s ease-out forwards; }
  /* KAMEHAMEHA @ 7.70s — éclair bleu-blanc */
  .wsf6 { background: rgba(186,230,253,0.92); animation: wsfCrash 1.10s 7.70s ease-out forwards; }
  @keyframes wsfQ     { 0%{opacity:0} 25%{opacity:1} 100%{opacity:0} }
  @keyframes wsfM     { 0%{opacity:0} 15%{opacity:1} 100%{opacity:0} }
  @keyframes wsfCrash { 0%{opacity:0} 8%{opacity:0.85} 35%{opacity:0.60} 100%{opacity:0} }

  /* FIGHT! */
  .wj-shout {
    position: absolute;
    font-size: 4rem; font-weight: 900; letter-spacing: 0.18em;
    background: linear-gradient(180deg, #ffffff 20%, #fb923c 90%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 28px #fb923ccc);
    opacity: 0; transform: scale(4);
    animation: wShoutIn 0.42s cubic-bezier(0.1,0.9,0.3,1.4) 0.10s forwards,
               wShoutOut 0.30s ease-in 0.88s forwards;
    pointer-events: none;
  }
  @keyframes wShoutIn  { to { opacity:1; transform: scale(1); } }
  @keyframes wShoutOut { to { opacity:0; transform: scale(0.5) translateY(-30px); } }

  /* K.O.! */
  .wj-ko {
    position: absolute;
    font-size: 5.5rem; font-weight: 900; letter-spacing: 0.10em;
    color: #ef4444;
    text-shadow: 0 0 40px #ef4444, 0 5px 0 #7f1d1d, 0 0 80px #fca5a5;
    opacity: 0; transform: scale(5) rotate(-12deg);
    animation: wKoIn 0.55s cubic-bezier(0.1,0.9,0.2,1.5) 8.20s forwards;
    pointer-events: none;
  }
  @keyframes wKoIn { to { opacity:1; transform: scale(1) rotate(-8deg); } }

  /* arena shake */
  .wj-wrap {
    display: flex; flex-direction: column; align-items: center;
    animation: wjShake 9s linear forwards;
  }
  @keyframes wjShake {
    0%,13.2%      { transform: translate(0,0) }
    13.3%         { transform: translate(-5px, 3px) }
    13.5%         { transform: translate( 5px,-3px) }
    13.7%         { transform: translate(0,0) }
    13.8%,40%     { transform: translate(0,0) }
    40.1%         { transform: translate(-8px, 4px) }
    40.4%         { transform: translate( 8px,-4px) }
    40.7%,66.5%   { transform: translate(0,0) }
    66.6%         { transform: translate(-6px, 3px) }
    66.9%         { transform: translate( 6px,-3px) }
    67.2%         { transform: translate(0,0) }
    /* KAMEHAMEHA @ 7.70s = 85.6% */
    85.5%         { transform: translate(-22px, 11px) }
    86.2%         { transform: translate( 22px,-11px) }
    86.9%         { transform: translate(-15px, 7px) }
    87.6%         { transform: translate( 15px,-7px) }
    88.3%         { transform: translate(-8px, 4px) }
    89.0%,100%    { transform: translate(0,0) }
  }

  .wj-title {
    font-size: 0.5rem; letter-spacing: 0.25em; color: #3b1212;
    text-transform: uppercase; font-weight: 700; margin-bottom: 8px;
  }

  /* Health bars */
  .wj-hb-row   { display: flex; gap: 14px; margin-bottom: 6px; align-items: flex-start; }
  .wj-hb-col   { display: flex; flex-direction: column; gap: 3px; }
  .wj-hb-name  { font-size: 0.65rem; font-weight: 700; }
  .wj-hb-name-l{ color: #fb923c; text-align: right; }
  .wj-hb-name-r{ color: #c084fc; text-align: left; }
  .wj-hb-track {
    width: 90px; height: 7px; background: #0a1220;
    border-radius: 4px; border: 1px solid #1e293b; overflow: hidden;
  }
  .wj-vs { font-size: 0.8rem; font-weight: 900; color: #3b1212; padding: 10px 4px 0; }

  .will-hp {
    height: 100%; border-radius: 3px;
    background: linear-gradient(90deg, #c2410c, #fb923c, #fed7aa);
    box-shadow: 0 0 8px #fb923c;
    animation: willHp 9s linear forwards;
  }
  @keyframes willHp {
    0%,26%  { width: 90px }
    32%     { width: 72px }
    54%,58% { width: 72px }
    62%     { width: 58px }
    100%    { width: 58px }
  }

  .jas-hp {
    height: 100%; border-radius: 3px;
    background: linear-gradient(90deg, #7e22ce, #c084fc, #e9d5ff);
    box-shadow: 0 0 8px #c084fc;
    animation: jasHp 9s linear forwards;
  }
  @keyframes jasHp {
    0%,12%  { width: 90px; box-shadow: 0 0 8px #c084fc }
    18%     { width: 68px }
    38%,44% { width: 68px }
    48%     { width: 40px }
    74%,80% { width: 40px }
    85%     { width: 10px; box-shadow: 0 0 14px #38bdf8 }
    86%     { box-shadow: 0 0 26px #fff, 0 0 8px #38bdf8 }
    87%     { box-shadow: 0 0 14px #38bdf8 }
    88%     { box-shadow: 0 0 26px #fff, 0 0 8px #38bdf8 }
    92%     { width: 10px }
    97%,100%{ width: 0px; box-shadow: none }
  }

  /* WILL – left fighter (orange, faces right) */
  .will-g {
    transform-box: fill-box; transform-origin: 50% 80%;
    animation: willBody 9s ease-in-out forwards, willSurge 9s linear forwards;
  }
  @keyframes willSurge {
    0%,75%   { filter: drop-shadow(0 0 5px #fb923caa) }
    77%      { filter: drop-shadow(0 0 14px #7dd3fc) drop-shadow(0 0 28px #0ea5e9) }
    83%      { filter: drop-shadow(0 0 36px #ffffff) drop-shadow(0 0 70px #38bdf8) drop-shadow(0 0 100px #0ea5e9) }
    87%      { filter: drop-shadow(0 0 20px #7dd3fc) drop-shadow(0 0 40px #38bdf8) }
    90%,100% { filter: drop-shadow(0 0 8px #fb923cbb) }
  }
  @keyframes willBody {
    0%       { transform: translate(-60px, 130px) }
    7%       { transform: translate(100px, 130px) }
    /* HIT 1 @ 1.20s – Will punches */
    14%      { transform: translate(132px, 130px) rotate(-10deg) }
    18%      { transform: translate(100px, 130px) rotate(0deg) }
    /* HIT 2 @ 2.40s – Jasmine counter, Will staggers */
    26%      { transform: translate(75px,  130px) rotate(8deg) }
    30%      { transform: translate(100px, 130px) rotate(0deg) }
    /* HIT 3 @ 3.60s – Will big hit */
    40%      { transform: translate(138px, 130px) rotate(-14deg) }
    44%      { transform: translate(100px, 130px) rotate(0deg) }
    /* HIT 4 @ 4.90s – Jasmine desperate, Will recoils */
    54%      { transform: translate(80px,  130px) rotate(9deg) }
    58%      { transform: translate(100px, 130px) rotate(0deg) }
    /* KICK @ 6.00s */
    63%      { transform: translate(100px, 112px) rotate(-5deg) }
    66%      { transform: translate(142px,  98px) rotate(-20deg) }
    70%      { transform: translate(100px, 130px) rotate(0deg) }
    /* KAMEHAMEHA CHARGE @ 7.0s — se ramasse, mains en coupe */
    77%      { transform: translate(85px, 136px) rotate(-8deg) }
    83%      { transform: translate(82px, 133px) rotate(-12deg) }
    /* KAMEHAMEHA FIRE @ 7.70s — bras tendus en avant */
    86%      { transform: translate(90px, 130px) rotate(-6deg) }
    89%      { transform: translate(100px, 130px) rotate(0deg) }
    100%     { transform: translate(100px, 130px) rotate(0deg) }
  }

  .will-arm-rest  { animation: willRest  9s linear forwards }
  .will-arm-punch { animation: willPunch 9s linear forwards }
  .will-arm-kick  { animation: willKick  9s linear forwards }
  .will-leg-r     { animation: willLegR  9s linear forwards }
  .will-arm-cup   { animation: willCup   9s linear forwards }
  .will-arm-kame  { animation: willKame  9s linear forwards }
  .will-arm-vic   { animation: willVic   9s linear forwards }

  @keyframes willRest  {
    0%,13%  {opacity:1} 16%,18% {opacity:0}
    20%,38% {opacity:1} 41%,43% {opacity:0}
    45%,62% {opacity:1} 65%,71% {opacity:0}
    72%,76% {opacity:1} 77%,100%{opacity:0}
  }
  @keyframes willPunch {
    0%,13%  {opacity:0} 16%,18% {opacity:1}
    20%,38% {opacity:0} 41%,43% {opacity:1}
    45%,100%{opacity:0}
  }
  @keyframes willKick {
    0%,63%  {opacity:0} 65%,71% {opacity:1}
    72%,100%{opacity:0}
  }
  @keyframes willLegR {
    0%,62%  {opacity:1} 65%,71% {opacity:0}
    72%,100%{opacity:1}
  }
  /* mains en coupe — phase de charge KAME... */
  @keyframes willCup {
    0%,76%  {opacity:0} 77%,84% {opacity:1}
    85%,100%{opacity:0}
  }
  /* bras tendus en avant — tir HAMEHA! */
  @keyframes willKame {
    0%,84%  {opacity:0} 85%,91% {opacity:1}
    92%,100%{opacity:0}
  }
  @keyframes willVic {
    0%,91%  {opacity:0} 93%,100%{opacity:1}
  }

  /* ══════════════ KAMEHAMEHA BEAM ══════════════ */
  .kame-beam-halo {
    transform-box: fill-box;
    transform-origin: left center;
    opacity: 0;
    animation: kameHalo 1.60s 7.70s ease-out forwards;
  }
  .kame-beam-core {
    transform-box: fill-box;
    transform-origin: left center;
    opacity: 0;
    animation: kameCore 1.60s 7.70s ease-out forwards;
  }
  @keyframes kameHalo {
    0%   { opacity:0; transform: scaleX(0) }
    8%   { opacity:0.5; transform: scaleX(0.12) }
    22%  { opacity:0.38; transform: scaleX(1) }
    80%  { opacity:0.28; transform: scaleX(1) }
    100% { opacity:0; transform: scaleX(1) }
  }
  @keyframes kameCore {
    0%   { opacity:0; transform: scaleX(0) }
    8%   { opacity:1; transform: scaleX(0.12) }
    22%  { opacity:1; transform: scaleX(1) }
    80%  { opacity:0.9; transform: scaleX(1) }
    100% { opacity:0; transform: scaleX(1) }
  }

  /* ══════════════ AURA DE CHARGE ══════════════ */
  .kame-aura {
    transform-box: fill-box;
    transform-origin: center center;
    opacity: 0;
    animation: kameAura 0.72s 7.00s ease-in-out forwards;
  }
  @keyframes kameAura {
    0%  { opacity:0; transform: scale(0.3) }
    38% { opacity:1; transform: scale(1.5) }
    70% { opacity:0.6; transform: scale(1.1) }
    100%{ opacity:0; transform: scale(0.9) }
  }

  /* JASMINE – right fighter (purple, faces left) */
  .jas-g {
    transform-box: fill-box; transform-origin: 50% 80%;
    filter: drop-shadow(0 0 5px #c084fcaa);
    animation: jasBody 9s ease-in-out forwards;
  }
  @keyframes jasBody {
    0%       { transform: translate(660px, 130px) }
    7%       { transform: translate(342px, 130px) }
    /* HIT 1 – recoils */
    14%      { transform: translate(365px, 130px) rotate(10deg) }
    18%      { transform: translate(342px, 130px) rotate(0deg) }
    /* HIT 2 – counter */
    24%      { transform: translate(314px, 130px) rotate(-8deg) }
    30%      { transform: translate(342px, 130px) rotate(0deg) }
    /* HIT 3 – big hit */
    40%      { transform: translate(370px, 130px) rotate(18deg) }
    44%      { transform: translate(342px, 130px) rotate(0deg) }
    /* HIT 4 – desperate */
    51%      { transform: translate(315px, 130px) rotate(-7deg) }
    58%      { transform: translate(342px, 130px) rotate(0deg) }
    /* KICK impact */
    65%      { transform: translate(362px, 130px) rotate(15deg) }
    68%      { transform: translate(356px, 130px) rotate(24deg) }
    72%      { transform: translate(342px, 130px) rotate(0deg) }
    /* Recule avant le Kamehameha */
    80%      { transform: translate(350px, 130px) rotate(2deg) }
    84%      { transform: translate(342px, 130px) rotate(0deg) }
    /* KAMEHAMEHA — soufflée par le rayon */
    86%      { transform: translate(368px, 128px) rotate(25deg) }
    88%      { transform: translate(420px, 115px) rotate(60deg) }
    90%      { transform: translate(480px, 105px) rotate(90deg) }
    93%,100% { transform: translate(560px, 98px) rotate(105deg) }
  }

  .jas-arm-rest  { animation: jasRest  9s linear forwards }
  .jas-arm-punch { animation: jasPunch 9s linear forwards }

  @keyframes jasRest {
    0%,23%  {opacity:1} 26%,30% {opacity:0}
    32%,54% {opacity:1} 57%,62% {opacity:0}
    64%,100%{opacity:1}
  }
  @keyframes jasPunch {
    0%,23%  {opacity:0} 26%,30% {opacity:1}
    32%,54% {opacity:0} 57%,62% {opacity:1}
    64%,100%{opacity:0}
  }

  /* hit flash circles */
  .wflash { opacity: 0 }
  .wf1 { animation: wfQ 0.30s 1.20s ease-out forwards }
  .wf2 { animation: wfQ 0.30s 2.40s ease-out forwards }
  .wf3 { animation: wfM 0.45s 3.60s ease-out forwards }
  .wf4 { animation: wfQ 0.30s 4.90s ease-out forwards }
  .wf5 { animation: wfM 0.40s 6.00s ease-out forwards }
  .wf6 { animation: wfG 1.00s 7.70s ease-out forwards }
  @keyframes wfQ { 0%{opacity:0} 25%{opacity:1} 100%{opacity:0} }
  @keyframes wfM { 0%{opacity:0} 18%{opacity:1} 100%{opacity:0} }
  @keyframes wfG { 0%{opacity:0}  9%{opacity:1} 100%{opacity:0} }

  /* sparks */
  .wspark { opacity: 0 }
  .wsp1 { animation: wspQ 0.38s 1.20s ease-out forwards }
  .wsp2 { animation: wspQ 0.38s 2.40s ease-out forwards }
  .wsp3 { animation: wspM 0.55s 3.60s ease-out forwards }
  .wsp4 { animation: wspQ 0.38s 4.90s ease-out forwards }
  .wsp5 { animation: wspM 0.48s 6.00s ease-out forwards }
  .wsp6 { animation: wspG 0.90s 7.70s ease-out forwards }
  @keyframes wspQ { 0%{opacity:1} 100%{opacity:0} }
  @keyframes wspM { 0%{opacity:1} 100%{opacity:0} }
  @keyframes wspG { 0%{opacity:1} 100%{opacity:0} }

  /* hit text */
  .whtxt { opacity:0; transform-box:fill-box; transform-origin:50% 50% }
  .wht1 { animation: whtPop 0.55s 1.20s ease-out forwards }
  .wht2 { animation: whtPop 0.55s 2.40s ease-out forwards }
  .wht3 { animation: whtM   0.62s 3.60s ease-out forwards }
  .wht4 { animation: whtPop 0.55s 4.90s ease-out forwards }
  .wht5 { animation: whtM   0.55s 6.00s ease-out forwards }
  .wht6 { animation: whtBig 1.05s 7.70s ease-out forwards }
  /* KAME... texte de charge */
  .wht-kame { animation: whtCharge 0.72s 7.00s ease-in-out forwards }
  @keyframes whtPop {
    0%  { opacity:0; transform:scale(0.3) rotate(-15deg) }
    35% { opacity:1; transform:scale(1.15) rotate(6deg) }
    65% { opacity:1; transform:scale(1) rotate(4deg) }
    100%{ opacity:0; transform:scale(0.8) rotate(4deg) translateY(-12px) }
  }
  @keyframes whtM {
    0%  { opacity:0; transform:scale(0.3) rotate(-12deg) }
    28% { opacity:1; transform:scale(1.2) rotate(5deg) }
    58% { opacity:1; transform:scale(1.05) rotate(3deg) }
    100%{ opacity:0; transform:scale(0.85) rotate(3deg) translateY(-15px) }
  }
  @keyframes whtBig {
    0%  { opacity:0; transform:scale(0.1) rotate(-18deg) }
    20% { opacity:1; transform:scale(1.8) rotate(-8deg) }
    55% { opacity:1; transform:scale(1.4) rotate(-5deg) }
    100%{ opacity:0; transform:scale(1.0) rotate(-5deg) translateY(-28px) }
  }
  @keyframes whtCharge {
    0%  { opacity:0; transform:scale(0.5) }
    40% { opacity:1; transform:scale(1.1) }
    80% { opacity:0.7; transform:scale(1.0) }
    100%{ opacity:0; transform:scale(0.9) }
  }

  /* victory */
  .will-wins {
    margin-top: 10px; font-size: 1.2rem; font-weight: 900; letter-spacing: 0.06em;
    background: linear-gradient(90deg, #fb923c, #f87171, #fbbf24);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    opacity: 0; transform: scale(0.2) translateY(10px);
    animation: wWinsIn 0.7s cubic-bezier(0.34,1.56,0.64,1) 8.65s forwards;
  }
  @keyframes wWinsIn { to { opacity:1; transform: scale(1) translateY(0) } }
`

function wSparks(n: number, inner: number, outer: number, stroke: string, w: number) {
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

function kameSparks() {
  const colors = ['#ffffff', '#bae6fd', '#7dd3fc', '#38bdf8']
  return Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2
    const len = i % 3 === 0 ? 60 : i % 3 === 1 ? 44 : 30
    return (
      <line
        key={i}
        x1={KIX + Math.cos(a) * 14} y1={KIY + Math.sin(a) * 14}
        x2={KIX + Math.cos(a) * len} y2={KIY + Math.sin(a) * len}
        stroke={colors[i % 4]} strokeWidth={i % 3 === 0 ? 4 : 2.5}
        strokeLinecap="round"
      />
    )
  })
}

export default function WillJasmineCombat() {
  return (
    <>
      <style>{CSS}</style>
      <div className="wj-overlay">

        {/* screen flash layers */}
        <div className="wsf wsf1" />
        <div className="wsf wsf2" />
        <div className="wsf wsf3" />
        <div className="wsf wsf4" />
        <div className="wsf wsf5" />
        <div className="wsf wsf6" />

        <div className="wj-shout">FIGHT!</div>
        <div className="wj-ko">K.O.!</div>

        <div className="wj-wrap">

          <div className="wj-title">Combat de développeurs</div>

          {/* Health bars */}
          <div className="wj-hb-row">
            <div className="wj-hb-col" style={{ alignItems: 'flex-end' }}>
              <div className="wj-hb-name wj-hb-name-l">Will</div>
              <div className="wj-hb-track"><div className="will-hp" /></div>
            </div>
            <div className="wj-vs">VS</div>
            <div className="wj-hb-col" style={{ alignItems: 'flex-start' }}>
              <div className="wj-hb-name wj-hb-name-r">Jasmine</div>
              <div className="wj-hb-track"><div className="jas-hp" /></div>
            </div>
          </div>

          {/* ARENA SVG */}
          <svg width={500} height={240} style={{ display: 'block', overflow: 'visible' }}>
            <defs>
              <filter id="wglow">
                <feGaussianBlur stdDeviation="3.5" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="wbigGlow">
                <feGaussianBlur stdDeviation="9" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="wkameGlow">
                <feGaussianBlur stdDeviation="7" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <linearGradient id="wkameGrad" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%"   stopColor="#ffffff"  stopOpacity={1} />
                <stop offset="20%"  stopColor="#e0f2fe"  stopOpacity={0.98} />
                <stop offset="55%"  stopColor="#38bdf8"  stopOpacity={0.88} />
                <stop offset="100%" stopColor="#0284c7"  stopOpacity={0.6} />
              </linearGradient>
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
            <line x1={20} y1={155} x2={480} y2={155} stroke="#3b1212" strokeWidth={2} />
            <line x1={20} y1={155} x2={480} y2={155} stroke="#fb923c20" strokeWidth={8} />

            {/* ══ KAMEHAMEHA BEAM (derrière les personnages) ══ */}
            {/* halo externe */}
            <rect
              className="kame-beam-halo"
              x={KBX} y={KBY - 24}
              width={480 - KBX} height={48}
              rx={20}
              fill="#7dd3fc"
              filter="url(#wkameGlow)"
            />
            {/* noyau du rayon */}
            <rect
              className="kame-beam-core"
              x={KBX} y={KBY - 14}
              width={480 - KBX} height={28}
              rx={11}
              fill="url(#wkameGrad)"
              filter="url(#wkameGlow)"
            />

            {/* WILL */}
            <g className="will-g">
              <circle cx={0} cy={-52} r={11} stroke="#fb923c" strokeWidth={2.5} fill="#06090f" />
              <line x1={0} y1={-41} x2={0}   y2={-10} stroke="#fb923c" strokeWidth={2.8} strokeLinecap="round" />
              {/* rear arm */}
              <line x1={0} y1={-31} x2={-20} y2={-14} stroke="#fb923c" strokeWidth={2.5} strokeLinecap="round" />
              {/* right arm – rest */}
              <line className="will-arm-rest"  x1={0} y1={-31} x2={ 22} y2={-14} stroke="#fb923c" strokeWidth={2.5} strokeLinecap="round" />
              {/* right arm – punch */}
              <line className="will-arm-punch" x1={0} y1={-31} x2={ 44} y2={-22} stroke="#fb923c" strokeWidth={2.5} strokeLinecap="round" />
              {/* right leg – kick */}
              <line className="will-arm-kick"  x1={0} y1={-10} x2={ 42} y2={-26} stroke="#fb923c" strokeWidth={2.5} strokeLinecap="round" />
              {/* mains en coupe – charge KAME... */}
              <line className="will-arm-cup"   x1={0} y1={-31} x2={ 22} y2={-8}  stroke="#fb923c" strokeWidth={2.8} strokeLinecap="round" />
              <line className="will-arm-cup"   x1={0} y1={-31} x2={-4}  y2={-8}  stroke="#fb923c" strokeWidth={2.8} strokeLinecap="round" />
              {/* bras tendus en avant – tir HAMEHA! */}
              <line className="will-arm-kame"  x1={0} y1={-31} x2={ 48} y2={-22} stroke="#fb923c" strokeWidth={3.0} strokeLinecap="round" />
              <line className="will-arm-kame"  x1={0} y1={-31} x2={ 46} y2={-30} stroke="#fb923c" strokeWidth={3.0} strokeLinecap="round" />
              {/* victory arm */}
              <line className="will-arm-vic"   x1={0} y1={-31} x2={-26} y2={-58} stroke="#fb923c" strokeWidth={2.5} strokeLinecap="round" />
              {/* left leg */}
              <line x1={0} y1={-10} x2={-15} y2={22} stroke="#fb923c" strokeWidth={2.5} strokeLinecap="round" />
              {/* right leg */}
              <line className="will-leg-r" x1={0} y1={-10} x2={16} y2={22} stroke="#fb923c" strokeWidth={2.5} strokeLinecap="round" />
              {/* aura de charge Kamehameha */}
              <circle className="kame-aura" cx={0} cy={-30} r={36} fill="none" stroke="#7dd3fc" strokeWidth={3} />
              <circle className="kame-aura" cx={0} cy={-30} r={22} fill="#bae6fd" />
            </g>

            {/* JASMINE */}
            <g className="jas-g">
              <circle cx={0} cy={-52} r={11} stroke="#c084fc" strokeWidth={2.5} fill="#06090f" />
              <line x1={0} y1={-41} x2={0}  y2={-10} stroke="#c084fc" strokeWidth={2.8} strokeLinecap="round" />
              {/* rear arm */}
              <line x1={0} y1={-31} x2={20} y2={-14} stroke="#c084fc" strokeWidth={2.5} strokeLinecap="round" />
              {/* left arm – rest */}
              <line className="jas-arm-rest"  x1={0} y1={-31} x2={-22} y2={-14} stroke="#c084fc" strokeWidth={2.5} strokeLinecap="round" />
              {/* left arm – punch */}
              <line className="jas-arm-punch" x1={0} y1={-31} x2={-42} y2={-24} stroke="#c084fc" strokeWidth={2.5} strokeLinecap="round" />
              {/* legs */}
              <line x1={0} y1={-10} x2={ 15} y2={22} stroke="#c084fc" strokeWidth={2.5} strokeLinecap="round" />
              <line x1={0} y1={-10} x2={-16} y2={22} stroke="#c084fc" strokeWidth={2.5} strokeLinecap="round" />
            </g>

            {/* HIT EFFECTS (coups normaux au centre) */}
            <circle className="wflash wf1" cx={HX} cy={HY} r={14} fill="#ffffffbb" filter="url(#wglow)" />
            <circle className="wflash wf2" cx={HX} cy={HY} r={14} fill="#fb923caa" filter="url(#wglow)" />
            <circle className="wflash wf3" cx={HX} cy={HY} r={22} fill="#fbbf24cc" filter="url(#wglow)" />
            <circle className="wflash wf4" cx={HX} cy={HY} r={14} fill="#ffffffbb" filter="url(#wglow)" />
            <circle className="wflash wf5" cx={HX} cy={HY} r={19} fill="#c084fcbb" filter="url(#wglow)" />
            {/* impact du Kamehameha sur Jasmine */}
            <circle className="wflash wf6" cx={KIX} cy={KIY} r={42} fill="#bae6fdcc" filter="url(#wbigGlow)" />

            <g className="wspark wsp1">{wSparks(5, 14, 30, '#facc15', 2.5)}</g>
            <g className="wspark wsp2">{wSparks(5, 14, 30, '#fb923c', 2.5)}</g>
            <g className="wspark wsp3">{wSparks(8, 14, 36, '#fbbf24', 3)}</g>
            <g className="wspark wsp4">{wSparks(5, 14, 30, '#facc15', 2.5)}</g>
            <g className="wspark wsp5">{wSparks(6, 14, 30, '#c084fc', 2.5)}</g>
            {/* étincelles bleu/blanc à l'impact Kamehameha */}
            <g className="wspark wsp6">{kameSparks()}</g>

            {/* hit text labels */}
            {([
              ['wht1', '#facc15', 14, 'CRACK!'],
              ['wht2', '#fb923c', 14, 'POW!'],
              ['wht3', '#fbbf24', 19, 'SMASH!'],
              ['wht4', '#f87171', 14, 'BANG!'],
              ['wht5', '#c084fc', 16, 'KI-YA!'],
            ] as const).map(([cls, fill, size, label]) => (
              <text
                key={cls}
                className={`whtxt ${cls}`}
                x={HX} y={HY - 22}
                textAnchor="middle"
                fill={fill}
                stroke="#000" strokeWidth={1.5} paintOrder="stroke"
                fontSize={size} fontWeight={900} fontFamily="monospace"
              >
                {label}
              </text>
            ))}

            {/* KAME... texte de charge (au-dessus de Will) */}
            <text
              className="whtxt wht-kame"
              x={100} y={55}
              textAnchor="middle"
              fill="#bae6fd"
              stroke="#0ea5e9" strokeWidth={1} paintOrder="stroke"
              fontSize={13} fontWeight={900} fontFamily="monospace"
            >
              KAME...
            </text>

            {/* KAMEHAMEHA!! texte de tir */}
            <text
              className="whtxt wht6"
              x={250} y={48}
              textAnchor="middle"
              fill="#7dd3fc"
              stroke="#000" strokeWidth={2} paintOrder="stroke"
              fontSize={22} fontWeight={900} fontFamily="monospace"
            >
              KAMEHAMEHA!!
            </text>
          </svg>

          <div className="will-wins">Will gagne ! 🏆</div>
        </div>
      </div>
    </>
  )
}
