import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { GUIDED_STEPS } from '../../data/steps';
import { useSimStore, type CameraPreset } from '../../hooks/useSimStore';
import { ParticleSystem } from '../simulation/ParticleSystem';
import { LazyMount } from '../common/LazyMount';

const PRESET_LOOKUP: Record<CameraPreset, [number, number, number]> = {
  full: [5.2, 3.4, 5.2],
  top: [0.01, 7.6, 0.01],
  side: [7.4, 0.2, 0.01],
  core: [1.6, 0.9, 1.6],
  trajectory: [3.4, 1.6, -4.4],
  inside: [0.55, 0.3, 0.7],
};

function StepMiniScene({ preset }: { preset: CameraPreset }) {
  return (
    <Canvas key={preset} camera={{ position: PRESET_LOOKUP[preset], fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: true }}>
      <color attach="background" args={['#03050a']} />
      <ambientLight intensity={0.5} />
      <ParticleSystem colorBy="angular" interactive={false} baseSize={6.5} />
    </Canvas>
  );
}

export function StepByStepMode() {
  const [activeStep, setActiveStep] = useState(0);
  const setStepIndex = useSimStore((s) => s.setStepIndex);

  useEffect(() => {
    setStepIndex(activeStep);
  }, [activeStep, setStepIndex]);

  const step = GUIDED_STEPS[activeStep];

  return (
    <section className="section" id="steps">
      <span className="eyebrow-label">გზამკვლევი რეჟიმი</span>
      <h2 className="section-heading" style={{ marginTop: 8 }}>
        ნაბიჯ-ნაბიჯ
      </h2>
      <p className="section-sub">
        გაიარეთ სინგულარობისკენ მიმავალი ხუთი ეტაპი თანმიმდევრობით — თითოეული ნაბიჯი ავტომატურად ცვლის სიმულაციის დროსა და კამერის რაკურსს.
      </p>

      <div className="step-nav" role="tablist" aria-label="ნაბიჯების არჩევა">
        {GUIDED_STEPS.map((s, i) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={activeStep === i}
            className={`step-nav-btn${activeStep === i ? ' active' : ''}${activeStep > i ? ' done' : ''}`}
            onClick={() => setActiveStep(i)}
          >
            <span className="num">{s.number}</span>
            <span>{s.title}</span>
          </button>
        ))}
      </div>

      <div className="glass-panel" style={{ padding: 28 }}>
        <div className="step-stage">
          <div>
            <div className="step-stage-number">{step.number}</div>
            <h3 className="step-stage-title">{step.title}</h3>
            <p className="step-stage-text">{step.text}</p>
            <div className="step-controls">
              <button
                className="btn btn-ghost"
                disabled={activeStep === 0}
                onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
              >
                წინა ეტაპი
              </button>
              <button
                className="btn btn-primary"
                disabled={activeStep === GUIDED_STEPS.length - 1}
                onClick={() => setActiveStep((s) => Math.min(GUIDED_STEPS.length - 1, s + 1))}
              >
                შემდეგი ეტაპი
              </button>
            </div>
          </div>
          <div className="step-stage-canvas">
            <LazyMount minHeight={360}>
              <StepMiniScene preset={step.cameraPreset} />
            </LazyMount>
          </div>
        </div>
      </div>
    </section>
  );
}
