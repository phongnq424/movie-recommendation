export type PermissionResponse = {
    publicId: string;
    code: string;
    module: string;
    action: string;
    description?: string | null;
    active: boolean;
};

export type RoleResponse = {
    publicId: string;
    name: string;
    description?: string | null;
    systemRole: boolean;
    active: boolean;
    permissions: string[];
};

export type RoleCreateRequest = {
    name: string;
    description?: string;
};

export type RoleUpdateRequest = {
    description?: string;
    active?: boolean;
};

export type AssignRolePermissionsRequest = {
    permissionCodes: string[];
};

export type AssignUserRolesRequest = {
    roleNames: string[];
};