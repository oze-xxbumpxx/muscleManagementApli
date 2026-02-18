import { Transaction } from 'sequelize';
import type {
  TrainingSession,
  TrainingSessionCreateInput,
  TrainingSessionDeleteResult,
  TrainingSessionListQuery,
  TrainingSessionListResult,
  TrainingSessionStreakSummary,
  TrainingSessionUpdateInput,
} from '../types/trainingSession';

export interface ITrainingSessionRepository {
  // Create
  create(input: TrainingSessionCreateInput, transaction?: Transaction): Promise<TrainingSession>;

  // Read
  findById(id: number): Promise<TrainingSession | null>;
  findByDate(date: string): Promise<TrainingSession | null>;
  findByMonth(year: number, month: number): Promise<TrainingSession[]>;
  findAll(query: TrainingSessionListQuery): Promise<TrainingSessionListResult>;

  // Update
  update(
    id: number,
    input: TrainingSessionUpdateInput,
    transaction?: Transaction
  ): Promise<TrainingSession | null>;

  // Delete
  deleteById(id: number, transaction?: Transaction): Promise<TrainingSessionDeleteResult>;

  // Aggregations
  getStreakSummary(): Promise<TrainingSessionStreakSummary>;
}
