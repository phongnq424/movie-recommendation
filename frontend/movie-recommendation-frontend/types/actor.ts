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