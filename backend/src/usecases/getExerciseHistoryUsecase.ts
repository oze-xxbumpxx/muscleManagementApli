import { IExerciseRepository } from '@/domain/repositories/exerciseRepository';
import { ExerciseHistoryItem } from '@/domain/types/exercise';
import z from 'zod';

const getExerciseHistorySchema = z.object({
  exerciseName: z.string().trim().min(1),
  limit: z.number().int().positive().max(100),
});

type GetExerciseHistoryInput = z.infer<typeof getExerciseHistorySchema>;
export class GetExerciseHistoryUsecase {
  constructor(private readonly exerciseRepository: IExerciseRepository) {}

  async execute(input: GetExerciseHistoryInput): Promise<ExerciseHistoryItem[]> {
    const validated = getExerciseHistorySchema.parse(input);
    return await this.exerciseRepository.findExerciseHistory(validated);
  }
}
