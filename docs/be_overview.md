# BẢN TÓM TẮT THÔNG TIN BACKEND (BE OVERVIEW - CUBENEXUS)

Tài liệu này tổng hợp toàn bộ kiến trúc, API và cấu trúc dữ liệu chính của dự án Backend (**CubeNexus.API** viết bằng .NET Core). Khi bắt đầu một phiên chat mới, bạn có thể gửi kèm file này để tôi (hoặc các AI Agent khác) nắm bắt toàn bộ ngữ cảnh Backend mà không cần phải quét qua toàn bộ thư mục code nguồn của BE, giúp tiết kiệm tối đa Token.

---

## 1. Cấu Trúc Tổng Quan Của Backend
Backend được thiết kế theo mô hình **Clean Architecture** gồm 4 Layer chính:
* **CubeNexus.API:** Nơi định nghĩa các Controllers (API Endpoints), SignalR Hubs (kết nối thời gian thực), các Middleware, và cấu hình `Program.cs`.
* **CubeNexus.Application:** Chứa Interfaces (Services, Repositories), DTOs (Data Transfer Objects), Business Logic (Services) và Command/Query (nếu dùng CQRS).
* **CubeNexus.Domain:** Định nghĩa các thực thể (Entities), Enum, Domain Exceptions và quy tắc nghiệp vụ cốt lõi.
* **CubeNexus.Infrastructure:** Cài đặt Database Context (Entity Framework Core), Repositories, kết nối Database (SQL Server/PostgreSQL), các dịch vụ bên ngoài (JWT, Mail...).

---

## 2. Danh Sách Các Controllers & Chức Năng (API Endpoints)
Dưới đây là các Controller nằm trong `CubeNexus.API/Controllers/` và nhiệm vụ của chúng:

### 🔑 AuthController (`api/Auth`)
* **`POST /register`:** Đăng ký tài khoản mới.
* **`POST /login`:** Đăng nhập hệ thống (Trả về `AccessToken`, `RefreshToken`, thông tin người dùng và vai trò - `Role`).
* **`POST /refresh-token`:** Làm mới Access Token đã hết hạn bằng Refresh Token.

### 🏆 TournamentController (`api/Tournament`)
* Quản lý danh sách giải đấu hiển thị cho người chơi (Competitor).
* Các API lấy thông tin giải đấu đang diễn ra, giải đấu sắp tới, chi tiết giải đấu.

### ✍️ TournamentRegistrationController (`api/TournamentRegistration`)
* Đăng ký tham gia giải đấu cho Competitor.
* Kiểm tra trạng thái đăng ký, lấy danh sách người chơi đã đăng ký thành công của một giải đấu.

### 🛠️ TournamentManagementController (`api/TournamentManagement`)
* Dành cho **Manager** và **Admin** để quản lý giải đấu.
* Tạo giải đấu mới, chỉnh sửa thông tin giải đấu, phê duyệt đăng ký của Competitor.

### ⚔️ TournamentOperationController (`api/TournamentOperation`)
* Quản lý vận hành giải đấu trực tiếp: Tạo nhánh đấu (Bracket), sắp xếp trận đấu (Matches), cập nhật kết quả trận đấu, xử lý lượt chơi (Attempts).
* Đây là Controller lớn nhất chứa các logic tính toán lượt giải Rubik (solve times, penalty +2, DNF, v.v.).

### 📊 LiveBoardController (`api/LiveBoard`)
* Cung cấp dữ liệu bảng xếp hạng trực tiếp (Live Leaderboard) trong các giải đấu đang diễn ra.

### 📶 Hubs (SignalR WebSockets)
* **LiveBoardHub / ArenaHub:** Đẩy dữ liệu thời gian thực (real-time) về solve times, trạng thái trận đấu, và chat trực tiếp từ server xuống client (FE).

### 🥋 PracticeController (`api/Practice`)
* Cung cấp các công cụ luyện tập cá nhân (tạo chuỗi xáo trộn - Scramble, lưu kết quả giải Rubik cá nhân, tính toán thống kê Ao5, Ao12).

### 🧩 PuzzleController (`api/Puzzle`)
* Quản lý các loại Rubik (3x3x3, 2x2x2, 4x4x4, One-Handed, v.v.) và các công thức tạo scramble tương ứng.

### 🌐 OnlineArenaController (`api/OnlineArena`)
* Quản lý phòng đấu online tự do (Custom Room) giữa các người chơi (Competitors) với nhau ngoài khuôn khổ giải đấu chính thức.

### 📈 EloSeedingController (`api/EloSeeding`)
* Quản lý điểm rank (Elo) của người chơi và thuật toán xếp hạt giống (Seeding) dựa trên trình độ khi bắt đầu giải đấu.

---

## 3. Các Vai Trò (Roles) Trong Hệ Thống
Hệ thống sử dụng Authorization dựa trên Role được trả về từ JWT:
1. **ADMIN:** Quyền cao nhất, quản lý hệ thống, cấu hình giải đấu toàn cục và tài khoản.
2. **MANAGER:** Tạo và quản lý, vận hành các giải đấu do mình phụ trách.
3. **JUDGE (Trọng tài):** Giám sát các lượt thi đấu, xác nhận kết quả solve times hoặc phạt penalty (+2/DNF).
4. **COMPETITOR (Thí sinh):** Người tham gia thi đấu giải, luyện tập, xem bảng xếp hạng và giao lưu cộng đồng.

---

## 4. Cách Sử Dụng File Này Để Tiết Kiệm Token
* Khi bạn mở một phiên chat mới với AI, hãy đính kèm file này (hoặc chỉ cần nhắc AI đọc file `docs/be_overview.md`).
* AI sẽ lập tức hiểu các Endpoint BE, cấu trúc Role, các Hub SignalR và Logic Nghiệp vụ của dự án mà không cần dùng tool `list_dir` hay `view_file` quét hàng chục file source code C# nữa.
