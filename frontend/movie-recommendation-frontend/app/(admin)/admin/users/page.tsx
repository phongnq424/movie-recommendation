'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Lock, Unlock, ShieldAlert } from 'lucide-react';
import { userService } from '@/services/user.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type UserItem = {
  publicId: string;
  fullName: string;
  email: string;
  roles?: string[];
  permissions?: string[];
  status: string;
};

function roleBadgeClass(role: string) {
  if (role === 'ADMIN') {
    return 'bg-red-500/10 text-red-500';
  }

  if (role === 'USER') {
    return 'bg-blue-500/10 text-blue-400';
  }

  return 'bg-purple-500/10 text-purple-400';
}

export default function UsersPage() {
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 500);
    return () => clearTimeout(timer);
  }, [keyword]);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', debouncedKeyword],
    queryFn: () =>
      debouncedKeyword
        ? userService.searchUsers(debouncedKeyword)
        : userService.getAllUsers(),
  });

  const statusMutation = useMutation({
    mutationFn: (data: { publicId: string; status: string }) =>
      userService.updateUserStatus(data.publicId, data.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  if (isLoading) return <div className="p-8">Đang tải...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Quản lý Người dùng</h1>

        <div className="w-full sm:w-auto">
          <Input
            placeholder="Tìm kiếm người dùng..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full sm:w-64 bg-white/5 border-white/10"
          />
        </div>
      </div>

      <div className="rounded-md border border-white/10">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-zinc-300">Tên người dùng</TableHead>
              <TableHead className="text-zinc-300">Email</TableHead>
              <TableHead className="text-zinc-300">Vai trò</TableHead>
              <TableHead className="text-zinc-300">Trạng thái</TableHead>
              <TableHead className="text-right text-zinc-300">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {(users as UserItem[]).map((user) => {
              const roles = user.roles ?? [];
              const isAdmin = roles.includes('ADMIN');

              return (
                <TableRow
                  key={user.publicId}
                  className="border-white/10 hover:bg-white/5"
                >
                  <TableCell className="font-medium">
                    {user.fullName}
                  </TableCell>

                  <TableCell className="text-zinc-400">
                    {user.email}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {roles.length > 0 ? (
                        roles.map((role) => (
                          <span
                            key={role}
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleBadgeClass(
                              role
                            )}`}
                          >
                            {role}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-zinc-500">
                          Chưa có role
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${user.status === 'ACTIVE'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-red-500/10 text-red-400'
                        }`}
                    >
                      {user.status}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newStatus =
                                user.status === 'ACTIVE'
                                  ? 'INACTIVE'
                                  : 'ACTIVE';

                              if (
                                confirm(
                                  `Bạn có chắc muốn ${newStatus === 'ACTIVE'
                                    ? 'mở khóa'
                                    : 'khóa'
                                  } người dùng này?`
                                )
                              ) {
                                statusMutation.mutate({
                                  publicId: user.publicId,
                                  status: newStatus,
                                });
                              }
                            }}
                            className="hover:bg-white/10"
                          >
                            {user.status === 'ACTIVE' ? (
                              <Lock className="h-4 w-4" />
                            ) : (
                              <Unlock className="h-4 w-4" />
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (
                                confirm(
                                  'Bạn có chắc chắn muốn xóa người dùng này vĩnh viễn?'
                                )
                              ) {
                                deleteMutation.mutate(user.publicId);
                              }
                            }}
                            className="text-red-500 hover:bg-red-500/10 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      {isAdmin && (
                        <div className="flex items-center gap-1 text-zinc-500 text-sm italic pr-2">
                          <ShieldAlert className="h-4 w-4" />
                          Bảo vệ
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {users.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-zinc-500"
                >
                  Chưa có người dùng nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}