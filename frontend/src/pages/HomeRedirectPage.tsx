import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ApiError, fetchRooms } from '../api/roomApi';

interface HomeState {
  isLoading: boolean;
  errorMessage: string | null;
  firstRoomId: string | null;
}

const initialState: HomeState = {
  isLoading: true,
  errorMessage: null,
  firstRoomId: null
};

export function HomeRedirectPage(): JSX.Element {
  const [homeState, setHomeState] = useState<HomeState>(initialState);

  useEffect(() => {
    const abortController = new AbortController();

    const loadFirstRoom = async () => {
      setHomeState(initialState);

      try {
        const payload = await fetchRooms(abortController.signal);
        const firstRoom = payload.rooms[0] ?? null;

        if (!abortController.signal.aborted) {
          setHomeState({
            isLoading: false,
            errorMessage: firstRoom ? null : 'Brak sal w bazie danych.',
            firstRoomId: firstRoom?.roomId ?? null
          });
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        const message =
          error instanceof ApiError
            ? error.message
            : 'Nie udalo sie pobrac listy sal z backendu.';

        setHomeState({
          isLoading: false,
          errorMessage: message,
          firstRoomId: null
        });
      }
    };

    void loadFirstRoom();

    return () => {
      abortController.abort();
    };
  }, []);

  if (homeState.firstRoomId) {
    return <Navigate to={`/room/${encodeURIComponent(homeState.firstRoomId)}`} replace />;
  }

  const title = homeState.isLoading ? 'Ladowanie danych' : 'Nie mozna otworzyc widoku sali';
  const message = homeState.isLoading
    ? 'Pobieranie listy sal z bazy danych...'
    : homeState.errorMessage ?? 'Brak danych sal.';

  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <section className="w-full max-w-[760px] rounded-panel border border-border bg-surface/90 p-8 text-center shadow-panel">
        <h1 className="m-0 text-3xl font-bold text-foreground">{title}</h1>
        <p className="mt-4 text-lg text-muted">{message}</p>
      </section>
    </div>
  );
}
