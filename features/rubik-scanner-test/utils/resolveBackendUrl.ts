/**
 * resolveBackendUrl — trả về URL backend thích hợp cho scanner.
 *
 * Khi chạy trên máy local (localhost / 127.0.0.1):
 *   → trỏ thẳng tới C# backend port 5212, bỏ qua Next.js dev proxy.
 *   → Giống hệt cách Sandbox /online/sandbox hoạt động.
 *   → Tránh được lớp proxy Node.js gây thêm latency khi upload ảnh.
 *
 * Khi chạy trên Production (hostname khác):
 *   → trả về '' (chuỗi rỗng) để fetch dùng relative URL.
 *   → Nginx / reverse proxy của server thật sẽ xử lý cực nhanh (C/C++).
 *
 * Ưu tiên theo thứ tự:
 *   1. Tham số `override` truyền vào (nếu khác rỗng).
 *   2. localStorage['sandbox_backend_url'] (cùng key với Sandbox page).
 *   3. Mặc định 'http://localhost:5212' nếu đang ở localhost.
 *   4. '' (empty) nếu không phải localhost → dùng relative URL.
 */
export function resolveBackendUrl(override?: string): string {
  if (override) return override;

  if (typeof window === 'undefined') return '';

  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (!isLocal) return '';

  return localStorage.getItem('sandbox_backend_url') ?? 'http://localhost:5212';
}
