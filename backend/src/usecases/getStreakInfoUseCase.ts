import { ITrainingSessionRepository } from '@/domain/repositories/trainingSessionRepository';
import { TrainingSessionStreakSummary } from '@/domain/types/trainingSession';

export class GetStreakInfoUseCase {
  constructor(private readonly trainingRepository: ITrainingSessionRepository) {}

  async execute(): Promise<TrainingSessionStreakSummary> {
    return this.trainingRepository.getStreakSummary();
  }
}
