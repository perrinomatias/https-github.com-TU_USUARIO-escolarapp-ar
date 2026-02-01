
export type AppRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface UserProfile {
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    role: AppRole;
    avatar_url: string | null;
}
