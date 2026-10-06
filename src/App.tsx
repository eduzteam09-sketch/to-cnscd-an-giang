/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, ArrowLeft, Shield, AlertTriangle } from 'lucide-react';
import { AuthView } from './components/auth/AuthView';
import { CitizenPortalView } from './components/citizen/CitizenPortalView';
import { CreateTaskModal } from './components/common/CreateTaskModal';
import { Header } from './components/common/Header';
import { NotFoundView } from './components/common/NotFoundView';
import { TaskDetailModal } from './components/common/TaskDetailModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { DirectoryView } from './components/directory/DirectoryView';
import { ProvinceAdminView } from './components/province/ProvinceAdminView';
import { ReportsView } from './components/reports/ReportsView';
import { RequestsView } from './components/requests/RequestsView';
import { TasksView } from './components/tasks/TasksView';
import { AN_GIANG_WARDS_102 } from './mock/anGiangData';
import { appStorage } from './services/storage';
import { SupportRequest, TargetGroup, Task, UserRole, WardInfo } from './types';
import { parseCurrentRoute, toWardSlug, RouteInfo } from './utils/slug';

export default function App() {
  // 1. Quản lý Router dựa trên Pathname URL & Hash
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/';
  });

  // Lắng nghe sự kiện thay đổi URL (History popstate và pushState)
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Hàm chuyển trang mượt mà (SPA Navigation)
  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo(0, 0);
    }
  };

  // Phân tích route hiện tại
  const currentRoute = useMemo<RouteInfo>(() => {
    return parseCurrentRoute(currentPath, AN_GIANG_WARDS_102);
  }, [currentPath]);

  // Refresh trigger khi dữ liệu thay đổi
  const [refreshKey, setRefreshKey] = useState(0);
  const reloadData = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Active tab in Staff view: 'dashboard' | 'tasks' | 'requests' | 'directory' | 'reports'
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [tasksFilter, setTasksFilter] = useState<'ALL' | 'MINE' | 'URGENT' | 'COMPLETED'>('ALL');
  const [directorySubTab, setDirectorySubTab] = useState<'targets' | 'members'>('targets');
  const [directoryTargetGroup, setDirectoryTargetGroup] = useState<string>('ALL');

  // Modals
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [createTaskInitialTargetId, setCreateTaskInitialTargetId] = useState<string | undefined>();
  const [createTaskInitialRequestId, setCreateTaskInitialRequestId] = useState<string | undefined>();

  // Đồng bộ phường/xã được chọn khi truy cập route cấp xã
  useEffect(() => {
    if (currentRoute.type === 'WARD') {
      const selectedWard = appStorage.getSelectedWard();
      if (selectedWard.id !== currentRoute.ward.id) {
        appStorage.setSelectedWardId(currentRoute.ward.id);
        reloadData();
      }
    }
  }, [currentRoute]);

  const handleTabSelect = (tab: string, filter?: string) => {
    if (tab === 'tasks' && filter) {
      setTasksFilter(filter as any);
    }
    if (tab === 'directory') {
      if (filter === 'MEMBERS') {
        setDirectorySubTab('members');
      } else if (filter?.startsWith('GROUP_')) {
        setDirectorySubTab('targets');
        setDirectoryTargetGroup(filter.replace('GROUP_', ''));
      } else {
        setDirectorySubTab('targets');
        setDirectoryTargetGroup('ALL');
      }
    }
    setActiveTab(tab);
  };

  const handleOpenCreateTaskForTarget = (targetId: string) => {
    setCreateTaskInitialTargetId(targetId);
    setCreateTaskInitialRequestId(undefined);
    setShowCreateTaskModal(true);
  };

  const handleOpenCreateTaskFromRequest = (requestId: string) => {
    setCreateTaskInitialRequestId(requestId);
    setCreateTaskInitialTargetId(undefined);
    setShowCreateTaskModal(true);
  };

  const handleTaskCreated = (newTask: Task) => {
    setShowCreateTaskModal(false);
    setCreateTaskInitialTargetId(undefined);
    setCreateTaskInitialRequestId(undefined);
    reloadData();
    setSelectedTask(newTask);
  };

  const handleLogout = () => {
    appStorage.logout();
    reloadData();
  };

  // =========================================================================
  // TRANG 1: CỔNG HỖ TRỢ CHUYỂN ĐỔI SỐ NGƯỜI DÂN & DOANH NGHIỆP CƠ SỞ (URL: /)
  // - Dành cho người dân và doanh nghiệp, không cần đăng nhập
  // - Hoàn toàn không hiển thị nút "Dành cho Cán bộ Tổ"
  // =========================================================================
  if (currentRoute.type === 'CITIZEN') {
    return (
      <div className="relative">
        <CitizenPortalView hideStaffButton={true} />

        {/* Thanh chuyển nhanh chế độ xem (Hỗ trợ người dùng kiểm tra tiện lợi trên Preview) */}
        <div className="fixed bottom-3 left-3 z-40 bg-slate-900/90 backdrop-blur-md text-white text-[11px] px-3 py-1.5 rounded-full border border-slate-700 shadow-xl flex items-center gap-2">
          <span className="text-emerald-400 font-bold">● Cổng Dân</span>
          <span className="text-slate-500">|</span>
          <button
            onClick={() => navigate('/xaanphu')}
            className="hover:text-blue-300 font-medium transition-colors cursor-pointer"
          >
            Vào Xã An Phú (/xaanphu)
          </button>
          <span className="text-slate-500">|</span>
          <button
            onClick={() => navigate('/admin')}
            className="hover:text-amber-300 font-medium transition-colors cursor-pointer"
          >
            Cổng Tỉnh (/admin)
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TRANG 3: TRANG QUẢN LÝ TỔNG TỈNH AN GIANG (102 PHƯỜNG / XÃ) (URL: /admin)
  // - Chỉ dành cho Quản trị viên cấp Tỉnh (Super Admin)
  // - Nếu chưa đăng nhập admin: hiển thị form Đăng nhập/Đăng ký dành riêng cho Cổng Tỉnh
  // - Admin có thể vào trang quản lý của bất kỳ phường/xã nào
  // =========================================================================
  if (currentRoute.type === 'ADMIN') {
    const isSuperAdmin = appStorage.isAuthenticated() && (
      appStorage.isCurrentUserSuperAdmin() || appStorage.getCurrentRole() === 'ADMIN'
    );

    // Chưa đăng nhập Admin -> Hiển thị màn hình đăng nhập Cổng Admin Tỉnh
    if (!isSuperAdmin) {
      return (
        <AuthView
          key={`auth-admin-${refreshKey}`}
          isAdminPortal={true}
          onSuccessLogin={reloadData}
          onBackToCitizenPortal={() => navigate('/')}
        />
      );
    }

    // Đã đăng nhập Super Admin -> Hiển thị Giao diện Quản lý Toàn Tỉnh
    return (
      <div className="relative">
        <ProvinceAdminView
          key={`province-view-${refreshKey}`}
          onSwitchToWardManagement={(wardId) => {
            const targetWard = AN_GIANG_WARDS_102.find(w => w.id === wardId);
            if (targetWard) {
              appStorage.setSelectedWardId(targetWard.id);
              navigate(`/${toWardSlug(targetWard.name)}`);
            }
          }}
          onLogout={handleLogout}
        />

        {/* Thanh chuyển nhanh quay về cổng người dân */}
        <div className="fixed bottom-3 left-3 z-40 bg-slate-900/90 backdrop-blur-md text-white text-[11px] px-3 py-1.5 rounded-full border border-slate-700 shadow-xl flex items-center gap-2 no-print">
          <span className="text-amber-400 font-bold">👑 Cổng Quản Lý Tỉnh</span>
          <span className="text-slate-500">|</span>
          <button
            onClick={() => navigate('/')}
            className="hover:text-blue-300 font-medium transition-colors cursor-pointer"
          >
            Về Cổng Dân (/)
          </button>
          <span className="text-slate-500">|</span>
          <button
            onClick={() => navigate('/xaanphu')}
            className="hover:text-emerald-300 font-medium transition-colors cursor-pointer"
          >
            Thử vào Xã An Phú (/xaanphu)
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TRANG 2: TRANG TỔ CNSCĐ CỦA TỪNG PHƯỜNG / XÃ / ĐẶC KHU (URL: /[tên phường/xã])
  // - Áp dụng cho 102 phường/xã (Ví dụ: /xaanphu, /phuonglongxuyen, ...)
  // - Dành cho Cán bộ thuộc Tổ CNSCĐ của xã đó HOẶC Quản trị viên cấp Tỉnh
  // - Có màn hình Đăng ký - Đăng nhập gắn liền với đơn vị hành chính đó
  // =========================================================================
  if (currentRoute.type === 'WARD') {
    const currentWard = currentRoute.ward;
    const isAuth = appStorage.isAuthenticated();
    const currentAccount = appStorage.getCurrentAuthAccount();
    const isSuperAdmin = appStorage.isCurrentUserSuperAdmin() || appStorage.getCurrentRole() === 'ADMIN';

    // Kiểm tra quyền truy cập: Admin tỉnh hoặc cán bộ đúng xã đó
    const hasWardAccess = isAuth && (isSuperAdmin || currentAccount?.wardId === currentWard.id || !currentAccount?.wardId);

    // Chưa đăng nhập hoặc tài khoản không thuộc xã này -> Hiển thị Màn hình Đăng nhập/Đăng ký của Xã
    if (!hasWardAccess) {
      return (
        <AuthView
          key={`auth-ward-${currentWard.id}-${refreshKey}`}
          targetWard={currentWard}
          isAdminPortal={false}
          onSuccessLogin={reloadData}
          onBackToCitizenPortal={() => navigate('/')}
        />
      );
    }

    // Đã đăng nhập hợp lệ -> Hiển thị Giao diện Quản trị Điều hành Tổ CNSCĐ của Xã/Phường
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
        {/* Banner thông báo nếu Quản trị viên tỉnh đang vào làm việc tại cấp xã */}
        {isSuperAdmin && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-sm">👑</span>
              <span>
                Bạn đang điều hành với quyền <strong>Quản trị viên cấp Tỉnh</strong> tại <strong>{currentWard.name}</strong> ({currentWard.districtName}).
              </span>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="bg-slate-950 text-white hover:bg-slate-800 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Về Trang Quản Lý Toàn Tỉnh (/admin)</span>
            </button>
          </div>
        )}

        {/* Header Tổ CNSCĐ của Phường/Xã */}
        <Header
          currentTab={activeTab}
          onSelectTab={handleTabSelect}
          onLogout={handleLogout}
          onOpenProvinceView={() => navigate('/admin')}
          onOpenCreateTask={() => {
            setCreateTaskInitialTargetId(undefined);
            setCreateTaskInitialRequestId(undefined);
            setShowCreateTaskModal(true);
          }}
        />

        {/* Main Workspace Điều hành cấp xã */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 pb-20 sm:pb-10">
          {/* Phân hệ 1: Tổng quan điều hành */}
          {activeTab === 'dashboard' && (
            <DashboardView
              key={`${currentWard.id}-${refreshKey}`}
              onSelectTab={handleTabSelect}
              onOpenCreateTask={() => {
                setCreateTaskInitialTargetId(undefined);
                setCreateTaskInitialRequestId(undefined);
                setShowCreateTaskModal(true);
              }}
              onSelectTask={setSelectedTask}
              onSelectTargetGroup={(group: TargetGroup) => {
                setDirectorySubTab('targets');
                setDirectoryTargetGroup(group);
                setActiveTab('directory');
              }}
              onSelectMembers={() => {
                setDirectorySubTab('members');
                setActiveTab('directory');
              }}
            />
          )}

          {/* Phân hệ 2: Quản lý Công việc & 6 bước */}
          {activeTab === 'tasks' && (
            <TasksView
              key={`${currentWard.id}-${refreshKey}`}
              initialFilter={tasksFilter}
              onOpenCreateTask={() => {
                setCreateTaskInitialTargetId(undefined);
                setCreateTaskInitialRequestId(undefined);
                setShowCreateTaskModal(true);
              }}
              onSelectTask={setSelectedTask}
            />
          )}

          {/* Phân hệ 3: Yêu cầu từ Dân */}
          {activeTab === 'requests' && (
            <RequestsView
              key={`${currentWard.id}-${refreshKey}`}
              onOpenCitizenPortal={() => navigate('/')}
              onOpenCreateTaskFromRequest={handleOpenCreateTaskFromRequest}
            />
          )}

          {/* Phân hệ 4: Hồ sơ 5 nhóm đối tượng & Thành viên Tổ */}
          {(activeTab === 'directory' || activeTab === 'targets') && (
            <DirectoryView
              key={`${currentWard.id}-${refreshKey}-${directorySubTab}-${directoryTargetGroup}`}
              onSelectTask={setSelectedTask}
              onOpenCreateTaskForTarget={handleOpenCreateTaskForTarget}
              initialSubTab={directorySubTab}
              initialTargetGroup={directoryTargetGroup}
            />
          )}

          {/* Phân hệ 5: Báo cáo & Lịch sử (Audit) */}
          {(activeTab === 'reports' || activeTab === 'audit' || activeTab === 'tools') && (
            <ReportsView key={`${currentWard.id}-${refreshKey}`} />
          )}
        </main>

        {/* Footer */}
        <footer className="mt-auto bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 space-y-1">
          <div className="font-bold text-slate-800 text-xs sm:text-sm">
            TỔ CÔNG NGHỆ SỐ CỘNG ĐỒNG · {currentWard.name.toUpperCase()}
          </div>
          <div className="text-slate-500 text-xs">
            Trực thuộc: <strong className="text-slate-800">{currentWard.districtName}</strong>, Tỉnh An Giang · Đường dẫn: <code className="bg-slate-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">/{currentRoute.slug}</code>
          </div>
        </footer>

        {/* Floating Action Button for Mobile */}
        <div className="fixed bottom-4 right-4 sm:hidden z-30">
          <button
            onClick={() => {
              setCreateTaskInitialTargetId(undefined);
              setCreateTaskInitialRequestId(undefined);
              setShowCreateTaskModal(true);
            }}
            className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-transform cursor-pointer"
            aria-label="Tạo việc mới"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Task Detail Modal */}
        {selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onUpdated={() => {
              reloadData();
              const updated = appStorage.getTasks().find(t => t.id === selectedTask.id);
              if (updated) setSelectedTask(updated);
            }}
          />
        )}

        {/* Create Task Modal */}
        {showCreateTaskModal && (
          <CreateTaskModal
            onClose={() => setShowCreateTaskModal(false)}
            onCreated={handleTaskCreated}
            initialTargetId={createTaskInitialTargetId}
            initialRequestId={createTaskInitialRequestId}
          />
        )}

        {/* Thanh chuyển nhanh chế độ xem khi thử nghiệm */}
        <div className="fixed bottom-3 left-3 z-40 bg-slate-900/90 backdrop-blur-md text-white text-[11px] px-3 py-1.5 rounded-full border border-slate-700 shadow-xl flex items-center gap-2">
          <span className="text-blue-400 font-bold">● {currentWard.name}</span>
          <span className="text-slate-500">|</span>
          <button
            onClick={() => navigate('/')}
            className="hover:text-emerald-300 font-medium transition-colors cursor-pointer"
          >
            Về Cổng Dân (/)
          </button>
          <span className="text-slate-500">|</span>
          <button
            onClick={() => navigate('/admin')}
            className="hover:text-amber-300 font-medium transition-colors cursor-pointer"
          >
            Cổng Tỉnh (/admin)
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TRANG 4: ĐỊA CHỈ KHÔNG TỒN TẠI (404) -> HIỂN THỊ DANH SÁCH 102 PHƯỜNG/XÃ
  // =========================================================================
  return (
    <NotFoundView
      slug={currentRoute.slug}
      onNavigate={navigate}
    />
  );
}
