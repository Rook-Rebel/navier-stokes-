import { useFrame } from '@react-three/fiber';
import { useSimStore } from '../../hooks/useSimStore';

/** Advances the shared simulation time each rendered frame while playing. Lives inside the Canvas so it is driven by the render loop, not a separate timer. */
export function SimulationClock() {
  useFrame((_, delta) => {
    useSimStore.getState().advanceTime(Math.min(delta, 0.05));
  });
  return null;
}
