import { AddExerciseUseCase } from '@/usecases/addExerciseUseCase';
import { UpdateExerciseUseCase } from '@/usecases/updateExerciseUseCase';
import { DeleteExerciseUseCase } from '@/usecases/deleteExerciseUseCase';
import { GetExerciseNamesUseCase } from '@/usecases/getExerciseNamesUseCase';
import { GetExerciseHistoryUsecase } from '@/usecases/getExerciseHistoryUsecase';
import { GetExerciseConsecutiveCountUseCase } from '../usecases/getExerciseConsecutiveCountUseCase';
import { ReorderExercisesUseCase } from '../usecases/reorderExercisesUseCase';

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

interface GetExerciseHistoryArgs {
  exerciseName: string;
  limit: number;
}

interface GetExerciseConsecutiveCountArgs {
  exerciseName: string;
}

interface ReorderExerciseArgs {
  trainingSessionId: number;
  exerciseIds: number[];
}

interface ExerciseResolverDeps {
  AddExerciseUseCase: AddExerciseUseCase;
  UpdateExerciseUseCase: UpdateExerciseUseCase;
  DeleteExerciseUseCase: DeleteExerciseUseCase;
  GetExerciseNameUseCase: GetExerciseNamesUseCase;
  GetExerciseHistoryUseCase: GetExerciseHistoryUsecase;
  GetExerciseConsecutiveCountUseCase: GetExerciseConsecutiveCountUseCase;
  ReorderExercisesUseCase: ReorderExercisesUseCase;
}

export function createExerciseResolver(deps: ExerciseResolverDeps) {
  return {
    Query: {
      exerciseNames: async (_parent: unknown, _args: unknown) => {
        return deps.GetExerciseNameUseCase.execute();
      },
      exerciseHistory: async (_parent: unknown, args: GetExerciseHistoryArgs) => {
        return deps.GetExerciseHistoryUseCase.execute({
          exerciseName: args.exerciseName,
          limit: args.limit,
        });
      },
      exerciseConsecutiveCount: async (_parent: unknown, args: GetExerciseConsecutiveCountArgs) => {
        return deps.GetExerciseConsecutiveCountUseCase.execute(args);
      },
    },
    Mutation: {
      reorderExercises: async (_parent: unknown, args: ReorderExerciseArgs) => {
        return deps.ReorderExercisesUseCase.execute(args);
      },
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
