import { useTheme } from './ThemeProvider';
import { ShimmerButton } from './magicui/ShimmerButton';
import { NeonGradientCard } from './magicui/NeonGradientCard';
import { BorderBeam } from './magicui/BorderBeam';

const FREE_FEATURES = [
  { text: '3 courses maximum', included: true },
  { text: '1 new course per week', included: true },
  { text: '1 topic unlock per course per day', included: true },
  { text: 'Full video learning experience', included: true },
  { text: 'Progress tracking & streaks', included: true },
  { text: 'Community leaderboard', included: true },
  { text: 'Quiz pass threshold: 80%', included: true, note: 'Higher bar = deeper mastery' },
];

const PRO_FEATURES = [
  { text: 'Unlimited courses', included: true },
  { text: 'Unlimited course creation', included: true },
  { text: 'Unlimited topic unlocks', included: true },
  { text: 'Full video learning experience', included: true },
  { text: 'Progress tracking & streaks', included: true },
  { text: 'Community leaderboard', included: true },
  { text: 'Quiz pass threshold: 60%', included: true, note: 'More forgiving' },
  { text: 'AI Tutor Chat per topic', included: true, highlight: true },
  { text: 'Priority video selection', included: true },
];

export default function Pricing() {
  const { isDark } = useTheme();

  return (
    <section id="pricing" className="relative w-full pt-40 pb-20 px-4 md:px-8 flex flex-col items-center overflow-hidden" style={{ background: 'var(--color-background)' }}>
      {/* Background glow */}
      <div className="absolute inset-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' }}></div>

      <div className="max-w-5xl w-full flex flex-col items-center text-center z-10 space-y-8">
        <span className="glass-pill font-label uppercase tracking-[0.3em] text-xs font-bold px-4 py-1.5 rounded-full inline-block" style={{ color: 'var(--color-primary)' }}>
          Simple Pricing
        </span>

        <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight">
          <span style={{ color: 'var(--theme-text-heading)' }}>Start Free, </span>
          <span className="italic" style={{ color: 'var(--color-primary)' }}>Go Pro</span>
        </h2>

        <p className="font-body text-lg md:text-xl max-w-2xl leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
          Focus Forge is free to start learning. Upgrade when you're ready for unlimited power.
        </p>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 w-full max-w-4xl">

          {/* Free Card */}
          <div className="relative overflow-hidden rounded-3xl liquid-glass p-8 md:p-10 text-left transition-all duration-300 hover:scale-[1.02]" style={{ borderColor: 'var(--theme-border)' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.08)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '20px' }}>person</span>
              </div>
              <div>
                <h3 className="font-headline text-2xl font-bold" style={{ color: 'var(--theme-text-heading)' }}>Free</h3>
                <p className="font-label text-[10px] uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>For getting started</p>
              </div>
            </div>

            <div className="flex items-baseline gap-1 mb-8">
              <span className="font-headline text-5xl font-black" style={{ color: 'var(--theme-text-heading)' }}>$0</span>
              <span className="font-body text-sm" style={{ color: 'var(--theme-text-muted)' }}>/forever</span>
            </div>

            <ul className="space-y-4 mb-10">
              {FREE_FEATURES.map((feat, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-base mt-0.5 shrink-0" style={{ color: feat.included ? '#34d399' : 'var(--theme-text-faint)' }}>
                    {feat.included ? 'check_circle' : 'cancel'}
                  </span>
                  <div>
                    <span className="font-body text-sm" style={{ color: 'var(--theme-text-body)' }}>{feat.text}</span>
                    {feat.note && <span className="font-label text-[10px] ml-1.5 px-2 py-0.5 rounded-full" style={{ color: 'var(--color-primary)', background: 'rgba(99,102,241,0.08)' }}>{feat.note}</span>}
                  </div>
                </li>
              ))}
            </ul>

            <button className="w-full py-3.5 rounded-xl font-label text-sm font-bold transition-all glass-pill hover:bg-white/5" style={{ color: 'var(--theme-text-heading)', borderColor: 'var(--theme-border)' }}>
              Get Started Free
            </button>
          </div>

          {/* Pro Card */}
          <NeonGradientCard className="w-full" borderRadius={24} borderSize={2} neonColors={{ firstColor: '#6366f1', secondColor: '#818cf8' }}>
            <div className="relative overflow-hidden rounded-3xl p-8 md:p-10 text-left h-full" style={{ background: isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.95)' }}>
              {/* Popular badge */}
              <div className="absolute top-5 right-5 px-3 py-1 rounded-full font-label text-[10px] font-bold uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: '#fff' }}>
                Most Popular
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                  <span className="material-symbols-outlined" style={{ color: '#818cf8', fontSize: '20px' }}>bolt</span>
                </div>
                <div>
                  <h3 className="font-headline text-2xl font-bold" style={{ color: 'var(--theme-text-heading)' }}>Pro</h3>
                  <p className="font-label text-[10px] uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>For serious learners</p>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="font-headline text-5xl font-black" style={{ color: 'var(--theme-text-heading)' }}>$5</span>
                <span className="font-body text-sm" style={{ color: 'var(--theme-text-muted)' }}>/month</span>
              </div>

              <ul className="space-y-4 mb-10">
                {PRO_FEATURES.map((feat, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-base mt-0.5 shrink-0" style={{ color: feat.highlight ? '#818cf8' : '#34d399' }}>
                      {feat.highlight ? 'auto_awesome' : 'check_circle'}
                    </span>
                    <div>
                      <span className={`font-body text-sm ${feat.highlight ? 'font-bold' : ''}`} style={{ color: feat.highlight ? 'var(--theme-text-heading)' : 'var(--theme-text-body)' }}>{feat.text}</span>
                      {feat.note && <span className="font-label text-[10px] ml-1.5 px-2 py-0.5 rounded-full" style={{ color: '#34d399', background: 'rgba(52,211,153,0.08)' }}>{feat.note}</span>}
                    </div>
                  </li>
                ))}
              </ul>

              <ShimmerButton
                background={isDark ? "#6366f1" : "#4f46e5"}
                shimmerColor="rgba(255,255,255,0.45)"
                borderRadius="12px"
                className="w-full font-label text-sm font-black py-3.5 text-white active:scale-95"
              >
                Upgrade to Pro — $5/mo
              </ShimmerButton>
            </div>
          </NeonGradientCard>

        </div>
      </div>
    </section>
  );
}
