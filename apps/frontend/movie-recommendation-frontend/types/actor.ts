export interface Actor {
    publicId: string;
    fullName: string;
    biography?: string;
    avatarUrl?: string;
    nationality?: string;
    birthYear?: number;
    featured?: boolean;
    status: string;
}

export interface ActorRequest {
    fullName: string;
    biography?: string;
    avatarUrl?: string;
    nationality?: string;
    birthYear?: number;
    featured?: boolean;
    status?: string;
}

export interface ActorPaginatedResponse {
    content: Actor[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    empty?: boolean;
}