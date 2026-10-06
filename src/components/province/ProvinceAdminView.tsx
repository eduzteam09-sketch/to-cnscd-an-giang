import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  Award,
  BarChart3,
  Bell,
  Building,
  Building2,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Cloud,
  Download,
  Edit,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  Globe,
  Info,
  Layers,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Printer,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  User,
  UserCheck,
  UserCog,
  UserMinus,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import { appStorage } from '../../services/storage';
import { UserAccount, UserRole, WardInfo } from '../../types';
import { Pagination } from '../common/Pagination';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface ProvinceAdminViewProps {
  onSwitchToWardManagement: (wardId?: string) => void;
  onLogout: () => void;
}

export const ProvinceAdminView: React.FC<ProvinceAdminViewProps> = ({
  onSwitchToWardManagement,
  onLogout
}) => {
  // Mặc định trang Báo cáo nằm ở đầu tiên theo yêu cầu người dùng
  const [activeTab, setActiveTab] = useState<'REPORTS' | 'WARDS' | 'ACCOUNTS'>('REPORTS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Notifications popup
  const [showNotifications, setShowNotifications] = useState(false);

  // Pagination states
  const [wardPage, setWardPage] = useState(1);
  const [accountPage, setAccountPage] = useState(1);
  const [reportPage, setReportPage] = useState(1);
  const pageSize = 15;

  // Filter states for Reports & Accounts
  const [reportUnitFilter, setReportUnitFilter] = useState<'ALL' | 'PHUONG' | 'XA' | 'DAC_KHU'>('ALL');
  const [reportStatusFilter, setReportStatusFilter] = useState<'ALL' | 'ACTIVE' | 'IN_PROGRESS' | 'NEEDS_SUPPORT' | 'CHUA_TRIEN_KHAI'>('ALL');
  const [reportSortBy, setReportSortBy] = useState<'NAME' | 'COMPLETION_RATE' | 'TASKS'>('COMPLETION_RATE');

  const [accountRoleFilter, setAccountRoleFilter] = useState<string>('ALL');
  const [accountStatusFilter, setAccountStatusFilter] = useState<string>('ALL');
  const [accountSearch, setAccountSearch] = useState<string>('');

  // Change Role Modal
  const [roleModalAccount, setRoleModalAccount] = useState<UserAccount | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<UserRole>('MEMBER');

  // Delete Account Confirmation
  const [accountToDelete, setAccountToDelete] = useState<UserAccount | null>(null);

  // Provincial report print preview modal state
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Feedback message
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const accounts = appStorage.getUserAccounts();
  const allWards = appStorage.getAllWards();
  const currentSelectedWard = appStorage.getSelectedWard();

  const pendingAccounts = accounts.filter(a => a.status === 'PENDING_APPROVAL');
  const approvedAccounts = accounts.filter(a => a.status === 'APPROVED');

  // Cán bộ Cơ sở tính theo số tài khoản của lãnh đạo, tổ trưởng, thành viên đã được phê duyệt
  const approvedStaffCount = accounts.filter(
    a => a.status === 'APPROVED' && (a.role === 'LEADER' || a.role === 'MEMBER' || a.role === 'OFFICER')
  ).length;

  const totalProvincialTasks = allWards.reduce((acc, w) => acc + w.totalTasks, 0);
  const totalProvincialCompleted = allWards.reduce((acc, w) => acc + w.completedTasks, 0);
  const totalProvincialRequests = allWards.reduce((acc, w) => acc + w.activeRequests, 0);

  const activeWardsCount = allWards.filter(w => w.status !== 'CHUA_TRIEN_KHAI').length; // 15
  const phuongCount = allWards.filter(w => w.unitType === 'PHUONG').length; // 14
  const xaCount = allWards.filter(w => w.unitType === 'XA').length; // 85
  const dacKhuCount = allWards.filter(w => w.unitType === 'DAC_KHU').length; // 3

  const overallCompletionRate = totalProvincialTasks > 0
    ? Math.round((totalProvincialCompleted / totalProvincialTasks) * 100)
    : 0;

  const handleApprove = (accountId: string, role?: UserRole) => {
    const res = appStorage.approveAccount(accountId, role);
    if (res && res.success) {
      setActionSuccessMsg('Đã phê duyệt và cấp quyền thành công cho tài khoản!');
      setRefreshKey(prev => prev + 1);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    }
  };

  const handleReject = (accountId: string) => {
    const reason = prompt('Nhập lý do từ chối cấp quyền:') || 'Thông tin chưa đầy đủ hoặc không thuộc địa bàn';
    const res = appStorage.rejectAccount(accountId, reason);
    if (res && res.success) {
      setActionSuccessMsg('Đã từ chối cấp quyền tài khoản.');
      setRefreshKey(prev => prev + 1);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    }
  };

  const handleOpenRoleModal = (acc: UserAccount) => {
    setRoleModalAccount(acc);
    setSelectedNewRole(acc.role);
  };

  const handleSaveNewRole = () => {
    if (!roleModalAccount) return;
    const res = appStorage.updateAccountRole(roleModalAccount.id, selectedNewRole);
    if (res.success) {
      setActionSuccessMsg(res.message);
      setRoleModalAccount(null);
      setRefreshKey(prev => prev + 1);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } else {
      alert(res.message);
    }
  };

  const handleConfirmDeleteAccount = () => {
    if (!accountToDelete) return;
    const res = appStorage.deleteAccount(accountToDelete.id);
    if (res.success) {
      setActionSuccessMsg(res.message);
      setAccountToDelete(null);
      setRefreshKey(prev => prev + 1);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } else {
      alert(res.message);
    }
  };

  const handleSelectWardToManage = (ward: WardInfo) => {
    appStorage.setSelectedWardId(ward.id);
    onSwitchToWardManagement(ward.id);
  };

  // Filtered Wards for WARDS tab
  const filteredWards = useMemo(() => {
    if (!searchQuery.trim()) return allWards;
    const q = searchQuery.toLowerCase().trim();
    return allWards.filter(w => w.name.toLowerCase().includes(q) || w.unitType.toLowerCase().includes(q));
  }, [allWards, searchQuery]);

  // Filtered & Sorted Wards for REPORTS tab (Đã bỏ cột và sắp xếp theo số Tổ CNSCĐ)
  const reportWards = useMemo(() => {
    let list = [...allWards];

    if (reportUnitFilter !== 'ALL') {
      list = list.filter(w => w.unitType === reportUnitFilter);
    }

    if (reportStatusFilter !== 'ALL') {
      list = list.filter(w => w.status === reportStatusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(w => w.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (reportSortBy === 'COMPLETION_RATE') {
        const rateA = a.totalTasks > 0 ? (a.completedTasks / a.totalTasks) : 0;
        const rateB = b.totalTasks > 0 ? (b.completedTasks / b.totalTasks) : 0;
        return rateB - rateA;
      }
      if (reportSortBy === 'TASKS') {
        return b.totalTasks - a.totalTasks;
      }
      return a.name.localeCompare(b.name, 'vi');
    });

    return list;
  }, [allWards, reportUnitFilter, reportStatusFilter, reportSortBy, searchQuery]);

  // Filtered Accounts for ACCOUNTS tab
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      if (accountRoleFilter !== 'ALL' && acc.role !== accountRoleFilter) return false;
      if (accountStatusFilter !== 'ALL' && acc.status !== accountStatusFilter) return false;
      if (accountSearch.trim()) {
        const q = accountSearch.toLowerCase().trim();
        const match =
          acc.fullName.toLowerCase().includes(q) ||
          acc.email.toLowerCase().includes(q) ||
          acc.phone.includes(q) ||
          acc.wardName.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [accounts, accountRoleFilter, accountStatusFilter, accountSearch]);

  const handleExportCSV = () => {
    const headers = ['Mã Đơn Vị', 'Tên Phường/Xã/Đặc Khu', 'Loại Đơn Vị', 'Trạng Thái', 'Cán Bộ Phê Duyệt', 'Tổng Nhiệm Vụ', 'Đã Hoàn Thành', 'Tỉ Lệ (%)', 'Yêu Cầu Dân'];
    const rows = allWards.map(w => {
      const staffInWard = accounts.filter(a => a.wardId === w.id && a.status === 'APPROVED').length;
      return [
        w.id,
        w.name,
        w.unitType === 'PHUONG' ? 'Phường' : w.unitType === 'DAC_KHU' ? 'Đặc khu' : 'Xã',
        w.status,
        staffInWard,
        w.totalTasks,
        w.completedTasks,
        w.totalTasks > 0 ? `${Math.round((w.completedTasks / w.totalTasks) * 100)}%` : '0%',
        w.activeRequests
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_Cao_Thong_Ke_102_Phuong_Xa_An_Giang_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    setShowPrintModal(true);
  };

  const handleExecutePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.error('Print trigger error:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Banner Tỉnh An Giang - Thiết kế mới bỏ nút vào điều hành cơ sở & bỏ nhãn cấp tỉnh/admin@hotro.vn, thêm nút thông báo và đăng xuất rõ ràng */}
      <header className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white shadow-xl sticky top-0 z-40 border-b border-blue-950/80 no-print">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Branding & Title */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-400/20 backdrop-blur-md border border-amber-300/40 flex items-center justify-center text-xl shadow-inner shrink-0">
                👑
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base md:text-lg font-black tracking-tight leading-tight truncate">
                  TRANG QUẢN LÝ TỔNG TỈNH AN GIANG (102 PHƯỜNG / XÃ)
                </h1>
                <div className="text-[10px] sm:text-[11px] text-blue-200/90 truncate">
                  Hệ thống Giám sát, Điều hành & Thống kê Chuyển đổi số Toàn tỉnh
                </div>
              </div>
            </div>

            {/* Right: Notification Bell & Account with Clear Logout Button */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors border border-white/10 cursor-pointer"
                  title="Thông báo hệ thống"
                  aria-label="Thông báo"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {pendingAccounts.length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-blue-900 animate-pulse" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <>
                    {/* Lớp phủ mờ nội dung trang để tập trung vào nội dung trong popup */}
                    <div
                      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 transition-opacity"
                      onClick={() => setShowNotifications(false)}
                    />

                    {/* Popup nằm trọn trong màn hình mobile, không bị lệch hoặc che mất */}
                    <div className="fixed sm:absolute inset-x-3 top-16 sm:inset-x-auto sm:right-0 sm:top-full mt-2 sm:w-84 max-w-sm mx-auto sm:mx-0 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2.5 z-50 text-xs text-slate-800 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3.5 pb-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-bold text-slate-900">Thông báo ({pendingAccounts.length})</span>
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                          title="Đóng thông báo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="max-h-[60vh] sm:max-h-60 overflow-y-auto divide-y divide-slate-100">
                        {pendingAccounts.map(p => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setActiveTab('ACCOUNTS');
                              setAccountStatusFilter('PENDING_APPROVAL');
                              setShowNotifications(false);
                            }}
                            className="p-3 hover:bg-amber-50/60 cursor-pointer text-left transition-colors"
                          >
                            <div className="text-amber-800 font-bold flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Chờ duyệt: {p.fullName}</span>
                            </div>
                            <div className="text-slate-500 text-[11px] mt-1">
                              {p.wardName} · Đăng ký {p.requestedRole === 'LEADER' ? 'Tổ trưởng' : p.requestedRole === 'OFFICER' ? 'Lãnh đạo UBND' : 'Thành viên'}
                            </div>
                          </div>
                        ))}

                        {pendingAccounts.length === 0 && (
                          <div className="p-6 text-center text-slate-400">
                            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                            <div>Tất cả tài khoản đã được phê duyệt!</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Account profile card with clear logout button */}
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 p-1 sm:p-1.5 rounded-2xl backdrop-blur-md">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                  👑
                </div>
                <div className="hidden lg:block text-left pr-2 leading-tight">
                  <div className="text-xs font-bold text-white">Quản Trị Viên</div>
                  <div className="text-[10px] text-amber-200">Toàn tỉnh An Giang</div>
                </div>

                {/* Clear prominent logout button */}
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 bg-rose-500/80 hover:bg-rose-600 text-white font-bold px-2.5 sm:px-3 py-1.5 rounded-xl text-xs transition-transform active:scale-95 shadow-xs cursor-pointer"
                  title="Đăng xuất khỏi hệ thống"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Main Tabs: Giao diện tablet & mobile vừa khít màn hình, không bị kéo trượt ngang */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 border-t border-white/10 pt-2 pb-1.5">
          <div className="w-full grid grid-cols-3 gap-1 sm:gap-2">
            {/* Tab 1: Báo cáo & Thống kê 102 Phường/Xã (Mặc định) */}
            <button
              onClick={() => setActiveTab('REPORTS')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 sm:px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                activeTab === 'REPORTS'
                  ? 'bg-white text-blue-900 shadow-md ring-1 ring-blue-200'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
              <span className="hidden md:inline">Báo cáo & Thống kê 102 Phường/Xã</span>
              <span className="hidden sm:inline md:hidden">Thống kê 102 Xã/Phường</span>
              <span className="sm:hidden">Thống kê</span>
            </button>

            {/* Tab 2: Giám sát 102 Phường/Xã */}
            <button
              onClick={() => setActiveTab('WARDS')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 sm:px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                activeTab === 'WARDS'
                  ? 'bg-white text-blue-900 shadow-md ring-1 ring-blue-200'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-blue-300" />
              <span className="hidden md:inline">Giám sát 102 Phường/Xã</span>
              <span className="hidden sm:inline md:hidden">Giám sát 102 Đơn vị</span>
              <span className="sm:hidden">Giám sát</span>
            </button>

            {/* Tab 3: Danh bạ toàn bộ tài khoản */}
            <button
              onClick={() => setActiveTab('ACCOUNTS')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 sm:px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer relative ${
                activeTab === 'ACCOUNTS'
                  ? 'bg-white text-blue-900 shadow-md ring-1 ring-blue-200'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-indigo-300" />
              <span className="hidden md:inline">Danh bạ toàn bộ tài khoản ({accounts.length})</span>
              <span className="hidden sm:inline md:hidden">Danh bạ tài khoản ({accounts.length})</span>
              <span className="sm:hidden">Danh bạ ({accounts.length})</span>
              {pendingAccounts.length > 0 && (
                <span className="bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] ml-0.5 animate-pulse">
                  {pendingAccounts.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
        {/* Success Alert Toast */}
        {actionSuccessMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-medium flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button onClick={() => setActionSuccessMsg(null)}>
              <X className="w-4 h-4 text-emerald-600" />
            </button>
          </div>
        )}

        {/* TAB 1: BÁO CÁO & THỐNG KÊ TỔNG 102 PHƯỜNG/XÃ (ĐẦU TIÊN MẶC ĐỊNH) */}
        {activeTab === 'REPORTS' && (
          <div className="space-y-6">
            {/* Header Action Bar */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <BarChart3 className="w-4 h-4" />
                  <span>Trung Tâm Điều Hành Báo Cáo Chuyển Đổi Số Cấp Xã Toàn Tỉnh</span>
                </div>
                <h2 className="text-lg sm:text-2xl font-black mt-1">
                  BÁO CÁO THỐNG KÊ TỔNG HỢP 102 PHƯỜNG / XÃ / ĐẶC KHU
                </h2>
                <p className="text-xs text-blue-200 mt-1 max-w-2xl leading-relaxed">
                  Tổng hợp số liệu tiến độ thực hiện 6 bước nhiệm vụ số hóa, tiếp nhận và giải quyết phản ánh của người dân trên toàn bộ 102 đơn vị cấp xã tỉnh An Giang.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto justify-end">
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold rounded-xl text-xs flex items-center gap-2 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                  title="Xuất bảng số liệu 102 phường/xã ra file CSV / Excel"
                >
                  <Download className="w-4 h-4 text-amber-300" />
                  <span>Xuất Excel / CSV</span>
                </button>

                <button
                  onClick={handlePrintReport}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                  title="In báo cáo tổng hợp phục vụ chỉ đạo điều hành"
                >
                  <Printer className="w-4 h-4" />
                  <span>In Báo Cáo Cấp Tỉnh</span>
                </button>
              </div>
            </div>

            {/* KPI Cards Strip - Đã bỏ hiển thị số lượng Tổ CNSCĐ, cán bộ cơ sở tính chuẩn theo số tài khoản phê duyệt */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              {/* Card 1: 102 Units */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Tổng Đơn Vị</span>
                  <Building className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">102</div>
                <div className="text-[10px] text-blue-700 font-medium">
                  {phuongCount} Phường · {xaCount} Xã · {dacKhuCount} Đặc khu
                </div>
              </div>

              {/* Card 2: Deployed Wards */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Đã Triển Khai</span>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-700">
                  {activeWardsCount} <span className="text-xs font-normal text-slate-400">/ 102</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  15 đơn vị vận hành mẫu (87 đơn vị reset = 0)
                </div>
              </div>

              {/* Card 3: Cán bộ cơ sở tính theo tài khoản phê duyệt */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Cán Bộ Cơ Sở Đã Duyệt</span>
                  <Users className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-indigo-700">
                  {approvedStaffCount} <span className="text-xs font-normal text-slate-500">cán bộ</span>
                </div>
                <div className="text-[10px] text-indigo-600 font-medium">
                  Lãnh đạo, Tổ trưởng, Thành viên đã cấp quyền
                </div>
              </div>

              {/* Card 4: Tasks Progress */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Công Việc 6 Bước</span>
                  <Activity className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {totalProvincialCompleted} <span className="text-xs font-normal text-slate-400">/ {totalProvincialTasks}</span>
                </div>
                <div className="text-[10px] text-emerald-600 font-bold">
                  {overallCompletionRate}% tỉ lệ hoàn thành toàn tỉnh
                </div>
              </div>
            </div>

            {/* In-depth Analytics & Target Groups Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Box 1: Tiến độ theo 5 nhóm đối tượng chuyển đổi số */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Tiến Độ Theo 5 Nhóm Đối Tượng</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Toàn tỉnh</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>1. Hộ nghèo & gia đình chính sách</span>
                      <strong className="text-blue-700">86%</strong>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '86%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>2. Hộ kinh doanh & buôn bán nhỏ</span>
                      <strong className="text-emerald-700">92%</strong>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '92%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>3. Tiểu thương & chợ truyền thống</span>
                      <strong className="text-amber-700">79%</strong>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: '79%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>4. Doanh nghiệp & HTX cơ sở</span>
                      <strong className="text-indigo-700">88%</strong>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '88%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>5. Cán bộ cơ sở & thanh niên xung kích</span>
                      <strong className="text-purple-700">95%</strong>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '95%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 2: Chỉ số DTI chuyển đổi số cấp xã */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Trụ Cột Chuyển Đổi Số Cấp Xã</span>
                  </h4>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                    DTI An Giang
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-blue-900">Chính quyền số cấp xã</div>
                      <div className="text-[11px] text-slate-500">100% hồ sơ xử lý trực tuyến</div>
                    </div>
                    <span className="text-sm font-black text-blue-700">89.4/100</span>
                  </div>

                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-emerald-900">Kinh tế số & thanh toán QR</div>
                      <div className="text-[11px] text-slate-500">Thương mại điện tử & OCOP</div>
                    </div>
                    <span className="text-sm font-black text-emerald-700">84.2/100</span>
                  </div>

                  <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-purple-900">Xã hội số & Công dân số</div>
                      <div className="text-[11px] text-slate-500">Cài đặt VNeID & Chữ ký số</div>
                    </div>
                    <span className="text-sm font-black text-purple-700">81.7/100</span>
                  </div>

                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-amber-900">An toàn thông tin cơ sở</div>
                      <div className="text-[11px] text-slate-500">Bảo mật dữ liệu dân cư</div>
                    </div>
                    <span className="text-sm font-black text-amber-700">92.0/100</span>
                  </div>
                </div>
              </div>

              {/* Box 3: Top Đơn Vị Đi Đầu Tỉnh */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Top Đơn Vị Xuất Sắc Nhất Tỉnh</span>
                  </h4>
                  <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-bold">
                    Tiến độ hoàn thành
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {allWards.slice(0, 5).map((w, idx) => {
                    const rate = w.totalTasks > 0 ? Math.round((w.completedTasks / w.totalTasks) * 100) : 0;
                    return (
                      <div
                        key={w.id}
                        onClick={() => handleSelectWardToManage(w)}
                        className="p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${
                            idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <div className="truncate">
                            <span className="font-bold text-slate-800">{w.name}</span>
                            <span className="text-[10px] text-slate-400 ml-1.5">
                              ({w.unitType === 'PHUONG' ? 'Phường' : 'Xã'})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-black text-emerald-700">{rate}%</span>
                          <span className="text-[10px] text-slate-400">({w.completedTasks}/{w.totalTasks})</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Comprehensive Table of 102 Units with Filters - Đã bỏ hoàn toàn cột Tổ CNSCĐ */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Bảng Thống Kê Chi Tiết Toàn Bộ 102 Phường / Xã / Đặc Khu</span>
                    <span className="bg-blue-100 text-blue-900 text-xs px-2.5 py-0.5 rounded-full font-bold">
                      {reportWards.length} đơn vị
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    15 đơn vị đầu tiên vận hành mẫu đầy đủ dữ liệu, các đơn vị còn lại đã reset về 0 chờ kích hoạt
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <select
                    value={reportUnitFilter}
                    onChange={e => {
                      setReportUnitFilter(e.target.value as any);
                      setReportPage(1);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-700 text-xs"
                  >
                    <option value="ALL">Tất cả loại hình (102)</option>
                    <option value="PHUONG">14 Phường</option>
                    <option value="XA">85 Xã</option>
                    <option value="DAC_KHU">3 Đặc khu</option>
                  </select>

                  <select
                    value={reportStatusFilter}
                    onChange={e => {
                      setReportStatusFilter(e.target.value as any);
                      setReportPage(1);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-700 text-xs"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="ACTIVE">Đang hoạt động (15)</option>
                    <option value="CHUA_TRIEN_KHAI">Chưa triển khai (87)</option>
                    <option value="NEEDS_SUPPORT">Cần hỗ trợ</option>
                  </select>

                  <select
                    value={reportSortBy}
                    onChange={e => setReportSortBy(e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-700 text-xs"
                  >
                    <option value="COMPLETION_RATE">Sắp xếp: Tỉ lệ hoàn thành cao nhất</option>
                    <option value="TASKS">Sắp xếp: Số nhiệm vụ nhiều nhất</option>
                    <option value="NAME">Sắp xếp: Tên A - Z</option>
                  </select>
                </div>
              </div>

              {/* Mobile Swipe Hint */}
              <div className="px-4 py-2.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-xs text-blue-800 font-semibold md:hidden">
                <span className="flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Bảng 8 cột chi tiết: <strong>Vuốt ngang</strong> để xem đủ thông tin</span>
                </span>
                <span className="text-[10px] bg-blue-200/60 text-blue-900 px-2 py-0.5 rounded-full font-bold">
                  {reportWards.length} đơn vị
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto touch-scroll">
                <table className="w-full text-left text-xs min-w-[880px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-3.5 py-3 w-12 text-center whitespace-nowrap">STT</th>
                      <th className="px-4 py-3 min-w-[200px] whitespace-nowrap">Tên Đơn Vị Hành Chính</th>
                      <th className="px-3.5 py-3 whitespace-nowrap">Phân Loại</th>
                      <th className="px-3.5 py-3 whitespace-nowrap">Trạng Thái</th>
                      <th className="px-3.5 py-3 text-center whitespace-nowrap">Cán Bộ Phê Duyệt</th>
                      <th className="px-4 py-3 min-w-[170px] whitespace-nowrap">Tiến Độ Nhiệm Vụ 6 Bước</th>
                      <th className="px-3.5 py-3 text-center whitespace-nowrap">Yêu Cầu Dân</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap min-w-[120px]">Điều Hành</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportWards
                      .slice((reportPage - 1) * pageSize, reportPage * pageSize)
                      .map((w, idx) => {
                        const globalIndex = (reportPage - 1) * pageSize + idx + 1;
                        const percent = w.totalTasks > 0 ? Math.round((w.completedTasks / w.totalTasks) * 100) : 0;
                        const isCurrentActive = currentSelectedWard.id === w.id;
                        const approvedStaff = accounts.filter(a => a.wardId === w.id && a.status === 'APPROVED').length;

                        return (
                          <tr key={w.id} className="hover:bg-blue-50/40 transition-colors">
                            <td className="px-3.5 py-3 text-slate-400 font-mono text-[11px] text-center whitespace-nowrap">
                              {globalIndex}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="font-extrabold text-slate-900 text-sm whitespace-nowrap">
                                {w.name}
                              </div>
                              <div className="text-[10px] text-slate-400 whitespace-nowrap">
                                Mã: {w.id} · Tỉnh An Giang
                              </div>
                            </td>
                            <td className="px-3.5 py-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap inline-block ${
                                  w.unitType === 'PHUONG'
                                    ? 'bg-blue-100 text-blue-800'
                                    : w.unitType === 'DAC_KHU'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {w.unitType === 'PHUONG' ? 'Phường' : w.unitType === 'DAC_KHU' ? 'Đặc khu' : 'Xã'}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 whitespace-nowrap">
                              {w.status === 'CHUA_TRIEN_KHAI' ? (
                                <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap inline-block">
                                  Chưa triển khai (0)
                                </span>
                              ) : w.status === 'NEEDS_SUPPORT' ? (
                                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap inline-block">
                                  Cần hỗ trợ
                                </span>
                              ) : w.status === 'IN_PROGRESS' ? (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap inline-block">
                                  Đang triển khai
                                </span>
                              ) : (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap inline-block">
                                  Đang vận hành tốt
                                </span>
                              )}
                            </td>
                            <td className="px-3.5 py-3 text-center font-bold text-slate-800 whitespace-nowrap">
                              {approvedStaff > 0 ? (
                                <span className="bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded font-black whitespace-nowrap inline-block">
                                  {approvedStaff} cán bộ
                                </span>
                              ) : (
                                <span className="text-slate-400">0</span>
                              )}
                            </td>
                            <td className="px-4 py-3 min-w-[170px] whitespace-nowrap">
                              {w.totalTasks > 0 ? (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px]">
                                    <span className="font-bold text-slate-700">{percent}%</span>
                                    <span className="text-slate-400">({w.completedTasks}/{w.totalTasks})</span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-emerald-500 h-1.5 rounded-full"
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-300 text-[11px] italic">Chưa phát sinh (0)</span>
                              )}
                            </td>
                            <td className="px-3.5 py-3 text-center whitespace-nowrap">
                              {w.activeRequests > 0 ? (
                                <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded whitespace-nowrap inline-block">
                                  {w.activeRequests}
                                </span>
                              ) : (
                                <span className="text-slate-400">0</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap min-w-[120px]">
                              <button
                                onClick={() => handleSelectWardToManage(w)}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all inline-flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                                  isCurrentActive
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700'
                                }`}
                              >
                                <span>{isCurrentActive ? 'Đang mở' : 'Vào điều hành'}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {reportWards.length > 0 && (
                <div className="p-4 border-t border-slate-200 bg-slate-50/50">
                  <Pagination
                    currentPage={reportPage}
                    totalItems={reportWards.length}
                    pageSize={pageSize}
                    onPageChange={setReportPage}
                    itemName="đơn vị"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: GIÁM SÁT 102 PHƯỜNG/XÃ TỈNH AN GIANG */}
        {activeTab === 'WARDS' && (
          <div className="space-y-6">
            {/* Provincial Metric Bar */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-xs text-slate-500 font-semibold">Tổng Phường / Xã / Đặc Khu</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">102</div>
                <div className="text-[10px] text-blue-700 font-bold">14 Phường · 85 Xã · 3 Đặc khu</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold">Đã Triển Khai</div>
                <div className="text-xl sm:text-2xl font-black text-blue-600 mt-1">{activeWardsCount} / 102</div>
                <div className="text-[10px] text-slate-500">15 đơn vị có dữ liệu mẫu</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold">Tổng Cán Bộ Cơ Sở Đã Duyệt</div>
                <div className="text-xl sm:text-2xl font-black text-indigo-600 mt-1">{approvedStaffCount}</div>
                <div className="text-[10px] text-slate-500">Lực lượng nòng cốt</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold">Công Việc CĐS Đã Làm</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                  {totalProvincialCompleted} / {totalProvincialTasks}
                </div>
                <div className="text-[10px] text-emerald-600 font-bold">
                  {overallCompletionRate}% hoàn thành
                </div>
              </div>
            </div>

            {/* Search Controls */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-slate-600 font-semibold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>
                  Danh sách <strong className="text-slate-900 font-black">{filteredWards.length}</strong> / {allWards.length} đơn vị hành chính Tỉnh An Giang
                </span>
              </div>

              <div className="relative flex-1 max-w-md w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setWardPage(1);
                  }}
                  placeholder="Tìm kiếm nhanh tên Xã, Phường, Đặc khu trong 102 đơn vị..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Wards Grid (102 units) - Đã bỏ hiển thị Tổ CNSCĐ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWards
                .slice((wardPage - 1) * pageSize, wardPage * pageSize)
                .map(ward => {
                  const isCurrentActive = currentSelectedWard.id === ward.id;
                  const percent = ward.totalTasks > 0 ? Math.round((ward.completedTasks / ward.totalTasks) * 100) : 0;
                  const approvedStaff = accounts.filter(a => a.wardId === ward.id && a.status === 'APPROVED').length;

                  return (
                    <div
                      key={ward.id}
                      className={`bg-white rounded-2xl border p-4 shadow-xs transition-all hover:shadow-md flex flex-col justify-between gap-3 ${
                        isCurrentActive ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30' : 'border-slate-200'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  ward.unitType === 'PHUONG'
                                    ? 'bg-blue-100 text-blue-800'
                                    : ward.unitType === 'DAC_KHU'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {ward.unitType === 'PHUONG' ? 'Phường' : ward.unitType === 'DAC_KHU' ? 'Đặc khu' : 'Xã'}
                              </span>
                              {ward.status === 'CHUA_TRIEN_KHAI' && (
                                <span className="bg-slate-100 text-slate-500 text-[10px] font-semibold px-2 py-0.5 rounded">
                                  Chưa kích hoạt
                                </span>
                              )}
                            </div>
                            <h4 className="font-extrabold text-slate-900 text-base mt-1">
                              {ward.name}
                            </h4>
                            <div className="text-[11px] text-slate-500 font-semibold">
                              Tỉnh An Giang
                            </div>
                          </div>

                          <div className="text-right">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                ward.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ward.status === 'IN_PROGRESS'
                                  ? 'bg-amber-100 text-amber-800'
                                  : ward.status === 'NEEDS_SUPPORT'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {ward.status === 'ACTIVE'
                                ? 'Đang hoạt động'
                                : ward.status === 'IN_PROGRESS'
                                ? 'Đang tiến hành'
                                : ward.status === 'NEEDS_SUPPORT'
                                ? 'Cần hỗ trợ'
                                : 'Chưa triển khai'}
                            </span>
                          </div>
                        </div>

                        {/* Stats snippet: 2 cột gọn gàng (Đã bỏ Tổ CNSCĐ) */}
                        <div className="grid grid-cols-2 gap-2 text-center py-2.5 my-2 border-y border-slate-100 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Cán bộ phê duyệt</span>
                            <strong className="text-slate-800 font-bold">{approvedStaff} cán bộ</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Hoàn thành</span>
                            <strong className="text-emerald-700 font-bold">{ward.completedTasks} nhiệm vụ</strong>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>Tiến độ CĐS:</span>
                            <strong className="text-slate-700">{percent}%</strong>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action button */}
                      <button
                        onClick={() => handleSelectWardToManage(ward)}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                          isCurrentActive
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{isCurrentActive ? 'Mở Trang Quản Lý Xã/Phường Này' : 'Chuyển Vào Quản Lý Xã/Phường Này'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
            </div>

            {filteredWards.length > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <Pagination
                  currentPage={wardPage}
                  totalItems={filteredWards.length}
                  pageSize={pageSize}
                  onPageChange={setWardPage}
                  itemName="xã / phường"
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DANH BẠ TOÀN BỘ TÀI KHOẢN (ĐẸP HƠN, THÊM CỘT THỜI GIAN PHÊ DUYỆT, BỎ MẬT KHẨU TẠM, ĐỔI QUYỀN/XÓA, KHÔNG RỚT DÒNG THAO TÁC) */}
        {activeTab === 'ACCOUNTS' && (
          <div className="space-y-5">
            {/* Nhắc nhở số tài khoản chờ phê duyệt */}
            {pendingAccounts.length > 0 && (
              <div className="p-4 bg-amber-50/90 border-2 border-amber-300 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg shrink-0 shadow-inner">
                    <Clock className="w-5 h-5 text-slate-950" />
                  </div>
                  <div>
                    <strong className="text-amber-950 font-extrabold text-sm block">
                      Có {pendingAccounts.length} hồ sơ đăng ký tài khoản đang chờ phê duyệt cấp quyền!
                    </strong>
                    <span className="text-amber-800 text-xs">
                      Cán bộ cơ sở tại các phường/xã đã đăng ký và đang đợi Quản trị viên kích hoạt tài khoản.
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setAccountStatusFilter('PENDING_APPROVAL')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black rounded-xl text-xs shadow-sm transition-transform active:scale-95 shrink-0 cursor-pointer whitespace-nowrap"
                >
                  Lọc xem tài khoản chờ duyệt ({pendingAccounts.length})
                </button>
              </div>
            )}

            {/* Table Container */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Danh Sách Toàn Bộ Tài Khoản Trên Toàn Tỉnh An Giang</span>
                    <span className="bg-blue-100 text-blue-900 text-xs px-2.5 py-0.5 rounded-full font-bold">
                      {filteredAccounts.length} tài khoản
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quản trị viên toàn quyền phê duyệt, thay đổi vai trò hoặc xóa tài khoản cán bộ trên toàn tỉnh
                  </p>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="relative min-w-[220px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Tìm tên, email, SĐT, đơn vị..."
                      value={accountSearch}
                      onChange={e => {
                        setAccountSearch(e.target.value);
                        setAccountPage(1);
                      }}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                    />
                  </div>

                  <select
                    value={accountRoleFilter}
                    onChange={e => {
                      setAccountRoleFilter(e.target.value);
                      setAccountPage(1);
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-700 text-xs"
                  >
                    <option value="ALL">Tất cả vai trò</option>
                    <option value="ADMIN">Super Admin</option>
                    <option value="LEADER">Tổ trưởng Tổ CNSCĐ</option>
                    <option value="MEMBER">Thành viên Tổ CNSCĐ</option>
                    <option value="OFFICER">Lãnh đạo UBND / Cán bộ</option>
                  </select>

                  <select
                    value={accountStatusFilter}
                    onChange={e => {
                      setAccountStatusFilter(e.target.value);
                      setAccountPage(1);
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-700 text-xs"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="APPROVED">Đã cấp quyền (APPROVED)</option>
                    <option value="PENDING_APPROVAL">Chờ phê duyệt ({pendingAccounts.length})</option>
                    <option value="REJECTED">Đã từ chối</option>
                  </select>
                </div>
              </div>

              {/* Mobile Swipe Hint */}
              <div className="px-4 py-2.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-xs text-blue-800 font-semibold md:hidden">
                <span className="flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Bảng tài khoản toàn tỉnh: <strong>Vuốt ngang</strong> để xem chi tiết đầy đủ</span>
                </span>
                <span className="text-[10px] bg-blue-200/60 text-blue-900 px-2 py-0.5 rounded-full font-bold">
                  {filteredAccounts.length} tài khoản
                </span>
              </div>

              <div className="overflow-x-auto touch-scroll">
                <table className="w-full text-left text-xs min-w-[980px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3 whitespace-nowrap min-w-[190px]">Họ và tên</th>
                      <th className="px-4 py-3 whitespace-nowrap min-w-[200px]">Email & SĐT</th>
                      <th className="px-4 py-3 whitespace-nowrap min-w-[190px]">Đơn vị công tác (Phường/Xã)</th>
                      <th className="px-4 py-3 whitespace-nowrap min-w-[130px]">Vai trò hệ thống</th>
                      <th className="px-4 py-3 whitespace-nowrap min-w-[120px]">Trạng thái</th>
                      <th className="px-4 py-3 whitespace-nowrap min-w-[140px]">Thời gian phê duyệt</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap min-w-[200px]">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAccounts
                      .slice((accountPage - 1) * pageSize, accountPage * pageSize)
                      .map(acc => {
                        const isSuperRoot = acc.email === 'admin@hotro.vn';

                        return (
                          <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Họ tên */}
                            <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                  acc.role === 'ADMIN' ? 'bg-amber-400 text-slate-950' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {acc.role === 'ADMIN' ? '👑' : acc.fullName.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="font-extrabold whitespace-nowrap">{acc.fullName}</span>
                              </div>
                            </td>

                            {/* Email & SĐT */}
                            <td className="px-4 py-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                              <div className="text-blue-700 font-medium whitespace-nowrap">{acc.email}</div>
                              <div className="text-slate-500 font-sans whitespace-nowrap">{acc.phone}</div>
                            </td>

                            {/* Đơn vị công tác */}
                            <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                              <span className="font-bold text-blue-900 block whitespace-nowrap">{acc.wardName}</span>
                              <span className="text-slate-400 block text-[10px] whitespace-nowrap">Tỉnh An Giang</span>
                            </td>

                            {/* Vai trò */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-0.5 rounded font-bold text-[11px] inline-block whitespace-nowrap ${
                                  acc.role === 'ADMIN'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                    : acc.role === 'LEADER'
                                    ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                    : acc.role === 'OFFICER'
                                    ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                                }`}
                              >
                                {acc.role === 'ADMIN' ? 'Super Admin' : acc.role === 'LEADER' ? 'Tổ trưởng' : acc.role === 'OFFICER' ? 'Lãnh đạo UBND' : 'Thành viên'}
                              </span>
                            </td>

                            {/* Trạng thái */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              {acc.status === 'APPROVED' && (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit whitespace-nowrap">
                                  <Check className="w-3 h-3" />
                                  <span>Đã cấp quyền</span>
                                </span>
                              )}
                              {acc.status === 'PENDING_APPROVAL' && (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit whitespace-nowrap">
                                  <Clock className="w-3 h-3" />
                                  <span>Chờ duyệt</span>
                                </span>
                              )}
                              {acc.status === 'REJECTED' && (
                                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit whitespace-nowrap">
                                  <X className="w-3 h-3" />
                                  <span>Từ chối</span>
                                </span>
                              )}
                            </td>

                            {/* Cột thời gian phê duyệt */}
                            <td className="px-4 py-3 text-slate-600 text-[11px] whitespace-nowrap">
                              {acc.approvedAt ? (
                                <div className="whitespace-nowrap">
                                  <span className="font-semibold text-slate-800 whitespace-nowrap">
                                    {new Date(acc.approvedAt).toLocaleDateString('vi-VN')}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block whitespace-nowrap">
                                    {new Date(acc.approvedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-amber-700 italic font-medium whitespace-nowrap">Chưa phê duyệt</span>
                              )}
                            </td>

                            {/* Cột thao tác: Chữ không bị rớt dòng (whitespace-nowrap) */}
                            <td className="px-4 py-3 text-right whitespace-nowrap min-w-[200px]">
                              {acc.status === 'PENDING_APPROVAL' ? (
                                <div className="inline-flex items-center gap-1.5 justify-end whitespace-nowrap">
                                  <button
                                    onClick={() => handleReject(acc.id)}
                                    className="px-2.5 py-1 text-slate-600 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 rounded-lg font-bold text-xs border border-slate-200 cursor-pointer whitespace-nowrap"
                                  >
                                    Từ chối
                                  </button>
                                  <button
                                    onClick={() => handleApprove(acc.id, acc.requestedRole)}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-2xs cursor-pointer whitespace-nowrap"
                                  >
                                    Phê duyệt
                                  </button>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 justify-end whitespace-nowrap">
                                  {!isSuperRoot && (
                                    <>
                                      <button
                                        onClick={() => handleOpenRoleModal(acc)}
                                        className="px-2.5 py-1 text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg font-bold text-xs border border-blue-200 cursor-pointer whitespace-nowrap inline-flex items-center gap-1"
                                        title="Đổi quyền hạn / vai trò của tài khoản"
                                      >
                                        <UserCog className="w-3.5 h-3.5" />
                                        <span>Đổi quyền</span>
                                      </button>

                                      <button
                                        onClick={() => setAccountToDelete(acc)}
                                        className="px-2.5 py-1 text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 rounded-lg font-bold text-xs border border-rose-200 cursor-pointer whitespace-nowrap inline-flex items-center gap-1"
                                        title="Xóa tài khoản này khỏi hệ thống"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Xóa</span>
                                      </button>
                                    </>
                                  )}
                                  {isSuperRoot && (
                                    <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200 whitespace-nowrap">
                                      Tối cao
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {filteredAccounts.length > 0 && (
                <div className="p-4 border-t border-slate-200 bg-slate-50/50">
                  <Pagination
                    currentPage={accountPage}
                    totalItems={filteredAccounts.length}
                    pageSize={pageSize}
                    onPageChange={setAccountPage}
                    itemName="tài khoản"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal Đổi Quyền Tài Khoản */}
      {roleModalAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <UserCog className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Đổi Quyền Tài Khoản</h3>
                  <p className="text-xs text-slate-500">{roleModalAccount.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setRoleModalAccount(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div>Email: <strong className="text-slate-800 font-mono">{roleModalAccount.email}</strong></div>
                <div>Số điện thoại: <strong className="text-slate-800">{roleModalAccount.phone}</strong></div>
                <div>Địa bàn công tác: <strong className="text-blue-900">{roleModalAccount.wardName}</strong></div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                  Chọn vai trò mới:
                </label>
                <select
                  value={selectedNewRole}
                  onChange={e => setSelectedNewRole(e.target.value as UserRole)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 text-xs bg-slate-50 focus:bg-white"
                >
                  <option value="LEADER">Tổ trưởng Tổ CNSCĐ (Toàn quyền quản trị cấp xã)</option>
                  <option value="MEMBER">Thành viên Tổ CNSCĐ (Thực hiện nhiệm vụ & hỗ trợ dân)</option>
                  <option value="OFFICER">Lãnh đạo UBND / Cán bộ phường/xã (Giám sát & kiểm tra)</option>
                  <option value="MANAGER">Lãnh đạo ban ngành</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRoleModalAccount(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveNewRole}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog Xóa Tài Khoản */}
      {accountToDelete && (
        <ConfirmDialog
          isOpen={true}
          title="Xác nhận xóa tài khoản"
          message={`Bạn có chắc chắn muốn xóa tài khoản của cán bộ "${accountToDelete.fullName}" (${accountToDelete.email}) thuộc ${accountToDelete.wardName}? Hành động này sẽ gỡ bỏ tài khoản và quyền truy cập khỏi hệ thống.`}
          confirmLabel="Xóa Tài Khoản"
          cancelLabel="Hủy"
          onConfirm={handleConfirmDeleteAccount}
          onCancel={() => setAccountToDelete(null)}
          isDestructive={true}
        />
      )}

      {/* PROVINCIAL REPORT PRINT / EXPORT PDF PREVIEW MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
          {/* Action Bar (hidden on print) */}
          <div className="w-full max-w-4xl bg-slate-900 text-white p-4 rounded-2xl mb-4 shadow-2xl flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base">
                  Bản In Báo Cáo Cấp Tỉnh (102 Phường / Xã)
                </h4>
                <p className="text-[11px] text-slate-300">
                  Tổng hợp số liệu chỉ đạo & điều hành chuyển đổi số toàn tỉnh An Giang
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Xuất Excel/CSV</span>
              </button>

              <button
                onClick={handleExecutePrint}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>In / Lưu PDF (Print)</span>
              </button>

              <button
                onClick={() => setShowPrintModal(false)}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                ✕ Đóng
              </button>
            </div>
          </div>

          {/* Technical / Browser Notice */}
          <div className="w-full max-w-4xl bg-blue-50 border border-blue-200 p-3.5 rounded-2xl mb-4 text-xs text-blue-900 flex items-start gap-2.5 no-print">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div>
                <strong>Hướng dẫn in / lưu file PDF:</strong> Tại hộp thoại in vừa xuất hiện, ở mục <strong>Máy in (Destination)</strong> hãy chọn <strong>"Lưu dưới dạng PDF" (Save as PDF)</strong> để tải file báo cáo chuẩn A4 về máy.
              </div>
              <div className="text-[11px] text-blue-700">
                💡 <em>Ghi chú:</em> Khi chạy trong cửa sổ xem trước (iframe của AI Studio), một số trình duyệt có thể hạn chế mở hộp thoại in trực tiếp từ iframe. Khi ứng dụng được <strong>Deploy lên Vercel</strong> hoặc mở trên trang web độc lập, nút <strong>In / Lưu PDF</strong> sẽ mở hộp thoại in của trình duyệt 100% bình thường. Bạn cũng có thể dùng nút <strong>Xuất Excel/CSV</strong> để tải ngay bảng dữ liệu.
              </div>
            </div>
          </div>

          {/* Document Sheet (Styled for Vietnamese administrative standard A4) */}
          <div className="w-full max-w-4xl bg-white p-6 sm:p-10 shadow-xl rounded-2xl border border-slate-200 text-slate-900 font-sans print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none">
            {/* Official Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex justify-between items-start text-xs font-bold leading-tight">
                <div className="text-center">
                  <div className="uppercase">ỦY BAN NHÂN DÂN TỈNH AN GIANG</div>
                  <div className="font-extrabold uppercase text-blue-900 mt-0.5">BAN CHỈ ĐẠO CHUYỂN ĐỔI SỐ</div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">Số: {new Date().getFullYear()}/BC-BCĐCĐS</div>
                </div>
                <div className="text-center">
                  <div className="uppercase font-black">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div className="font-extrabold underline underline-offset-4 mt-0.5">Độc lập - Tự do - Hạnh phúc</div>
                  <div className="text-[10px] text-slate-500 italic mt-1">
                    An Giang, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                  </div>
                </div>
              </div>

              <div className="text-center mt-6">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-900">
                  BÁO CÁO TỔNG HỢP TIẾN ĐỘ CHUYỂN ĐỔI SỐ & HOẠT ĐỘNG
                </h2>
                <div className="text-sm font-extrabold text-blue-800 uppercase mt-0.5">
                  TOÀN BỘ 102 PHƯỜNG / XÃ / ĐẶC KHU TỈNH AN GIANG
                </div>
              </div>
            </div>

            {/* Section I: Key Provincial KPIs */}
            <div className="mb-6 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 border-l-4 border-blue-700 pl-2">
                I. CHỈ SỐ TỔNG QUAN CHỈ ĐẠO ĐIỀU HÀNH TOÀN TỈNH
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-slate-500 font-semibold text-[11px]">Tổng đơn vị hành chính:</div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">102</div>
                  <div className="text-[10px] text-slate-500">14 Phường · 85 Xã · 3 Đặc khu</div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="text-blue-800 font-semibold text-[11px]">Đã đưa vào hoạt động:</div>
                  <div className="text-xl font-black text-blue-800 mt-0.5">{activeWardsCount} / 102</div>
                  <div className="text-[10px] text-blue-600">15 đơn vị có dữ liệu mẫu</div>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <div className="text-indigo-800 font-semibold text-[11px]">Cán bộ cơ sở đã duyệt:</div>
                  <div className="text-xl font-black text-indigo-800 mt-0.5">{approvedStaffCount} cán bộ</div>
                  <div className="text-[10px] text-indigo-600">Đã kích hoạt tài khoản</div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="text-emerald-800 font-semibold text-[11px]">Tiến độ 6 bước toàn tỉnh:</div>
                  <div className="text-xl font-black text-emerald-800 mt-0.5">{overallCompletionRate}%</div>
                  <div className="text-[10px] text-emerald-600 font-bold">({totalProvincialCompleted}/{totalProvincialTasks} việc)</div>
                </div>
              </div>
            </div>

            {/* Section II: 3 Khối Thống kê Trọng tâm (Tiến độ theo nhóm, Trụ cột DTI, Top đơn vị xuất sắc) */}
            <div className="mb-6 space-y-3 avoid-break">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 border-l-4 border-blue-700 pl-2">
                II. TIẾN ĐỘ THEO ĐỐI TƯỢNG, TRỤ CỘT DTI & CÁC ĐƠN VỊ DẪN ĐẦU
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Khối 1: Tiến Độ Theo 5 Nhóm Đối Tượng (Toàn tỉnh) */}
                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      <span>Tiến Độ Theo 5 Nhóm Đối Tượng</span>
                    </h4>
                    <span className="text-[10px] text-slate-600 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                      Toàn tỉnh
                    </span>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div>
                      <div className="flex justify-between font-semibold text-slate-700 mb-0.5">
                        <span>1. Hộ nghèo & gia đình chính sách</span>
                        <strong className="text-blue-700">86%</strong>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '86%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold text-slate-700 mb-0.5">
                        <span>2. Hộ kinh doanh & buôn bán nhỏ</span>
                        <strong className="text-emerald-700">92%</strong>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: '92%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold text-slate-700 mb-0.5">
                        <span>3. Tiểu thương & chợ truyền thống</span>
                        <strong className="text-amber-700">79%</strong>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '79%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold text-slate-700 mb-0.5">
                        <span>4. Doanh nghiệp & HTX cơ sở</span>
                        <strong className="text-indigo-700">88%</strong>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '88%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold text-slate-700 mb-0.5">
                        <span>5. Cán bộ cơ sở & thanh niên xung kích</span>
                        <strong className="text-purple-700">95%</strong>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: '95%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Khối 2: Trụ Cột Chuyển Đổi Số Cấp Xã (DTI An Giang) */}
                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Trụ Cột Chuyển Đổi Số Cấp Xã</span>
                    </h4>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded font-bold">
                      DTI An Giang
                    </span>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div className="p-2 bg-blue-50/70 rounded-lg border border-blue-100 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-blue-900">Chính quyền số cấp xã</div>
                        <div className="text-[10px] text-slate-500">100% hồ sơ xử lý trực tuyến</div>
                      </div>
                      <span className="text-xs font-black text-blue-800">89.4/100</span>
                    </div>

                    <div className="p-2 bg-emerald-50/70 rounded-lg border border-emerald-100 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-emerald-900">Kinh tế số & thanh toán QR</div>
                        <div className="text-[10px] text-slate-500">Thương mại điện tử & OCOP</div>
                      </div>
                      <span className="text-xs font-black text-emerald-800">84.2/100</span>
                    </div>

                    <div className="p-2 bg-purple-50/70 rounded-lg border border-purple-100 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-purple-900">Xã hội số & Công dân số</div>
                        <div className="text-[10px] text-slate-500">Cài đặt VNeID & Chữ ký số</div>
                      </div>
                      <span className="text-xs font-black text-purple-800">81.7/100</span>
                    </div>

                    <div className="p-2 bg-amber-50/70 rounded-lg border border-amber-100 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-amber-900">An toàn thông tin cơ sở</div>
                        <div className="text-[10px] text-slate-500">Bảo mật dữ liệu dân cư</div>
                      </div>
                      <span className="text-xs font-black text-amber-800">92.0/100</span>
                    </div>
                  </div>
                </div>

                {/* Khối 3: Top Đơn Vị Xuất Sắc Nhất Tỉnh (Tiến độ hoàn thành) */}
                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>Top Đơn Vị Xuất Sắc Nhất Tỉnh</span>
                    </h4>
                    <span className="text-[10px] text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded font-bold">
                      Tiến độ hoàn thành
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    {allWards.slice(0, 5).map((w, idx) => {
                      const rate = w.totalTasks > 0 ? Math.round((w.completedTasks / w.totalTasks) * 100) : 0;
                      return (
                        <div
                          key={w.id}
                          className="p-1.5 rounded-lg bg-white border border-slate-100 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center font-black text-[9px] shrink-0 ${
                              idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {idx + 1}
                            </span>
                            <span className="font-bold text-slate-800 truncate">{w.name}</span>
                            <span className="text-[9px] text-slate-400">
                              ({w.unitType === 'PHUONG' ? 'Phường' : 'Xã'})
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] shrink-0">
                            <span className="font-extrabold text-emerald-700">{rate}%</span>
                            <span className="text-[9px] text-slate-400">({w.completedTasks}/{w.totalTasks})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Section III: Detail Table */}
            <div className="mb-6 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 border-l-4 border-blue-700 pl-2">
                III. BẢNG THỐNG KÊ CHI TIẾT 102 PHƯỜNG / XÃ / ĐẶC KHU
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                      <th className="border border-slate-300 px-2 py-1.5 text-center w-8">STT</th>
                      <th className="border border-slate-300 px-2.5 py-1.5">Tên Đơn Vị</th>
                      <th className="border border-slate-300 px-2 py-1.5 text-center">Phân loại</th>
                      <th className="border border-slate-300 px-2 py-1.5">Trạng thái</th>
                      <th className="border border-slate-300 px-2 py-1.5 text-center">Cán bộ</th>
                      <th className="border border-slate-300 px-2 py-1.5 text-center">Hoàn thành</th>
                      <th className="border border-slate-300 px-2 py-1.5 text-center">Tỷ lệ</th>
                      <th className="border border-slate-300 px-2 py-1.5 text-center">Yêu cầu dân</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allWards.map((w, idx) => {
                      const percent = w.totalTasks > 0 ? Math.round((w.completedTasks / w.totalTasks) * 100) : 0;
                      const staffInWard = accounts.filter(a => a.wardId === w.id && a.status === 'APPROVED').length;
                      return (
                        <tr key={w.id} className={idx % 2 === 1 ? 'bg-slate-50/60' : ''}>
                          <td className="border border-slate-300 px-2 py-1 text-center font-mono text-[10px] text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-300 px-2.5 py-1 font-bold text-slate-900">
                            {w.name}
                          </td>
                          <td className="border border-slate-300 px-2 py-1 text-center font-medium">
                            {w.unitType === 'PHUONG' ? 'Phường' : w.unitType === 'DAC_KHU' ? 'Đặc khu' : 'Xã'}
                          </td>
                          <td className="border border-slate-300 px-2 py-1">
                            {w.status === 'CHUA_TRIEN_KHAI' ? (
                              <span className="text-slate-400 italic">Chưa triển khai (0)</span>
                            ) : w.status === 'NEEDS_SUPPORT' ? (
                              <span className="text-rose-700 font-semibold">Cần hỗ trợ</span>
                            ) : (
                              <span className="text-emerald-700 font-semibold">Đang vận hành</span>
                            )}
                          </td>
                          <td className="border border-slate-300 px-2 py-1 text-center font-bold">
                            {staffInWard}
                          </td>
                          <td className="border border-slate-300 px-2 py-1 text-center font-mono">
                            {w.completedTasks}/{w.totalTasks}
                          </td>
                          <td className="border border-slate-300 px-2 py-1 text-center font-bold text-emerald-800">
                            {percent}%
                          </td>
                          <td className="border border-slate-300 px-2 py-1 text-center font-bold text-blue-800">
                            {w.activeRequests}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 text-center text-xs mt-10 pt-4 border-t border-slate-200">
              <div>
                <div className="font-bold uppercase text-slate-800">NGƯỜI LẬP BÁO CÁO</div>
                <div className="text-[11px] text-slate-500 italic mt-0.5">(Ký, ghi rõ họ tên)</div>
                <div className="h-16"></div>
                <div className="font-extrabold text-slate-900">Bộ phận Thư ký Tổng hợp</div>
              </div>
              <div>
                <div className="font-bold uppercase text-slate-800">TRƯỞNG BAN CHỈ ĐẠO CĐS TỈNH</div>
                <div className="text-[11px] text-slate-500 italic mt-0.5">(Ký tên, đóng dấu)</div>
                <div className="h-16"></div>
                <div className="font-extrabold text-slate-900">ỦY BAN NHÂN DÂN TỈNH AN GIANG</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
