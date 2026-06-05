export default function SourceBadge({ sources, answer }) {
  const isFallback = answer?.includes("don't have enough information");
  if (!sources || sources.length === 0 || isFallback) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {sources.map((source, i) => (
        <span key={i}
          className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700
                     border border-indigo-200 rounded-full px-2 py-0.5">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586
                 a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          {source.document} · p.{source.page}
        </span>
      ))}
    </div>
  );
}