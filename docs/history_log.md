# Tổng Hợp Lịch Sử Thay Đổi CubeNexus FE & BE

Tài liệu này lưu trữ lịch sử các vấn đề đã được giải quyết, các file đã chỉnh sửa và các cập nhật mới nhất cho cả Front-End và Back-End để AI đọc nhanh trong các phiên sau.

---

## 🏆 Phiên Làm Việc: Bảo Mật Route & Dropdown Profile (18/06/2026)

### 1. File Đã Chỉnh Sửa Trong FE (`SU26SE065_CUBENEXUS_FE/`)
* **[app/login/components/LoginForm.tsx](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/app/login/components/LoginForm.tsx):**
  * *Chỉnh sửa:* Chuyển hướng sau khi đăng nhập thành công về `/` (Trang chủ) thay vì `/tournaments`.
* **[app/login/page.tsx](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/app/login/page.tsx):**
  * *Chỉnh sửa:* Người dùng đã đăng nhập khi cố truy cập `/login` sẽ bị redirect về `/` (Trang chủ).
* **[components/header.tsx](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/components/header.tsx):**
  * *Chỉnh sửa:* 
    * Thêm hiển thị avatar profile.
    * Tích hợp dropdown menu mở khi hover chuột (`onMouseEnter`/`onMouseLeave`).
    * Thêm class `pt-2` (invisible bridge) cho absolute menu để tránh lỗi bị biến mất dropdown menu khi di chuột từ avatar xuống.
    * Ẩn badge vai trò nếu user là `COMPETITOR`.
* **[app/tournaments/page.tsx](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/app/tournaments/page.tsx):**
  * *Chỉnh sửa:* Loại bỏ check role guest cũ, thay đổi tab "My Tournaments" (quản lý/admin thấy link đi tới Manager Portal, competitor thấy solver ticket & QR code).
* **Các trang bảo vệ (Route Guards):**
  * Đưa logic kiểm tra đăng nhập (`isAuthenticated`) xuống dưới các React Hook để tránh lỗi **React Rules of Hooks** (gây trắng trang) tại:
    * [app/arena/page.tsx](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/app/arena/page.tsx)
    * [app/rankings/page.tsx](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/app/rankings/page.tsx)
    * [app/practice/page.tsx](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/app/practice/page.tsx)
    * [app/community/page.tsx](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/app/community/page.tsx)

### 2. Các Vấn Đề Lưu Ý Khác
* **Mô hình Rubik 3D trên Login:** Dùng CSS 3D Transform thuần, vô cùng nhẹ, không giật lag.
* **Lỗi DOM `bis_skin_checked="1"`:** Do Chrome Extension bên thứ ba inject vào, không phải lỗi code, bỏ qua được.


## 🏆 Phiên Làm Việc: Sửa Lỗi Giao Diện & Thêm Tone Màu Manager Portal (18/06/2026)

### 1. File Đã Chỉnh Sửa Trong FE (`SU26SE065_CUBENEXUS_FE/`)
* **[app/managertournaments/layout.tsx](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/app/managertournaments/layout.tsx):**
  * *Chỉnh sửa:* Chuyển từ `fixed` sidebar sang side-by-side flex layout. Toggling sidebar sẽ thay đổi chiều rộng (`w-64` thành `w-[72px]`) giúp phần content bên phải tự động co giãn thay vì bị đè.
  * *Chỉnh sửa:* Định nghĩa bộ CSS variables màu sắc locally cho Manager Portal (Tone màu trung tính Slate-Gray và accent màu Indigo/Violet).
* **[app/managertournaments/page.tsx](file:///d:/kì%209/do an/SU26SE065_CUBENEXUS_FE/app/managertournaments/page.tsx):**
  * *Chỉnh sửa:* Cập nhật các card thống kê, bộ lọc, thanh tìm kiếm sử dụng CSS variables và accent màu Indigo/Violet.
* **[components/tournament-manager/TournamentTable.tsx](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/components/tournament-manager/TournamentTable.tsx):**
  * *Chỉnh sửa:* Thay thế các class cứng light mode (`bg-white`, `border-slate-200`) bằng các class semantic (`bg-card`, `border-border`) để tự động áp dụng tone màu trung tính mới.
* **[components/tournament-manager/CreateTournamentModal.tsx](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/components/tournament-manager/CreateTournamentModal.tsx):**
  * *Chỉnh sửa:* Đồng bộ giao diện modal tạo tournament sang tone màu trung tính và focus border màu Indigo/Violet.

### 2. Kết Quả Xác Minh
* Sidebar hoạt động mượt mà, không bị tách rời hay đè giao diện.
* Giao diện Manager Portal có tone màu trung tính sang trọng, chuyên nghiệp và khác biệt hoàn toàn với trang player.

---

## 🏆 Phiên Làm Việc: Mở Rộng Sidebar Điều Hướng & Đồng Bộ Giao Diện Tournament Manager (19/06/2026)

### 1. File Đã Chỉnh Sửa Trong FE (`SU26SE065_CUBENEXUS_FE/`)
* **[app/managertournaments/layout.tsx](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/app/managertournaments/layout.tsx):**
  * *Chỉnh sửa:* Tự động nhận diện tournament ID từ đường dẫn (URL) để hiển thị thêm menu con "Tournament Administration" trong Sidebar khi quản lý một giải đấu cụ thể.
* **[components/tournament-manager/DashboardCard.tsx](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/components/tournament-manager/DashboardCard.tsx):**
  * *Chỉnh sửa:* Cập nhật style background của card và overlay các màu nhấn (emerald, red, yellow, blue, purple) dựa trên các biến CSS theme trung tính.
* **Các subpage thuộc `/managertournaments/[id]`:**
  * Thay đổi toàn bộ class cứng light mode (như `bg-white`, `border-slate-200`, `text-slate-900`) thành các biến CSS variables locally (`bg-card`, `border-border`, `text-foreground`, `bg-muted/20`, v.v.) để đồng bộ giao diện theo tone màu trung tính Slate-Gray & Indigo:
    * **Overview page** ([app/managertournaments/[id]/page.tsx](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/app/managertournaments/[id]/page.tsx))
    * **Registrations page** ([app/managertournaments/[id]/registrations/page.tsx](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/app/managertournaments/[id]/registrations/page.tsx))
    * **Events & Cutoffs page** ([app/managertournaments/[id]/events/page.tsx](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/app/managertournaments/[id]/events/page.tsx))
    * **Groups & Scrambles page** ([app/managertournaments/[id]/groups/page.tsx](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/app/managertournaments/[id]/groups/page.tsx))
    * **Live Operations page** ([app/managertournaments/[id]/live/page.tsx](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/app/managertournaments/[id]/live/page.tsx))
    * **Disputes & Audits page** ([app/managertournaments/[id]/disputes/page.tsx](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/app/managertournaments/[id]/disputes/page.tsx))

### 2. Kết Quả Xác Minh
* Đăng nhập tài khoản Manager và truy cập giải đấu thành công.
* Thanh Sidebar tự động nhận diện ID và hiển thị đầy đủ 6 trang quản trị trực quan.
* Toàn bộ 6 trang con được định hình layout và CSS variables hoàn chỉnh, có giao diện đồng bộ, hiển thị mượt mà.

---

*(Tài liệu này sẽ liên tục được cập nhật các thay đổi mới nhất ở các phiên tiếp theo)*
