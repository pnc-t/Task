'use client';

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { projectService } from "@/services/project.service";
import { Project } from "@/types/project";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, FolderKanban, Users, CheckSquare, Search, Star, ArrowUpDown } from "lucide-react";
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { useProjectFavoritesStore } from '@/lib/project-favorites-store';

type SortKey = 'name' | 'created' | 'tasks';

export default function ProjectsPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortKey>('created');
    const { favorites, toggle: toggleFavorite } = useProjectFavoritesStore();

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const data = await projectService.getAll();
            setProjects(data)
        } catch (error) {
            console.error('Failed to load projects', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProjectCreated = () => {
        loadProjects();
        setShowCreateDialog(false);
    }

    const filteredProjects = useMemo(() => {
        let result = projects;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q)
            );
        }

        result = [...result].sort((a, b) => {
            // お気に入り優先
            const aFav = favorites.has(a.id) ? 0 : 1;
            const bFav = favorites.has(b.id) ? 0 : 1;
            if (aFav !== bFav) return aFav - bFav;

            if (sortBy === 'name') {
                return a.name.localeCompare(b.name, 'ja');
            } else if (sortBy === 'tasks') {
                return (b._count?.tasks || 0) - (a._count?.tasks || 0);
            } else {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });

        return result;
    }, [projects, searchQuery, sortBy, favorites]);

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

            {/* 検索・ソートバー */}
            {projects.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-6">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            type="text"
                            placeholder="プロジェクトを検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        <ArrowUpDown className="w-4 h-4 text-gray-500" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortKey)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                            <option value="created">作成日順</option>
                            <option value="name">名前順</option>
                            <option value="tasks">タスク数順</option>
                        </select>
                    </div>
                </div>
            )}

            {filteredProjects.length === 0 && projects.length > 0 ? (
                <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">該当するプロジェクトがありません</p>
                </div>
            ) : projects.length === 0 ? (
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
                    {filteredProjects.map((project) => {
                        const taskCount = project._count?.tasks || 0;
                        const isFav = favorites.has(project.id);

                        return (
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
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFavorite(project.id);
                                        }}
                                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                                    >
                                        <Star className={`w-4 h-4 ${isFav ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                    </button>
                                </div>

                                {project.description && (
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                        {project.description}
                                    </p>
                                )}

                                {/* 進捗バー */}
                                <div className="mb-3">
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div
                                            className="bg-blue-500 h-1.5 rounded-full transition-all"
                                            style={{ width: `${taskCount > 0 ? Math.min(100, Math.round((project.members.length / taskCount) * 100)) : 0}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <CheckSquare className="w-4 h-4" />
                                        <span>{taskCount} タスク</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        <span>{project.members.length} メンバー</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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
