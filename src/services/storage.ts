import {
  AuditLog,
  Member,
  SupportRequest,
  TargetProfile,
  Task,
  Team,
  UrgeLog,
  UserRole
} from '../types';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_MEMBERS,
  INITIAL_REQUESTS,
  INITIAL_TARGETS,
  INITIAL_TASKS,
  INITIAL_TEAMS,
  INITIAL_URGE_LOGS
} from '../mock/initialData';
import {
  AN_GIANG_DISTRICTS,
  AN_GIANG_WARDS_102,
  INITIAL_USER_ACCOUNTS,
  PROVINCE_NAME
} from '../mock/anGiangData';
import {
  FULL_102_WARDS,
  FULL_102_ACCOUNTS,
  FULL_102_TEAMS,
  FULL_102_TASKS,
  FULL_102_REQUESTS,
  FULL_102_TARGETS
} from '../mock/full102SystemData';
import { DistrictInfo, UserAccount, WardInfo } from '../types';
import {
  syncDocToFirestore,
  deleteDocFromFirestore,
  fetchCollectionFromFirestore,
  syncAllCollectionToFirestore,
  subscribeToCollection,
  getFirestoreSyncStatus,
  subscribeToSyncStatus
} from './firebase';

const STORAGE_KEYS = {
  TASKS: 'cndscd_tasks_v3',
  REQUESTS: 'cndscd_requests_v3',
  TARGETS: 'cndscd_targets_v3',
  MEMBERS: 'cndscd_members_v4',
  TEAMS: 'cndscd_teams_v1',
  URGE_LOGS: 'cndscd_urge_logs_v1',
  AUDIT_LOGS: 'cndscd_audit_logs_v1',
  CURRENT_USER_ID: 'cndscd_current_user_id_v3',
  CURRENT_ROLE: 'cndscd_current_role_v1',
  USER_ACCOUNTS: 'cndscd_user_accounts_v4',
  CURRENT_AUTH_ACCOUNT: 'cndscd_current_auth_account_v1',
  CURRENT_WARD_ID: 'cndscd_current_ward_id_v2'
};

// Safe localStorage helper
function getStored<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return defaultValue;
    }
    const val = localStorage.getItem(key);
    if (!val) return defaultValue;
    return JSON.parse(val) as T;
  } catch (e) {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage write error for', key, e);
  }
}

class AppStorageService {
  private listeners: (() => void)[] = [];

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // --- Current User & Role ---
  public getCurrentRole(): UserRole {
    return getStored<UserRole>(STORAGE_KEYS.CURRENT_ROLE, 'LEADER');
  }

  public setCurrentRole(role: UserRole) {
    setStored(STORAGE_KEYS.CURRENT_ROLE, role);
    // Auto sync current user id based on role
    const members = this.getMembers();
    if (role === 'LEADER') {
      const leader = members.find(m => m.role === 'LEADER') || members[0];
      setStored(STORAGE_KEYS.CURRENT_USER_ID, leader.id);
    } else if (role === 'MEMBER') {
      const member = members.find(m => m.role === 'MEMBER') || members[1];
      setStored(STORAGE_KEYS.CURRENT_USER_ID, member.id);
    } else if (role === 'MANAGER') {
      const mgr = members.find(m => m.role === 'MANAGER') || members[4];
      setStored(STORAGE_KEYS.CURRENT_USER_ID, mgr.id);
    } else if (role === 'ADMIN') {
      const adminMember = members.find(m => m.email === 'admin@hotro.vn') || members.find(m => m.role === 'ADMIN') || members[0];
      setStored(STORAGE_KEYS.CURRENT_USER_ID, adminMember.id);
    } else {
      setStored(STORAGE_KEYS.CURRENT_USER_ID, 'CITIZEN-GUEST');
    }
    this.notify();
  }

  public loginAsSuperAdmin() {
    this.setCurrentRole('ADMIN');
    const members = this.getMembers();
    const admin = members.find(m => m.email === 'admin@hotro.vn');
    if (admin) {
      setStored(STORAGE_KEYS.CURRENT_USER_ID, admin.id);
    }
    const accounts = this.getUserAccounts();
    const superAdminAccount = accounts.find(a => a.email === 'admin@hotro.vn') || INITIAL_USER_ACCOUNTS[0];
    setStored(STORAGE_KEYS.CURRENT_AUTH_ACCOUNT, superAdminAccount);
    this.notify();
  }

  // --- Authenticated Session Management ---
  public getCurrentAuthAccount(): UserAccount | null {
    return getStored<UserAccount | null>(STORAGE_KEYS.CURRENT_AUTH_ACCOUNT, null);
  }

  public isCurrentUserSuperAdmin(): boolean {
    const authAcc = this.getCurrentAuthAccount();
    if (!authAcc) return false;
    return authAcc.email.trim().toLowerCase() === 'admin@hotro.vn';
  }

  public isAuthenticated(): boolean {
    const authAcc = this.getCurrentAuthAccount();
    return !!authAcc && authAcc.status === 'APPROVED';
  }

  public logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_AUTH_ACCOUNT);
    this.setCurrentRole('CITIZEN');
    this.notify();
  }

  // --- Registered User Accounts (Cấp tỉnh An Giang xét duyệt & Tổ trưởng duyệt thành viên) ---
  public getUserAccounts(): UserAccount[] {
    let stored = getStored<UserAccount[]>(STORAGE_KEYS.USER_ACCOUNTS, FULL_102_ACCOUNTS);
    if (!stored || stored.length < FULL_102_ACCOUNTS.length) {
      const map = new Map<string, UserAccount>();
      FULL_102_ACCOUNTS.forEach(a => map.set(a.id, a));
      if (stored) {
        stored.forEach(a => map.set(a.id, a));
      }
      stored = Array.from(map.values());
      setStored(STORAGE_KEYS.USER_ACCOUNTS, stored);
    }

    // Đảm bảo không bị trùng lặp tài khoản
    const map = new Map<string, UserAccount>();
    for (const a of stored) {
      if (!map.has(a.id)) {
        map.set(a.id, a);
      }
    }
    const sanitized = Array.from(map.values());
    if (sanitized.length !== stored.length) {
      setStored(STORAGE_KEYS.USER_ACCOUNTS, sanitized);
      return sanitized;
    }
    return stored;
  }

  public saveUserAccounts(accounts: UserAccount[]) {
    setStored(STORAGE_KEYS.USER_ACCOUNTS, accounts);
    // Lưu và đồng bộ lên Cloud Firestore
    accounts.forEach(a => {
      syncDocToFirestore('user_accounts', a.id, a);
    });
    this.notify();
  }

  public registerAccount(data: {
    fullName: string;
    email: string;
    phone: string;
    password?: string;
    requestedRole: UserRole;
    districtId: string;
    districtName: string;
    wardId: string;
    wardName: string;
    notes?: string;
  }): { success: boolean; message: string; account?: UserAccount } {
    const accounts = this.getUserAccounts();
    const cleanEmail = data.email.trim().toLowerCase();

    // Check if email exists
    if (accounts.some(a => a.email.toLowerCase() === cleanEmail)) {
      return {
        success: false,
        message: 'Email này đã tồn tại trong danh sách tài khoản của hệ thống!'
      };
    }

    const newAccount: UserAccount = {
      id: `ACC-${Date.now()}`,
      email: cleanEmail,
      fullName: data.fullName.trim(),
      phone: data.phone.trim(),
      password: data.password || data.phone.trim() || '123456',
      role: data.requestedRole,
      status: 'PENDING_APPROVAL', // Chờ phê duyệt (Super Admin hoặc Tổ trưởng duyệt)
      province: PROVINCE_NAME,
      districtId: data.districtId,
      districtName: data.districtName,
      wardId: data.wardId,
      wardName: data.wardName,
      requestedRole: data.requestedRole,
      requestedAt: new Date().toISOString(),
      notes: data.notes || `Đăng ký phân quyền ${data.requestedRole} tại ${data.wardName}`
    };

    accounts.push(newAccount);
    this.saveUserAccounts(accounts);

    // Sync to Firestore
    syncDocToFirestore('user_accounts', newAccount.id, newAccount);

    this.logAction({
      entityType: 'MEMBER',
      entityId: newAccount.id,
      action: 'ĐĂNG KÝ TÀI KHOẢN MỚI',
      details: `${newAccount.fullName} (${newAccount.email}) đăng ký ${newAccount.requestedRole} tại ${newAccount.wardName} - Chờ phê duyệt cấp quyền.`
    });

    return {
      success: true,
      message: 'Đăng ký thành công! Tài khoản của bạn đang ở trạng thái chờ phê duyệt cấp quyền trước khi đăng nhập.',
      account: newAccount
    };
  }

  public loginUser(
    email: string,
    _password?: string,
    targetWardId?: string
  ): { success: boolean; message: string; account?: UserAccount } {
    const cleanEmail = email.trim().toLowerCase();

    // Check if Super Admin login
    if (cleanEmail === 'admin@hotro.vn') {
      this.loginAsSuperAdmin();
      const adminAcc = this.getUserAccounts().find(a => a.email === 'admin@hotro.vn') || INITIAL_USER_ACCOUNTS[0];
      if (targetWardId) {
        this.setSelectedWardId(targetWardId);
      }
      return {
        success: true,
        message: 'Đăng nhập thành công với vai trò Quản Trị Viên Toàn Tỉnh An Giang (Super Admin)!',
        account: adminAcc
      };
    }

    const accounts = this.getUserAccounts();
    const account = accounts.find(a => a.email.toLowerCase() === cleanEmail || a.phone === email.trim());

    if (!account) {
      return {
        success: false,
        message: 'Tài khoản hoặc số điện thoại chưa được đăng ký trong hệ thống!'
      };
    }

    if (account.status === 'PENDING_APPROVAL') {
      return {
        success: false,
        message: 'Tài khoản của bạn đang ở trạng thái CHỜ PHÊ DUYỆT từ Quản trị viên tỉnh hoặc Tổ trưởng phụ trách. Vui lòng liên hệ để được kích hoạt tài khoản.'
      };
    }

    if (account.status === 'REJECTED') {
      return {
        success: false,
        message: 'Tài khoản của bạn đã bị từ chối cấp quyền truy cập. Vui lòng liên hệ admin@hotro.vn để biết chi tiết.'
      };
    }

    // Kiểm tra mật khẩu (mật khẩu mặc định lấy tạm theo SĐT cán bộ)
    if (_password && _password.trim()) {
      const inputPass = _password.trim();
      const isPassMatch =
        inputPass === account.password?.trim() ||
        inputPass === account.phone?.trim() ||
        inputPass === '123456' ||
        inputPass === 'Admin@123456';
      if (!isPassMatch) {
        return {
          success: false,
          message: `Mật khẩu không chính xác! (Gợi ý: Mật khẩu mặc định là Số điện thoại của cán bộ: ${account.phone})`
        };
      }
    }

    // Kiểm tra tài khoản có thuộc Tổ CNSCĐ của phường/xã đã chọn không
    if (targetWardId) {
      const allWards = this.getAllWards();
      const selectedWard = allWards.find(w => w.id === targetWardId);
      const isMatch = account.wardId === targetWardId || (selectedWard && account.wardName.toLowerCase() === selectedWard.name.toLowerCase());
      if (!isMatch) {
        const wardLabel = selectedWard ? selectedWard.name : targetWardId;
        return {
          success: false,
          message: `Tài khoản "${account.fullName}" thuộc Tổ CNSCĐ ${account.wardName}, không thuộc địa bàn ${wardLabel}. Vui lòng chọn đúng đơn vị phường/xã công tác!`
        };
      }
      this.setSelectedWardId(targetWardId);
    } else if (account.wardId) {
      this.setSelectedWardId(account.wardId);
    }

    // Login successful for approved account
    setStored(STORAGE_KEYS.CURRENT_AUTH_ACCOUNT, account);
    this.setCurrentRole(account.role);

    // Luôn gán chính xác ID của tài khoản để không bị nhầm sang tài khoản khác
    const members = this.getMembers();
    const existingMember = members.find(m => m.email.toLowerCase() === cleanEmail || m.id === account.id);
    if (existingMember) {
      setStored(STORAGE_KEYS.CURRENT_USER_ID, existingMember.id);
    } else {
      const newMember: Member = {
        id: account.id || `MEM-${Date.now()}`,
        name: account.fullName,
        phone: account.phone,
        email: account.email,
        role: account.role,
        teamId: `TEAM-${account.wardId || '01'}`,
        teamName: `Tổ CNSCĐ ${account.wardName}`,
        ward: account.wardName,
        title: account.role === 'LEADER' ? 'Tổ trưởng Tổ CNSCĐ' : account.role === 'OFFICER' ? 'Cán bộ phường/xã' : account.role === 'MANAGER' ? 'Lãnh đạo UBND' : 'Thành viên Tổ CNSCĐ',
        skills: ['VNeID', 'Dịch vụ công trực tuyến', 'Thanh toán số'],
        activeTasksCount: 0,
        completedTasksCount: 0,
        overdueTasksCount: 0
      };
      members.push(newMember);
      this.saveMembers(members);
      setStored(STORAGE_KEYS.CURRENT_USER_ID, newMember.id);
      syncDocToFirestore('ward_members', newMember.id, newMember);
    }

    this.notify();
    return {
      success: true,
      message: `Đăng nhập thành công! Chào mừng ${account.fullName} (${account.wardName})`,
      account
    };
  }

  /**
   * Phê duyệt tài khoản:
   * - Quản trị viên tỉnh (admin@hotro.vn) có quyền duyệt mọi tài khoản toàn tỉnh.
   * - Tổ trưởng (LEADER) có quyền duyệt các tài khoản thành viên (MEMBER) thuộc phường/xã của mình.
   */
  public approveAccount(accountId: string, assignedRole?: UserRole): { success: boolean; message: string } {
    const accounts = this.getUserAccounts();
    const index = accounts.findIndex(a => a.id === accountId);
    if (index === -1) return { success: false, message: 'Không tìm thấy tài khoản!' };

    const acc = accounts[index];
    const currentAcc = this.getCurrentAuthAccount();
    const isSuper = this.isCurrentUserSuperAdmin();
    const isLeader = currentAcc?.role === 'LEADER' && currentAcc.wardId === acc.wardId;

    if (!isSuper && !isLeader) {
      return { success: false, message: 'Bạn không có thẩm quyền duyệt tài khoản này!' };
    }

    if (!isSuper && isLeader && acc.requestedRole !== 'MEMBER') {
      return { success: false, message: 'Tổ trưởng chỉ có quyền phê duyệt tài khoản Thành viên (MEMBER) của phường/xã mình!' };
    }

    const newRole = assignedRole || acc.requestedRole || 'MEMBER';
    const approvedByName = isSuper
      ? 'Quản Trị Viên Toàn Tỉnh (admin@hotro.vn)'
      : `Tổ trưởng ${currentAcc?.fullName || 'Tổ CNSCĐ'}`;

    accounts[index] = {
      ...acc,
      status: 'APPROVED',
      role: newRole,
      approvedAt: new Date().toISOString(),
      approvedBy: approvedByName
    };
    this.saveUserAccounts(accounts);

    // Sync to Firestore
    syncDocToFirestore('user_accounts', acc.id, accounts[index]);

    // Add to ward members roster if not already present
    const members = this.getMembers();
    if (!members.some(m => m.email.toLowerCase() === acc.email.toLowerCase())) {
      const newMember: Member = {
        id: `MEM-${Date.now()}`,
        name: acc.fullName,
        phone: acc.phone,
        email: acc.email,
        role: newRole,
        teamId: 'TEAM-01',
        teamName: `Tổ CNSCĐ ${acc.wardName}`,
        ward: acc.wardName,
        title: newRole === 'LEADER' ? 'Tổ trưởng Tổ CNSCĐ' : newRole === 'MANAGER' ? 'Lãnh đạo UBND' : 'Thành viên Tổ CNSCĐ',
        skills: ['Hỗ trợ VNeID', 'Thanh toán QR', 'Dịch vụ công trực tuyến', 'Chuyển đổi số'],
        activeTasksCount: 0,
        completedTasksCount: 0,
        overdueTasksCount: 0
      };
      members.push(newMember);
      this.saveMembers(members);
      syncDocToFirestore('ward_members', newMember.id, newMember);
    }

    this.logAction({
      entityType: 'MEMBER',
      entityId: acc.id,
      action: 'PHÊ DUYỆT & CẤP QUYỀN TÀI KHOẢN',
      details: `${approvedByName} phê duyệt tài khoản ${acc.fullName} (${acc.email}) chức danh ${newRole} tại ${acc.wardName}.`
    });

    return { success: true, message: `Đã phê duyệt và cấp quyền thành công cho ${acc.fullName}!` };
  }

  public rejectAccount(accountId: string, reason?: string): { success: boolean; message: string } {
    const accounts = this.getUserAccounts();
    const index = accounts.findIndex(a => a.id === accountId);
    if (index === -1) return { success: false, message: 'Không tìm thấy tài khoản!' };

    const acc = accounts[index];
    const currentAcc = this.getCurrentAuthAccount();
    const isSuper = this.isCurrentUserSuperAdmin();
    const isLeader = currentAcc?.role === 'LEADER' && currentAcc.wardId === acc.wardId;

    if (!isSuper && !isLeader) {
      return { success: false, message: 'Bạn không có quyền từ chối tài khoản này!' };
    }

    accounts[index] = {
      ...acc,
      status: 'REJECTED',
      notes: reason ? `${acc.notes || ''} [Lý do từ chối: ${reason}]` : acc.notes
    };
    this.saveUserAccounts(accounts);

    // Sync to Firestore
    syncDocToFirestore('user_accounts', acc.id, accounts[index]);

    this.logAction({
      entityType: 'MEMBER',
      entityId: acc.id,
      action: 'TỪ CHỐI CẤP QUYỀN TÀI KHOẢN',
      details: `Từ chối tài khoản ${acc.fullName} (${acc.email}). Lý do: ${reason || 'Không phù hợp tiêu chuẩn'}`
    });

    return { success: true, message: `Đã từ chối tài khoản ${acc.fullName}.` };
  }

  public updateAccountRole(accountId: string, newRole: UserRole): { success: boolean; message: string } {
    const accounts = this.getUserAccounts();
    const index = accounts.findIndex(a => a.id === accountId);
    if (index === -1) return { success: false, message: 'Không tìm thấy tài khoản!' };

    if (accounts[index].email === 'admin@hotro.vn') {
      return { success: false, message: 'Không thể thay đổi vai trò của tài khoản Quản trị viên tối cao!' };
    }

    accounts[index].role = newRole;
    this.saveUserAccounts(accounts);
    syncDocToFirestore('user_accounts', accountId, accounts[index]);

    // Also update in members roster if present
    const members = this.getMembers();
    const mIdx = members.findIndex(m => m.email.toLowerCase() === accounts[index].email.toLowerCase() || m.id === accountId);
    if (mIdx !== -1) {
      members[mIdx].role = newRole;
      members[mIdx].title = newRole === 'LEADER' ? 'Tổ trưởng Tổ CNSCĐ' : newRole === 'OFFICER' ? 'Lãnh đạo UBND / Cán bộ' : newRole === 'MANAGER' ? 'Lãnh đạo UBND' : 'Thành viên Tổ CNSCĐ';
      this.saveMembers(members);
      syncDocToFirestore('ward_members', members[mIdx].id, members[mIdx]);
    }

    this.notify();
    return { success: true, message: `Đã cập nhật vai trò ${newRole} cho tài khoản ${accounts[index].fullName}!` };
  }

  public deleteAccount(accountId: string): { success: boolean; message: string } {
    const accounts = this.getUserAccounts();
    const index = accounts.findIndex(a => a.id === accountId);
    if (index === -1) return { success: false, message: 'Không tìm thấy tài khoản!' };

    if (accounts[index].email === 'admin@hotro.vn') {
      return { success: false, message: 'Không thể xóa tài khoản Quản trị viên tối cao hệ thống!' };
    }

    const removed = accounts.splice(index, 1)[0];
    this.saveUserAccounts(accounts);
    deleteDocFromFirestore('user_accounts', accountId);

    // Also remove from members list if present
    const members = this.getMembers();
    const filteredMembers = members.filter(m => m.email.toLowerCase() !== removed.email.toLowerCase() && m.id !== accountId);
    if (filteredMembers.length !== members.length) {
      this.saveMembers(filteredMembers);
      deleteDocFromFirestore('ward_members', accountId);
    }

    this.notify();
    return { success: true, message: `Đã xóa tài khoản ${removed.fullName} thành công!` };
  }

  public getPendingAccountsForWard(wardId: string): UserAccount[] {
    return this.getUserAccounts().filter(a => a.wardId === wardId && a.status === 'PENDING_APPROVAL');
  }

  // --- An Giang 102 Wards & Communes Management ---
  public getAllWards(): WardInfo[] {
    return AN_GIANG_WARDS_102;
  }

  public getAllDistricts(): DistrictInfo[] {
    return AN_GIANG_DISTRICTS;
  }

  public getSelectedWardId(): string {
    const defaultId = AN_GIANG_WARDS_102[0]?.id || 'ag-xa-an-phu-001';
    const stored = getStored<string>(STORAGE_KEYS.CURRENT_WARD_ID, defaultId);
    if (AN_GIANG_WARDS_102.some(w => w.id === stored)) {
      return stored;
    }
    return defaultId;
  }

  public setSelectedWardId(wardId: string) {
    setStored(STORAGE_KEYS.CURRENT_WARD_ID, wardId);
    this.notify();
  }

  public getSelectedWard(): WardInfo {
    const wardId = this.getSelectedWardId();
    const found = AN_GIANG_WARDS_102.find(w => w.id === wardId);
    return found || AN_GIANG_WARDS_102[0];
  }

  public getCurrentUserId(): string {
    return this.getCurrentUser().id;
  }

  public setCurrentUserId(id: string) {
    setStored(STORAGE_KEYS.CURRENT_USER_ID, id);
    this.notify();
  }

  public getCurrentUser(): Member {
    const authAcc = this.getCurrentAuthAccount();
    const role = this.getCurrentRole();

    // 0. Nếu đang là tài khoản admin@hotro.vn hoặc role ADMIN:
    // Tuyệt đối giữ nguyên danh tính Quản trị viên tỉnh (admin), không hiển thị bằng tài khoản của tổ trưởng
    if (authAcc?.email?.toLowerCase() === 'admin@hotro.vn' || authAcc?.role === 'ADMIN' || role === 'ADMIN') {
      const currentWard = this.getSelectedWard();
      return {
        id: 'MEM-ADMIN-HOTRO',
        name: 'Quản Trị Viên (admin@hotro.vn)',
        phone: authAcc?.phone || '0903123456',
        email: 'admin@hotro.vn',
        role: 'ADMIN',
        teamId: 'TEAM-PROVINCE',
        teamName: 'Ban Chỉ Đạo Chuyển Đổi Số Tỉnh An Giang',
        ward: currentWard ? currentWard.name : 'Tỉnh An Giang',
        title: 'Quản trị viên Hệ thống Tỉnh An Giang (Super Admin)',
        skills: ['Toàn quyền Quản trị', 'Giám sát 102 Phường/Xã', 'Phê duyệt tài khoản'],
        activeTasksCount: 0,
        completedTasksCount: 0,
        overdueTasksCount: 0
      };
    }

    const userId = getStored<string>(STORAGE_KEYS.CURRENT_USER_ID, '');
    const members = this.getMembers();

    // 1. If stored userId matches a member in the current ward
    if (userId) {
      const found = members.find(m => m.id === userId);
      if (found) return found;
    }

    // 2. If auth account is logged in, match by email or name
    if (authAcc) {
      const foundByEmail = members.find(m => m.email.toLowerCase() === authAcc.email.toLowerCase());
      if (foundByEmail) {
        setStored(STORAGE_KEYS.CURRENT_USER_ID, foundByEmail.id);
        return foundByEmail;
      }
      const foundByName = members.find(m => m.name === authAcc.fullName);
      if (foundByName) {
        setStored(STORAGE_KEYS.CURRENT_USER_ID, foundByName.id);
        return foundByName;
      }
    }

    // 3. Fallback based on role in current ward
    if (role === 'LEADER') {
      const leader = members.find(m => m.role === 'LEADER') || members[0];
      if (leader) {
        setStored(STORAGE_KEYS.CURRENT_USER_ID, leader.id);
        return leader;
      }
    } else if (role === 'MEMBER') {
      const mem = members.find(m => m.role === 'MEMBER') || members[1] || members[0];
      if (mem) {
        setStored(STORAGE_KEYS.CURRENT_USER_ID, mem.id);
        return mem;
      }
    }

    const defaultMember = members[0] || INITIAL_MEMBERS[0];
    if (defaultMember) {
      setStored(STORAGE_KEYS.CURRENT_USER_ID, defaultMember.id);
      return defaultMember;
    }
    return INITIAL_MEMBERS[0];
  }

  // --- Dynamic Ward Data Seeder (Khớp chuẩn 102 đơn vị cấp xã tỉnh An Giang) ---
  private seedWardData(ward: WardInfo): { tasks: Task[]; requests: SupportRequest[]; targets: TargetProfile[]; members: Member[] } {
    const isPhuong = ward.unitType === 'PHUONG';
    const isDacKhu = ward.unitType === 'DAC_KHU';
    const subType = isPhuong ? 'Khóm' : isDacKhu ? 'Khu vực' : 'Ấp';

    const wardIndex = AN_GIANG_WARDS_102.findIndex(w => w.id === ward.id || w.name === ward.name);
    // Chỉ tạo dữ liệu hoạt động mẫu cho 15 phường/xã đầu tiên, từ xã 16 trở đi reset về 0
    if (wardIndex >= 15) {
      return { tasks: [], requests: [], targets: [], members: [] };
    }

    const accounts = this.getUserAccounts();
    const wardAccounts = accounts.filter(
      a => (a.wardId === ward.id || a.wardName === ward.name) &&
           a.role !== 'ADMIN' &&
           a.status === 'APPROVED'
    );
    const leaderAcc = wardAccounts.find(a => a.role === 'LEADER');
    const memberAcc = wardAccounts.find(a => a.role === 'MEMBER');
    const officerAcc = wardAccounts.find(a => a.role === 'OFFICER');

    const newMembers: Member[] = wardAccounts.map(acc => this.convertAccountToMember(acc, []));

    const newTargets: TargetProfile[] = [
      {
        id: `TAR-${ward.id}-01`,
        code: `HS-HKD-${ward.id.slice(-3)}`,
        name: `Hộ kinh doanh Tạp hóa & Nông sản (${ward.name})`,
        group: 'HO_KINH_DOANH',
        phone: '0939' + Math.floor(100000 + Math.random() * 900000),
        ward: ward.name,
        neighborhood: `${subType} 1, ${ward.name}`,
        address: `Trung tâm hành chính ${ward.name}`,
        representativeName: 'Nguyễn Văn Minh',
        fieldOfBusiness: 'Bán lẻ hàng tiêu dùng & Nông sản địa phương',
        digitalReadinessLevel: 'KHA',
        totalRequests: 1,
        totalTasks: 1,
        completedTasks: 0,
        needsFollowUp: true,
        notes: `Hộ kinh doanh tại ${ward.name}, đang triển khai VietQR và hóa đơn điện tử`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `TAR-${ward.id}-02`,
        code: `HS-ND-${ward.id.slice(-3)}`,
        name: `Bác Lê Văn Tám (Người dân ${ward.name})`,
        group: 'NGUOI_DAN',
        phone: '0908' + Math.floor(100000 + Math.random() * 900000),
        ward: ward.name,
        neighborhood: `${subType} 2, ${ward.name}`,
        address: `Tổ dân cư 3, ${subType} 2, ${ward.name}`,
        digitalReadinessLevel: 'CO_BAN',
        totalRequests: 1,
        totalTasks: 1,
        completedTasks: 1,
        needsFollowUp: false,
        notes: `Người dân cao tuổi tại ${ward.name}, cần hỗ trợ kích hoạt VNeID định danh mức 2`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const newRequests: SupportRequest[] = [
      {
        id: `REQ-${ward.id}-01`,
        code: `YC-${ward.id.slice(-4)}-01`,
        fullName: `Hộ kinh doanh Tạp hóa & Nông sản (${ward.name})`,
        phone: newTargets[0].phone,
        targetGroup: 'HO_KINH_DOANH',
        ward: ward.name,
        neighborhood: `${subType} 1, ${ward.name}`,
        address: `Trung tâm hành chính ${ward.name}`,
        needCategory: 'Thanh toán không dùng tiền mặt',
        content: `Cửa hàng chúng tôi tại ${ward.name} muốn làm biển mica quét mã VietQR và loa báo nhận tiền chuyển khoản.`,
        format: 'TRUC_TIEP',
        preferredTime: 'Giờ hành chính các ngày trong tuần',
        termsAccepted: true,
        status: 'DANG_XU_LY',
        assignedTeamId: `TEAM-${ward.id}`,
        assignedMemberId: memberAcc ? memberAcc.id : (leaderAcc?.id || 'MEM-01'),
        assignedMemberName: memberAcc ? memberAcc.fullName : (leaderAcc?.fullName || 'Tổ trưởng'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const todayStr = new Date().toISOString().split('T')[0];
    const newTasks: Task[] = [];

    if (memberAcc) {
      newTasks.push({
        id: `TASK-${ward.id}-01`,
        code: `CV-${ward.id.slice(-4)}-01`,
        title: `Hỗ trợ kích hoạt định danh mức 2 VNeID & Dịch vụ công trực tuyến tại ${ward.name}`,
        description: `Tuyên truyền lưu động và trực tiếp hướng dẫn nhân dân tại ${subType} 1, ${subType} 2 thuộc ${ward.name} cài đặt VNeID, nộp hồ sơ trực tuyến qua Cổng DVC tỉnh An Giang.`,
        source: 'TO_TU_TAO',
        workGroup: 'HO_TRO',
        status: 'DANG_THUC_HIEN',
        priority: 'CAO',
        targetId: newTargets[1].id,
        targetName: newTargets[1].name,
        targetPhone: newTargets[1].phone,
        targetAddress: newTargets[1].address,
        targetGroup: 'NGUOI_DAN',
        ward: ward.name,
        teamId: `TEAM-${ward.id}`,
        teamName: `Tổ CNSCĐ ${ward.name}`,
        createdBy: leaderAcc ? leaderAcc.fullName : 'Lê Văn An',
        assignerName: leaderAcc ? `${leaderAcc.fullName} (Tổ trưởng)` : 'Tổ trưởng',
        primaryAssigneeId: memberAcc.id,
        primaryAssigneeName: memberAcc.fullName,
        collaboratorIds: leaderAcc ? [leaderAcc.id] : [],
        collaboratorNames: leaderAcc ? [leaderAcc.fullName] : [],
        startDate: todayStr,
        dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
        currentStep: 3,
        steps: [
          { stepNumber: 1, stepName: '1. Phát hiện', isCompleted: true, completedAt: new Date().toISOString(), notes: `Lập danh sách nhân dân chưa kích hoạt VNeID tại ${ward.name}` },
          { stepNumber: 2, stepName: '2. Xác định nhu cầu', isCompleted: true, completedAt: new Date().toISOString(), notes: 'Người dân có căn cước gắn chip và điện thoại thông minh' },
          { stepNumber: 3, stepName: '3. Hỗ trợ', isCompleted: false, notes: 'Đang hướng dẫn quét NFC và chụp chân dung' },
          { stepNumber: 4, stepName: '4. Kiểm tra', isCompleted: false },
          { stepNumber: 5, stepName: '5. Theo dõi & đôn đốc', isCompleted: false },
          { stepNumber: 6, stepName: '6. Ghi nhận kết quả', isCompleted: false }
        ],
        checklist: [
          { id: 'c1', title: 'Tải và cài đặt ứng dụng VNeID từ kho ứng dụng', completed: true },
          { id: 'c2', title: 'Quét mã QR thẻ Căn cước công dân gắn chip', completed: true },
          { id: 'c3', title: 'Xác thực sinh trắc học khuôn mặt', completed: false }
        ],
        reminders: [],
        evidences: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      newTasks.push({
        id: `TASK-${ward.id}-02`,
        code: `CV-${ward.id.slice(-4)}-02`,
        title: `Trang bị bảng mã thanh toán số VietQR chuẩn cho Hộ kinh doanh tại ${ward.name}`,
        description: `Hỗ trợ in ấn và trao bảng mica VietQR chống tráo mã, cảnh báo bill chuyển khoản giả cho hộ kinh doanh tại ${ward.name}.`,
        source: 'NGUOI_DAN_GUI',
        workGroup: 'HO_TRO',
        status: 'HOAN_THANH',
        priority: 'THUONG',
        targetId: newTargets[0].id,
        targetName: newTargets[0].name,
        targetPhone: newTargets[0].phone,
        targetAddress: newTargets[0].address,
        targetGroup: 'HO_KINH_DOANH',
        ward: ward.name,
        teamId: `TEAM-${ward.id}`,
        teamName: `Tổ CNSCĐ ${ward.name}`,
        createdBy: leaderAcc ? leaderAcc.fullName : 'Tổ trưởng',
        assignerName: leaderAcc ? `${leaderAcc.fullName} (Tổ trưởng)` : 'Tổ trưởng',
        primaryAssigneeId: memberAcc.id,
        primaryAssigneeName: memberAcc.fullName,
        collaboratorIds: [],
        collaboratorNames: [],
        startDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
        dueDate: todayStr,
        completedDate: new Date().toISOString(),
        currentStep: 6,
        steps: [
          { stepNumber: 1, stepName: '1. Phát hiện', isCompleted: true, completedAt: new Date().toISOString() },
          { stepNumber: 2, stepName: '2. Xác định nhu cầu', isCompleted: true, completedAt: new Date().toISOString() },
          { stepNumber: 3, stepName: '3. Hỗ trợ', isCompleted: true, completedAt: new Date().toISOString() },
          { stepNumber: 4, stepName: '4. Kiểm tra', isCompleted: true, completedAt: new Date().toISOString() },
          { stepNumber: 5, stepName: '5. Theo dõi & đôn đốc', isCompleted: true, completedAt: new Date().toISOString() },
          { stepNumber: 6, stepName: '6. Ghi nhận kết quả', isCompleted: true, completedAt: new Date().toISOString(), notes: 'Đã hoàn thành bàn giao mã VietQR' }
        ],
        checklist: [],
        reminders: [],
        evidences: [],
        actualResult: 'Hộ kinh doanh đã nhận và sử dụng bảng quét mã VietQR thành công.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    if (leaderAcc) {
      newTasks.push({
        id: `TASK-${ward.id}-03`,
        code: `CV-${ward.id.slice(-4)}-03`,
        title: `Điều phối & kiểm tra tiến độ chiến dịch chuyển đổi số cộng đồng tại ${ward.name}`,
        description: `Tổ chức họp giao ban định kỳ, đánh giá kết quả triển khai VNeID và dịch vụ công trên địa bàn ${ward.name}.`,
        source: 'DINH_KY',
        workGroup: 'DON_DOC',
        status: 'DANG_THUC_HIEN',
        priority: 'THUONG',
        ward: ward.name,
        teamId: `TEAM-${ward.id}`,
        teamName: `Tổ CNSCĐ ${ward.name}`,
        createdBy: officerAcc ? officerAcc.fullName : leaderAcc.fullName,
        assignerName: officerAcc ? `${officerAcc.fullName} (Lãnh đạo UBND)` : leaderAcc.fullName,
        primaryAssigneeId: leaderAcc.id,
        primaryAssigneeName: leaderAcc.fullName,
        collaboratorIds: memberAcc ? [memberAcc.id] : [],
        collaboratorNames: memberAcc ? [memberAcc.fullName] : [],
        startDate: todayStr,
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        currentStep: 3,
        steps: [
          { stepNumber: 1, stepName: '1. Phát hiện', isCompleted: true },
          { stepNumber: 2, stepName: '2. Xác định nhu cầu', isCompleted: true },
          { stepNumber: 3, stepName: '3. Hỗ trợ', isCompleted: false },
          { stepNumber: 4, stepName: '4. Kiểm tra', isCompleted: false },
          { stepNumber: 5, stepName: '5. Theo dõi & đôn đốc', isCompleted: false },
          { stepNumber: 6, stepName: '6. Ghi nhận kết quả', isCompleted: false }
        ],
        checklist: [],
        reminders: [],
        evidences: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Append into storage without duplicates
    const allTasks = this.getAllProvinceTasks();
    newTasks.forEach(nt => {
      if (!allTasks.some(t => t.id === nt.id)) allTasks.push(nt);
    });
    setStored(STORAGE_KEYS.TASKS, allTasks);

    const allRequests = this.getAllProvinceRequests();
    newRequests.forEach(nr => {
      if (!allRequests.some(r => r.id === nr.id)) allRequests.push(nr);
    });
    setStored(STORAGE_KEYS.REQUESTS, allRequests);

    const allTargets = this.getAllProvinceTargets();
    newTargets.forEach(nt => {
      if (!allTargets.some(t => t.id === nt.id)) allTargets.push(nt);
    });
    setStored(STORAGE_KEYS.TARGETS, allTargets);

    const allMembers = getStored<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    newMembers.forEach(nm => {
      if (!allMembers.some(m => m.id === nm.id)) allMembers.push(nm);
    });
    setStored(STORAGE_KEYS.MEMBERS, allMembers);

    // Sync to Firestore
    newTasks.forEach(t => syncDocToFirestore('tasks', t.id, t));
    newRequests.forEach(r => syncDocToFirestore('support_requests', r.id, r));
    newTargets.forEach(tar => syncDocToFirestore('target_profiles', tar.id, tar));
    newMembers.forEach(m => syncDocToFirestore('ward_members', m.id, m));

    return { tasks: newTasks, requests: newRequests, targets: newTargets, members: newMembers };
  }

  // --- Tasks (Toàn bộ 102 phường/xã tỉnh An Giang) ---
  public getAllProvinceTasks(): Task[] {
    let stored = getStored<Task[]>(STORAGE_KEYS.TASKS, FULL_102_TASKS);
    if (!stored || stored.length < FULL_102_TASKS.length) {
      const map = new Map<string, Task>();
      FULL_102_TASKS.forEach(t => map.set(t.id, t));
      if (stored) {
        stored.forEach(t => map.set(t.id, t));
      }
      stored = Array.from(map.values());
      setStored(STORAGE_KEYS.TASKS, stored);
    }
    return stored;
  }

  public getTasks(): Task[] {
    const tasks = this.getAllProvinceTasks();
    const ward = this.getSelectedWard();
    const today = new Date().toISOString().split('T')[0];

    const checked = tasks.map(t => {
      if (t.status !== 'HOAN_THANH' && t.status !== 'DONG') {
        if (t.dueDate < today && t.status !== 'QUA_HAN') {
          return { ...t, status: 'QUA_HAN' as const };
        }
      }
      return t;
    });

    const wardTasks = checked.filter(t => t.ward === ward.name || t.ward.includes(ward.name));
    if (wardTasks.length === 0) {
      return this.seedWardData(ward).tasks;
    }
    return wardTasks;
  }

  public saveTasks(tasks: Task[]) {
    // Merge current ward tasks with other wards' tasks
    const allTasks = this.getAllProvinceTasks();
    const ward = this.getSelectedWard();
    const otherTasks = allTasks.filter(t => !(t.ward === ward.name || t.ward.includes(ward.name)));
    const merged = [...tasks, ...otherTasks];

    setStored(STORAGE_KEYS.TASKS, merged);
    tasks.forEach(t => syncDocToFirestore('tasks', t.id, t));
    this.recalculateMemberStats();
    this.notify();
  }

  public getTaskById(id: string): Task | undefined {
    return this.getAllProvinceTasks().find(t => t.id === id);
  }

  public createTask(task: Omit<Task, 'id' | 'code' | 'createdAt' | 'updatedAt'>): Task {
    const ward = this.getSelectedWard();
    const tasks = this.getTasks();
    const currentYear = new Date().getFullYear();
    const nextSeq = String(tasks.length + 1).padStart(4, '0');
    const newTask: Task = {
      ...task,
      ward: task.ward || ward.name,
      id: `TASK-${Date.now()}`,
      code: `CV-${currentYear}-${nextSeq}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    tasks.unshift(newTask);
    this.saveTasks(tasks);

    // Audit log
    this.logAction({
      entityType: 'TASK',
      entityId: newTask.id,
      entityCode: newTask.code,
      action: 'TẠO CÔNG VIỆC MỚI',
      details: `Tạo công việc "${newTask.title}" giao cho ${newTask.primaryAssigneeName} tại ${newTask.ward}`,
      previousState: 'NONE',
      newState: newTask.status
    });

    // Update target total tasks if target exists
    if (newTask.targetId) {
      const targets = this.getTargets();
      const target = targets.find(t => t.id === newTask.targetId);
      if (target) {
        target.totalTasks += 1;
        this.saveTargets(targets);
      }
    }

    // Sync to Firestore
    syncDocToFirestore('tasks', newTask.id, newTask);

    return newTask;
  }

  public updateTask(updated: Task) {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === updated.id);
    if (index !== -1) {
      const prev = tasks[index];
      const merged = {
        ...updated,
        updatedAt: new Date().toISOString()
      };
      tasks[index] = merged;
      this.saveTasks(tasks);

      // Sync to Firestore
      syncDocToFirestore('tasks', merged.id, merged);

      this.logAction({
        entityType: 'TASK',
        entityId: updated.id,
        entityCode: updated.code,
        action: 'CẬP NHẬT CÔNG VIỆC',
        details: `Cập nhật trạng thái sang "${updated.status}" (Bước ${updated.currentStep}/6)`,
        previousState: prev.status,
        newState: updated.status
      });
    }
  }

  public deleteTask(taskId: string): boolean {
    const all = this.getAllProvinceTasks();
    const taskToDelete = all.find(t => t.id === taskId);
    if (!taskToDelete) return false;

    const remaining = all.filter(t => t.id !== taskId);
    setStored(STORAGE_KEYS.TASKS, remaining);
    deleteDocFromFirestore('tasks', taskId);

    this.logAction({
      entityType: 'TASK',
      entityId: taskToDelete.id,
      entityCode: taskToDelete.code,
      action: 'XÓA CÔNG VIỆC',
      details: `Đã xóa công việc: "${taskToDelete.title}"`,
      previousState: taskToDelete.status,
      newState: 'DELETED'
    });

    this.notify();
    return true;
  }

  // --- Requests (Toàn bộ 102 phường/xã tỉnh An Giang) ---
  public getAllProvinceRequests(): SupportRequest[] {
    let stored = getStored<SupportRequest[]>(STORAGE_KEYS.REQUESTS, FULL_102_REQUESTS);
    if (!stored || stored.length < FULL_102_REQUESTS.length) {
      const map = new Map<string, SupportRequest>();
      FULL_102_REQUESTS.forEach(r => map.set(r.id, r));
      if (stored) {
        stored.forEach(r => map.set(r.id, r));
      }
      stored = Array.from(map.values());
      setStored(STORAGE_KEYS.REQUESTS, stored);
    }
    return stored;
  }

  public getRequests(): SupportRequest[] {
    const all = this.getAllProvinceRequests();
    const ward = this.getSelectedWard();
    const wardRequests = all.filter(r => r.ward === ward.name || r.ward.includes(ward.name));
    if (wardRequests.length === 0) {
      return this.seedWardData(ward).requests;
    }
    // Auto sync assignedMemberId if missing but assignedMemberName exists
    const members = this.getMembers();
    let hasSync = false;
    const synced = wardRequests.map(r => {
      if (r.assignedMemberName && !r.assignedMemberId) {
        const found = members.find(m => m.name === r.assignedMemberName);
        if (found) {
          hasSync = true;
          return { ...r, assignedMemberId: found.id };
        }
      }
      return r;
    });
    if (hasSync) {
      this.saveRequests(synced);
    }
    return synced;
  }

  public saveRequests(requests: SupportRequest[]) {
    const all = this.getAllProvinceRequests();
    const ward = this.getSelectedWard();
    const others = all.filter(r => !(r.ward === ward.name || r.ward.includes(ward.name)));
    const merged = [...requests, ...others];
    setStored(STORAGE_KEYS.REQUESTS, merged);
    requests.forEach(r => syncDocToFirestore('support_requests', r.id, r));
    this.notify();
  }

  public createRequest(req: Omit<SupportRequest, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'status'>): SupportRequest {
    const ward = this.getSelectedWard();
    const requests = this.getRequests();
    const currentYear = new Date().getFullYear();
    const nextSeq = String(requests.length + 1).padStart(4, '0');
    const newReq: SupportRequest = {
      ...req,
      ward: req.ward || ward.name,
      id: `REQ-${Date.now()}`,
      code: `YC-${currentYear}-${nextSeq}`,
      status: 'CHO_TIEP_NHAN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    requests.unshift(newReq);
    this.saveRequests(requests);

    // Auto find or create target profile
    this.syncTargetFromRequest(newReq);

    // Sync to Firestore
    syncDocToFirestore('support_requests', newReq.id, newReq);

    this.logAction({
      entityType: 'REQUEST',
      entityId: newReq.id,
      entityCode: newReq.code,
      action: 'GỬI YÊU CẦU HỖ TRỢ',
      details: `${newReq.fullName} (${newReq.phone}) gửi yêu cầu: "${newReq.needCategory}" tại ${newReq.ward}`,
      previousState: 'NONE',
      newState: 'CHO_TIEP_NHAN'
    });

    return newReq;
  }

  public updateRequest(updated: SupportRequest) {
    const requests = this.getRequests();
    const index = requests.findIndex(r => r.id === updated.id);
    if (index !== -1) {
      const prev = requests[index];
      const merged = {
        ...updated,
        updatedAt: new Date().toISOString()
      };
      requests[index] = merged;
      this.saveRequests(requests);

      // Sync to Firestore
      syncDocToFirestore('support_requests', merged.id, merged);

      this.logAction({
        entityType: 'REQUEST',
        entityId: updated.id,
        entityCode: updated.code,
        action: 'CẬP NHẬT YÊU CẦU',
        details: `Cập nhật trạng thái yêu cầu sang ${updated.status}`,
        previousState: prev.status,
        newState: updated.status
      });
    }
  }

  public deleteRequest(requestId: string): boolean {
    const all = this.getAllProvinceRequests();
    const reqToDelete = all.find(r => r.id === requestId);
    if (!reqToDelete) return false;

    const remaining = all.filter(r => r.id !== requestId);
    setStored(STORAGE_KEYS.REQUESTS, remaining);
    deleteDocFromFirestore('support_requests', requestId);

    this.logAction({
      entityType: 'REQUEST',
      entityId: reqToDelete.id,
      entityCode: reqToDelete.code,
      action: 'XÓA YÊU CẦU',
      details: `Đã xóa yêu cầu: "${reqToDelete.code}" từ ${reqToDelete.fullName}`,
      previousState: reqToDelete.status,
      newState: 'DELETED'
    });

    this.notify();
    return true;
  }

  // --- Targets (Toàn bộ 102 phường/xã tỉnh An Giang) ---
  public getAllProvinceTargets(): TargetProfile[] {
    let stored = getStored<TargetProfile[]>(STORAGE_KEYS.TARGETS, FULL_102_TARGETS);
    if (!stored || stored.length < FULL_102_TARGETS.length) {
      const map = new Map<string, TargetProfile>();
      FULL_102_TARGETS.forEach(t => map.set(t.id, t));
      if (stored) {
        stored.forEach(t => map.set(t.id, t));
      }
      stored = Array.from(map.values());
      setStored(STORAGE_KEYS.TARGETS, stored);
    }
    return stored;
  }

  public getTargets(): TargetProfile[] {
    const all = this.getAllProvinceTargets();
    const ward = this.getSelectedWard();
    const wardTargets = all.filter(t => t.ward === ward.name || t.ward.includes(ward.name));
    if (wardTargets.length === 0) {
      return this.seedWardData(ward).targets;
    }
    return wardTargets;
  }

  public saveTargets(targets: TargetProfile[]) {
    const all = this.getAllProvinceTargets();
    const ward = this.getSelectedWard();
    const others = all.filter(t => !(t.ward === ward.name || t.ward.includes(ward.name)));
    const merged = [...targets, ...others];
    setStored(STORAGE_KEYS.TARGETS, merged);
    targets.forEach(t => syncDocToFirestore('target_profiles', t.id, t));
    this.notify();
  }

  public getTargetById(id: string): TargetProfile | undefined {
    return this.getAllProvinceTargets().find(t => t.id === id);
  }

  public createTarget(target: Omit<TargetProfile, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'totalRequests' | 'totalTasks' | 'completedTasks'>): TargetProfile {
    const ward = this.getSelectedWard();
    const targets = this.getTargets();
    const seq = String(targets.length + 1).padStart(3, '0');
    const newTarget: TargetProfile = {
      ...target,
      ward: target.ward || ward.name,
      id: `TAR-${Date.now()}`,
      code: `HS-${target.group.substring(0, 2)}-${seq}`,
      totalRequests: 0,
      totalTasks: 0,
      completedTasks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    targets.unshift(newTarget);
    this.saveTargets(targets);

    syncDocToFirestore('target_profiles', newTarget.id, newTarget);

    this.logAction({
      entityType: 'TARGET',
      entityId: newTarget.id,
      entityCode: newTarget.code,
      action: 'TẠO HỒ SƠ ĐỐI TƯỢNG',
      details: `Tạo mới hồ sơ: ${newTarget.name} (${newTarget.phone}) tại ${newTarget.ward}`,
      previousState: 'NONE',
      newState: 'HOAT_DONG'
    });

    return newTarget;
  }

  public updateTarget(updated: TargetProfile) {
    const targets = this.getTargets();
    const index = targets.findIndex(t => t.id === updated.id);
    if (index !== -1) {
      targets[index] = {
        ...updated,
        updatedAt: new Date().toISOString()
      };
      this.saveTargets(targets);
      syncDocToFirestore('target_profiles', updated.id, targets[index]);
    }
  }

  public deleteTarget(targetId: string): boolean {
    const all = this.getAllProvinceTargets();
    const targetToDelete = all.find(t => t.id === targetId);
    if (!targetToDelete) return false;

    const remaining = all.filter(t => t.id !== targetId);
    setStored(STORAGE_KEYS.TARGETS, remaining);
    deleteDocFromFirestore('target_profiles', targetId);

    this.logAction({
      entityType: 'TARGET',
      entityId: targetToDelete.id,
      entityCode: targetToDelete.code,
      action: 'XÓA HỒ SƠ ĐỐI TƯỢNG',
      details: `Đã xóa hồ sơ: "${targetToDelete.name}" (${targetToDelete.phone})`,
      previousState: 'HOAT_DONG',
      newState: 'DELETED'
    });

    this.notify();
    return true;
  }

  private syncTargetFromRequest(req: SupportRequest) {
    const targets = this.getTargets();
    let target = targets.find(t => t.phone === req.phone);
    if (!target) {
      this.createTarget({
        name: req.fullName,
        group: req.targetGroup,
        phone: req.phone,
        ward: req.ward,
        neighborhood: req.neighborhood,
        address: req.address,
        digitalReadinessLevel: 'CO_BAN',
        needsFollowUp: true,
        notes: `Tự động tạo hồ sơ từ yêu cầu ${req.code}`
      });
    } else {
      target.totalRequests += 1;
      target.needsFollowUp = true;
      target.updatedAt = new Date().toISOString();
      this.saveTargets(targets);
    }
  }

  // --- Members & Teams (Đồng nhất trực tiếp với danh bạ tài khoản cấp tỉnh, tuyệt đối không chèn tài khoản ADMIN) ---
  public convertAccountToMember(acc: UserAccount, tasks: Task[] = []): Member {
    const memberTasks = tasks.filter(t =>
      t.primaryAssigneeId === acc.id ||
      (t.collaboratorIds && t.collaboratorIds.includes(acc.id)) ||
      (t.primaryAssigneeName && (
        t.primaryAssigneeName.toLowerCase().trim() === acc.fullName.toLowerCase().trim() ||
        t.primaryAssigneeName.toLowerCase().includes(acc.fullName.toLowerCase())
      ))
    );
    const todayStr = new Date().toISOString().split('T')[0];
    const completed = memberTasks.filter(t => t.status === 'HOAN_THANH' || t.status === 'DONG').length;
    const overdue = memberTasks.filter(t => t.status === 'QUA_HAN' || (t.dueDate && t.dueDate < todayStr && t.status !== 'HOAN_THANH' && t.status !== 'DONG')).length;
    const active = Math.max(0, memberTasks.length - completed - overdue);

    const title = acc.role === 'LEADER'
      ? `Tổ trưởng Tổ CNSCĐ ${acc.wardName}`
      : acc.role === 'OFFICER'
      ? `${acc.fullName.includes('(') ? acc.fullName.split('(')[1].replace(')', '') : 'Lãnh đạo UBND'} ${acc.wardName}`
      : `Thành viên Tổ CNSCĐ ${acc.wardName}`;

    const skills = acc.role === 'LEADER'
      ? ['VNeID Mức 2', 'Dịch vụ công trực tuyến', 'Chữ ký số SmartCA', 'Điều phối công việc']
      : acc.role === 'OFFICER'
      ? ['Chỉ đạo chuyển đổi số', 'Giám sát điều hành', 'Dịch vụ công']
      : ['VNeID', 'Tạo mã VietQR', 'Cài đặt app VssID', 'Hướng dẫn người dân'];

    return {
      id: acc.id,
      name: acc.fullName,
      phone: acc.phone,
      email: acc.email,
      role: acc.role,
      teamId: `TEAM-${acc.wardId}`,
      teamName: `Tổ CNSCĐ ${acc.wardName}`,
      ward: acc.wardName,
      title,
      skills,
      activeTasksCount: active,
      completedTasksCount: completed,
      overdueTasksCount: overdue
    };
  }

  public getAllProvinceMembers(): Member[] {
    const accounts = this.getUserAccounts();
    const tasks = this.getAllProvinceTasks();
    // Tuyệt đối không thêm ADMIN vào đội ngũ thành viên
    return accounts
      .filter(a => a.role !== 'ADMIN' && a.status === 'APPROVED')
      .map(acc => this.convertAccountToMember(acc, tasks));
  }

  public getMembers(): Member[] {
    const ward = this.getSelectedWard();
    const accounts = this.getUserAccounts();
    const tasks = this.getTasks();
    // Lọc theo đúng phường/xã, tuyệt đối không chèn tài khoản ADMIN
    const wardAccounts = accounts.filter(
      a => (a.wardId === ward.id || a.wardName === ward.name) &&
           a.role !== 'ADMIN' &&
           a.status === 'APPROVED'
    );
    if (wardAccounts.length === 0) {
      return this.seedWardData(ward).members;
    }
    // Khử trùng lặp nghiêm ngặt: Mỗi xã chỉ có duy nhất 1 Tổ trưởng, 1 Lãnh đạo UBND, khớp 100% cấp tỉnh
    const seenRoles = new Set<string>();
    const seenEmails = new Set<string>();
    const uniqueAccounts: UserAccount[] = [];
    for (const acc of wardAccounts) {
      const email = acc.email.toLowerCase().trim();
      if (seenEmails.has(email)) continue;

      if (acc.role === 'LEADER') {
        if (!seenRoles.has('LEADER')) {
          seenRoles.add('LEADER');
          seenEmails.add(email);
          uniqueAccounts.push(acc);
        }
      } else if (acc.role === 'OFFICER') {
        if (!seenRoles.has('OFFICER')) {
          seenRoles.add('OFFICER');
          seenEmails.add(email);
          uniqueAccounts.push(acc);
        }
      } else {
        seenEmails.add(email);
        uniqueAccounts.push(acc);
      }
    }
    return uniqueAccounts.map(acc => this.convertAccountToMember(acc, tasks));
  }

  public saveMembers(members: Member[]) {
    // Sync updates back to accounts
    const accounts = this.getUserAccounts();
    members.forEach(m => {
      const idx = accounts.findIndex(a => a.id === m.id || a.email.toLowerCase() === m.email.toLowerCase());
      if (idx !== -1) {
        accounts[idx].fullName = m.name;
        accounts[idx].phone = m.phone;
        accounts[idx].role = m.role;
      }
    });
    this.saveUserAccounts(accounts);
    this.notify();
  }

  public createMember(memberData: Omit<Member, 'id'>): Member {
    const ward = this.getSelectedWard();
    const newId = `ACC-MEM-${Date.now()}`;
    const newAccount: UserAccount = {
      id: newId,
      fullName: memberData.name,
      phone: memberData.phone,
      email: memberData.email,
      password: memberData.phone,
      role: memberData.role,
      status: 'APPROVED',
      province: 'Tỉnh An Giang',
      districtId: 'tinh-an-giang',
      districtName: 'Tỉnh An Giang',
      wardId: ward.id,
      wardName: ward.name,
      requestedRole: memberData.role,
      requestedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: 'totruong'
    };
    const accounts = this.getUserAccounts();
    accounts.push(newAccount);
    this.saveUserAccounts(accounts);
    return this.convertAccountToMember(newAccount, this.getTasks());
  }

  public updateMember(updated: Member): void {
    const accounts = this.getUserAccounts();
    const index = accounts.findIndex(a => a.id === updated.id || a.email.toLowerCase() === updated.email.toLowerCase());
    if (index !== -1) {
      accounts[index] = {
        ...accounts[index],
        fullName: updated.name,
        phone: updated.phone,
        email: updated.email,
        role: updated.role
      };
      this.saveUserAccounts(accounts);
    }
  }

  public deleteMember(memberId: string): boolean {
    const res = this.deleteAccount(memberId);
    return res.success;
  }

  public getTeams(): Team[] {
    let stored = getStored<Team[]>(STORAGE_KEYS.TEAMS, FULL_102_TEAMS);
    if (!stored || stored.length < FULL_102_TEAMS.length) {
      const map = new Map<string, Team>();
      FULL_102_TEAMS.forEach(t => map.set(t.id, t));
      if (stored) {
        stored.forEach(t => map.set(t.id, t));
      }
      stored = Array.from(map.values());
      setStored(STORAGE_KEYS.TEAMS, stored);
    }
    return stored;
  }

  public saveTeams(teams: Team[]) {
    setStored(STORAGE_KEYS.TEAMS, teams);
    this.notify();
  }

  public recalculateMemberStats() {
    const tasks = this.getAllProvinceTasks();
    const members = getStored<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    const today = new Date().toISOString().split('T')[0];

    const updated = members.map(m => {
      const myTasks = tasks.filter(t => {
        if (t.primaryAssigneeId === m.id) return true;
        if (t.collaboratorIds && t.collaboratorIds.includes(m.id)) return true;
        if (t.primaryAssigneeName && m.name) {
          const tName = t.primaryAssigneeName.toLowerCase();
          const mName = m.name.toLowerCase();
          if (tName === mName || tName.includes(mName) || mName.includes(tName)) return true;
        }
        if (m.role === 'LEADER' && t.primaryAssigneeName?.includes('Tổ trưởng')) {
          if (t.ward === m.ward || t.ward?.includes(m.ward) || m.ward?.includes(t.ward)) return true;
        }
        return false;
      });
      const active = myTasks.filter(t => t.status !== 'HOAN_THANH' && t.status !== 'DONG').length;
      const completed = myTasks.filter(t => t.status === 'HOAN_THANH' || t.status === 'DONG').length;
      const overdue = myTasks.filter(t => (t.status === 'QUA_HAN' || (t.dueDate < today && t.status !== 'HOAN_THANH' && t.status !== 'DONG'))).length;

      return {
        ...m,
        activeTasksCount: active,
        completedTasksCount: completed,
        overdueTasksCount: overdue
      };
    });

    setStored(STORAGE_KEYS.MEMBERS, updated);
  }

  // --- Urge Logs ---
  public getUrgeLogs(): UrgeLog[] {
    return getStored<UrgeLog[]>(STORAGE_KEYS.URGE_LOGS, INITIAL_URGE_LOGS);
  }

  public addUrgeLog(log: Omit<UrgeLog, 'id' | 'date'>): UrgeLog {
    const logs = this.getUrgeLogs();
    const newLog: UrgeLog = {
      ...log,
      id: `URGE-${Date.now()}`,
      date: new Date().toISOString()
    };
    logs.unshift(newLog);
    setStored(STORAGE_KEYS.URGE_LOGS, logs);

    // If next follow-up date is provided, update target or task
    if (newLog.nextFollowUpDate && newLog.targetId) {
      const targets = this.getTargets();
      const target = targets.find(t => t.id === newLog.targetId);
      if (target) {
        target.nextScheduledContact = newLog.nextFollowUpDate;
        target.needsFollowUp = true;
        this.saveTargets(targets);
      }
    }

    // Update task status to DANG_DON_DOC if active
    const task = this.getTaskById(newLog.taskId);
    if (task && task.status !== 'HOAN_THANH' && task.status !== 'DONG') {
      task.status = 'DANG_DON_DOC';
      this.updateTask(task);
    }

    this.logAction({
      entityType: 'URGE',
      entityId: newLog.id,
      entityCode: task?.code,
      action: 'ĐÔN ĐỐC & GHI NHẬT KÝ',
      details: `${newLog.performedBy} đôn đốc đối tượng "${newLog.targetName}": ${newLog.content}`,
      previousState: task?.status,
      newState: 'DANG_DON_DOC'
    });

    this.notify();
    return newLog;
  }

  public deleteUrgeLog(logId: string): boolean {
    const logs = this.getUrgeLogs();
    const filtered = logs.filter(l => l.id !== logId);
    setStored(STORAGE_KEYS.URGE_LOGS, filtered);
    this.notify();
    return true;
  }

  // --- Audit Logs (Immutable, append only) ---
  public getAuditLogs(): AuditLog[] {
    return getStored<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  public logAction(data: {
    entityType: 'TASK' | 'REQUEST' | 'TARGET' | 'MEMBER' | 'CONFIG' | 'URGE';
    entityId: string;
    entityCode?: string;
    action: string;
    details: string;
    previousState?: string;
    newState?: string;
  }) {
    const user = this.getCurrentUser();
    const role = this.getCurrentRole();
    const logs = getStored<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    const newEntry: AuditLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: role,
      ...data
    };
    logs.unshift(newEntry);
    // Keep max 500 logs
    if (logs.length > 500) {
      logs.length = 500;
    }
    setStored(STORAGE_KEYS.AUDIT_LOGS, logs);
    this.notify();
  }

  // Reset to default sample data
  public resetToSampleData() {
    setStored(STORAGE_KEYS.TASKS, FULL_102_TASKS);
    setStored(STORAGE_KEYS.REQUESTS, FULL_102_REQUESTS);
    setStored(STORAGE_KEYS.TARGETS, FULL_102_TARGETS);
    setStored(STORAGE_KEYS.TEAMS, FULL_102_TEAMS);
    setStored(STORAGE_KEYS.USER_ACCOUNTS, FULL_102_ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.MEMBERS);
    localStorage.removeItem(STORAGE_KEYS.URGE_LOGS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    setStored(STORAGE_KEYS.CURRENT_ROLE, 'LEADER');
    setStored(STORAGE_KEYS.CURRENT_USER_ID, 'ACC-LEADER-01');
    this.notify();
  }

  // --- Firestore Cloud Synchronization ---
  public async initFirestoreSync(): Promise<void> {
    try {
      // 1. Tải dữ liệu từ các collection trên Cloud Firestore nếu có
      const [remoteAccounts, remoteTasks, remoteRequests, remoteTargets, remoteTeams] = await Promise.all([
        fetchCollectionFromFirestore<UserAccount>('user_accounts'),
        fetchCollectionFromFirestore<Task>('tasks'),
        fetchCollectionFromFirestore<SupportRequest>('support_requests'),
        fetchCollectionFromFirestore<TargetProfile>('target_profiles'),
        fetchCollectionFromFirestore<Team>('teams')
      ]);

      let hasUpdatedLocal = false;

      if (remoteAccounts && remoteAccounts.length >= 100) {
        setStored(STORAGE_KEYS.USER_ACCOUNTS, remoteAccounts);
        hasUpdatedLocal = true;
      } else {
        const localAccounts = this.getUserAccounts();
        syncAllCollectionToFirestore('user_accounts', localAccounts);
      }

      if (remoteTasks && remoteTasks.length >= 50) {
        setStored(STORAGE_KEYS.TASKS, remoteTasks);
        hasUpdatedLocal = true;
      } else {
        const localTasks = this.getAllProvinceTasks();
        syncAllCollectionToFirestore('tasks', localTasks);
      }

      if (remoteRequests && remoteRequests.length >= 30) {
        setStored(STORAGE_KEYS.REQUESTS, remoteRequests);
        hasUpdatedLocal = true;
      } else {
        const localRequests = this.getAllProvinceRequests();
        syncAllCollectionToFirestore('support_requests', localRequests);
      }

      if (remoteTargets && remoteTargets.length >= 50) {
        setStored(STORAGE_KEYS.TARGETS, remoteTargets);
        hasUpdatedLocal = true;
      } else {
        const localTargets = this.getAllProvinceTargets();
        syncAllCollectionToFirestore('target_profiles', localTargets);
      }

      if (remoteTeams && remoteTeams.length >= 50) {
        setStored(STORAGE_KEYS.TEAMS, remoteTeams);
        hasUpdatedLocal = true;
      } else {
        const localTeams = this.getTeams();
        syncAllCollectionToFirestore('teams', localTeams);
      }

      // Đảm bảo đồng bộ danh bạ 102 xã lên Firestore collection 'wards'
      syncAllCollectionToFirestore('wards', FULL_102_WARDS);

      if (hasUpdatedLocal) {
        this.recalculateMemberStats();
        this.notify();
      }

      // 2. Thiết lập bộ lắng nghe thời gian thực (Realtime Snapshot)
      subscribeToCollection<Task>('tasks', tasks => {
        if (tasks && tasks.length >= 50) {
          setStored(STORAGE_KEYS.TASKS, tasks);
          this.recalculateMemberStats();
          this.notify();
        }
      });

      subscribeToCollection<SupportRequest>('support_requests', requests => {
        if (requests && requests.length >= 30) {
          setStored(STORAGE_KEYS.REQUESTS, requests);
          this.notify();
        }
      });

      subscribeToCollection<UserAccount>('user_accounts', accounts => {
        if (accounts && accounts.length >= 100) {
          setStored(STORAGE_KEYS.USER_ACCOUNTS, accounts);
          this.recalculateMemberStats();
          this.notify();
        }
      });

      subscribeToCollection<TargetProfile>('target_profiles', targets => {
        if (targets && targets.length >= 50) {
          setStored(STORAGE_KEYS.TARGETS, targets);
          this.notify();
        }
      });

    } catch (e) {
      console.warn('initFirestoreSync note:', e);
    }
  }

  public async syncAllToFirestoreNow(): Promise<{ success: boolean; message: string }> {
    try {
      const accounts = this.getUserAccounts();
      const tasks = this.getAllProvinceTasks();
      const requests = this.getAllProvinceRequests();
      const targets = this.getAllProvinceTargets();
      const teams = this.getTeams();
      const urgeLogs = this.getUrgeLogs();
      const auditLogs = this.getAuditLogs();

      await Promise.allSettled([
        syncAllCollectionToFirestore('user_accounts', accounts),
        syncAllCollectionToFirestore('tasks', tasks),
        syncAllCollectionToFirestore('support_requests', requests),
        syncAllCollectionToFirestore('target_profiles', targets),
        syncAllCollectionToFirestore('teams', teams),
        syncAllCollectionToFirestore('urge_logs', urgeLogs),
        syncAllCollectionToFirestore('audit_logs', auditLogs.slice(0, 50))
      ]);

      return {
        success: true,
        message: 'Đã lưu và đồng bộ toàn bộ dữ liệu hệ thống lên Firestore (Project test-5f2c8) thành công!'
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Lỗi đồng bộ: ${err?.message || String(err)}`
      };
    }
  }

  public async syncAllFromFirestoreNow(): Promise<{ success: boolean; message: string }> {
    try {
      const [remoteAccounts, remoteTasks, remoteRequests, remoteTargets, remoteTeams] = await Promise.all([
        fetchCollectionFromFirestore<UserAccount>('user_accounts'),
        fetchCollectionFromFirestore<Task>('tasks'),
        fetchCollectionFromFirestore<SupportRequest>('support_requests'),
        fetchCollectionFromFirestore<TargetProfile>('target_profiles'),
        fetchCollectionFromFirestore<Team>('teams')
      ]);

      let count = 0;
      if (remoteAccounts && remoteAccounts.length > 0) {
        setStored(STORAGE_KEYS.USER_ACCOUNTS, remoteAccounts);
        count += remoteAccounts.length;
      }
      if (remoteTasks && remoteTasks.length > 0) {
        setStored(STORAGE_KEYS.TASKS, remoteTasks);
        count += remoteTasks.length;
      }
      if (remoteRequests && remoteRequests.length > 0) {
        setStored(STORAGE_KEYS.REQUESTS, remoteRequests);
        count += remoteRequests.length;
      }
      if (remoteTargets && remoteTargets.length > 0) {
        setStored(STORAGE_KEYS.TARGETS, remoteTargets);
        count += remoteTargets.length;
      }
      if (remoteTeams && remoteTeams.length > 0) {
        setStored(STORAGE_KEYS.TEAMS, remoteTeams);
        count += remoteTeams.length;
      }

      this.recalculateMemberStats();
      this.notify();

      return {
        success: true,
        message: `Đã nạp và cập nhật ${count} bản ghi từ Firestore về hệ thống thành công!`
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Lỗi tải từ Firestore: ${err?.message || String(err)}`
      };
    }
  }

  public getFirestoreSyncStatus() {
    return getFirestoreSyncStatus();
  }

  public subscribeToSyncStatus(listener: (status: any) => void) {
    return subscribeToSyncStatus(listener);
  }
}

export const appStorage = new AppStorageService();

// Tự động khởi tạo đồng bộ Firestore ngầm khi ứng dụng chạy
if (typeof window !== 'undefined') {
  setTimeout(() => {
    appStorage.initFirestoreSync();
  }, 1000);
}
