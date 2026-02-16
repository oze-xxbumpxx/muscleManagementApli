import type { ITrainingSessionRepository } from '@/domain/repositories/trainingSessionRepository';
import { sequelize } from '@/config/database';
import { z } from 'zod';
import type { TrainingSession } from '@/domain/types/trainingSession';
import { dateStringSchema } from '@/domain/valueObjects/dateString';

// zodスキーマ
const updateTrainingSessionSchema = z
  .object({
    id: z.number().positive(),
    date: dateStringSchema.optional(),
    bodyWeight: z.number().positive().nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const hasDate = data.date !== undefined;
    const hasBodyWeight = data.bodyWeight !== undefined;
    const hasNotes = data.notes !== undefined;

    if (!hasDate && !hasBodyWeight && !hasNotes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one of date, bodyWeight, or notes must be provided',
      });
    }
  });

type UpdateTrainingSessionUseCaseInput = z.infer<typeof updateTrainingSessionSchema>;

export class UpdateTrainingSessionUseCase {
  constructor(private readonly trainingSessionRepository: ITrainingSessionRepository) {}

  async execute(input: UpdateTrainingSessionUseCaseInput): Promise<TrainingSession> {
    // Zodバリデーション
    const validated = updateTrainingSessionSchema.parse(input);

    const updateSession = await sequelize.transaction(async (transaction) => {
      const session = await this.trainingSessionRepository.update(
        validated.id,
        {
          date: validated.date,
          bodyWeight: validated.bodyWeight,
          notes: validated.notes,
        },
        transaction
      );
      if (!session) {
        throw new Error('Training session not found');
      }
      return session;
    });
    return updateSession;
  }
}
