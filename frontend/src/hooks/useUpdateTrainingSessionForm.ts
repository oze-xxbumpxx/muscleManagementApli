import {
  TrainingSessionDocument,
  TrainingSessionQuery,
  TrainingSessionsDocument,
  UpdateTrainingSessionDocument,
  UpdateTrainingSessionInput,
  type UpdateTrainingSessionMutation,
} from '@/graphql/generated/graphql';
import {
  updateTrainingSessionPayloadSchema,
  zodErrorToFieldMessages,
  type UpdateTrainingSessionPayload,
} from '@/validation/trainingSessionUpdate';
import { useMutation } from '@apollo/client';
import { useCallback, useEffect, useState } from 'react';

type ServerSession = NonNullable<TrainingSessionQuery['trainingSession']>;

function buildUpdateInput(
  date: string,
  bodyWeightText: string,
  notesText: string
): UpdateTrainingSessionInput {
  const bw = bodyWeightText.trim();
  const n = notesText.trim();
  const input: UpdateTrainingSessionInput = { date };
  if (bw !== '') {
    input.bodyWeight = Number(bw);
  }
  if (n !== '') {
    input.notes = n;
  }
  return input;
}

function isUnchangedFromServer(
  input: UpdateTrainingSessionPayload,
  server: ServerSession,
): boolean {
  if (input.date !== server.date) {
    return false;
  }
  const serverBw = server.bodyWeight ?? undefined;
  const inputBw = input.bodyWeight;
  if (inputBw !== serverBw) {
    return false;
  }
  const serverNotes = server.notes ?? '';
  const inputNotes = input.notes ?? '';
  if (inputNotes !== serverNotes) {
    return false;
  }
  return true;
}

export interface UseUpdateTrainingSessionFormResult {
  readonly date: string;
  readonly setDate: (v: string) => void;
  readonly bodyWeight: string;
  readonly setBodyWeight: (v: string) => void;
  readonly notes: string;
  readonly setNotes: (v: string) => void;
  readonly fieldErrors: Record<string, string>;
  readonly submit: () => Promise<UpdateTrainingSessionMutation | undefined>;
  readonly submitting: boolean;
}

export function useUpdateTrainingSessionForm(
  sessionId: number | undefined,
  serverSession: ServerSession | null | undefined,
): UseUpdateTrainingSessionFormResult {
  const [date, setDate] = useState('');
  const [bodyWeight, setBodyWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (serverSession === null || serverSession === undefined) {
      return;
    }
    setDate(serverSession.date);
    setBodyWeight(
      serverSession.bodyWeight !== null && serverSession.bodyWeight !== undefined
        ? String(serverSession.bodyWeight)
        : '',
    );
    setNotes(serverSession.notes ?? '');
  }, [serverSession]);

  const [runMutation, { loading: submitting }] = useMutation(UpdateTrainingSessionDocument, {
    refetchQueries: [
      { query: TrainingSessionsDocument },
      ...(sessionId !== undefined
        ? [{ query: TrainingSessionDocument, variables: { id: sessionId } }]
        : []),
    ],
  });

  const submit = useCallback(async () => {
    if (sessionId === undefined) {
      return undefined;
    }
    const raw = buildUpdateInput(date, bodyWeight, notes);
    const parsed = updateTrainingSessionPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      setFieldErrors(zodErrorToFieldMessages(parsed.error));
      return undefined;
    }
    if (
      serverSession !== null &&
      serverSession !== undefined &&
      isUnchangedFromServer(parsed.data, serverSession)
    ) {
      setFieldErrors({ form: '変更がありません' });
      return undefined;
    }
    setFieldErrors({});
    const result = await runMutation({
      variables: {
        id: sessionId,
        input: parsed.data,
      },
    });
    return result.data ?? undefined;
  }, [bodyWeight, date, notes, runMutation, serverSession, sessionId]);

  return {
    date,
    setDate,
    bodyWeight,
    setBodyWeight,
    notes,
    setNotes,
    fieldErrors,
    submit,
    submitting,
  };
}
