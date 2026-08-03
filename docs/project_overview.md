# CubeNexus Frontend - Project Overview

Chào mừng bạn đến với tài liệu tổng quan dự án **CubeNexus Frontend** (SU26SE065_CUBENEXUS_FE). File này được thiết kế để lưu trữ thông tin cấu trúc cốt lõi, giúp AI nhanh chóng hiểu dự án và tiết kiệm token trong mỗi phiên làm việc.

---

## 🛠️ Công Nghệ & Thư Viện Core

Dự án được xây dựng bằng các công nghệ hiện đại sau:

- **Framework**: [Next.js v16.2.6 (App Router)](https://nextjs.org/) với React 19.
- **Styling**: [Tailwind CSS v4.2.0](https://tailwindcss.com/) & PostCSS.
- **Ngôn ngữ**: TypeScript 5.7.3.
- **UI Components**: Tích hợp các primitive của [Radix UI](https://www.radix-ui.com/) và hệ thống component của **shadcn/ui**.
- **Form Management**: [React Hook Form](https://react-hook-form.com/) & xác thực dữ liệu qua [Zod](https://zod.dev/).
- **Charts**: [Recharts](https://recharts.org/) để vẽ biểu đồ thống kê.
- **Icons**: [Lucide React](https://lucide.dev/).
- **Quản lý Package**: Dự án sử dụng `pnpm` hoặc `npm` (có cả `package-lock.json` và `pnpm-lock.yaml`).

---

## 📁 Cấu Trúc Thư Mục & Định Hướng Routing

```text
SU26SE065_CUBENEXUS_FE/
├── app/                  # Next.js App Router (Các trang & Global CSS)
│   ├── arena/            # Đấu trường speedcubing 1v1 trực tuyến
│   ├── community/        # Cộng đồng speedcuber
│   ├── judge/            # Module trọng tài / giám sát trận đấu
│   ├── login/            # Trang Đăng nhập
│   ├── practice/         # Chế độ tự luyện tập
│   ├── rankings/         # Bảng xếp hạng người chơi
│   ├── signup/           # Trang Đăng ký
│   ├── tournaments/      # Quản lý & Tham gia giải đấu
│   ├── globals.css       # File style global của Tailwind v4
│   ├── layout.tsx        # Layout gốc toàn hệ thống (cấu hình Font Geist, SEO Metadata)
│   └── page.tsx          # Landing page chính của CubeNexus
├── components/           # Các Component dùng chung toàn dự án
│   ├── ui/               # Danh sách 57+ UI Primitives từ shadcn/ui (Button, Dialog, Input, Table...)
│   ├── header.tsx        # Thanh điều hướng đầu trang
│   ├── footer.tsx        # Chân trang thông tin
│   ├── theme-provider.tsx# Cấu hình đổi giao diện Dark/Light Mode
│   └── ...               # Các component section (hero, stats, features, flows...)
├── hooks/                # Custom React Hooks
├── lib/                  # Helper functions & Utilities
│   └── utils.ts          # Chứa hàm `cn` gộp class Tailwind (clsx + tailwind-merge)
├── public/               # Static files (ảnh, icons, v.v.)
├── components.json       # File cấu hình shadcn/ui
├── next.config.ts        # Next.js Configuration
├── package.json          # Danh sách dependencies & scripts
└── tsconfig.json         # Cấu hình TypeScript compiler
```

---

## 🧭 Các Đường Dẫn Chính (Routing Map)

| Đường Dẫn (Route) | Mục Đích | Component/Trang Tương Ứng |
| :--- | :--- | :--- |
| `/` | Trang chủ (Landing Page) giới thiệu CubeNexus | `app/page.tsx` |
| `/login` | Trang Đăng nhập hệ thống | `app/login/` |
| `/signup` | Trang Đăng ký tài khoản mới | `app/signup/` |
| `/arena` | Đấu trường thi đấu Rubik trực tiếp | `app/arena/` |
| `/practice` | Tự luyện tập bấm giờ và lưu kết quả | `app/practice/` |
| `/tournaments` | Danh sách & Chi tiết giải đấu | `app/tournaments/` |
| `/rankings` | Bảng xếp hạng Speedcuber thế giới | `app/rankings/` |
| `/community` | Diễn đàn & Hoạt động cộng đồng | `app/community/` |
| `/judge` | Cổng thông tin & Công cụ cho trọng tài | `app/judge/` |

---

## 🎨 Design System & Customization

- **Dark & Light Mode**: Tích hợp sẵn `next-themes` và `theme-provider.tsx` giúp quản lý giao diện sáng/tối dễ dàng.
- **Font**: Sử dụng font mặc định `Geist` và `Geist_Mono` từ Google Fonts (được import trong `app/layout.tsx`).
- **Tailwind v4**: Sử dụng `@tailwindcss/postcss` mới nhất. Các class cấu hình hoặc mở rộng màu sắc, biến CSS sẽ được khai báo trực tiếp qua CSS variables trong [app/globals.css](file:///d:/kì 9/do an/SU26SE065_CUBENEXUS_FE/app/globals.css).

---

*Tài liệu này sẽ được tự động đọc bởi AI khi bắt đầu hội thoại để hiểu ngữ cảnh dự án một cách nhanh nhất.*
