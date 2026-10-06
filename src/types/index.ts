// Domain Data Models for Tổ Công nghệ số cộng đồng (Tổ CNSCĐ)

export type UserRole = 
  | 'ADMIN'         // Quản trị hệ thống
  | 'MANAGER'       // Cấp quản lý (UBND Phường/Xã/Phòng VH-TT)
  | 'OFFICER'       // Cán bộ phường/xã (Giám sát tiến độ)
  | 'LEADER'        // Tổ trưởng Tổ CNSCĐ
  | 'MEMBER'        // Thành viên Tổ CNSCĐ (Cán bộ hiện trường)
  | 'CITIZEN';      // Người dân / Đối tượng được hỗ trợ

// 5 nhóm đối tượng
export type TargetGroup = 
  | 'NGUOI_DAN'        // 1. Người dân
  | 'HO_KINH_DOANH'   // 2. Hộ kinh doanh
  | 'TIEU_THUONG'      // 3. Tiểu thương
  | 'DOANH_NGHIEP'     // 4. Doanh nghiệp
  | 'CAN_BO_CO_SO';    // 5. Cán bộ, đơn vị cơ sở

// 5 nhóm công việc
export type WorkGroup = 
  | 'PHAT_HIEN'          // 1. Phát hiện nhu cầu
  | 'HUONG_DAN'          // 2. Hướng dẫn
  | 'HO_TRO'             // 3. Hỗ trợ
  | 'DON_DOC'            // 4. Đôn đốc
  | 'THEO_DOI_KET_QUA';  // 5. Theo dõi kết quả

// Nguồn công việc
export type WorkSource = 
  | 'NGUOI_DAN_GUI'   // Yêu cầu người dân gửi
  | 'CAP_TREN_GIAO'   // Cấp trên giao
  | 'TO_TU_TAO'       // Tổ CNSCĐ chủ động tự tạo
  | 'DINH_KY'         // Công việc định kỳ
  | 'PHAT_SINH';      // Công việc phát sinh trong quá trình hỗ trợ

// 11 Trạng thái công việc
export type TaskStatus = 
  | 'MOI_TAO'          // Mới tạo
  | 'DA_GIAO'          // Đã giao
  | 'DA_NHAN'          // Đã nhận
  | 'DANG_THUC_HIEN'   // Đang thực hiện
  | 'CHO_PHOI_HOP'     // Chờ phối hợp
  | 'CHO_PHAN_HOI'     // Chờ đối tượng phản hồi
  | 'CHO_KIEM_TRA'     // Chờ kiểm tra
  | 'DANG_DON_DOC'     // Đang đôn đốc
  | 'QUA_HAN'          // Quá hạn
  | 'HOAN_THANH'       // Hoàn thành
  | 'DONG';            // Đóng

export type Priority = 'THAP' | 'THUONG' | 'CAO' | 'KHAN';

export type SupportFormat = 'TRUC_TIEP' | 'TRUC_TUYEN' | 'DIEN_THOAI' | 'KHAC';

export type RequestStatus = 
  | 'CHO_TIEP_NHAN'      // Mới gửi - chờ tiếp nhận
  | 'DA_TIEP_NHAN'       // Đã tiếp nhận
  | 'DANG_XU_LY'         // Đã chuyển thành công việc & đang xử lý
  | 'CHO_BO_SUNG'        // Cần người dân bổ sung thông tin
  | 'HOAN_THANH'         // Đã giải quyết xong
  | 'TU_CHOI';           // Từ chối / không thuộc thẩm quyền

// 6 Bước quy trình hỗ trợ
export interface StepRecord {
  stepNumber: 1 | 2 | 3 | 4 | 5 | 6;
  stepName: string;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  evidenceUrls?: string[];
  evaluation?: 'DAT' | 'CHUA_DAT' | 'CAN_BO_SUNG';
}

export interface TaskChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  assignedTo?: string;
}

export interface ReminderMilestone {
  id: string;
  date: string;
  title: string;
  isTriggered: boolean;
  isDone: boolean;
  note?: string;
}

export interface EvidenceItem {
  id: string;
  type: 'IMAGE' | 'FILE' | 'NOTE' | 'MINUTES';
  title: string;
  url?: string;
  description?: string;
  createdAt: string;
  createdBy: string;
}

export interface UrgeLog {
  id: string;
  taskId: string;
  targetId?: string;
  targetName: string;
  date: string;
  method: 'DIEN_THOAI' | 'TRUC_TIEP' | 'ZALO_SMS' | 'KHAC';
  performedBy: string;
  content: string;
  citizenFeedback: string;
  nextFollowUpDate?: string;
  result: 'TIEP_TUC_THEO_DOI' | 'DA_HOAN_THANH' | 'CAN_HO_TRO_LAI' | 'KHONG_LIEN_LAC_DUOC';
}

export interface Task {
  id: string;
  code: string; // VD: CV-2025-0012
  title: string;
  description: string;
  source: WorkSource;
  workGroup: WorkGroup;
  status: TaskStatus;
  priority: Priority;
  
  // Liên kết đối tượng
  targetId?: string;
  targetName?: string;
  targetPhone?: string;
  targetAddress?: string;
  targetGroup?: TargetGroup;
  
  // Liên kết yêu cầu gốc
  requestId?: string;
  requestCode?: string;
  
  // Địa bàn & Tổ
  ward: string;
  teamId: string;
  teamName: string;
  
  // Phân công
  createdBy: string;
  assignerName: string;
  primaryAssigneeId: string;
  primaryAssigneeName: string;
  collaboratorIds: string[];
  collaboratorNames: string[];
  
  // Thời gian
  startDate: string;
  dueDate: string;
  completedDate?: string;
  closedDate?: string;
  closeReason?: string;
  
  // 6 Bước quy trình
  currentStep: number;
  steps: StepRecord[];
  
  // Chi tiết phụ
  checklist: TaskChecklistItem[];
  reminders: ReminderMilestone[];
  evidences: EvidenceItem[];
  actualResult?: string; // Bắt buộc khi hoàn thành/đóng
  
  createdAt?: string;
  updatedAt?: string;
}

export interface SupportRequest {
  id: string;
  code: string; // VD: YC-2025-0105
  fullName: string;
  phone: string;
  targetGroup: TargetGroup;
  ward: string;
  neighborhood: string; // Thôn / Tổ dân phố / Khóm / Ấp
  address: string;
  needCategory: string; // VD: VNeID mức 2, Dịch vụ công, QR Payment...
  content: string;
  format: SupportFormat;
  preferredTime?: string;
  attachments?: string[];
  termsAccepted: boolean;
  status: RequestStatus;
  
  // Tổ & người phụ trách tiếp nhận
  assignedTeamId?: string;
  assignedMemberId?: string;
  assignedMemberName?: string;
  
  // Chuyển thành công việc
  convertedTaskId?: string;
  convertedTaskCode?: string;
  
  createdAt: string;
  updatedAt: string;
  responseNotes?: string;
}

export interface TargetProfile {
  id: string;
  code: string; // VD: HS-DT-001
  name: string;
  group: TargetGroup;
  identityNumber?: string; // CCCD hoặc MST
  phone: string;
  email?: string;
  ward: string;
  neighborhood: string;
  address: string;
  representativeName?: string; // Người đại diện (nếu là doanh nghiệp / hộ kinh doanh)
  fieldOfBusiness?: string;
  digitalReadinessLevel: 'CHUA_CO_GI' | 'CO_BAN' | 'KHA' | 'TOT';
  
  // Lịch sử liên kết
  totalRequests: number;
  totalTasks: number;
  completedTasks: number;
  needsFollowUp: boolean;
  nextScheduledContact?: string;
  
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  entityType: 'TASK' | 'REQUEST' | 'TARGET' | 'MEMBER' | 'CONFIG' | 'URGE';
  entityId: string;
  entityCode?: string;
  action: string;
  details: string;
  previousState?: string;
  newState?: string;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  teamId: string;
  teamName: string;
  ward: string;
  avatarUrl?: string;
  title: string; // VD: Tổ trưởng, Phó Bí thư Đoàn, Công an khu vực, Cán bộ VH-XH
  skills: string[];
  activeTasksCount: number;
  completedTasksCount: number;
  overdueTasksCount: number;
}

export interface Team {
  id: string;
  code?: string;
  name: string;
  ward: string;
  district?: string;
  leaderId: string;
  leaderName: string;
  memberCount?: number;
  totalMembers?: number;
  assignedTasksCount?: number;
  completedTasksCount?: number;
  activeRequestsCount?: number;
  coveredNeighborhoods?: string[];
}

export type AccountStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  password?: string;
  role: UserRole;
  status: AccountStatus;
  province: string; // 'Tỉnh An Giang'
  districtId: string; // VD: 'tp-long-xuyen'
  districtName: string; // 'Thành phố Long Xuyên'
  wardId: string; // VD: 'px-my-long'
  wardName: string; // 'Phường Mỹ Long'
  requestedRole: UserRole;
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  notes?: string;
}

export interface WardInfo {
  id: string;
  name: string;
  unitType: 'PHUONG' | 'XA' | 'DAC_KHU';
  districtId: string;
  districtName: string;
  totalTeams: number;
  totalMembers: number;
  totalTasks: number;
  completedTasks: number;
  activeRequests: number;
  status: 'ACTIVE' | 'IN_PROGRESS' | 'NEEDS_SUPPORT' | 'CHUA_TRIEN_KHAI';
}

export interface DistrictInfo {
  id: string;
  name: string;
  type: 'THANH_PHO' | 'THI_XA' | 'HUYEN';
  wardsCount: number;
}
