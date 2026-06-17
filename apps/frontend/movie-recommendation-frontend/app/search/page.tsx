import { SiteHeader } from "@/components/SiteHeader";
import { InfiniteMovieList } from "@/components/InfiniteMovieList";

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>;
}) {
    const { q: searchKeyword } = await searchParams;

    return (
        <main className="min-h-screen bg-[#08080a] text-white pt-24 pb-14 px-5 sm:px-8 lg:px-12">
            <SiteHeader />
            <div className="mx-auto max-w-[1460px]">
                <div className="mb-8">
                    <h1 className="text-3xl font-black md:text-4xl">
                        {searchKeyword ? `Kết quả tìm kiếm: "${searchKeyword}"` : "Tìm kiếm phim"}
                    </h1>
                    {searchKeyword && (
                        <p className="mt-2 text-zinc-400">
                            Hiển thị kết quả phim với từ khóa "{searchKeyword}"
                        </p>
                    )}
                </div>

                {searchKeyword ? (
                    <InfiniteMovieList
                        type="search"
                        searchKeyword={searchKeyword}
                        pageSize={10}
                    />
                ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-zinc-400">
                        Vui lòng nhập từ khóa để tìm kiếm phim.
                    </div>
                )}
            </div>
        </main>
    );
}
