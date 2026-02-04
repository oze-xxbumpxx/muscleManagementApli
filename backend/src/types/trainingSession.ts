export interface TrainingSession {
  id: number;
  date: string;
  bodyWeight: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingSessionCreateInput {
  date: string;
  bodyWeight: number | null;
  notes: string | null;
}

export interface TrainingSessionUpdateInput {
  date?: string;
  bodyWeight?: number | null;
  notes?: string | null;
}

export interface TrainingSessionListQuery {
  limit: number;
  offset: number;
}

export interface TrainingSessionListResult {
  totalCount: number;
  items: TrainingSession[];
}

export interface TrainingSessionStreakSummary {
  currentStreak: number;
  longestStreak: number;
  lastTrainingDate: string | null;
}
