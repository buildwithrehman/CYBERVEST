import { AlertTriangle, Loader2, FolderOpen } from "lucide-react";

export function LoadingState({ message = "Loading data..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export function ErrorState({ error, retry }: { error: Error; retry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-semantic-threat-text bg-semantic-threat-bg rounded-lg border border-border-destructive">
      <AlertTriangle className="w-8 h-8 mb-4" />
      <h3 className="font-semibold text-lg mb-2">Error Loading Data</h3>
      <p className="text-sm text-center max-w-md mb-6">{error.message}</p>
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-semantic-threat-text text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title = "No data found", description }: { title?: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-white rounded-lg border border-border border-dashed">
      <FolderOpen className="w-10 h-10 mb-4 opacity-50" />
      <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
      {description && <p className="text-sm text-center max-w-sm">{description}</p>}
    </div>
  );
}
