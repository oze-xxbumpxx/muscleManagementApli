import type { TrainingSession, TrainingSessionCreateInput } from '../types/trainingSession';

export interface TrainingSessionRepository {
  create(input: TrainingSessionCreateInput): Promise<TrainingSession>;
}
