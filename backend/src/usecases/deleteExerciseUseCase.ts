import { sequelize } from '@/config/database';
import type { IExerciseRepository } from '@/domain/repositories/exerciseRepository';
import type { ExerciseDeleteResult } from '@/domain/types/exercise';
import z from 'zod';

// zodスキーマ
const deleteExerciseSchema = z.object({
  id: z.number().int().positive(),
});

type DeleteExerciseUseCaseInput = z.infer<typeof deleteExerciseSchema>;

export class DeleteExerciseUseCase {
  constructor(private readonly exerciseRepository: IExerciseRepository) {}

  async execute(input: DeleteExerciseUseCaseInput): Promise<ExerciseDeleteResult> {
    const validated = deleteExerciseSchema.parse(input);
    const deletedExercise = await sequelize.transaction(async (transaction) => {
      return this.exerciseRepository.deleteById(validated.id, transaction);
    });
    return deletedExercise;
  }
}
