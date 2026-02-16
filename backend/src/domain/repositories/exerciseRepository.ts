import { Transaction } from 'sequelize';
import type {
  Exercise,
  ExerciseCreateInput,
  ExerciseDeleteResult,
  ExerciseListQuery,
  ExerciseListResult,
  ExerciseUpdateInput,
} from '../types/exercise';

export interface IExerciseRepository {
  // Create
  create(input: ExerciseCreateInput, transaction?: Transaction): Promise<Exercise>;
  createMany(inputs: ExerciseCreateInput[], transaction?: Transaction): Promise<Exercise[]>;

  // Read
  findById(id: number): Promise<Exercise | null>;
  findByTrainingSessionId(trainingSessionId: number): Promise<Exercise[]>;
  findAll(query: ExerciseListQuery): Promise<ExerciseListResult>;

  // Update
  update(id: number, input: ExerciseUpdateInput): Promise<Exercise | null>;

  // Delete
  deleteById(id: number): Promise<ExerciseDeleteResult>;
}
