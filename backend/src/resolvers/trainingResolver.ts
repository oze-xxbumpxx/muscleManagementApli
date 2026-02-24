import { CreateTrainingSessionUseCase } from '@/usecases/createTrainingSessionUsecase';
import { UpdateTrainingSessionUseCase } from '@/usecases/updateTrainingSessionUsecase';
import { DeleteTrainingSessionUseCase } from '@/usecases/deleteTrainingSessionUsecase';
import { GetTrainingSessionByDateUseCase } from '@/usecases/getTrainingSessionByDateUsecase';
import { GetTrainingSessionsUseCase } from '@/usecases/getTrainingSessionsUseCase';
import { GetTrainingSessionByIdUseCase } from '@/usecases/getTrainingSessionByIdUseCase';

type CreateTrainingSessionInput = Parameters<CreateTrainingSessionUseCase['execute']>[0];
type UpdateTrainingSessionInput = Omit<
  Parameters<UpdateTrainingSessionUseCase['execute']>[0],
  'id'
>;

interface CreateTrainingSessionArgs {
  input: CreateTrainingSessionInput;
}

interface UpdateTrainingSessionArgs {
  id: number;
  input: UpdateTrainingSessionInput;
}

interface DeleteTrainingSessionArgs {
  id: number;
}

interface GetTrainingSessionByDateArgs {
  date: string;
}

interface GetTrainingSessionsArgs {
  limit: number;
  offset: number;
}

interface GetTrainingSessionByIdArgs {
  id: number;
}
interface TrainingResolverDeps {
  CreateTrainingSessionUseCase: CreateTrainingSessionUseCase;
  UpdateTrainingSessionUseCase: UpdateTrainingSessionUseCase;
  DeleteTrainingSessionUseCase: DeleteTrainingSessionUseCase;
  GetTrainingSessionByDateUseCase: GetTrainingSessionByDateUseCase;
  GetTrainingSessionsUseCase: GetTrainingSessionsUseCase;
  GetTrainingSessionByIdUseCase: GetTrainingSessionByIdUseCase;
}

export function createTrainingResolver(deps: TrainingResolverDeps) {
  return {
    Query: {
      trainingSessionByDate: async (_parent: unknown, args: GetTrainingSessionByDateArgs) => {
        return deps.GetTrainingSessionByDateUseCase.execute(args);
      },
      trainingSessions: async (_parent: unknown, args: GetTrainingSessionsArgs) => {
        return deps.GetTrainingSessionsUseCase.execute(args);
      },
      trainingSession: async (_parent: unknown, args: GetTrainingSessionByIdArgs) => {
        return deps.GetTrainingSessionByIdUseCase.execute(args);
      },
    },
    Mutation: {
      createTrainingSession: async (_parent: unknown, args: CreateTrainingSessionArgs) => {
        return deps.CreateTrainingSessionUseCase.execute(args.input);
      },
      updateTrainingSession: async (_parent: unknown, args: UpdateTrainingSessionArgs) => {
        return deps.UpdateTrainingSessionUseCase.execute({ id: args.id, ...args.input });
      },
      deleteTrainingSession: async (_parent: unknown, args: DeleteTrainingSessionArgs) => {
        return deps.DeleteTrainingSessionUseCase.execute(args);
      },
    },
  };
}
