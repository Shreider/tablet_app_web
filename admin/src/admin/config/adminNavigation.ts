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
    key: 'buildings',
    label: 'Budynki',
    createLabel: 'Dodaj budynek',
    section: 'locations',
    route: '/locations/buildings',
    description: 'Budynki dostepne w systemie rezerwacji i harmonogramie.'
  },
  {
    key: 'wings',
    label: 'Skrzydla',
    createLabel: 'Dodaj skrzydlo',
    section: 'locations',
    route: '/locations/wings',
    description: 'Strefy i skrzydla przypisane do budynkow.'
  },
  {
    key: 'floors',
    label: 'Pietra',
    createLabel: 'Dodaj pietro',
    section: 'locations',
    route: '/locations/floors',
    description: 'Poziomy budynkow wykorzystywane przy przypisywaniu sal.'
  },
  {
    key: 'lecturers',
    label: 'Wykladowcy',
    createLabel: 'Dodaj wykladowce',
    section: 'teaching',
    route: '/teaching/lecturers',
    description: 'Prowadzacy zajecia dostepni w harmonogramie.'
  },
  {
    key: 'student-groups',
    label: 'Grupy',
    createLabel: 'Dodaj grupe',
    section: 'teaching',
    route: '/teaching/student-groups',
    description: 'Grupy studentow przypisywane do wpisow zajec.'
  },
  {
    key: 'class-types',
    label: 'Typy zajec',
    createLabel: 'Dodaj typ zajec',
    section: 'teaching',
    route: '/teaching/class-types',
    description: 'Rodzaje zajec, np. wyklad, cwiczenia, laboratorium.'
  },
  {
    key: 'fields-of-study',
    label: 'Kierunki',
    createLabel: 'Dodaj kierunek',
    section: 'teaching',
    route: '/teaching/fields-of-study',
    description: 'Kierunki studiow powiazane z przedmiotami.'
  },
  {
    key: 'subjects',
    label: 'Przedmioty',
    createLabel: 'Dodaj przedmiot',
    section: 'teaching',
    route: '/teaching/subjects',
    description: 'Oferta przedmiotow z kodami i przypisaniem do kierunkow.'
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
    items: [{ to: '/dashboard', label: 'Dashboard', pageTitle: 'Dashboard administracyjny' }]
  },
  {
    label: 'Plan zajec',
    items: [
      { to: '/schedule-entries', label: 'Harmonogram', pageTitle: 'Harmonogram zajec' },
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
