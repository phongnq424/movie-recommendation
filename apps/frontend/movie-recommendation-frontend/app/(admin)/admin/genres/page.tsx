'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { genreService } from '@/services/genre.service';
import type { GenreResponse } from '@/types/genre';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

export default function GenresPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<GenreResponse | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE'
  });

  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 500);
    return () => clearTimeout(timer);
  }, [keyword]);

  const { data: genres = [], isLoading } = useQuery({
    queryKey: ['genres', debouncedKeyword],
    queryFn: () => debouncedKeyword ? genreService.searchGenres(debouncedKeyword) : genreService.getAllGenres()
  });

  const mutation = useMutation({
    mutationFn: (data: { id?: string, payload: any }) => {
      if (data.id) {
        return genreService.updateGenre(data.id, data.payload);
      }
      return genreService.createGenre(data.payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genres'] });
      setIsDialogOpen(false);
      setEditingGenre(null);
      setFormData({ name: '', description: '', status: 'ACTIVE' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => genreService.deleteGenre(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genres'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      id: editingGenre?.publicId,
      payload: formData
    });
  };

  const handleEdit = (genre: GenreResponse) => {
    setEditingGenre(genre);
    setFormData({
      name: genre.name,
      description: genre.description || '',
      status: genre.status || 'ACTIVE'
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingGenre(null);
    setFormData({ name: '', description: '', status: 'ACTIVE' });
    setIsDialogOpen(true);
  };

  if (isLoading) return <div className="p-8">Đang tải...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Quản lý Thể loại</h1>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Input 
            placeholder="Tìm kiếm thể loại..." 
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full sm:w-64 bg-white/5 border-white/10"
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={<Button onClick={handleAddNew} className="bg-red-600 hover:bg-red-700 whitespace-nowrap" />}>
              <Plus className="mr-2 h-4 w-4" /> Thêm Thể loại
            </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-[#111114] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>{editingGenre ? 'Sửa Thể loại' : 'Thêm Thể loại mới'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên thể loại</Label>
                <Input 
                  id="name" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Input 
                  id="description" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Trạng thái</Label>
                <select 
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="ACTIVE" className="bg-[#111114]">Active</option>
                  <option value="INACTIVE" className="bg-[#111114]">Inactive</option>
                </select>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-transparent border-white/10 hover:bg-white/5">
                  Hủy
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Đang lưu...' : 'Lưu'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="rounded-md border border-white/10">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-zinc-300">Tên</TableHead>
              <TableHead className="text-zinc-300">Slug</TableHead>
              <TableHead className="text-zinc-300">Mô tả</TableHead>
              <TableHead className="text-zinc-300">Trạng thái</TableHead>
              <TableHead className="text-right text-zinc-300">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {genres.map((genre) => (
              <TableRow key={genre.publicId} className="border-white/10 hover:bg-white/5">
                <TableCell className="font-medium">{genre.name}</TableCell>
                <TableCell className="text-zinc-400">{genre.slug}</TableCell>
                <TableCell className="text-zinc-400 max-w-xs truncate">{genre.description}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    genre.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-zinc-500/10 text-zinc-400'
                  }`}>
                    {genre.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(genre)} className="hover:bg-white/10">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        if (confirm('Bạn có chắc chắn muốn xóa thể loại này?')) {
                          deleteMutation.mutate(genre.publicId);
                        }
                      }} 
                      className="text-red-500 hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {genres.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                  Chưa có thể loại nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
