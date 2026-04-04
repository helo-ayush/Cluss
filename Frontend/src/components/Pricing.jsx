import { useTheme } from './ThemeProvider';

/* ── Icon SVGs ── */
const IconBrain = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
);
const IconRocket = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
);
const IconBuilding = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
    <path d="M9 22v-4h6v4"/>
    <path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/>
    <path d="M12 10h.01"/><path d="M12 14h.01"/>
    <path d="M16 10h.01"/><path d="M16 14h.01"/>
    <path d="M8 10h.01"/><path d="M8 14h.01"/>
  </svg>
);
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IconUsers = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconCloud = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
  </svg>
);
const IconMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IconSparkle = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
  </svg>
);

/* ── Star field ── */
const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  x: ((i * 137.508) % 100).toFixed(2),
  y: ((i * 97.3) % 100).toFixed(2),
  size: (((i * 7) % 20) / 10 + 0.5).toFixed(1),
  opacity: (((i * 13) % 6) / 10 + 0.08).toFixed(2),
  delay: ((i * 0.23) % 4).toFixed(2),
}));

const StarField = ({ show }) => {
  if (!show) return null;
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {STARS.map(s => (
        <div key={s.id} style={{
          position: 'absolute',
          left: `${s.x}%`, top: `${s.y}%`,
          width: `${s.size}px`, height: `${s.size}px`,
          borderRadius: '50%', background: '#fff',
          opacity: s.opacity,
          animation: `pricingStarTwinkle 3s ${s.delay}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
};

/* ── Decorative abstract blob ── */
const AbstractShape = ({ color, opacity, flip = false }) => (
  <svg viewBox="0 0 160 200" width="140" height="175" aria-hidden="true"
    style={{ position: 'absolute', right: flip ? 'auto' : '-10px', left: flip ? '-10px' : 'auto', top: 0, opacity, pointerEvents: 'none' }}>
    <path d="M80 10 C120 10,150 40,150 80 C150 120,130 150,100 170 C70 190,30 185,20 160 C10 135,20 100,30 75 C40 50,40 10,80 10Z" fill={color} />
    <path d="M90 30 C115 30,135 55,130 85 C125 115,110 135,85 150 C60 165,35 155,30 130 C25 105,45 70,55 50 C65 30,65 30,90 30Z" fill={color} fillOpacity="0.5" />
  </svg>
);

/* ── Feature data ── */
const FREE_FEATURES = [
  'Max 3 Playlist/Courses on Profile',
  '1 Playlist/Course per week',
  '1 topic unlock per day',
  'Full video learning',
  'Progress tracking & streaks',
  'AI-powered Quizzes',
];
const PRO_FEATURES = [
  { text: 'Unlimited Playlist Analysis' },
  { text: 'Unlimited Profile Storage' },
  { text: 'Unlimited topic unlocks' },
  { text: 'AI Tutor Chat per topic', badge: 'AI-based' },
  { text: 'Priority video selection' },
  { text: 'Quiz pass threshold: 60%' },
];
const ENT_FEATURES = [
  'Everything in Pro',
  'Dedicated account manager',
  'Custom integrations',
  'SSO & advanced security',
  'SLA & priority support',
  'Usage analytics dashboard',
];

/* ════════════════════════════════════════════
   PRICING COMPONENT
════════════════════════════════════════════ */
export default function Pricing() {
  const { isDark } = useTheme();

  /* ── All theme tokens in one place ── */
  const t = isDark ? {
    /* Section */
    sectionBg: 'radial-gradient(ellipse 80% 60% at 50% 0%, #0d0a2e 0%, #080818 40%, #050510 100%)',
    ambientGlow: 'radial-gradient(ellipse 60% 50% at 50% -10%, rgba(99,55,255,0.18) 0%, transparent 70%)',
    showStars: true,

    /* Header */
    pillBg: 'rgba(99,102,241,0.12)',
    pillBorder: '1px solid rgba(129,140,248,0.2)',
    pillText: '#a5b4fc',
    headingColor: '#f1f5f9',
    subColor: 'rgba(148,163,184,0.75)',

    /* Card 1 — Free */
    c1Bg: 'linear-gradient(145deg, #141428 0%, #0e0e1e 100%)',
    c1Border: '1px solid rgba(255,255,255,0.07)',
    c1Shadow: '0 20px 40px rgba(0,0,0,0.4)',
    c1BlobColor: '#6366f1', c1BlobOpacity: 0.12,
    c1IconBg: 'linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(99,102,241,0.1) 100%)',
    c1IconBorder: '1px solid rgba(129,140,248,0.2)',
    c1IconColor: '#818cf8',
    c1Name: '#e2e8f0',
    c1Desc: 'rgba(148,163,184,0.6)',
    c1Price: '#f1f5f9',
    c1PriceSub: 'rgba(148,163,184,0.5)',
    c1CtaBg: 'transparent',
    c1CtaBorder: '1px solid rgba(255,255,255,0.12)',
    c1CtaText: '#e2e8f0',
    c1MetaIcon: 'rgba(148,163,184,0.45)',
    c1MetaText: 'rgba(148,163,184,0.65)',
    c1MetaStrong: '#e2e8f0',
    c1Divider: 'rgba(255,255,255,0.06)',
    c1CheckColor: 'rgba(129,140,248,0.7)',
    c1FeatText: 'rgba(203,213,225,0.75)',

    /* Card 2 — Pro */
    c2Bg: 'linear-gradient(160deg, #2a1a5e 0%, #1a0f42 35%, #0f0b2e 70%, #0c0a25 100%)',
    c2Border: '1px solid rgba(129,140,248,0.2)',
    c2Shadow: '0 28px 56px rgba(50,20,140,0.45), 0 0 0 1px rgba(99,102,241,0.12)',
    c2AmbientGlow: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139,92,246,0.25) 0%, transparent 70%)',
    c2BlobColor: '#a78bfa', c2BlobOpacity: 0.18,
    c2BadgeBg: 'rgba(255,255,255,0.08)',
    c2BadgeBorder: '1px solid rgba(255,255,255,0.15)',
    c2BadgeText: 'rgba(226,232,240,0.85)',
    c2IconBg: 'linear-gradient(135deg, rgba(139,92,246,0.5) 0%, rgba(99,102,241,0.25) 100%)',
    c2IconBorder: '1px solid rgba(167,139,250,0.35)',
    c2IconColor: '#c4b5fd',
    c2Name: '#f1f5f9',
    c2Desc: 'rgba(167,139,250,0.75)',
    c2Price: '#f1f5f9',
    c2PriceSub: 'rgba(167,139,250,0.6)',
    c2MetaIcon: 'rgba(167,139,250,0.5)',
    c2MetaText: 'rgba(167,139,250,0.75)',
    c2MetaStrong: '#e2e8f0',
    c2TierText: 'rgba(167,139,250,0.5)',
    c2Divider: 'rgba(255,255,255,0.08)',
    c2CheckColor: 'rgba(167,139,250,0.8)',
    c2FeatText: 'rgba(203,213,225,0.8)',
    c2BadgeAiBg: 'rgba(99,102,241,0.18)',
    c2BadgeAiBorder: '1px solid rgba(129,140,248,0.35)',
    c2BadgeAiText: '#a5b4fc',

    /* Card 3 — Enterprise */
    c3Bg: 'linear-gradient(145deg, #121212 0%, #0c0c0c 100%)',
    c3Border: '1px solid rgba(255,255,255,0.06)',
    c3Shadow: '0 20px 40px rgba(0,0,0,0.5)',
    c3BlobColor: '#6b7280', c3BlobOpacity: 0.1,
    c3IconBg: 'rgba(255,255,255,0.06)',
    c3IconBorder: '1px solid rgba(255,255,255,0.1)',
    c3IconColor: 'rgba(203,213,225,0.5)',
    c3Name: '#e2e8f0',
    c3Desc: 'rgba(148,163,184,0.55)',
    c3Price: '#e2e8f0',
    c3CtaBg: 'rgba(255,255,255,0.04)',
    c3CtaBorder: '1px solid rgba(255,255,255,0.1)',
    c3CtaText: 'rgba(203,213,225,0.75)',
    c3MetaIcon: 'rgba(148,163,184,0.3)',
    c3MetaText: 'rgba(148,163,184,0.55)',
    c3MetaStrong: '#e2e8f0',
    c3Divider: 'rgba(255,255,255,0.05)',
    c3TierText: 'rgba(148,163,184,0.3)',
    c3CheckColor: 'rgba(148,163,184,0.4)',
    c3FeatText: 'rgba(148,163,184,0.6)',

    /* footer */
    footerText: 'rgba(100,116,139,0.6)',
  } : {
    /* Section */
    sectionBg: 'radial-gradient(ellipse 80% 55% at 50% -5%, #ede9fe 0%, #f5f3ff 35%, #f8f8ff 60%, #ffffff 100%)',
    ambientGlow: 'radial-gradient(ellipse 60% 45% at 50% -5%, rgba(99,102,241,0.12) 0%, transparent 70%)',
    showStars: false,

    /* Header */
    pillBg: 'rgba(99,102,241,0.08)',
    pillBorder: '1px solid rgba(99,102,241,0.2)',
    pillText: '#4f46e5',
    headingColor: '#1e1b4b',
    subColor: 'rgba(71,85,105,0.8)',

    /* Card 1 — Free */
    c1Bg: 'linear-gradient(145deg, #ffffff 0%, #f8f7ff 100%)',
    c1Border: '1px solid rgba(99,102,241,0.12)',
    c1Shadow: '0 8px 32px rgba(99,102,241,0.08), 0 1px 4px rgba(0,0,0,0.06)',
    c1BlobColor: '#c7d2fe', c1BlobOpacity: 0.5,
    c1IconBg: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(129,140,248,0.06) 100%)',
    c1IconBorder: '1px solid rgba(99,102,241,0.18)',
    c1IconColor: '#4f46e5',
    c1Name: '#1e1b4b',
    c1Desc: 'rgba(71,85,105,0.7)',
    c1Price: '#1e1b4b',
    c1PriceSub: 'rgba(100,116,139,0.65)',
    c1CtaBg: 'transparent',
    c1CtaBorder: '1px solid rgba(99,102,241,0.25)',
    c1CtaText: '#4f46e5',
    c1MetaIcon: 'rgba(99,102,241,0.4)',
    c1MetaText: 'rgba(71,85,105,0.7)',
    c1MetaStrong: '#1e1b4b',
    c1Divider: 'rgba(99,102,241,0.08)',
    c1CheckColor: 'rgba(79,70,229,0.6)',
    c1FeatText: 'rgba(51,65,85,0.8)',

    /* Card 2 — Pro */
    c2Bg: 'linear-gradient(160deg, #3b1fa8 0%, #4c1d95 30%, #3730a3 65%, #312e81 100%)',
    c2Border: '1px solid rgba(167,139,250,0.35)',
    c2Shadow: '0 20px 48px rgba(79,70,229,0.3), 0 0 0 1px rgba(99,102,241,0.2)',
    c2AmbientGlow: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139,92,246,0.3) 0%, transparent 70%)',
    c2BlobColor: '#c4b5fd', c2BlobOpacity: 0.2,
    c2BadgeBg: 'rgba(255,255,255,0.15)',
    c2BadgeBorder: '1px solid rgba(255,255,255,0.25)',
    c2BadgeText: 'rgba(255,255,255,0.9)',
    c2IconBg: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)',
    c2IconBorder: '1px solid rgba(255,255,255,0.3)',
    c2IconColor: '#ede9fe',
    c2Name: '#ffffff',
    c2Desc: 'rgba(221,214,254,0.85)',
    c2Price: '#ffffff',
    c2PriceSub: 'rgba(221,214,254,0.7)',
    c2MetaIcon: 'rgba(221,214,254,0.5)',
    c2MetaText: 'rgba(221,214,254,0.8)',
    c2MetaStrong: '#ffffff',
    c2TierText: 'rgba(221,214,254,0.55)',
    c2Divider: 'rgba(255,255,255,0.12)',
    c2CheckColor: 'rgba(221,214,254,0.85)',
    c2FeatText: 'rgba(237,233,254,0.9)',
    c2BadgeAiBg: 'rgba(255,255,255,0.15)',
    c2BadgeAiBorder: '1px solid rgba(255,255,255,0.25)',
    c2BadgeAiText: '#ede9fe',

    /* Card 3 — Enterprise */
    c3Bg: 'linear-gradient(145deg, #f1f5f9 0%, #e8ecf2 100%)',
    c3Border: '1px solid rgba(100,116,139,0.15)',
    c3Shadow: '0 8px 32px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
    c3BlobColor: '#94a3b8', c3BlobOpacity: 0.2,
    c3IconBg: 'rgba(100,116,139,0.1)',
    c3IconBorder: '1px solid rgba(100,116,139,0.18)',
    c3IconColor: 'rgba(71,85,105,0.6)',
    c3Name: '#1e293b',
    c3Desc: 'rgba(71,85,105,0.65)',
    c3Price: '#1e293b',
    c3CtaBg: 'rgba(0,0,0,0.04)',
    c3CtaBorder: '1px solid rgba(100,116,139,0.2)',
    c3CtaText: 'rgba(51,65,85,0.8)',
    c3MetaIcon: 'rgba(100,116,139,0.4)',
    c3MetaText: 'rgba(71,85,105,0.65)',
    c3MetaStrong: '#1e293b',
    c3Divider: 'rgba(100,116,139,0.1)',
    c3TierText: 'rgba(100,116,139,0.5)',
    c3CheckColor: 'rgba(100,116,139,0.5)',
    c3FeatText: 'rgba(71,85,105,0.7)',

    /* footer */
    footerText: 'rgba(100,116,139,0.7)',
  };

  return (
    <>
      <style>{`
        @keyframes pricingStarTwinkle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.5); opacity: calc(var(--so, 0.3) * 2); }
        }
        .pricing-card-hover {
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s ease, background 0.4s ease, border 0.4s ease;
        }
        .pricing-card-hover:hover { transform: translateY(-6px); }
        .pricing-featured-hover {
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s ease, background 0.4s ease, border 0.4s ease;
        }
        .pricing-featured-hover:hover { transform: translateY(-8px); }
        .pricing-cta-orange {
          transition: filter 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
        }
        .pricing-cta-orange:hover {
          filter: brightness(1.1);
          box-shadow: 0 0 32px rgba(234,88,12,0.5) !important;
          transform: translateY(-2px);
        }
        .pricing-cta-ghost { transition: background 0.3s ease, border-color 0.3s ease, transform 0.3s ease; }
        .pricing-cta-ghost:hover { transform: translateY(-2px); }
        .pricing-ai-badge {
          display: inline-flex; align-items: center; gap: 3px;
          padding: 2px 8px; border-radius: 999px;
          font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
          margin-left: 8px; white-space: nowrap; vertical-align: middle;
        }
      `}</style>

      <section
        id="pricing"
        style={{
          position: 'relative', width: '100%', minHeight: '100vh',
          paddingTop: '120px', paddingBottom: '100px',
          paddingLeft: '24px', paddingRight: '24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          overflow: 'hidden',
          background: t.sectionBg,
          transition: 'background 0.4s ease',
        }}
      >
        {/* Ambient glow */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: t.ambientGlow, transition: 'background 0.4s ease' }} />

        {/* Stars (dark only) */}
        <StarField show={t.showStars} />

        {/* ── Header ── */}
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', marginBottom: '64px', maxWidth: '560px' }}>
          <span style={{
            display: 'inline-block', padding: '5px 16px', borderRadius: '999px',
            fontSize: '11px', fontFamily: 'Outfit, sans-serif', fontWeight: 700,
            letterSpacing: '0.28em', textTransform: 'uppercase',
            color: t.pillText, background: t.pillBg, border: t.pillBorder,
            marginBottom: '20px', transition: 'all 0.4s ease',
          }}>
            Simple Pricing
          </span>
          <h2 style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 700,
            color: t.headingColor, lineHeight: 1.15,
            letterSpacing: '-0.02em', margin: '0 0 16px',
            transition: 'color 0.4s ease',
          }}>
            Start Free,{' '}
            <span style={{
              backgroundImage: isDark
                ? 'linear-gradient(135deg, #818cf8 0%, #c084fc 60%, #f472b6 100%)'
                : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #a855f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
              fontStyle: 'italic',
            }}>
              Go Pro
            </span>
          </h2>
          <p style={{
            fontFamily: 'Inter, sans-serif', fontSize: '17px',
            color: t.subColor, lineHeight: 1.7, margin: 0,
            transition: 'color 0.4s ease',
          }}>
            Focus Forge is free to start. Upgrade when you're ready for unlimited AI-powered learning.
          </p>
        </div>

        {/* ── Cards ── */}
        <div style={{
          position: 'relative', zIndex: 10,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px', width: '100%', maxWidth: '1080px', alignItems: 'center',
        }}>

          {/* ─ Card 1: FREE ─ */}
          <div className="pricing-card-hover" style={{
            position: 'relative', borderRadius: '20px', overflow: 'hidden',
            background: t.c1Bg, border: t.c1Border, boxShadow: t.c1Shadow,
            padding: '36px 32px 32px',
          }}>
            <AbstractShape color={t.c1BlobColor} opacity={t.c1BlobOpacity} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              {/* Icon */}
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: t.c1IconBg, border: t.c1IconBorder,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: t.c1IconColor, marginBottom: '24px',
              }}>
                <IconBrain />
              </div>
              {/* Name */}
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '28px', fontWeight: 700, color: t.c1Name, margin: '0 0 6px', letterSpacing: '-0.01em' }}>Free</h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: t.c1Desc, margin: '0 0 28px', lineHeight: 1.5 }}>
                Seamless learning to get started. Track progress and build streaks.
              </p>
              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '28px' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '48px', fontWeight: 700, color: t.c1Price, letterSpacing: '-0.03em' }}>$0</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: t.c1PriceSub }}>/forever</span>
              </div>
              {/* CTA */}
              <button className="pricing-cta-ghost" style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                background: t.c1CtaBg, border: t.c1CtaBorder, color: t.c1CtaText,
                fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 600,
                cursor: 'pointer', marginBottom: '28px',
              }}>
                Get Started Free
              </button>
              {/* Meta */}
              {[
                { icon: <IconUsers />, strong: '3', rest: ' courses maximum' },
                { icon: <IconCloud />, strong: '250 MB', rest: ' of storage' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ color: t.c1MetaIcon, flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: t.c1MetaText }}>
                    <strong style={{ color: t.c1MetaStrong }}>{item.strong}</strong>{item.rest}
                  </span>
                </div>
              ))}
              {/* Divider */}
              <div style={{ height: '1px', background: t.c1Divider, margin: '16px 0' }} />
              {/* Features */}
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '13px' }}>
                {FREE_FEATURES.map((feat, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: t.c1CheckColor, flexShrink: 0 }}><IconCheck /></span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: t.c1FeatText }}>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ─ Card 2: PRO (featured) ─ */}
          <div className="pricing-featured-hover" style={{
            position: 'relative', borderRadius: '22px', overflow: 'hidden',
            background: t.c2Bg, border: t.c2Border, boxShadow: t.c2Shadow,
            padding: '44px 32px 32px',
          }}>
            {/* Inner ambient */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: t.c2AmbientGlow }} />
            <AbstractShape color={t.c2BlobColor} opacity={t.c2BlobOpacity} />
            {/* Most popular badge */}
            <div style={{
              position: 'absolute', top: '20px', right: '20px',
              padding: '5px 14px', borderRadius: '999px',
              background: t.c2BadgeBg, border: t.c2BadgeBorder,
              fontFamily: 'Outfit, sans-serif', fontSize: '11px', fontWeight: 600,
              color: t.c2BadgeText, letterSpacing: '0.04em',
            }}>
              Most popular
            </div>
            <div style={{ position: 'relative', zIndex: 2 }}>
              {/* Icon */}
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: t.c2IconBg, border: t.c2IconBorder,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: t.c2IconColor, marginBottom: '24px',
              }}>
                <IconRocket />
              </div>
              {/* Name */}
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '32px', fontWeight: 700, color: t.c2Name, margin: '0 0 6px', letterSpacing: '-0.015em' }}>Pro</h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: t.c2Desc, margin: '0 0 28px', lineHeight: 1.55 }}>
                Supercharged AI tools. Personalized guidance. Market-grade learning insights.
              </p>
              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '28px' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '52px', fontWeight: 700, color: t.c2Price, letterSpacing: '-0.03em' }}>$5</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: t.c2PriceSub }}>/month</span>
              </div>
              {/* CTA — orange */}
              <button className="pricing-cta-orange" style={{
                width: '100%', padding: '15px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: '#fff',
                fontFamily: 'Outfit, sans-serif', fontSize: '16px', fontWeight: 700,
                cursor: 'pointer', marginBottom: '28px',
                boxShadow: '0 0 24px rgba(234,88,12,0.4)',
                letterSpacing: '0.01em',
              }}>
                Choose this plan
              </button>
              {/* Meta */}
              {[
                { icon: <IconUsers />, strong: 'Unlimited', rest: ' courses' },
                { icon: <IconCloud />, strong: '1 GB', rest: ' of storage' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ color: t.c2MetaIcon, flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: t.c2MetaText }}>
                    <strong style={{ color: t.c2MetaStrong }}>{item.strong}</strong>{item.rest}
                  </span>
                </div>
              ))}
              {/* Tier divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
                <div style={{ flex: 1, height: '1px', background: t.c2Divider }} />
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: t.c2TierText, whiteSpace: 'nowrap' }}>FREE +</span>
                <div style={{ flex: 1, height: '1px', background: t.c2Divider }} />
              </div>
              {/* Features */}
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '13px' }}>
                {PRO_FEATURES.map((feat, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: t.c2CheckColor, flexShrink: 0 }}><IconCheck /></span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: t.c2FeatText }}>
                      {feat.text}
                      {feat.badge && (
                        <span className="pricing-ai-badge" style={{
                          background: t.c2BadgeAiBg,
                          border: t.c2BadgeAiBorder,
                          color: t.c2BadgeAiText,
                        }}>
                          <IconSparkle /> {feat.badge}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ─ Card 3: ENTERPRISE ─ */}
          <div className="pricing-card-hover" style={{
            position: 'relative', borderRadius: '20px', overflow: 'hidden',
            background: t.c3Bg, border: t.c3Border, boxShadow: t.c3Shadow,
            padding: '36px 32px 32px',
          }}>
            <AbstractShape color={t.c3BlobColor} opacity={t.c3BlobOpacity} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              {/* Icon */}
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: t.c3IconBg, border: t.c3IconBorder,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: t.c3IconColor, marginBottom: '24px',
              }}>
                <IconBuilding />
              </div>
              {/* Name */}
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '28px', fontWeight: 700, color: t.c3Name, margin: '0 0 6px', letterSpacing: '-0.01em' }}>Enterprise</h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: t.c3Desc, margin: '0 0 28px', lineHeight: 1.5 }}>
                Own your data. Custom SLA. Dedicated support. Decentralized at scale.
              </p>
              {/* "Price" */}
              <div style={{ marginBottom: '28px' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '36px', fontWeight: 700, color: t.c3Price, letterSpacing: '-0.02em' }}>Contact us</span>
              </div>
              {/* CTA */}
              <button className="pricing-cta-ghost" style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                background: t.c3CtaBg, border: t.c3CtaBorder, color: t.c3CtaText,
                fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 600,
                cursor: 'pointer', marginBottom: '28px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                <IconMail /> Contact us
              </button>
              {/* Meta */}
              {[
                { icon: <IconUsers />, strong: 'Unlimited', rest: ' seats available' },
                { icon: <IconCloud />, strong: '100 GB+', rest: ' of storage' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ color: t.c3MetaIcon, flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: t.c3MetaText }}>
                    <strong style={{ color: t.c3MetaStrong }}>{item.strong}</strong>{item.rest}
                  </span>
                </div>
              ))}
              {/* Tier divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
                <div style={{ flex: 1, height: '1px', background: t.c3Divider }} />
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: t.c3TierText, whiteSpace: 'nowrap' }}>FREE & PRO +</span>
                <div style={{ flex: 1, height: '1px', background: t.c3Divider }} />
              </div>
              {/* Features */}
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '13px' }}>
                {ENT_FEATURES.map((feat, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: t.c3CheckColor, flexShrink: 0 }}><IconCheck /></span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: t.c3FeatText }}>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        {/* Footer note */}
        <p style={{
          position: 'relative', zIndex: 10,
          fontFamily: 'Inter, sans-serif', fontSize: '13px',
          color: t.footerText, marginTop: '40px', textAlign: 'center',
          transition: 'color 0.4s ease',
        }}>
          No credit card required for Free plan · Cancel anytime · 7-day Pro trial included
        </p>
      </section>
    </>
  );
}
