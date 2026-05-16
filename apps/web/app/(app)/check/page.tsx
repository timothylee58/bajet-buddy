import { CheckScreen } from "@/components/features/check/CheckScreen";

interface CheckPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CheckPage({ searchParams }: CheckPageProps) {
  const params = (await searchParams) ?? {};
  const demo = Array.isArray(params.demo) ? params.demo[0] : params.demo;

  return <CheckScreen isSarahDemo={demo === "sarah"} />;
}
