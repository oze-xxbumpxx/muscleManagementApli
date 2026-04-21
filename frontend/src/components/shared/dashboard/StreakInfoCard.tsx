export interface StreakInfoCardProps {
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly thisMonthCount: number;
  readonly loading: boolean;
  readonly error: Error | undefined;
}

export function StreakInfoCard(props: StreakInfoCardProps): React.JSX.Element {
  if (props.loading) {
    return <p className="text-slate-600">読み込み中...</p>;
  }
  if (props.error !== undefined) {
    return <p className="text-slate-600">データを取得できませんでした。</p>;
  }

  return (
    <section
      aria-labelledby="streak-heading"
      className="rounded-lg border border-slate-200 bg-white p-4"
    >
      <h2 id="streak-heading" className="text-lg font-semibold text-slate-900">
        継続状況
      </h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-slate-500">現在の連続日数</dt>
          <dd className="mt-1 text-2xl font-semibold text-slate-900">{props.currentStreak}日</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">最長連続記録</dt>
          <dd className="mt-1 text-2xl font-semibold text-slate-900">{props.longestStreak}日</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">今月の実施日数</dt>
          <dd className="mt-1 text-2xl font-semibold text-slate-900">{props.thisMonthCount}日</dd>
        </div>
      </dl>
    </section>
  );
}
