import React from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, Flame, Minus } from 'lucide-react';
import { Priority, TargetGroup, TaskStatus, WorkGroup, WorkSource } from '../../types';
import {
  TARGET_GROUP_CONFIG,
  TASK_STATUS_CONFIG,
  WORK_GROUP_CONFIG,
  WORK_SOURCE_CONFIG
} from '../../mock/initialData';

export const TargetGroupBadge: React.FC<{ group: TargetGroup; compact?: boolean }> = ({ group, compact = false }) => {
  const conf = TARGET_GROUP_CONFIG[group] || {
    label: group,
    shortLabel: group,
    bg: 'bg-gray-100 text-gray-800',
    border: 'border-gray-200'
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${conf.bg} ${conf.border}`}
      title={conf.desc}
    >
      {compact ? conf.shortLabel : conf.label}
    </span>
  );
};

export const WorkGroupBadge: React.FC<{ group: WorkGroup; compact?: boolean }> = ({ group, compact = false }) => {
  const conf = WORK_GROUP_CONFIG[group] || {
    label: group,
    short: group,
    badge: 'bg-gray-100 text-gray-800'
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${conf.badge}`}
      title={conf.desc}
    >
      {compact ? conf.short : conf.label}
    </span>
  );
};

export const TaskStatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const conf = TASK_STATUS_CONFIG[status] || {
    label: status,
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    dot: 'bg-gray-400'
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${conf.bg} ${conf.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
      {conf.label}
    </span>
  );
};

export interface PriorityConfigItem {
  key: Priority;
  label: string;
  shortLabel: string;
  level: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  barColor: string;
  desc: string;
}

export const PRIORITY_CONFIG: Record<Priority, PriorityConfigItem> = {
  KHAN: {
    key: 'KHAN',
    label: 'Khẩn cấp',
    shortLabel: 'Khẩn',
    level: 'Urgent',
    bg: 'bg-red-50 text-red-700',
    text: 'text-red-700',
    border: 'border-red-300 ring-1 ring-red-400/30',
    dot: 'bg-red-600',
    barColor: 'border-l-red-600',
    desc: 'Việc khẩn cấp - Cần giải quyết ngay trong ca trực'
  },
  CAO: {
    key: 'CAO',
    label: 'Ưu tiên cao',
    shortLabel: 'Cao',
    level: 'High',
    bg: 'bg-amber-50 text-amber-800',
    text: 'text-amber-800',
    border: 'border-amber-300',
    dot: 'bg-amber-500',
    barColor: 'border-l-amber-500',
    desc: 'Ưu tiên cao - Giải quyết sớm trước các việc khác'
  },
  THUONG: {
    key: 'THUONG',
    label: 'Thường',
    shortLabel: 'Thường',
    level: 'Medium',
    bg: 'bg-sky-50 text-sky-800',
    text: 'text-sky-800',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
    barColor: 'border-l-sky-400',
    desc: 'Độ ưu tiên trung bình - Thực hiện theo kế hoạch'
  },
  THAP: {
    key: 'THAP',
    label: 'Thấp',
    shortLabel: 'Thấp',
    level: 'Low',
    bg: 'bg-slate-100 text-slate-700',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    barColor: 'border-l-slate-300',
    desc: 'Độ ưu tiên thấp - Linh hoạt thời gian'
  }
};

export const PriorityBadge: React.FC<{
  priority: Priority;
  compact?: boolean;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
}> = ({ priority, compact = false, size = 'sm', showIcon = true }) => {
  const conf = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.THUONG;

  const renderIcon = () => {
    if (!showIcon) return null;
    switch (priority) {
      case 'KHAN':
        return <Flame className="w-3.5 h-3.5 text-red-600 animate-pulse shrink-0" />;
      case 'CAO':
        return <ArrowUp className="w-3 h-3 text-amber-600 shrink-0 font-black stroke-[3]" />;
      case 'THUONG':
        return <Minus className="w-3 h-3 text-sky-600 shrink-0 font-bold" />;
      case 'THAP':
        return <ArrowDown className="w-3 h-3 text-slate-500 shrink-0 font-bold" />;
      default:
        return null;
    }
  };

  if (compact) {
    return (
      <span
        title={`${conf.label}: ${conf.desc}`}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold border ${conf.bg} ${conf.border}`}
      >
        {renderIcon()}
        <span>{conf.shortLabel}</span>
      </span>
    );
  }

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs'
  }[size];

  return (
    <span
      title={conf.desc}
      className={`inline-flex items-center gap-1.5 rounded-md font-bold border transition-colors ${sizeClasses} ${conf.bg} ${conf.border}`}
    >
      {renderIcon()}
      <span>{conf.label}</span>
      {priority === 'KHAN' && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span>
        </span>
      )}
    </span>
  );
};

export const WorkSourceBadge: React.FC<{ source: WorkSource }> = ({ source }) => {
  const conf = WORK_SOURCE_CONFIG[source] || { label: source };
  return (
    <span className="inline-flex items-center text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
      {conf.label}
    </span>
  );
};
