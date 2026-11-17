import { ReactNode, useEffect, useRef, useState } from 'react';

interface LazyMountProps {
  children: ReactNode;
  minHeight?: number | string;
  rootMargin?: string;
}

/**
 * Mounts its children only once the placeholder scrolls near the viewport,
 * then keeps them mounted. Several sections on this page each hold their
 * own small `<Canvas>` (comparison panels, the step-by-step preview); most
 * browsers cap the number of simultaneous WebGL contexts, so mounting every
 * canvas eagerly on page load risks the browser silently evicting older
 * contexts ("Context Lost"). Deferring off-screen canvases avoids that.
 */
export function LazyMount({ children, minHeight = 200, rootMargin = '400px' }: LazyMountProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} style={visible ? undefined : { minHeight }}>
      {visible && children}
    </div>
  );
}
