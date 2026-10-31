# Hệ thống quản lý thiết bị phòng học

## Mô tả đề tài
Ứng dụng web quản lý thiết bị phòng học: xem, thêm, cập nhật, xóa, tìm kiếm thiết bị và theo dõi tình trạng sử dụng.

## Công nghệ sử dụng
React (Vite), Node.js, Express, MongoDB Atlas, Git/GitHub, Docker, Docker Hub, Render.

## Cấu trúc dự án
```
├── backend/    # Node.js + Express API
├── frontend/   # React
├── README.md
└── .gitignore
```

## Hướng dẫn cài đặt và chạy

### Yêu cầu
- Node.js 20 trở lên
- Tài khoản MongoDB Atlas (database `235709_NguyenVietTien`, collection `devices`)

### Chạy backend (local)
```bash
cd backend
npm install
cp .env.example .env      # điền MONGODB_URI thật
npm run dev
```
Backend chạy tại http://localhost:5000 (kiểm tra: http://localhost:5000/health).

### Chạy frontend (local)
```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:5000
npm run dev
```
Frontend chạy tại http://localhost:5173 (cần chạy backend trước).

## Chạy backend bằng Docker
```bash
cd backend
cp .env.example .env      # điền MONGODB_URI thật
docker build -t nguyenviettien235709/backend .
docker run -p 5000:5000 --env-file .env nguyenviettien235709/backend
```
Hoặc dùng image có sẵn từ Docker Hub:
```bash
docker pull nguyenviettien235709/backend
docker run -p 5000:5000 --env-file .env nguyenviettien235709/backend
```
File `.env` không được đóng vào image, các biến môi trường được truyền khi chạy container bằng `--env-file`.

Docker Hub: https://hub.docker.com/r/nguyenviettien235709/backend

## Chạy frontend bằng Docker
```bash
cd frontend
docker build -t nguyenviettien235709/frontend .
docker run -p 3000:80 -e API_URL=http://localhost:5000 nguyenviettien235709/frontend
```
Hoặc dùng image có sẵn từ Docker Hub:
```bash
docker pull nguyenviettien235709/frontend
docker run -p 3000:80 -e API_URL=http://localhost:5000 nguyenviettien235709/frontend
```
Truy cập http://localhost:3000. Biến môi trường `API_URL` là địa chỉ backend, được áp dụng khi container khởi động nên không cần build lại image khi đổi địa chỉ.

Docker Hub: https://hub.docker.com/r/nguyenviettien235709/frontend

## Triển khai trên Render
Cả hai dịch vụ được triển khai từ Docker image trên Docker Hub.

| Dịch vụ | Image | URL |
|---|---|---|
| Frontend (`web-235709`) | `nguyenviettien235709/frontend:latest` | https://web-235709.onrender.com |
| Backend API (`api-235709`) | `nguyenviettien235709/backend:latest` | https://api-235709.onrender.com |

Kiểm tra backend: https://api-235709.onrender.com/health và https://api-235709.onrender.com/api/devices

Biến môi trường:
- Backend: `MONGODB_URI` (chuỗi kết nối MongoDB Atlas), `CORS_ORIGIN` (URL frontend)
- Frontend: `API_URL` (URL backend), `PORT=80`

Lưu ý: gói Free của Render tự "ngủ" khi không có truy cập, lần mở đầu tiên có thể chậm khoảng 50 giây.