import { CreateTrainingSessionUseCase } from '@/usecases/createTrainingSessionUsecase';
import { UpdateTrainingSessionUseCase } from '@/usecases/updateTrainingSessionUsecase';
import { DeleteTrainingSessionUseCase } from '@/usecases/deleteTrainingSessionUsecase';

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

interface TrainingResolverDeps {
  CreateTrainingSessionUseCase: CreateTrainingSessionUseCase;
  UpdateTrainingSessionUseCase: UpdateTrainingSessionUseCase;
  DeleteTrainingSessionUseCase: DeleteTrainingSessionUseCase;
}

export function createTrainingResolver(deps: TrainingResolverDeps) {
  return {
    Query: {
      // TODO 後で追加
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
