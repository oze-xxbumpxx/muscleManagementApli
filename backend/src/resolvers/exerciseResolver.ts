import { AddExerciseUseCase } from '@/usecases/addExerciseUseCase';
import { UpdateExerciseUseCase } from '@/usecases/updateExerciseUseCase';
import { DeleteExerciseUseCase } from '@/usecases/deleteExerciseUseCase';
import { GetExerciseNameUseCase } from '@/usecases/getExerciseNamesUseCase';

type AddExerciseInput = Omit<Parameters<AddExerciseUseCase['execute']>[0], 'trainingSessionId'>;
type UpdateExerciseInput = Omit<Parameters<UpdateExerciseUseCase['execute']>[0], 'id'>;
interface AddExerciseArgs {
  trainingSessionId: number;
  input: AddExerciseInput;
}
interface UpdateExerciseArgs {
  id: number;
  input: UpdateExerciseInput;
}

interface DeleteExerciseArgs {
  id: number;
}

interface ExerciseResolverDeps {
  AddExerciseUseCase: AddExerciseUseCase;
  UpdateExerciseUseCase: UpdateExerciseUseCase;
  DeleteExerciseUseCase: DeleteExerciseUseCase;
  GetExerciseNameUseCase: GetExerciseNameUseCase;
}

export function createExerciseResolver(deps: ExerciseResolverDeps) {
  return {
    Query: {
      exerciseNames: async (_parent: unknown, _args: unknown) => {
        return deps.GetExerciseNameUseCase.execute();
      },
    },
    Mutation: {
      addExercise: async (_parent: unknown, args: AddExerciseArgs) => {
        return deps.AddExerciseUseCase.execute({
          trainingSessionId: args.trainingSessionId,
          ...args.input,
        });
      },
      updateExercise: async (_parent: unknown, args: UpdateExerciseArgs) => {
        return deps.UpdateExerciseUseCase.execute({
          id: args.id,
          ...args.input,
        });
      },
      deleteExercise: async (_parent: unknown, args: DeleteExerciseArgs) => {
        return deps.DeleteExerciseUseCase.execute({
          id: args.id,
        });
      },
    },
  };
}
