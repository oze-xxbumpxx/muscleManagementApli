import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
  NonAttribute,
} from 'sequelize';
import type { Exercise } from './exercise';

/**
 * TrainingSession モデル
 * トレーニングセッション（日付単位の記録）
 */
class TrainingSession extends Model<
  InferAttributes<TrainingSession>,
  InferCreationAttributes<TrainingSession>
> {
  // カラム定義
  declare id: CreationOptional<number>;
  declare date: string;
  declare bodyWeight: number | null;
  declare notes: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare exercises?: NonAttribute<Exercise[]>;
}

/**
 * モデル初期化関数
 */
function initTrainingSession(sequelize: Sequelize): typeof TrainingSession {
  TrainingSession.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        unique: true,
      },
      bodyWeight: {
        type: DataTypes.DECIMAL(4, 1),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'training_sessions',
      underscored: true,
      timestamps: true,
    }
  );
  return TrainingSession;
}
export { initTrainingSession, TrainingSession };
