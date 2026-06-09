import { VARIANTS, resolveVariant } from "@/components/pages";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { variant } = await searchParams;
  const SelectedVariant = VARIANTS[resolveVariant(variant)];
  return <SelectedVariant />;
}
