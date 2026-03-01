import { IExerciseRepository } from '@/domain/repositories/exerciseRepository';

export class GetExerciseNamesUseCase {
  constructor(private readonly exerciseRepository: IExerciseRepository) {}

  async execute(): Promise<string[]> {
    return await this.exerciseRepository.findExerciseNames();
  }
}
