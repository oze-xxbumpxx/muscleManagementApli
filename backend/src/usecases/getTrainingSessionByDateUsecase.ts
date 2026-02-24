import { dateStringSchema } from '@/domain/valueObjects/dateString';
import z from 'zod';
import type { ITrainingSessionRepository } from '@/domain/repositories/trainingSessionRepository';
import type { TrainingSession } from '@/domain/types/trainingSession';

// zodスキーマ
const getTrainingSessionByDateSchema = z.object({
  date: dateStringSchema,
});

type GetTrainingSessionByDateUseCaseInput = z.infer<typeof getTrainingSessionByDateSchema>;

export class GetTrainingSessionByDateUseCase {
  constructor(private readonly trainingSessionRepository: ITrainingSessionRepository) {}

  async execute(input: GetTrainingSessionByDateUseCaseInput): Promise<TrainingSession | null> {
    const validated = getTrainingSessionByDateSchema.parse(input);
    return await this.trainingSessionRepository.findByDate(validated.date);
  }
}
