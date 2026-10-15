import { useCallback, useEffect, useRef, useState } from 'react';
import type { LectureEvent } from '../types/schedule';
import { CurrentLecturePanel } from './CurrentLecturePanel';

interface LectureNavigatorProps {
  schedule: LectureEvent[];
  currentLecture: LectureEvent | null;
  disabled: boolean;
}

export function LectureNavigator({ schedule, currentLecture, disabled }: LectureNavigatorProps): JSX.Element {
  const [activeId, setActiveId] = useState<string | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef({ amount: 0, lastEvent: 0, lastNavigation: 0, locked: false, scrolledContent: false });
  const selectedIndex = schedule.findIndex((lecture) => lecture.id === activeId);
  const initialIndex = Math.max(0, schedule.findIndex((lecture) => lecture.id === currentLecture?.id));
  const activeIndex = selectedIndex >= 0 ? selectedIndex : initialIndex;
  const lecture = schedule[activeIndex] ?? currentLecture;
  const hasPrevious = activeIndex > 0;
  const hasNext = activeIndex < schedule.length - 1;

  const navigate = useCallback((direction: number) => {
    const nextLecture = schedule[activeIndex + direction];
    if (disabled || !nextLecture) return;
    setActiveId(nextLecture.id);
    wheelRef.current.amount = 0;
    wheelRef.current.locked = true;
    wheelRef.current.scrolledContent = false;
    wheelRef.current.lastNavigation = performance.now();
  }, [activeIndex, disabled, schedule]);

  useEffect(() => {
    if (viewportRef.current) viewportRef.current.scrollTop = 0;
  }, [lecture?.id]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || disabled || schedule.length < 2) return;

    const canScroll = (direction: number): boolean => direction > 0
      ? viewport.scrollTop + viewport.clientHeight < viewport.scrollHeight - 2
      : viewport.scrollTop > 2;
    const canNavigate = (direction: number): boolean => direction > 0 ? hasNext : hasPrevious;

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return;
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
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) * 1.2 && (dy > 0 ? touch.next : touch.previous)) {
        event.preventDefault();
      }
    };
    const onTouchEnd = (event: TouchEvent) => {
      if (!touch || event.changedTouches.length !== 1) return;
      const dx = event.changedTouches[0].clientX - touch.x;
      const dy = touch.y - event.changedTouches[0].clientY;
      if (Math.abs(dy) >= 60 && Math.abs(dy) > Math.abs(dx) * 1.2 && (dy > 0 ? touch.next : touch.previous)) {
        navigate(Math.sign(dy));
      }
      touch = null;
    };
    const onTouchCancel = () => { touch = null; };

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
  }, [disabled, hasNext, hasPrevious, navigate, schedule.length]);

  const buttonClassName = 'inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 rounded-card border border-border bg-surface/90 px-3 py-2 text-sm font-semibold text-foreground transition hover:border-primary/70 hover:bg-primary/15 active:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-35 sm:px-4 sm:text-base';

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div
        ref={viewportRef}
        className="schedule-scrollbar min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain rounded-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        role="region"
        aria-label="Przegląd zajęć"
        aria-describedby={schedule.length > 1 ? 'lecture-navigation-hint' : undefined}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            navigate(event.key === 'ArrowRight' ? 1 : -1);
          }
        }}
      >
        <CurrentLecturePanel key={lecture?.id ?? 'empty'} lecture={lecture} />
      </div>

      {schedule.length > 1 ? (
        <nav className="shrink-0" aria-label="Nawigacja po zajęciach">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <button type="button" className={buttonClassName} disabled={!hasPrevious || disabled} onClick={() => navigate(-1)}>
              <span aria-hidden="true">←</span> Poprzednie
            </button>
            <span className="text-sm font-semibold tabular-nums text-muted" aria-label={`Zajęcia ${activeIndex + 1} z ${schedule.length}`}>
              {activeIndex + 1} / {schedule.length}
            </span>
            <button type="button" className={buttonClassName} disabled={!hasNext || disabled} onClick={() => navigate(1)}>
              Następne <span aria-hidden="true">→</span>
            </button>
          </div>
          <p id="lecture-navigation-hint" className="mb-0 mt-1 text-center text-xs text-muted">
            Przewiń lub przesuń w górę / w dół, aby zmienić zajęcia
          </p>
          <span className="sr-only" role="status">Zajęcia {activeIndex + 1} z {schedule.length}: {lecture?.title}</span>
        </nav>
      ) : null}
    </div>
  );
}
