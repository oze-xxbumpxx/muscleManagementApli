import z from 'zod';

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
  .refine((value) => {
    const parts = value.split('-');
    if (parts.length !== 3) {
      return false;
    }

    const [yText, mText, dText] = parts;
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
  }, 'Date must be a valid calendar date');

export type DateString = z.infer<typeof dateStringSchema>;
