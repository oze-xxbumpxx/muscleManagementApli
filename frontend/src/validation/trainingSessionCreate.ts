import z from 'zod';

export const dateStringSchema = z
  .string()
  .min(1, '日付を入力してください')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 形式で入力してください')
  .refine(value => {
    const parts = value.split('-');
    if (parts.length !== 3) {
      return false;
    }
    const yText = parts[0];
    const mText = parts[1];
    const dText = parts[2];
    if (yText === undefined || mText === undefined || dText === undefined) {
      return false;
    }
    const y = Number(yText);
    const m = Number(mText);
    const d = Number(dText);
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
      return false;
    }
    const parsedDate = new Date(Date.UTC(y, m - 1, d));
    return (
      parsedDate.getUTCFullYear() === y &&
      parsedDate.getUTCMonth() === m - 1 &&
      parsedDate.getUTCDate() === d
    );
  }, '存在する日付を入力してください');

const createExercisePayloadSchema = z
  .object({
    exerciseName: z.string().min(1, '種目名を入力してください'),
    weight: z.number().positive().optional(),
    reps: z.number().int().positive().optional(),
    durationSeconds: z.number().int().positive().optional(),
    sets: z.number().int().positive('セット数は1以上の整数で入力してください'),
    order: z.number().int().positive().optional(),
    notes: z.string().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    const hasReps = data.reps !== undefined;
    const hasDuration = data.durationSeconds !== undefined;
    if (!hasReps && !hasDuration) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '回数または秒数のどちらか一方を入力してください',
        path: ['reps'],
      });
    }
  });

export const createTrainingSessionPayloadSchema = z.object({
  date: dateStringSchema,
  bodyWeight: z.number().positive().optional(),
  notes: z.string().max(2000).optional(),
  exercises: z.array(createExercisePayloadSchema).min(1, '種目を１つ以上追加してください'),
});

export type CreateTrainingSessionPayload = z.infer<typeof createTrainingSessionPayloadSchema>;

export function zodErrorToFieldMessages(error: z.ZodError): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (path !== '' && map[path] === undefined) {
      map[path] = issue.message;
    }
  }
  return map;
}
