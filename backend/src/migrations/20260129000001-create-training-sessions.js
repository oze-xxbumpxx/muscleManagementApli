'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('training_sessions', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
                unique: true,
            },
            body_weight: {
                type: Sequelize.DECIMAL(4, 1),
                allowNull: true,
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
        await queryInterface.addIndex('training_sessions', ['date'], {
            name: 'idx_training_sessions_date',
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('training_sessions');
    },
};
