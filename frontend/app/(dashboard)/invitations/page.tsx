'use client';

import { Mail } from 'lucide-react';
import { PendingInvitations } from '@/components/invitations/pending-invitations';

export default function InvitationsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Mail className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">招待</h1>
            <p className="text-gray-600 mt-1">プロジェクトへの招待を確認・承認</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <PendingInvitations />
      </div>
    </div>
  );
}
