export default function Toast({ toast, message, type = 'success', onClose }) {
  const activeToast = toast || (message ? { message, type } : null);

  if (!activeToast || !activeToast.message) return null;

  const toastType = activeToast.type || 'success';

  const typeConfig = {
    success: {
      container: 'border-emerald-200 bg-emerald-50 text-emerald-900',
      icon: (
        <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    error: {
      container: 'border-rose-200 bg-rose-50 text-rose-900',
      icon: (
        <svg className="h-4 w-4 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    },
    warning: {
      container: 'border-amber-200 bg-amber-50 text-amber-900',
      icon: (
        <svg className="h-4 w-4 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    info: {
      container: 'border-sky-200 bg-sky-50 text-sky-900',
      icon: (
        <svg className="h-4 w-4 shrink-0 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const config = typeConfig[toastType] || typeConfig.success;

  return (
    <div
      role="alert"
      className={`fixed bottom-6 right-6 z-50 flex max-w-md items-center gap-2.5 rounded-lg border px-4 py-3 shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 ${config.container}`}
    >
      {config.icon}
      <span className="text-sm font-medium">{activeToast.message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-2 rounded p-0.5 text-xs font-semibold opacity-60 transition hover:opacity-100 focus:outline-none"
          title="Dismiss notification"
          aria-label="Close notification"
        >
          ✕
        </button>
      )}
    </div>
  );
}
