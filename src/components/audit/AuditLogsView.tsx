import React, { useState } from 'react';
import {
  FileText,
  History,
  Lock,
  Search,
  ShieldCheck,
  User
} from 'lucide-react';
import { appStorage } from '../../services/storage';
import { AuditLog } from '../../types';
import { Pagination } from '../common/Pagination';

export const AuditLogsView: React.FC = () => {
  const auditLogs = appStorage.getAuditLogs();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const filteredLogs = auditLogs.filter(log => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        (log.entityCode && log.entityCode.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (filterType !== 'ALL' && log.entityType !== filterType) return false;
    return true;
  });

  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Nhật Ký Xử Lý & Dấu Vết Hệ Thống (Audit Log)
            </h2>
            <span className="flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              <Lock className="w-3 h-3" />
              <span>Bất biến (Append-only)</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Nguyên tắc nghiệp vụ: Quy trình hỗ trợ cần tạo dấu vết: ai làm, làm gì, khi nào, trạng thái nào. Không cho phép xóa lịch sử.
          </p>
        </div>

        <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          Tổng số: <strong className="text-blue-700">{auditLogs.length}</strong> bản ghi
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-2 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo hành động, người thực hiện, mã nghiệp vụ..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl"
          />
        </div>

        <select
          value={filterType}
          onChange={e => {
            setFilterType(e.target.value);
            setCurrentPage(1);
          }}
          className="border border-slate-300 rounded-xl p-2 bg-white"
        >
          <option value="ALL">Mọi loại thực thể</option>
          <option value="TASK">Công việc (TASK)</option>
          <option value="REQUEST">Yêu cầu (REQUEST)</option>
          <option value="URGE">Đôn đốc (URGE)</option>
          <option value="TARGET">Hồ sơ đối tượng (TARGET)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Thời điểm</th>
                <th className="py-3 px-4">Người thực hiện</th>
                <th className="py-3 px-4">Hành động</th>
                <th className="py-3 px-4">Mã liên quan</th>
                <th className="py-3 px-4">Chi tiết thay đổi</th>
                <th className="py-3 px-4">Trạng thái (Trước → Sau)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                    {log.timestamp.replace('T', ' ').substring(0, 19)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-bold text-slate-800">{log.userName}</div>
                    <div className="text-[10px] text-slate-400">{log.userRole}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-slate-700">
                    {log.entityCode || log.entityId}
                  </td>
                  <td className="py-3 px-4 text-slate-700 max-w-xs sm:max-w-md">
                    {log.details}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-[11px]">
                    {log.previousState && log.newState ? (
                      <span className="text-slate-600">
                        <span className="text-slate-400">{log.previousState}</span> &rarr;{' '}
                        <strong className="text-blue-700">{log.newState}</strong>
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Không tìm thấy bản ghi nhật ký nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredLogs.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredLogs.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemName="nhật ký"
          />
        )}
      </div>
    </div>
  );
};
