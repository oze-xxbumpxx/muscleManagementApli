import { sequelize } from '@/config/database';
import type { ITrainingSessionRepository } from '@/domain/repositories/trainingSessionRepository';
import type { TrainingSessionDeleteResult } from '@/domain/types/trainingSession';
import z from 'zod';

// zodスキーマ
const deleteTrainingSessionSchema = z.object({
  id: z.number().int().positive(),
});

type DeleteTrainingSessionUseCaseInput = z.infer<typeof deleteTrainingSessionSchema>;

export class DeleteTrainingSessionUseCase {
  constructor(private readonly trainingSessionRepository: ITrainingSessionRepository) {}

  async execute(input: DeleteTrainingSessionUseCaseInput): Promise<TrainingSessionDeleteResult> {
    const validated = deleteTrainingSessionSchema.parse(input);
    const deletedSession = await sequelize.transaction(async (transaction) => {
      return this.trainingSessionRepository.deleteById(validated.id, transaction);
    });

    return deletedSession;
  }
}
