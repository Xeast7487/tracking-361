'use client'

import { useEffect, useState } from 'react'

const FIGHT_CSS = `
  .fight-overlay {
    position: fixed;
    inset: 0;
    background: #0f172a;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    animation: fightFadeOut 0.4s ease-in 9.1s forwards;
  }
  @keyframes fightFadeOut { to { opacity: 0; pointer-events: none; } }

  /* ── Mia body (left fighter, faces right) ── */
  .mia-g {
    transform-box: fill-box;
    transform-origin: 50% 80%;
    animation: miaBody 9s ease-in-out forwards;
  }
  @keyframes miaBody {
    0%        { transform: translate(100px, 130px); }
    5%        { transform: translate(100px, 130px); }
    14%       { transform: translate(130px, 130px) rotate(-9deg); }
    19%       { transform: translate(100px, 130px) rotate(0deg); }
    31%       { transform: translate(77px,  130px) rotate(7deg); }
    36%       { transform: translate(100px, 130px) rotate(0deg); }
    47%       { transform: translate(128px, 130px) rotate(-12deg); }
    52%       { transform: translate(100px, 130px) rotate(0deg); }
    62%       { transform: translate(73px,  130px) rotate(10deg); }
    67%       { transform: translate(100px, 130px) rotate(0deg); }
    74%       { transform: translate(124px, 130px) rotate(-10deg); }
    79%       { transform: translate(100px, 130px) rotate(0deg); }
    87%       { transform: translate(142px, 130px) rotate(-18deg); }
    92%       { transform: translate(100px, 130px) rotate(0deg); }
    100%      { transform: translate(100px, 130px) rotate(0deg); }
  }

  /* ── EC body (right fighter, faces left) ── */
  .ec-g {
    transform-box: fill-box;
    transform-origin: 50% 80%;
    animation: ecBody 9s ease-in-out forwards;
  }
  @keyframes ecBody {
    0%        { transform: translate(300px, 130px); }
    5%        { transform: translate(300px, 130px); }
    14%       { transform: translate(322px, 130px) rotate(9deg); }
    19%       { transform: translate(300px, 130px) rotate(0deg); }
    27%       { transform: translate(272px, 130px) rotate(-8deg); }
    32%       { transform: translate(300px, 130px) rotate(0deg); }
    47%       { transform: translate(330px, 130px) rotate(13deg); }
    52%       { transform: translate(300px, 130px) rotate(0deg); }
    59%       { transform: translate(274px, 130px) rotate(-6deg); }
    64%       { transform: translate(300px, 130px) rotate(0deg); }
    74%       { transform: translate(320px, 130px) rotate(10deg); }
    79%       { transform: translate(307px, 130px) rotate(4deg); }
    87%       { transform: translate(333px, 130px) rotate(22deg); }
    91%       { transform: translate(345px, 140px) rotate(50deg); }
    96%       { transform: translate(358px, 162px) rotate(88deg); }
    100%      { transform: translate(358px, 162px) rotate(88deg); }
  }

  /* ── Mia arms ── */
  .mia-arm-rest { animation: miaArmR 9s linear forwards; }
  @keyframes miaArmR {
    0%,12%    { opacity: 1; }
    15%,18%   { opacity: 0; }
    20%,45%   { opacity: 1; }
    48%,51%   { opacity: 0; }
    53%,72%   { opacity: 1; }
    75%,78%   { opacity: 0; }
    80%,85%   { opacity: 1; }
    88%,91%   { opacity: 0; }
    93%,100%  { opacity: 0; }
  }
  .mia-arm-punch { animation: miaArmP 9s linear forwards; }
  @keyframes miaArmP {
    0%,12%    { opacity: 0; }
    15%,18%   { opacity: 1; }
    20%,45%   { opacity: 0; }
    48%,51%   { opacity: 1; }
    53%,72%   { opacity: 0; }
    75%,78%   { opacity: 1; }
    80%,85%   { opacity: 0; }
    88%,91%   { opacity: 1; }
    93%,100%  { opacity: 0; }
  }
  .mia-arm-victory { animation: miaArmV 9s linear forwards; }
  @keyframes miaArmV {
    0%,92%    { opacity: 0; }
    95%,100%  { opacity: 1; }
  }

  /* ── EC arms ── */
  .ec-arm-rest { animation: ecArmR 9s linear forwards; }
  @keyframes ecArmR {
    0%,25%    { opacity: 1; }
    28%,31%   { opacity: 0; }
    33%,57%   { opacity: 1; }
    60%,63%   { opacity: 0; }
    65%,100%  { opacity: 1; }
  }
  .ec-arm-punch { animation: ecArmP 9s linear forwards; }
  @keyframes ecArmP {
    0%,25%    { opacity: 0; }
    28%,31%   { opacity: 1; }
    33%,57%   { opacity: 0; }
    60%,63%   { opacity: 1; }
    65%,100%  { opacity: 0; }
  }

  /* ── Hit flashes ── */
  .flash { opacity: 0; }
  .f1 { animation: fPop 0.3s 1.26s ease-out forwards; }
  .f2 { animation: fPop 0.3s 2.43s ease-out forwards; }
  .f3 { animation: fPop 0.3s 4.23s ease-out forwards; }
  .f4 { animation: fPop 0.3s 5.31s ease-out forwards; }
  .f5 { animation: fBig 0.55s 7.83s ease-out forwards; }
  .f5-star { opacity: 0; animation: fBig 0.55s 7.83s ease-out forwards; }
  @keyframes fPop {
    0%   { opacity: 0; }
    30%  { opacity: 1; }
    100% { opacity: 0; }
  }
  @keyframes fBig {
    0%   { opacity: 0; }
    25%  { opacity: 1; }
    100% { opacity: 0; }
  }

  /* ── Health bars ── */
  .mia-hp {
    width: 80px;
    animation: miaHpAnim 9s linear forwards;
  }
  @keyframes miaHpAnim {
    0%,30%    { width: 80px; }
    37%       { width: 66px; }
    61%,66%   { width: 66px; }
    70%       { width: 50px; }
    100%      { width: 50px; }
  }
  .ec-hp {
    width: 80px;
    animation: ecHpAnim 9s linear forwards;
  }
  @keyframes ecHpAnim {
    0%,12%    { width: 80px; }
    20%       { width: 62px; }
    46%,52%   { width: 62px; }
    56%       { width: 38px; }
    73%,80%   { width: 38px; }
    84%       { width: 14px; }
    90%,94%   { width: 14px; }
    97%,100%  { width: 0px; }
  }

  /* ── Victory ── */
  .mia-wins {
    margin-top: 12px;
    font-size: 1.25rem;
    font-weight: 900;
    letter-spacing: 0.03em;
    background: linear-gradient(90deg, #38bdf8, #a78bfa, #fb7185);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    opacity: 0;
    transform: scale(0.2) translateY(8px);
    animation: winsAppear 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 8.6s forwards;
  }
  @keyframes winsAppear {
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
`

export default function ExplosionLoader() {
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setGone(true), 9600)
    return () => clearTimeout(t)
  }, [])

  if (gone) return null

  return (
    <>
      <style>{FIGHT_CSS}</style>
      <div className="fight-overlay">
        {/* Subtitle */}
        <div style={{
          fontSize: '0.55rem',
          letterSpacing: '0.22em',
          color: '#334155',
          marginBottom: 10,
          textTransform: 'uppercase',
          fontWeight: 700,
        }}>
          Combat de développeurs
        </div>

        {/* Health bars */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 4, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.6rem', color: '#38bdf8', fontWeight: 700, textAlign: 'right', marginBottom: 3 }}>
              Mia
            </div>
            <div style={{ height: 5, width: 80, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
              <div className="mia-hp" style={{ height: '100%', background: 'linear-gradient(90deg, #38bdf8, #0ea5e9)', borderRadius: 3 }} />
            </div>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#1e3a5f', fontWeight: 900 }}>VS</div>
          <div>
            <div style={{ fontSize: '0.6rem', color: '#f87171', fontWeight: 700, textAlign: 'left', marginBottom: 3 }}>
              Espace Clef
            </div>
            <div style={{ height: 5, width: 80, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
              <div className="ec-hp" style={{ height: '100%', background: 'linear-gradient(90deg, #f87171, #ef4444)', borderRadius: 3 }} />
            </div>
          </div>
        </div>

        {/* Fight arena */}
        <svg width={400} height={200} style={{ display: 'block', overflow: 'visible' }}>
          {/* Ground */}
          <line x1={10} y1={155} x2={390} y2={155} stroke="#1e293b" strokeWidth={1.5} />

          {/* ── MIA (faces right) ── */}
          <g className="mia-g">
            {/* Head */}
            <circle cx={0} cy={-50} r={10} stroke="#38bdf8" strokeWidth={2.5} fill="#0f172a" />
            {/* Body */}
            <line x1={0} y1={-40} x2={0} y2={-10} stroke="#38bdf8" strokeWidth={2.5} strokeLinecap="round" />
            {/* Left arm (rear) */}
            <line x1={0} y1={-28} x2={-18} y2={-14} stroke="#38bdf8" strokeWidth={2.5} strokeLinecap="round" />
            {/* Right arm — at rest */}
            <line className="mia-arm-rest" x1={0} y1={-28} x2={20} y2={-14} stroke="#38bdf8" strokeWidth={2.5} strokeLinecap="round" />
            {/* Right arm — punch extended */}
            <line className="mia-arm-punch" x1={0} y1={-28} x2={36} y2={-22} stroke="#38bdf8" strokeWidth={2.5} strokeLinecap="round" />
            {/* Left arm — victory raised */}
            <line className="mia-arm-victory" x1={0} y1={-28} x2={-22} y2={-54} stroke="#38bdf8" strokeWidth={2.5} strokeLinecap="round" />
            {/* Legs */}
            <line x1={0} y1={-10} x2={-13} y2={20} stroke="#38bdf8" strokeWidth={2.5} strokeLinecap="round" />
            <line x1={0} y1={-10} x2={14} y2={20} stroke="#38bdf8" strokeWidth={2.5} strokeLinecap="round" />
          </g>

          {/* ── ESPACE CLEF (faces left) ── */}
          <g className="ec-g">
            {/* Head */}
            <circle cx={0} cy={-50} r={10} stroke="#f87171" strokeWidth={2.5} fill="#0f172a" />
            {/* Body */}
            <line x1={0} y1={-40} x2={0} y2={-10} stroke="#f87171" strokeWidth={2.5} strokeLinecap="round" />
            {/* Right arm (rear) */}
            <line x1={0} y1={-28} x2={18} y2={-14} stroke="#f87171" strokeWidth={2.5} strokeLinecap="round" />
            {/* Left arm — at rest (toward Mia) */}
            <line className="ec-arm-rest" x1={0} y1={-28} x2={-20} y2={-14} stroke="#f87171" strokeWidth={2.5} strokeLinecap="round" />
            {/* Left arm — punch extended toward Mia */}
            <line className="ec-arm-punch" x1={0} y1={-28} x2={-36} y2={-22} stroke="#f87171" strokeWidth={2.5} strokeLinecap="round" />
            {/* Legs */}
            <line x1={0} y1={-10} x2={13} y2={20} stroke="#f87171" strokeWidth={2.5} strokeLinecap="round" />
            <line x1={0} y1={-10} x2={-14} y2={20} stroke="#f87171" strokeWidth={2.5} strokeLinecap="round" />
          </g>

          {/* ── Hit flashes at midpoint ── */}
          <circle className="flash f1" cx={200} cy={85} r={13} fill="#ffffffaa" />
          <circle className="flash f2" cx={200} cy={85} r={13} fill="#ffffffaa" />
          <circle className="flash f3" cx={200} cy={85} r={13} fill="#fbbf2488" />
          <circle className="flash f4" cx={200} cy={85} r={13} fill="#ffffffaa" />
          <circle className="flash f5" cx={200} cy={85} r={22} fill="#ffffffcc" />
          {/* Star burst for final hit */}
          <g className="f5-star">
            <line x1={200} y1={63} x2={200} y2={107} stroke="#f59e0b" strokeWidth={3} strokeLinecap="round" />
            <line x1={178} y1={85} x2={222} y2={85} stroke="#f59e0b" strokeWidth={3} strokeLinecap="round" />
            <line x1={185} y1={70} x2={215} y2={100} stroke="#f59e0b" strokeWidth={3} strokeLinecap="round" />
            <line x1={215} y1={70} x2={185} y2={100} stroke="#f59e0b" strokeWidth={3} strokeLinecap="round" />
          </g>
        </svg>

        {/* Victory message */}
        <div className="mia-wins">Mia gagne ! 🏆</div>
      </div>
    </>
  )
}
