import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { MemberTable } from '@/components/ui/MemberTable';
import { useAppStore } from '@/store/useAppStore';
import { isLowClasses, isChurnRisk, getMemberStatus } from '@/utils/calculations';
import { cn } from '@/lib/utils';
import type { Member, MemberStatus } from '@/shared/types';

const STATUS_FILTERS: { id: 'all' | MemberStatus; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'active', label: '活跃' },
  { id: 'warning', label: '课时紧张' },
  { id: 'inactive', label: '未激活' },
  { id: 'churned', label: '流失风险' },
];

const statusMatch = (id: 'all' | MemberStatus, m: Member): boolean => {
  if (id === 'all') return true;
  if (id === 'warning') return isLowClasses(m);
  if (id === 'churned') return isChurnRisk(m);
  return getMemberStatus(m) === id;
};

export default function MemberList() {
  const nav = useNavigate();
  const { members, coaches, searchKeyword, setSearchKeyword, removeMember } = useAppStore();
  const [coachF, setCoachF] = useState<string>('all');
  const [statusF, setStatusF] = useState<'all' | MemberStatus>('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    return members.filter((m) => {
      const byKw = !kw || m.name.toLowerCase().includes(kw) || m.phone.includes(kw);
      const byCoach = coachF === 'all' || m.coachId === coachF;
      const byStatus = statusMatch(statusF, m);
      return byKw && byCoach && byStatus;
    });
  }, [members, searchKeyword, coachF, statusF]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / 10));
  const curPage = page > totalPages ? 1 : page;
  const paged = filtered.slice((curPage - 1) * 10, curPage * 10);

  const handleSelect = (id: string) => nav(`/members/${id}`);
  const handleEdit = (id: string) => nav(`/members/${id}`);
  const handleDelete = (id: string) => {
    if (confirm('确定删除该会员吗？相关记录将一并移除。')) {
      removeMember(id);
    }
  };

  const Chip = ({
    label,
    active,
    onClick,
    color,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
    color?: string;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border',
        active
          ? color || 'bg-brand-500 text-white border-brand-500 shadow-sm'
          : 'bg-white text-ink-600 border-ink-200 hover:border-brand-300 hover:text-brand-600'
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setPage(1);
              }}
              placeholder="搜索姓名或手机号..."
              className="input-base pl-9 pr-4 py-2.5"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs text-ink-400 shrink-0">教练</span>
            <Chip
              label="全部"
              active={coachF === 'all'}
              onClick={() => {
                setCoachF('all');
                setPage(1);
              }}
              color="bg-accent-500 text-white border-accent-500"
            />
            {coaches.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                active={coachF === c.id}
                onClick={() => {
                  setCoachF(c.id);
                  setPage(1);
                }}
                color="bg-accent-500 text-white border-accent-500"
              />
            ))}
          </div>
          <button
            onClick={() => nav('/members/new')}
            className="btn-primary ml-auto flex items-center gap-2 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            新增会员
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
          <span className="text-xs text-ink-400 shrink-0">状态</span>
          {STATUS_FILTERS.map((s) => (
            <Chip
              key={s.id}
              label={s.label}
              active={statusF === s.id}
              onClick={() => {
                setStatusF(s.id);
                setPage(1);
              }}
            />
          ))}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <MemberTable
          members={paged}
          onSelect={handleSelect}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-ink-100">
            <p className="text-xs text-ink-500">
              共 <span className="font-semibold text-ink-700">{filtered.length}</span> 位会员
              · 第 <span className="font-semibold text-ink-700">{curPage}</span> / {totalPages} 页
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={curPage === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-500 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(
                  Math.max(0, Math.min(curPage - 3, totalPages - 5)),
                  Math.max(5, Math.min(curPage + 2, totalPages))
                )
                .map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-xs font-medium transition-all',
                      n === curPage ? 'bg-brand-500 text-white' : 'text-ink-600 hover:bg-ink-50'
                    )}
                  >
                    {n}
                  </button>
                ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={curPage === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-500 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
