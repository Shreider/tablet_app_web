import { useCallback, useEffect, useRef, type RefObject } from 'react';

interface GestureOptions {
  activeId: string | undefined;
  disabled: boolean;
  hasPrevious: boolean;
  hasNext: boolean;
  onNavigate: (direction: number) => void;
}

export function useLectureGestures({
  activeId,
  disabled,
  hasPrevious,
  hasNext,
  onNavigate
}: GestureOptions): {
  viewportRef: RefObject<HTMLDivElement>;
  navigate: (direction: number) => void;
} {
  const viewportRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef({
    amount: 0,
    lastEvent: 0,
    lastNavigation: 0,
    locked: false,
    scrolledContent: false
  });

  const navigate = useCallback(
    (direction: number) => {
      if (disabled || !(direction > 0 ? hasNext : hasPrevious)) return;
      onNavigate(direction);
      wheelRef.current.amount = 0;
      wheelRef.current.locked = true;
      wheelRef.current.scrolledContent = false;
      wheelRef.current.lastNavigation = performance.now();
    },
    [disabled, hasNext, hasPrevious, onNavigate]
  );

  useEffect(() => {
    if (viewportRef.current) viewportRef.current.scrollTop = 0;
  }, [activeId]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || disabled || (!hasPrevious && !hasNext)) return;

    const canScroll = (direction: number): boolean =>
      direction > 0
        ? viewport.scrollTop + viewport.clientHeight < viewport.scrollHeight - 2
        : viewport.scrollTop > 2;
    const canNavigate = (direction: number): boolean => (direction > 0 ? hasNext : hasPrevious);

    const onWheel = (event: WheelEvent) => {
      if (
        event.ctrlKey ||
        event.metaKey ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
        !event.deltaY
      )
        return;
      const direction = Math.sign(event.deltaY);
      const now = performance.now();
      const state = wheelRef.current;
      const freshGesture = now - state.lastEvent > 180;
      state.lastEvent = now;

      if (state.locked) {
        if (!freshGesture || now - state.lastNavigation < 450) {
          event.preventDefault();
          return;
        }
        state.locked = false;
      }

      // Let a long description scroll naturally; changing lessons needs a fresh gesture at its edge.
      if (canScroll(direction)) {
        state.amount = 0;
        state.scrolledContent = true;
        return;
      }
      if (!canNavigate(direction)) return;
      event.preventDefault();
      if (state.scrolledContent && !freshGesture) return;
      state.scrolledContent = false;
      if (freshGesture || Math.sign(state.amount) !== direction) state.amount = 0;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1;
      state.amount += event.deltaY * unit;
      if (Math.abs(state.amount) >= 80) navigate(direction);
    };

    let touch: { x: number; y: number; previous: boolean; next: boolean } | null = null;
    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        touch = null;
        return;
      }
      touch = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
        previous: !canScroll(-1) && hasPrevious,
        next: !canScroll(1) && hasNext
      };
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!touch || event.touches.length !== 1) {
        touch = null;
        return;
      }
      const dx = event.touches[0].clientX - touch.x;
      const dy = touch.y - event.touches[0].clientY;
      if (
        Math.abs(dy) > 12 &&
        Math.abs(dy) > Math.abs(dx) * 1.2 &&
        (dy > 0 ? touch.next : touch.previous)
      ) {
        event.preventDefault();
      }
    };
    const onTouchEnd = (event: TouchEvent) => {
      if (!touch || event.changedTouches.length !== 1) return;
      const dx = event.changedTouches[0].clientX - touch.x;
      const dy = touch.y - event.changedTouches[0].clientY;
      if (
        Math.abs(dy) >= 60 &&
        Math.abs(dy) > Math.abs(dx) * 1.2 &&
        (dy > 0 ? touch.next : touch.previous)
      ) {
        navigate(Math.sign(dy));
      }
      touch = null;
    };
    const onTouchCancel = () => {
      touch = null;
    };

    viewport.addEventListener('wheel', onWheel, { passive: false });
    viewport.addEventListener('touchstart', onTouchStart, { passive: true });
    viewport.addEventListener('touchmove', onTouchMove, { passive: false });
    viewport.addEventListener('touchend', onTouchEnd, { passive: true });
    viewport.addEventListener('touchcancel', onTouchCancel);
    return () => {
      viewport.removeEventListener('wheel', onWheel);
      viewport.removeEventListener('touchstart', onTouchStart);
      viewport.removeEventListener('touchmove', onTouchMove);
      viewport.removeEventListener('touchend', onTouchEnd);
      viewport.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [disabled, hasNext, hasPrevious, navigate]);

  return { viewportRef, navigate };
}
