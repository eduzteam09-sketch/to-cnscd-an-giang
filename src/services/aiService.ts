import { GoogleGenAI } from '@google/genai';
import { Member, SupportRequest, TargetGroup, TargetProfile, Task, WorkGroup } from '../types';

// Read API key safely
const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) || '';

let genAI: GoogleGenAI | null = null;
if (apiKey) {
  try {
    genAI = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI with key', err);
  }
}

export interface AIClassificationResult {
  targetGroup: TargetGroup;
  workGroup: WorkGroup;
  suggestedTitle: string;
  suggestedAssigneeId?: string;
  reason: string;
  checklistSuggestions: string[];
}

export interface AIRiskAssessment {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
  suggestedAction: string;
  draftUrgeMessage: string;
}

export interface AIReportSummary {
  executiveSummary: string;
  keyAchievements: string[];
  bottlenecks: string[];
  nextWeekActionPlan: string[];
}

class AIService {
  // 1. Tự động phân loại nhu cầu & đề xuất nhóm công việc
  public async classifyRequest(req: SupportRequest, members: Member[]): Promise<AIClassificationResult> {
    const textPrompt = `Bạn là Trợ lý AI Điều hành Tổ Công nghệ số cộng đồng (Tổ CNSCĐ) tại Việt Nam.
Hãy phân loại yêu cầu sau của người dân/đối tượng:
Họ tên: ${req.fullName}
Số điện thoại: ${req.phone}
Địa bàn: ${req.neighborhood}, ${req.ward}
Nhóm khai báo: ${req.targetGroup}
Nhu cầu: ${req.needCategory}
Nội dung chi tiết: ${req.content}

Danh sách thành viên Tổ CNSCĐ phụ trách:
${members.map(m => `- ID: ${m.id} | Tên: ${m.name} | Vai trò: ${m.title} | Kỹ năng: ${m.skills.join(', ')} | Số việc đang làm: ${m.activeTasksCount}`).join('\n')}

Hãy trả về định dạng JSON thuần túy (không markdown) với cấu trúc:
{
  "targetGroup": "NGUOI_DAN" hoặc "HO_KINH_DOANH" hoặc "TIEU_THUONG" hoặc "DOANH_NGHIEP" hoặc "CAN_BO_CO_SO",
  "workGroup": "PHAT_HIEN" hoặc "HUONG_DAN" hoặc "HO_TRO" hoặc "DON_DOC" hoặc "THEO_DOI_KET_QUA",
  "suggestedTitle": "Tiêu đề ngắn gọn chuẩn nghiệp vụ công việc",
  "suggestedAssigneeId": "ID thành viên phù hợp nhất",
  "reason": "Giải thích ngắn lý do chọn thành viên và nhóm",
  "checklistSuggestions": ["bước 1", "bước 2", "bước 3"]
}`;

    if (genAI) {
      try {
        const response = await genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: textPrompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        });
        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          return parsed;
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to heuristics:', err);
      }
    }

    // Heuristics fallback
    let tg: TargetGroup = req.targetGroup || 'NGUOI_DAN';
    let wg: WorkGroup = 'HO_TRO';
    let title = `Hỗ trợ ${req.fullName} về ${req.needCategory}`;

    if (req.content.toLowerCase().includes('hóa đơn') || req.content.toLowerCase().includes('pos') || req.content.toLowerCase().includes('máy tính tiền')) {
      tg = 'HO_KINH_DOANH';
      wg = 'HO_TRO';
    } else if (req.content.toLowerCase().includes('chợ') || req.content.toLowerCase().includes('tiểu thương') || req.content.toLowerCase().includes('kiot')) {
      tg = 'TIEU_THUONG';
      wg = 'HO_TRO';
    } else if (req.content.toLowerCase().includes('tự làm') || req.content.toLowerCase().includes('hướng dẫn cách') || req.content.toLowerCase().includes('tập huấn')) {
      wg = 'HUONG_DAN';
    }

    // Pick member with lowest active workload or matched skill
    const member = members.find(m => m.skills.some(s => req.needCategory.toLowerCase().includes(s.toLowerCase()))) ||
      members.sort((a, b) => a.activeTasksCount - b.activeTasksCount)[0];

    return {
      targetGroup: tg,
      workGroup: wg,
      suggestedTitle: title,
      suggestedAssigneeId: member?.id || members[0]?.id,
      reason: `Đề xuất đồng chí ${member?.name || 'Tổ trưởng'} phụ trách dựa trên chuyên môn phù hợp và khối lượng công việc hiện tại.`,
      checklistSuggestions: [
        'Liên hệ hẹn lịch với người yêu cầu',
        'Kiểm tra điều kiện thiết bị và tài khoản',
        'Hướng dẫn thực hành trực tiếp và kiểm tra kết quả',
        'Ghi nhật ký và tải ảnh bằng chứng nghiệm thu'
      ]
    };
  }

  // 2. Phát hiện nguy cơ quá hạn & dự thảo đôn đốc
  public async assessTaskRisk(task: Task): Promise<AIRiskAssessment> {
    const today = new Date().toISOString().split('T')[0];
    const dueDate = task.dueDate;
    const isOverdue = task.status === 'QUA_HAN' || dueDate < today;
    const isClose = dueDate === today;

    const prompt = `Phân tích nguy cơ tiến độ của công việc Tổ CNSCĐ:
Tên việc: ${task.title}
Mã: ${task.code}
Đối tượng: ${task.targetName || 'Nội bộ'} (${task.targetPhone || ''})
Người phụ trách: ${task.primaryAssigneeName}
Hạn xử lý: ${task.dueDate} (Hôm nay: ${today})
Trạng thái: ${task.status} (Đang ở bước ${task.currentStep}/6)
Checklist đã làm: ${task.checklist.filter(c => c.completed).length}/${task.checklist.length}

Hãy trả lời định dạng JSON:
{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "reasons": ["Lý do 1", "Lý do 2"],
  "suggestedAction": "Hành động khuyến nghị cho Tổ trưởng",
  "draftUrgeMessage": "Mẫu tin nhắn/kịch bản thoại ngắn gọi điện hoặc nhắn Zalo đôn đốc đối tượng/thành viên thật lịch sự, văn minh"
}`;

    if (genAI) {
      try {
        const response = await genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3
          }
        });
        if (response.text) {
          return JSON.parse(response.text.trim());
        }
      } catch (e) {
        console.warn('AI assessTaskRisk fallback', e);
      }
    }

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    const reasons: string[] = [];

    if (isOverdue) {
      riskLevel = 'HIGH';
      reasons.push(`Công việc đã quá hạn xử lý ngày ${task.dueDate} mà chưa hoàn thành bước 6.`);
    } else if (isClose) {
      riskLevel = 'MEDIUM';
      reasons.push(`Hạn xử lý là hôm nay (${today}), đang ở bước ${task.currentStep}/6.`);
    } else {
      reasons.push(`Tiến độ trong tầm kiểm soát, còn thời hạn.`);
    }

    if (task.checklist.length > 0 && task.checklist.filter(c => c.completed).length === 0) {
      reasons.push('Chưa có hạng mục checklist nào được hoàn tất.');
    }

    return {
      riskLevel,
      reasons,
      suggestedAction: riskLevel === 'HIGH' ? 'Tổ trưởng cần đôn đốc trực tiếp thành viên phụ trách và gọi điện hỗ trợ đối tượng ngay hôm nay.' : 'Tiếp tục theo dõi tiến độ theo lịch nhắc.',
      draftUrgeMessage: `Dạ em chào anh/chị ${task.targetName || ''}, em là cán bộ Tổ Công nghệ số cộng đồng phường. Em liên hệ để hỏi thăm tình hình thực hiện công việc số ${task.code} ("${task.title}"). Nếu anh/chị gặp vướng mắc gì trong thao tác, Tổ chúng em xin sẵn sàng qua hỗ trợ trực tiếp ạ!`
    };
  }

  // 3. Tóm tắt hồ sơ đối tượng & đề xuất bước đi tiếp theo
  public async summarizeTargetProfile(target: TargetProfile, tasks: Task[]): Promise<string> {
    const prompt = `Bạn là Trợ lý số của Tổ CNSCĐ. Tóm tắt ngắn gọn (3-4 câu) lịch sử hỗ trợ của đối tượng sau:
Tên: ${target.name}
Nhóm: ${target.group}
Địa chỉ: ${target.address}
Mức độ sẵn sàng số: ${target.digitalReadinessLevel}
Tổng số công việc: ${tasks.length}
Ghi chú: ${target.notes || 'Không có'}
Các công việc:
${tasks.map(t => `- [${t.status}] ${t.title} (Hạn: ${t.dueDate}, KQ: ${t.actualResult || 'Chưa ghi nhận'})`).join('\n')}

Hãy đưa ra đánh giá tóm tắt và lời khuyên hành động tiếp theo cho cán bộ Tổ CNSCĐ.`;

    if (genAI) {
      try {
        const response = await genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });
        if (response.text) return response.text.trim();
      } catch (e) {
        console.warn('AI summarize fallback', e);
      }
    }

    const completed = tasks.filter(t => t.status === 'HOAN_THANH' || t.status === 'DONG').length;
    return `Đối tượng ${target.name} thuộc nhóm ${target.group}, hiện có ${tasks.length} đầu việc (${completed} việc đã hoàn thành). Cần tiếp tục duy trì đôn đốc và theo dõi định kỳ để đảm bảo đối tượng duy trì thói quen tự thao tác trên nền tảng số.`;
  }

  // 4. Tạo báo cáo tuần / tháng chuẩn hành chính công
  public async generatePeriodicReport(tasks: Task[], requests: SupportRequest[], period: string): Promise<AIReportSummary> {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'HOAN_THANH' || t.status === 'DONG').length;
    const overdueTasks = tasks.filter(t => t.status === 'QUA_HAN').length;
    const totalRequests = requests.length;

    const prompt = `Soạn thảo báo cáo tiến độ công tác Chuyển đổi số của Tổ CNSCĐ cho kỳ báo cáo: ${period}.
Số liệu:
- Tổng số yêu cầu tiếp nhận: ${totalRequests}
- Tổng số công việc triển khai: ${totalTasks}
- Số việc hoàn thành: ${completedTasks} (Tỷ lệ: ${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%)
- Số việc chậm/quá hạn: ${overdueTasks}
- Các đầu việc tiêu biểu: ${tasks.slice(0, 5).map(t => t.title).join('; ')}

Yêu cầu trả về JSON:
{
  "executiveSummary": "Đoạn văn tóm tắt chung chuẩn văn phong hành chính điều hành",
  "keyAchievements": ["Kết quả nổi bật 1", "Kết quả nổi bật 2", "Kết quả nổi bật 3"],
  "bottlenecks": ["Khó khăn vướng mắc 1", "Khó khăn 2"],
  "nextWeekActionPlan": ["Nhiệm vụ trọng tâm 1", "Nhiệm vụ trọng tâm 2"]
}`;

    if (genAI) {
      try {
        const response = await genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        });
        if (response.text) {
          return JSON.parse(response.text.trim());
        }
      } catch (e) {
        console.warn('AI report fallback', e);
      }
    }

    return {
      executiveSummary: `Trong kỳ ${period}, Tổ CNSCĐ đã bám sát địa bàn, tiếp nhận ${totalRequests} yêu cầu từ nhân dân và tổ chức; điều hành xử lý ${totalTasks} đầu việc, trong đó hoàn thành ${completedTasks} việc (đạt ${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%). Đã tập trung hỗ trợ các nhóm trọng điểm: Hộ kinh doanh triển khai hóa đơn máy tính tiền và công dân kích hoạt VNeID mức 2.`,
      keyAchievements: [
        `Giải quyết dứt điểm ${completedTasks} nhiệm vụ hỗ trợ chuyển đổi số trên địa bàn`,
        `100% yêu cầu của người dân được phân loại và giao việc có người phụ trách rõ ràng`,
        `Hình thành thói quen kiểm tra thực tế và lưu trữ bằng chứng trước khi đóng hồ sơ`
      ],
      bottlenecks: [
        overdueTasks > 0 ? `Còn ${overdueTasks} công việc quá hạn do một số đối tượng người cao tuổi đi lại khó khăn` : 'Một số hộ kinh doanh còn e ngại thủ tục khai thuế điện tử ban đầu',
        'Kỹ năng số của người cao tuổi cần thời gian kèm cặp nhiều lần'
      ],
      nextWeekActionPlan: [
        'Tập trung đôn đốc và hoàn tất các đầu việc quá hạn còn tồn đọng',
        'Phối hợp Hội Phụ nữ và Đoàn thanh niên mở rộng đợt tuyên truyền phòng chống lừa đảo trực tuyến',
        'Tiếp tục cập nhật số hóa hồ sơ đối tượng trên toàn địa bàn khu phố'
      ]
    };
  }
}

export const aiService = new AIService();
