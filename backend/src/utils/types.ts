export interface AuthPayload {
    id: string;
    exp: number;
};

export type Variables = {
  user: AuthPayload
};