import MovieForm from '../_components/MovieForm';

export default function CreateMoviePage() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Thêm Phim Mới</h1>
      <div className="bg-[#111114] border border-white/10 rounded-xl p-6">
        <MovieForm />
      </div>
    </div>
  );
}
