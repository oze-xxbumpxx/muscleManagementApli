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

/**
 * GraphQLスキーマを読み込む
 */
function loadTypeDefs(): string {
  const schemaPath = join(__dirname, 'graphql', 'schema.graphql');
  return readFileSync(schemaPath, 'utf-8');
}

/**
 * 仮のリゾルバー（後で実装）
 */
const trainingSessionRepository = new TrainingSessionRepository();
const exerciseRepository = new ExerciseRepository();
const createTrainingSessionUseCase = new CreateTrainingSessionUseCase(
  trainingSessionRepository,
  exerciseRepository
);
const updateTrainingSessionUseCase = new UpdateTrainingSessionUseCase(trainingSessionRepository);
const deleteTrainingSessionUseCase = new DeleteTrainingSessionUseCase(trainingSessionRepository);
const trainingResolver = createTrainingResolver({
  CreateTrainingSessionUseCase: createTrainingSessionUseCase,
  UpdateTrainingSessionUseCase: updateTrainingSessionUseCase,
  DeleteTrainingSessionUseCase: deleteTrainingSessionUseCase,
});

const resolvers = {
  // カスタムスカラー
  ...scalarResolvers,

  Query: {
    // TODO: 実装予定
    trainingSessions: (): [] => [],
    trainingSession: (): null => null,
    trainingSessionByDate: (): null => null,
    exerciseHistory: (): [] => [],
    recentExerciseFrequency: (): [] => [],
    exerciseConsecutiveCount: (): number => 0,
    streakInfo: () => ({
      currentStreak: 0,
      longestStreak: 0,
      thisMonthCount: 0,
      totalCount: 0,
    }),
    trainingDaysInMonth: (): [] => [],
    exerciseNames: (): [] => [],
  },

  Mutation: {
    // TODO: 実装予定
    ...trainingResolver.Mutation,
    addExercise: () => {
      throw new Error('Not implemented');
    },
    updateExercise: () => {
      throw new Error('Not implemented');
    },
    deleteExercise: () => {
      throw new Error('Not implemented');
    },
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
