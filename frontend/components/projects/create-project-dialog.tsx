'use client';

import React, { useState } from "react";
import { projectService } from "@/services/project.service";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface CreateProjectDialogProps {
    open     : boolean;
    onClose  : () => void;
    onSuccess: () => void;
}

export function CreateProjectDialog({ open,onClose,onSuccess }: CreateProjectDialogProps) {
    const [formData, setFormData] = useState({
        name:'',
        description:'',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error,setError] = useState('');

    const handleSubmit = async (e:React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await projectService.create(formData);
            setFormData({name:'',description:'',});
            onSuccess();
        } catch (err:any) {
            setError(err.response?.data?.message|| 'プロジェクトの作成に失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">新規プロジェクト</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                        >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                        {error}
                    </div>
                    )}

                    <div>
                        <Label htmlFor="name">プロジェクト名 *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="新しいプロジェクト"
                            required
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="description">説明</Label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="プロジェクトの説明を入力してください"
                            rows={4}
                            className="mt-1 flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            キャンセル
                        </Button>
                        <Button type="submit" disabled={isLoading} className="flex-1">
                            {isLoading ? '作成中...' : '作成'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>

    );
}