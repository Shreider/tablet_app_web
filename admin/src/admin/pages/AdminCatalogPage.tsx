import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  AdminApiError,
  createAdminReference,
  deleteAdminReference,
  fetchAdminReferenceDependencies,
  fetchAdminReferencesDataset,
  updateAdminReference
} from '../api/adminApi';
import { useAdminAuth } from '../auth/AdminAuthContext';
import {
  adminEntityKeysBySection,
  adminEntityMetaByKey,
  resolveEntityForSection,
  sectionLabelMap,
  type AdminEntitySection
} from '../config/adminNavigation';
import {
  AdminPanel,
  ConfirmModal,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  StatusBadge,
  formatDateTime
} from '../components/AdminUi';
import type {
  AdminReferenceDependency,
  AdminReferenceEntity,
  AdminReferencesDatasetResponse
} from '../types';

interface AdminCatalogPageProps {
  section: AdminEntitySection;
}

interface DatasetState {
  loading: boolean;
  error: string | null;
  data: AdminReferencesDatasetResponse | null;
}

interface ReferenceFormState {
  name: string;
  isActive: boolean;
  buildingId: number;
  label: string;
  sortOrder: number;
  fullName: string;
  code: string;
  fieldOfStudyId: number;
}

interface DeleteState {
  entity: AdminReferenceEntity;
  id: number;
  label: string;
  checkingDependencies: boolean;
  dependencies: AdminReferenceDependency[];
}

const initialFormState: ReferenceFormState = {
  name: '',
  isActive: true,
  buildingId: 0,
  label: '',
  sortOrder: 0,
  fullName: '',
  code: '',
  fieldOfStudyId: 0
};

const initialDatasetState: DatasetState = {
  loading: true,
  error: null,
  data: null
};

const getDatasetCount = (data: AdminReferencesDatasetResponse, entity: AdminReferenceEntity): number => {
  switch (entity) {
    case 'buildings':
      return data.buildings.length;
    case 'wings':
      return data.wings.length;
    case 'floors':
      return data.floors.length;
    case 'lecturers':
      return data.lecturers.length;
    case 'student-groups':
      return data.studentGroups.length;
    case 'class-types':
      return data.classTypes.length;
    case 'fields-of-study':
      return data.fieldsOfStudy.length;
    case 'subjects':
      return data.subjects.length;
    default:
      return 0;
  }
};

export function AdminCatalogPage({ section }: AdminCatalogPageProps): JSX.Element {
  const { token } = useAdminAuth();
  const { entity } = useParams<{ entity: string }>();

  const sectionEntities = adminEntityKeysBySection[section];
  const selectedEntity = resolveEntityForSection(section, entity);
  const defaultEntity = sectionEntities[0];

  if (!selectedEntity) {
    return <Navigate to={adminEntityMetaByKey[defaultEntity].route} replace />;
  }

  const [state, setState] = useState<DatasetState>(initialDatasetState);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formState, setFormState] = useState<ReferenceFormState>(initialFormState);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const loadDataset = async () => {
    if (!token) {
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const payload = await fetchAdminReferencesDataset(token);
      setState({
        loading: false,
        error: null,
        data: payload
      });
    } catch (error) {
      const message = error instanceof AdminApiError ? error.message : 'Nie udalo sie pobrac danych sekcji.';
      setState({
        loading: false,
        error: message,
        data: null
      });
    }
  };

  useEffect(() => {
    void loadDataset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!flashMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setFlashMessage(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [flashMessage]);

  useEffect(() => {
    setFormOpen(false);
    setDeleteState(null);
    setDeleteError(null);
    setFormError(null);
  }, [selectedEntity]);

  const selectedRows = useMemo(() => {
    if (!state.data) {
      return [];
    }

    switch (selectedEntity) {
      case 'buildings':
        return state.data.buildings;
      case 'wings':
        return state.data.wings;
      case 'floors':
        return state.data.floors;
      case 'lecturers':
        return state.data.lecturers;
      case 'student-groups':
        return state.data.studentGroups;
      case 'class-types':
        return state.data.classTypes;
      case 'fields-of-study':
        return state.data.fieldsOfStudy;
      case 'subjects':
        return state.data.subjects;
      default:
        return [];
    }
  }, [selectedEntity, state.data]);

  const activeCount = useMemo(
    () => selectedRows.filter((row) => Boolean((row as { isActive?: boolean }).isActive)).length,
    [selectedRows]
  );

  const currentMeta = adminEntityMetaByKey[selectedEntity];

  const openCreateForm = () => {
    const defaultBuildingId = state.data?.buildings[0]?.id ?? 0;
    const defaultFieldId = state.data?.fieldsOfStudy[0]?.id ?? 0;

    setFormMode('create');
    setEditingId(null);
    setFormError(null);
    setFormState({
      ...initialFormState,
      buildingId: defaultBuildingId,
      fieldOfStudyId: defaultFieldId
    });
    setFormOpen(true);
  };

  const openEditForm = (row: Record<string, unknown>) => {
    setFormMode('edit');
    setEditingId(Number(row.id));
    setFormError(null);
    setFormState({
      name: String(row.name ?? ''),
      isActive: Boolean(row.isActive),
      buildingId: Number(row.buildingId ?? 0),
      label: String(row.label ?? ''),
      sortOrder: Number(row.sortOrder ?? 0),
      fullName: String(row.fullName ?? ''),
      code: String(row.code ?? ''),
      fieldOfStudyId: Number(row.fieldOfStudyId ?? 0)
    });
    setFormOpen(true);
  };

  const resolvePayloadForEntity = (
    entityKey: AdminReferenceEntity,
    data: ReferenceFormState
  ): Record<string, unknown> => {
    switch (entityKey) {
      case 'buildings':
        return { name: data.name.trim(), isActive: data.isActive };
      case 'wings':
        return { name: data.name.trim(), buildingId: data.buildingId, isActive: data.isActive };
      case 'floors':
        return {
          label: data.label.trim(),
          sortOrder: Number(data.sortOrder),
          isActive: data.isActive
        };
      case 'lecturers':
        return { fullName: data.fullName.trim(), isActive: data.isActive };
      case 'student-groups':
        return { name: data.name.trim(), isActive: data.isActive };
      case 'class-types':
        return { name: data.name.trim(), isActive: data.isActive };
      case 'fields-of-study':
        return { name: data.name.trim(), isActive: data.isActive };
      case 'subjects':
        return {
          code: data.code.trim().toUpperCase(),
          name: data.name.trim(),
          fieldOfStudyId: data.fieldOfStudyId,
          isActive: data.isActive
        };
      default:
        return {};
    }
  };

  const validateReferenceForm = (entityKey: AdminReferenceEntity, data: ReferenceFormState): string | null => {
    if (
      entityKey === 'buildings' ||
      entityKey === 'wings' ||
      entityKey === 'student-groups' ||
      entityKey === 'class-types' ||
      entityKey === 'fields-of-study'
    ) {
      if (!data.name.trim()) {
        return 'Pole nazwa jest wymagane.';
      }
    }

    if (entityKey === 'lecturers' && !data.fullName.trim()) {
      return 'Pole imie i nazwisko jest wymagane.';
    }

    if (entityKey === 'wings' && (!data.buildingId || data.buildingId <= 0)) {
      return 'Wybierz budynek.';
    }

    if (entityKey === 'floors') {
      if (!data.label.trim()) {
        return 'Pole etykieta pietra jest wymagane.';
      }
      if (!Number.isInteger(Number(data.sortOrder))) {
        return 'Kolejnosc wyswietlania musi byc liczba calkowita.';
      }
    }

    if (entityKey === 'subjects') {
      if (!data.code.trim()) return 'Pole kod jest wymagane.';
      if (!data.name.trim()) return 'Pole nazwa jest wymagane.';
      if (!data.fieldOfStudyId || data.fieldOfStudyId <= 0) return 'Wybierz kierunek.';
    }

    return null;
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    const validationError = validateReferenceForm(selectedEntity, formState);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = resolvePayloadForEntity(selectedEntity, formState);

    setFormBusy(true);
    setFormError(null);

    try {
      if (formMode === 'create') {
        await createAdminReference(token, selectedEntity, payload);
        setFlashMessage(`Dodano nowa pozycje: ${currentMeta.label}.`);
      } else if (editingId) {
        await updateAdminReference(token, selectedEntity, editingId, payload);
        setFlashMessage(`Zapisano zmiany w sekcji: ${currentMeta.label}.`);
      }

      setFormOpen(false);
      await loadDataset();
    } catch (error) {
      setFormError(
        error instanceof AdminApiError ? error.message : 'Nie udalo sie zapisac danych.'
      );
    } finally {
      setFormBusy(false);
    }
  };

  const requestDelete = async (row: Record<string, unknown>) => {
    if (!token) {
      return;
    }

    const entityKey = selectedEntity;
    const id = Number(row.id);
    const label =
      entityKey === 'lecturers'
        ? String(row.fullName ?? id)
        : entityKey === 'floors'
          ? String(row.label ?? id)
          : entityKey === 'subjects'
            ? `${String(row.code ?? '')} - ${String(row.name ?? id)}`
            : String(row.name ?? id);

    setDeleteError(null);
    setDeleteState({
      entity: entityKey,
      id,
      label,
      checkingDependencies: true,
      dependencies: []
    });

    try {
      const response = await fetchAdminReferenceDependencies(token, entityKey, id);
      setDeleteState({
        entity: entityKey,
        id,
        label,
        checkingDependencies: false,
        dependencies: response.dependencies
      });
    } catch (error) {
      const message =
        error instanceof AdminApiError
          ? error.message
          : 'Nie udalo sie sprawdzic zaleznosci rekordu.';
      setDeleteError(message);
      setDeleteState((prev) => (prev ? { ...prev, checkingDependencies: false } : prev));
    }
  };

  const confirmDelete = async () => {
    if (!token || !deleteState) {
      return;
    }

    if (deleteState.dependencies.length > 0) {
      return;
    }

    setDeleteBusy(true);
    setDeleteError(null);

    try {
      await deleteAdminReference(token, deleteState.entity, deleteState.id);
      setDeleteState(null);
      setFlashMessage(`Usunieto pozycje z sekcji: ${currentMeta.label}.`);
      await loadDataset();
    } catch (error) {
      const apiMessage = error instanceof AdminApiError ? error.message : 'Nie udalo sie usunac rekordu.';
      setDeleteError(apiMessage);
    } finally {
      setDeleteBusy(false);
    }
  };

  if (state.loading) {
    return <LoadingBlock message="Ladowanie danych sekcji..." />;
  }

  if (state.error || !state.data) {
    return (
      <ErrorBlock
        title="Blad danych sekcji"
        message={state.error ?? 'Brak danych.'}
        onRetry={() => void loadDataset()}
      />
    );
  }

  const dataset = state.data;

  return (
    <div className="space-y-4">
      <AdminPanel
        title={currentMeta.label}
        subtitle={`${sectionLabelMap[section]}. ${currentMeta.description} Aktywne: ${activeCount} / ${selectedRows.length}`}
        actions={
          <button type="button" className="admin-btn admin-btn-primary" onClick={openCreateForm}>
            {currentMeta.createLabel}
          </button>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {sectionEntities.map((entityKey) => {
            const meta = adminEntityMetaByKey[entityKey];
            const isActive = selectedEntity === entityKey;

            return (
              <Link
                key={entityKey}
                to={meta.route}
                className={isActive ? 'admin-btn admin-btn-primary' : 'admin-btn admin-btn-secondary'}
              >
                {meta.label} ({getDatasetCount(dataset, entityKey)})
              </Link>
            );
          })}
        </div>

        {flashMessage ? (
          <p className="mb-3 rounded-xl border border-[#2c5b45] bg-[#102a20] px-3 py-2 text-sm text-[#a7e7c6]">
            {flashMessage}
          </p>
        ) : null}

        {selectedRows.length === 0 ? (
          <EmptyBlock message="Brak rekordow w tej sekcji." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Wartosc</th>
                  <th>Powiazanie</th>
                  <th>Status</th>
                  <th>Aktualizacja</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {selectedRows.map((row) => {
                  const typedRow = row as unknown as Record<string, unknown>;
                  const rowId = Number(typedRow.id);
                  const primary =
                    selectedEntity === 'lecturers'
                      ? String(typedRow.fullName)
                      : selectedEntity === 'floors'
                        ? String(typedRow.label)
                        : selectedEntity === 'subjects'
                          ? `${String(typedRow.code)} - ${String(typedRow.name)}`
                          : String(typedRow.name);
                  const relation =
                    selectedEntity === 'wings'
                      ? String(typedRow.buildingName)
                      : selectedEntity === 'subjects'
                        ? String(typedRow.fieldOfStudyName)
                        : selectedEntity === 'floors'
                          ? `Kolejnosc: ${String(typedRow.sortOrder)}`
                          : '-';
                  const updatedAt = String(typedRow.updatedAt ?? '');
                  const isActive = Boolean(typedRow.isActive);

                  return (
                    <tr key={rowId}>
                      <td>{rowId}</td>
                      <td>{primary}</td>
                      <td>{relation}</td>
                      <td>
                        <StatusBadge tone={isActive ? 'ok' : 'warn'}>
                          {isActive ? 'Aktywny' : 'Nieaktywny'}
                        </StatusBadge>
                      </td>
                      <td>{formatDateTime(updatedAt)}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            onClick={() => openEditForm(typedRow)}
                          >
                            Edytuj
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger"
                            onClick={() => void requestDelete(typedRow)}
                          >
                            Usun
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>

      <ConfirmModal
        open={formOpen}
        title={formMode === 'create' ? currentMeta.createLabel : `Edytuj rekord #${editingId ?? ''}`}
        message="Wypelnij pola i zapisz zmiany. Powiazania wybieraj z list kontrolowanych."
        confirmLabel={formMode === 'create' ? 'Dodaj' : 'Zapisz zmiany'}
        onCancel={() => {
          if (!formBusy) {
            setFormOpen(false);
          }
        }}
        onConfirm={() => {
          const formElement = document.getElementById('catalog-form') as HTMLFormElement | null;
          formElement?.requestSubmit();
        }}
        busy={formBusy}
      >
        <form id="catalog-form" onSubmit={submitForm} className="grid gap-3">
          {selectedEntity === 'lecturers' ? (
            <label className="admin-field">
              <span className="admin-label">Imie i nazwisko</span>
              <input
                className="admin-input"
                value={formState.fullName}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, fullName: event.target.value }))
                }
                required
              />
            </label>
          ) : selectedEntity === 'floors' ? (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="admin-field">
                <span className="admin-label">Etykieta pietra</span>
                <input
                  className="admin-input"
                  value={formState.label}
                  onChange={(event) => setFormState((prev) => ({ ...prev, label: event.target.value }))}
                  required
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Kolejnosc wyswietlania</span>
                <input
                  className="admin-input"
                  type="number"
                  value={formState.sortOrder}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, sortOrder: Number(event.target.value) }))
                  }
                  required
                />
              </label>
            </div>
          ) : selectedEntity === 'subjects' ? (
            <div className="grid gap-3 md:grid-cols-3">
              <label className="admin-field">
                <span className="admin-label">Kod</span>
                <input
                  className="admin-input"
                  value={formState.code}
                  onChange={(event) => setFormState((prev) => ({ ...prev, code: event.target.value }))}
                  required
                />
              </label>
              <label className="admin-field md:col-span-2">
                <span className="admin-label">Nazwa</span>
                <input
                  className="admin-input"
                  value={formState.name}
                  onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </label>
              <label className="admin-field md:col-span-3">
                <span className="admin-label">Kierunek</span>
                <select
                  className="admin-input"
                  value={formState.fieldOfStudyId}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, fieldOfStudyId: Number(event.target.value) }))
                  }
                  required
                >
                  <option value={0}>Wybierz kierunek</option>
                  {dataset.fieldsOfStudy.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <>
              {selectedEntity === 'wings' ? (
                <label className="admin-field">
                  <span className="admin-label">Budynek</span>
                  <select
                    className="admin-input"
                    value={formState.buildingId}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, buildingId: Number(event.target.value) }))
                    }
                    required
                  >
                    <option value={0}>Wybierz budynek</option>
                    {dataset.buildings.map((building) => (
                      <option key={building.id} value={building.id}>
                        {building.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="admin-field">
                <span className="admin-label">Nazwa</span>
                <input
                  className="admin-input"
                  value={formState.name}
                  onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </label>
            </>
          )}

          <label className="flex items-center gap-2 text-sm text-[#b9cbe8]">
            <input
              type="checkbox"
              checked={formState.isActive}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, isActive: event.target.checked }))
              }
            />
            Pozycja aktywna
          </label>

          {formError ? (
            <p className="m-0 rounded-lg border border-[#4b2d3a] bg-[#2b1821] px-3 py-2 text-sm text-[#ffc5d4]">
              {formError}
            </p>
          ) : null}
        </form>
      </ConfirmModal>

      <ConfirmModal
        open={Boolean(deleteState)}
        title={deleteState ? `Usun pozycje: ${deleteState.label}` : 'Usun pozycje'}
        message="Usuniecie jest blokowane, jesli pozycja jest wykorzystywana przez inne rekordy."
        confirmLabel="Usun pozycje"
        onCancel={() => {
          if (!deleteBusy) {
            setDeleteState(null);
            setDeleteError(null);
          }
        }}
        onConfirm={() => void confirmDelete()}
        destructive
        busy={deleteBusy || deleteState?.checkingDependencies}
      >
        {deleteState?.checkingDependencies ? (
          <LoadingBlock message="Sprawdzanie zaleznosci..." />
        ) : deleteState && deleteState.dependencies.length > 0 ? (
          <div className="space-y-2">
            <p className="m-0 rounded-xl border border-[#5f4b29] bg-[#2d2414] px-3 py-2 text-sm text-[#ffd69e]">
              Ta pozycja jest uzywana i nie moze zostac usunieta.
            </p>
            {deleteState.dependencies.map((dependency) => (
              <p key={dependency.key} className="m-0 text-sm text-[#b9cbe8]">
                {dependency.message}: <strong>{dependency.count}</strong>
              </p>
            ))}
          </div>
        ) : null}

        {deleteError ? (
          <p className="mt-2 rounded-lg border border-[#4b2d3a] bg-[#2b1821] px-3 py-2 text-sm text-[#ffc5d4]">
            {deleteError}
          </p>
        ) : null}
      </ConfirmModal>
    </div>
  );
}
