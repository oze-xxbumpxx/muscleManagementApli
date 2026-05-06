import type { ChartMode, ExerciseHistoryEntry } from '@/hooks/useExerciseHistory';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface ExerciseHistoryChartProps {
  readonly entries: readonly ExerciseHistoryEntry[];
  readonly mode: ChartMode;
  readonly onModeChange: (mode: ChartMode) => void;
  readonly hasWeightData: boolean;
  readonly hasRepsData: boolean;
  readonly loading: boolean;
  readonly error: Error | undefined;
}

interface ChartPoint {
  readonly date: string;
  readonly weight: number | null;
  readonly reps: number | null;
}

function formatDateLabel(date: string): string {
  const parts = date.split('-');
  const month = parts[1] ?? '';
  const day = parts[2] ?? '';
  return `${month}/${day}`;
}

function toChartPoint(entry: ExerciseHistoryEntry): ChartPoint {
  return {
    date: entry.date,
    weight: entry.weight,
    reps: entry.reps,
  };
}

function getModeLabel(mode: ChartMode): string {
  return mode === 'weight' ? '重量(kg)' : '回数';
}

function ExerciseHistoryChartMessage(props: { readonly message: string }): React.JSX.Element {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-slate-600">{props.message}</p>
    </section>
  );
}
export function ExerciseHistoryChart(props: ExerciseHistoryChartProps): React.JSX.Element {
  if (props.loading) {
    return <ExerciseHistoryChartMessage message="読み込み中..." />;
  }

  if (props.error !== undefined) {
    return <ExerciseHistoryChartMessage message="データを取得できませんでした。" />;
  }

  if (props.entries.length === 0) {
    return <ExerciseHistoryChartMessage message="記録がありません" />;
  }

  if (!props.hasWeightData && !props.hasRepsData) {
    return <ExerciseHistoryChartMessage message="グラフ表示できる重量・回数の記録がありません" />;
  }

  const data = props.entries.map(toChartPoint);

  return (
    <section
      aria-labelledby="exercise-history-chart-heading"
      className="rounded-lg border border-slate-200 bg-white p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="exercise-history-chart-heading" className="text-lg font-semibold text-slate-900">
          成長グラフ
        </h2>
        <div className="flex rounded-md border border-slate-200 p-1" aria-label="表示指標">
          {props.hasWeightData ? (
            <button
              type="button"
              className={`rounded px-3 py-1 text-sm ${
                props.mode === 'weight' ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
              onClick={() => props.onModeChange('weight')}
            >
              重量(kg)
            </button>
          ) : null}
          {props.hasRepsData ? (
            <button
              type="button"
              className={`rounded px-3 py-1 text-sm ${
                props.mode === 'reps' ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
              onClick={() => props.onModeChange('reps')}
            >
              回数
            </button>
          ) : null}
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-600">
        {getModeLabel(props.mode)} の推移を日付順に表示しています。
      </p>

      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tickFormatter={formatDateLabel} stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip labelFormatter={label => formatDateLabel(String(label))} />
            <Line
              type="monotone"
              dataKey={props.mode}
              name={getModeLabel(props.mode)}
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
