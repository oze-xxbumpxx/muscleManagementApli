import z from 'zod';
import type { IExerciseRepository } from '@/domain/repositories/exerciseRepository';
import type { ITrainingSessionRepository } from '@/domain/repositories/trainingSessionRepository';
import type { Exercise } from '@/domain/types/exercise';
import { sequelize } from '@/config/database';

const inputSchema = z
  .object({
    trainingSessionId: z.number().int().positive(),
    exerciseName: z.string().min(1),
    weight: z.number().positive().nullable().optional(),
    reps: z.number().int().positive().nullable().optional(),
    durationSeconds: z.number().int().positive().nullable().optional(),
    sets: z.number().int().positive(),
    order: z.number().int().positive().nullable().optional(),
    notes: z.string().nullable().optional(),
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

type AddExerciseUseCaseInput = z.infer<typeof inputSchema>;

export class AddExerciseUseCase {
  constructor(
    private readonly exerciseRepository: IExerciseRepository,
    private readonly trainingSessionRepository: ITrainingSessionRepository
  ) {}

  async execute(input: AddExerciseUseCaseInput): Promise<Exercise> {
    const validated = inputSchema.parse(input);

    const createdExercise = await sequelize.transaction(async (transaction) => {
      const session = await this.trainingSessionRepository.findById(validated.trainingSessionId);
      if (!session) {
        throw new Error('Training session not found');
      }

      const exercise = await this.exerciseRepository.create(
        {
          trainingSessionId: session.id,
          exerciseName: validated.exerciseName,
          weight: validated.weight ?? null,
          reps: validated.reps ?? null,
          durationSeconds: validated.durationSeconds ?? null,
          sets: validated.sets,
          order: validated.order ?? 1,
          notes: validated.notes ?? null,
        },
        transaction
      );

      return exercise;
    });
    return createdExercise;
  }
}
