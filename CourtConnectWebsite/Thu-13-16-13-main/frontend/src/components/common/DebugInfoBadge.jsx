export default function DebugInfoBadge() {
  const mock = import.meta.env.VITE_USE_MOCK;
  const bypass = import.meta.env.VITE_DEV_BYPASS_AUTH;
  const flags = [];
  if (mock === 'true' || mock === '1') flags.push('MOCK');
  if (bypass === 'true' || bypass === '1') flags.push('BYPASS');
  if (!flags.length) return null;

  return (
    <div className="fixed bottom-3 right-3 z-50 px-2.5 py-1.5 rounded bg-black/70 text-white text-xs">
      {flags.join(' | ')}
    </div>
  );
}
