import { DollarSign, Heart } from 'lucide-react'

/**
 * Money ←→ Fit slider (§3).
 *
 * Purely a re-rank control: moving it recomputes `blendScores` in memory. No
 * API call, no refetch — both axes are already on the client, which is what
 * makes the ranking respond on every drag.
 */
export default function MoneyFitSlider({ value, onChange, disabled }) {
  const pct = Math.round(value * 100)

  return (
    <div
      className="no-print"
      style={{
        backgroundColor: '#131313',
        borderRadius: '0.875rem',
        padding: '1.5rem 1.75rem',
        border: '1px solid rgba(72,72,72,0.15)',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.3s ease',
      }}
    >
      <style>{`
        .mf-slider { -webkit-appearance: none; appearance: none; background: transparent; }
        .mf-slider::-webkit-slider-runnable-track {
          height: 6px; border-radius: 9999px;
          background: linear-gradient(90deg, #4ade80 0%, #2f4f45 45%, #4a3d7c 55%, #c4b5fd 100%);
        }
        .mf-slider::-moz-range-track {
          height: 6px; border-radius: 9999px;
          background: linear-gradient(90deg, #4ade80 0%, #2f4f45 45%, #4a3d7c 55%, #c4b5fd 100%);
        }
        .mf-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 20px; height: 20px; margin-top: -7px;
          border-radius: 50%; background: #e7e5e4;
          border: 3px solid #0e0e0e;
          box-shadow: 0 2px 10px rgba(0,0,0,0.6); cursor: grab;
        }
        .mf-slider::-moz-range-thumb {
          width: 20px; height: 20px;
          border-radius: 50%; background: #e7e5e4;
          border: 3px solid #0e0e0e;
          box-shadow: 0 2px 10px rgba(0,0,0,0.6); cursor: grab;
        }
        .mf-slider:disabled::-webkit-slider-thumb { cursor: not-allowed; }
        .mf-slider:focus-visible { outline: 2px solid #c4b5fd; outline-offset: 6px; border-radius: 9999px; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c4b5fd' }}>
          What matters more?
        </span>
        <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#767575', letterSpacing: '0.05em' }}>
          {pct === 50 ? 'Balanced' : pct < 50 ? `${100 - pct}% money` : `${pct}% fit`}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
          <DollarSign size={15} style={{ color: '#4ade80' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4ade80', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Money
          </span>
        </div>

        <input
          className="mf-slider"
          type="range"
          min={0}
          max={100}
          step={1}
          value={pct}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          aria-label="Rank by money versus fit"
          style={{ flex: 1, height: 20, cursor: disabled ? 'not-allowed' : 'pointer' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Fit
          </span>
          <Heart size={15} style={{ color: '#c4b5fd' }} />
        </div>
      </div>

      <p style={{ fontSize: '0.75rem', color: '#767575', marginTop: '0.875rem', lineHeight: 1.6 }}>
        {disabled
          ? 'Fit scores are still loading — rankings below are ordered by the financial model.'
          : 'Drag to re-rank. Left weights the 40-year financial projection; right weights how well each school matches your Q9 answers.'}
      </p>
    </div>
  )
}
