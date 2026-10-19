import { useEffect, useMemo, useState } from 'react';
import {
  AdminApiError,
  createAdminRoom,
  deleteAdminRoom,
  fetchAdminRoomDetails,
  fetchAdminRooms,
  fetchAdminRoomsOptions,
  updateAdminRoom,
  type RoomFormPayload
} from '../api/adminApi';
import { useAdminAuth } from '../auth/AdminAuthContext';
import {
  AdminPanel,
  ConfirmModal,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  PaginationControls,
  formatDate,
  formatDateTime
} from '../components/AdminUi';
import type { AdminRoom, AdminRoomsOptionsResponse, AdminScheduleEntry } from '../types';

interface RoomsState {
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  rows: AdminRoom[];
}

interface RoomDetailsState {
  loading: boolean;
  error: string | null;
  room: AdminRoom | null;
  entries: AdminScheduleEntry[];
}

const initialRoomsState: RoomsState = {
  loading: true,
  error: null,
  page: 1,
  totalPages: 1,
  total: 0,
  rows: []
};

const initialRoomForm: RoomFormPayload = {
  roomCode: '',
  displayName: '',
  floorId: 0
};

export function AdminRoomsPage(): JSX.Element {
  const { token } = useAdminAuth();

  const [state, setState] = useState<RoomsState>(initialRoomsState);
  const [options, setOptions] = useState<AdminRoomsOptionsResponse>({
    rooms: [],
    floors: []
  });

  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [floorId, setFloorId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('roomCode');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingRoom, setEditingRoom] = useState<AdminRoom | null>(null);
  const [formState, setFormState] = useState<RoomFormPayload>(initialRoomForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsState, setDetailsState] = useState<RoomDetailsState>({
    loading: false,
    error: null,
    room: null,
    entries: []
  });

  const [deleteTarget, setDeleteTarget] = useState<AdminRoom | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteCascade, setDeleteCascade] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadRooms = async () => {
    if (!token) {
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const payload = await fetchAdminRooms(token, {
        page,
        limit: 10,
        search,
        floorId,
        sortBy,
        sortOrder
      });

      setState({
        loading: false,
        error: null,
        page: payload.page,
        totalPages: payload.totalPages,
        total: payload.total,
        rows: payload.rows
      });
    } catch (error) {
      const message =
        error instanceof AdminApiError ? error.message : 'Nie udało się pobrać listy sal.';

      setState((prev) => ({
        ...prev,
        loading: false,
        error: message
      }));
    }
  };

  const loadOptions = async () => {
    if (!token) {
      return;
    }

    try {
      const payload = await fetchAdminRoomsOptions(token);
      setOptions(payload);
    } catch {
      setOptions({ rooms: [], floors: [] });
    }
  };

  useEffect(() => {
    void loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    void loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, search, floorId, sortBy, sortOrder]);

  useEffect(() => {
    if (!flashMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setFlashMessage(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [flashMessage]);

  const openCreateForm = () => {
    setFormMode('create');
    setEditingRoom(null);
    setFormState({
      ...initialRoomForm,
      floorId: options.floors[0]?.id ?? 0
    });
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = (room: AdminRoom) => {
    setFormMode('edit');
    setEditingRoom(room);
    setFormState({
      roomCode: room.roomCode,
      displayName: room.displayName,
      floorId: room.floorId
    });
    setFormError(null);
    setFormOpen(true);
  };

  const validateRoomForm = (payload: RoomFormPayload): string | null => {
    if (!payload.roomCode.trim()) return 'Podaj kod sali.';
    if (!payload.displayName.trim()) return 'Podaj nazwę wyświetlaną sali.';
    if (!payload.floorId) return 'Wybierz piętro z listy.';
    return null;
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    const validationMessage = validateRoomForm(formState);
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setFormBusy(true);
    setFormError(null);

    try {
      if (formMode === 'create') {
        await createAdminRoom(token, formState);
        setFlashMessage('Sala została dodana.');
      } else if (editingRoom) {
        await updateAdminRoom(token, editingRoom.id, formState);
        setFlashMessage(`Sala ${editingRoom.roomCode} została zaktualizowana.`);
      }

      setFormOpen(false);
      await Promise.all([loadRooms(), loadOptions()]);
    } catch (error) {
      const message =
        error instanceof AdminApiError ? error.message : 'Nie udało się zapisać zmian sali.';
      setFormError(message);
    } finally {
      setFormBusy(false);
    }
  };

  const openDetails = async (room: AdminRoom) => {
    if (!token) {
      return;
    }

    setDetailsOpen(true);
    setDetailsState({
      loading: true,
      error: null,
      room: null,
      entries: []
    });

    try {
      const payload = await fetchAdminRoomDetails(token, room.id);

      setDetailsState({
        loading: false,
        error: null,
        room: payload.room,
        entries: payload.relatedScheduleEntries
      });
    } catch (error) {
      const message =
        error instanceof AdminApiError ? error.message : 'Nie udało się pobrać szczegółów sali.';
      setDetailsState({
        loading: false,
        error: message,
        room: null,
        entries: []
      });
    }
  };

  const onRequestDeleteRoom = (room: AdminRoom) => {
    setDeleteTarget(room);
    setDeleteCascade(false);
    setDeleteError(null);
  };

  const confirmDeleteRoom = async () => {
    if (!token || !deleteTarget) {
      return;
    }

    setDeleteBusy(true);
    setDeleteError(null);

    try {
      const response = await deleteAdminRoom(token, deleteTarget.id, deleteCascade);
      setDeleteTarget(null);
      setFlashMessage(
        response.relatedEntriesDeleted > 0
          ? `Usunięto salę i ${response.relatedEntriesDeleted} powiązanych wpisów.`
          : `Usunięto salę ${deleteTarget.roomCode}.`
      );
      await Promise.all([loadRooms(), loadOptions()]);
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 409) {
        setDeleteError(
          'Sala ma powiązane wpisy. Zaznacz usunięcie kaskadowe, aby usunąć salę razem z harmonogramem.'
        );
        setDeleteCascade(true);
      } else {
        setDeleteError(
          error instanceof AdminApiError ? error.message : 'Nie udało się usunąć sali.'
        );
      }
    } finally {
      setDeleteBusy(false);
    }
  };

  const totalLabel = useMemo(() => `Liczba pozycji: ${state.total}`, [state.total]);

  return (
    <div className="space-y-4">
      <AdminPanel
        title="Sale"
        subtitle={`${totalLabel}. Zarządzaj listą sal i ich lokalizacją.`}
        actions={
          <button type="button" className="admin-btn admin-btn-primary" onClick={openCreateForm}>
            Dodaj salę
          </button>
        }
      >
        <details className="admin-filters">
          <summary>
            Filtry i sortowanie
            <span className="admin-filter-count">
              {[search, floorId].filter(Boolean).length || 'Wszystkie sale'}
            </span>
          </summary>
          <div className="admin-filter-grid">
            <div className="admin-field admin-search">
              <label htmlFor="room-search" className="admin-label">
                Wyszukiwarka
              </label>
              <div className="flex gap-2">
                <input
                  className="admin-input"
                  id="room-search"
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      setPage(1);
                      setSearch(searchDraft.trim());
                    }
                  }}
                  placeholder="kod, nazwa"
                />
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => {
                    setPage(1);
                    setSearch(searchDraft.trim());
                  }}
                >
                  Szukaj
                </button>
              </div>
            </div>

            <label className="admin-field">
              <span className="admin-label">Piętro</span>
              <select
                className="admin-input"
                value={floorId ?? ''}
                onChange={(event) => {
                  setPage(1);
                  setFloorId(event.target.value ? Number(event.target.value) : null);
                }}
              >
                <option value="">Wszystkie</option>
                {options.floors.map((floor) => (
                  <option key={floor.id} value={floor.id}>
                    {floor.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span className="admin-label">Sortuj po</span>
              <select
                className="admin-input"
                value={sortBy}
                onChange={(event) => {
                  setPage(1);
                  setSortBy(event.target.value);
                }}
              >
                <option value="roomCode">Kod sali</option>
                <option value="displayName">Nazwa</option>
                <option value="entriesCount">Liczba wpisów</option>
                <option value="updatedAt">Data modyfikacji</option>
              </select>
            </label>

            <label className="admin-field">
              <span className="admin-label">Kolejność</span>
              <select
                className="admin-input"
                value={sortOrder}
                onChange={(event) => {
                  setPage(1);
                  setSortOrder(event.target.value as 'asc' | 'desc');
                }}
              >
                <option value="asc">Rosnąco</option>
                <option value="desc">Malejąco</option>
              </select>
            </label>
            <button
              type="button"
              className="admin-btn admin-btn-secondary self-end"
              onClick={() => {
                setSearchDraft('');
                setSearch('');
                setFloorId(null);
                setSortBy('roomCode');
                setSortOrder('asc');
                setPage(1);
              }}
            >
              Wyczyść filtry
            </button>
          </div>
        </details>

        {flashMessage ? (
          <p role="status" className="admin-notice admin-notice--ok mb-3">
            {flashMessage}
          </p>
        ) : null}

        {state.loading ? (
          <LoadingBlock message="Ładowanie listy sal..." />
        ) : state.error ? (
          <ErrorBlock
            title="Błąd listy sal"
            message={state.error}
            onRetry={() => void loadRooms()}
          />
        ) : state.rows.length === 0 ? (
          <EmptyBlock message="Brak rekordów dla wybranych filtrów." />
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Kod</th>
                    <th scope="col">Nazwa</th>
                    <th scope="col">Piętro</th>
                    <th scope="col">Wpisy</th>
                    <th scope="col">Aktualizacja</th>
                    <th scope="col">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {state.rows.map((room) => (
                    <tr key={room.id}>
                      <td data-label="Kod">{room.roomCode}</td>
                      <td data-label="Nazwa">{room.displayName}</td>
                      <td data-label="Piętro">{room.floorLabel}</td>
                      <td data-label="Wpisy">{room.entriesCount}</td>
                      <td data-label="Aktualizacja">{formatDateTime(room.updatedAt)}</td>
                      <td data-label="Akcje">
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            onClick={() => void openDetails(room)}
                          >
                            Szczegóły
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            onClick={() => openEditForm(room)}
                          >
                            Edytuj
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger"
                            onClick={() => onRequestDeleteRoom(room)}
                          >
                            Usuń
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls
              page={state.page}
              totalPages={state.totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </AdminPanel>

      <ConfirmModal
        open={formOpen}
        title={
          formMode === 'create' ? 'Dodaj nową salę' : `Edytuj salę ${editingRoom?.roomCode ?? ''}`
        }
        message="Wprowadź dane sali."
        confirmLabel={formMode === 'create' ? 'Dodaj salę' : 'Zapisz zmiany'}
        onCancel={() => {
          if (!formBusy) {
            setFormOpen(false);
          }
        }}
        onConfirm={() => {
          const formElement = document.getElementById('room-form') as HTMLFormElement | null;
          formElement?.requestSubmit();
        }}
        busy={formBusy}
      >
        <form id="room-form" onSubmit={submitForm} className="grid gap-3">
          <label className="admin-field">
            <span className="admin-label">Kod sali</span>
            <input
              className="admin-input"
              value={formState.roomCode}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, roomCode: event.target.value }))
              }
              placeholder="np. A12"
              required
            />
          </label>
          <label className="admin-field">
            <span className="admin-label">Nazwa wyświetlana</span>
            <input
              className="admin-input"
              value={formState.displayName}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, displayName: event.target.value }))
              }
              required
            />
          </label>

          <label className="admin-field">
            <span className="admin-label">Piętro</span>
            <select
              className="admin-input"
              value={formState.floorId}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, floorId: Number(event.target.value) }))
              }
              required
            >
              <option value={0}>Wybierz piętro</option>
              {options.floors.map((floor) => (
                <option key={floor.id} value={floor.id}>
                  {floor.label}
                </option>
              ))}
            </select>
          </label>

          {formError ? (
            <p role="alert" className="admin-notice admin-notice--error">
              {formError}
            </p>
          ) : null}
        </form>
      </ConfirmModal>

      <ConfirmModal
        open={detailsOpen}
        title={
          detailsState.room ? `Szczegóły sali ${detailsState.room.roomCode}` : 'Szczegóły sali'
        }
        message="Powiązane wpisy harmonogramu dla wybranej sali."
        confirmLabel="Zamknij"
        hideCancel
        onCancel={() => setDetailsOpen(false)}
        onConfirm={() => setDetailsOpen(false)}
      >
        {detailsState.loading ? (
          <LoadingBlock message="Ładowanie szczegółów sali..." />
        ) : detailsState.error ? (
          <ErrorBlock title="Błąd szczegółów" message={detailsState.error} />
        ) : detailsState.room ? (
          <div className="space-y-3">
            <div className="grid gap-2 rounded-xl border border-[#2d4568] bg-[#0f1d31] p-3 text-sm text-[#a6bbdb] md:grid-cols-2">
              <p className="m-0">
                Nazwa: <strong>{detailsState.room.displayName}</strong>
              </p>
              <p className="m-0">
                Piętro: <strong>{detailsState.room.floorLabel}</strong>
              </p>
              <p className="m-0">
                Utworzono: <strong>{formatDate(detailsState.room.createdAt)}</strong>
              </p>
              <p className="m-0">
                Aktualizacja: <strong>{formatDateTime(detailsState.room.updatedAt)}</strong>
              </p>
            </div>

            {detailsState.entries.length === 0 ? (
              <EmptyBlock message="Brak wpisów harmonogramu dla tej sali." />
            ) : (
              <div className="admin-table-wrap max-h-[360px] overflow-y-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th scope="col">Data</th>
                      <th scope="col">Godz.</th>
                      <th scope="col">Tytuł</th>
                      <th scope="col">Typ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailsState.entries.map((entry) => (
                      <tr key={entry.id}>
                        <td data-label="Data">{entry.eventDate}</td>
                        <td data-label="Godz.">
                          {entry.startTime}-{entry.endTime}
                        </td>
                        <td data-label="Tytuł">{entry.title}</td>
                        <td data-label="Typ">{entry.classTypeName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </ConfirmModal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={deleteTarget ? `Usuń salę ${deleteTarget.roomCode}` : 'Usuń salę'}
        message="Operacja usuwa rekord sali. Przy usunięciu kaskadowym usunięte zostaną też wpisy harmonogramu tej sali."
        confirmLabel="Usuń rekord"
        onCancel={() => {
          if (!deleteBusy) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={() => void confirmDeleteRoom()}
        destructive
        busy={deleteBusy}
      >
        <label className="flex items-center gap-2 text-sm text-[#a6bbdb]">
          <input
            type="checkbox"
            checked={deleteCascade}
            onChange={(event) => setDeleteCascade(event.target.checked)}
          />
          Wymuś usunięcie kaskadowe powiązanych wpisów.
        </label>
        {deleteError ? (
          <p role="alert" className="admin-notice admin-notice--error">
            {deleteError}
          </p>
        ) : null}
      </ConfirmModal>
    </div>
  );
}
