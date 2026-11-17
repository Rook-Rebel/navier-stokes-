import { useSimStore, PLAYBACK_SPEEDS } from '../../hooks/useSimStore';
import { CRITICAL_TIME, MAX_SIM_TIME } from '../../utils/flowField';
import { TIMELINE_MARKS, fractionToT, tToFraction } from '../../utils/timelineScale';

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" />
      <rect x="14" y="5" width="4" height="14" />
    </svg>
  );
}
function ResetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 4v6h6" />
      <path d="M20 20a9 9 0 1 0-2.6-6.4L4 10" />
    </svg>
  );
}
function StepIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 5v14l9-7z" />
      <rect x="17" y="5" width="2.4" height="14" />
    </svg>
  );
}

export function SimulationControls() {
  const t = useSimStore((s) => s.t);
  const playing = useSimStore((s) => s.playing);
  const speed = useSimStore((s) => s.speed);
  const togglePlay = useSimStore((s) => s.togglePlay);
  const reset = useSimStore((s) => s.reset);
  const step = useSimStore((s) => s.step);
  const setSpeed = useSimStore((s) => s.setSpeed);
  const setT = useSimStore((s) => s.setT);
  const enterFinalStageMode = useSimStore((s) => s.enterFinalStageMode);
  const timelineExpanded = useSimStore((s) => s.timelineExpanded);
  const toggleTimelineExpanded = useSimStore((s) => s.toggleTimelineExpanded);

  const timeToSingularity = CRITICAL_TIME - t;
  const fraction = tToFraction(t, timelineExpanded);
  const pct = fraction * 100;

  const approaching = t > 0.9;
  const nearCritical = t > 0.97;
  const veryNear = t > 0.99;
  const atLimit = t >= MAX_SIM_TIME - 1e-6;

  return (
    <div className={`side-panel-block${approaching ? ' timeline-emphasis' : ''}`}>
      <div className="side-panel-title">
        <span>დროის მართვა</span>
      </div>

      <div className="time-readout">
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>დრო t</div>
          <div className="time-readout-value mono">{t.toFixed(4)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>კრიტიკულ დრომდე (T − t)</div>
          <div className="time-readout-value mono" style={{ color: approaching ? 'var(--accent-warm)' : 'var(--text-accent)' }}>
            {timeToSingularity.toFixed(4)}
          </div>
        </div>
      </div>

      <div className="timeline-instrument">
        <input
          type="range"
          min={0}
          max={1}
          step={0.0004}
          value={fraction}
          aria-label="სიმულაციის დროის ღერძი"
          onChange={(e) => setT(fractionToT(parseFloat(e.target.value), timelineExpanded))}
          style={{ ['--pct' as string]: `${pct}%` }}
        />
        <div className="timeline-marks">
          {TIMELINE_MARKS.map((mark) => (
            <span
              key={mark}
              className="timeline-mark"
              style={{ left: `${tToFraction(mark, timelineExpanded) * 100}%` }}
            >
              <i />
              {mark === MAX_SIM_TIME ? 'T' : mark.toFixed(2)}
            </span>
          ))}
        </div>
      </div>

      <button
        className={`btn btn-ghost btn-sm${timelineExpanded ? ' active' : ''}`}
        style={{ width: '100%', marginTop: 8 }}
        onClick={toggleTimelineExpanded}
        aria-pressed={timelineExpanded}
      >
        ბოლო მონაკვეთის გაშლა
      </button>

      <div className="playback-row" style={{ marginTop: 14 }}>
        <button
          className="playback-icon-btn"
          onClick={() => step(-1)}
          aria-label="ერთი ნაბიჯი უკან"
          title="ერთი ნაბიჯი უკან"
          style={{ transform: 'scaleX(-1)' }}
        >
          <StepIcon />
        </button>
        <button
          className="playback-icon-btn primary"
          onClick={togglePlay}
          aria-label={playing ? 'პაუზა' : 'გაშვება'}
          title={playing ? 'პაუზა' : 'გაშვება'}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button className="playback-icon-btn" onClick={() => step(1)} aria-label="ერთი ნაბიჯი წინ" title="ერთი ნაბიჯი">
          <StepIcon />
        </button>
        <button className="playback-icon-btn" onClick={reset} aria-label="თავიდან" title="თავიდან">
          <ResetIcon />
        </button>
        <span style={{ marginLeft: 4, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          {playing ? 'გაშვება' : 'პაუზა'}
        </span>
      </div>

      <div className="speed-row" role="group" aria-label="ვიზუალიზაციის სიჩქარე">
        {PLAYBACK_SPEEDS.map((s) => (
          <button
            key={s}
            className={`speed-chip${speed === s ? ' active' : ''}`}
            onClick={() => setSpeed(s)}
          >
            {s}×
          </button>
        ))}
      </div>

      <button
        className="btn btn-ghost btn-sm"
        style={{ width: '100%', marginTop: 12 }}
        onClick={enterFinalStageMode}
      >
        ნელა ვნახოთ ბოლო ეტაპი
      </button>

      {approaching && (
        <div className="warning-strip">
          {atLimit
            ? 'მათემატიკური მოდელი ამ ზღვართან კარგავს გლუვ რეგულარობას.'
            : veryNear
              ? 'მაქსიმალური სიჩქარე სწრაფად იზრდება.'
              : nearCritical
                ? 'კრიტიკულ რეჟიმთან მიახლოება.'
                : 'სისტემა უახლოვდება სინგულარულ რეჟიმს.'}
        </div>
      )}
    </div>
  );
}
