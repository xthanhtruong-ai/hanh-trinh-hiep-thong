# Hành Trình 27

Một trò chơi cờ tỷ phú trực tuyến về truyền giáo và gây dựng nhà thờ tại 27 giáo phận Việt Nam.

## Chạy trên máy

1. Cài Node.js 20 trở lên.
2. Trong thư mục dự án, chạy lệnh: npm start
3. Mở http://localhost:4173.
4. Tạo phòng, rồi gửi mã phòng hoặc liên kết cho người chơi khác. Cần ít nhất hai người để bắt đầu.

## Chạy trực tuyến

Ứng dụng cần chạy trên máy chủ Node.js để phục vụ giao diện, giữ trạng thái phòng và đồng bộ lượt chơi qua Server-Sent Events. Repo đã có cấu hình Render trong `render.yaml`.

### Triển khai lên Render

1. Đăng nhập hoặc tạo tài khoản Render, rồi mở [tạo Blueprint mới](https://dashboard.render.com/select-repo?type=iac).
2. Kết nối GitHub nếu Render yêu cầu, chọn repo `xthanhtruong-ai/hanh-trinh-hiep-thong` và nhánh `main`.
3. Kiểm tra Blueprint dùng dịch vụ web Node.js, vùng Singapore và gói Free; chọn **Deploy Blueprint**.
4. Sau khi triển khai hoàn tất, mở URL `onrender.com` của dịch vụ để chơi và chia sẻ liên kết phòng.

Render sẽ tự triển khai các commit mới trên nhánh `main`. Khi người chơi đã vào phòng, trình duyệt gửi health check định kỳ để giữ dịch vụ hoạt động trong lúc chờ lượt. Nếu không có người kết nối, gói Free có thể tạm ngừng dịch vụ sau 15 phút không có lưu lượng và cần khoảng một phút để khởi động lại. Trạng thái phòng hiện chỉ lưu trong bộ nhớ, nên phòng đang chơi sẽ mất nếu máy chủ khởi động lại hoặc triển khai phiên bản mới. [Chi tiết giới hạn gói Free](https://render.com/docs/free).

## Luật và nội dung

- Bàn có 45 ô: 27 ô giáo phận và các ô chức năng được đổi tên theo chủ đề Công giáo.
- Khi đến một giáo phận chưa có ân nhân, người chơi chọn đóng góp theo mức điểm sứ vụ cố định để trở thành ân nhân và xây nhà thờ đầu tiên, hoặc bỏ qua. Không có đấu giá.
- Người chơi đến giáo phận đã có ân nhân được gọi là người đi lễ và đóng góp điểm sứ vụ để duy tu, sửa chữa nhà thờ. Mức đóng góp tăng theo số nhà thờ mà ân nhân đã xây tại giáo phận.
- Mỗi lần dừng tại giáo phận đang đồng hành, ân nhân có thể xây thêm tối đa một nhà thờ. Việc xây thêm tuân theo nhóm màu và quy tắc phát triển cân bằng; mỗi giáo phận tối đa có năm nhà thờ. Nhà thờ có thể được thu gọn để nhận lại một phần điểm.
- Khi giáo phận còn một nhà thờ và không còn nhà thờ mở rộng khác trong nhóm màu, ân nhân có thể rút lại đóng góp, nhận 50% mức ban đầu và thôi đồng hành tại đó.
- Khi thiếu điểm sứ vụ, người chơi có thể bổ sung điểm, thu gọn nhà thờ, rút lại đóng góp đủ điều kiện hoặc rời hành trình.
- Quỹ Hiệp Thông là quỹ chung không giới hạn điểm; nhật ký ván ghi các khoản Quỹ cấp, nhận và điểm chuyển trực tiếp cho ân nhân.
- Mỗi lượt dùng hai xúc xắc; đi qua Khởi đầu sứ vụ nhận 200; người chơi trong kỳ tĩnh tâm có thể gieo đôi hoặc đóng góp để trở lại hành trình.
- Giao diện tham khảo bản demo: nền xanh than, chữ kem, vàng nhấn và bộ font cục bộ để không cần tải font ngoài.
- Trên desktop, vùng chơi chia map/cột thông tin theo tỉ lệ 6:4; cột thông tin có thông báo ở trên và danh sách người chơi bên dưới. Bàn cờ tối đa 553.506 × 486.767 px; khung thông báo và danh sách được thu nhỏ 25% và căn giữa trong khu vực của chúng để vừa màn hình ở mức zoom 100%. Trên màn hình hẹp, các vùng chuyển thành bố cục dọc để bàn vẫn dùng được.
- Danh sách người chơi mở sẵn khi ván bắt đầu và có thể thu gọn bằng mũi tên. Danh sách hiển thị tên, avatar minh họa, điểm sứ vụ và giáo phận cùng số nhà thờ mỗi ân nhân đã xây.
- Thông báo hiện tại và lịch sử hoạt động nằm chung một thẻ; nhấn mũi tên để mở lịch sử. Biểu tượng tin nhắn ở footer mở chat thành sidebar bên phải, phủ lên vùng danh sách người chơi; nút Đóng nằm cuối panel.
- Nhấn vào xúc xắc trên bàn để gieo. Các thao tác xây nhà thờ và đóng góp hiện ở giữa khu vực trung tâm của bàn; quân cờ đang di chuyển được làm nổi bật.
- Rê chuột lên ô chức năng hoặc đưa tiêu điểm bàn phím vào ô để xem giải thích; quân người chơi nằm trong dải đầu tiên của ô.
- Trong phòng có thể sao chép riêng mã phòng hoặc liên kết mời; rời phòng giữa ván sẽ kết thúc lượt và trả các nơi đang được đồng hành về cộng đoàn.
- Thanh trên cùng khi đã vào phòng có mã phòng, nút sao chép mã/link và nút rời phòng. Trên điện thoại, các nút này nằm trong menu để nhường chỗ cho bàn cờ.
- Tên 27 giáo phận được nhóm theo ba giáo tỉnh dựa trên danh sách HĐGMVN cập nhật tháng 01/2025: https://hdgmvietnam.com/chi-tiet/cac-giam-muc-va-giao-phan-viet-nam-nam-2017-31165

Đây là bản nền tảng đang tiếp tục hoàn thiện luật chi tiết, âm thanh và đồ họa.
