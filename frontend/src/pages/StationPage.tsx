import { Navigate } from 'react-router-dom';
import { PageState } from '../components/PageState';
import { defaultRoomId, defaultRoomPath } from '../lib/station';

export function StationPage(): JSX.Element {
  if (defaultRoomId) return <Navigate to={defaultRoomPath} replace />;
  return (
    <PageState
      title="Stanowisko nie ma przypisanej sali"
      message="Poproś administratora o przypisanie sali do tego stanowiska."
    />
  );
}
