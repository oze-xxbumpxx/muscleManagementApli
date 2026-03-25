import type { TrainingSession } from '@/domain/types/trainingSession';
import type { Exercise } from '@/domain/types/exercise';
import type { TrainingSession as TrainingSessionModel } from '@/models/trainingSession';
import { Exercise as ExerciseSequelizeModel } from '@/models/exercise';
import type { Exercise as ExerciseModel } from '@/models/exercise';

export function toNumberOrNull(value: unknown): number | null {
  if (value === null) {
    return null;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

function mapSessionExercisesToDomain(model: TrainingSessionModel): Exercise[] {
  const raw = model.get('exercises');
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: Exercise[] = [];
  for (const item of raw) {
    if (item instanceof ExerciseSequelizeModel) {
      out.push(mapExerciseToDomain(item));
    }
  }
  return out;
}

export function mapTrainingSessionToDomain(model: TrainingSessionModel): TrainingSession {
  return {
    id: model.id,
    date: model.date,
    bodyWeight: model.bodyWeight,
    notes: model.notes,
    exercises: mapSessionExercisesToDomain(model),
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
}

export function mapExerciseToDomain(model: ExerciseModel): Exercise {
  return {
    id: model.id,
    trainingSessionId: model.trainingSessionId,
    exerciseName: model.exerciseName,
    weight: model.weight,
    reps: model.reps,
    durationSeconds: model.durationSeconds,
    sets: model.sets,
    order: model.order,
    notes: model.notes,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
}
