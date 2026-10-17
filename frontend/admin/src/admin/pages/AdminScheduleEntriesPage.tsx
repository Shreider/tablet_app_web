import { useEffect, useMemo, useState } from 'react';
import {
  AdminApiError,
  createAdminScheduleEntry,
  deleteAdminScheduleEntry,
  fetchAdminScheduleEntries,
  fetchAdminScheduleEntryDetails,
  fetchAdminScheduleOptions,
  updateAdminScheduleEntry,
  type ScheduleEntryFormPayload
} from '../api/adminApi';
import { useAdminAuth } from '../auth/AdminAuthContext';
import {
  AdminPanel,
  ConfirmModal,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  PaginationControls,
  formatDateTime
} from '../components/AdminUi';
import type { AdminScheduleEntry, AdminScheduleOptionsResponse } from '../types';

interface EntriesState {
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  rows: AdminScheduleEntry[];
}

const initialEntriesState: EntriesState = {
  loading: true,
  error: null,
  page: 1,
  totalPages: 1,
  total: 0,
  rows: []
};

const initialEntryForm: ScheduleEntryFormPayload = {
  roomId: 0,
  eventDate: '',
  lecturerId: 0,
  studentGroupId: 0,
  classTypeId: 0,
  subjectId: 0,
  startTime: '',
  endTime: '',
  description: '',
  note: ''
};

export function AdminScheduleEntriesPage(): JSX.Element {
  const { token } = useAdminAuth();

  const [state, setState] = useState<EntriesState>(initialEntriesState);
  const [options, setOptions] = useState<AdminScheduleOptionsResponse>({
    rooms: [],
    lecturers: [],
    studentGroups: [],
    classTypes: [],
    subjects: []
  });

  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [roomId, setRoomId] = useState<number | null>(null);
  const [classTypeId, setClassTypeId] = useState<number | null>(null);
  const [lecturerId, setLecturerId] = useState<number | null>(null);
  const [studentGroupId, setStudentGroupId] = useState<number | null>(null);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('eventDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingEntry, setEditingEntry] = useState<AdminScheduleEntry | null>(null);
  const [formState, setFormState] = useState<ScheduleEntryFormPayload>(initialEntryForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsState, setDetailsState] = useState<{
    loading: boolean;
    error: string | null;
    entry: AdminScheduleEntry | null;
  }>({
    loading: false,
    error: null,
    entry: null
  });

  const [deleteTarget, setDeleteTarget] = useState<AdminScheduleEntry | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadEntries = async () => {
    if (!token) {
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const payload = await fetchAdminScheduleEntries(token, {
        page,
        limit: 12,
        search,
        roomId,
        classTypeId,
        lecturerId,
        studentGroupId,
        subjectId,
        dateFrom,
        dateTo,
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
        error instanceof AdminApiError ? error.message : 'Nie udało się pobrać listy wpisów.';

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
      const payload = await fetchAdminScheduleOptions(token);
      setOptions(payload);
    } catch {
      setOptions({
        rooms: [],
        lecturers: [],
        studentGroups: [],
        classTypes: [],
        subjects: []
      });
    }
  };

  useEffect(() => {
    void loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    void loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    token,
    page,
    search,
    roomId,
    classTypeId,
    lecturerId,
    studentGroupId,
    subjectId,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder
  ]);

  useEffect(() => {
    if (!flashMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setFlashMessage(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [flashMessage]);

  const openCreateForm = () => {
    setFormMode('create');
    setEditingEntry(null);
    setFormError(null);
    setFormState({
      roomId: options.rooms[0]?.id ?? 0,
      eventDate: '',
      lecturerId: options.lecturers[0]?.id ?? 0,
      studentGroupId: options.studentGroups[0]?.id ?? 0,
      classTypeId: options.classTypes[0]?.id ?? 0,
      subjectId: options.subjects[0]?.id ?? 0,
      startTime: '',
      endTime: '',
      description: '',
      note: ''
    });
    setFormOpen(true);
  };

  const openEditForm = (entry: AdminScheduleEntry) => {
    setFormMode('edit');
    setEditingEntry(entry);
    setFormError(null);
    setFormState({
      roomId: entry.roomId,
      eventDate: entry.eventDate,
      lecturerId: entry.lecturerId,
      studentGroupId: entry.studentGroupId,
      classTypeId: entry.classTypeId,
      subjectId: entry.subjectId,
      startTime: entry.startTime,
      endTime: entry.endTime,
      description: entry.description,
      note: entry.note ?? ''
    });
    setFormOpen(true);
  };

  const validateEntryForm = (payload: ScheduleEntryFormPayload): string | null => {
    if (!payload.roomId || payload.roomId <= 0) return 'Wybierz salę.';
    if (!payload.eventDate) return 'Podaj datę zajęć.';
    if (!payload.lecturerId || payload.lecturerId <= 0) return 'Wybierz prowadzącego.';
    if (!payload.studentGroupId || payload.studentGroupId <= 0) return 'Wybierz grupę.';
    if (!payload.classTypeId || payload.classTypeId <= 0) return 'Wybierz typ zajęć.';
    if (!payload.subjectId || payload.subjectId <= 0) return 'Wybierz przedmiot.';
    if (!payload.startTime) return 'Podaj godzinę rozpoczęcia.';
    if (!payload.endTime) return 'Podaj godzinę zakończenia.';
    if (payload.startTime >= payload.endTime)
      return 'Godzina rozpoczęcia musi być wcześniej niż zakończenia.';
    if (!payload.description.trim()) return 'Podaj opis zajęć.';
    return null;
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    const validationMessage = validateEntryForm(formState);
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setFormBusy(true);
    setFormError(null);

    try {
      if (formMode === 'create') {
        await createAdminScheduleEntry(token, formState);
        setFlashMessage('Wpis harmonogramu został dodany.');
      } else if (editingEntry) {
        await updateAdminScheduleEntry(token, editingEntry.id, formState);
        setFlashMessage(`Wpis #${editingEntry.id} został zaktualizowany.`);
      }

      setFormOpen(false);
      await Promise.all([loadEntries(), loadOptions()]);
    } catch (error) {
      const message =
        error instanceof AdminApiError
          ? error.message
          : 'Nie udało się zapisać wpisu harmonogramu.';
      setFormError(message);
    } finally {
      setFormBusy(false);
    }
  };

  const openDetails = async (entry: AdminScheduleEntry) => {
    if (!token) {
      return;
    }

    setDetailsOpen(true);
    setDetailsState({
      loading: true,
      error: null,
      entry: null
    });

    try {
      const payload = await fetchAdminScheduleEntryDetails(token, entry.id);

      setDetailsState({
        loading: false,
        error: null,
        entry: payload.entry
      });
    } catch (error) {
      const message =
        error instanceof AdminApiError ? error.message : 'Nie udało się pobrać szczegółów wpisu.';

      setDetailsState({
        loading: false,
        error: message,
        entry: null
      });
    }
  };

  const confirmDeleteEntry = async () => {
    if (!token || !deleteTarget) {
      return;
    }

    setDeleteBusy(true);
    setDeleteError(null);

    try {
      await deleteAdminScheduleEntry(token, deleteTarget.id);
      setDeleteTarget(null);
      setFlashMessage(`Usunięto wpis #${deleteTarget.id}.`);
      await loadEntries();
    } catch (error) {
      const message =
        error instanceof AdminApiError ? error.message : 'Nie udało się usunąć wpisu harmonogramu.';
      setDeleteError(message);
    } finally {
      setDeleteBusy(false);
    }
  };

  const totalLabel = useMemo(() => `Liczba pozycji: ${state.total}`, [state.total]);

  return (
    <div className="space-y-4">
      <AdminPanel
        title="Harmonogram zajęć"
        subtitle={`${totalLabel}. Edytuj terminy, sale i dane zajęć.`}
        actions={
          <button type="button" className="admin-btn admin-btn-primary" onClick={openCreateForm}>
            Dodaj wpis
          </button>
        }
      >
        <details className="admin-filters">
          <summary>
            Filtry i sortowanie
            <span className="admin-filter-count">
              {[
                search,
                roomId,
                lecturerId,
                studentGroupId,
                classTypeId,
                subjectId,
                dateFrom,
                dateTo
              ].filter(Boolean).length || 'Wszystkie zajęcia'}
            </span>
          </summary>
          <div className="admin-filter-grid">
            <label className="admin-field admin-search">
              <span className="admin-label">Wyszukiwarka</span>
              <input
                className="admin-input"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    setPage(1);
                    setSearch(searchDraft.trim());
                  }
                }}
                onBlur={() => {
                  setPage(1);
                  setSearch(searchDraft.trim());
                }}
                placeholder="tytuł, prowadzący, grupa, kod przedmiotu"
              />
            </label>

            <label className="admin-field">
              <span className="admin-label">Sala</span>
              <select
                className="admin-input"
                value={roomId ?? ''}
                onChange={(event) => {
                  setPage(1);
                  setRoomId(event.target.value ? Number(event.target.value) : null);
                }}
              >
                <option value="">Wszystkie</option>
                {options.rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.roomCode} - {room.displayName}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span className="admin-label">Prowadzący</span>
              <select
                className="admin-input"
                value={lecturerId ?? ''}
                onChange={(event) => {
                  setPage(1);
                  setLecturerId(event.target.value ? Number(event.target.value) : null);
                }}
              >
                <option value="">Wszyscy</option>
                {options.lecturers.map((lecturer) => (
                  <option key={lecturer.id} value={lecturer.id}>
                    {lecturer.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span className="admin-label">Grupa</span>
              <select
                className="admin-input"
                value={studentGroupId ?? ''}
                onChange={(event) => {
                  setPage(1);
                  setStudentGroupId(event.target.value ? Number(event.target.value) : null);
                }}
              >
                <option value="">Wszystkie</option>
                {options.studentGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span className="admin-label">Typ zajęć</span>
              <select
                className="admin-input"
                value={classTypeId ?? ''}
                onChange={(event) => {
                  setPage(1);
                  setClassTypeId(event.target.value ? Number(event.target.value) : null);
                }}
              >
                <option value="">Wszystkie</option>
                {options.classTypes.map((classType) => (
                  <option key={classType.id} value={classType.id}>
                    {classType.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span className="admin-label">Przedmiot</span>
              <select
                className="admin-input"
                value={subjectId ?? ''}
                onChange={(event) => {
                  setPage(1);
                  setSubjectId(event.target.value ? Number(event.target.value) : null);
                }}
              >
                <option value="">Wszystkie</option>
                {options.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.code} - {subject.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span className="admin-label">Data od</span>
              <input
                className="admin-input"
                type="date"
                value={dateFrom}
                onChange={(event) => {
                  setPage(1);
                  setDateFrom(event.target.value);
                }}
              />
            </label>

            <label className="admin-field">
              <span className="admin-label">Data do</span>
              <input
                className="admin-input"
                type="date"
                value={dateTo}
                onChange={(event) => {
                  setPage(1);
                  setDateTo(event.target.value);
                }}
              />
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
                <option value="eventDate">Data</option>
                <option value="startTime">Godzina startu</option>
                <option value="endTime">Godzina końca</option>
                <option value="roomCode">Sala</option>
                <option value="lecturerName">Prowadzący</option>
                <option value="classTypeName">Typ zajęć</option>
                <option value="subjectCode">Kod przedmiotu</option>
                <option value="createdAt">Utworzono</option>
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
                setRoomId(null);
                setLecturerId(null);
                setStudentGroupId(null);
                setClassTypeId(null);
                setSubjectId(null);
                setDateFrom('');
                setDateTo('');
                setSortBy('eventDate');
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
          <LoadingBlock message="Ładowanie wpisów harmonogramu..." />
        ) : state.error ? (
          <ErrorBlock
            title="Błąd listy harmonogramu"
            message={state.error}
            onRetry={() => void loadEntries()}
          />
        ) : state.rows.length === 0 ? (
          <EmptyBlock message="Brak rekordów dla wybranych filtrów." />
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Data</th>
                    <th scope="col">Godz.</th>
                    <th scope="col">Sala</th>
                    <th scope="col">Tytuł</th>
                    <th scope="col">Prowadzący</th>
                    <th scope="col">Typ</th>
                    <th scope="col">Grupa</th>
                    <th scope="col">Przedmiot</th>
                    <th scope="col">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {state.rows.map((entry) => (
                    <tr key={entry.id}>
                      <td data-label="Data">{entry.eventDate}</td>
                      <td data-label="Godz.">
                        {entry.startTime}-{entry.endTime}
                      </td>
                      <td data-label="Sala">{entry.roomCode}</td>
                      <td data-label="Tytuł">{entry.title}</td>
                      <td data-label="Prowadzący">{entry.lecturerName}</td>
                      <td data-label="Typ">{entry.classTypeName}</td>
                      <td data-label="Grupa">{entry.studentGroupName}</td>
                      <td data-label="Przedmiot">{entry.subjectCode}</td>
                      <td data-label="Akcje">
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            onClick={() => void openDetails(entry)}
                          >
                            Szczegóły
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            onClick={() => openEditForm(entry)}
                          >
                            Edytuj
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTarget(entry);
                            }}
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
          formMode === 'create'
            ? 'Dodaj wpis harmonogramu'
            : `Edytuj wpis #${editingEntry?.id ?? ''}`
        }
        message="Wybierz salę i dane zajęć, a następnie ustaw termin."
        confirmLabel={formMode === 'create' ? 'Dodaj wpis' : 'Zapisz zmiany'}
        onCancel={() => {
          if (!formBusy) {
            setFormOpen(false);
          }
        }}
        onConfirm={() => {
          const formElement = document.getElementById(
            'schedule-entry-form'
          ) as HTMLFormElement | null;
          formElement?.requestSubmit();
        }}
        busy={formBusy}
      >
        <form id="schedule-entry-form" onSubmit={submitForm} className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="admin-field">
              <span className="admin-label">Sala</span>
              <select
                className="admin-input"
                value={formState.roomId}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, roomId: Number(event.target.value) }))
                }
                required
              >
                <option value={0}>Wybierz salę</option>
                {options.rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.roomCode} - {room.displayName}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span className="admin-label">Data zajęć</span>
              <input
                className="admin-input"
                type="date"
                value={formState.eventDate}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, eventDate: event.target.value }))
                }
                required
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="admin-field">
              <span className="admin-label">Prowadzący</span>
              <select
                className="admin-input"
                value={formState.lecturerId}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, lecturerId: Number(event.target.value) }))
                }
                required
              >
                <option value={0}>Wybierz prowadzącego</option>
                {options.lecturers.map((lecturer) => (
                  <option key={lecturer.id} value={lecturer.id}>
                    {lecturer.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span className="admin-label">Grupa</span>
              <select
                className="admin-input"
                value={formState.studentGroupId}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, studentGroupId: Number(event.target.value) }))
                }
                required
              >
                <option value={0}>Wybierz grupę</option>
                {options.studentGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="admin-field">
              <span className="admin-label">Typ zajęć</span>
              <select
                className="admin-input"
                value={formState.classTypeId}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, classTypeId: Number(event.target.value) }))
                }
                required
              >
                <option value={0}>Wybierz typ zajęć</option>
                {options.classTypes.map((classType) => (
                  <option key={classType.id} value={classType.id}>
                    {classType.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field md:col-span-2">
              <span className="admin-label">Przedmiot</span>
              <select
                className="admin-input"
                value={formState.subjectId}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, subjectId: Number(event.target.value) }))
                }
                required
              >
                <option value={0}>Wybierz przedmiot</option>
                {options.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.code} - {subject.name} ({subject.fieldOfStudyName})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="admin-field">
              <span className="admin-label">Start</span>
              <input
                className="admin-input"
                type="time"
                value={formState.startTime}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, startTime: event.target.value }))
                }
                required
              />
            </label>

            <label className="admin-field">
              <span className="admin-label">Koniec</span>
              <input
                className="admin-input"
                type="time"
                value={formState.endTime}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, endTime: event.target.value }))
                }
                required
              />
            </label>
          </div>

          <label className="admin-field">
            <span className="admin-label">Opis</span>
            <textarea
              className="admin-input min-h-[84px]"
              value={formState.description}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, description: event.target.value }))
              }
              required
            />
          </label>

          <label className="admin-field">
            <span className="admin-label">Notatka (opcjonalnie)</span>
            <input
              className="admin-input"
              value={formState.note}
              onChange={(event) => setFormState((prev) => ({ ...prev, note: event.target.value }))}
            />
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
        title={detailsState.entry ? `Szczegóły wpisu #${detailsState.entry.id}` : 'Szczegóły wpisu'}
        message="Termin, prowadzący i pozostałe dane zajęć."
        confirmLabel="Zamknij"
        hideCancel
        onCancel={() => setDetailsOpen(false)}
        onConfirm={() => setDetailsOpen(false)}
      >
        {detailsState.loading ? (
          <LoadingBlock message="Ładowanie szczegółów wpisu..." />
        ) : detailsState.error ? (
          <ErrorBlock title="Błąd szczegółów" message={detailsState.error} />
        ) : detailsState.entry ? (
          <div className="grid gap-2 rounded-xl border border-[#2d4568] bg-[#0f1d31] p-3 text-sm text-[#a6bbdb] md:grid-cols-2">
            <p className="m-0">
              Sala:{' '}
              <strong>
                {detailsState.entry.roomCode} - {detailsState.entry.roomDisplayName}
              </strong>
            </p>
            <p className="m-0">
              Data: <strong>{detailsState.entry.eventDate}</strong>
            </p>
            <p className="m-0">
              Godziny:{' '}
              <strong>
                {detailsState.entry.startTime}-{detailsState.entry.endTime}
              </strong>
            </p>
            <p className="m-0">
              Typ: <strong>{detailsState.entry.classTypeName}</strong>
            </p>
            <p className="m-0">
              Prowadzący: <strong>{detailsState.entry.lecturerName}</strong>
            </p>
            <p className="m-0">
              Grupa: <strong>{detailsState.entry.studentGroupName}</strong>
            </p>
            <p className="m-0">
              Przedmiot:{' '}
              <strong>
                {detailsState.entry.subjectCode} - {detailsState.entry.subjectName}
              </strong>
            </p>
            <p className="m-0">
              Kierunek: <strong>{detailsState.entry.fieldOfStudyName}</strong>
            </p>
            <p className="m-0 md:col-span-2">
              Tytuł: <strong>{detailsState.entry.title}</strong>
            </p>
            <p className="m-0 md:col-span-2">
              Opis: <strong>{detailsState.entry.description}</strong>
            </p>
            {detailsState.entry.note ? (
              <p className="m-0 md:col-span-2">
                Notatka: <strong>{detailsState.entry.note}</strong>
              </p>
            ) : null}
            <p className="m-0 md:col-span-2">
              Utworzono: <strong>{formatDateTime(detailsState.entry.createdAt)}</strong>
            </p>
          </div>
        ) : null}
      </ConfirmModal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={deleteTarget ? `Usuń wpis #${deleteTarget.id}` : 'Usuń wpis'}
        message="Operacja jest destrukcyjna i usuwa rekord harmonogramu z bazy danych."
        confirmLabel="Usuń wpis"
        onCancel={() => {
          if (!deleteBusy) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={() => void confirmDeleteEntry()}
        destructive
        busy={deleteBusy}
      >
        {deleteError ? (
          <p role="alert" className="admin-notice admin-notice--error">
            {deleteError}
          </p>
        ) : null}
      </ConfirmModal>
    </div>
  );
}
