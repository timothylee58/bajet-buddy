import { redirect } from "next/navigation";

/**
 * Root page — redirect to dashboard (auth guard handles unauthenticated users).
 */
export default function RootPage() {
  redirect("/dashboard");
}
