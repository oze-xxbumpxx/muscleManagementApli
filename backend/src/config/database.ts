import { Sequelize } from 'sequelize';

/**
 * データベース接続設定
 */
interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
}

/**
 * 環境変数から設定を取得（デフォルト値付き）
 */
function getDatabaseConfig(): DatabaseConfig {
    return {
        host: process.env['DB_HOST'] ?? 'localhost',
        port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
        database: process.env['DB_NAME'] ?? 'muscle_management_dev',
        username: process.env['DB_USER'] ?? 'user',
        password: process.env['DB_PASSWORD'] ?? 'password',
    };
}

/**
 * Sequelizeインスタンスを作成
 */
function createSequelizeInstance(): Sequelize {
    const config = getDatabaseConfig();

    return new Sequelize({
        dialect: 'postgres',
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        password: config.password,
        logging: process.env['NODE_ENV'] === 'development' ? console.log : false,
        define: {
            underscored: true, // snake_case でカラム名を生成
            timestamps: true, // createdAt, updatedAt を自動管理
        },
    });
}

// Sequelizeインスタンス（シングルトン）
export const sequelize = createSequelizeInstance();

/**
 * データベース接続テスト
 */
export async function testConnection(): Promise<void> {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        throw error;
    }
}
