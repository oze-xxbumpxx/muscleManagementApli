import type { ITrainingSessionRepository } from '@/domain/repositories/trainingSessionRepository';
import type { TrainingDay } from '@/domain/types/trainingSession';
import z from 'zod';

// zodスキーマ
const getTrainingDaysInMonthUsecaseSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export type GetTrainingDaysInMounthUsecaseInput = z.infer<
  typeof getTrainingDaysInMonthUsecaseSchema
>;

export class GetTrainingDaysInMonthUseCase {
  constructor(private readonly trainingSessionRepository: ITrainingSessionRepository) {}

  async execute(input: GetTrainingDaysInMounthUsecaseInput): Promise<TrainingDay[]> {
    const validated = getTrainingDaysInMonthUsecaseSchema.parse(input);
    return await this.trainingSessionRepository.findTrainingDaysInMonth(
      validated.year,
      validated.month
    );
  }
}
