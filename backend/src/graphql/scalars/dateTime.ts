import { GraphQLScalarType, Kind, ValueNode } from 'graphql';

/**
 * ISO 8601形式の正規表現
 * 形式: YYYY-MM-DDTHH:mm:ss.sssZ または YYYY-MM-DDTHH:mm:ssZ
 */
const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

/**
 * ISO 8601形式の日時文字列かどうかを検証
 */
function isValidISODateString(value: string): boolean {
    if (!ISO_8601_REGEX.test(value)) {
        return false;
    }
    const date = new Date(value);
    return !isNaN(date.getTime());
}

/**
 * DateTime カスタムスカラー
 * 形式: ISO 8601（YYYY-MM-DDTHH:mm:ss.sssZ）
 */
export const DateTimeScalar = new GraphQLScalarType({
    name: 'DateTime',
    description: '日時（ISO 8601形式: YYYY-MM-DDTHH:mm:ss.sssZ）',

    /**
     * サーバー → クライアント（レスポンス時）
     */
    serialize(value: unknown): string {
        if (value instanceof Date) {
            return value.toISOString();
        }
        if (typeof value === 'string') {
            if (isValidISODateString(value)) {
                return new Date(value).toISOString();
            }
        }
        throw new Error('DateTime cannot represent an invalid date-time string');
    },

    /**
     * クライアント → サーバー（変数として）
     */
    parseValue(value: unknown): Date {
        if (typeof value !== 'string') {
            throw new Error('DateTime must be a string');
        }
        if (!isValidISODateString(value)) {
            throw new Error('DateTime must be a valid ISO 8601 date-time string');
        }
        return new Date(value);
    },

    /**
     * クライアント → サーバー（クエリ内リテラル）
     */
    parseLiteral(ast: ValueNode): Date {
        if (ast.kind !== Kind.STRING) {
            throw new Error('DateTime must be a string');
        }
        if (!isValidISODateString(ast.value)) {
            throw new Error('DateTime must be a valid ISO 8601 date-time string');
        }
        return new Date(ast.value);
    },
});
