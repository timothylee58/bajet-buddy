/**
 * Auth layout — centered card, no bottom nav.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(124,92,255,0.2),_transparent_30rem),radial-gradient(circle_at_bottom_right,_rgba(79,195,247,0.18),_transparent_26rem),linear-gradient(180deg,_#fffefc,_#f7f2ff)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-3xl font-bold tracking-tight text-primary">BajetBuddy</p>
          <p className="mt-1 text-sm text-muted">Duit smart, hidup lega.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
