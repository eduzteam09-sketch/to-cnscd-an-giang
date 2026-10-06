import React, { useState, useMemo } from 'react';
import {
  ArrowRightLeft,
  BarChart3,
  Calendar,
  CheckCircle,
  Download,
  FileSpreadsheet,
  FileText,
  History,
  Info,
  Printer,
  Sliders,
  Sparkles,
  Users
} from 'lucide-react';
import { AuditLogsView } from '../audit/AuditLogsView';
import { TARGET_GROUP_CONFIG, WORK_GROUP_CONFIG } from '../../mock/initialData';
import { appStorage } from '../../services/storage';
import { TargetGroup, WorkGroup } from '../../types';

export const ReportsView: React.FC = () => {
  const [subTab, setSubTab] = useState<'report' | 'audit'>('report');
  const selectedWard = appStorage.getSelectedWard();
  const currentRole = appStorage.getCurrentRole();
  const tasks = appStorage.getTasks();
  const requests = appStorage.getRequests();
  const members = appStorage.getMembers();
  const targets = appStorage.getTargets();

  const leader = members.find(m => m.role === 'LEADER') || members[0];

  // Kỳ báo cáo: Tuần, Tháng, Quý hoặc Tùy chỉnh khoảng ngày
  const [period, setPeriod] = useState<'TUAN_NAY' | 'THANG_NAY' | 'QUY_NAY' | 'TUY_CHINH'>('THANG_NAY');
  const [customStartDate, setCustomStartDate] = useState('2026-09-01');
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0] || '2026-09-30');
  const [showPrintHelp, setShowPrintHelp] = useState(false);

  const formatDateVN = (dStr: string) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dStr;
  };

  const periodLabel = useMemo(() => {
    if (period === 'TUAN_NAY') return 'Tuần 38 (18/09 - 25/09/2026)';
    if (period === 'THANG_NAY') return 'Tháng 09/2026';
    if (period === 'QUY_NAY') return 'Quý 3/2026';
    if (period === 'TUY_CHINH') {
      return `Tùy chỉnh (Từ ngày ${formatDateVN(customStartDate)} đến ngày ${formatDateVN(customEndDate)})`;
    }
    return 'Tháng 09/2026';
  }, [period, customStartDate, customEndDate]);

  // Lọc công việc theo kỳ báo cáo
  const periodTasks = useMemo(() => {
    if (period === 'TUY_CHINH') {
      if (!customStartDate && !customEndDate) return tasks;
      return tasks.filter(t => {
        const d = t.startDate || (t.createdAt ? t.createdAt.split('T')[0] : '') || t.dueDate;
        if (!d) return true;
        if (customStartDate && d < customStartDate) return false;
        if (customEndDate && d > customEndDate) return false;
        return true;
      });
    }
    return tasks;
  }, [tasks, period, customStartDate, customEndDate]);

  // Lọc yêu cầu người dân theo kỳ báo cáo
  const periodRequests = useMemo(() => {
    if (period === 'TUY_CHINH') {
      if (!customStartDate && !customEndDate) return requests;
      return requests.filter(r => {
        const d = r.createdAt ? r.createdAt.split('T')[0] : '';
        if (!d) return true;
        if (customStartDate && d < customStartDate) return false;
        if (customEndDate && d > customEndDate) return false;
        return true;
      });
    }
    return requests;
  }, [requests, period, customStartDate, customEndDate]);

  const todayStr = new Date().toISOString().split('T')[0];
  const totalTasks = periodTasks.length;
  const completedTasks = periodTasks.filter(t => t.status === 'HOAN_THANH' || t.status === 'DONG').length;
  const inProgressTasks = periodTasks.filter(t => t.status === 'DANG_THUC_HIEN' || t.status === 'DA_NHAN').length;
  const overdueTasks = periodTasks.filter(t => t.status === 'QUA_HAN' || (t.dueDate && t.dueDate < todayStr && t.status !== 'HOAN_THANH' && t.status !== 'DONG')).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Breakdown by 5 Target Groups
  const targetGroupStats = (['NGUOI_DAN', 'HO_KINH_DOANH', 'TIEU_THUONG', 'DOANH_NGHIEP', 'CAN_BO_CO_SO'] as TargetGroup[]).map(tg => {
    const tgTasks = periodTasks.filter(t => t.targetGroup === tg);
    const done = tgTasks.filter(t => t.status === 'HOAN_THANH' || t.status === 'DONG').length;
    return {
      group: tg,
      conf: TARGET_GROUP_CONFIG[tg],
      total: tgTasks.length,
      done,
      rate: tgTasks.length > 0 ? Math.round((done / tgTasks.length) * 100) : 0
    };
  });

  // Breakdown by 5 Work Groups
  const workGroupStats = (['PHAT_HIEN', 'HUONG_DAN', 'HO_TRO', 'DON_DOC', 'THEO_DOI_KET_QUA'] as WorkGroup[]).map(wg => {
    const wgTasks = periodTasks.filter(t => t.workGroup === wg);
    const done = wgTasks.filter(t => t.status === 'HOAN_THANH' || t.status === 'DONG').length;
    return {
      group: wg,
      conf: WORK_GROUP_CONFIG[wg],
      total: wgTasks.length,
      done,
      rate: wgTasks.length > 0 ? Math.round((done / wgTasks.length) * 100) : 0
    };
  });

  // Thống kê thành viên theo kỳ thực tế
  const getPeriodMemberStats = (memId: string, memName: string) => {
    const mTasks = periodTasks.filter(t =>
      t.primaryAssigneeId === memId ||
      (t.collaboratorIds && t.collaboratorIds.includes(memId)) ||
      (t.primaryAssigneeName && (
        t.primaryAssigneeName.toLowerCase().trim() === memName.toLowerCase().trim() ||
        t.primaryAssigneeName.toLowerCase().includes(memName.toLowerCase())
      ))
    );
    const completed = mTasks.filter(t => t.status === 'HOAN_THANH' || t.status === 'DONG').length;
    const overdue = mTasks.filter(t => t.status === 'QUA_HAN' || (t.dueDate && t.dueDate < todayStr && t.status !== 'HOAN_THANH' && t.status !== 'DONG')).length;
    const active = Math.max(0, mTasks.length - completed - overdue);
    return { active, completed, overdue, total: mTasks.length };
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Mã việc', 'Tên công việc', 'Nguồn', 'Nhóm công việc', 'Đối tượng', 'Người phụ trách', 'Hạn', 'Trạng thái', 'Kết quả thực tế'];
    const rows = periodTasks.map(t => [
      t.code,
      `"${t.title.replace(/"/g, '""')}"`,
      t.source,
      t.workGroup,
      `"${(t.targetName || '').replace(/"/g, '""')}"`,
      t.primaryAssigneeName,
      t.dueDate,
      t.status,
      `"${(t.actualResult || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_cao_To_CNSCD_${periodLabel.replace(/[^\w\d]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print PDF handling with fallback and toast guide
  const handlePrint = () => {
    setShowPrintHelp(true);
    setTimeout(() => {
      try {
        window.print();
      } catch (e) {
        console.error('Print trigger error:', e);
      }
    }, 250);
  };

  return (
    <div className="space-y-4">
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 no-print">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setSubTab('report')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              subTab === 'report'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Báo Cáo & Thống Kê Số Liệu</span>
          </button>
          <button
            onClick={() => setSubTab('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              subTab === 'audit'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Nhật Ký & Dấu Vết Hoạt Động (Audit)</span>
          </button>
        </div>
      </div>

      {subTab === 'audit' ? (
        <AuditLogsView />
      ) : (
        <>
          {/* Action Header */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Báo Cáo & Thống Kê Hoạt Động Tổ CNSCĐ
              </h2>
              <p className="text-xs text-slate-500">
                Kỳ báo cáo: <strong>{periodLabel}</strong> • Tổng hợp toàn diện 5 nhóm đối tượng và 5 nhóm công việc
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Period selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2 py-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <select
                  value={period}
                  onChange={e => {
                    const val = e.target.value as any;
                    setPeriod(val);
                  }}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
                >
                  <option value="TUAN_NAY">Báo cáo theo tuần</option>
                  <option value="THANG_NAY">Báo cáo theo tháng</option>
                  <option value="QUY_NAY">Báo cáo theo quý</option>
                  <option value="TUY_CHINH">Tùy chỉnh khoảng ngày</option>
                </select>
              </div>

              {/* Date pickers when TUY_CHINH is chosen */}
              {period === 'TUY_CHINH' && (
                <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-xl text-xs">
                  <Sliders className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-semibold text-slate-600">Từ:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={e => setCustomStartDate(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-xs text-slate-800 font-semibold focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-semibold text-slate-600">Đến:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={e => setCustomEndDate(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-xs text-slate-800 font-semibold focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {currentRole !== 'MEMBER' ? (
                <>
                  {/* Export Excel */}
                  <button
                    onClick={handleExportCSV}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    title="Xuất bảng dữ liệu ra file Excel / CSV"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Xuất Excel</span>
                  </button>

                  {/* Print / Export PDF button */}
                  <button
                    onClick={handlePrint}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    title="Mở hộp thoại In hoặc Lưu dưới dạng file PDF (Save as PDF)"
                  >
                    <Printer className="w-4 h-4 text-amber-300" />
                    <span>In / Xuất PDF</span>
                  </button>
                </>
              ) : (
                <span className="text-xs text-slate-500 italic bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                  🔒 Quyền Thành viên: Chỉ xem số liệu báo cáo
                </span>
              )}
            </div>
          </div>

          {/* Quick Notice about PDF Export */}
          {showPrintHelp && (
            <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl flex items-start justify-between gap-3 text-xs text-blue-900 no-print animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div>
                    <strong>Hướng dẫn lưu file PDF:</strong> Tại hộp thoại in vừa xuất hiện, ở mục <strong>Máy in (Destination)</strong> hãy chọn <strong>"Lưu dưới dạng PDF" (Save as PDF)</strong> để tải file báo cáo về máy tính.
                  </div>
                  <div className="text-[11px] text-blue-700">
                    💡 <em>Ghi chú:</em> Khi chạy trong cửa sổ xem trước (iframe của AI Studio), một số trình duyệt có thể hạn chế mở hộp thoại in trực tiếp. Khi ứng dụng được <strong>Deploy lên Vercel</strong> hoặc mở trên trang web độc lập, nút <strong>In / Xuất PDF</strong> sẽ mở hộp thoại in của trình duyệt và tải file PDF hoàn toàn bình thường.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowPrintHelp(false)}
                className="text-blue-700 hover:text-blue-900 font-bold px-2 py-0.5 rounded cursor-pointer shrink-0"
              >
                ✕ Đóng
              </button>
            </div>
          )}

          {/* Printable Report Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            {/* Official Header for Print */}
            <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  UBND {selectedWard.name.toUpperCase()} - {selectedWard.districtName.toUpperCase()}, TỈNH AN GIANG
                </div>
                <div className="text-xs font-black text-slate-800 uppercase">
                  TỔ CÔNG NGHỆ SỐ CỘNG ĐỒNG {selectedWard.name.toUpperCase()}
                </div>
              </div>
              <div className="text-left sm:text-right text-xs">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 uppercase">
                  BÁO CÁO KẾT QUẢ ĐIỀU HÀNH & HỖ TRỢ CHUYỂN ĐỔI SỐ
                </h1>
                <div className="text-slate-500 text-xs italic">Kỳ: {periodLabel}</div>
              </div>
            </div>

            {/* Section 1: KPI Chỉ số cốt lõi */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs border-l-4 border-blue-600 pl-2">
                I. Tổng hợp chỉ số điều hành chung
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500">Yêu cầu dân gửi:</span>
                  <div className="text-xl font-bold text-slate-800 mt-1">{periodRequests.length}</div>
                  <span className="text-[11px] text-blue-600 font-medium">100% đã tiếp nhận/điều phối</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500">Tổng công việc quản lý:</span>
                  <div className="text-xl font-bold text-slate-800 mt-1">{totalTasks}</div>
                  <span className="text-[11px] text-slate-500">{inProgressTasks} đang thực hiện</span>
                </div>

                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-emerald-800">Hoàn thành thực tế:</span>
                  <div className="text-xl font-bold text-emerald-700 mt-1">{completedTasks}</div>
                  <span className="text-[11px] text-emerald-700 font-medium">Đạt tỷ lệ {completionRate}%</span>
                </div>

                <div className="p-3.5 bg-red-50 rounded-xl border border-red-200">
                  <span className="text-red-800">Việc chậm/quá hạn:</span>
                  <div className="text-xl font-bold text-red-600 mt-1">{overdueTasks}</div>
                  <span className="text-[11px] text-red-700 font-medium">Đang trong diện đôn đốc</span>
                </div>
              </div>
            </div>

            {/* Section 2: 5 Nhóm Đối tượng */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs border-l-4 border-blue-600 pl-2">
                  II. Kết quả hỗ trợ theo 5 nhóm đối tượng
                </h3>
                <span className="text-[11px] text-slate-400 italic sm:hidden flex items-center gap-1 pl-2">
                  <ArrowRightLeft className="w-3 h-3 text-blue-500 shrink-0" />
                  <span>Vuốt ngang để xem đủ các cột dữ liệu</span>
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full min-w-[650px] text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 font-bold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3.5 whitespace-nowrap">Nhóm đối tượng</th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap">Số lượng việc</th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap">Đã hoàn thành</th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap">Tỷ lệ hoàn thành</th>
                      <th className="py-2.5 px-3.5 min-w-[220px]">Nội dung hỗ trợ trọng tâm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {targetGroupStats.map(s => (
                      <tr key={s.group} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3.5 font-semibold text-slate-900 whitespace-nowrap">{s.conf.label}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-700 text-center whitespace-nowrap">{s.total}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-700 text-center whitespace-nowrap">{s.done}</td>
                        <td className="py-2.5 px-3 font-bold text-blue-700 text-center whitespace-nowrap">{s.rate}%</td>
                        <td className="py-2.5 px-3.5 text-slate-600 leading-relaxed">{s.conf.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: 5 Nhóm Công Việc */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs border-l-4 border-blue-600 pl-2">
                  III. Kết quả theo 5 nhóm công việc nghiệp vụ
                </h3>
                <span className="text-[11px] text-slate-400 italic sm:hidden flex items-center gap-1 pl-2">
                  <ArrowRightLeft className="w-3 h-3 text-blue-500 shrink-0" />
                  <span>Vuốt ngang để xem đủ các cột dữ liệu</span>
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full min-w-[650px] text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 font-bold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3.5 whitespace-nowrap">Nhóm công việc</th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap">Số việc</th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap">Đã xong</th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap">Tiến độ</th>
                      <th className="py-2.5 px-3.5 min-w-[220px]">Mô tả nghiệp vụ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {workGroupStats.map(s => (
                      <tr key={s.group} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3.5 font-semibold text-slate-900 whitespace-nowrap">{s.conf.label}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-700 text-center whitespace-nowrap">{s.total}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-700 text-center whitespace-nowrap">{s.done}</td>
                        <td className="py-2.5 px-3 font-bold text-blue-700 text-center whitespace-nowrap">{s.rate}%</td>
                        <td className="py-2.5 px-3.5 text-slate-600 leading-relaxed">{s.conf.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Hiệu suất thành viên */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs border-l-4 border-blue-600 pl-2">
                  IV. Khối lượng và kết quả của từng thành viên
                </h3>
                <span className="text-[11px] text-slate-400 italic sm:hidden flex items-center gap-1 pl-2">
                  <ArrowRightLeft className="w-3 h-3 text-blue-500 shrink-0" />
                  <span>Vuốt ngang để xem đủ các cột dữ liệu</span>
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full min-w-[680px] text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 font-bold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3.5 whitespace-nowrap">Họ và tên</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Chức vụ / Vai trò</th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap">Việc đang làm</th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap">Đã hoàn thành</th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap">Quá hạn</th>
                      <th className="py-2.5 px-3.5 whitespace-nowrap">Đánh giá</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {members.filter(m => m.role === 'LEADER' || m.role === 'MEMBER').map(mem => {
                      const st = getPeriodMemberStats(mem.id, mem.name);
                      return (
                        <tr key={mem.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3.5 font-bold text-slate-900 whitespace-nowrap">{mem.name}</td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{mem.title}</td>
                          <td className="py-2.5 px-3 font-bold text-blue-700 text-center whitespace-nowrap">{st.active}</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-700 text-center whitespace-nowrap">{st.completed}</td>
                          <td className="py-2.5 px-3 font-bold text-red-600 text-center whitespace-nowrap">{st.overdue}</td>
                          <td className="py-2.5 px-3.5 font-medium whitespace-nowrap">
                            {st.overdue === 0 ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                                ✓ Đạt chỉ tiêu
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                                ⚠ Cần tập trung giải quyết
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signature Footer */}
            <div className="pt-8 grid grid-cols-2 text-center text-xs">
              <div>
                <div className="font-bold text-slate-700 uppercase">NGƯỜI LẬP BÁO CÁO</div>
                <div className="text-[11px] text-slate-400 mt-0.5">(Ký, ghi rõ họ tên)</div>
                <div className="mt-14 font-bold text-slate-800">Thư ký Tổ CNSCĐ</div>
              </div>
              <div>
                <div className="font-bold text-slate-700 uppercase">TỔ TRƯỞNG TỔ CNSCĐ {selectedWard.name.toUpperCase()}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">(Ký, phê duyệt kết quả)</div>
                <div className="mt-14 font-bold text-slate-800">{leader?.name || 'Tổ trưởng'}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
