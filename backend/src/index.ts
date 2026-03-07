import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ExerciseRepository } from './infrastructure/sequelize/repositories/exerciseRepository';
import { TrainingSessionRepository } from './infrastructure/sequelize/repositories/trainingSessionRepository';
import { createTrainingResolver } from './resolvers/trainingResolver';
import { scalarResolvers } from './graphql/scalars';
import { testConnection } from './config/database';
import { CreateTrainingSessionUseCase } from '@/usecases/createTrainingSessionUsecase';
import { UpdateTrainingSessionUseCase } from '@/usecases/updateTrainingSessionUsecase';
import { DeleteTrainingSessionUseCase } from '@/usecases/deleteTrainingSessionUsecase';
import { GetTrainingSessionByDateUseCase } from '@/usecases/getTrainingSessionByDateUsecase';
import { GetTrainingSessionsUseCase } from '@/usecases/getTrainingSessionsUseCase';
import { GetTrainingSessionByIdUseCase } from '@/usecases/getTrainingSessionByIdUseCase';
import { AddExerciseUseCase } from '@/usecases/addExerciseUseCase';
import { createExerciseResolver } from '@/resolvers/exerciseResolver';
import { UpdateExerciseUseCase } from '@/usecases/updateExerciseUseCase';
import { DeleteExerciseUseCase } from '@/usecases/deleteExerciseUseCase';
import { GetExerciseNamesUseCase } from '@/usecases/getExerciseNamesUseCase';
import { GetExerciseHistoryUsecase } from '@/usecases/getExerciseHistoryUsecase';

/**
 * GraphQLスキーマを読み込む
 */
function loadTypeDefs(): string {
  const schemaPath = join(__dirname, 'graphql', 'schema.graphql');
  return readFileSync(schemaPath, 'utf-8');
}

const trainingSessionRepository = new TrainingSessionRepository();
const exerciseRepository = new ExerciseRepository();
const createTrainingSessionUseCase = new CreateTrainingSessionUseCase(
  trainingSessionRepository,
  exerciseRepository
);
const updateTrainingSessionUseCase = new UpdateTrainingSessionUseCase(trainingSessionRepository);
const deleteTrainingSessionUseCase = new DeleteTrainingSessionUseCase(trainingSessionRepository);
const getTrainingSessionByDateUsecase = new GetTrainingSessionByDateUseCase(
  trainingSessionRepository
);
const getTrainingSessionByIdUsecase = new GetTrainingSessionByIdUseCase(trainingSessionRepository);
const getTrainingSessionsUseCase = new GetTrainingSessionsUseCase(trainingSessionRepository);
const addExerciseUseCase = new AddExerciseUseCase(exerciseRepository, trainingSessionRepository);
const updateExerciseUseCase = new UpdateExerciseUseCase(exerciseRepository);
const deleteExerciseUseCase = new DeleteExerciseUseCase(exerciseRepository);
const getExerciseNameUseCase = new GetExerciseNamesUseCase(exerciseRepository);
const getExerciseHistoryUseCase = new GetExerciseHistoryUsecase(exerciseRepository);
const trainingResolver = createTrainingResolver({
  CreateTrainingSessionUseCase: createTrainingSessionUseCase,
  UpdateTrainingSessionUseCase: updateTrainingSessionUseCase,
  DeleteTrainingSessionUseCase: deleteTrainingSessionUseCase,
  GetTrainingSessionByDateUseCase: getTrainingSessionByDateUsecase,
  GetTrainingSessionsUseCase: getTrainingSessionsUseCase,
  GetTrainingSessionByIdUseCase: getTrainingSessionByIdUsecase,
});

const exerciseResolver = createExerciseResolver({
  AddExerciseUseCase: addExerciseUseCase,
  UpdateExerciseUseCase: updateExerciseUseCase,
  DeleteExerciseUseCase: deleteExerciseUseCase,
  GetExerciseNameUseCase: getExerciseNameUseCase,
  GetExerciseHistoryUseCase: getExerciseHistoryUseCase,
});

const resolvers = {
  // カスタムスカラー
  ...scalarResolvers,

  Query: {
    // TODO: 実装予定
    ...trainingResolver.Query,
    ...exerciseResolver.Query,
    recentExerciseFrequency: (): [] => [],
    exerciseConsecutiveCount: (): number => 0,
    streakInfo: () => ({
      currentStreak: 0,
      longestStreak: 0,
      thisMonthCount: 0,
      totalCount: 0,
    }),
    trainingDaysInMonth: (): [] => [],
  },

  Mutation: {
    // TODO: 実装予定
    ...trainingResolver.Mutation,
    ...exerciseResolver.Mutation,
    reorderExercises: (): [] => [],
  },
};

/**
 * サーバー起動
 */
async function startServer(): Promise<void> {
  // データベース接続テスト
  await testConnection();

  // Apollo Server インスタンス作成
  const server = new ApolloServer({
    typeDefs: loadTypeDefs(),
    resolvers,
  });

  // サーバー起動
  const port = parseInt(process.env['PORT'] ?? '4000', 10);
  const { url } = await startStandaloneServer(server, {
    listen: { port },
  });

  console.warn(`🚀 Server ready at ${url}`);
  console.warn(`📊 GraphQL Playground: ${url}`);
}

// サーバー起動
startServer().catch((error: unknown) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
