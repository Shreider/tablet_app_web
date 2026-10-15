import { useEffect, useState } from 'react';
import {
  AdminApiError,
  fetchAdminConflicts,
  fetchAdminScheduleOptions,
  updateAdminScheduleEntry,
  type ScheduleEntryFormPayload
} from '../api/adminApi';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { AdminDialog } from '../components/AdminDialog';
import { AdminPanel, EmptyBlock, ErrorBlock, LoadingBlock } from '../components/AdminUi';
import type { AdminConflictEntry, AdminConflictPair, AdminScheduleOptionsResponse } from '../types';

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

interface EditState {
  open: boolean;
  entryId: number | null;
  form: ScheduleEntryFormPayload;
  saving: boolean;
  error: string | null;
}

const initialEditState: EditState = {
  open: false,
  entryId: null,
  form: initialEntryForm,
  saving: false,
  error: null
};

const validateForm = (payload: ScheduleEntryFormPayload): string | null => {
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

export function AdminConflictsPage(): JSX.Element {
  const { token } = useAdminAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<AdminConflictPair[]>([]);
  const [reloadNonce, setReloadNonce] = useState(0);

  const [options, setOptions] = useState<AdminScheduleOptionsResponse>({
    rooms: [],
    lecturers: [],
    studentGroups: [],
    classTypes: [],
    subjects: []
  });

  const [editState, setEditState] = useState<EditState>(initialEditState);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const abortController = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const payload = await fetchAdminConflicts(token);
        if (!abortController.signal.aborted) {
          setConflicts(payload.conflicts);
          setLoading(false);
        }
      } catch (err) {
        if (abortController.signal.aborted) return;
        const msg =
          err instanceof AdminApiError ? err.message : 'Nie udało się pobrać listy konfliktów.';
        setError(msg);
        setLoading(false);
      }
    };

    void load();
    return () => abortController.abort();
  }, [token, reloadNonce]);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        const payload = await fetchAdminScheduleOptions(token);
        setOptions(payload);
      } catch {
        // keep empty options
      }
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!flashMessage) return;
    const t = window.setTimeout(() => setFlashMessage(null), 2800);
    return () => window.clearTimeout(t);
  }, [flashMessage]);

  const openEdit = (entry: AdminConflictEntry) => {
    setEditState({
      open: true,
      entryId: entry.id,
      form: {
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
      },
      saving: false,
      error: null
    });
  };

  const closeEdit = () => setEditState(initialEditState);

  const handleFormChange = (field: keyof ScheduleEntryFormPayload, value: string | number) => {
    setEditState((prev) => ({ ...prev, form: { ...prev.form, [field]: value } }));
  };

  const submitEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !editState.entryId) return;

    const validationMsg = validateForm(editState.form);
    if (validationMsg) {
      setEditState((prev) => ({ ...prev, error: validationMsg }));
      return;
    }

    setEditState((prev) => ({ ...prev, saving: true, error: null }));
    try {
      await updateAdminScheduleEntry(token, editState.entryId, editState.form);
      setFlashMessage(`Wpis #${editState.entryId} został zaktualizowany.`);
      closeEdit();
      setReloadNonce((n) => n + 1);
    } catch (err) {
      const msg = err instanceof AdminApiError ? err.message : 'Nie udało się zapisać wpisu.';
      setEditState((prev) => ({ ...prev, saving: false, error: msg }));
    }
  };

  if (loading) return <LoadingBlock message="Ładowanie konfliktów..." />;

  if (error) {
    return (
      <ErrorBlock
        title="Błąd ładowania"
        message={error}
        onRetry={() => setReloadNonce((n) => n + 1)}
      />
    );
  }

  return (
    <div className="grid gap-4 lg:gap-5">
      {flashMessage && (
        <div className="rounded-xl border border-[#264435] bg-[#0f251c] px-4 py-2 text-sm text-[#a5e8c4]">
          {flashMessage}
        </div>
      )}

      <AdminPanel
        title="Konflikty harmonogramu"
        subtitle={
          conflicts.length === 0
            ? 'Brak wykrytych konfliktów czasowych.'
            : `Wykryto ${conflicts.length} nakładających się ${conflicts.length === 1 ? 'parę' : 'par'} wpisów.`
        }
        actions={
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => setReloadNonce((n) => n + 1)}
          >
            Odśwież
          </button>
        }
      >
        {conflicts.length === 0 ? (
          <EmptyBlock message="Nie wykryto żadnych konfliktów czasowych w harmonogramie." />
        ) : (
          <div className="grid gap-4 py-2">
            {conflicts.map((pair, index) => (
              <ConflictPairCard
                key={`${pair.entryA.id}-${pair.entryB.id}`}
                index={index + 1}
                pair={pair}
                onEdit={openEdit}
              />
            ))}
          </div>
        )}
      </AdminPanel>

      <AdminDialog
        open={editState.open && editState.entryId !== null}
        title={`Edytuj wpis #${editState.entryId ?? ''}`}
        subtitle="Zmień termin lub dane zajęć, aby rozwiązać konflikt."
        onClose={closeEdit}
        busy={editState.saving}
        footer={
          <>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={closeEdit}
              disabled={editState.saving}
            >
              Anuluj
            </button>
            <button
              type="submit"
              form="conflict-entry-form"
              className="admin-btn admin-btn-primary"
              disabled={editState.saving}
            >
              {editState.saving ? 'Zapisywanie…' : 'Zapisz zmiany'}
            </button>
          </>
        }
      >
        <form id="conflict-entry-form" onSubmit={(e) => void submitEdit(e)} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="admin-field">
              <span className="admin-label">Sala</span>
              <select
                className="admin-input"
                value={editState.form.roomId}
                onChange={(e) => handleFormChange('roomId', Number(e.target.value))}
              >
                <option value={0} disabled>
                  Wybierz salę
                </option>
                {options.rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roomCode} — {r.displayName}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span className="admin-label">Data</span>
              <input
                type="date"
                className="admin-input"
                value={editState.form.eventDate}
                onChange={(e) => handleFormChange('eventDate', e.target.value)}
              />
            </label>

            <label className="admin-field">
              <span className="admin-label">Godzina rozpoczęcia</span>
              <input
                type="time"
                className="admin-input"
                value={editState.form.startTime}
                onChange={(e) => handleFormChange('startTime', e.target.value)}
              />
            </label>

            <label className="admin-field">
              <span className="admin-label">Godzina zakończenia</span>
              <input
                type="time"
                className="admin-input"
                value={editState.form.endTime}
                onChange={(e) => handleFormChange('endTime', e.target.value)}
              />
            </label>

            <label className="admin-field">
              <span className="admin-label">Prowadzący</span>
              <select
                className="admin-input"
                value={editState.form.lecturerId}
                onChange={(e) => handleFormChange('lecturerId', Number(e.target.value))}
              >
                <option value={0} disabled>
                  Wybierz prowadzącego
                </option>
                {options.lecturers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span className="admin-label">Grupa</span>
              <select
                className="admin-input"
                value={editState.form.studentGroupId}
                onChange={(e) => handleFormChange('studentGroupId', Number(e.target.value))}
              >
                <option value={0} disabled>
                  Wybierz grupę
                </option>
                {options.studentGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span className="admin-label">Typ zajęć</span>
              <select
                className="admin-input"
                value={editState.form.classTypeId}
                onChange={(e) => handleFormChange('classTypeId', Number(e.target.value))}
              >
                <option value={0} disabled>
                  Wybierz typ zajęć
                </option>
                {options.classTypes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span className="admin-label">Przedmiot</span>
              <select
                className="admin-input"
                value={editState.form.subjectId}
                onChange={(e) => handleFormChange('subjectId', Number(e.target.value))}
              >
                <option value={0} disabled>
                  Wybierz przedmiot
                </option>
                {options.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="admin-field">
            <span className="admin-label">Opis zajęć</span>
            <input
              type="text"
              className="admin-input"
              value={editState.form.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
            />
          </label>

          <label className="admin-field">
            <span className="admin-label">Notatka (opcjonalna)</span>
            <input
              type="text"
              className="admin-input"
              value={editState.form.note}
              onChange={(e) => handleFormChange('note', e.target.value)}
            />
          </label>

          {editState.error && (
            <p role="alert" className="admin-notice admin-notice--error">
              {editState.error}
            </p>
          )}
        </form>
      </AdminDialog>
    </div>
  );
}

function ConflictPairCard({
  index,
  pair,
  onEdit
}: {
  index: number;
  pair: AdminConflictPair;
  onEdit: (entry: AdminConflictEntry) => void;
}): JSX.Element {
  return (
    <div className="admin-conflict-pair">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-[#7b3654] bg-[#311a28] px-2.5 py-0.5 text-xs font-semibold text-[#ffb4d1]">
          Konflikt #{index}
        </span>
        <span className="text-sm text-[#a6bbdb]">
          Sala: <strong className="text-[#eaf3ff]">{pair.entryA.roomCode}</strong>
          {pair.entryA.roomDisplayName !== pair.entryA.roomCode
            ? ` — ${pair.entryA.roomDisplayName}`
            : ''}
        </span>
        <span className="text-sm text-[#a6bbdb]">
          Data: <strong className="text-[#eaf3ff]">{pair.entryA.eventDate}</strong>
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ConflictEntryCard entry={pair.entryA} onEdit={onEdit} />
        <ConflictEntryCard entry={pair.entryB} onEdit={onEdit} />
      </div>
    </div>
  );
}

function ConflictEntryCard({
  entry,
  onEdit
}: {
  entry: AdminConflictEntry;
  onEdit: (entry: AdminConflictEntry) => void;
}): JSX.Element {
  return (
    <div className="admin-conflict-entry">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#a6bbdb]">
          Wpis #{entry.id}
        </span>
        <button
          type="button"
          className="admin-btn admin-btn-secondary text-xs"
          onClick={() => onEdit(entry)}
        >
          Edytuj
        </button>
      </div>

      <div className="grid gap-1.5 text-sm">
        <div className="flex gap-2">
          <span className="min-w-[80px] text-[#a6bbdb]">Czas:</span>
          <span className="font-semibold text-[#ffb4d1]">
            {entry.startTime} – {entry.endTime}
          </span>
        </div>
        <div className="flex gap-2">
          <span className="min-w-[80px] text-[#a6bbdb]">Tytuł:</span>
          <span className="text-[#eaf3ff]">{entry.title}</span>
        </div>
        <div className="flex gap-2">
          <span className="min-w-[80px] text-[#a6bbdb]">Opis:</span>
          <span className="text-[#eaf3ff]">{entry.description}</span>
        </div>
        <div className="flex gap-2">
          <span className="min-w-[80px] text-[#a6bbdb]">Prowadzący:</span>
          <span className="text-[#eaf3ff]">{entry.lecturerName}</span>
        </div>
        <div className="flex gap-2">
          <span className="min-w-[80px] text-[#a6bbdb]">Grupa:</span>
          <span className="text-[#eaf3ff]">{entry.studentGroupName}</span>
        </div>
        <div className="flex gap-2">
          <span className="min-w-[80px] text-[#a6bbdb]">Typ:</span>
          <span className="text-[#eaf3ff]">{entry.classTypeName}</span>
        </div>
        <div className="flex gap-2">
          <span className="min-w-[80px] text-[#a6bbdb]">Przedmiot:</span>
          <span className="text-[#eaf3ff]">
            {entry.subjectCode} — {entry.subjectName}
          </span>
        </div>
        {entry.note && (
          <div className="flex gap-2">
            <span className="min-w-[80px] text-[#a6bbdb]">Notatka:</span>
            <span className="text-[#eaf3ff]">{entry.note}</span>
          </div>
        )}
      </div>
    </div>
  );
}
