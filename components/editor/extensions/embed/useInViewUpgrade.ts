import { useEffect, useState, type RefObject } from "react";

/**
 * One-way "has this element come near the viewport yet?" latch.
 *
 * Returns `false` until the observed element first intersects (with a generous
 * rootMargin so it upgrades slightly *before* scrolling into view), then stays
 * `true` forever and disconnects. Used to keep heavy embed content (a full
 * ReactFlow instance / a dynamic table pipeline) unmounted until it's actually
 * needed, while a cheap snapshot paints in its place.
 */
export function useInViewUpgrade(
  ref: RefObject<Element | null>,
  options?: { rootMargin?: string }
): boolean {
  const [inView, setInView] = useState(false);
  const rootMargin = options?.rootMargin ?? "300px";

  useEffect(() => {
    if (inView) return; // latched — never downgrade
    const el = ref.current;
    if (!el) return;

    // SSR / older browsers: upgrade immediately so we never strand the preview.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, inView, rootMargin]);

  return inView;
}

export default useInViewUpgrade;
