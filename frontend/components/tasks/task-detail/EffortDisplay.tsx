'use client';

import { Clock } from 'lucide-react';

interface EffortDisplayProps {
  estimatedHours?: number;
  actualHours?: number;
}

export function EffortDisplay({
  estimatedHours,
  actualHours,
}: EffortDisplayProps) {
  const hasEstimated = estimatedHours !== undefined && estimatedHours > 0;
  const hasActual = actualHours !== undefined && actualHours > 0;

  // ステータスインジケーターの計算
  const getStatusIndicator = () => {
    if (!hasEstimated || !hasActual) return null;

    if (actualHours! <= estimatedHours!) {
      return { color: 'bg-green-100 border-green-200', label: '計画内', textColor: 'text-green-700' };
    } else if (actualHours! <= estimatedHours! * 1.2) {
      return { color: 'bg-yellow-100 border-yellow-200', label: '20%超過', textColor: 'text-yellow-700' };
    } else {
      return { color: 'bg-red-100 border-red-200', label: '20%以上超過', textColor: 'text-red-700' };
    }
  };

  const statusIndicator = getStatusIndicator();

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-600" />
          <span className="font-semibold text-sm text-gray-900">工数</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* 推定時間 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">推定時間</span>
          <span className="text-sm font-medium text-gray-900">
            {hasEstimated ? `${estimatedHours}時間` : '未設定'}
          </span>
        </div>

        {/* 実績時間 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">実績時間</span>
          <span className="text-sm font-medium text-gray-900">
            {hasActual ? `${actualHours}時間` : '未設定'}
          </span>
        </div>

        {/* 差分 */}
        {hasEstimated && hasActual && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-sm text-gray-600">差分</span>
            <span className={`text-sm font-medium ${
              actualHours! <= estimatedHours! ? 'text-green-700' : 'text-red-700'
            }`}>
              {actualHours! <= estimatedHours!
                ? `${(estimatedHours! - actualHours!).toFixed(1)}時間短縮`
                : `${(actualHours! - estimatedHours!).toFixed(1)}時間超過`
              }
            </span>
          </div>
        )}

        {/* ステータスインジケーター */}
        {statusIndicator && (
          <div className={`flex items-center justify-center p-2 rounded-lg border ${statusIndicator.color}`}>
            <span className={`text-xs font-medium ${statusIndicator.textColor}`}>
              {statusIndicator.label}
            </span>
          </div>
        )}

        {/* 入力ガイド */}
        {!hasEstimated && !hasActual && (
          <p className="text-xs text-gray-500 text-center py-2">
            編集モードで時間を入力してください
          </p>
        )}
      </div>
    </div>
  );
}
