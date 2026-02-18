import { sequelize } from '@/config/database';
import type { ITrainingSessionRepository } from '@/domain/repositories/trainingSessionRepository';
import type { TrainingSessionDeleteResult } from '@/domain/types/trainingSession';
import z from 'zod';

// zodスキーマ
const deleteTrainingSessionSchema = z.object({
  id: z.number().positive(),
});

type DeleteTrainingSessionUseCaseInput = z.infer<typeof deleteTrainingSessionSchema>;

export class DeleteTrainingSessionUseCase {
  constructor(private readonly trainingSessionRepository: ITrainingSessionRepository) {}

  async execute(input: DeleteTrainingSessionUseCaseInput): Promise<TrainingSessionDeleteResult> {
    const validated = deleteTrainingSessionSchema.parse(input);
    const deletedSession = await sequelize.transaction(async (transaction) => {
      const session = await this.trainingSessionRepository.deleteById(validated.id, transaction);
      if (!session.success) {
        throw new Error('Failed to delete training session');
      }
      return session;
    });

    return deletedSession;
  }
}
