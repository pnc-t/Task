import apiClient from "@/lib/api-client";
import { Project, CreateProjectData} from "@/types/project";

export const projectService = {
    getAll: async (): Promise<Project[]> => {
        const response = await apiClient.get('projects');
        return response.data;
    },

    getById: async (id:string): Promise<Project> => {
        const response = await apiClient.get(`projects/${id}`);
        return response.data;
    },

    create: async (data:CreateProjectData): Promise<CreateProjectData> => {
        const response = await apiClient.post('projects', data);
        return response.data;
    },

    update: async(id:string,data:Partial<CreateProjectData>): Promise<CreateProjectData> => {
        const response = await apiClient.put(`projects/${id}`, data);
        return response.data;
    },

    delete: async (id:string): Promise<void> => {
        await apiClient.delete(`projects/${id}`);
    },

    addMember: async (projectId: string, data: { userId: string; role: string }) => {
        const response = await apiClient.post(`/projects/${projectId}/members`, data);
        return response.data;
    },

    removeMember: async (projectId: string, memberId: string) => {
        await apiClient.delete(`/projects/${projectId}/members/${memberId}`);
    },


};