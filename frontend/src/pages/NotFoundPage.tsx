import { Link } from 'react-router-dom';

export function NotFoundPage(): React.JSX.Element {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-semibold text-slate-900">ページが見つかりません</h1>
      <p className="mt-2 max-w-md text-slate-600">URL をご確認ください。</p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
      >
        ダッシュボードへ
      </Link>
    </div>
  );
}
