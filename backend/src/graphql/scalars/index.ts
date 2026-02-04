import { DateScalar } from './date';
import { DateTimeScalar } from './dateTime';

/**
 * カスタムスカラーリゾルバー
 */
export const scalarResolvers = {
    Date: DateScalar,
    DateTime: DateTimeScalar,
};

export { DateScalar, DateTimeScalar };
