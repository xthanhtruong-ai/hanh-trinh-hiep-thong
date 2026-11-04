# Hành Trình 27 — Tài liệu bàn giao dự án

Ngày cập nhật: 02/11/2026

Tài liệu này giúp một người hoặc trợ lý AI khác tiếp tục phát triển repo mà không cần toàn bộ lịch sử hội thoại. Hãy đọc tài liệu này cùng [README.md](README.md), sau đó kiểm tra `git status` và diff trước khi sửa mã.

## 1. Mục tiêu sản phẩm

**Hành Trình 27** là trò chơi cờ tỷ phú trực tuyến cho 2–8 người, lấy chủ đề truyền giáo, hiệp thông và đồng hành cùng 27 giáo phận Việt Nam. Trò chơi giữ cấu trúc và luật cốt lõi quen thuộc của cờ tỷ phú, đồng thời đổi tên, đơn vị điểm và cách diễn đạt để phù hợp với chủ đề Công giáo.

- Repo GitHub: <https://github.com/xthanhtruong-ai/hanh-trinh-hiep-thong>
- Nhánh hiện tại: `main`
- Tên thư mục workspace: `ChessGame`
- Phiên bản trong `package.json`: `0.1.0`

Danh sách 22 giáo xứ thuộc Giáo phận Phú Cường được gửi trước đó đã **được thay thế** bởi hướng thiết kế 27 giáo phận trên toàn quốc. Không đưa danh sách giáo xứ cũ trở lại bàn cờ nếu người dùng chưa yêu cầu.

## 2. Quy ước nội dung đã thống nhất với người dùng

Giữ các lựa chọn ngôn ngữ sau trong giao diện, nhật ký, luật chơi và tài liệu:

- Không dùng các cách nói “mua”, “bán”, “sở hữu”, “nợ” hoặc “thế chấp” nhà thờ/giáo phận.
- Đơn vị tiền trong game chỉ gọi là “điểm sứ vụ”; không tạo đơn vị “điểm duy tu”. Dùng “đóng góp”, “ân nhân”, “thiếu điểm sứ vụ”, “người đi lễ”, “rút lại đóng góp” và “trở về với cộng đoàn”.
- Khi ghé giáo phận đã có ân nhân, người chơi được gọi là người đi lễ và đóng góp điểm sứ vụ để duy tu, sửa chữa nhà thờ. Khoản đóng góp được chuyển cho ân nhân tại giáo phận đó; mức đóng góp tăng theo số nhà thờ đã xây.
- Không có thế chấp. Khi đủ điều kiện, người chơi rút lại đóng góp, nhận 50% mức đóng góp ban đầu và thôi làm ân nhân tại nơi đó.
- “Quỹ Hiệp Thông” là quỹ chung không giới hạn điểm. Không duy trì số dư quỹ; nhật ký ván ghi các khoản quỹ cấp/nhận và khoản chuyển trực tiếp giữa người chơi.
- Giữ ý nghĩa trò chơi là truyền giáo, gây dựng hoạt động mục vụ và kết nối cộng đoàn; không biến các giáo phận thành đối tượng giao dịch thương mại.

## 3. Bàn cờ và dữ liệu giáo phận

Bàn có 45 ô: 27 ô giáo phận và các ô chức năng. 27 giáo phận hiện được chia thành 8 nhóm màu để áp dụng giá, mức đóng góp và nâng cấp như cờ tỷ phú:

| Nhóm | Giáo phận |
| --- | --- |
| Miền biên viễn | Lạng Sơn – Cao Bằng, Hưng Hóa, Bắc Ninh |
| Đồng bằng Bắc Bộ | Tổng Giáo phận Hà Nội, Hải Phòng, Thái Bình, Bùi Chu |
| Bắc Trung Bộ | Phát Diệm, Thanh Hóa, Vinh, Hà Tĩnh |
| Trung Trung Bộ | Tổng Giáo phận Huế, Đà Nẵng, Qui Nhơn |
| Cao nguyên & duyên hải | Kon Tum, Nha Trang, Ban Mê Thuột |
| Đông Nam Bộ | Đà Lạt, Phan Thiết, Phú Cường, Xuân Lộc |
| Miền Đông & Tây Nam Bộ | Bà Rịa, Tổng Giáo phận Sài Gòn, Mỹ Tho |
| Miền Tây Nam Bộ | Vĩnh Long, Long Xuyên, Cần Thơ |

Các ô chức năng đang dùng các tên như Khởi đầu sứ vụ, Quỹ bác ái, Đóng góp sứ vụ, Quỹ phục vụ cộng đoàn, Biến cố sứ vụ, Nhà tĩnh tâm, Tĩnh tâm, Ngày hội hiệp thông, Tuyến loan báo Tin Mừng và Trung tâm mục vụ.

README hiện ghi nguồn danh sách giáo phận từ HĐGMVN, cập nhật tháng 01/2025. Nếu thay đổi tên hoặc địa giới, hãy kiểm chứng nguồn hiện hành và cập nhật cả dữ liệu bàn, tooltip, tài liệu và nhóm màu.

## 4. Công nghệ và cấu trúc repo

Repo hiện chỉ có một server và ba tệp giao diện; không có framework hoặc thư viện npm bên ngoài.

- `server.mjs`: dữ liệu bàn/nhóm, luật và trạng thái phòng, API JSON, SSE và static file server.
- `public/index.html`: cấu trúc lobby, header phòng, bàn cờ, cột thông báo/chat và danh sách người chơi.
- `public/app.js`: giao diện trình duyệt, SSE, chat trong phòng, gieo xúc xắc bằng cách nhấn xúc xắc trên bàn, xây/đóng góp, danh sách/lịch sử có thể thu gọn, hoạt ảnh quân cờ, tooltip và sao chép mã/link phòng.
- `public/style.css`: bố cục desktop 50/25/25, bố cục dọc trên điện thoại, lobby cao hơn, avatar minh họa, hộp thoại hành động ở trung tâm bàn, chat và hiệu ứng bàn cờ.
- `README.md`: hướng dẫn chạy và mô tả luật hiện tại.
- `.gitignore`: loại trừ `node_modules`, `.env`, file HAR và một số tệp phát triển.

Server dùng các module có sẵn của Node.js (`http`, `fs`, `path`, `crypto`). Yêu cầu Node.js 20 trở lên. `npm start` chạy `node server.mjs`; cổng mặc định là `4173`, có thể đổi bằng biến môi trường `PORT`.

API hiện có:

- `GET /health` — kiểm tra server.
- `GET /events?code=…&playerId=…` — luồng Server-Sent Events để gửi trạng thái phòng.
- `POST /api/create`, `/api/join`, `/api/leave`, `/api/start`, `/api/action`, `/api/chat` — tạo/tham gia/rời phòng, bắt đầu ván, gửi hành động và chat.

Trạng thái phòng, người chơi, chat và nhật ký chỉ nằm trong bộ nhớ. Khởi động lại server sẽ làm mất các phòng đang chơi. Không có tài khoản, xác thực người chơi, cơ sở dữ liệu, lưu ván hoặc khả năng khôi phục phòng sau restart. Nhật ký mỗi phòng chỉ giữ 18 sự kiện gần nhất; chat giữ tối đa 100 tin gần nhất.

## 5. Luật và luồng hiện có

- Mỗi người bắt đầu với 1.500 điểm sứ vụ. Đi qua Khởi đầu sứ vụ nhận 200 điểm.
- Chủ phòng tạo phòng; người khác vào bằng mã/link; cần ít nhất 2 người và tối đa 8 người; chủ phòng bắt đầu ván.
- Mỗi lượt gieo hai xúc xắc. Gieo đôi cho lượt thêm; gieo đôi ba lần liên tiếp đưa người chơi vào kỳ tĩnh tâm.
- Nếu một giáo phận chưa có ân nhân, người chơi có thể đóng góp theo giá đặt sẵn để trở thành ân nhân và xây nhà thờ đầu tiên, hoặc mời cộng đoàn đóng góp qua đấu giá. Người thắng đấu giá cũng dựng nhà thờ đầu tiên. Mức trả giá phải cao hơn mức hiện tại ít nhất 10 điểm và không vượt số điểm người chơi có.
- Khi ghé giáo phận đã có ân nhân khác, người chơi là người đi lễ và đóng góp điểm sứ vụ cho việc duy tu, sửa chữa nhà thờ. Mức đóng góp tăng theo số nhà thờ tại giáo phận đó và được chuyển cho ân nhân.
- Mỗi lần ân nhân dừng tại giáo phận mình đồng hành, họ có thể xây tối đa một nhà thờ bổ sung. Luật xây thêm giữ điều kiện nhóm màu và phát triển cân bằng như cờ tỷ phú; tối đa 5 nhà thờ tại mỗi giáo phận. Có thể thu gọn theo thứ tự và nhận lại một phần điểm.
- Khi giáo phận còn một nhà thờ, ân nhân có thể rút lại đóng góp tại đó, nhận 50% giá ban đầu và không còn là ân nhân. Không thể rút nếu nhà thờ ở giáo phận khác trong nhóm màu vẫn đang được mở rộng.
- Quỹ Hiệp Thông nhận điểm từ khoản đóng góp, ô đóng góp, thuế/sự kiện và nâng cấp; Quỹ cấp điểm khởi đầu, thưởng qua Khởi đầu, thẻ và khoản hoàn lại.
- Nếu không đủ điểm thanh toán, người chơi vào pha thiếu điểm. Có thể bổ sung điểm, rút đóng góp đủ điều kiện, thu gọn nhà thờ hoặc rút khỏi hành trình.
- Khi rút khỏi hành trình do thiếu điểm, số điểm còn lại chuyển cho người nhận hợp lệ hoặc Quỹ. Các nơi họ đồng hành chuyển cho người nhận hợp lệ; nếu không có thì trở về cộng đoàn.
- Rời phòng khi ván đang diễn ra đánh dấu người chơi đã rời, đưa điểm còn lại về Quỹ, trả nơi họ đồng hành về cộng đoàn và có thể kết thúc ván nếu chỉ còn một người chơi.
- Desktop: bàn cờ chiếm khoảng 50% chiều ngang, cột thông báo/chat và cột người chơi mỗi cột chiếm khoảng 25%. Trên điện thoại, giao diện xếp dọc và bàn cờ dùng gần hết chiều ngang.
- Danh sách người chơi mở sẵn khi bắt đầu ván và thu gọn bằng mũi tên; hiển thị tên, avatar minh họa, điểm sứ vụ và giáo phận cùng số nhà thờ mỗi ân nhân đã dựng. Thông báo hiện tại và lịch sử cùng nằm trong một thẻ có thể mở/thu; chat trực tiếp nằm phía dưới.
- Header trong phòng hiển thị mã phòng, nút sao chép mã/link và rời phòng; trên điện thoại các hành động này nằm trong menu. Lobby dùng hộp thoại cao hơn, hiển thị chủ phòng cùng avatar và tên, các chỗ trống, mã/link và nút bắt đầu.
- Nhấn xúc xắc trên bàn để gieo; thao tác xây dựng/đóng góp hiện giữa khu vực trung tâm bàn. Quân cờ đang di chuyển được phóng nhẹ và làm nổi bật ô hiện tại.
- Ô chức năng có dấu “!” để xem giải thích. Có nút riêng để sao chép mã phòng và link mời.

Các trạng thái chính ở server gồm `lobby`, `roll`, `contribute`, `auction`, `manage`, `shortfall`, `finished`. API state gửi kèm `currentPlayerId`, `auction` và `shortfall`; phần UI có thể dùng `auction.currentBidderId` để chỉ người trả giá hiện tại.

## 6. Trạng thái repo khi bàn giao

Tại thời điểm tạo tài liệu:

- Nhánh `main`, commit gần nhất ghi nhận trong checkout là `9b4c9cb chore: add gitignore`.
- Remote `origin` trỏ tới repo GitHub ở trên.
- Các thay đổi ở `README.md`, `server.mjs`, `public/app.js`, `public/index.html` và `public/style.css` đang nằm trong working tree, chưa commit/push. Đây là các phần việc tích lũy trước khi tạo tài liệu này; cần giữ nguyên và xem diff trước khi chỉnh tiếp.
- `PROJECT_HANDOFF.md` là tệp mới của lần bàn giao này và cũng chưa commit.
- Bản UI mới nhất đổi vùng game thành bàn cờ + thông báo/chat + danh sách; chat dùng `POST /api/chat` và trạng thái chat được phát cùng SSE. CSS mới ở cuối `public/style.css` ghi đè một số luật bố cục phiên bản cũ, cần xem trực quan cả màn hình rộng và điện thoại sau khi server được khởi động lại.
- Các thay đổi luật/UI trước đó đã được kiểm tra cú pháp và khoảng trắng. Bố cục 50/25/25 cùng chat vừa thêm chưa được xem trực quan trong trình duyệt; `git diff --check` hiện không báo lỗi.
- Server ở `localhost:4173` đã chạy sẵn trong phiên thử; lệnh `npm start` thứ hai không khởi chạy được do cổng đã được sử dụng. Không cần khởi động thêm server nếu cổng đó vẫn đang dùng.

## 7. Kết quả kiểm thử thủ công gần nhất

Ngày 02/11/2026, đã chơi một phiên bằng hai tab trình duyệt local với hai người thử. Đã đi qua tạo phòng, tham gia, bắt đầu, gieo xúc xắc, đóng góp tại giáo phận/tuyến, đấu giá (một người trả 190, người kia tăng lên 200, người đầu nhường), cập nhật danh sách ân nhân, thẻ cấp điểm, nhận điểm khi qua Khởi đầu, gieo đôi thêm lượt, thanh toán 25 điểm trực tiếp cho ân nhân và rời phòng. Khi B rời, A được tuyên bố thắng; danh sách của B được cập nhật về 0 điểm/0 nơi đồng hành. Hai tab nhận trạng thái và nhật ký chung. Không thấy lỗi console JavaScript hoặc thông báo lỗi trong game.

> Nhãn và highlight người chơi trong pha đấu giá đã được cập nhật theo `auction.currentBidderId` trong giao diện mới.

> Ván thử kết thúc qua nút **Rời phòng**, không phải qua thiếu điểm/phá sản. Các nhánh thiếu điểm, phá sản bình thường, nâng cấp đủ cả nhóm, ba lần gieo đôi và thời hạn kỳ tĩnh tâm chưa được kiểm tra đầy đủ. Chức năng clipboard và tooltip trên kích thước màn hình nhỏ cũng cần kiểm tra thêm.

## 8. Việc nên làm tiếp

1. Chơi lại một ván để xác nhận quy tắc xây nhà thờ đầu tiên, xây tối đa một nhà thờ mỗi lần dừng và mức đóng góp của người đi lễ tăng theo số nhà thờ.
2. Kiểm tra trực quan trên desktop/mobile: bảng danh sách mở sẵn, bảng sự kiện, hộp thoại hành động giữa màn hình, xúc xắc nhấn được và thanh trạng thái không tràn sang cột menu.
3. Kiểm tra các nhánh chưa phủ: thiếu điểm, rút lại đóng góp, thu gọn nhà thờ, rút khỏi hành trình, rời phòng giữa ván, ba lần gieo đôi và kỳ tĩnh tâm.
4. Xác minh nút sao chép mã/link và tooltip trên trình duyệt/kích thước màn hình mục tiêu.
5. Chỉ cân nhắc lưu ván/cơ sở dữ liệu và triển khai Internet nếu người dùng yêu cầu. Hiện không có lưu trữ bền vững; restart sẽ xóa phòng.

Khi làm tiếp, chỉ sửa trong repo này, bảo toàn mọi thay đổi đang chờ commit, không reset/ghi đè working tree và không commit/push nếu người dùng chưa yêu cầu. Cập nhật `README.md` khi hành vi hoặc luật đã thống nhất thay đổi.
