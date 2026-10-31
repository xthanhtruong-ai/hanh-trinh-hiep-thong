# Hành Trình 27

Một trò chơi cờ tỷ phú trực tuyến lấy 27 đơn vị giáo phận Việt Nam làm các ô địa điểm.

## Chạy trên máy

1. Cài Node.js 20 trở lên.
2. Trong thư mục dự án, chạy lệnh: npm start
3. Mở http://localhost:4173.
4. Tạo phòng, rồi gửi mã phòng hoặc liên kết cho người chơi khác. Cần ít nhất hai người để bắt đầu.

## Chạy trực tuyến

Ứng dụng cần được đưa lên một máy chủ có thể truy cập từ Internet. Máy chủ phục vụ giao diện, giữ trạng thái phòng trong bộ nhớ và đồng bộ lượt chơi qua Server-Sent Events. Các phòng sẽ mất khi máy chủ khởi động lại; bản hiện tại chưa có tài khoản hoặc cơ sở dữ liệu lưu ván.

## Luật và nội dung

- Bàn có 45 ô: 27 ô địa điểm và các ô đặc biệt kiểu Cờ tỷ phú.
- Có mua địa điểm, đấu giá ô bị từ chối mua, thu tiền thuê, xây/bán nhà, thế chấp, thẻ sự kiện, thuế và phá sản.
- Mỗi lượt dùng hai xúc xắc; qua Xuất phát nhận 200; người chơi bị giữ có thể gieo đôi hoặc trả phí.
- Tên 27 giáo phận được nhóm theo ba giáo tỉnh dựa trên danh sách HĐGMVN cập nhật tháng 01/2025: https://hdgmvietnam.com/chi-tiet/cac-giam-muc-va-giao-phan-viet-nam-nam-2017-31165

Đây là bản nền tảng ban đầu để tiếp tục hoàn thiện luật chi tiết, giao dịch, âm thanh và đồ họa.
