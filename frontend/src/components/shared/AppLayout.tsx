import { Link, Outlet } from 'react-router-dom';

export function AppLayout(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <nav
          className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3"
          aria-label="メイン"
        >
          <Link to="/" className="text-lg font-semibold text-slate-900">
            筋トレ記録
          </Link>
          <Link
            to="/sessions"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            記録一覧
          </Link>
          <Link
            to="/sessions/new"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            新規記録
          </Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
