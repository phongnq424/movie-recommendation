'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AlertCircle,
    CheckCircle,
    Edit,
    KeyRound,
    Loader2,
    Plus,
    Save,
    Search,
    Shield,
    Trash2,
    UserCog,
    Users,
    X,
} from 'lucide-react';
import { rbacService } from '@/services/rbac.service';
import { userService } from '@/services/user.service';
import type { PermissionResponse, RoleResponse } from '@/types/rbac';

type ActiveTab = 'roles' | 'permissions' | 'users';

type ToastMessage = {
    text: string;
    type: 'success' | 'error';
};

type UserItem = {
    publicId: string;
    fullName: string;
    email: string;
    roles?: string[];
    permissions?: string[];
    status: string;
};

type RoleFormState = {
    name: string;
    description: string;
    active: boolean;
};

const EMPTY_ROLE_FORM: RoleFormState = {
    name: '',
    description: '',
    active: true,
};

function groupPermissionsByModule(permissions: PermissionResponse[]) {
    return permissions.reduce<Record<string, PermissionResponse[]>>(
        (groups, permission) => {
            const moduleName = permission.module || 'OTHER';

            if (!groups[moduleName]) {
                groups[moduleName] = [];
            }

            groups[moduleName].push(permission);
            return groups;
        },
        {}
    );
}

function roleBadgeClass(role: string) {
    if (role === 'ADMIN') {
        return 'bg-red-500/10 text-red-500 border-red-500/20';
    }

    if (role === 'USER') {
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }

    return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
}

function statusBadgeClass(active: boolean) {
    return active
        ? 'bg-green-500/10 text-green-500 border-green-500/20'
        : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
}

function userStatusBadgeClass(status: string) {
    return status === 'ACTIVE'
        ? 'bg-green-500/10 text-green-500 border-green-500/20'
        : 'bg-red-500/10 text-red-400 border-red-500/20';
}

export default function RbacPage() {
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState<ActiveTab>('roles');

    const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);

    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleResponse | null>(null);
    const [roleForm, setRoleForm] = useState<RoleFormState>(EMPTY_ROLE_FORM);

    const [selectedRole, setSelectedRole] = useState<RoleResponse | null>(null);
    const [selectedPermissionCodes, setSelectedPermissionCodes] = useState<
        string[]
    >([]);

    const [userKeyword, setUserKeyword] = useState('');
    const [debouncedUserKeyword, setDebouncedUserKeyword] = useState('');

    const [assigningUser, setAssigningUser] = useState<UserItem | null>(null);
    const [selectedUserRoles, setSelectedUserRoles] = useState<string[]>([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedUserKeyword(userKeyword);
        }, 500);

        return () => clearTimeout(timer);
    }, [userKeyword]);

    const showToast = (message: ToastMessage) => {
        setToastMessage(message);

        setTimeout(() => {
            setToastMessage(null);
        }, 3500);
    };

    const {
        data: roles = [],
        isLoading: isRolesLoading,
    } = useQuery({
        queryKey: ['rbac', 'roles'],
        queryFn: () => rbacService.getRoles(),
    });

    const {
        data: permissions = [],
        isLoading: isPermissionsLoading,
    } = useQuery({
        queryKey: ['rbac', 'permissions'],
        queryFn: () => rbacService.getPermissions(),
    });

    const {
        data: users = [],
        isLoading: isUsersLoading,
    } = useQuery({
        queryKey: ['users', debouncedUserKeyword],
        queryFn: () =>
            debouncedUserKeyword
                ? userService.searchUsers(debouncedUserKeyword)
                : userService.getAllUsers(),
    });

    const permissionGroups = useMemo(() => {
        return groupPermissionsByModule(permissions);
    }, [permissions]);

    useEffect(() => {
        if (!selectedRole && roles.length > 0) {
            setSelectedRole(roles[0]);
            setSelectedPermissionCodes(roles[0].permissions ?? []);
            return;
        }

        if (selectedRole) {
            const freshRole = roles.find(
                (role) => role.publicId === selectedRole.publicId
            );

            if (freshRole) {
                setSelectedRole(freshRole);
                setSelectedPermissionCodes(freshRole.permissions ?? []);
            }
        }
    }, [roles, selectedRole]);

    const createOrUpdateRoleMutation = useMutation({
        mutationFn: () => {
            if (editingRole) {
                return rbacService.updateRole(editingRole.publicId, {
                    description: roleForm.description,
                    active: roleForm.active,
                });
            }

            return rbacService.createRole({
                name: roleForm.name,
                description: roleForm.description,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] });

            setIsRoleModalOpen(false);
            setEditingRole(null);
            setRoleForm(EMPTY_ROLE_FORM);

            showToast({
                type: 'success',
                text: editingRole
                    ? 'Đã cập nhật vai trò thành công.'
                    : 'Đã tạo vai trò mới thành công.',
            });
        },
        onError: (error: any) => {
            showToast({
                type: 'error',
                text: error?.message || 'Không thể lưu vai trò.',
            });
        },
    });

    const deleteRoleMutation = useMutation({
        mutationFn: (rolePublicId: string) => rbacService.deleteRole(rolePublicId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] });
            queryClient.invalidateQueries({ queryKey: ['users'] });

            setSelectedRole(null);
            setSelectedPermissionCodes([]);

            showToast({
                type: 'success',
                text: 'Đã xóa vai trò thành công.',
            });
        },
        onError: (error: any) => {
            showToast({
                type: 'error',
                text: error?.message || 'Không thể xóa vai trò.',
            });
        },
    });

    const assignPermissionsMutation = useMutation({
        mutationFn: () => {
            if (!selectedRole) {
                throw new Error('Vui lòng chọn vai trò.');
            }

            return rbacService.assignPermissionsToRole(selectedRole.publicId, {
                permissionCodes: selectedPermissionCodes,
            });
        },
        onSuccess: (updatedRole) => {
            queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] });
            queryClient.invalidateQueries({ queryKey: ['users'] });

            setSelectedRole(updatedRole);
            setSelectedPermissionCodes(updatedRole.permissions ?? []);

            showToast({
                type: 'success',
                text: 'Đã lưu quyền cho vai trò.',
            });
        },
        onError: (error: any) => {
            showToast({
                type: 'error',
                text: error?.message || 'Không thể gán quyền cho vai trò.',
            });
        },
    });

    const assignUserRolesMutation = useMutation({
        mutationFn: () => {
            if (!assigningUser) {
                throw new Error('Vui lòng chọn người dùng.');
            }

            return rbacService.assignRolesToUser(assigningUser.publicId, {
                roleNames: selectedUserRoles,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] });

            setAssigningUser(null);
            setSelectedUserRoles([]);

            showToast({
                type: 'success',
                text: 'Đã gán vai trò cho người dùng.',
            });
        },
        onError: (error: any) => {
            showToast({
                type: 'error',
                text: error?.message || 'Không thể gán vai trò cho người dùng.',
            });
        },
    });

    const isLoading = isRolesLoading || isPermissionsLoading || isUsersLoading;

    const openCreateRoleModal = () => {
        setEditingRole(null);
        setRoleForm(EMPTY_ROLE_FORM);
        setIsRoleModalOpen(true);
    };

    const openEditRoleModal = (role: RoleResponse) => {
        setEditingRole(role);
        setRoleForm({
            name: role.name,
            description: role.description || '',
            active: role.active,
        });
        setIsRoleModalOpen(true);
    };

    const handleRoleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createOrUpdateRoleMutation.mutate();
    };

    const handleSelectRole = (role: RoleResponse) => {
        setSelectedRole(role);
        setSelectedPermissionCodes(role.permissions ?? []);
    };

    const handlePermissionToggle = (permissionCode: string) => {
        setSelectedPermissionCodes((prev) =>
            prev.includes(permissionCode)
                ? prev.filter((code) => code !== permissionCode)
                : [...prev, permissionCode]
        );
    };

    const openAssignUserRolesModal = (user: UserItem) => {
        setAssigningUser(user);
        setSelectedUserRoles(user.roles ?? []);
    };

    const closeAssignUserRolesModal = () => {
        setAssigningUser(null);
        setSelectedUserRoles([]);
    };

    const handleUserRoleToggle = (roleName: string) => {
        setSelectedUserRoles((prev) =>
            prev.includes(roleName)
                ? prev.filter((name) => name !== roleName)
                : [...prev, roleName]
        );
    };

    if (isLoading) {
        return <div className="p-8">Đang tải...</div>;
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
                        <Shield className="text-red-500" size={28} />
                        Phân Quyền RBAC
                    </h1>
                    <p className="text-zinc-400">
                        Quản lý vai trò, quyền truy cập và gán vai trò cho tài khoản.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openCreateRoleModal}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-lg shadow-red-600/10 text-sm"
                >
                    <Plus size={16} />
                    Thêm Vai Trò
                </button>
            </div>

            {toastMessage && (
                <div
                    className={`p-4 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${toastMessage.type === 'success'
                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}
                >
                    {toastMessage.type === 'success' ? (
                        <CheckCircle size={18} />
                    ) : (
                        <AlertCircle size={18} />
                    )}
                    <span className="text-sm font-medium">{toastMessage.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 flex flex-col gap-1.5">
                    <button
                        type="button"
                        onClick={() => setActiveTab('roles')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${activeTab === 'roles'
                                ? 'bg-red-600 text-white font-bold shadow-md shadow-red-600/10'
                                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <Shield size={18} />
                        Vai trò
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('permissions')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${activeTab === 'permissions'
                                ? 'bg-red-600 text-white font-bold shadow-md shadow-red-600/10'
                                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <KeyRound size={18} />
                        Quyền của vai trò
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${activeTab === 'users'
                                ? 'bg-red-600 text-white font-bold shadow-md shadow-red-600/10'
                                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <Users size={18} />
                        Gán role cho user
                    </button>
                </div>

                <div className="lg:col-span-3 bg-[#111114] border border-white/10 rounded-2xl p-6 md:p-8">
                    {activeTab === 'roles' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3">
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        Danh Sách Vai Trò
                                    </h3>
                                    <p className="mt-1 text-sm text-zinc-400">
                                        Tạo nhóm người dùng như USER, ADMIN, MODERATOR hoặc CONTENT_MANAGER.
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-white/10">
                                <table className="w-full text-sm">
                                    <thead className="bg-white/5">
                                        <tr className="border-b border-white/10">
                                            <th className="px-4 py-3 text-left font-semibold text-zinc-300">
                                                Vai trò
                                            </th>
                                            <th className="px-4 py-3 text-left font-semibold text-zinc-300">
                                                Số quyền
                                            </th>
                                            <th className="px-4 py-3 text-left font-semibold text-zinc-300">
                                                Trạng thái
                                            </th>
                                            <th className="px-4 py-3 text-right font-semibold text-zinc-300">
                                                Thao tác
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {roles.map((role) => (
                                            <tr
                                                key={role.publicId}
                                                className="border-b border-white/10 hover:bg-white/5"
                                            >
                                                <td className="px-4 py-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-white">
                                                                {role.name}
                                                            </span>

                                                            {role.systemRole && (
                                                                <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[11px] font-bold text-red-500">
                                                                    SYSTEM
                                                                </span>
                                                            )}
                                                        </div>

                                                        <p className="max-w-md truncate text-xs text-zinc-500">
                                                            {role.description || 'Không có mô tả'}
                                                        </p>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4 text-zinc-400">
                                                    {role.permissions?.length ?? 0} quyền
                                                </td>

                                                <td className="px-4 py-4">
                                                    <span
                                                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(
                                                            role.active
                                                        )}`}
                                                    >
                                                        {role.active ? 'ACTIVE' : 'INACTIVE'}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                handleSelectRole(role);
                                                                setActiveTab('permissions');
                                                            }}
                                                            className="rounded-lg px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white"
                                                        >
                                                            Quyền
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => openEditRoleModal(role)}
                                                            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
                                                        >
                                                            <Edit size={16} />
                                                        </button>

                                                        {!role.systemRole && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (
                                                                        window.confirm(
                                                                            `Bạn có chắc chắn muốn xóa vai trò ${role.name}?`
                                                                        )
                                                                    ) {
                                                                        deleteRoleMutation.mutate(role.publicId);
                                                                    }
                                                                }}
                                                                className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}

                                        {roles.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-4 py-10 text-center text-zinc-500"
                                                >
                                                    Chưa có vai trò nào
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'permissions' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex flex-col gap-4 border-b border-white/5 pb-4 xl:flex-row xl:items-center xl:justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        Quyền Của Vai Trò
                                    </h3>
                                    <p className="mt-1 text-sm text-zinc-400">
                                        Chọn role, bật/tắt permission rồi lưu lại.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <select
                                        value={selectedRole?.publicId || ''}
                                        onChange={(e) => {
                                            const role = roles.find(
                                                (item) => item.publicId === e.target.value
                                            );

                                            if (role) {
                                                handleSelectRole(role);
                                            }
                                        }}
                                        className="min-w-[220px] px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50"
                                    >
                                        <option value="">-- Chọn vai trò --</option>
                                        {roles.map((role) => (
                                            <option key={role.publicId} value={role.publicId}>
                                                {role.name}
                                            </option>
                                        ))}
                                    </select>

                                    <button
                                        type="button"
                                        disabled={!selectedRole || assignPermissionsMutation.isPending}
                                        onClick={() => assignPermissionsMutation.mutate()}
                                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all disabled:opacity-50 shadow-lg shadow-red-600/10 text-sm"
                                    >
                                        {assignPermissionsMutation.isPending ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Đang lưu...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={16} />
                                                Lưu Quyền
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {!selectedRole ? (
                                <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-6 text-sm text-zinc-400">
                                    Vui lòng chọn một vai trò để cấu hình quyền.
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                                        <p className="text-sm text-red-300">
                                            Đang cấu hình quyền cho role{' '}
                                            <span className="font-bold">{selectedRole.name}</span>.
                                        </p>
                                    </div>

                                    {Object.entries(permissionGroups).map(
                                        ([moduleName, modulePermissions]) => {
                                            const selectedCount = modulePermissions.filter((permission) =>
                                                selectedPermissionCodes.includes(permission.code)
                                            ).length;

                                            return (
                                                <div
                                                    key={moduleName}
                                                    className="rounded-2xl border border-white/10 bg-zinc-950/40 p-5"
                                                >
                                                    <div className="mb-4 flex items-center justify-between gap-3">
                                                        <div>
                                                            <h4 className="text-sm font-bold text-red-500 uppercase tracking-wider">
                                                                {moduleName}
                                                            </h4>
                                                            <p className="mt-1 text-xs text-zinc-500">
                                                                {selectedCount}/{modulePermissions.length} quyền đã chọn
                                                            </p>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const moduleCodes = modulePermissions.map(
                                                                    (permission) => permission.code
                                                                );

                                                                const isAllSelected = moduleCodes.every((code) =>
                                                                    selectedPermissionCodes.includes(code)
                                                                );

                                                                setSelectedPermissionCodes((prev) => {
                                                                    if (isAllSelected) {
                                                                        return prev.filter(
                                                                            (code) => !moduleCodes.includes(code)
                                                                        );
                                                                    }

                                                                    return Array.from(
                                                                        new Set([...prev, ...moduleCodes])
                                                                    );
                                                                });
                                                            }}
                                                            className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white"
                                                        >
                                                            Chọn/Bỏ tất cả
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                        {modulePermissions.map((permission) => {
                                                            const checked = selectedPermissionCodes.includes(
                                                                permission.code
                                                            );

                                                            return (
                                                                <button
                                                                    key={permission.code}
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handlePermissionToggle(permission.code)
                                                                    }
                                                                    className={`rounded-xl border p-4 text-left transition-colors ${checked
                                                                            ? 'border-red-500/60 bg-red-600/20 text-red-200'
                                                                            : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-start gap-3">
                                                                        <input
                                                                            type="checkbox"
                                                                            readOnly
                                                                            checked={checked}
                                                                            className="mt-1"
                                                                        />

                                                                        <div className="min-w-0">
                                                                            <p className="break-all text-sm font-bold">
                                                                                {permission.code}
                                                                            </p>
                                                                            <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                                                                                {permission.description ||
                                                                                    `${permission.module} - ${permission.action}`}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}

                                    {permissions.length === 0 && (
                                        <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-6 text-sm text-zinc-400">
                                            Chưa có permission nào. Kiểm tra lại RBAC bootstrap ở backend.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex flex-col gap-4 border-b border-white/5 pb-4 xl:flex-row xl:items-center xl:justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        Gán Vai Trò Cho Người Dùng
                                    </h3>
                                    <p className="mt-1 text-sm text-zinc-400">
                                        Một tài khoản có thể có nhiều role cùng lúc.
                                    </p>
                                </div>

                                <div className="relative w-full xl:w-80">
                                    <Search
                                        size={16}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                                    />
                                    <input
                                        type="text"
                                        value={userKeyword}
                                        onChange={(e) => setUserKeyword(e.target.value)}
                                        placeholder="Tìm kiếm người dùng..."
                                        className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50"
                                    />
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-white/10">
                                <table className="w-full text-sm">
                                    <thead className="bg-white/5">
                                        <tr className="border-b border-white/10">
                                            <th className="px-4 py-3 text-left font-semibold text-zinc-300">
                                                Người dùng
                                            </th>
                                            <th className="px-4 py-3 text-left font-semibold text-zinc-300">
                                                Vai trò
                                            </th>
                                            <th className="px-4 py-3 text-left font-semibold text-zinc-300">
                                                Trạng thái
                                            </th>
                                            <th className="px-4 py-3 text-right font-semibold text-zinc-300">
                                                Thao tác
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {(users as UserItem[]).map((user) => (
                                            <tr
                                                key={user.publicId}
                                                className="border-b border-white/10 hover:bg-white/5"
                                            >
                                                <td className="px-4 py-4">
                                                    <div>
                                                        <p className="font-semibold text-white">
                                                            {user.fullName}
                                                        </p>
                                                        <p className="mt-1 text-xs text-zinc-500">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {(user.roles ?? []).length > 0 ? (
                                                            user.roles?.map((role) => (
                                                                <span
                                                                    key={role}
                                                                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${roleBadgeClass(
                                                                        role
                                                                    )}`}
                                                                >
                                                                    {role}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-zinc-500">
                                                                Chưa có role
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <span
                                                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${userStatusBadgeClass(
                                                            user.status
                                                        )}`}
                                                    >
                                                        {user.status}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => openAssignUserRolesModal(user)}
                                                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white"
                                                    >
                                                        <UserCog size={16} />
                                                        Gán role
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}

                                        {(users as UserItem[]).length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-4 py-10 text-center text-zinc-500"
                                                >
                                                    Chưa có người dùng nào
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
                        <span>Module: RBAC Administration</span>
                        <span>Role - Permission - User Role</span>
                    </div>
                </div>
            </div>

            {isRoleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
                    <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111114] p-6 text-white shadow-2xl">
                        <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
                            <h3 className="text-lg font-bold">
                                {editingRole ? 'Sửa Vai Trò' : 'Thêm Vai Trò Mới'}
                            </h3>

                            <button
                                type="button"
                                onClick={() => setIsRoleModalOpen(false)}
                                className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleRoleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Tên vai trò
                                </label>
                                <input
                                    type="text"
                                    required
                                    disabled={!!editingRole}
                                    value={roleForm.name}
                                    onChange={(e) =>
                                        setRoleForm((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="Ví dụ: CONTENT_MANAGER"
                                    className="w-full px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 disabled:cursor-not-allowed disabled:opacity-60"
                                />

                                {editingRole && (
                                    <p className="text-xs text-zinc-500">
                                        Không đổi tên role sau khi tạo để tránh lệch dữ liệu phân quyền.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Mô tả
                                </label>
                                <input
                                    type="text"
                                    value={roleForm.description}
                                    onChange={(e) =>
                                        setRoleForm((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    placeholder="Mô tả vai trò trong hệ thống"
                                    className="w-full px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50"
                                />
                            </div>

                            {editingRole && (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                        Trạng thái
                                    </label>
                                    <select
                                        disabled={editingRole.systemRole}
                                        value={roleForm.active ? 'ACTIVE' : 'INACTIVE'}
                                        onChange={(e) =>
                                            setRoleForm((prev) => ({
                                                ...prev,
                                                active: e.target.value === 'ACTIVE',
                                            }))
                                        }
                                        className="w-full px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="INACTIVE">INACTIVE</option>
                                    </select>

                                    {editingRole.systemRole && (
                                        <p className="text-xs text-zinc-500">
                                            Role hệ thống không được tắt.
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsRoleModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors text-sm font-semibold"
                                >
                                    Hủy
                                </button>

                                <button
                                    type="submit"
                                    disabled={createOrUpdateRoleMutation.isPending}
                                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all disabled:opacity-50 shadow-lg shadow-red-600/10 text-sm"
                                >
                                    {createOrUpdateRoleMutation.isPending ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            Lưu
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {assigningUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
                    <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#111114] p-6 text-white shadow-2xl">
                        <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
                            <h3 className="text-lg font-bold">Gán Vai Trò Cho Người Dùng</h3>

                            <button
                                type="button"
                                onClick={closeAssignUserRolesModal}
                                className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4">
                                <p className="font-semibold text-white">{assigningUser.fullName}</p>
                                <p className="mt-1 text-sm text-zinc-500">{assigningUser.email}</p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Vai trò
                                </label>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {roles.map((role) => {
                                        const checked = selectedUserRoles.includes(role.name);
                                        const disabled = !role.active;

                                        return (
                                            <button
                                                key={role.publicId}
                                                type="button"
                                                disabled={disabled}
                                                onClick={() => handleUserRoleToggle(role.name)}
                                                className={`rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${checked
                                                        ? 'border-red-500/60 bg-red-600/20 text-red-200'
                                                        : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <input
                                                        type="checkbox"
                                                        readOnly
                                                        checked={checked}
                                                        disabled={disabled}
                                                        className="mt-1"
                                                    />

                                                    <div className="min-w-0">
                                                        <p className="font-bold">{role.name}</p>
                                                        <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                                                            {role.description || 'Không có mô tả'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {selectedUserRoles.length === 0 && (
                                    <p className="text-xs text-red-400">
                                        Người dùng nên có ít nhất một role.
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={closeAssignUserRolesModal}
                                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors text-sm font-semibold"
                                >
                                    Hủy
                                </button>

                                <button
                                    type="button"
                                    disabled={
                                        assignUserRolesMutation.isPending ||
                                        selectedUserRoles.length === 0
                                    }
                                    onClick={() => assignUserRolesMutation.mutate()}
                                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all disabled:opacity-50 shadow-lg shadow-red-600/10 text-sm"
                                >
                                    {assignUserRolesMutation.isPending ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            Lưu Vai Trò
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}