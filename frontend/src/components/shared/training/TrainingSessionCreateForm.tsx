import type { ExerciseFormRow } from '@/hooks/useCreateTrainingSessionForm';

export interface TrainingSessionCreateFormProps {
  readonly date: string;
  readonly onDateChange: (value: string) => void;
  readonly bodyWeight: string;
  readonly onBodyWeightChange: (value: string) => void;
  readonly notes: string;
  readonly onNotesChange: (value: string) => void;
  readonly exerciseRows: readonly ExerciseFormRow[];
  readonly onAddExercise: () => void;
  readonly onRemoveExercise: (clientId: string) => void;
  readonly onExerciseChange: (
    clientId: string,
    patch: Partial<Omit<ExerciseFormRow, 'clientId'>>
  ) => void;
  readonly fieldErrors: Readonly<Record<string, string>>;
  readonly onSubmit: () => void;
  readonly submitting: boolean;
}

const inputCls =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500';

function err(path: string, m: Readonly<Record<string, string>>): string | undefined {
  return m[path];
}

export function TrainingSessionCreateForm(
  props: TrainingSessionCreateFormProps
): React.JSX.Element {
  return (
    <form
      className="max-w-2xl space-y-8"
      onSubmit={e => {
        e.preventDefault();
        props.onSubmit();
      }}
    >
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-slate-800">セッション</h2>
        <div>
          <label htmlFor="session-date" className="block text-sm text-slate-700">
            日付（YYYY-MM-DD）
          </label>
          <input
            id="session-date"
            type="date"
            className={inputCls}
            value={props.date}
            onChange={e => props.onDateChange(e.target.value)}
            required
          />
          {err('date', props.fieldErrors) !== undefined && (
            <p className="mt-1 text-sm text-red-600">{err('date', props.fieldErrors)}</p>
          )}
        </div>
        <div>
          <label htmlFor="body-weight" className="block text-sm text-slate-700">
            体重（kg・任意）
          </label>
          <input
            id="body-weight"
            type="number"
            step="0.1"
            min="0"
            className={inputCls}
            value={props.bodyWeight}
            onChange={e => props.onBodyWeightChange(e.target.value)}
          />
          {err('bodyWeight', props.fieldErrors) !== undefined && (
            <p className="mt-1 text-sm text-red-600">{err('bodyWeight', props.fieldErrors)}</p>
          )}
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm text-slate-700">
            メモ（任意）
          </label>
          <textarea
            id="notes"
            rows={3}
            className={inputCls}
            value={props.notes}
            onChange={e => props.onNotesChange(e.target.value)}
          />
          {err('notes', props.fieldErrors) !== undefined && (
            <p className="mt-1 text-sm text-red-600">{err('notes', props.fieldErrors)}</p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-800">種目</h2>
          <button
            type="button"
            className="text-sm font-medium text-slate-900 underline"
            onClick={props.onAddExercise}
          >
            種目を追加
          </button>
        </div>
        {err('exercises', props.fieldErrors) !== undefined && (
          <p className="text-sm text-red-600">{err('exercises', props.fieldErrors)}</p>
        )}

        {props.exerciseRows.map((row, index) => (
          <fieldset
            key={row.clientId}
            className="rounded-lg border border-slate-200 bg-slate-50/60 p-4"
          >
            <legend className="px-1 text-xs font-medium text-slate-600">種目 {index + 1}</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm text-slate-700" htmlFor={`name-${row.clientId}`}>
                  種目名
                </label>
                <input
                  id={`name-${row.clientId}`}
                  className={inputCls}
                  value={row.exerciseName}
                  onChange={e =>
                    props.onExerciseChange(row.clientId, {
                      exerciseName: e.target.value,
                    })
                  }
                />
                {err(`exercises.${String(index)}.exerciseName`, props.fieldErrors) !==
                  undefined && (
                  <p className="mt-1 text-sm text-red-600">
                    {err(`exercises.${String(index)}.exerciseName`, props.fieldErrors)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm text-slate-700" htmlFor={`sets-${row.clientId}`}>
                  セット
                </label>
                <input
                  id={`sets-${row.clientId}`}
                  type="number"
                  min={1}
                  className={inputCls}
                  value={row.sets}
                  onChange={e => props.onExerciseChange(row.clientId, { sets: e.target.value })}
                />
                {err(`exercises.${String(index)}.sets`, props.fieldErrors) !== undefined && (
                  <p className="mt-1 text-sm text-red-600">
                    {err(`exercises.${String(index)}.sets`, props.fieldErrors)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm text-slate-700" htmlFor={`reps-${row.clientId}`}>
                  回数（時間トレなら空）
                </label>
                <input
                  id={`reps-${row.clientId}`}
                  type="number"
                  min={1}
                  className={inputCls}
                  value={row.reps}
                  onChange={e => props.onExerciseChange(row.clientId, { reps: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700" htmlFor={`dur-${row.clientId}`}>
                  秒（回数トレなら空）
                </label>
                <input
                  id={`dur-${row.clientId}`}
                  type="number"
                  min={1}
                  className={inputCls}
                  value={row.durationSeconds}
                  onChange={e =>
                    props.onExerciseChange(row.clientId, {
                      durationSeconds: e.target.value,
                    })
                  }
                />
                {err(`exercises.${String(index)}`, props.fieldErrors) !== undefined && (
                  <p className="mt-1 text-sm text-red-600">
                    {err(`exercises.${String(index)}`, props.fieldErrors)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm text-slate-700" htmlFor={`w-${row.clientId}`}>
                  重量（kg・任意）
                </label>
                <input
                  id={`w-${row.clientId}`}
                  type="number"
                  step="0.5"
                  min="0"
                  className={inputCls}
                  value={row.weight}
                  onChange={e => props.onExerciseChange(row.clientId, { weight: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-slate-700" htmlFor={`n-${row.clientId}`}>
                  メモ（任意）
                </label>
                <input
                  id={`n-${row.clientId}`}
                  className={inputCls}
                  value={row.notes}
                  onChange={e => props.onExerciseChange(row.clientId, { notes: e.target.value })}
                />
              </div>
            </div>
            {props.exerciseRows.length > 1 && (
              <button
                type="button"
                className="mt-3 text-sm text-red-700 underline"
                onClick={() => props.onRemoveExercise(row.clientId)}
              >
                この種目を削除
              </button>
            )}
          </fieldset>
        ))}
      </section>

      <button
        type="submit"
        disabled={props.submitting}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {props.submitting ? '送信中…' : '記録を保存'}
      </button>
    </form>
  );
}
