declare global {
  namespace Express {
    interface Request {
      adminAuth?: {
        token: string;
        authenticated: true;
      };
    }
  }
}

export {};
