'use client';

import { useState, useRef } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api-client';

interface AvatarUploadProps {
  currentAvatar?: string | null;
  userName: string;
  onUpdate: (avatarUrl: string | null) => void;
}

export function AvatarUpload({ currentAvatar, userName, onUpdate }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('ファイルサイズは2MB以下にしてください');
      return;
    }

    if (!file.type.match(/^image\/(jpeg|png|gif|webp)$/)) {
      setError('JPEG、PNG、GIF、WebP形式のみ対応しています');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await apiClient.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUpdate(response.data.avatar);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'アップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('アバターを削除しますか？')) return;

    setIsUploading(true);
    setError('');
    try {
      await apiClient.delete('/users/me/avatar');
      onUpdate(null);
    } catch (err: any) {
      setError('削除に失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getAvatarUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('data:') || path.startsWith('http')) return path;
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${path}`;
  };

  const displayImage = preview || (currentAvatar ? getAvatarUrl(currentAvatar) : null);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {displayImage ? (
          <img
            src={displayImage}
            alt={userName}
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 disabled:opacity-50"
        >
          <Camera className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {preview && (
        <div className="flex gap-2">
          <Button onClick={handleUpload} disabled={isUploading} size="sm">
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                保存中...
              </>
            ) : (
              '保存'
            )}
          </Button>
          <Button variant="outline" onClick={handleCancel} disabled={isUploading} size="sm">
            キャンセル
          </Button>
        </div>
      )}

      {currentAvatar && !preview && (
        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={isUploading}
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <X className="w-4 h-4 mr-1" />
          )}
          削除
        </Button>
      )}
    </div>
  );
}
