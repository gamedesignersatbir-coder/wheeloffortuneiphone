// Wheel of Fortune — casino-style spinner
// 12 sections, sun button center, triangle pointer top

// Richer 2-tone palette — deep burgundy + warm gold
const C_DARK = '#8E0E20';
const C_DARK_GRAD = '#5A0612';
const C_GOLD = '#F5C24A';
const C_GOLD_DEEP = '#C88A14';

const PRIZES = [
  { label: '100',    dark: true  },
  { label: '500',    dark: false },
  { label: '50',     dark: true  },
  { label: '1000',   dark: false },
  { label: '200',    dark: true  },
  { label: '75',     dark: false },
  { label: '300',    dark: true  },
  { label: '25',     dark: false },
  { label: '5000',   dark: true  },
  { label: '150',    dark: false },
  { label: '400',    dark: true  },
  { label: '10',     dark: false },
];

const N = PRIZES.length;           // 12
const SEG = 360 / N;               // 30
const R_OUTER = 155;               // wheel radius in svg units
const R_RIM = 170;                 // outer rim
const CX = 200, CY = 200;          // svg center

// Build a single pie slice path
function slicePath(i) {
  const a0 = -90 + i * SEG - SEG / 2;     // start (top-centered on slice 0)
  const a1 = a0 + SEG;
  const toRad = (a) => (a * Math.PI) / 180;
  const x0 = CX + R_OUTER * Math.cos(toRad(a0));
  const y0 = CY + R_OUTER * Math.sin(toRad(a0));
  const x1 = CX + R_OUTER * Math.cos(toRad(a1));
  const y1 = CY + R_OUTER * Math.sin(toRad(a1));
  return `M ${CX} ${CY} L ${x0} ${y0} A ${R_OUTER} ${R_OUTER} 0 0 1 ${x1} ${y1} Z`;
}

// Decorative studs around rim — alternating bulb colors, on the gold bevel
function Studs() {
  const studs = [];
  const COUNT = 24;
  const rStud = R_RIM + 10; // sit on the bevel ring
  for (let i = 0; i < COUNT; i++) {
    const a = (i / COUNT) * 2 * Math.PI - Math.PI / 2;
    const x = CX + rStud * Math.cos(a);
    const y = CY + rStud * Math.sin(a);
    const alt = i % 2 === 0;
    studs.push(
      <g key={i}>
        {/* socket */}
        <circle cx={x} cy={y} r={4.2} fill="#3A2200" opacity="0.6"/>
        {/* bulb */}
        <circle cx={x} cy={y} r={3.2} fill={alt ? '#FFF3C4' : '#FFD447'} stroke="#8A5A00" strokeWidth="0.5"/>
        {/* highlight */}
        <circle cx={x - 0.8} cy={y - 0.8} r={1} fill="#FFFFFF" opacity="0.7"/>
      </g>
    );
  }
  return <g>{studs}</g>;
}

// Sun logo slot — drops in assets/logo-sun.png if present, else renders an
// original friendly cartoon sun. Replace the image file to swap in the brand logo.
function SunLogo({ winking, spinning }) {
  const [hasImg, setHasImg] = React.useState(true);
  const openSrc = (typeof window !== 'undefined' && window.SUN_LOGO_DATA_URL) || "assets/logo-sun.png";
  const winkSrc = (typeof window !== 'undefined' && window.SUN_LOGO_WINK_DATA_URL) || "assets/logo-sun-wink.png";
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {hasImg && (
        <>
          {/* GHOST LAYER — always rendered at opacity 1. Carries the sunGlow
              drop-shadow animation. Because this element's alpha mask NEVER
              changes (no opacity toggle), its drop-shadow is computed exactly
              once per keyframe tick — the wink overlay fading in/out on top
              does not repaint this layer, so the glow can't strobe. */}
          <img
            src={openSrc}
            alt="Sun logo"
            onError={() => setHasImg(false)}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'contain',
              pointerEvents: 'none',
              animation: spinning ? 'sunGlow 1.1s infinite alternate' : 'none',
            }}
          />
          {/* WINK OVERLAY — same silhouette as the ghost, so it fully occludes
              the ghost's face area when visible. No filter; the glow comes
              entirely from the ghost underneath, which extends past the
              silhouette and is visible around both frames. */}
          <img
            src={winkSrc}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'contain',
              pointerEvents: 'none',
              opacity: winking ? 1 : 0,
              transition: 'opacity 0.05s linear',
            }}
          />
        </>
      )}
      {!hasImg && <SunFace winking={winking}/>}
    </div>
  );
}

// Fallback original cartoon sun — used only if the logo image fails to load
function SunFace({ winking }) {
  // Build spiky triangular rays of alternating lengths for a lively silhouette
  const rays = [];
  const RAY_COUNT = 20;
  const R_BASE = 46;                 // face edge
  const R_TIP_A = 84;                // long ray tip
  const R_TIP_B = 72;                // short ray tip
  const baseHalf = (2 * Math.PI / RAY_COUNT) * 0.42; // half width of ray base

  for (let i = 0; i < RAY_COUNT; i++) {
    const aMid = (i / RAY_COUNT) * 2 * Math.PI - Math.PI / 2; // start pointing up
    const rTip = i % 2 === 0 ? R_TIP_A : R_TIP_B;
    const a0 = aMid - baseHalf;
    const a1 = aMid + baseHalf;
    const x0 = 100 + R_BASE * Math.cos(a0);
    const y0 = 100 + R_BASE * Math.sin(a0);
    const x1 = 100 + rTip * Math.cos(aMid);
    const y1 = 100 + rTip * Math.sin(aMid);
    const x2 = 100 + R_BASE * Math.cos(a1);
    const y2 = 100 + R_BASE * Math.sin(a1);
    rays.push(
      <path
        key={i}
        d={`M ${x0} ${y0} L ${x1} ${y1} L ${x2} ${y2} Z`}
        fill="url(#rayGrad)"
        stroke="#B8860B"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    );
  }

  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="rayGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF3C4"/>
          <stop offset="45%" stopColor="#FFD447"/>
          <stop offset="100%" stopColor="#E89A1F"/>
        </linearGradient>
        <radialGradient id="faceGrad" cx="0.4" cy="0.35" r="0.8">
          <stop offset="0%" stopColor="#FFF8D8"/>
          <stop offset="55%" stopColor="#FFD447"/>
          <stop offset="100%" stopColor="#E89A1F"/>
        </radialGradient>
      </defs>

      {/* rays behind */}
      <g>{rays}</g>

      {/* face disc */}
      <circle cx="100" cy="100" r="47" fill="url(#faceGrad)" stroke="#B8860B" strokeWidth="2"/>
      {/* inner highlight arc */}
      <path d="M 72 82 Q 100 64 128 82" stroke="#FFF8D8" strokeWidth="2" fill="none" opacity="0.55" strokeLinecap="round"/>

      {/* eyes — oval whites + dark pupils with shine */}
      {winking ? (
        <>
          {/* left eye winks */}
          <path d="M 78 92 Q 87 87 96 92" stroke="#2A1800" strokeWidth="3" fill="none" strokeLinecap="round"/>
          {/* right eye open */}
          <ellipse cx="115" cy="92" rx="6" ry="7.5" fill="#FFFFFF" stroke="#2A1800" strokeWidth="1.4"/>
          <ellipse cx="116" cy="93" rx="3.2" ry="4.2" fill="#2A1800"/>
          <circle cx="117" cy="91" r="1.3" fill="#FFFFFF"/>
        </>
      ) : (
        <>
          <ellipse cx="85" cy="92" rx="6" ry="7.5" fill="#FFFFFF" stroke="#2A1800" strokeWidth="1.4"/>
          <ellipse cx="86" cy="93" rx="3.2" ry="4.2" fill="#2A1800"/>
          <circle cx="87" cy="91" r="1.3" fill="#FFFFFF"/>
          <ellipse cx="115" cy="92" rx="6" ry="7.5" fill="#FFFFFF" stroke="#2A1800" strokeWidth="1.4"/>
          <ellipse cx="116" cy="93" rx="3.2" ry="4.2" fill="#2A1800"/>
          <circle cx="117" cy="91" r="1.3" fill="#FFFFFF"/>
        </>
      )}

      {/* nose — small round */}
      <ellipse cx="100" cy="104" rx="3.5" ry="4" fill="#E89A1F" opacity="0.7"/>

      {/* smile — big happy curve */}
      <path d="M 78 110 Q 100 132 122 110" stroke="#2A1800" strokeWidth="3" fill="#8A1A0A" strokeLinejoin="round" strokeLinecap="round"/>
      {/* tongue/teeth suggestion */}
      <path d="M 82 112 Q 100 124 118 112 Q 100 118 82 112 Z" fill="#E89A1F" opacity="0.4"/>

      {/* cheeks */}
      <ellipse cx="76" cy="110" rx="5" ry="3" fill="#FF7A5A" opacity="0.5"/>
      <ellipse cx="124" cy="110" rx="5" ry="3" fill="#FF7A5A" opacity="0.5"/>
    </svg>
  );
}

const Wheel = React.memo(function Wheel({ rotation, spinning }) {
  return (
    <svg viewBox="0 0 400 400" width="100%" height="100%" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        {/* Outer bevel rim — gold with highlight top + shadow bottom */}
        <linearGradient id="bevelGrad" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#FFF3C4"/>
          <stop offset="35%" stopColor="#F5C24A"/>
          <stop offset="65%" stopColor="#C88A14"/>
          <stop offset="100%" stopColor="#6A4100"/>
        </linearGradient>
        <linearGradient id="bevelInnerGrad" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#6A4100"/>
          <stop offset="50%" stopColor="#C88A14"/>
          <stop offset="100%" stopColor="#FFF3C4"/>
        </linearGradient>
        <radialGradient id="hubGrad" cx="0.4" cy="0.35" r="0.75">
          <stop offset="0%" stopColor="#FFF3C4"/>
          <stop offset="55%" stopColor="#F5C24A"/>
          <stop offset="100%" stopColor="#8A5A00"/>
        </radialGradient>
        {/* Slice gradients — subtle radial darkening toward edge */}
        <radialGradient id="darkSliceGrad" cx="0.5" cy="0.5" r="0.7">
          <stop offset="0%" stopColor={C_DARK}/>
          <stop offset="100%" stopColor={C_DARK_GRAD}/>
        </radialGradient>
        <radialGradient id="goldSliceGrad" cx="0.5" cy="0.5" r="0.7">
          <stop offset="0%" stopColor={C_GOLD}/>
          <stop offset="100%" stopColor={C_GOLD_DEEP}/>
        </radialGradient>
        {/* Inner glow filter for the slices */}
        <filter id="innerShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dy="2"/>
          <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1"/>
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0"/>
          <feComposite in2="SourceGraphic" operator="in"/>
          <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode/></feMerge>
        </filter>
      </defs>

      {/* OUTER BEVEL RING — thick polished gold frame */}
      <circle cx={CX} cy={CY} r={R_RIM + 18} fill="url(#bevelGrad)" stroke="#3A2200" strokeWidth="1"/>
      {/* rim channel (darker groove) */}
      <circle cx={CX} cy={CY} r={R_RIM + 6} fill="none" stroke="#3A2200" strokeWidth="2" opacity="0.5"/>
      {/* inner bevel — reversed gradient for depth */}
      <circle cx={CX} cy={CY} r={R_RIM + 2} fill="url(#bevelInnerGrad)"/>
      {/* studs on the gold ring — do NOT rotate */}
      <Studs/>

      {/* rotating group */}
      <g style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: `${CX}px ${CY}px`,
        transition: spinning
          ? 'transform 5.2s cubic-bezier(0.17, 0.67, 0.16, 1.0)'
          : 'none',
      }}>
        {/* slices */}
        {PRIZES.map((p, i) => (
          <path
            key={i}
            d={slicePath(i)}
            fill={p.dark ? 'url(#darkSliceGrad)' : 'url(#goldSliceGrad)'}
            stroke={C_GOLD}
            strokeWidth="1.8"
          />
        ))}

        {/* gold hairline divider over each slice edge for crispness */}
        {PRIZES.map((_, i) => {
          const a = -90 + i * SEG - SEG / 2;
          const rad = (a * Math.PI) / 180;
          const x1 = CX + R_OUTER * Math.cos(rad);
          const y1 = CY + R_OUTER * Math.sin(rad);
          return (
            <line key={'s'+i} x1={CX} y1={CY} x2={x1} y2={y1}
                  stroke="#FFF3C4" strokeWidth="0.6" opacity="0.5"/>
          );
        })}

        {/* prize labels */}
        {PRIZES.map((p, i) => {
          const angle = i * SEG;
          const rLabel = 118;
          const rad = ((angle - 90) * Math.PI) / 180;
          const x = CX + rLabel * Math.cos(rad);
          const y = CY + rLabel * Math.sin(rad);
          const textColor = p.dark ? '#FFF3C4' : '#3A0A0A';
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${angle})`}>
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="'Playfair Display', Georgia, serif"
                fontSize={p.label.length > 3 ? 20 : 24}
                fontWeight="900"
                fill={textColor}
                style={{ letterSpacing: 1, paintOrder: 'stroke fill' }}
                stroke={p.dark ? 'rgba(90,0,0,0.6)' : 'rgba(90,58,0,0.4)'}
                strokeWidth="0.6"
              >
                {p.label}
              </text>
            </g>
          );
        })}

        {/* inner gold hub ring */}
        <circle cx={CX} cy={CY} r="74" fill="url(#hubGrad)" stroke="#3A2200" strokeWidth="1.2"/>
        <circle cx={CX} cy={CY} r="68" fill="none" stroke="#3A2200" strokeWidth="1" opacity="0.35"/>
        {/* dark recess where sun sits */}
        <circle cx={CX} cy={CY} r="62" fill={C_DARK_GRAD} stroke={C_GOLD} strokeWidth="2"/>
        <circle cx={CX} cy={CY} r="62" fill="url(#darkSliceGrad)" opacity="0.8"/>
      </g>
    </svg>
  );
});

// Reactive pointer — wobble is driven by the current tick index
const Pointer = React.memo(function Pointer({ tick }) {
  // `tick` flips 0/1 every time a new slice passes under the pointer
  return (
    <div style={{
      transformOrigin: '50% 6px',
      transform: tick ? 'rotate(-14deg)' : 'rotate(0deg)',
      transition: tick
        ? 'transform 0.08s cubic-bezier(.3,1.8,.5,1)'
        : 'transform 0.35s cubic-bezier(.34,1.56,.64,1)',
      display: 'block',
    }}>
      <svg viewBox="0 0 60 72" width="46" height="56" style={{ display: 'block', filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.5))' }}>
        <defs>
          <linearGradient id="ptrGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF3C4"/>
            <stop offset="45%" stopColor="#FFD447"/>
            <stop offset="100%" stopColor="#B8860B"/>
          </linearGradient>
        </defs>
        {/* pivot point at top */}
        <circle cx="30" cy="6" r="5" fill="#B8860B" stroke="#5A3A00" strokeWidth="1"/>
        {/* triangle pointer facing down */}
        <path d="M 30 66 L 6 12 Q 30 2 54 12 Z" fill="url(#ptrGrad)" stroke="#5A3A00" strokeWidth="1.6" strokeLinejoin="round"/>
        <circle cx="30" cy="18" r="3" fill="#7A0A0A"/>
      </svg>
    </div>
  );
});

// ── Audio engine ─ synthesized with WebAudio, no assets needed ────
const audio = (() => {
  let ctx = null;
  let muted = false;
  const ensure = () => {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  const tick = () => {
    if (muted) return;
    const c = ensure(); if (!c) return;
    const t = c.currentTime;
    // Soft wooden "click": short sine pluck, low volume, quick decay
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(340, t + 0.035);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.045, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.connect(gain).connect(c.destination);
    osc.start(t); osc.stop(t + 0.06);
  };
  const whoosh = () => {
    if (muted) return;
    const c = ensure(); if (!c) return;
    const t = c.currentTime;
    const dur = 0.9;
    // pink-ish noise buffer
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
    const src = c.createBufferSource(); src.buffer = buf;
    const filt = c.createBiquadFilter(); filt.type = 'bandpass';
    filt.frequency.setValueAtTime(300, t);
    filt.frequency.exponentialRampToValueAtTime(2400, t + dur * 0.7);
    filt.Q.value = 2;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.55, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filt).connect(gain).connect(c.destination);
    src.start(t); src.stop(t + dur);
  };
  const win = () => {
    if (muted) return;
    const c = ensure(); if (!c) return;
    const t0 = c.currentTime;
    // ascending major arpeggio + chord
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((f, i) => {
      const t = t0 + i * 0.08;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(gain).connect(c.destination);
      osc.start(t); osc.stop(t + 0.55);
    });
    // shimmer tail
    const shimmer = c.createOscillator();
    const sGain = c.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(2093, t0 + 0.4);
    sGain.gain.setValueAtTime(0.0001, t0 + 0.4);
    sGain.gain.exponentialRampToValueAtTime(0.12, t0 + 0.45);
    sGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.1);
    shimmer.connect(sGain).connect(c.destination);
    shimmer.start(t0 + 0.4); shimmer.stop(t0 + 1.15);
  };
  // Casino-style looping arpeggio — bright, bouncy I–V–vi–IV progression in
  // C major. Triangle-wave plucks with fast attack + decay over a soft
  // triangle bass on each downbeat. Scheduled bar-by-bar via setTimeout.
  let ambientState = null;
  const startAmbient = () => {
    if (ambientState) return;
    const c = ensure(); if (!c) return;
    const master = c.createGain();
    master.gain.value = muted ? 0 : 0.08;
    master.connect(c.destination);
    // C - G - Am - F (I V vi IV). Each row is 8 sixteenth-note pitches making
    // a simple up-down arpeggio of the chord with a small ornament on the last.
    const bars = [
      [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 523.25, 659.25], // C
      [493.88, 587.33, 783.99,  987.77, 783.99, 587.33, 493.88, 587.33], // G (B D G B)
      [440.00, 523.25, 659.25,  880.00, 659.25, 523.25, 440.00, 523.25], // Am
      [349.23, 523.25, 698.46,  880.00, 698.46, 523.25, 349.23, 523.25], // F
    ];
    const bass = [130.81, 98.00, 110.00, 87.31]; // C2, G2, A2, F2
    const NOTE = 0.14; // seconds per sixteenth (≈ 107 BPM)
    const BAR = NOTE * 8;
    let barIdx = 0;
    const scheduleBar = () => {
      if (!ambientState) return;
      const t0 = c.currentTime + 0.02;
      const pat = bars[barIdx % bars.length];
      const bFreq = bass[barIdx % bass.length];
      // bass on downbeat, long soft decay
      const bOsc = c.createOscillator();
      const bGain = c.createGain();
      bOsc.type = 'triangle';
      bOsc.frequency.value = bFreq;
      bGain.gain.setValueAtTime(0.0001, t0);
      bGain.gain.exponentialRampToValueAtTime(0.28, t0 + 0.015);
      bGain.gain.exponentialRampToValueAtTime(0.05, t0 + BAR * 0.4);
      bGain.gain.exponentialRampToValueAtTime(0.0001, t0 + BAR);
      bOsc.connect(bGain).connect(master);
      bOsc.start(t0); bOsc.stop(t0 + BAR + 0.05);
      // arpeggio plucks
      pat.forEach((f, i) => {
        const t = t0 + i * NOTE;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'triangle';
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.22, t + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + NOTE * 0.85);
        osc.connect(gain).connect(master);
        osc.start(t); osc.stop(t + NOTE + 0.02);
      });
      barIdx++;
      ambientState.timer = setTimeout(scheduleBar, BAR * 1000);
    };
    ambientState = { master, timer: null };
    scheduleBar();
  };
  const stopAmbient = () => {
    if (!ambientState) return;
    const { master, timer } = ambientState;
    clearTimeout(timer);
    const c = ctx;
    if (c) {
      master.gain.cancelScheduledValues(c.currentTime);
      master.gain.setValueAtTime(master.gain.value, c.currentTime);
      master.gain.linearRampToValueAtTime(0.0001, c.currentTime + 0.3);
    }
    ambientState = null;
  };
  const setAmbientVolume = (v) => {
    if (!ambientState || !ctx) return;
    ambientState.master.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
  };
  return {
    tick, whoosh, win,
    setMuted: (m) => {
      muted = m;
      if (ambientState) setAmbientVolume(m ? 0 : 0.08);
    },
    isMuted: () => muted,
    prime: () => ensure(),
    startAmbient, stopAmbient,
  };
})();

// Confetti — two corner cannons (bottom-left, bottom-right) firing upward
// diagonals. Vibrant multi-color palette. Auto-cleans after ~2.4s.
function fireConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:99999';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const W = window.innerWidth, H = window.innerHeight;
  // Vibrant rainbow palette — warm golds mixed with pinks, purples, cyans, greens
  const colors = [
    '#FFD447', '#FFF3C4', '#FF6A1F', '#FF9F1C',   // gold/orange
    '#E63946', '#FF4FB5', '#FF7EB9',              // red/pink
    '#9B5DE5', '#6E44FF', '#4CC9F0',              // purple/blue
    '#00D4FF', '#5AFFD4', '#3EC300', '#A8E10C',   // cyan/green
    '#FFFFFF'                                       // white sparkle
  ];
  const parts = [];
  const addBurst = (ox, oy, angleCenter, count) => {
    for (let i = 0; i < count; i++) {
      const angle = angleCenter + (Math.random() - 0.5) * (Math.PI / 2.8);
      const speed = 14 + Math.random() * 10;
      parts.push({
        x: ox, y: oy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        w: 5 + Math.random() * 7, h: 3 + Math.random() * 6,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.35,
        color: colors[(Math.random() * colors.length) | 0],
        life: 1,
      });
    }
  };
  // Bottom-left cannon shoots up-right (angle ≈ -45°), bottom-right up-left (≈ -135°).
  addBurst(16, H - 12, -Math.PI / 4,       85);
  addBurst(W - 16, H - 12, -3 * Math.PI / 4, 85);
  const start = performance.now();
  const DURATION = 2400;
  function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.vy += 0.32;              // gravity
      p.vx *= 0.993; p.vy *= 0.993; // drag
      p.x += p.vx; p.y += p.vy;
      p.rot += p.vr;
      p.life = Math.max(0, 1 - t / DURATION);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (t < DURATION) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}

function WheelApp() {
  const [rotation, setRotation] = React.useState(0);
  const [spinning, setSpinning] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [winkTick, setWinkTick] = React.useState(false);
  const [balance, setBalance] = React.useState(2500);
  const [displayBalance, setDisplayBalance] = React.useState(2500);
  const [spinsLeft, setSpinsLeft] = React.useState(10);
  const [pointerTick, setPointerTick] = React.useState(false);
  const [muted, setMuted] = React.useState(false);

  // Animated balance counter — tweens displayBalance toward balance on change
  React.useEffect(() => {
    if (displayBalance === balance) return;
    const start = displayBalance;
    const end = balance;
    const duration = 700;
    const t0 = performance.now();
    let raf;
    const step = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplayBalance(Math.round(start + (end - start) * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [balance]);
  const spinStartRef = React.useRef(null);
  const spinDataRef = React.useRef(null);

  React.useEffect(() => { audio.setMuted(muted); }, [muted]);

  // Confetti on win
  React.useEffect(() => { if (result) fireConfetti(); }, [result]);

  // Blink the sun while spinning — toggles rapidly
  React.useEffect(() => {
    if (!spinning) { setWinkTick(false); return; }
    const id = setInterval(() => setWinkTick(w => !w), 220);
    return () => clearInterval(id);
  }, [spinning]);

  // Pointer reactivity — rAF samples eased rotation and flips tick when a new slice crosses the top
  React.useEffect(() => {
    if (!spinning) { setPointerTick(false); return; }
    const DURATION = 5200;
    const ease = (t) => 1 - Math.pow(1 - t, 4);
    let raf;
    let lastSlice = -1;
    const start = performance.now();
    const { from, to } = spinDataRef.current;
    const step = (now) => {
      const t = Math.min(1, (now - start) / DURATION);
      const cur = from + (to - from) * ease(t);
      const slice = Math.floor(((cur % 360) + 360) % 360 / SEG);
      // In the final 8% of the spin, hold the pointer straight so it settles cleanly
      if (t > 0.92) {
        setPointerTick(false);
      } else if (slice !== lastSlice) {
        lastSlice = slice;
        setPointerTick(p => !p);
        audio.tick();
      }
      if (t < 1) raf = requestAnimationFrame(step);
      else setPointerTick(false);
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); setPointerTick(false); };
  }, [spinning]);

  function spin() {
    if (spinning || spinsLeft <= 0) return;
    setResult(null);
    setSpinsLeft(s => s - 1);
    const winning = Math.floor(Math.random() * N);
    // We want (rotation mod 360) such that section `winning` is at top.
    // Section i is centered at angle (i*SEG) clockwise from top (since we rotate group).
    // After rotation R, section i sits at (i*SEG + R) mod 360 from top.
    // We want that == 0 => R ≡ -i*SEG (mod 360).
    const target = (360 - winning * SEG) % 360;
    const turns = 6 + Math.floor(Math.random() * 3); // 6–8 full turns
    const cur = rotation;
    // round current to nearest full turn below, then add turns + target
    const base = Math.floor(cur / 360) * 360;
    const next = base + turns * 360 + target + (cur > base + target ? 360 : 0);
    spinDataRef.current = { from: cur, to: next };
    setRotation(next);
    setSpinning(true);
    audio.startAmbient();   // starts once; subsequent calls no-op
    audio.whoosh();
    setTimeout(() => {
      setSpinning(false);
      const prize = PRIZES[winning];
      setResult(prize);
      setBalance(b => b + parseInt(prize.label, 10));
      audio.win();
    }, 5300);
  }

  const canSpin = !spinning && spinsLeft > 0;

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'radial-gradient(ellipse at 50% 35%, #4A0A0E 0%, #2A0408 55%, #150204 100%)',
      color: '#FFF3C4',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Playfair Display', Georgia, serif",
    }}>
      {/* spin-time ambient brighten — soft radial warm-up, fades in for 0.6s */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 90% 65% at 50% 45%, rgba(255,180,60,0.22), rgba(255,140,40,0.08) 45%, transparent 75%)',
        opacity: spinning ? 1 : 0,
        transition: 'opacity 0.6s ease-out',
        pointerEvents: 'none',
        zIndex: 1,
      }}/>

      {/* decorative bulbs along top */}
      <div style={{
        position: 'absolute', top: 58, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between',
        padding: '0 28px', zIndex: 4,
      }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#FFD447',
            boxShadow: '0 0 8px #FFD447, 0 0 2px #FFF3C4',
            animation: `bulb 1.1s ${i * 0.12}s infinite alternate`,
          }}/>
        ))}
      </div>

      {/* header */}
      <div style={{
        position: 'relative', zIndex: 3,
        paddingTop: 78, paddingBottom: 6,
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 11, letterSpacing: 4, textTransform: 'uppercase',
          color: '#FFD447', opacity: 0.85, marginBottom: 4,
        }}>
          ✦ Golden Hour ✦
        </div>
        <div style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 28, fontWeight: 900, letterSpacing: 2,
          color: '#FFF3C4',
          textShadow: '0 0 12px rgba(255, 212, 71, 0.5), 0 2px 0 #5A0000',
          lineHeight: 1,
        }}>
          WHEEL <span style={{ color: '#FFD447', fontStyle: 'italic', fontWeight: 400 }}>of</span> FORTUNE
        </div>
      </div>

      {/* mute toggle — top-left */}
      <button
        onClick={() => { audio.prime(); setMuted(m => !m); }}
        aria-label={muted ? 'Unmute' : 'Mute'}
        style={{
          position: 'absolute', top: 62, left: 16, zIndex: 20,
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(0,0,0,0.45)',
          border: '1px solid rgba(255,212,71,0.45)',
          color: '#FFD447', fontSize: 16, lineHeight: 1,
          cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {muted ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H3v6h3l5 4V5z" fill="#FFD447"/><path d="M17 9l4 6M21 9l-4 6" stroke="#FFD447" strokeWidth="2" strokeLinecap="round"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H3v6h3l5 4V5z" fill="#FFD447"/><path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" stroke="#FFD447" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
        )}
      </button>

      {/* stats row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        padding: '14px 22px 6px', position: 'relative', zIndex: 3,
        fontFamily: "'Playfair Display', Georgia, serif",
      }}>
        <div style={{
          background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,212,71,0.35)',
          borderRadius: 999, padding: '6px 14px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ color: '#FFD447', fontSize: 14 }}>◆</span>
          <span style={{ fontSize: 11, letterSpacing: 2, opacity: 0.7 }}>BALANCE</span>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#FFD447' }}>{displayBalance.toLocaleString()}</span>
        </div>
        <div style={{
          background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,212,71,0.35)',
          borderRadius: 999, padding: '6px 14px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 11, letterSpacing: 2, opacity: 0.7 }}>SPINS</span>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#FFD447' }}>{spinsLeft}/10</span>
        </div>
      </div>

      {/* WHEEL + POINTER + SUN — stack */}
      <div style={{
        position: 'relative',
        width: 340, height: 380,
        margin: '4px auto 0',
        zIndex: 2,
      }}>
        {/* pointer at top — tip overlaps wheel rim so it looks like it's catching the pegs */}
        <div style={{
          position: 'absolute', top: 18, left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 15,
        }}>
          <Pointer tick={pointerTick}/>
        </div>

        {/* wheel */}
        <div style={{
          position: 'absolute', top: 28, left: 0, right: 0, bottom: 12,
          filter: 'drop-shadow(0 14px 28px rgba(0,0,0,0.55))',
        }}>
          <Wheel rotation={rotation} spinning={spinning}/>
        </div>

        {/* SUN BUTTON — centered on the WHEEL (not the outer stack box) */}
        <button
          onClick={spin}
          disabled={!canSpin}
          style={{
            position: 'absolute',
            /* wheel center tuned by eye for the supplied logo PNG (asset padding isn't perfectly symmetric) */
            top: 194, left: 'calc(50% - 1px)',
            transform: 'translate(-50%, -50%)',
            width: 110, height: 110,
            border: 'none', background: 'transparent',
            padding: 0, cursor: canSpin ? 'pointer' : 'not-allowed',
            zIndex: 10,
            borderRadius: '50%',
            animation: spinning
              ? 'sunBlink 0.44s infinite alternate'
              : (canSpin ? 'sunIdle 2.4s infinite alternate' : 'none'),
            filter: spinning
              ? 'none'
              : 'drop-shadow(0 0 10px rgba(255,212,71,0.5))',
            transition: 'filter 0.2s',
          }}
          aria-label="Spin the wheel"
        >
          <SunLogo winking={winkTick} spinning={spinning}/>
        </button>

        {/* press-hint label */}
        {!spinning && (
          <div style={{
            position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)',
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 10, letterSpacing: 3, color: '#FFD447',
            opacity: 0.8, textTransform: 'uppercase', pointerEvents: 'none',
          }}>
            {spinsLeft > 0 ? '✦ Press the Sun ✦' : '✦ No spins left ✦'}
          </div>
        )}
      </div>

      {/* result / hint */}
      <div style={{
        height: 56, margin: '12px 22px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        position: 'relative', zIndex: 3,
      }}>
        {result ? (
          <div style={{
            padding: '10px 18px',
            background: 'linear-gradient(180deg, #FFD447, #E89A1F)',
            border: '2px solid #FFF3C4',
            borderRadius: 14,
            color: '#3A0A0A', fontWeight: 900,
            boxShadow: '0 0 24px rgba(255,212,71,0.55), inset 0 1px 0 rgba(255,255,255,0.6)',
            animation: 'winPop 0.5s ease-out',
          }}>
            <div style={{ fontSize: 10, letterSpacing: 3, opacity: 0.7 }}>✦ YOU WON ✦</div>
            <div style={{ fontSize: 26, letterSpacing: 1, lineHeight: 1.1 }}>
              {result.label} <span style={{ fontSize: 14 }}>COINS</span>
            </div>
          </div>
        ) : spinning ? (
          <div style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 13, letterSpacing: 4, color: '#FFD447',
            textTransform: 'uppercase',
            animation: 'pulse 0.7s infinite alternate',
          }}>
            ✦ Spinning ✦
          </div>
        ) : (
          <div style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 11, letterSpacing: 3, color: 'rgba(255,243,196,0.55)',
            textTransform: 'uppercase', fontStyle: 'italic',
          }}>
            Your fortune awaits
          </div>
        )}
      </div>

      {/* footer bulbs */}
      <div style={{
        position: 'absolute', bottom: 50, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between',
        padding: '0 28px', zIndex: 4,
      }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#FFD447',
            boxShadow: '0 0 8px #FFD447, 0 0 2px #FFF3C4',
            animation: `bulb 1.1s ${i * 0.12 + 0.5}s infinite alternate`,
          }}/>
        ))}
      </div>

      {/* bottom ornament */}
      <div style={{
        position: 'absolute', bottom: 14, left: 0, right: 0,
        textAlign: 'center', zIndex: 3,
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: 9, letterSpacing: 4, color: 'rgba(255,212,71,0.55)',
        textTransform: 'uppercase',
      }}>
        ✦ ✦ ✦
      </div>
    </div>
  );
}

Object.assign(window, { WheelApp });
