import {
  CreateTrainingSessionDocument,
  type CreateTrainingSessionInput,
  type CreateTrainingSessionMutation,
  TrainingSessionsDocument,
} from '@/graphql/generated/graphql';
import {
  createTrainingSessionPayloadSchema,
  zodErrorToFieldMessages,
} from '@/validation/trainingSessionCreate';
import { useMutation } from '@apollo/client';
import { useCallback, useState } from 'react';

export interface ExerciseFormRow {
  readonly clientId: string;
  exerciseName: string;
  sets: string;
  reps: string;
  durationSeconds: string;
  weight: string;
  notes: string;
}

function newClientId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID !== undefined) {
    return crypto.randomUUID();
  }
  return `row-${String(Math.random()).slice(2)}`;
}

function emptyExerciseFromRow(): ExerciseFormRow {
  return {
    clientId: newClientId(),
    exerciseName: '',
    sets: '1',
    reps: '',
    durationSeconds: '',
    weight: '',
    notes: '',
  };
}

function buildPayload(
  date: string,
  bodyWeight: string,
  notesText: string,
  rows: readonly ExerciseFormRow[]
): CreateTrainingSessionInput {
  const exercises = rows.map((row, index) => {
    const repsT = row.reps.trim();
    const durT = row.durationSeconds.trim();
    const wT = row.weight.trim();
    const notesT = row.notes.trim();
    return {
      exerciseName: row.exerciseName.trim(),
      sets: Number(row.sets),
      order: index + 1,
      reps: repsT === '' ? undefined : Number(repsT),
      durationSeconds: durT === '' ? undefined : Number(durT),
      weight: wT === '' ? undefined : Number(wT),
      notes: notesT === '' ? undefined : notesT,
    };
  });
  const bwT = bodyWeight.trim();
  const nT = notesText.trim();
  return {
    date,
    bodyWeight: bwT === '' ? undefined : Number(bwT),
    notes: nT === '' ? undefined : nT,
    exercises,
  };
}

export interface UseCreateTrainingSessionFormResult {
  readonly date: string;
  readonly setDate: (v: string) => void;
  readonly bodyWeight: string;
  readonly setBodyWeight: (v: string) => void;
  readonly notes: string;
  readonly setNotes: (v: string) => void;
  readonly exerciseRows: readonly ExerciseFormRow[];
  readonly fieldErrors: Record<string, string>;
  readonly addExerciseRow: () => void;
  readonly removeExerciseRow: (clientId: string) => void;
  readonly updateExerciseRow: (
    clientId: string,
    patch: Partial<Omit<ExerciseFormRow, 'clientId'>>
  ) => void;
  readonly submit: () => Promise<CreateTrainingSessionMutation | undefined>;
  readonly submitting: boolean;
}

export function useCreateTrainingSessionForm(): UseCreateTrainingSessionFormResult {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bodyWeight, setBodyWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [exerciseRows, setExerciseRows] = useState<ExerciseFormRow[]>([emptyExerciseFromRow()]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [runMutation, { loading: submitting }] = useMutation(CreateTrainingSessionDocument, {
    refetchQueries: [{ query: TrainingSessionsDocument }],
  });

  const addExerciseRow = useCallback(() => {
    setExerciseRows(rows => [...rows, emptyExerciseFromRow()]);
  }, []);

  const removeExerciseRow = useCallback((clientId: string) => {
    setExerciseRows(rows => {
      if (rows.length <= 1) {
        return rows;
      }
      return rows.filter(r => r.clientId !== clientId);
    });
  }, []);

  const updateExerciseRow = useCallback(
    (clientId: string, patch: Partial<Omit<ExerciseFormRow, 'clientId'>>) => {
      setExerciseRows(rows => rows.map(r => (r.clientId === clientId ? { ...r, ...patch } : r)));
    },
    []
  );

  const submit = useCallback(async () => {
    const raw = buildPayload(date, bodyWeight, notes, exerciseRows);
    const parsed = createTrainingSessionPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      setFieldErrors(zodErrorToFieldMessages(parsed.error));
      return undefined;
    }
    setFieldErrors({});
    const result = await runMutation({
      variables: { input: parsed.data },
    });
    return result.data ?? undefined;
  }, [date, bodyWeight, notes, exerciseRows, runMutation]);

  return {
    date,
    setDate,
    bodyWeight,
    setBodyWeight,
    notes,
    setNotes,
    exerciseRows,
    fieldErrors,
    addExerciseRow,
    removeExerciseRow,
    updateExerciseRow,
    submit,
    submitting,
  };
}
