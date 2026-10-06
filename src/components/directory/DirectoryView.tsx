import React, { useState } from 'react';
import { Users, UserCheck } from 'lucide-react';
import { TargetsView } from '../targets/TargetsView';
import { MembersView } from '../members/MembersView';
import { Task } from '../../types';

interface DirectoryViewProps {
  onSelectTask: (task: Task) => void;
  onOpenCreateTaskForTarget: (targetId: string) => void;
  initialSubTab?: 'targets' | 'members';
  initialTargetGroup?: string;
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  onSelectTask,
  onOpenCreateTaskForTarget,
  initialSubTab = 'targets',
  initialTargetGroup = 'ALL'
}) => {
  const [subTab, setSubTab] = useState<'targets' | 'members'>(initialSubTab);
  const [targetGroup, setTargetGroup] = useState<string>(initialTargetGroup);

  React.useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  React.useEffect(() => {
    setTargetGroup(initialTargetGroup);
  }, [initialTargetGroup]);

  return (
    <div className="space-y-4">
      {/* Sub-tab Navigation with Royal Blue Accent */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setSubTab('targets')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all cursor-pointer ${
              subTab === 'targets'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-700 hover:bg-white/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>1. Hồ Sơ 5 Nhóm Đối Tượng Phục Vụ</span>
          </button>
          <button
            onClick={() => setSubTab('members')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all cursor-pointer ${
              subTab === 'members'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-700 hover:bg-white/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>2. Đội Ngũ Cán Bộ Tổ CNSCĐ</span>
          </button>
        </div>

        <div className="text-xs text-blue-900 font-semibold hidden md:block">
          {subTab === 'targets' ? 'Dữ liệu hồ sơ số đối tượng cơ sở' : 'Quản lý nhân lực & theo dõi việc giao'}
        </div>
      </div>

      {/* Render appropriate view */}
      {subTab === 'targets' ? (
        <TargetsView
          onSelectTask={onSelectTask}
          onOpenCreateTaskForTarget={onOpenCreateTaskForTarget}
          initialFilterGroup={targetGroup}
        />
      ) : (
        <MembersView onSelectTask={onSelectTask} />
      )}
    </div>
  );
};
