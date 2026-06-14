'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, User as UserIcon } from 'lucide-react';
import { actorService } from '@/services/actor.service';
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
import Image from 'next/image';

export default function ActorsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActor, setEditingActor] = useState<any>(null);

  const [currentRoles, setCurrentRoles] = useState<string[]>([]);
  const [currentPermissions, setCurrentPermissions] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    fullName: '',
    biography: '',
    avatarUrl: '',
    nationality: '',
    birthYear: '',
    status: 'ACTIVE'
  });

  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  useEffect(() => {
    const userInfoStr = localStorage.getItem('user_info');

    if (!userInfoStr) {
      return;
    }

    try {
      const userInfo = JSON.parse(userInfoStr);
      setCurrentRoles(userInfo.roles ?? []);
      setCurrentPermissions(userInfo.permissions ?? []);
    } catch {
      setCurrentRoles([]);
      setCurrentPermissions([]);
    }
  }, []);

  const hasPermission = (permission: string) => {
    return currentRoles.includes('ADMIN') || currentPermissions.includes(permission);
  };

  const canCreateActor = hasPermission('ACTOR_CREATE');
  const canUpdateActor = hasPermission('ACTOR_UPDATE');
  const canDeleteActor = hasPermission('ACTOR_DELETE');
  const canShowActions = canUpdateActor || canDeleteActor;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 500);
    return () => clearTimeout(timer);
  }, [keyword]);

  const { data: actors = [], isLoading } = useQuery({
    queryKey: ['actors', debouncedKeyword],
    queryFn: () => debouncedKeyword ? actorService.searchActors(debouncedKeyword) : actorService.getAllActors()
  });

  const mutation = useMutation({
    mutationFn: (data: { id?: string, payload: any }) => {
      const payloadToSubmit = {
        ...data.payload,
        birthYear: data.payload.birthYear ? parseInt(data.payload.birthYear) : undefined
      };
      if (data.id) {
        return actorService.updateActor(data.id, payloadToSubmit);
      }
      return actorService.createActor(payloadToSubmit);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actors'] });
      setIsDialogOpen(false);
      setEditingActor(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => actorService.deleteActor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actors'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingActor && !canUpdateActor) {
      alert('Bạn không có quyền cập nhật diễn viên.');
      return;
    }

    if (!editingActor && !canCreateActor) {
      alert('Bạn không có quyền thêm diễn viên.');
      return;
    }

    mutation.mutate({
      id: editingActor?.publicId,
      payload: formData
    });
  };

  const handleEdit = (actor: any) => {
    if (!canUpdateActor) {
      return;
    }

    setEditingActor(actor);
    setFormData({
      fullName: actor.fullName,
      biography: actor.biography || '',
      avatarUrl: actor.avatarUrl || '',
      nationality: actor.nationality || '',
      birthYear: actor.birthYear ? actor.birthYear.toString() : '',
      status: actor.status || 'ACTIVE'
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    if (!canCreateActor) {
      return;
    }

    setEditingActor(null);
    setFormData({ fullName: '', biography: '', avatarUrl: '', nationality: '', birthYear: '', status: 'ACTIVE' });
    setIsDialogOpen(true);
  };

  if (isLoading) return <div className="p-8">Đang tải...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Quản lý Diễn viên</h1>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Input
            placeholder="Tìm kiếm diễn viên..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full sm:w-64 bg-white/5 border-white/10"
          />

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            {canCreateActor && (
              <DialogTrigger render={<Button onClick={handleAddNew} className="bg-red-600 hover:bg-red-700 whitespace-nowrap" />}>
                <Plus className="mr-2 h-4 w-4" /> Thêm Diễn viên
              </DialogTrigger>
            )}

            <DialogContent className="sm:max-w-[500px] bg-[#111114] border-white/10 text-white max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingActor ? 'Sửa Diễn viên' : 'Thêm Diễn viên mới'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Tên diễn viên *</Label>
                  <Input
                    id="fullName"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatarUrl">Ảnh đại diện (URL)</Label>
                  <Input
                    id="avatarUrl"
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Quốc tịch</Label>
                    <Input
                      id="nationality"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthYear">Năm sinh</Label>
                    <Input
                      id="birthYear"
                      type="number"
                      value={formData.birthYear}
                      onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="biography">Tiểu sử</Label>
                  <textarea
                    id="biography"
                    rows={3}
                    value={formData.biography}
                    onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                    className="flex w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Trạng thái</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
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
              <TableHead className="text-zinc-300 w-[60px]">Ảnh</TableHead>
              <TableHead className="text-zinc-300">Tên diễn viên</TableHead>
              <TableHead className="text-zinc-300">Quốc tịch / Năm sinh</TableHead>
              <TableHead className="text-zinc-300">Trạng thái</TableHead>
              <TableHead className="text-right text-zinc-300">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actors.map((actor: any) => (
              <TableRow key={actor.publicId} className="border-white/10 hover:bg-white/5">
                <TableCell>
                  {actor.avatarUrl ? (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10">
                      <Image src={actor.avatarUrl} alt={actor.fullName} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-zinc-500">
                      <UserIcon size={16} />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{actor.fullName}</TableCell>
                <TableCell className="text-zinc-400">
                  {actor.nationality || '--'} {actor.birthYear ? `(${actor.birthYear})` : ''}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${actor.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-zinc-500/10 text-zinc-400'
                    }`}>
                    {actor.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {canShowActions ? (
                    <div className="flex justify-end gap-2">
                      {canUpdateActor && (
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(actor)} className="hover:bg-white/10">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}

                      {canDeleteActor && (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (confirm('Bạn có chắc chắn muốn xóa diễn viên này?')) {
                              deleteMutation.mutate(actor.publicId);
                            }
                          }}
                          className="text-red-500 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-zinc-500 italic">
                      Không có quyền
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {actors.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                  Chưa có diễn viên nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}