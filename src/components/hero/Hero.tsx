import { useEffect, useRef, useState } from 'react';
import { HeroVortexBackground } from './HeroVortexBackground';
import { Disclaimer } from '../common/Disclaimer';
import { useSimStore } from '../../hooks/useSimStore';

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const [fade, setFade] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = heroRef.current?.offsetHeight ?? 1;
        setFade(Math.min(Math.max(window.scrollY / (h * 0.7), 0), 1));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const startExperiment = () => {
    scrollTo('laboratory');
    window.setTimeout(() => useSimStore.getState().play(), 600);
  };

  return (
    <section className="hero-cinema" ref={heroRef}>
      <div className="hero-cinema-bg">
        <HeroVortexBackground />
        <div className="hero-cinema-vignette" />
      </div>

      <div
        className="hero-cinema-content"
        style={{ opacity: 1 - fade, transform: `translateY(${fade * -40}px)` }}
      >
        <span className="eyebrow-label">მილენიუმის პრობლემა • 2026</span>
        <h1 className="hero-cinema-title font-cinema">
          ნავიე-სტოქსის
          <br />
          სინგულარობა
        </h1>
        <p className="hero-cinema-subtitle">
          როგორ შეიძლება გლუვმა ნაკადმა სასრულ დროში დაკარგოს სიგლუვე?
        </p>
        <div className="hero-cinema-actions">
          <button className="btn btn-primary" onClick={startExperiment}>
            ექსპერიმენტის დაწყება
          </button>
          <button className="btn btn-ghost" onClick={() => scrollTo('steps')}>
            მექანიზმის ნახვა
          </button>
        </div>
      </div>

      <div className="hero-cinema-disclaimer" style={{ opacity: 1 - fade }}>
        <Disclaimer compact />
      </div>

      <div className="hero-cinema-scrollcue" style={{ opacity: 1 - fade }} aria-hidden="true">
        <span />
      </div>
    </section>
  );
}
