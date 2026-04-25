export type Runner = {
  id: string;
  name: string;
  characterKey: string;
  goalMiles: number;
  createdAtMs: number;
};

export type Run = {
  id: string;
  runnerId: string;
  miles: number;
  runDate: string;
  createdAtMs: number;
};

export type SyncStatus = "idle" | "loading" | "connected" | "error";

export type SyncState = {
  message: string;
  status: SyncStatus;
};

export type RunnerDoc = {
  name?: string;
  characterKey?: string;
  goalMiles?: number;
  createdAtMs?: number;
};

export type RunDoc = {
  runnerId?: string;
  runner?: string;
  miles?: number;
  runDate?: string;
  createdAtIso?: string;
  createdAtMs?: number;
};
