import { sequelize } from '@/config/database';
import type { IExerciseRepository } from '@/domain/repositories/exerciseRepository';
import type { Exercise } from '@/domain/types/exercise';
import z from 'zod';

// zodスキーマ
const updateExerciseSchema = z
  .object({
    id: z.number().int().positive(),
    exerciseName: z.string().min(1).max(255).optional(),
    weight: z.number().positive().nullable().optional(),
    reps: z.number().int().positive().nullable().optional(),
    durationSeconds: z.number().int().positive().nullable().optional(),
    sets: z.number().int().positive().optional(),
    order: z.number().int().positive().optional(),
    notes: z.string().min(1).max(2000).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const hasRepsKey = 'reps' in data;
    const hasDurationKey = 'durationSeconds' in data;

    // reps / durationSeconds を更新する場合は、必ず両方のキーを渡す。
    // 片方は null を明示して、最終状態の排他を入力だけで保証する。
    if (hasRepsKey !== hasDurationKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'When updating reps or durationSeconds, provide both fields and set the other to null.',
      });
      return;
    }

    if (hasRepsKey && hasDurationKey) {
      const hasRepsValue = data.reps !== undefined && data.reps !== null;
      const hasDurationValue =
        data.durationSeconds !== undefined && data.durationSeconds !== null;

      if (hasRepsValue && hasDurationValue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cannot provide both reps and durationSeconds',
        });
      }

      if (!hasRepsValue && !hasDurationValue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Either reps or durationSeconds must be provided',
        });
      }
    }
  });

type UpdateExerciseUseCaseInput = z.infer<typeof updateExerciseSchema>;

export class UpdateExerciseUseCase {
  constructor(private readonly exerciseRepository: IExerciseRepository) {}
  async execute(input: UpdateExerciseUseCaseInput): Promise<Exercise> {
    const validated = updateExerciseSchema.parse(input);

    const updatedExercise = await sequelize.transaction(async (transaction) => {
      const exercise = await this.exerciseRepository.update(
        validated.id,
        {
          exerciseName: validated.exerciseName,
          weight: validated.weight,
          reps: validated.reps,
          durationSeconds: validated.durationSeconds,
          sets: validated.sets,
          order: validated.order,
          notes: validated.notes,
        },
        transaction
      );
      if (!exercise) {
        throw new Error('Exercise not found');
      }
      return exercise;
    });
    return updatedExercise;
  }
}
