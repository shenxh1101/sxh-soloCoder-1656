import type { Member, MemberStatus } from '@/shared/types';
import { useAppStore } from '@/store/useAppStore';
import { daysSince } from '@/utils/date';
import { Eye, Edit2, Trash2, UserPlus } from 'lucide-react';

interface MemberTableProps {
  members: Member[];
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const statusBadgeMap: Record<MemberStatus, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-green-50', text: 'text-success', label: '活跃' },
  warning: { bg: 'bg-amber-50', text: 'text-warning', label: '课时紧张' },
  churned: { bg: 'bg-red-50', text: 'text-danger', label: '流失风险' },
  inactive: { bg: 'bg-slate-100', text: 'text-ink-500', label: '未激活' },
};

const getAvatarText = (name: string, gender: '男' | '女'): string => {
  const color = gender === '男' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600';
  return color;
};

export function MemberTable({ members, onSelect, onEdit, onDelete }: MemberTableProps) {
  const coaches = useAppStore((s) => s.coaches);
  const getCoachById = useAppStore((s) => s.getCoachById);

  const getCoachName = (coachId: string): string => {
    return getCoachById(coachId)?.name || '--';
  };

  const formatLastCheckIn = (lastCheckIn: string | null): string => {
    if (!lastCheckIn) return '暂无记录';
    const days = daysSince(lastCheckIn);
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    return `${days} 天前`;
  };

  const getProgressPct = (total: number, remaining: number): number => {
    if (total <= 0) return 0;
    return Math.min(100, Math.round((remaining / total) * 100));
  };

  if (members.length === 0) {
    return (
      <div className="card py-20 px-6">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-ink-100 flex items-center justify-center mb-4">
            <UserPlus className="w-8 h-8 text-ink-400" />
          </div>
          <p className="text-ink-500 text-base mb-1">暂无会员</p>
          <p className="text-ink-400 text-sm">点击右上方新增</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead>
            <tr className="bg-ink-50 border-b border-ink-100">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wider">
                会员
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wider">
                手机号
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wider">
                教练
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wider w-56">
                课时
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wider">
                上次训练
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wider">
                状态
              </th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {members.map((member, idx) => {
              const badge = statusBadgeMap[member.status];
              const pct = getProgressPct(member.totalClasses, member.remainingClasses);
              const isLow = member.remainingClasses <= 3 && member.remainingClasses > 0;
              const isEmpty = member.remainingClasses <= 0;
              const avatarColor = getAvatarText(member.name, member.gender);

              return (
                <tr
                  key={member.id}
                  className={`${idx % 2 === 0 ? 'bg-white' : 'bg-ink-50/40'} hover:bg-brand-50/60 transition-colors cursor-pointer`}
                  onClick={() => onSelect(member.id)}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${avatarColor}`}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-ink-900 text-sm">{member.name}</div>
                        <div className="text-xs text-ink-500">
                          {member.gender} · {member.height}cm
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="text-sm text-ink-700 font-mono">{member.phone}</span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="text-sm text-ink-700">{getCoachName(member.coachId)}</span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-ink-500">
                          剩余 <span className={`font-semibold ${isLow || isEmpty ? 'text-danger' : 'text-ink-900'}`}>{member.remainingClasses}</span>
                          <span className="text-ink-400"> / 总 {member.totalClasses}</span>
                        </span>
                        <span className={`font-medium ${isLow || isEmpty ? 'text-danger' : 'text-ink-500'}`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className={`progress-fill ${isLow || isEmpty ? 'bg-gradient-to-r from-red-400 to-danger !bg-none' : ''}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`text-sm ${
                        member.lastCheckIn && daysSince(member.lastCheckIn) >= 30
                          ? 'text-danger font-medium'
                          : 'text-ink-700'
                      }`}
                    >
                      {formatLastCheckIn(member.lastCheckIn)}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className={`badge ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onSelect(member.id)}
                        className="p-2 rounded-lg text-ink-500 hover:text-brand-500 hover:bg-brand-50 transition-colors"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(member.id)}
                        className="p-2 rounded-lg text-ink-500 hover:text-brand-500 hover:bg-brand-50 transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(member.id)}
                        className="p-2 rounded-lg text-ink-500 hover:text-danger hover:bg-red-50 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
