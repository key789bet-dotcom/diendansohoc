const db = require('./db');
const bcrypt = require('bcryptjs');

const newUsers = [
  'hungpro99','minhtu88','quangdepzai','tuyetnh','thanhlong2k',
  'bachlong88','hoaibao99','minhtri247','xuanmai88','phuocle99',
  'namtrung88','thuhoa99','quocbao88','linhchi99','ducmanh88',
  'hoanglong99','mylinh88','trungkien99','bichngoc88','vannam99',
  'thuyanh88','quanghuy99','ngocbich88','trongdat99','kimchi88',
  'baotran99','lethuy88','manhcuong99','thanhhuyen88','quocviet99',
  'nguyetanh88','vanlong99','thithoa88','hoangtuan99','lananh88',
  'tiendat99','thanhmai88','quoclong99','bichvan88','minhtuan99',
  'thuylinh88','hungvu99','ngocmai88','tuanpro99','thanhthuy88',
  'quangminh99','lethao88','vanminh99','thihong88','duclong99'
];

const ranks = ['member','member','member','member','active','active','caothu'];

const commentTemplates = [
  'Cảm ơn bác chia sẻ! Tôi đang theo dõi con này 👍',
  'Hay quá, tôi cũng đang nuôi con đó!',
  'Bác phân tích chuẩn lắm, tôi làm theo',
  'Hôm qua tôi đánh con này trúng rồi 🥳',
  'Anh em ơi ai đánh theo chưa?',
  'Con này tôi thấy cũng có lý, follow thôi',
  'Cảm ơn bác nhiều, bài viết rất bổ ích',
  'Tôi mới tham gia, cho hỏi thêm được không?',
  'Bác có thể giải thích thêm về cách tính không?',
  'Tuyệt vời, đúng là cao thủ 🔥',
  'Hôm nay tôi cũng theo cách này, hy vọng trúng',
  'Bác hay lắm, mỗi ngày tôi đều đọc bài của bác',
  'Con số này tôi thấy cũng đang vào chu kỳ đẹp',
  'Theo mình nghĩ con này còn về thêm 2-3 ngày nữa',
  'Cảm ơn bác share kinh nghiệm quý báu!',
  'Tôi đã thử phương pháp này và khá hiệu quả',
  'Anh em nào trúng con này rồi điểm danh nào 🙋',
  'Hay đấy bác, bookmarked lại để tham khảo',
  'Theo mình con đầu 3 đang hot hơn bác ơi',
  'Bài viết chất lượng, cảm ơn bác nhiều lắm!',
  'Tôi nuôi con này ngày thứ 3 rồi, chưa về 😭',
  'Nếu về hôm nay thì ngon quá, ngón tay crossed 🤞',
  'Kinh nghiệm của bác rất hay, tôi học được nhiều',
  'Con số này tôi thấy trong thống kê cũng đang cao',
  'Bác ơi cho hỏi stop loss ở mức nào là hợp lý?',
];

async function createFakeUsers() {
  try {
    const hash = await bcrypt.hash('123456', 10);
    let userCount = 0;

    for (const username of newUsers) {
      const rank = ranks[Math.floor(Math.random() * ranks.length)];
      const diem = Math.floor(Math.random() * 200) + 10;
      await db.query(
        'INSERT IGNORE INTO users (username, email, password, user_rank, diem, created_at) VALUES (?,?,?,?,?,?)',
        [username, username+'@ddsh.com', hash, rank, diem, 
         new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)]
      );
      userCount++;
    }
    console.log(`✅ Đã tạo ${userCount} user mới!`);

    // Lấy tất cả users và posts
    const [allUsers] = await db.query('SELECT id FROM users');
    const [allPosts] = await db.query('SELECT id, user_id FROM posts ORDER BY RAND() LIMIT 100');

    let commentCount = 0;
    for (const post of allPosts) {
      // Mỗi bài 2-8 bình luận
      const numComments = Math.floor(Math.random() * 7) + 2;
      for (let i = 0; i < numComments; i++) {
        const user = allUsers[Math.floor(Math.random() * allUsers.length)];
        if (user.id === post.user_id) continue; // Không comment bài của mình
        const content = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];
        const commentDate = new Date(Date.now() - Math.random() * 170 * 24 * 60 * 60 * 1000);
        await db.query(
          'INSERT INTO comments (post_id, user_id, content, likes, created_at) VALUES (?,?,?,?,?)',
          [post.id, user.id, content, Math.floor(Math.random()*20), commentDate]
        );
        commentCount++;
      }
      // Cập nhật reply_count
      await db.query('UPDATE posts SET reply_count = (SELECT COUNT(*) FROM comments WHERE post_id = ?) WHERE id = ?', [post.id, post.id]);
    }
    console.log(`✅ Đã tạo ${commentCount} bình luận giả!`);

    // Cập nhật leaderboard
    const [users2] = await db.query('SELECT id FROM users');
    for (const u of users2.slice(0, 30)) {
      const diem = Math.floor(Math.random() * 80) + 5;
      const trung = Math.floor(diem / 3);
      const tong = Math.floor(diem * 1.5);
      await db.query(`
        INSERT INTO leaderboard (user_id, month, year, diem, trung, tong_du_doan)
        VALUES (?, MONTH(NOW()), YEAR(NOW()), ?, ?, ?)
        ON DUPLICATE KEY UPDATE diem=VALUES(diem), trung=VALUES(trung), tong_du_doan=VALUES(tong_du_doan)
      `, [u.id, diem, trung, tong]);
    }
    console.log('✅ Đã cập nhật leaderboard!');
    process.exit(0);
  } catch(e) {
    console.error('❌ Lỗi:', e.message);
    process.exit(1);
  }
}

createFakeUsers();
