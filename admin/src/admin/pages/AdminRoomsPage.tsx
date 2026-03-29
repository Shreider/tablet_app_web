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
import type { AdminRoom, AdminRoomsOptionsResponse, AdminScheduleEntry, AdminWingOption } from '../types';

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
  buildingId: 0,
  wingId: 0,
  floorId: 0
};

const filterWingsByBuilding = (wings: AdminWingOption[], buildingId: number): AdminWingOption[] => {
  if (!buildingId) {
    return wings;
  }

  return wings.filter((wing) => wing.buildingId === buildingId);
};

export function AdminRoomsPage(): JSX.Element {
  const { token } = useAdminAuth();

  const [state, setState] = useState<RoomsState>(initialRoomsState);
  const [options, setOptions] = useState<AdminRoomsOptionsResponse>({
    rooms: [],
    buildings: [],
    wings: [],
    floors: []
  });

  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [buildingId, setBuildingId] = useState<number | null>(null);
  const [wingId, setWingId] = useState<number | null>(null);
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
        buildingId,
        wingId,
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
      const message = error instanceof AdminApiError ? error.message : 'Nie udalo sie pobrac listy sal.';

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
      setOptions({ rooms: [], buildings: [], wings: [], floors: [] });
    }
  };

  useEffect(() => {
    void loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    void loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, search, buildingId, wingId, floorId, sortBy, sortOrder]);

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
      buildingId: options.buildings[0]?.id ?? 0,
      wingId: options.wings[0]?.id ?? 0,
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
      buildingId: room.buildingId,
      wingId: room.wingId,
      floorId: room.floorId
    });
    setFormError(null);
    setFormOpen(true);
  };

  const validateRoomForm = (payload: RoomFormPayload): string | null => {
    if (!payload.roomCode.trim()) return 'Podaj kod sali.';
    if (!payload.displayName.trim()) return 'Podaj nazwe wyswietlana sali.';
    if (!payload.buildingId) return 'Wybierz budynek z listy.';
    if (!payload.wingId) return 'Wybierz skrzydlo z listy.';
    if (!payload.floorId) return 'Wybierz pietro z listy.';
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
        setFlashMessage('Sala zostala dodana.');
      } else if (editingRoom) {
        await updateAdminRoom(token, editingRoom.id, formState);
        setFlashMessage(`Sala ${editingRoom.roomCode} zostala zaktualizowana.`);
      }

      setFormOpen(false);
      await Promise.all([loadRooms(), loadOptions()]);
    } catch (error) {
      const message =
        error instanceof AdminApiError ? error.message : 'Nie udalo sie zapisac zmian sali.';
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
        error instanceof AdminApiError ? error.message : 'Nie udalo sie pobrac szczegolow sali.';
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
          ? `Usunieto sale i ${response.relatedEntriesDeleted} powiazanych wpisow.`
          : `Usunieto sale ${deleteTarget.roomCode}.`
      );
      await Promise.all([loadRooms(), loadOptions()]);
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 409) {
        setDeleteError(
          'Sala ma powiazane wpisy. Zaznacz usuniecie kaskadowe, aby usunac sale razem z harmonogramem.'
        );
        setDeleteCascade(true);
      } else {
        setDeleteError(error instanceof AdminApiError ? error.message : 'Nie udalo sie usunac sali.');
      }
    } finally {
      setDeleteBusy(false);
    }
  };

  const totalLabel = useMemo(() => `Lacznie rekordow: ${state.total}`, [state.total]);
  const filteredWings = useMemo(
    () => filterWingsByBuilding(options.wings, buildingId ?? 0),
    [options.wings, buildingId]
  );
  const formWings = useMemo(
    () => filterWingsByBuilding(options.wings, formState.buildingId),
    [options.wings, formState.buildingId]
  );

  return (
    <div className="space-y-4">
      <AdminPanel
        title="Encja: rooms"
        subtitle={totalLabel}
        actions={
          <button type="button" className="admin-btn admin-btn-primary" onClick={openCreateForm}>
            Dodaj sale
          </button>
        }
      >
        <div className="grid gap-3 pb-4 md:grid-cols-2 xl:grid-cols-7">
          <label className="admin-field xl:col-span-2">
            <span className="admin-label">Wyszukiwarka</span>
            <div className="flex gap-2">
              <input
                className="admin-input"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="kod, nazwa, budynek, skrzydlo"
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
          </label>

          <label className="admin-field">
            <span className="admin-label">Budynek</span>
            <select
              className="admin-input"
              value={buildingId ?? ''}
              onChange={(event) => {
                const nextBuildingId = event.target.value ? Number(event.target.value) : null;
                setPage(1);
                setBuildingId(nextBuildingId);
                setWingId(null);
              }}
            >
              <option value="">Wszystkie</option>
              {options.buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            <span className="admin-label">Skrzydlo</span>
            <select
              className="admin-input"
              value={wingId ?? ''}
              onChange={(event) => {
                setPage(1);
                setWingId(event.target.value ? Number(event.target.value) : null);
              }}
            >
              <option value="">Wszystkie</option>
              {filteredWings.map((wing) => (
                <option key={wing.id} value={wing.id}>
                  {wing.name} ({wing.buildingName})
                </option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            <span className="admin-label">Pietro</span>
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
              <option value="buildingName">Budynek</option>
              <option value="entriesCount">Liczba wpisow</option>
              <option value="updatedAt">Data modyfikacji</option>
            </select>
          </label>

          <label className="admin-field">
            <span className="admin-label">Kierunek</span>
            <select
              className="admin-input"
              value={sortOrder}
              onChange={(event) => {
                setPage(1);
                setSortOrder(event.target.value as 'asc' | 'desc');
              }}
            >
              <option value="asc">Rosnaco</option>
              <option value="desc">Malejaco</option>
            </select>
          </label>
        </div>

        {flashMessage ? (
          <p className="mb-3 rounded-xl border border-[#2c5b45] bg-[#102a20] px-3 py-2 text-sm text-[#a7e7c6]">
            {flashMessage}
          </p>
        ) : null}

        {state.loading ? (
          <LoadingBlock message="Ladowanie listy sal..." />
        ) : state.error ? (
          <ErrorBlock title="Blad listy sal" message={state.error} onRetry={() => void loadRooms()} />
        ) : state.rows.length === 0 ? (
          <EmptyBlock message="Brak rekordow dla wybranych filtrow." />
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Kod</th>
                    <th>Nazwa</th>
                    <th>Budynek</th>
                    <th>Skrzydlo</th>
                    <th>Pietro</th>
                    <th>Wpisy</th>
                    <th>Aktualizacja</th>
                    <th>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {state.rows.map((room) => (
                    <tr key={room.id}>
                      <td>{room.roomCode}</td>
                      <td>{room.displayName}</td>
                      <td>{room.buildingName}</td>
                      <td>{room.wingName}</td>
                      <td>{room.floorLabel}</td>
                      <td>{room.entriesCount}</td>
                      <td>{formatDateTime(room.updatedAt)}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            onClick={() => void openDetails(room)}
                          >
                            Szczegoly
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
                            Usun
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls page={state.page} totalPages={state.totalPages} onPageChange={setPage} />
          </>
        )}
      </AdminPanel>

      <ConfirmModal
        open={formOpen}
        title={formMode === 'create' ? 'Dodaj nowa sale' : `Edytuj sale ${editingRoom?.roomCode ?? ''}`}
        message="Wprowadz dane sali. Powiazania lokalizacji wybieraj z predefiniowanych list."
        confirmLabel={formMode === 'create' ? 'Dodaj sale' : 'Zapisz zmiany'}
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
              onChange={(event) => setFormState((prev) => ({ ...prev, roomCode: event.target.value }))}
              placeholder="np. A12"
              required
            />
          </label>
          <label className="admin-field">
            <span className="admin-label">Nazwa wyswietlana</span>
            <input
              className="admin-input"
              value={formState.displayName}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, displayName: event.target.value }))
              }
              required
            />
          </label>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="admin-field">
              <span className="admin-label">Budynek</span>
              <select
                className="admin-input"
                value={formState.buildingId}
                onChange={(event) => {
                  const nextBuildingId = Number(event.target.value);
                  const nextWings = filterWingsByBuilding(options.wings, nextBuildingId);
                  setFormState((prev) => ({
                    ...prev,
                    buildingId: nextBuildingId,
                    wingId: nextWings.some((wing) => wing.id === prev.wingId)
                      ? prev.wingId
                      : (nextWings[0]?.id ?? 0)
                  }));
                }}
                required
              >
                <option value={0}>Wybierz budynek</option>
                {options.buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span className="admin-label">Skrzydlo</span>
              <select
                className="admin-input"
                value={formState.wingId}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, wingId: Number(event.target.value) }))
                }
                required
              >
                <option value={0}>Wybierz skrzydlo</option>
                {formWings.map((wing) => (
                  <option key={wing.id} value={wing.id}>
                    {wing.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span className="admin-label">Pietro</span>
              <select
                className="admin-input"
                value={formState.floorId}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, floorId: Number(event.target.value) }))
                }
                required
              >
                <option value={0}>Wybierz pietro</option>
                {options.floors.map((floor) => (
                  <option key={floor.id} value={floor.id}>
                    {floor.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {formError ? (
            <p className="m-0 rounded-lg border border-[#4b2d3a] bg-[#2b1821] px-3 py-2 text-sm text-[#ffc5d4]">
              {formError}
            </p>
          ) : null}
        </form>
      </ConfirmModal>

      <ConfirmModal
        open={detailsOpen}
        title={detailsState.room ? `Szczegoly sali ${detailsState.room.roomCode}` : 'Szczegoly sali'}
        message="Powiazane wpisy harmonogramu dla wybranej sali."
        confirmLabel="Zamknij"
        cancelLabel="Zamknij"
        onCancel={() => setDetailsOpen(false)}
        onConfirm={() => setDetailsOpen(false)}
      >
        {detailsState.loading ? (
          <LoadingBlock message="Ladowanie szczegolow sali..." />
        ) : detailsState.error ? (
          <ErrorBlock title="Blad szczegolow" message={detailsState.error} />
        ) : detailsState.room ? (
          <div className="space-y-3">
            <div className="grid gap-2 rounded-xl border border-[#2d4568] bg-[#0f1d31] p-3 text-sm text-[#b8cae8] md:grid-cols-2">
              <p className="m-0">
                Nazwa: <strong>{detailsState.room.displayName}</strong>
              </p>
              <p className="m-0">
                Budynek: <strong>{detailsState.room.buildingName}</strong>
              </p>
              <p className="m-0">
                Skrzydlo: <strong>{detailsState.room.wingName}</strong>
              </p>
              <p className="m-0">
                Pietro: <strong>{detailsState.room.floorLabel}</strong>
              </p>
              <p className="m-0">
                Utworzono: <strong>{formatDate(detailsState.room.createdAt)}</strong>
              </p>
              <p className="m-0">
                Aktualizacja: <strong>{formatDateTime(detailsState.room.updatedAt)}</strong>
              </p>
            </div>

            {detailsState.entries.length === 0 ? (
              <EmptyBlock message="Brak wpisow harmonogramu dla tej sali." />
            ) : (
              <div className="max-h-[260px] overflow-y-auto rounded-xl border border-[#293e5e]">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Godz.</th>
                      <th>Tytul</th>
                      <th>Typ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailsState.entries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.eventDate}</td>
                        <td>
                          {entry.startTime}-{entry.endTime}
                        </td>
                        <td>{entry.title}</td>
                        <td>{entry.classTypeName}</td>
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
        title={deleteTarget ? `Usun sale ${deleteTarget.roomCode}` : 'Usun sale'}
        message="Operacja usuwa rekord sali. Przy usunieciu kaskadowym usuniete zostana tez wpisy harmonogramu tej sali."
        confirmLabel="Usun rekord"
        onCancel={() => {
          if (!deleteBusy) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={() => void confirmDeleteRoom()}
        destructive
        busy={deleteBusy}
      >
        <label className="flex items-center gap-2 text-sm text-[#b9cbe8]">
          <input
            type="checkbox"
            checked={deleteCascade}
            onChange={(event) => setDeleteCascade(event.target.checked)}
          />
          Wymus usuniecie kaskadowe powiazanych wpisow.
        </label>
        {deleteError ? (
          <p className="mt-2 rounded-lg border border-[#4b2d3a] bg-[#2b1821] px-3 py-2 text-sm text-[#ffc5d4]">
            {deleteError}
          </p>
        ) : null}
      </ConfirmModal>
    </div>
  );
}
