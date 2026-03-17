import type { ITrainingSessionRepository } from '@/domain/repositories/trainingSessionRepository';
import type { TrainingDay } from '@/domain/types/trainingSession';
import z from 'zod';

// zodスキーマ
const getTrainingDaysInMonthSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export type GetTrainingDaysInMonthUseCaseInput = z.infer<typeof getTrainingDaysInMonthSchema>;

export class GetTrainingDaysInMonthUseCase {
  constructor(private readonly trainingSessionRepository: ITrainingSessionRepository) {}

  async execute(input: GetTrainingDaysInMonthUseCaseInput): Promise<TrainingDay[]> {
    const validated = getTrainingDaysInMonthSchema.parse(input);
    return this.trainingSessionRepository.findTrainingDaysInMonth(validated.year, validated.month);
  }
}
