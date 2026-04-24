import { ITrainingSessionRepository } from '@/domain/repositories/trainingSessionRepository';
import z from 'zod';

const schema = z.object({
  exerciseName: z.string().trim().min(1),
});

type Input = z.infer<typeof schema>;

export class GetExerciseConsecutiveCountUseCase {
  constructor(private readonly trainingSessionRepository: ITrainingSessionRepository) {}

  async execute(input: Input): Promise<number> {
    const validated = schema.parse(input);
    return this.trainingSessionRepository.findConsecutiveExerciseCount(validated.exerciseName);
  }
}
