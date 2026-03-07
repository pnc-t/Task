'use client';

import { useState, useEffect, useCallback } from 'react';
import { Mail, RotateCw, Trash2, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { invitationService } from '@/services/invitation.service';
import { Invitation } from '@/types/invitation';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface ProjectInvitationsListProps {
  projectId: string;
  refreshTrigger?: number;
}

export function ProjectInvitationsList({ projectId, refreshTrigger }: ProjectInvitationsListProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await invitationService.getProjectInvitations(projectId);
      setInvitations(data);
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations, refreshTrigger]);

  const handleResend = async (invitationId: string) => {
    try {
      setProcessingId(invitationId);
      await invitationService.resendInvitation(projectId, invitationId);
      fetchInvitations();
    } catch (error) {
      console.error('Failed to resend invitation:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (invitationId: string) => {
    if (!confirm('この招待をキャンセルしますか？')) return;

    try {
      setProcessingId(invitationId);
      await invitationService.cancelInvitation(projectId, invitationId);
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: Invitation['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" />
            保留中
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            承認済み
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            辞退
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
            <AlertCircle className="w-3 h-3" />
            期限切れ
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RotateCw className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-8">
        <Mail className="w-10 h-10 mx-auto text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">招待はありません</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {invitations.map((invitation) => (
        <div key={invitation.id} className="py-4 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 truncate">
                {invitation.email}
              </span>
              {getStatusBadge(invitation.status)}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span>
                役割: {invitation.role === 'admin' ? '管理者' : 'メンバー'}
              </span>
              <span>
                招待者: {invitation.inviter?.name}
              </span>
              <span>
                {formatDistanceToNow(new Date(invitation.createdAt), {
                  addSuffix: true,
                  locale: ja,
                })}
              </span>
            </div>
          </div>

          {invitation.status === 'pending' && (
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => handleResend(invitation.id)}
                disabled={processingId === invitation.id}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                title="再送信"
              >
                <RotateCw className={`w-4 h-4 ${processingId === invitation.id ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => handleCancel(invitation.id)}
                disabled={processingId === invitation.id}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                title="キャンセル"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
