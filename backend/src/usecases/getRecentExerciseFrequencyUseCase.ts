import { ITrainingSessionRepository } from '@/domain/repositories/trainingSessionRepository';
import { ExerciseFrequency } from '@/domain/types/exercise';
import z from 'zod';

const schema = z.object({
  sessionCount: z.number().int().positive().max(20).default(5),
});

type Input = z.infer<typeof schema>;

export class GetRecentExerciseFrequencyUseCase {
  constructor(private readonly trainingSessionRepository: ITrainingSessionRepository) {}

  async execute(input: Input): Promise<ExerciseFrequency[]> {
    const validated = schema.parse(input);

    return this.trainingSessionRepository.findRecentExerciseFrequency(validated.sessionCount);
  }
}
