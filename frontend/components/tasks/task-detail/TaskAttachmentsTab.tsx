import { format, parseISO } from 'date-fns';
import { File, Download, Trash2, Upload, Paperclip, FileText, Image, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskAttachment } from '@/types/task';
import { UserAvatar } from '@/components/ui/user-avatar';

interface TaskAttachmentsTabProps {
  attachments: TaskAttachment[];
  isUploading: boolean;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onDeleteAttachment: (attachmentId: string) => Promise<void>;
}

export function TaskAttachmentsTab({
  attachments,
  isUploading,
  onFileUpload,
  onDeleteAttachment,
}: TaskAttachmentsTabProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return <Image className="w-8 h-8 text-purple-500" />;
    }
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
      return <FileText className="w-8 h-8 text-blue-500" />;
    }
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'html', 'css'].includes(ext || '')) {
      return <FileCode className="w-8 h-8 text-green-500" />;
    }
    return <File className="w-8 h-8 text-gray-400" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <div className="w-1 h-6 bg-purple-600 rounded-full"></div>
          添付ファイル
        </h3>
        {attachments.length > 0 && (
          <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-full">
            <Paperclip className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-700">
              {attachments.length}件
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3 mb-6">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="group flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:shadow-md hover:border-gray-200 transition-all duration-200 bg-gradient-to-br from-white to-gray-50"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex-shrink-0 w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 group-hover:border-gray-200 transition-colors duration-200">
                {getFileIcon(attachment.filename)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate mb-1">{attachment.filename}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                  <span className="font-medium bg-gray-100 px-2 py-0.5 rounded">
                    {formatFileSize(attachment.fileSize)}
                  </span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span>{format(parseISO(attachment.createdAt), 'yyyy/MM/dd HH:mm')}</span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span className="flex items-center gap-1">
                    <UserAvatar name={attachment.user.name} avatar={attachment.user.avatar} size="xs" />
                    {attachment.user.name}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <a
                href={attachment.fileUrl}
                download={attachment.filename}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                title="ダウンロード"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={() => onDeleteAttachment(attachment.id)}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                title="削除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {attachments.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Paperclip className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">添付ファイルがありません</p>
            <p className="text-sm text-gray-400 mt-1">ドキュメントや画像を追加しましょう</p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-6">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-dashed border-purple-300 hover:border-purple-400 transition-colors duration-200">
          <input
            type="file"
            multiple
            onChange={onFileUpload}
            className="hidden"
            disabled={isUploading}
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Upload className="w-7 h-7 text-white" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 mb-1">
                  {isUploading ? 'アップロード中...' : 'ファイルを追加'}
                </p>
                <p className="text-xs text-gray-600">
                  クリックしてファイルを選択
                </p>
              </div>
              <Button
                disabled={isUploading}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('file-upload')?.click();
                }}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'アップロード中...' : 'ファイルを選択'}
              </Button>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}