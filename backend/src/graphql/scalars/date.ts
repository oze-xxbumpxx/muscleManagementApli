import { GraphQLScalarType, Kind, ValueNode } from 'graphql';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Date カスタムスカラー
 * 形式: YYYY-MM-DD（ISO 8601 日付部分）
 */
export const DateScalar = new GraphQLScalarType({
    name: 'Date',
    description: '日付（YYYY-MM-DD形式）',

    /**
     * サーバー → クライアント（レスポンス時）
     */
    serialize(value: unknown): string {
        if (value instanceof Date) {
            return value.toISOString().split('T')[0] ?? '';
        }
        if (typeof value === 'string') {
            if (DATE_REGEX.test(value)) {
                return value;
            }
            // ISO 8601形式の場合は日付部分を抽出
            const dateMatch = value.match(/^\d{4}-\d{2}-\d{2}/);
            const matchedDate = dateMatch?.[0];
            if (matchedDate !== undefined) {
                return matchedDate;
            }
        }
        throw new Error('Date cannot represent an invalid date string');
    },

    /**
     * クライアント → サーバー（変数として）
     */
    parseValue(value: unknown): string {
        if (typeof value !== 'string') {
            throw new Error('Date must be a string');
        }
        if (!DATE_REGEX.test(value)) {
            throw new Error('Date must be in YYYY-MM-DD format');
        }
        return value;
    },

    /**
     * クライアント → サーバー（クエリ内リテラル）
     */
    parseLiteral(ast: ValueNode): string {
        if (ast.kind !== Kind.STRING) {
            throw new Error('Date must be a string');
        }
        if (!DATE_REGEX.test(ast.value)) {
            throw new Error('Date must be in YYYY-MM-DD format');
        }
        return ast.value;
    },
});
