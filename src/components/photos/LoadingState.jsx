import { LoaderCircle } from 'lucide-react';

export default function LoadingState({ title = 'Loading photos', description = 'Please wait while we fetch the latest updates.' }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
        <LoaderCircle className="animate-spin" size={28} />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}
