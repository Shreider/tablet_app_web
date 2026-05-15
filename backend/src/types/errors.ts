export interface AppError extends Error {
  code?: string;
}

export const createError = (message: string, code: string): AppError => {
  const error = new Error(message) as AppError;
  error.code = code;
  return error;
};

