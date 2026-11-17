import { useEffect, useRef, useState } from 'react';
import { SceneCanvas } from '../simulation/SceneCanvas';
import { SplitCompareView } from '../simulation/SplitCompareView';
import { ParticleInspector } from '../simulation/ParticleInspector';
import { PresentationOverlay } from '../simulation/PresentationOverlay';
import { SimulationControls } from '../controls/SimulationControls';
import { ParameterPanel } from '../controls/ParameterPanel';
import { VisualizationModes } from '../controls/VisualizationModes';
import { CameraPresets } from '../controls/CameraPresets';
import { QualityControl } from '../controls/QualityControl';
import { ColorModeSelector } from '../controls/ColorModeSelector';
import { VectorDensityControl } from '../controls/VectorDensityControl';
import { ScreenshotModeControl, type ScreenshotFrame } from '../controls/ScreenshotModeControl';
import { Legend } from '../common/Legend';
import { LiveDataPanel } from '../data/LiveDataPanel';
import { useSimStore, type VisualizationMode } from '../../hooks/useSimStore';
import { CRITICAL_TIME } from '../../utils/flowField';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

const MODE_LABELS: Record<VisualizationMode, string> = {
  particles: 'ნაწილაკები',
  trajectories: 'ტრაექტორიები',
  velocity: 'სიჩქარის ველი',
  vorticity: 'ვორტიციტეტი',
  energy: 'ენერგია',
  comparison: 'შედარება',
};

const ASPECT_RATIO: Record<Exclude<ScreenshotFrame, null>, string> = {
  '16:9': '16 / 9',
  '1:1': '1 / 1',
  '9:16': '9 / 16',
};

export function Laboratory() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [labInView, setLabInView] = useState(true);
  const [presentationOpen, setPresentationOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [screenshotFrame, setScreenshotFrame] = useState<ScreenshotFrame>(null);
  const sectionRef = useRef<HTMLElement>(null);
  useKeyboardShortcuts();
  const t = useSimStore((s) => s.t);
  const mode = useSimStore((s) => s.mode);
  const focusMode = useSimStore((s) => s.focusMode);
  const toggleFocusMode = useSimStore((s) => s.toggleFocusMode);
  const annotationsEnabled = useSimStore((s) => s.annotationsEnabled);
  const toggleAnnotations = useSimStore((s) => s.toggleAnnotations);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setLabInView(entry.isIntersecting), {
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('focus-mode', focusMode);
    return () => document.body.classList.remove('focus-mode');
  }, [focusMode]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      sectionRef.current?.requestFullscreen?.();
    }
  };

  return (
    <section
      className={`section lab-section${screenshotFrame ? ' screenshot-active' : ''}`}
      id="laboratory"
      ref={sectionRef}
      style={{ paddingLeft: 0, paddingRight: 0, maxWidth: 'none' }}
    >
      <div className="lab-intro-text">
        <span className="eyebrow-label">ინტერაქტიული ლაბორატორია</span>
        <h2 className="section-heading" style={{ marginTop: 8 }}>
          ვორტექსის ევოლუციის ვიზუალიზაცია
        </h2>
      </div>

      <div className="lab-layout">
        <div className="lab-viewport-col">
          <div
            className="lab-canvas-wrap"
            style={screenshotFrame ? { aspectRatio: ASPECT_RATIO[screenshotFrame], flex: '0 1 auto', margin: '0 auto', maxHeight: '82vh' } : undefined}
          >
            {mode === 'comparison' ? (
              <SplitCompareView />
            ) : (
              <SceneCanvas>
                <div className="lab-overlay-topbar">
                  <div className="glass-panel" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>t = </span>
                    <span className="mono" style={{ color: 'var(--text-primary)' }}>{t.toFixed(3)}</span>
                    <span style={{ color: 'var(--text-tertiary)', marginLeft: 10 }}>T − t = </span>
                    <span className="mono" style={{ color: 'var(--accent-primary)' }}>{(CRITICAL_TIME - t).toFixed(3)}</span>
                    {screenshotFrame && (
                      <span style={{ color: 'var(--text-tertiary)', marginLeft: 10 }}>· {MODE_LABELS[mode]}</span>
                    )}
                  </div>
                  {!screenshotFrame && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setPresentationOpen((v) => !v)}>
                        {presentationOpen ? 'გზამკვლევის დახურვა' : 'გზამკვლევი'}
                      </button>
                      <button className={`btn btn-ghost btn-sm${focusMode ? ' active' : ''}`} onClick={toggleFocusMode}>
                        ფოკუსი
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={toggleFullscreen}>
                        {isFullscreen ? 'გასვლა' : 'სრული ეკრანი'}
                      </button>
                    </div>
                  )}
                  <Legend />
                </div>
                <div className="lab-overlay-bottombar">
                  {screenshotFrame ? (
                    <div className="screenshot-mark">
                      <span>ნავიე-სტოქსის სინგულარობა</span>
                      <span title="სამეცნიერო მოდელი, არა მტკიცების სრული სიმულაცია">⚠ სასწავლო მოდელი</span>
                    </div>
                  ) : presentationOpen ? (
                    <PresentationOverlay onClose={() => setPresentationOpen(false)} />
                  ) : (
                    <ParticleInspector />
                  )}
                </div>
              </SceneCanvas>
            )}
          </div>
          {!screenshotFrame && (
            <div className="lab-live-data-wrap">
              <LiveDataPanel />
            </div>
          )}
        </div>

        <aside className={`lab-sidebar${sheetOpen ? ' sheet-open' : ''}`} aria-label="მართვის პანელი">
          <div className="bottom-sheet-handle" onClick={() => setSheetOpen(false)} />
          <VisualizationModes />
          <SimulationControls />
          <ParameterPanel />
          <ColorModeSelector />
          {mode === 'velocity' && <VectorDensityControl />}
          <CameraPresets />
          <div className="side-panel-block">
            <div className="side-panel-title">
              <span>დამატებითი ფენები</span>
            </div>
            <button className={`btn btn-sm${annotationsEnabled ? ' active' : ''}`} style={{ width: '100%' }} onClick={toggleAnnotations}>
              ანოტაციები
            </button>
          </div>
          <ScreenshotModeControl frame={screenshotFrame} onChange={setScreenshotFrame} />
          <QualityControl />
        </aside>
      </div>

      {sheetOpen && <div className="bottom-sheet-backdrop" onClick={() => setSheetOpen(false)} />}
      {(labInView || sheetOpen) && (
        <button
          className="btn btn-primary mobile-sheet-toggle mobile-sheet-toggle-btn"
          onClick={() => setSheetOpen((v) => !v)}
          aria-expanded={sheetOpen}
        >
          {sheetOpen ? 'დახურვა' : 'მართვის პანელი'}
        </button>
      )}
    </section>
  );
}
