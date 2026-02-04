import type { Exercise, ExerciseCreateInput } from '../types/exercise';

export interface ExerciseRepository {
  create(input: ExerciseCreateInput): Promise<Exercise>;
}
