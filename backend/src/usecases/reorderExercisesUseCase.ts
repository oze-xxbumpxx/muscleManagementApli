import { IExerciseRepository } from '@/domain/repositories/exerciseRepository';
import { ITrainingSessionRepository } from '@/domain/repositories/trainingSessionRepository';
import type { Exercise } from '@/domain/types/exercise';
import { sequelize } from '@/models';
import z from 'zod';

const schema = z
  .object({
    trainingSessionId: z.number().int().positive(),
    exerciseIds: z.array(z.number().int().positive()).min(1),
  })
  .superRefine((data, ctx) => {
    if (new Set(data.exerciseIds).size !== data.exerciseIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'exerciseIds must be unique',
      });
    }
  });

type Input = z.infer<typeof schema>;

export class ReorderExercisesUseCase {
  constructor(
    private readonly ExerciseRepository: IExerciseRepository,
    private readonly TrainingSessionRepository: ITrainingSessionRepository
  ) {}

  async execute(input: Input): Promise<Exercise[]> {
    const validated = schema.parse(input);

    const session = await this.TrainingSessionRepository.findById(validated.trainingSessionId);
    if (session === null) {
      throw new Error('Training Session not found');
    }

    // session.exercisesのID集合とValidated.exerciseIdsの集合一致を検証
    const reorderInputs = validated.exerciseIds.map((id, index) => ({
      id,
      order: index + 1,
    }));

    return await sequelize.transaction((transaction) =>
      this.ExerciseRepository.reorder(reorderInputs, transaction)
    );
  }
}
