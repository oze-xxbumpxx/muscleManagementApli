const inputCls =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500';

function err(path: string, m: Readonly<Record<string, string>>): string | undefined {
  return m[path];
}

export interface TrainingSessionEditFormProps {
  readonly date: string;
  readonly onDateChange: (value: string) => void;
  readonly bodyWeight: string;
  readonly onBodyWeightChange: (value: string) => void;
  readonly notes: string;
  readonly onNotesChange: (value: string) => void;
  readonly fieldErrors: Readonly<Record<string, string>>;
  readonly onSubmit: () => void;
  readonly submitting: boolean;
}

export function TrainingSessionEditForm(props: TrainingSessionEditFormProps): React.JSX.Element {
  return (
    <form
      className="max-w-xl space-y-6"
      onSubmit={e => {
        e.preventDefault();
        props.onSubmit();
      }}
    >
      {err('form', props.fieldErrors) !== undefined && (
        <p className="text-sm text-red-600" role="alert">
          {err('form', props.fieldErrors)}
        </p>
      )}
      <div>
        <label htmlFor="edit-date" className="block text-sm text-slate-700">
          日付（YYYY-MM-DD）
        </label>
        <input
          id="edit-date"
          type="date"
          className={inputCls}
          value={props.date}
          onChange={e => props.onDateChange(e.target.value)}
        />
        {err('date', props.fieldErrors) !== undefined && (
          <p className="mt-1 text-sm text-red-600">{err('date', props.fieldErrors)}</p>
        )}
      </div>
      <div>
        <label htmlFor="edit-bw" className="block text-sm text-slate-700">
          体重（kg・任意）
        </label>
        <input
          id="edit-bw"
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
        <label htmlFor="edit-notes" className="block text-sm text-slate-700">
          メモ（任意）
        </label>
        <textarea
          id="edit-notes"
          rows={3}
          className={inputCls}
          value={props.notes}
          onChange={e => props.onNotesChange(e.target.value)}
        />
        {err('notes', props.fieldErrors) !== undefined && (
          <p className="mt-1 text-sm text-red-600">{err('notes', props.fieldErrors)}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={props.submitting}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {props.submitting ? '保存中…' : '変更を保存'}
      </button>
    </form>
  );
}
