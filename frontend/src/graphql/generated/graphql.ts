import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** 日付（YYYY-MM-DD形式） */
  Date: { input: string; output: string; }
  /** 日時（ISO 8601形式: YYYY-MM-DDTHH:mm:ss.sssZ） */
  DateTime: { input: string; output: string; }
};

/**
 * エクササイズ作成用Input
 * 注意: reps と durationSeconds は排他的（どちらか1つのみ指定）
 */
export type CreateExerciseInput = {
  durationSeconds?: InputMaybe<Scalars['Int']['input']>;
  exerciseName: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<Scalars['Int']['input']>;
  reps?: InputMaybe<Scalars['Int']['input']>;
  sets: Scalars['Int']['input'];
  weight?: InputMaybe<Scalars['Float']['input']>;
};

/** トレーニングセッション作成用Input */
export type CreateTrainingSessionInput = {
  bodyWeight?: InputMaybe<Scalars['Float']['input']>;
  date: Scalars['Date']['input'];
  exercises: Array<CreateExerciseInput>;
  notes?: InputMaybe<Scalars['String']['input']>;
};

/** 削除操作の結果 */
export type DeleteResult = {
  __typename?: 'DeleteResult';
  deletedId?: Maybe<Scalars['ID']['output']>;
  success: Scalars['Boolean']['output'];
};

/** エクササイズ（種目の詳細） */
export type Exercise = {
  __typename?: 'Exercise';
  createdAt: Scalars['DateTime']['output'];
  durationSeconds?: Maybe<Scalars['Int']['output']>;
  exerciseName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  order: Scalars['Int']['output'];
  reps?: Maybe<Scalars['Int']['output']>;
  sets: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
  weight?: Maybe<Scalars['Float']['output']>;
};

/** 種目の出現回数（直近N回の集計） */
export type ExerciseFrequency = {
  __typename?: 'ExerciseFrequency';
  count: Scalars['Int']['output'];
  exerciseName: Scalars['String']['output'];
};

/** 種目の履歴（成長グラフ用） */
export type ExerciseHistory = {
  __typename?: 'ExerciseHistory';
  bodyWeight?: Maybe<Scalars['Float']['output']>;
  date: Scalars['Date']['output'];
  durationSeconds?: Maybe<Scalars['Int']['output']>;
  exerciseName: Scalars['String']['output'];
  reps?: Maybe<Scalars['Int']['output']>;
  sets: Scalars['Int']['output'];
  weight?: Maybe<Scalars['Float']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** エクササイズ追加（既存セッションに） */
  addExercise: Exercise;
  /** トレーニングセッション作成（エクササイズも同時作成） */
  createTrainingSession: TrainingSession;
  /** エクササイズ削除 */
  deleteExercise: DeleteResult;
  /** トレーニングセッション削除（関連エクササイズも削除） */
  deleteTrainingSession: DeleteResult;
  /** エクササイズの並び順を更新 */
  reorderExercises: Array<Exercise>;
  /** エクササイズ更新 */
  updateExercise: Exercise;
  /** トレーニングセッション更新（基本情報のみ） */
  updateTrainingSession: TrainingSession;
};


export type MutationAddExerciseArgs = {
  input: CreateExerciseInput;
  trainingSessionId: Scalars['Int']['input'];
};


export type MutationCreateTrainingSessionArgs = {
  input: CreateTrainingSessionInput;
};


export type MutationDeleteExerciseArgs = {
  id: Scalars['Int']['input'];
};


export type MutationDeleteTrainingSessionArgs = {
  id: Scalars['Int']['input'];
};


export type MutationReorderExercisesArgs = {
  exerciseIds: Array<Scalars['Int']['input']>;
  trainingSessionId: Scalars['Int']['input'];
};


export type MutationUpdateExerciseArgs = {
  id: Scalars['Int']['input'];
  input: UpdateExerciseInput;
};


export type MutationUpdateTrainingSessionArgs = {
  id: Scalars['Int']['input'];
  input: UpdateTrainingSessionInput;
};

export type Query = {
  __typename?: 'Query';
  /** 特定種目の連続実施回数 */
  exerciseConsecutiveCount: Scalars['Int']['output'];
  /** 種目の履歴取得（成長グラフ用） */
  exerciseHistory: Array<ExerciseHistory>;
  /** 全種目名の一覧（オートコンプリート用） */
  exerciseNames: Array<Scalars['String']['output']>;
  /** 直近N回のトレーニングで実施した種目の頻度 */
  recentExerciseFrequency: Array<ExerciseFrequency>;
  /** ストリーク情報取得 */
  streakInfo: StreakInfo;
  /** 指定月のトレーニング日一覧（カレンダー用） */
  trainingDaysInMonth: Array<TrainingDay>;
  /** 特定のトレーニングセッション取得 */
  trainingSession?: Maybe<TrainingSession>;
  /** 日付でトレーニングセッション取得 */
  trainingSessionByDate?: Maybe<TrainingSession>;
  /** トレーニングセッション一覧取得（日付降順） */
  trainingSessions: TrainingSessionListResult;
};


export type QueryExerciseConsecutiveCountArgs = {
  exerciseName: Scalars['String']['input'];
};


export type QueryExerciseHistoryArgs = {
  exerciseName: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryRecentExerciseFrequencyArgs = {
  sessionCount?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTrainingDaysInMonthArgs = {
  month: Scalars['Int']['input'];
  year: Scalars['Int']['input'];
};


export type QueryTrainingSessionArgs = {
  id: Scalars['Int']['input'];
};


export type QueryTrainingSessionByDateArgs = {
  date: Scalars['Date']['input'];
};


export type QueryTrainingSessionsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

/** ストリーク情報（継続可視化） */
export type StreakInfo = {
  __typename?: 'StreakInfo';
  currentStreak: Scalars['Int']['output'];
  longestStreak: Scalars['Int']['output'];
  thisMonthCount: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
};

/** カレンダー用のトレーニング日データ */
export type TrainingDay = {
  __typename?: 'TrainingDay';
  date: Scalars['Date']['output'];
  exerciseCount: Scalars['Int']['output'];
};

/** トレーニングセッション（日付単位の記録） */
export type TrainingSession = {
  __typename?: 'TrainingSession';
  bodyWeight?: Maybe<Scalars['Float']['output']>;
  createdAt: Scalars['DateTime']['output'];
  date: Scalars['Date']['output'];
  exercises: Array<Exercise>;
  id: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

/** トレーニングセッション一覧の取得結果 */
export type TrainingSessionListResult = {
  __typename?: 'TrainingSessionListResult';
  items: Array<TrainingSession>;
  totalCount: Scalars['Int']['output'];
};

/** エクササイズ更新用Input */
export type UpdateExerciseInput = {
  durationSeconds?: InputMaybe<Scalars['Int']['input']>;
  exerciseName?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  reps?: InputMaybe<Scalars['Int']['input']>;
  sets?: InputMaybe<Scalars['Int']['input']>;
  weight?: InputMaybe<Scalars['Float']['input']>;
};

/** トレーニングセッション更新用Input */
export type UpdateTrainingSessionInput = {
  bodyWeight?: InputMaybe<Scalars['Float']['input']>;
  date?: InputMaybe<Scalars['Date']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
};

export type TrainingSessionsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type TrainingSessionsQuery = { __typename?: 'Query', trainingSessions: { __typename?: 'TrainingSessionListResult', totalCount: number, items: Array<{ __typename?: 'TrainingSession', id: string, date: string, bodyWeight?: number | null, notes?: string | null, exercises: Array<{ __typename?: 'Exercise', id: string, exerciseName: string, order: number, sets: number, reps?: number | null, durationSeconds?: number | null, weight?: number | null }> }> } };

export type TrainingSessionQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type TrainingSessionQuery = { __typename?: 'Query', trainingSession?: { __typename?: 'TrainingSession', id: string, date: string, bodyWeight?: number | null, notes?: string | null, exercises: Array<{ __typename?: 'Exercise', id: string, exerciseName: string, order: number, sets: number, reps?: number | null, durationSeconds?: number | null, weight?: number | null, notes?: string | null }> } | null };

export type CreateTrainingSessionMutationVariables = Exact<{
  input: CreateTrainingSessionInput;
}>;


export type CreateTrainingSessionMutation = { __typename?: 'Mutation', createTrainingSession: { __typename?: 'TrainingSession', id: string, date: string } };


export const TrainingSessionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TrainingSessions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"trainingSessions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"bodyWeight"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"exercises"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"exerciseName"}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"sets"}},{"kind":"Field","name":{"kind":"Name","value":"reps"}},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"weight"}}]}}]}}]}}]}}]} as unknown as DocumentNode<TrainingSessionsQuery, TrainingSessionsQueryVariables>;
export const TrainingSessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TrainingSession"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"trainingSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"bodyWeight"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"exercises"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"exerciseName"}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"sets"}},{"kind":"Field","name":{"kind":"Name","value":"reps"}},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}}]}}]}}]}}]} as unknown as DocumentNode<TrainingSessionQuery, TrainingSessionQueryVariables>;
export const CreateTrainingSessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTrainingSession"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTrainingSessionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTrainingSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"date"}}]}}]}}]} as unknown as DocumentNode<CreateTrainingSessionMutation, CreateTrainingSessionMutationVariables>;