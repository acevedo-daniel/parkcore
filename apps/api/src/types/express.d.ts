declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        kind: 'OWNER' | 'DEMO' | 'SHOWCASE';
        demoExpiresAt: string | null;
      };
    }
  }
}

export {};
