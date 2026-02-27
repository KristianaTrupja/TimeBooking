export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">You are offline</h1>
        <p className="mt-2 text-slate-600">Please reconnect to continue using WorkTime.</p>
        <a
          href="/login"
          className="mt-4 inline-flex rounded-lg bg-[#244B77] px-4 py-2 text-white font-medium hover:opacity-90"
        >
          Retry
        </a>
      </section>
    </main>
  );
}

