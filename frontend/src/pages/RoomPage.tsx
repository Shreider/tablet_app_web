import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import App from '../App';
import { PageState } from '../components/PageState';
import { useRoomSchedule } from '../hooks/useRoomSchedule';
import { useApiSettings } from '../components/ApiSettings';

function RoomView({ roomId, endpoint }: { roomId: string; endpoint: string }): JSX.Element {
  const { data, loading, error, notFound, refresh } = useRoomSchedule(roomId, endpoint);
  useEffect(() => {
    document.title = `Sala ${roomId} · Plan zajęć`;
    return () => {
      document.title = 'Plan sali';
    };
  }, [roomId]);

  if (loading && !data)
    return (
      <PageState loading title={`Sala ${roomId}`} message="Przygotowujemy dzisiejszy plan zajęć…" />
    );
  if (!data)
    return (
      <PageState
        title={notFound ? 'Nie znaleźliśmy tej sali' : 'Plan jest chwilowo niedostępny'}
        message={
          notFound
            ? `Sala ${roomId} nie jest dostępna. Skontaktuj się z administratorem stanowiska.`
            : (error ?? 'Spróbuj ponownie za chwilę.')
        }
        onRetry={refresh}
      />
    );
  return <App data={data} error={error} onRefresh={refresh} />;
}

export function RoomPage(): JSX.Element {
  const { roomId = '' } = useParams<{ roomId: string }>();
  const { endpoint } = useApiSettings();
  return <RoomView key={JSON.stringify([roomId, endpoint])} roomId={roomId} endpoint={endpoint} />;
}
