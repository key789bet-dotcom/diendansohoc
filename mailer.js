const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  }
});

async function sendWelcomeEmail(to, username) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: '🎉 Chào mừng bạn đến với GMSH Diễn Đàn!',
    html: `
      <div style="font-family:'Be Vietnam Pro',sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#c0392b,#8e1a0e);padding:30px;text-align:center;border-radius:8px 8px 0 0;">
          <h1 style="color:#fff;font-size:28px;margin:0;">GMSH DIỄN ĐÀN</h1>
          <p style="color:rgba(255,255,255,.8);margin:8px 0 0;">Giải Mã Số Học</p>
        </div>
        <div style="background:#fff;padding:30px;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px;">
          <h2 style="color:#c0392b;">Xin chào ${username}! 👋</h2>
          <p style="color:#555;line-height:1.7;">Chào mừng bạn đã tham gia <strong>GMSH Diễn Đàn</strong> — cộng đồng dự đoán xổ số uy tín số 1 Việt Nam!</p>
          <div style="background:#fff9e6;border:1px solid #f7dc6f;border-radius:6px;padding:16px;margin:20px 0;">
            <p style="margin:0;color:#7d5a00;font-weight:600;">🎯 Bạn có thể:</p>
            <ul style="color:#555;margin:8px 0 0;padding-left:20px;line-height:1.9;">
              <li>Xem kết quả xổ số hàng ngày</li>
              <li>Tham gia thảo luận với cao thủ</li>
              <li>Sử dụng công cụ tạo dàn số</li>
              <li>Chat realtime với cộng đồng</li>
            </ul>
          </div>
          <div style="text-align:center;margin:24px 0;">
            <a href="https://diendansohoc.com/home" 
               style="background:#c0392b;color:#fff;padding:12px 30px;border-radius:4px;text-decoration:none;font-weight:700;font-size:15px;">
              🚀 Vào Diễn Đàn Ngay
            </a>
          </div>
          <p style="color:#aaa;font-size:12px;text-align:center;margin-top:20px;">
            © 2026 GMSH Diễn Đàn | diendansohoc.com
          </p>
        </div>
      </div>
    `
  });
  console.log(`✅ Gửi email chào mừng đến ${to}`);
}

async function sendNotificationEmail(to, username, fromUser, postTitle, postId) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: `🔔 ${fromUser} đã bình luận bài viết của bạn`,
    html: `
      <div style="font-family:'Be Vietnam Pro',sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#c0392b;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
          <h2 style="color:#fff;margin:0;">🔔 Thông Báo Mới</h2>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px;">
          <p style="color:#333;">Xin chào <strong>${username}</strong>,</p>
          <p style="color:#555;"><strong style="color:#c0392b;">${fromUser}</strong> đã bình luận vào bài viết của bạn:</p>
          <div style="background:#f8f8f8;border-left:4px solid #c0392b;padding:12px;margin:16px 0;border-radius:0 4px 4px 0;">
            <p style="margin:0;font-weight:600;color:#333;">📝 ${postTitle}</p>
          </div>
          <div style="text-align:center;margin:20px 0;">
            <a href="https://diendansohoc.com/post/${postId}"
               style="background:#c0392b;color:#fff;padding:10px 24px;border-radius:4px;text-decoration:none;font-weight:700;">
              Xem bình luận
            </a>
          </div>
        </div>
      </div>
    `
  });
}



async function sendResetEmail(to, username, token) {
  const resetLink = `https://diendansohoc.com/reset-password/${token}`;
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: '🔐 Đặt lại mật khẩu GMSH Diễn Đàn',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#c0392b;padding:24px;text-align:center;border-radius:8px 8px 0 0;">
          <h2 style="color:#fff;margin:0;">🔐 Đặt Lại Mật Khẩu</h2>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px;">
          <p>Xin chào <strong>${username}</strong>,</p>
          <p>Bạn đã yêu cầu đặt lại mật khẩu. Click nút bên dưới để tiếp tục:</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${resetLink}" style="background:#c0392b;color:#fff;padding:12px 30px;border-radius:4px;text-decoration:none;font-weight:700;">
              🔑 Đặt Lại Mật Khẩu
            </a>
          </div>
          <p style="color:#888;font-size:12px;">Link có hiệu lực trong <strong>30 phút</strong>. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
        </div>
      </div>
    `
  });
}

module.exports = { sendWelcomeEmail, sendNotificationEmail, sendResetEmail };
