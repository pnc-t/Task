import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Edit2, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskComment } from '@/types/task';
import { UserAvatar } from '@/components/ui/user-avatar';
import { sanitizeText } from '@/lib/sanitize';

interface TaskCommentsTabProps {
  comments: TaskComment[];
  currentUserId?: string;
  onAddComment: (content: string) => Promise<void>;
  onUpdateComment: (commentId: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
}

export function TaskCommentsTab({
  comments,
  currentUserId,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
}: TaskCommentsTabProps) {
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await onAddComment(newComment);
    setNewComment('');
  };

  const handleUpdateComment = async (commentId: string) => {
    await onUpdateComment(commentId, editingCommentContent);
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
        コメント
      </h3>

      <div className="space-y-4 mb-6">
        {comments.map((comment) => (
          <div key={comment.id} className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow duration-200 bg-gradient-to-br from-white to-gray-50">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <UserAvatar name={comment.user.name} avatar={comment.user.avatar} size="lg" className="shadow-md" />
                <div>
                  <p className="font-semibold text-gray-900">{comment.user.name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    {format(parseISO(comment.createdAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
                  </p>
                </div>
              </div>
              {comment.user.id === currentUserId && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingCommentId(comment.id);
                      setEditingCommentContent(comment.content);
                    }}
                    className="p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteComment(comment.id)}
                    className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {editingCommentId === comment.id ? (
              <div className="space-y-3">
                <textarea
                  value={editingCommentContent}
                  onChange={(e) => setEditingCommentContent(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleUpdateComment(comment.id)} className="bg-blue-600 hover:bg-blue-700">
                    保存
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingCommentId(null);
                      setEditingCommentContent('');
                    }}
                    className="hover:bg-gray-100"
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{sanitizeText(comment.content)}</p>
            )}
          </div>
        ))}

        {comments.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Send className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">まだコメントがありません</p>
            <p className="text-sm text-gray-400 mt-1">最初のコメントを追加しましょう</p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-6 mt-6">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="コメントを追加..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm mb-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
          />
          <Button onClick={handleAddComment} disabled={!newComment.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            <Send className="w-4 h-4 mr-2" />
            送信
          </Button>
        </div>
      </div>
    </div>
  );
}