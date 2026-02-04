/**
 * Sequelize CLI 用設定ファイル
 * マイグレーション実行時に使用
 */
require('dotenv').config();

module.exports = {
    development: {
        username: process.env.DB_USER || 'user',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'muscle_management_dev',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        dialect: 'postgres',
        logging: console.log,
        define: {
            underscored: true,
            timestamps: true,
        },
    },
    test: {
        username: process.env.DB_USER || 'user',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'muscle_management_test',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433', 10),
        dialect: 'postgres',
        logging: false,
        define: {
            underscored: true,
            timestamps: true,
        },
    },
    production: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        dialect: 'postgres',
        logging: false,
        define: {
            underscored: true,
            timestamps: true,
        },
    },
};
