import { useEffect, useState } from 'react';
import { GUIDED_STEPS } from '../../data/steps';
import { useSimStore } from '../../hooks/useSimStore';

const STEP_SECONDS = 6.5;

/**
 * "გზამკვლევი" / "პრეზენტაცია" overlay, integrated directly into the lab
 * scene (not a separate page section): selecting a stage moves the real
 * camera and simulation time together, and the explanation floats
 * unobtrusively over the 3D view instead of living in its own card below.
 */
export function PresentationOverlay({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const setStepIndex = useSimStore((s) => s.setStepIndex);
  const requestCameraPreset = useSimStore((s) => s.requestCameraPreset);
  const presentationPlaying = useSimStore((s) => s.presentationPlaying);
  const setPresentationPlaying = useSimStore((s) => s.setPresentationPlaying);

  const goTo = (i: number) => {
    const clamped = Math.min(Math.max(i, 0), GUIDED_STEPS.length - 1);
    setIndex(clamped);
    setStepIndex(clamped);
    requestCameraPreset(GUIDED_STEPS[clamped].cameraPreset);
  };

  useEffect(() => {
    goTo(0);
    return () => setPresentationPlaying(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!presentationPlaying) return;
    if (index >= GUIDED_STEPS.length - 1) {
      setPresentationPlaying(false);
      return;
    }
    const id = window.setTimeout(() => goTo(index + 1), STEP_SECONDS * 1000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presentationPlaying, index]);

  const step = GUIDED_STEPS[index];

  return (
    <div className="glass-panel presentation-overlay">
      <div className="presentation-overlay-head">
        <span className="presentation-overlay-num font-cinema">{step.number}</span>
        <div>
          <div className="presentation-overlay-title">{step.title}</div>
          <p className="presentation-overlay-text">{step.text}</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="დახურვა">
          ✕
        </button>
      </div>
      <div className="presentation-overlay-controls">
        <button className="btn btn-ghost btn-sm" disabled={index === 0} onClick={() => goTo(index - 1)}>
          წინა
        </button>
        <button
          className={`btn btn-sm${presentationPlaying ? ' active' : ''}`}
          onClick={() => setPresentationPlaying(!presentationPlaying)}
        >
          {presentationPlaying ? 'პაუზა' : 'პრეზენტაცია'}
        </button>
        <button
          className="btn btn-ghost btn-sm"
          disabled={index === GUIDED_STEPS.length - 1}
          onClick={() => goTo(index + 1)}
        >
          შემდეგი
        </button>
        <div className="presentation-overlay-dots">
          {GUIDED_STEPS.map((s, i) => (
            <span key={s.id} className={i === index ? 'active' : ''} />
          ))}
        </div>
      </div>
    </div>
  );
}
