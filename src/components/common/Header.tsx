import React, { useState } from 'react';
import {
  Bell,
  CheckCircle,
  ChevronDown,
  Clock,
  Compass,
  FileCheck,
  FileSpreadsheet,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Save,
  User,
  Users,
  X
} from 'lucide-react';
import { appStorage } from '../../services/storage';
import { UserRole } from '../../types';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCitizenModal?: () => void;
  onOpenCreateTask?: () => void;
  onRoleChange?: (role: UserRole) => void;
  onLogout?: () => void;
  onOpenProvinceView?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onLogout,
  onOpenProvinceView
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Edit Profile Modal State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const currentUser = appStorage.getCurrentUser();
  const selectedWard = appStorage.getSelectedWard();
  const tasks = appStorage.getTasks();
  const requests = appStorage.getRequests();

  const [editName, setEditName] = useState(currentUser.name);
  const [editPhone, setEditPhone] = useState(currentUser.phone);
  const [editEmail, setEditEmail] = useState(currentUser.email);

  // Notifications calculation
  const overdueTasks = tasks.filter(t => t.status === 'QUA_HAN');
  const pendingRequests = requests.filter(r => r.status === 'CHO_TIEP_NHAN');
  const todayDueTasks = tasks.filter(t => {
    const today = new Date().toISOString().split('T')[0];
    return t.dueDate === today && t.status !== 'HOAN_THANH' && t.status !== 'DONG';
  });

  const totalAlerts = overdueTasks.length + pendingRequests.length;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert('Vui lòng nhập họ và tên!');
      return;
    }

    const updated = {
      ...currentUser,
      name: editName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim()
    };

    appStorage.updateMember(updated);
    setShowEditProfileModal(false);
  };

  // 5 Unified, Logical Modules
  const navItems = [
    {
      id: 'dashboard',
      label: 'Tổng quan',
      icon: LayoutDashboard,
      badge: overdueTasks.length > 0 ? `${overdueTasks.length}` : null,
      badgeColor: 'bg-red-500'
    },
    {
      id: 'tasks',
      label: 'Công việc 6 bước',
      icon: FileCheck,
      badge: todayDueTasks.length > 0 ? `${todayDueTasks.length}` : null,
      badgeColor: 'bg-blue-400'
    },
    {
      id: 'requests',
      label: 'Yêu cầu của dân',
      icon: Inbox,
      badge: pendingRequests.length > 0 ? `${pendingRequests.length}` : null,
      badgeColor: 'bg-amber-400'
    },
    {
      id: 'directory',
      label: 'Hồ sơ & Đội ngũ',
      icon: Users
    },
    {
      id: 'reports',
      label: 'Báo cáo & Lịch sử',
      icon: FileSpreadsheet
    }
  ];

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 text-white shadow-lg border-b border-blue-950 no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 space-y-3">
        {/* DÒNG 1: Tổ CNSCĐ xã .... (Bên trái) + Icon Thông Báo & Tên Tài Khoản (Bên phải) */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Logo & Tên Tổ CNSCĐ xã .... (Không bị rớt dòng từng chữ trên mobile) */}
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none min-w-0 flex-1 mr-1"
            onClick={() => onSelectTab('dashboard')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md font-bold border border-white/20 shrink-0">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base md:text-lg font-black text-white leading-tight tracking-tight truncate">
                  Tổ CNSCĐ {selectedWard.name}
                </h1>
                {(currentUser.role === 'ADMIN' || appStorage.isCurrentUserSuperAdmin()) && (
                  <span className="hidden lg:inline-flex items-center gap-1 bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wider shadow-xs">
                    👑 Quản Trị Viên Tỉnh Giám Sát
                  </span>
                )}
              </div>
              <div className="text-[10px] sm:text-[11px] text-blue-200 truncate">
                {(currentUser.role === 'ADMIN' || appStorage.isCurrentUserSuperAdmin())
                  ? `Đang điều hành với quyền Quản trị viên cấp Tỉnh`
                  : `Hệ thống số hóa & hỗ trợ 5 nhóm đối tượng`}
              </div>
            </div>
          </div>

          {/* Icon thông báo, Tài khoản & Nút Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Nút trở về Quản Lý Toàn Tỉnh cho Super Admin */}
            {onOpenProvinceView && (currentUser.role === 'ADMIN' || appStorage.isCurrentUserSuperAdmin()) && (
              <button
                onClick={onOpenProvinceView}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
                title="Quay lại Trang Quản Lý Tổng Tỉnh An Giang (102 Phường/Xã)"
              >
                <span>👑</span>
                <span className="hidden sm:inline">Về Quản Lý Toàn Tỉnh</span>
              </button>
            )}

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1.5 sm:p-2 rounded-xl text-blue-100 hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 cursor-pointer"
                aria-label="Thông báo"
              >
                <Bell className="w-5 h-5" />
                {totalAlerts > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-blue-900" />
                )}
              </button>

              {showNotifications && (
                <>
                  {/* Backdrop phủ mờ nội dung trang để tập trung vào popup */}
                  <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 transition-opacity"
                    onClick={() => setShowNotifications(false)}
                  />

                  {/* Popup nằm trọn trong màn hình mobile, không bị lệch hoặc che mất */}
                  <div className="fixed sm:absolute inset-x-3 top-16 sm:inset-x-auto sm:right-0 sm:top-full mt-2 sm:w-84 max-w-sm mx-auto sm:mx-0 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2.5 z-50 text-xs text-slate-800 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3.5 pb-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-slate-900">Cần xử lý gấp ({totalAlerts})</span>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                        title="Đóng thông báo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="max-h-[60vh] sm:max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {overdueTasks.map(t => (
                        <div
                          key={t.id}
                          onClick={() => {
                            onSelectTab('tasks');
                            setShowNotifications(false);
                          }}
                          className="p-3 hover:bg-red-50/60 cursor-pointer text-left transition-colors"
                        >
                          <div className="text-red-700 font-bold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Quá hạn: {t.title}</span>
                          </div>
                          <div className="text-slate-500 text-[11px] mt-1">
                            Hạn chót: <strong>{t.dueDate}</strong> · Cán bộ: {t.primaryAssigneeName}
                          </div>
                        </div>
                      ))}

                      {pendingRequests.map(r => (
                        <div
                          key={r.id}
                          onClick={() => {
                            onSelectTab('requests');
                            setShowNotifications(false);
                          }}
                          className="p-3 hover:bg-blue-50/60 cursor-pointer text-left transition-colors"
                        >
                          <div className="text-blue-800 font-bold flex items-center gap-1.5">
                            <Inbox className="w-3.5 h-3.5 text-blue-600" />
                            <span>Yêu cầu mới: {r.fullName}</span>
                          </div>
                          <div className="text-slate-500 text-[11px] mt-1">
                            {r.needCategory} · {r.neighborhood}
                          </div>
                        </div>
                      ))}

                      {totalAlerts === 0 && (
                        <div className="p-6 text-center text-slate-400">
                          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                          <div>Không có thông báo quá hạn nào</div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Tài khoản: Trên mobile hiển thị avatar + icon sổ, trên tablet/desktop hiển thị cả tên */}
            <div className="relative">
              <button
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className={`flex items-center gap-1 sm:gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border text-white text-xs font-bold transition-colors cursor-pointer ${
                  currentUser.role === 'ADMIN'
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/40 text-amber-200'
                    : 'bg-white/10 hover:bg-white/20 border-white/20'
                }`}
                title={currentUser.name}
              >
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs border ${
                  currentUser.role === 'ADMIN'
                    ? 'bg-amber-500 text-slate-950 border-amber-300'
                    : 'bg-blue-600 text-white border-white/30'
                }`}>
                  {currentUser.role === 'ADMIN' ? '👑' : currentUser.name.substring(0, 2).toUpperCase()}
                </div>
                <span className="hidden sm:inline-block font-bold text-xs sm:text-sm text-white max-w-[120px] md:max-w-[180px] truncate">
                  {currentUser.name}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-blue-200 transition-transform ${showAccountMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Menu sổ: Đổi thông tin, Về toàn tỉnh (nếu là Admin) và Đăng xuất */}
              {showAccountMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-50 text-xs text-slate-800 animate-in fade-in zoom-in-95 duration-100">
                  {onOpenProvinceView && (currentUser.role === 'ADMIN' || appStorage.isCurrentUserSuperAdmin()) && (
                    <>
                      <button
                        onClick={() => {
                          setShowAccountMenu(false);
                          onOpenProvinceView();
                        }}
                        className="w-full text-left px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <span className="text-base">👑</span>
                        <span>Về Quản Lý Toàn Tỉnh</span>
                      </button>
                      <div className="border-t border-slate-100 my-1" />
                    </>
                  )}

                  <button
                    onClick={() => {
                      setShowAccountMenu(false);
                      setEditName(currentUser.name);
                      setEditPhone(currentUser.phone);
                      setEditEmail(currentUser.email);
                      setShowEditProfileModal(true);
                    }}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50 text-slate-800 hover:text-blue-700 font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Đổi thông tin cá nhân</span>
                  </button>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={() => {
                      setShowAccountMenu(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-red-600 hover:bg-red-50 font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button - Luôn hiển thị rõ ràng, cố định trên mobile */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-xs font-black transition-all border border-white/30 cursor-pointer shadow-sm shrink-0"
              aria-label="Mở danh sách menu"
            >
              {showMobileMenu ? <X className="w-4 h-4 text-white" /> : <Menu className="w-4 h-4 text-white" />}
              <span>Menu</span>
            </button>
          </div>
        </div>

        {/* MOBILE MENU DROPDOWN: Mở danh sách menu rõ ràng, không kéo lướt */}
        {showMobileMenu && (
          <div className="md:hidden pt-2 pb-1 border-t border-white/15 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="bg-blue-950/95 backdrop-blur-md rounded-2xl border border-white/20 p-2 space-y-1 shadow-2xl">
              {navItems.map(item => {
                const isActive = currentTab === item.id || (item.id === 'directory' && currentTab === 'targets');
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      setShowMobileMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-blue-950 font-black shadow-md'
                        : 'text-blue-100 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* DÒNG 2: Menu nằm dòng riêng - Căn giữa toàn bộ trên Desktop & Tablet (Không bị che mất text) */}
        <div className="hidden md:flex justify-center pt-1 border-t border-white/10 w-full">
          <nav className="flex items-center justify-center gap-1 md:gap-1.5 lg:gap-2.5 py-0.5 max-w-full overflow-x-auto no-scrollbar">
            {navItems.map(item => {
              const isActive = currentTab === item.id || (item.id === 'directory' && currentTab === 'targets');
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-1.5 lg:gap-2 px-2.5 md:px-2.5 lg:px-4 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-white text-blue-950 font-black shadow-md'
                      : 'text-blue-100 hover:text-white hover:bg-white/10 font-bold'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-red-600 text-white' : 'bg-red-500 text-white shadow-xs'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Modal Đổi thông tin tài khoản */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-blue-100 text-slate-800 text-xs animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Đổi Thông Tin Tài Khoản</h3>
                <p className="text-xs text-blue-100">Cập nhật họ tên, số điện thoại và email cá nhân</p>
              </div>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Họ và tên <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Số điện thoại:</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Email:</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
