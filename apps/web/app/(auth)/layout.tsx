/**
 * Auth layout — centered card, no bottom nav.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
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
