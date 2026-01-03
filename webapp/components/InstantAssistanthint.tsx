export function InstantAssistantHint() {
  return (
    <div className="fixed bottom-28 right-6 max-w-xs rounded-2xl border border-emerald-500/40 bg-black/60 px-4 py-3 text-left text-sm shadow-lg backdrop-blur z-30">
      <div className="mb-2 text-[11px] font-semibold tracking-wide text-emerald-300">
        INSTANT ASSISTANT
      </div>
      <p className="mb-2 text-gray-100">
        Ask a question like:<br />
        <span className="text-emerald-200">
          "How would this work for a barbershop in Windermere?"
        </span>
      </p>
      <p className="text-[11px] text-gray-300">
        Tip: The floating chat button (bottom‑right) opens the assistant
        without covering the page.
      </p>
    </div>
  );
}