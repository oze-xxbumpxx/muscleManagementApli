import type { ITrainingSessionRepository } from '@/domain/repositories/trainingSessionRepository';
import type {
  TrainingDay,
  TrainingSession,
  TrainingSessionCreateInput,
  TrainingSessionDeleteResult,
  TrainingSessionListQuery,
  TrainingSessionListResult,
  TrainingSessionStreakSummary,
  TrainingSessionUpdateInput,
} from '@/domain/types/trainingSession';
import { mapTrainingSessionToDomain } from '@/infrastructure/sequelize/mappers';
import { TrainingSession as TrainingSessionModel } from '@/models/trainingSession';
import { Op, Transaction } from 'sequelize';
import { Exercise as ExerciseModel } from '@/models/exercise';

interface TrainingDayAggregateRow {
  date: string;
  exerciseCount: string | number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}
function isTrainingDayAggregateRow(value: unknown): value is TrainingDayAggregateRow {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value['date'] === 'string' &&
    (typeof value['exerciseCount'] === 'string' || typeof value['exerciseCount'] === 'number')
  );
}

function mapAggregateRowToTrainingDay(row: TrainingDayAggregateRow): TrainingDay {
  const exerciseCount =
    typeof row.exerciseCount === 'number' ? row.exerciseCount : Number(row.exerciseCount);
  return {
    date: row.date,
    exerciseCount: Number.isNaN(exerciseCount) ? 0 : exerciseCount,
  };
}

function uniquePreservingOrder(dates: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const date of dates) {
    if (!seen.has(date)) {
      seen.add(date);
      result.push(date);
    }
  }
  return result;
}

// 文字日付を1日ずつ比較する
function isConsecutive(dateA: string, dateB: string): boolean {
  // dateAがdateBの翌日かどうか
  const a = new Date(dateA);
  const b = new Date(dateB);
  const diff = (a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
  return diff === 1;
}

function calcCurrentStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // 最新の記録が今日でも昨日でもなければストリーク０を返却
  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const newer = dates[i - 1];
    const older = dates[i];
    if (newer === undefined || older === undefined) break;
    if (isConsecutive(newer, older)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// 最長ストリーク（昇順に並び替えて計算）
function calcLongestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const sorted = [...dates].reverse();
  let maxStreak = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const newer = sorted[i];
    const older = sorted[i - 1];
    if (newer === undefined || older === undefined) break;
    if (isConsecutive(newer, older)) {
      current++;
      maxStreak = Math.max(maxStreak, current);
    } else {
      break;
    }
  }
  return maxStreak;
}

export class TrainingSessionRepository implements ITrainingSessionRepository {
  async create(
    input: TrainingSessionCreateInput,
    transaction?: Transaction
  ): Promise<TrainingSession> {
    const created = await TrainingSessionModel.create(
      {
        date: input.date,
        bodyWeight: input.bodyWeight,
        notes: input.notes,
      },
      { transaction }
    );
    return mapTrainingSessionToDomain(created);
  }

  async findById(id: number): Promise<TrainingSession | null> {
    const session = await TrainingSessionModel.findByPk(id);
    return session ? mapTrainingSessionToDomain(session) : null;
  }

  async findByDate(date: string): Promise<TrainingSession | null> {
    const session = await TrainingSessionModel.findOne({ where: { date } });
    return session ? mapTrainingSessionToDomain(session) : null;
  }

  async findByMonth(year: number, month: number): Promise<TrainingSession[]> {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    const sessions = await TrainingSessionModel.findAll({
      where: {
        date: {
          [Op.gte]: startDate.toISOString().slice(0, 10),
          [Op.lt]: endDate.toISOString().slice(0, 10),
        },
      },
      order: [['date', 'DESC']],
    });
    return sessions.map(mapTrainingSessionToDomain);
  }

  async findTrainingDaysInMonth(year: number, month: number): Promise<TrainingDay[]> {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));
    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = endDate.toISOString().slice(0, 10);

    const sessions = await TrainingSessionModel.findAll({
      where: {
        date: { [Op.gte]: startStr, [Op.lt]: endStr },
      },
      include: [{ model: ExerciseModel, as: 'exercises', attributes: ['id'] }],
      order: [['date', 'DESC']],
    });
    const mapped = sessions
      .map((session): unknown => ({
        date: session.date,
        exerciseCount: session.exercises?.length ?? 0,
      }))
      .filter(isTrainingDayAggregateRow);

    if (mapped.length !== sessions.length) {
      throw new Error(
        `TrainingDay conversion failed: expected ${sessions.length}, got ${mapped.length}`
      );
    }
    return mapped.map(mapAggregateRowToTrainingDay);
  }

  async findAll(query: TrainingSessionListQuery): Promise<TrainingSessionListResult> {
    const { limit, offset } = query;
    const { count, rows } = await TrainingSessionModel.findAndCountAll({
      limit,
      offset,
      order: [['date', 'DESC']],
    });
    return {
      totalCount: count,
      items: rows.map(mapTrainingSessionToDomain),
    };
  }

  async getStreakSummary(): Promise<TrainingSessionStreakSummary> {
    const totalCount = await TrainingSessionModel.count();

    // 全日付を降順で取得（ストリーク計算用）
    const allSessions = await TrainingSessionModel.findAll({
      attributes: ['date'],
      order: [['date', 'DESC']],
      raw: true,
    });

    const dates = allSessions.map((s) => s.date);
    const uniqueDates = uniquePreservingOrder(dates);
    const currentStreak = calcCurrentStreak(uniqueDates);
    const longestStreak = calcLongestStreak(uniqueDates);
    const lastTrainingDate = uniqueDates[0] ?? null;

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const thisMonthCount = await TrainingSessionModel.count({
      where: {
        date: {
          [Op.gte]: monthStart.toISOString().slice(0, 10),
          [Op.lt]: nextMonthStart.toISOString().slice(0, 10),
        },
      },
    });
    return {
      currentStreak,
      longestStreak,
      lastTrainingDate,
      thisMonthCount,
      totalCount,
    };
  }

  async update(
    id: number,
    input: TrainingSessionUpdateInput,
    transaction?: Transaction
  ): Promise<TrainingSession | null> {
    const session = await TrainingSessionModel.findByPk(id, { transaction });
    if (!session) {
      return null;
    }

    await session.update({
      date: input.date ?? session.date,
      bodyWeight: input.bodyWeight !== undefined ? input.bodyWeight : session.bodyWeight,
      notes: input.notes !== undefined ? input.notes : session.notes,
    });
    return mapTrainingSessionToDomain(session);
  }

  async deleteById(id: number, transaction?: Transaction): Promise<TrainingSessionDeleteResult> {
    const deletedCount = await TrainingSessionModel.destroy({
      where: { id },
      transaction,
    });
    return {
      success: deletedCount > 0,
      deletedId: deletedCount > 0 ? id : null,
    };
  }
}
