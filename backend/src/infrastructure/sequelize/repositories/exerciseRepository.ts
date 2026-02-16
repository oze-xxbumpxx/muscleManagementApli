import type { IExerciseRepository } from '@/domain/repositories/exerciseRepository';
import {
  Exercise,
  ExerciseCreateInput,
  ExerciseDeleteResult,
  ExerciseListQuery,
  ExerciseListResult,
  ExerciseUpdateInput,
} from '@/domain/types/exercise';
import { Exercise as ExerciseModel } from '@/models/exercise';
import { mapExerciseToDomain } from '../mappers';
import { Transaction } from 'sequelize';

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

  async update(id: number, input: ExerciseUpdateInput): Promise<Exercise | null> {
    const exercise = await ExerciseModel.findByPk(id);
    if (!exercise) {
      return null;
    }

    await exercise.update({
      exerciseName: input.exerciseName ?? exercise.exerciseName,
      weight: input.weight !== undefined ? input.weight : exercise.weight,
      reps: input.reps !== undefined ? input.reps : exercise.reps,
      durationSeconds:
        input.durationSeconds !== undefined ? input.durationSeconds : exercise.durationSeconds,
      sets: input.sets ?? exercise.sets,
      order: input.order ?? exercise.order,
      notes: input.notes !== undefined ? input.notes : exercise.notes,
    });
    return mapExerciseToDomain(exercise);
  }

  async deleteById(id: number): Promise<ExerciseDeleteResult> {
    const deletedCount = await ExerciseModel.destroy({
      where: {
        id,
      },
    });
    return {
      success: deletedCount > 0,
      deletedId: deletedCount > 0 ? id : null,
    };
  }
}
