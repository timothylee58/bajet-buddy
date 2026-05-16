/**
 * Auth layout — centered card, no bottom nav.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white dark:from-zinc-900 dark:to-zinc-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="text-3xl font-bold text-green-600">💚 BajetBuddy</span>
          <p className="mt-1 text-sm text-zinc-500">Duit smart, hidup lega.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
