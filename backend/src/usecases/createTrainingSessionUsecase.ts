import { z } from 'zod';
import type { ITrainingSessionRepository } from '@/domain/repositories/trainingSessionRepository';
import type { IExerciseRepository } from '@/domain/repositories/exerciseRepository';
import type { TrainingSession } from '@/domain/types/trainingSession';
import { sequelize } from '@/config/database';
import { dateStringSchema } from '@/domain/valueObjects/dateString';

// Zod スキーマ（モジュールスコープに定義）
const exerciseInputSchema = z
  .object({
    exerciseName: z.string().min(1, 'Exercise name is required'),
    weight: z.number().positive().nullable().optional(),
    reps: z.number().int().positive().nullable().optional(),
    durationSeconds: z.number().int().positive().nullable().optional(),
    sets: z.number().int().positive('Sets must be greater than 0'),
    order: z.number().int().positive().nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const hasReps = data.reps !== null && data.reps !== undefined;
    const hasDuration = data.durationSeconds !== null && data.durationSeconds !== undefined;

    if (!hasReps && !hasDuration) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either reps or durationSeconds must be provided',
      });
    }
    if (hasReps && hasDuration) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cannot provide both reps and durationSeconds',
      });
    }
  });

const inputSchema = z.object({
  date: dateStringSchema,
  bodyWeight: z.number().positive().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  exercises: z.array(exerciseInputSchema).min(1, 'At least one exercise is required'),
});

// Zod スキーマから型を推論
type CreateTrainingSessionUseCaseInput = z.infer<typeof inputSchema>;

export class CreateTrainingSessionUseCase {
  constructor(
    private readonly trainingSessionRepository: ITrainingSessionRepository,
    private readonly exerciseRepository: IExerciseRepository
  ) {}

  async execute(input: CreateTrainingSessionUseCaseInput): Promise<TrainingSession> {
    // Zod でバリデーション（失敗時は ZodError を throw）
    const validated = inputSchema.parse(input);

    const createdSession = await sequelize.transaction(async (transaction) => {
      const session = await this.trainingSessionRepository.create(
        {
          date: validated.date,
          bodyWeight: validated.bodyWeight ?? null,
          notes: validated.notes ?? null,
        },
        transaction
      );

      const exerciseInputs = validated.exercises.map((exercise, index) => ({
        trainingSessionId: session.id,
        exerciseName: exercise.exerciseName,
        weight: exercise.weight ?? null,
        reps: exercise.reps ?? null,
        durationSeconds: exercise.durationSeconds ?? null,
        sets: exercise.sets,
        order: exercise.order ?? index + 1,
        notes: exercise.notes ?? null,
      }));

      await this.exerciseRepository.createMany(exerciseInputs, transaction);

      return session;
    });
    return createdSession;
  }
}
