import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const q = params.callbackUrl ? `?callbackUrl=${encodeURIComponent(params.callbackUrl)}` : "";
  redirect(`/signin${q}`);
}
