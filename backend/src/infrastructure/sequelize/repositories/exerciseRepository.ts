import type { IExerciseRepository } from '@/domain/repositories/exerciseRepository';
import { TrainingSession as TrainingSessionModel } from '@/models/trainingSession';
import {
  Exercise,
  ExerciseCreateInput,
  ExerciseDeleteResult,
  ExerciseHistoryItem,
  ExerciseHistoryQuery,
  ExerciseListQuery,
  ExerciseListResult,
  ExerciseUpdateInput,
} from '@/domain/types/exercise';
import { Exercise as ExerciseModel } from '@/models/exercise';
import { mapExerciseToDomain, toNumberOrNull } from '../mappers';
import { col, fn, Transaction } from 'sequelize';

interface TrainingSessionHistoryShape {
  date: string;
  bodyWeight: number | null;
}

function isTrainingSessionHistoryShape(value: unknown): value is TrainingSessionHistoryShape {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  if (!('date' in value) || typeof value.date !== 'string') {
    return false;
  }

  if (!('bodyWeight' in value)) {
    return false;
  }

  return typeof value.bodyWeight === 'number' || value.bodyWeight === null;
}
export class ExerciseRepository implements IExerciseRepository {
  async create(input: ExerciseCreateInput, transaction?: Transaction): Promise<Exercise> {
    const created = await ExerciseModel.create(
      {
        trainingSessionId: input.trainingSessionId,
        exerciseName: input.exerciseName,
        weight: input.weight,
        reps: input.reps,
        durationSeconds: input.durationSeconds,
        sets: input.sets,
        order: input.order,
        notes: input.notes,
      },
      { transaction }
    );
    return mapExerciseToDomain(created);
  }

  async createMany(inputs: ExerciseCreateInput[], transaction?: Transaction): Promise<Exercise[]> {
    if (inputs.length === 0) {
      return [];
    }

    const created = await ExerciseModel.bulkCreate(
      inputs.map((input) => ({
        trainingSessionId: input.trainingSessionId,
        exerciseName: input.exerciseName,
        weight: input.weight,
        reps: input.reps,
        durationSeconds: input.durationSeconds,
        sets: input.sets,
        order: input.order,
        notes: input.notes,
      })),
      {
        validate: true,
        returning: true,
        transaction,
      }
    );
    return created.map(mapExerciseToDomain);
  }

  async findById(id: number): Promise<Exercise | null> {
    const exercise = await ExerciseModel.findByPk(id);
    return exercise ? mapExerciseToDomain(exercise) : null;
  }

  async findByTrainingSessionId(trainingSessionId: number): Promise<Exercise[]> {
    const exercises = await ExerciseModel.findAll({
      where: {
        trainingSessionId,
      },
      order: [['order', 'ASC']],
    });
    return exercises.map(mapExerciseToDomain);
  }

  async findAll(query: ExerciseListQuery): Promise<ExerciseListResult> {
    const { limit, offset } = query;
    const { count, rows } = await ExerciseModel.findAndCountAll({
      limit,
      offset,
      order: [['order', 'ASC']],
    });
    return {
      totalCount: count,
      items: rows.map(mapExerciseToDomain),
    };
  }

  async findExerciseNames(): Promise<string[]> {
    const exercises = await ExerciseModel.findAll({
      attributes: [[fn('DISTINCT', col('exercise_name')), 'exerciseName']],
      order: [['exerciseName', 'ASC']],
      raw: true,
    });

    const normalizedNames = exercises
      .map((exercise) => exercise.exerciseName.trim())
      .filter((name) => name.length > 0);
    return [...new Set(normalizedNames)].sort((a, b) => a.localeCompare(b, 'ja'));
  }

  async findExerciseHistory(query: ExerciseHistoryQuery): Promise<ExerciseHistoryItem[]> {
    const { exerciseName, limit } = query;

    const rows = await ExerciseModel.findAll({
      where: { exerciseName },
      include: [
        {
          model: TrainingSessionModel,
          as: 'trainingSession',
          attributes: ['date', 'bodyWeight'],
          required: true,
        },
      ],
      order: [[{ model: TrainingSessionModel, as: 'trainingSession' }, 'date', 'DESC']],
      limit,
    });

    return rows.map((row) => {
      const trainingSession = row.get('trainingSession');

      if (!isTrainingSessionHistoryShape(trainingSession)) {
        throw new Error('Invalid trainingSession shape for exercise history');
      }

      return {
        date: trainingSession.date,
        exerciseName: row.exerciseName,
        weight: toNumberOrNull(row.weight),
        reps: row.reps,
        durationSeconds: row.durationSeconds,
        sets: row.sets,
        bodyWeight: toNumberOrNull(trainingSession.bodyWeight),
      };
    });
  }

  async update(
    id: number,
    input: ExerciseUpdateInput,
    transaction?: Transaction
  ): Promise<Exercise | null> {
    const exercise = await ExerciseModel.findByPk(id);
    if (!exercise) {
      return null;
    }

    await exercise.update(
      {
        exerciseName: input.exerciseName ?? exercise.exerciseName,
        weight: input.weight !== undefined ? input.weight : exercise.weight,
        reps: input.reps !== undefined ? input.reps : exercise.reps,
        durationSeconds:
          input.durationSeconds !== undefined ? input.durationSeconds : exercise.durationSeconds,
        sets: input.sets ?? exercise.sets,
        order: input.order ?? exercise.order,
        notes: input.notes !== undefined ? input.notes : exercise.notes,
      },
      { transaction }
    );
    return mapExerciseToDomain(exercise);
  }

  async deleteById(id: number, transaction?: Transaction): Promise<ExerciseDeleteResult> {
    const deletedCount = await ExerciseModel.destroy({
      where: {
        id,
      },
      transaction,
    });
    return {
      success: deletedCount > 0,
      deletedId: deletedCount > 0 ? id : null,
    };
  }
}
