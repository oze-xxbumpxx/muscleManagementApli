import { useParams } from 'react-router-dom';

export function ExerciseHistoryPage(): React.JSX.Element {
  const { name } = useParams();
  const decoded = name !== undefined ? decodeURIComponent(name) : '—';

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">種目の推移</h1>
      <p className="mt-3 text-slate-600">
        種目: {decoded} — グラフはフェーズ4で実装予定です。
      </p>
    </div>
  );
}
