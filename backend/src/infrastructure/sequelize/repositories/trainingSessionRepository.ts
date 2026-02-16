import type { ITrainingSessionRepository } from '@/domain/repositories/trainingSessionRepository';
import type {
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

  async deleteById(id: number): Promise<TrainingSessionDeleteResult> {
    const deletedCount = await TrainingSessionModel.destroy({
      where: { id },
    });
    return {
      success: deletedCount > 0,
      deletedId: deletedCount > 0 ? id : null,
    };
  }

  async getStreakSummary(): Promise<TrainingSessionStreakSummary> {
    const totalCount = await TrainingSessionModel.count();

    const latest = await TrainingSessionModel.findOne({
      order: [['date', 'DESC']],
    });

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
      currentStreak: 0,
      longestStreak: 0,
      lastTrainingDate: latest ? latest.date : null,
      thisMonthCount,
      totalCount,
    };
  }
}
