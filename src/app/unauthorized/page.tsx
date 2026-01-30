export default function Unauthorized() {
  return (
    <div className="min-h-[calc(100vh-72px)] bg-gradient-to-br from-slate-50 via-white to-slate-100 px-6 py-12 flex items-center justify-center">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur shadow-sm overflow-hidden">
          <div className="px-6 py-6 border-b border-slate-200 bg-gradient-to-r from-rose-50 to-amber-50">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-rose-600 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
                <span className="text-lg font-bold">!</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
                  Access refused
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  You don’t have permission to view this page. If you think this is a mistake, contact an administrator.
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Go to home
              </a>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Error: <span className="font-mono">403</span>
        </p>
      </div>
    </div>
  );
}