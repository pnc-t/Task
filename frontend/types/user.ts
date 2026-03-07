export interface UserProfile {
    id       : string;
    email    : string;
    name     : string;
    bio?     : string | null;
    avatar?  : string | null;
    createdAt: string;
    updatedAt: string;
    _count?: {
        tasks       : number;
        createdTasks: number;
        projects    : number;
    };
}

export interface UpdateProfileData {
    name?  : string;
    bio?   : string;
    avatar?: string;
}

export interface ChangePasswordData {
    currentPassword: string;
    newPassword    : string;
}