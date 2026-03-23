import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import App from '../App';
import { ApiError, fetchRoomSchedule } from '../api/roomApi';
import type { RoomScheduleResponse } from '../types/schedule';

interface RequestState {
  isLoading: boolean;
  errorMessage: string | null;
  statusCode: number | null;
  data: RoomScheduleResponse | null;
}

const initialState: RequestState = {
  isLoading: true,
  errorMessage: null,
  statusCode: null,
  data: null
};

const FullScreenInfo = ({ title, message }: { title: string; message: string }): JSX.Element => (
  <div className="flex min-h-screen items-center justify-center p-5">
    <section className="w-full max-w-[760px] rounded-panel border border-border bg-surface/90 p-8 text-center shadow-panel">
      <h1 className="m-0 text-3xl font-bold text-foreground">{title}</h1>
      <p className="mt-4 text-lg text-muted">{message}</p>
    </section>
  </div>
);

export function RoomPage(): JSX.Element {
  const { roomId } = useParams<{ roomId: string }>();
  const normalizedRoomId = roomId?.trim() ?? '';
  const [requestState, setRequestState] = useState<RequestState>(initialState);

  useEffect(() => {
    if (!normalizedRoomId) {
      setRequestState({
        isLoading: false,
        errorMessage: 'Brak numeru sali w adresie URL.',
        statusCode: 400,
        data: null
      });
      return;
    }

    const abortController = new AbortController();

    const loadRoom = async () => {
      setRequestState(initialState);

      try {
        const response = await fetchRoomSchedule(normalizedRoomId, abortController.signal);

        if (!abortController.signal.aborted) {
          setRequestState({
            isLoading: false,
            errorMessage: null,
            statusCode: null,
            data: response
          });
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        if (error instanceof ApiError) {
          setRequestState({
            isLoading: false,
            errorMessage: error.message,
            statusCode: error.status,
            data: null
          });
          return;
        }

        setRequestState({
          isLoading: false,
          errorMessage: 'Nie udalo sie polaczyc z backendem.',
          statusCode: 500,
          data: null
        });
      }
    };

    void loadRoom();

    return () => {
      abortController.abort();
    };
  }, [normalizedRoomId]);

  const primaryLecture = useMemo(() => {
    if (!requestState.data) {
      return null;
    }

    return (
      requestState.data.currentLecture ??
      requestState.data.nextLecture ??
      requestState.data.schedule[0] ??
      null
    );
  }, [requestState.data]);

  if (requestState.isLoading) {
    return <FullScreenInfo title="Ladowanie sali" message={`Pobieranie harmonogramu dla sali ${normalizedRoomId}...`} />;
  }

  if (requestState.errorMessage) {
    if (requestState.statusCode === 404) {
      return (
        <FullScreenInfo
          title="Sala nie istnieje"
          message={`Sala ${normalizedRoomId} nie zostala znaleziona. Sprawdz numer sali i sprobuj ponownie.`}
        />
      );
    }

    return <FullScreenInfo title="Blad" message={requestState.errorMessage} />;
  }

  if (!requestState.data) {
    return <FullScreenInfo title="Brak danych" message="Backend nie zwrocil danych dla tej sali." />;
  }

  return (
    <App
      room={requestState.data.room}
      schedule={requestState.data.schedule}
      currentLecture={primaryLecture}
    />
  );
}
