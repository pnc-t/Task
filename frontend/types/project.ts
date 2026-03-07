export interface Project {
    id          :string;
    name        :string;
    description?:string;
    createdAt   :string;
    updatedAt   :string;
    members: ProjectMember[];
    _count?: {
        tasks:number;
    }
}

export interface ProjectMember {
    id  :string;
    role: string;
    user: {
        id   : string;
        name : string;
        email: string;
        avatar?: string | null;
    }
}

export interface CreateProjectData {
    name        :string;
    description?:string;
}



