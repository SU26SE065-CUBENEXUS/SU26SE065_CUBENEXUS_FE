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

# Tóm Tắt Công Việc — CubeNexus FE (Tournament Manager)

## Tổng Quan
Toàn bộ công việc tập trung vào **Frontend (FE only)** của dự án CubeNexus — vai trò **Tournament Manager**. Không thay đổi Backend.

---

## 1. Tạo Component `DateTimeInput`
**File:** [`components/tournament-manager/DateTimeInput.tsx`](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/components/tournament-manager/DateTimeInput.tsx)

- Component nhập ngày giờ kép: hỗ trợ **gõ tay** (định dạng `YYYY-MM-DD HH:mm` hoặc `DD/MM/YYYY HH:mm`) **và** chọn qua trình duyệt date-picker.
- Có icon lịch để mở date-picker tích hợp.
- Validate và chuyển đổi sang chuỗi ISO (`string`) khi blur.

---

## 2. Cập Nhật Modal Tạo Giải Đấu
**File:** [`components/tournament-manager/CreateTournamentModal.tsx`](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/components/tournament-manager/CreateTournamentModal.tsx)

- Thay thế `<input type="datetime-local">` bằng component `DateTimeInput` mới.
- Thêm **validate toàn diện** khi submit:
  - Tên giải đấu không được rỗng.
  - Ngày kết thúc phải sau ngày bắt đầu.
  - Ngày đăng ký đóng phải sau ngày mở đăng ký.
  - Ngày mở đăng ký phải trước ngày bắt đầu giải.
  - Sự kiện Medley phải có ít nhất 2 loại Puzzle.
- Thay thế tất cả thông báo lỗi nội tuyến (banner đỏ) bằng **toast notification** (`lib/toast.ts`).

---

## 3. Refactor Trang Events & Cutoffs
**File:** [`app/managertournaments/[id]/events/page.tsx`](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/app/managertournaments/[id]/events/page.tsx)

- Thay toàn bộ thông báo lỗi nội tuyến bằng `toast`.
- Thêm validate cho input Seed Time (phải là số nguyên dương, tính bằng ms).
- **Xử lý trạng thái đóng đăng ký (Close Registration):**
  - Thêm state `isClosed` lưu vào `localStorage` theo từng `event.id`.
  - Sau khi đóng đăng ký thành công, nút **"Close Reg."** tự chuyển sang màu xanh lá + nhãn **"Registration Closed"** và bị vô hiệu hóa.
  - Trạng thái được giữ nguyên kể cả sau khi reload trang (nhờ `localStorage`).

---

## 4. Refactor Trang Group & Heat Management
**File:** [`app/managertournaments/[id]/groups/page.tsx`](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/app/managertournaments/[id]/groups/page.tsx)

- Thay toàn bộ thông báo lỗi nội tuyến bằng `toast`.
- Thêm validate đầu vào cho:
  - Round Number (phải là số nguyên dương).
  - Group Size (phải là số nguyên dương).
  - Station Count (phải là số nguyên dương).
  - Advance Count (phải là số nguyên dương).
- **Sửa lỗi render crash:** Thay icon `CheckCircle2` (đã bị xoá khỏi `lucide-react` phiên bản mới) bằng `CheckCircle` trên nút **Complete Round**.

---

## 5. Refactor Trang Overview (Tổng Quan Giải Đấu)
**File:** [`app/managertournaments/[id]/page.tsx`](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/app/managertournaments/[id]/page.tsx)

- Thay toàn bộ thông báo lỗi nội tuyến bằng `toast`.
- **Sửa lỗi render crash:** Thay icon `CheckCircle2` (deprecated) bằng `CheckCircle` trên nút **Complete Tournament**.

---

## 6. Refactor Trang Disputes
**File:** [`app/managertournaments/[id]/disputes/page.tsx`](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/app/managertournaments/[id]/disputes/page.tsx)

- Thay thông báo lỗi nội tuyến bằng `toast`.

---

## 7. Phân Tích Luồng Nghiệp Vụ — Close Registration

### Trả Lời Câu Hỏi Của Bạn

| Câu hỏi | Kết quả phân tích |
|---|---|
| Sau khi Close Reg thì giao diện hiện gì? | Nút chuyển sang màu xanh lá, nhãn "Registration Closed", bị disabled — đã được implement |
| Thao tác tiếp theo là gì? | Đến tab **Group & Heat** → Generate Groups → Generate Scrambles → Start Round |
| Có API mở lại đăng ký không? | **Không.** Backend chỉ có API đóng, không có API mở lại (`CLOSED` là trạng thái cuối cùng) |

---

## 8. Sửa Lỗi Render Crash — Group & Heat

### Nguyên Nhân
Icon `CheckCircle2` bị **xoá hoàn toàn** khỏi `lucide-react >= 0.5xx`. Khi React render component `EventGroupPanel` (mở accordion), nó cố render `undefined` → sập luồng commit DOM.

### Files Đã Sửa
| File | Thay đổi |
|---|---|
| [`groups/page.tsx`](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/app/managertournaments/[id]/groups/page.tsx) | `CheckCircle2` → `CheckCircle` (import + JSX) |
| [`[id]/page.tsx`](file:///d:/kì%209/do%20an/SU26SE065_CUBENEXUS_FE/app/managertournaments/[id]/page.tsx) | `CheckCircle2` → `CheckCircle` (import + JSX) |

---

## Danh Sách Files Đã Chỉnh Sửa

| File | Loại thay đổi |
|---|---|
| `components/tournament-manager/DateTimeInput.tsx` | Tạo mới |
| `components/tournament-manager/CreateTournamentModal.tsx` | Cập nhật |
| `app/managertournaments/[id]/events/page.tsx` | Cập nhật |
| `app/managertournaments/[id]/groups/page.tsx` | Cập nhật + sửa lỗi |
| `app/managertournaments/[id]/page.tsx` | Cập nhật + sửa lỗi |
| `app/managertournaments/[id]/disputes/page.tsx` | Cập nhật |
# Nhật Ký Phát Triển Dự Án CubeNexus

Tài liệu này lưu trữ lịch sử sửa lỗi, cấu hình hệ thống và hướng dẫn vận hành dự án CubeNexus (bao gồm Backend .NET, Frontend Next.js và Database Postgres qua Docker).

---

## 📅 Nhật Ký Cập Nhật & Sửa Lỗi

### 1. Khắc phục lỗi kết nối Frontend - Backend (ECONNREFUSED)
* **Thời gian:** 28/06/2026
* **Triệu chứng:** Frontend báo lỗi `Failed to proxy http://127.0.0.1:5212/api/tournaments Error: connect ECONNREFUSED 127.0.0.1:5212` mặc dù Backend đã chạy.
* **Nguyên nhân:** 
  * Cấu hình proxy ở frontend chuyển tiếp request tới địa chỉ IP cứng `127.0.0.1:5212`.
  * Trong khi đó, Backend khởi chạy trên Windows lắng nghe qua `localhost:5212` (mặc định phân giải sang IPv6 `[::1]:5212`), dẫn đến việc gọi IPv4 bị từ chối kết nối.
* **Giải pháp:** 
  * Cập nhật file cấu hình [next.config.ts](file:///d:/k%C3%AC%209/do%20an/SU26SE065_CUBENEXUS_FE/next.config.ts), thay đổi đích đến (destination) của rewrite từ `http://127.0.0.1:5212` thành `http://localhost:5212`.
  * Khởi động lại Frontend dev server (`npm run dev`) để cập nhật cấu hình proxy.

### 2. Cấu hình pgAdmin kết nối Database trong Docker
* **Thời gian:** 28/06/2026
* **Triệu chứng:** Không đăng nhập được vào giao diện pgAdmin hoặc đăng nhập được nhưng không kết nối được tới Database Postgres.
* **Nguyên nhân:**
  * Đăng nhập sai tài khoản quản trị pgAdmin mặc định.
  * Sử dụng địa chỉ `localhost` hoặc `127.0.0.1` làm Host của PostgreSQL khi khai báo trong pgAdmin container. Vì pgAdmin chạy trong một container cô lập, `localhost` trỏ về chính nó chứ không trỏ về container Database.
* **Giải pháp:**
  * Sử dụng thông tin đăng nhập pgAdmin từ file [docker-compose.yml](file:///d:/k%C3%AC%209/do%20an/SU26SE065_CUBENEXUS_BE/docker-compose.yml):
    * **Email:** `admin@cubenexus.com`
    * **Password:** `admin123`
  * Khi đăng ký Server mới trong pgAdmin, cấu hình như sau:
    * **Host name/address:** `cubenexus-db` (Tên service/container của Postgres trong docker-compose)
    * **Port:** `5432` (Cổng nội bộ bên trong mạng Docker)
    * **Username:** `cubenexus`
    * **Password:** `123456`

---

## 🛠️ Hướng Dẫn Vận Hành Dự Án

### Bước 1: Khởi động Docker Database & pgAdmin
Di chuyển vào thư mục Backend chứa file `docker-compose.yml` và chạy lệnh:
```bash
docker-compose up -d
```
* **Database (Postgres):** Lắng nghe ở cổng `5433` trên máy chủ (Host), cổng `5432` nội bộ Docker.
* **pgAdmin:** Truy cập tại địa chỉ **`http://localhost:5050`**.

### Bước 2: Khởi động Backend (.NET API)
Di chuyển vào thư mục [CubeNexus.API](file:///d:/k%C3%AC%209/do%20an/SU26SE065_CUBENEXUS_BE/CubeNexus.API) và khởi chạy:
```bash
dotnet run
```
* API sẽ lắng nghe tại: **`http://localhost:5212`**
* Tài liệu Swagger: **`http://localhost:5212/swagger`**

### Bước 3: Khởi động Frontend (Next.js)
Di chuyển vào thư mục [SU26SE065_CUBENEXUS_FE](file:///d:/k%C3%AC%209/do%20an/SU26SE065_CUBENEXUS_FE) và chạy:
```bash
npm run dev
```
* Giao diện web chạy tại: **`http://localhost:3000`**

---

## 📌 Các File Cấu Hình Quan Trọng

1. **Cấu hình kết nối DB của BE:** [appsettings.json](file:///d:/k%C3%AC%209/do%20an/SU26SE065_CUBENEXUS_BE/CubeNexus.API/appsettings.json)
2. **Cấu hình Docker Compose:** [docker-compose.yml](file:///d:/k%C3%AC%209/do%20an/SU26SE065_CUBENEXUS_BE/docker-compose.yml)
3. **Cấu hình Proxy của FE:** [next.config.ts](file:///d:/k%C3%AC%209/do%20an/SU26SE065_CUBENEXUS_FE/next.config.ts)
