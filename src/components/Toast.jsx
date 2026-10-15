import { CheckIcon, WarningIcon, WarningCircleIcon, InfoIcon } from '../Assets/icons';

export default function Toast({ toast, message, type = 'success', onClose }) {
  const activeToast = toast || (message ? { message, type } : null);

  if (!activeToast || !activeToast.message) return null;

  const toastType = activeToast.type || 'success';

  const typeConfig = {
    success: {
      container: 'border-emerald-200 bg-emerald-50 text-emerald-900',
      icon: <CheckIcon className="h-4 w-4 shrink-0 text-emerald-600" />,
    },
    error: {
      container: 'border-rose-200 bg-rose-50 text-rose-900',
      icon: <WarningIcon className="h-4 w-4 shrink-0 text-rose-600" />,
    },
    warning: {
      container: 'border-amber-200 bg-amber-50 text-amber-900',
      icon: <WarningCircleIcon className="h-4 w-4 shrink-0 text-amber-600" />,
    },
    info: {
      container: 'border-sky-200 bg-sky-50 text-sky-900',
      icon: <InfoIcon className="h-4 w-4 shrink-0 text-sky-600" />,
    },
  };

  const config = typeConfig[toastType] || typeConfig.success;

  return (
    <div
      role="alert"
      className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 flex max-w-md items-center gap-2.5 rounded-lg border px-4 py-3 shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 z-[1000] ${config.container}`}
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
