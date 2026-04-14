import z from 'zod';
import { dateStringSchema } from './trainingSessionCreate';

export const updateTrainingSessionPayloadSchema = z
  .object({
    date: dateStringSchema,
    bodyWeight: z.number().positive().optional(),
    notes: z.string().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    const hasDate = data.date !== undefined;
    const hasBodyWeight = data.bodyWeight !== undefined;
    const hasNotes = data.notes !== undefined;
    if (!hasDate && !hasBodyWeight && !hasNotes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '日付・体重・メモのいずれかを入力してください',
      });
    }
  });

export type UpdateTrainingSessionPayload = z.infer<typeof updateTrainingSessionPayloadSchema>;

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
