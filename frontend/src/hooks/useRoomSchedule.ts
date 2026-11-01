import { useEffect, useState } from 'react';
import { ApiError, fetchRoomSchedule } from '../api/roomApi';
import type { RoomScheduleResponse } from '../types/schedule';
import { liveSchedule } from '../../shared/roomSchedule.mjs';
import { useNow } from './useNow';

interface RoomState {
  data: RoomScheduleResponse | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
}

export function useRoomSchedule(roomId: string, endpoint: string) {
  const now = useNow();
  const [state, setState] = useState<RoomState>({
    data: null,
    loading: true,
    error: null,
    notFound: false
  });
  const [request, setRequest] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    let forceRefresh = request > 0;

    async function load() {
      if (pending) return;
      pending = true;
      setState((previous) => ({
        ...previous,
        loading: !previous.data,
        error: null
      }));
      const requestController = new AbortController();
      const cancelRequest = () => requestController.abort();
      controller.signal.addEventListener('abort', cancelRequest, { once: true });
      const timeout = window.setTimeout(cancelRequest, 15_000);
      try {
        const data = await fetchRoomSchedule(roomId, requestController.signal, endpoint, forceRefresh);
        if (!controller.signal.aborted)
          setState({ data, loading: false, error: null, notFound: false });
      } catch (error) {
        if (!controller.signal.aborted) {
          setState((previous) => ({
            ...previous,
            data: error instanceof ApiError && [401, 403, 404].includes(error.status) ? null : previous.data,
            loading: false,
            notFound: error instanceof ApiError && error.status === 404,
            error:
              error instanceof ApiError
                ? error.message
                : 'Nie udało się odświeżyć planu. Sprawdź połączenie z siecią.'
          }));
        }
      } finally {
        window.clearTimeout(timeout);
        controller.signal.removeEventListener('abort', cancelRequest);
        pending = false;
        forceRefresh = false;
      }
    }

    const refreshWhenVisible = () => {
      if (!document.hidden) void load();
    };
    void load();
    const timer = window.setInterval(refreshWhenVisible, 60_000);
    window.addEventListener('online', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('room-tablet-cache-updated', refreshWhenVisible);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener('online', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('room-tablet-cache-updated', refreshWhenVisible);
    };
  }, [roomId, endpoint, request]);

  return {
    ...state,
    data: state.data ? liveSchedule(state.data, now, state.data.cache?.timeZone) : null,
    refresh: () => setRequest((value) => value + 1)
  };
}
