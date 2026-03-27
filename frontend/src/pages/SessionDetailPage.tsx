import { useParams } from 'react-router-dom';

export function SessionDetailPage(): React.JSX.Element {
  const { id } = useParams();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">記録詳細</h1>
      <p className="mt-3 text-slate-600">
        ID: {id ?? '—'} — 詳細表示はフェーズ2で実装予定です。
      </p>
    </div>
  );
}
