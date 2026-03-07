'use client';

import { useEffect, useState} from "react";
import { useRouter} from "next/navigation";
import { projectService} from "@/services/project.service";
import { Project} from "@/types/project";
import { Button } from '@/components/ui/button';
import { Plus, FolderKanban, Users,CheckSquare} from "lucide-react";
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';

export default function ProjectsPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    useEffect(() => {
        loadProjects();
    },[]);

    const loadProjects = async () => {
        try {
            const data = await projectService.getAll();
            setProjects(data)
        } catch (error) {
            console.error('Failed to load projects',error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProjectCreated = () => {
        loadProjects();
        setShowCreateDialog(false);
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">読み込み中...</div>
            </div>
        )
    }

    return (

    <div>
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">プロジェクト</h1>
                <p className="text-gray-600 mt-1">チームで進行中のプロジェクト一覧</p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                新規プロジェクト
            </Button>
        </div>

        {projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
            <FolderKanban className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
                プロジェクトがありません
            </h3>
            <p className="text-gray-600 mb-6">
                最初のプロジェクトを作成してタスク管理を始めましょう
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                    プロジェクトを作成
            </Button>
        </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => router.push(`/projects/${project.id}`)}
              className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FolderKanban className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                        <h3 className="font-semibold text-gray-900">{project.name}</h3>
                        </div>
                    </div>
                </div>

                {project.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {project.description}
                    </p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                        <CheckSquare className="w-4 h-4" />
                        <span>{project._count?.tasks || 0} タスク</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{project.members.length} メンバー</span>
                    </div>
                </div>
            </div>
            ))}
        </div>
        )}

        <CreateProjectDialog
            open={showCreateDialog}
            onClose={() => setShowCreateDialog(false)}
            onSuccess={handleProjectCreated}
        />
    </div>
  );
}