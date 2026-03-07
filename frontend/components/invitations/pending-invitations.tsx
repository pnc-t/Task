'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Check, X, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { invitationService } from '@/services/invitation.service';
import { Invitation } from '@/types/invitation';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

export function PendingInvitations() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchInvitations = async () => {
    try {
      setIsLoading(true);
      const data = await invitationService.getMyInvitations();
      setInvitations(data);
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleRespond = async (invitationId: string, action: 'accept' | 'decline') => {
    try {
      setProcessingId(invitationId);
      const result = await invitationService.respondToInvitation(invitationId, action);

      if (action === 'accept' && result.projectId) {
        router.push(`/projects/${result.projectId}`);
      } else {
        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      }
    } catch (error) {
      console.error('Failed to respond to invitation:', error);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">保留中の招待はありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map((invitation) => (
        <div
          key={invitation.id}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {invitation.project?.name}
              </h3>
              {invitation.project?.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {invitation.project.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span>
                  招待者: <strong>{invitation.inviter?.name}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDistanceToNow(new Date(invitation.createdAt), {
                    addSuffix: true,
                    locale: ja,
                  })}
                </span>
              </div>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                    invitation.role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {invitation.role === 'admin' ? '管理者' : 'メンバー'}として招待
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRespond(invitation.id, 'decline')}
                disabled={processingId === invitation.id}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <X className="w-4 h-4 mr-1" />
                辞退
              </Button>
              <Button
                size="sm"
                onClick={() => handleRespond(invitation.id, 'accept')}
                disabled={processingId === invitation.id}
              >
                <Check className="w-4 h-4 mr-1" />
                {processingId === invitation.id ? '処理中...' : '参加'}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
