import type { AdminReferenceEntity } from '../types';

export type AdminEntitySection = 'locations' | 'teaching';

export interface AdminEntityMeta {
  key: AdminReferenceEntity;
  label: string;
  createLabel: string;
  section: AdminEntitySection;
  route: string;
  description: string;
}

export const adminEntityMetaList: AdminEntityMeta[] = [
  {
    key: 'floors',
    label: 'Piętra',
    createLabel: 'Dodaj piętro',
    section: 'locations',
    route: '/locations/floors',
    description: 'Poziomy budynków wykorzystywane przy przypisywaniu sal.'
  },
  {
    key: 'lecturers',
    label: 'Wykładowcy',
    createLabel: 'Dodaj wykładowcę',
    section: 'teaching',
    route: '/teaching/lecturers',
    description: 'Prowadzący zajęcia dostępni w harmonogramie.'
  },
  {
    key: 'student-groups',
    label: 'Grupy',
    createLabel: 'Dodaj grupę',
    section: 'teaching',
    route: '/teaching/student-groups',
    description: 'Grupy studentów przypisywane do wpisów zajęć.'
  },
  {
    key: 'class-types',
    label: 'Typy zajęć',
    createLabel: 'Dodaj typ zajęć',
    section: 'teaching',
    route: '/teaching/class-types',
    description: 'Rodzaje zajęć, np. wykład, ćwiczenia, laboratorium.'
  },
  {
    key: 'fields-of-study',
    label: 'Kierunki',
    createLabel: 'Dodaj kierunek',
    section: 'teaching',
    route: '/teaching/fields-of-study',
    description: 'Kierunki studiów powiązane z przedmiotami.'
  },
  {
    key: 'subjects',
    label: 'Przedmioty',
    createLabel: 'Dodaj przedmiot',
    section: 'teaching',
    route: '/teaching/subjects',
    description: 'Oferta przedmiotów z kodami i przypisaniem do kierunków.'
  }
];

export const adminEntityMetaByKey: Record<AdminReferenceEntity, AdminEntityMeta> =
  adminEntityMetaList.reduce((accumulator, item) => {
    accumulator[item.key] = item;
    return accumulator;
  }, {} as Record<AdminReferenceEntity, AdminEntityMeta>);

export const adminEntityKeysBySection: Record<AdminEntitySection, AdminReferenceEntity[]> = {
  locations: adminEntityMetaList.filter((item) => item.section === 'locations').map((item) => item.key),
  teaching: adminEntityMetaList.filter((item) => item.section === 'teaching').map((item) => item.key)
};

export const resolveEntityForSection = (
  section: AdminEntitySection,
  rawEntity: string | undefined
): AdminReferenceEntity | null => {
  if (!rawEntity) {
    return null;
  }

  const availableEntities = adminEntityKeysBySection[section];
  return availableEntities.includes(rawEntity as AdminReferenceEntity)
    ? (rawEntity as AdminReferenceEntity)
    : null;
};

export interface AdminNavItem {
  to: string;
  label: string;
  pageTitle: string;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

const locationNavItems: AdminNavItem[] = adminEntityKeysBySection.locations.map((key) => ({
  to: adminEntityMetaByKey[key].route,
  label: adminEntityMetaByKey[key].label,
  pageTitle: adminEntityMetaByKey[key].label
}));

const teachingNavItems: AdminNavItem[] = adminEntityKeysBySection.teaching.map((key) => ({
  to: adminEntityMetaByKey[key].route,
  label: adminEntityMetaByKey[key].label,
  pageTitle: adminEntityMetaByKey[key].label
}));

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: 'Start',
    items: [{ to: '/dashboard', label: 'Panel główny', pageTitle: 'Panel główny' }]
  },
  {
    label: 'Plan zajęć',
    items: [
      { to: '/schedule-entries', label: 'Harmonogram', pageTitle: 'Harmonogram zajęć' },
      { to: '/rooms', label: 'Sale', pageTitle: 'Sale' }
    ]
  },
  {
    label: 'Lokalizacje',
    items: locationNavItems
  },
  {
    label: 'Kadra i oferta',
    items: teachingNavItems
  },
  {
    label: 'Konflikty',
    items: [{ to: '/conflicts', label: 'Konflikty', pageTitle: 'Konflikty harmonogramu' }]
  }
];

export const adminNavItems: AdminNavItem[] = adminNavGroups.flatMap((group) => group.items);

export const resolvePageTitle = (pathname: string): string => {
  const match = adminNavItems.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));

  return match?.pageTitle ?? 'Panel administratora';
};

export const sectionLabelMap: Record<AdminEntitySection, string> = {
  locations: 'Lokalizacje',
  teaching: 'Kadra i oferta'
};

export const resolveNavContext = (
  pathname: string
): { groupLabel: string; itemLabel: string } | null => {
  for (const group of adminNavGroups) {
    const matchedItem = group.items.find(
      (item) => pathname === item.to || pathname.startsWith(`${item.to}/`)
    );

    if (matchedItem) {
      return { groupLabel: group.label, itemLabel: matchedItem.label };
    }
  }

  return null;
};
