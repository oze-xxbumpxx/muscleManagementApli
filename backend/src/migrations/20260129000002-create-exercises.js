'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('exercises', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            training_session_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'training_sessions',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            exercise_name: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            weight: {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: true,
            },
            reps: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            duration_seconds: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            sets: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            order: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // インデックス作成
        await queryInterface.addIndex('exercises', ['training_session_id'], {
            name: 'idx_exercises_training_session_id',
        });

        await queryInterface.addIndex('exercises', ['exercise_name'], {
            name: 'idx_exercises_exercise_name',
        });

        // CHECK制約: sets > 0
        await queryInterface.sequelize.query(`
      ALTER TABLE exercises
      ADD CONSTRAINT chk_exercises_sets_positive
      CHECK (sets > 0)
    `);

        // CHECK制約: reps または duration_seconds のどちらかは必須
        await queryInterface.sequelize.query(`
      ALTER TABLE exercises
      ADD CONSTRAINT chk_exercises_reps_or_duration
      CHECK (
        (reps IS NOT NULL AND reps > 0) OR
        (duration_seconds IS NOT NULL AND duration_seconds > 0)
      )
    `);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('exercises');
    },
};
