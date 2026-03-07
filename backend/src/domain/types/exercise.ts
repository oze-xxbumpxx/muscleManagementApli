export interface Exercise {
  id: number;
  trainingSessionId: number;
  exerciseName: string;
  weight: number | null;
  reps: number | null;
  durationSeconds: number | null;
  sets: number;
  order: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExerciseCreateInput {
  trainingSessionId: number;
  exerciseName: string;
  weight: number | null;
  reps: number | null;
  durationSeconds: number | null;
  sets: number;
  order: number;
  notes: string | null;
}

export interface ExerciseUpdateInput {
  exerciseName?: string;
  weight?: number | null;
  reps?: number | null;
  durationSeconds?: number | null;
  sets?: number;
  order?: number;
  notes?: string | null;
}

export interface ExerciseReorderInput {
  id: number;
  order: number;
}

export interface ExerciseHistoryQuery {
  exerciseName: string;
  limit: number;
}

export interface ExerciseHistoryItem {
  date: string;
  exerciseName: string;
  weight: number | null;
  reps: number | null;
  durationSeconds: number | null;
  sets: number;
  bodyWeight: number | null;
}

// TODO MVP2で追加予定
// export interface ExerciseHistoryResult {
//   totalCount: number;
//   items: ExerciseHistoryItem[];
// }

export interface ExerciseListQuery {
  limit: number;
  offset: number;
}

export interface ExerciseListResult {
  totalCount: number;
  items: Exercise[];
}

export interface ExerciseDeleteResult {
  success: boolean;
  deletedId: number | null;
}
