import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/hero/Hero';
import { Laboratory } from './components/layout/Laboratory';
import { ChartsSection } from './components/charts/ChartsSection';
import { EquationSection } from './components/education/EquationSection';
import { StepByStepMode } from './components/education/StepByStepMode';
import { WhyDifficultSection } from './components/education/WhyDifficultSection';
import { EnergyExplanation } from './components/education/EnergyExplanation';
import { ComparisonSection } from './components/education/ComparisonSection';
import { NormalVsSingularSection } from './components/education/NormalVsSingularSection';
import { ScientificStatusSection } from './components/education/ScientificStatusSection';
import { SourcesSection } from './components/education/SourcesSection';
import { useAutoQuality } from './hooks/useAutoQuality';

export default function App() {
  useAutoQuality();
  return (
    <div className="app-shell">
      <Header />
      <main>
        <Hero />
        <Laboratory />
        <ChartsSection />
        <EquationSection />
        <StepByStepMode />
        <WhyDifficultSection />
        <EnergyExplanation />
        <ComparisonSection />
        <NormalVsSingularSection />
        <ScientificStatusSection />
        <SourcesSection />
      </main>
      <Footer />
    </div>
  );
}
