import { SiteHeader } from "@/components/SiteHeader";
import { SemanticSearchClient } from "@/components/SemanticSearchClient";

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>;
}) {
    const { q: searchKeyword } = await searchParams;

    return (
        <main className="min-h-screen bg-black text-white">
            <SiteHeader />

            <SemanticSearchClient initialQuery={searchKeyword ?? ""} />
        </main>
    );
}