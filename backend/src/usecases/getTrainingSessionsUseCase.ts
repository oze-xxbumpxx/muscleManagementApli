import type { ITrainingSessionRepository } from '@/domain/repositories/trainingSessionRepository';
import type { TrainingSessionListResult } from '@/domain/types/trainingSession';
import z from 'zod';

// zodスキーマ
const getTrainingSessionsSchema = z.object({
  limit: z.number().int().positive().max(100),
  offset: z.number().int().min(0),
});

type GetTrainingSessionsUseCaseInput = z.infer<typeof getTrainingSessionsSchema>;

export class GetTrainingSessionsUseCase {
  constructor(private readonly trainingSessionRepository: ITrainingSessionRepository) {}

  async execute(input: GetTrainingSessionsUseCaseInput): Promise<TrainingSessionListResult> {
    const validated = getTrainingSessionsSchema.parse(input);
    return await this.trainingSessionRepository.findAll(validated);
  }
}
