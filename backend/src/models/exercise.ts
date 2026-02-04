import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    Sequelize,
} from 'sequelize';

/**
 * Exercise モデル
 * トレーニングセッション（日付単位の記録）内のエクササイズ
 */
class Exercise extends Model<InferAttributes<Exercise>, InferCreationAttributes<Exercise>> {
    // カラム定義
    declare id: CreationOptional<number>;
    declare trainingSessionId: number;
    declare exerciseName: string;
    declare weight: number | null;
    declare reps: number | null;
    declare durationSeconds: number | null;
    declare sets: number;
    declare order: number;
    declare notes: string | null;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

/**
 * モデル初期化関数
 */
function initExercise(sequelize: Sequelize): typeof Exercise {
    Exercise.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            trainingSessionId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'training_sessions',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            exerciseName: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            weight: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: true,
            },
            reps: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            durationSeconds: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            sets: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            order: {
                type: DataTypes.INTEGER,
                allowNull: false,
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
            tableName: 'exercises',
            underscored: true,
            timestamps: true,
        }
    );
    return Exercise;
}
export { initExercise, Exercise };
