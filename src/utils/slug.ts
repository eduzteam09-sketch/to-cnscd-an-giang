import { AN_GIANG_WARDS_102 } from '../mock/anGiangData';
import { WardInfo } from '../types';

/**
 * Chuyển tên phường/xã/đặc khu thành URL slug chuẩn không dấu, chữ thường, không khoảng trắng
 * Ví dụ: "Xã An Phú" -> "xaanphu"
 *        "Phường Long Xuyên" -> "phuonglongxuyen"
 *        "Đặc khu Phú Quốc" -> "dackhuphuquoc"
 */
export function toWardSlug(wardNameOrId: string): string {
  if (!wardNameOrId) return '';
  return wardNameOrId
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Tìm đơn vị hành chính theo slug URL
 * Hỗ trợ cả:
 * - Slug liền: "xaanphu"
 * - Slug gạch nối: "xa-an-phu"
 * - ID đơn vị: "ag-xa-an-phu-001"
 */
export function findWardBySlug(slug: string, wards: WardInfo[] = AN_GIANG_WARDS_102): WardInfo | undefined {
  if (!slug) return undefined;
  const clean = toWardSlug(slug);
  return wards.find(w => toWardSlug(w.name) === clean || toWardSlug(w.id) === clean);
}

export type RouteInfo =
  | { type: 'CITIZEN' }
  | { type: 'ADMIN' }
  | { type: 'WARD'; ward: WardInfo; slug: string }
  | { type: 'NOT_FOUND'; slug: string };

/**
 * Phân tích pathname URL thành loại trang tương ứng
 */
export function parseCurrentRoute(
  rawPath: string = (typeof window !== 'undefined' ? window.location.pathname : '/'),
  wards: WardInfo[] = AN_GIANG_WARDS_102
): RouteInfo {
  // Strip query string and hash
  let clean = rawPath.split('?')[0].split('#')[0].replace(/^\/+|\/+$/g, '').toLowerCase();

  // If path is empty, check hash fallback (e.g. #/xaanphu or #admin)
  if (!clean && typeof window !== 'undefined' && window.location.hash) {
    clean = window.location.hash.replace(/^#\/?/, '').split('?')[0].replace(/^\/+|\/+$/g, '').toLowerCase();
  }

  // Also check query param fallback e.g. ?page=admin or ?ward=xaanphu
  if (!clean && typeof window !== 'undefined' && window.location.search) {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page') || params.get('ward') || params.get('p');
    if (pageParam) {
      clean = pageParam.replace(/^\/+|\/+$/g, '').toLowerCase();
    }
  }

  // 1. Root domain / -> Cổng hỗ trợ người dân & doanh nghiệp (Không cần đăng nhập, không nút cán bộ)
  if (clean === '' || clean === 'index.html' || clean === 'citizen') {
    return { type: 'CITIZEN' };
  }

  // 2. /admin -> Trang quản lý tổng Tỉnh An Giang (102 Phường/Xã)
  if (clean === 'admin' || clean === 'super-admin' || clean === 'tinh') {
    return { type: 'ADMIN' };
  }

  // 3. /[tên phường/xã/đặc khu] -> Trang Tổ CNSCĐ của từng phường/xã (Ví dụ: /xaanphu)
  const matchedWard = findWardBySlug(clean, wards);
  if (matchedWard) {
    return { type: 'WARD', ward: matchedWard, slug: clean };
  }

  return { type: 'NOT_FOUND', slug: clean };
}
