/**
 * Auth layout — centered card, no bottom nav.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(186,98,0,0.24),_transparent_34rem),linear-gradient(180deg,_#fff4e8,_#fffaf4_48%,_#f7efe6)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-3xl font-bold tracking-tight text-brand-dark">BajetBuddy</p>
          <p className="mt-1 text-sm text-zinc-600">Duit smart, hidup lega.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
