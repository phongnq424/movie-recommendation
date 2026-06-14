import axiosClient from '@/services/axios';
import type {
    AssignRolePermissionsRequest,
    AssignUserRolesRequest,
    PermissionResponse,
    RoleCreateRequest,
    RoleResponse,
    RoleUpdateRequest,
} from '@/types/rbac';

export const rbacService = {
    async getRoles(): Promise<RoleResponse[]> {
        const response = await axiosClient.get<RoleResponse[]>('/admin/rbac/roles');
        return response.data;
    },

    async getPermissions(): Promise<PermissionResponse[]> {
        const response = await axiosClient.get<PermissionResponse[]>('/admin/rbac/permissions');
        return response.data;
    },

    async createRole(payload: RoleCreateRequest): Promise<RoleResponse> {
        const response = await axiosClient.post<RoleResponse>('/admin/rbac/roles', payload);
        return response.data;
    },

    async updateRole(
        rolePublicId: string,
        payload: RoleUpdateRequest
    ): Promise<RoleResponse> {
        const response = await axiosClient.put<RoleResponse>(
            `/admin/rbac/roles/${rolePublicId}`,
            payload
        );

        return response.data;
    },

    async deleteRole(rolePublicId: string): Promise<string> {
        const response = await axiosClient.delete<string>(
            `/admin/rbac/roles/${rolePublicId}`
        );

        return response.data;
    },

    async assignPermissionsToRole(
        rolePublicId: string,
        payload: AssignRolePermissionsRequest
    ): Promise<RoleResponse> {
        const response = await axiosClient.put<RoleResponse>(
            `/admin/rbac/roles/${rolePublicId}/permissions`,
            payload
        );

        return response.data;
    },

    async assignRolesToUser(
        userPublicId: string,
        payload: AssignUserRolesRequest
    ): Promise<any> {
        const response = await axiosClient.put(
            `/admin/rbac/users/${userPublicId}/roles`,
            payload
        );

        return response.data;
    },
};