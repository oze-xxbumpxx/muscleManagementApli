import { sequelize } from "@/config/database";
import { initTrainingSession, TrainingSession } from "./trainingSession";
import { Exercise, initExercise } from "./exercise";

// モデルの初期化
initTrainingSession(sequelize);
initExercise(sequelize);

// リレーション設定
TrainingSession.hasMany(Exercise, {
  foreignKey: "trainingSessionId",
  as: "exercises",
  onDelete: "CASCADE",
});

Exercise.belongsTo(TrainingSession, {
  foreignKey: "trainingSessionId",
  as: "trainingSession",
});

// エクスポート
export { sequelize, TrainingSession, Exercise
};
