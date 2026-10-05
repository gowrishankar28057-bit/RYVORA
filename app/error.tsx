"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <main id="main" className="grid min-h-dvh place-items-center p-6 text-center"><div><h1 className="text-2xl font-extrabold">Something went wrong</h1><p className="mt-2 text-body">A simulated device value could not be displayed.</p><button type="button" onClick={reset} className="mt-6 rounded-xl bg-navy px-5 py-3 font-semibold text-white">Try again</button></div></main>;
}
