import z from 'zod';
import type { ITrainingSessionRepository } from '@/domain/repositories/trainingSessionRepository';
import type { TrainingSession } from '@/domain/types/trainingSession';

// zodスキーマ
const getTrainingSessionByIdSchema = z.object({
  id: z.number().positive(),
});

type GetTrainingSessionByIdUseCaseInput = z.infer<typeof getTrainingSessionByIdSchema>;

export class GetTrainingSessionByIdUseCase {
  constructor(private readonly trainingSessionRepository: ITrainingSessionRepository) {}

  async execute(input: GetTrainingSessionByIdUseCaseInput): Promise<TrainingSession | null> {
    const validated = getTrainingSessionByIdSchema.parse(input);
    return await this.trainingSessionRepository.findById(validated.id);
  }
}
