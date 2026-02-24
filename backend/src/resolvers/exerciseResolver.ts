import { AddExerciseUseCase } from '@/usecases/addExerciseUseCase';

type AddExerciseInput = Omit<Parameters<AddExerciseUseCase['execute']>[0], 'trainingSessionId'>;

interface AddExerciseArgs {
  trainingSessionId: number;
  input: AddExerciseInput;
}

interface ExerciseResolverDeps {
  AddExerciseUseCase: AddExerciseUseCase;
}

export function createExerciseResolver(deps: ExerciseResolverDeps) {
  return {
    Query: {},
    Mutation: {
      addExercise: async (_parent: unknown, args: AddExerciseArgs) => {
        return deps.AddExerciseUseCase.execute({
          trainingSessionId: args.trainingSessionId,
          ...args.input,
        });
      },
    },
  };
}
