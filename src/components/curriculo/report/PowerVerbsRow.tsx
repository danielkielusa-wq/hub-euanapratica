interface PowerVerbsRowProps {
  verbs: string[];
}

export function PowerVerbsRow({ verbs }: PowerVerbsRowProps) {
  if (!verbs || verbs.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">
        Power Verbs sugeridos:
      </p>
      <div className="flex flex-wrap gap-2">
        {verbs.map((verb, index) => (
          <span
            key={index}
            className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full"
          >
            {verb}
          </span>
        ))}
      </div>
    </div>
  );
}
