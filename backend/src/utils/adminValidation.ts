import type { ParsedQs } from 'qs';
import type { SortOrder } from '../types/domain.js';
import { createError } from '../types/errors.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

interface PaginationDefaults {
  page: number;
  limit: number;
  maxLimit: number;
}

interface PaginationResult {
  page: number;
  limit: number;
  offset: number;
}

export const asNonEmptyString = (
  value: unknown,
  fieldName: string,
  maxLength: number | null = null
): string => {
  if (typeof value !== 'string') {
    throw createError(`${fieldName} must be a string.`, 'VALIDATION_ERROR');
  }

  const normalized = value.trim();

  if (!normalized) {
    throw createError(`${fieldName} cannot be empty.`, 'VALIDATION_ERROR');
  }

  if (maxLength && normalized.length > maxLength) {
    throw createError(
      `${fieldName} is too long (max ${maxLength} characters).`,
      'VALIDATION_ERROR'
    );
  }

  return normalized;
};

export const asOptionalString = (
  value: unknown,
  fieldName: string,
  maxLength: number | null = null
): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string') {
    throw createError(`${fieldName} must be a string.`, 'VALIDATION_ERROR');
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  if (maxLength && normalized.length > maxLength) {
    throw createError(
      `${fieldName} is too long (max ${maxLength} characters).`,
      'VALIDATION_ERROR'
    );
  }

  return normalized;
};

export const asPositiveInteger = (value: unknown, fieldName: string): number => {
  const numeric = Number(value);

  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw createError(`${fieldName} must be a positive integer.`, 'VALIDATION_ERROR');
  }

  return numeric;
};

export const parsePagination = (
  query: ParsedQs,
  defaults: PaginationDefaults = { page: 1, limit: 10, maxLimit: 100 }
): PaginationResult => {
  const rawPage = query.page ?? defaults.page;
  const rawLimit = query.limit ?? defaults.limit;

  const page = Number(rawPage);
  const limit = Number(rawLimit);

  if (!Number.isInteger(page) || page <= 0) {
    throw createError('page must be a positive integer.', 'VALIDATION_ERROR');
  }

  if (!Number.isInteger(limit) || limit <= 0 || limit > defaults.maxLimit) {
    throw createError(
      `limit must be an integer between 1 and ${defaults.maxLimit}.`,
      'VALIDATION_ERROR'
    );
  }

  return {
    page,
    limit,
    offset: (page - 1) * limit
  };
};

export const parseSortOrder = (value: unknown): SortOrder => {
  if (!value) {
    return 'asc';
  }

  const normalized = String(value).toLowerCase();

  if (normalized !== 'asc' && normalized !== 'desc') {
    throw createError('sortOrder must be either asc or desc.', 'VALIDATION_ERROR');
  }

  return normalized;
};

export const parseBooleanFlag = (value: unknown, defaultValue = false): boolean => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value).toLowerCase();

  if (normalized === 'true' || normalized === '1') {
    return true;
  }

  if (normalized === 'false' || normalized === '0') {
    return false;
  }

  throw createError('Invalid boolean flag value. Use true/false.', 'VALIDATION_ERROR');
};

export const asIsoDate = (value: unknown, fieldName: string): string => {
  const normalized = asNonEmptyString(value, fieldName);

  if (!DATE_PATTERN.test(normalized)) {
    throw createError(`${fieldName} must match YYYY-MM-DD.`, 'VALIDATION_ERROR');
  }

  const [year, month, day] = normalized.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    throw createError(`${fieldName} is not a valid calendar date.`, 'VALIDATION_ERROR');
  }

  return normalized;
};

export const asTime = (value: unknown, fieldName: string): string => {
  const normalized = asNonEmptyString(value, fieldName);

  if (!TIME_PATTERN.test(normalized)) {
    throw createError(`${fieldName} must match HH:MM.`, 'VALIDATION_ERROR');
  }

  return normalized;
};

export const ensureStartBeforeEnd = (startTime: string, endTime: string): void => {
  if (startTime >= endTime) {
    throw createError('startTime must be earlier than endTime.', 'VALIDATION_ERROR');
  }
};
