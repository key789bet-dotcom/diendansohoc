const db = require('./db');

const titles = [
  'Cầu lô MB hôm nay - Bạch thủ đặc biệt',
  'Dàn đề 36 số khung 3 ngày chắc ăn',
  'Soi cầu miền Bắc thứ 2 - Lô kép đôi',
  'Bạch thủ lô MB ngày {date} - Con số vàng',
  'Cầu 3 càng đặc biệt tuần này',
  'Xiên 2 siêu chuẩn - Tỉ lệ 85%',
  'Lô gan 15 ngày chưa về - Cơ hội vàng',
  'Phân tích KQXS MB ngày {date}',
  'Cặp song thủ hot nhất tuần',
  'Đề đuôi 6-8 đang về liên tục',
  'Nuôi khung 5 ngày - Con 27 đang hot',
  'Tổng hợp cầu lô đẹp tháng {month}',
  'Bí quyết đánh lô kép hiệu quả',
  'Top 5 con số may mắn tuần này',
  'Soi cầu miền Nam - Bạch thủ xác suất cao',
  'Phương pháp đánh theo thống kê 30 ngày',
  'Cầu lô kép 44-55 đang vào chu kỳ',
  'Dàn đề 18 số siêu chuẩn ngày {date}',
  'Kinh nghiệm nuôi lô gan từ cao thủ',
  'Cặp lô đầu 2 đuôi 8 đang hot',
  'Phân tích tần suất lô tháng {month}',
  'Bạch thủ đề miền Bắc - Chắc ăn 90%',
  'Lô xiên 3 siêu chuẩn tuần này',
  'Tổng hợp KQXS MB tháng {month}',
  'Soi cầu lô đặc biệt cuối tuần',
  'Con số vàng ngày {date} theo thống kê',
  'Đánh theo chu kỳ - Phương pháp hiệu quả',
  'Cầu lô MB theo ngày trong tuần',
  'Bạch thủ lô 3 ngày liên tiếp',
  'Xiên 4 chuẩn xác - Kinh nghiệm 5 năm',
];

const contents = [
  '<p>Anh em ơi, hôm nay mình phân tích kỹ KQXS và thấy <span class="num-tag">27</span> đang vào chu kỳ rất đẹp. Đầu 2 đuôi 7 đã về 3 lần trong 2 tuần qua.</p><p>Theo thống kê của mình, cặp <strong>27-72</strong> hay về vào thứ 5 và thứ 6. Anh em tham khảo nhé!</p>',
  '<p>Dàn đề hôm nay mình chốt 36 số:</p><p><strong>Nhóm đầu 0:</strong> 02 - 06 - 09 - 13 - 17 - 21</p><p><strong>Nhóm đầu 2:</strong> 25 - 28 - 34 - 38 - 41 - 47</p><p>Nuôi khung 3 ngày, stop loss khi thua 2 ngày liên tiếp.</p>',
  '<p>Kinh nghiệm 5 năm chơi lô đề, mình rút ra được phương pháp sau:</p><p>1. Không bao giờ đánh quá 20% vốn trong 1 ngày</p><p>2. Theo cầu gan khi lô chưa về trên 10 ngày</p><p>3. Dùng thống kê tần suất để chọn số</p>',
  '<p>Hôm nay mình thấy <span class="num-tag">39</span> đang rất hot! Giải đặc biệt hôm qua kết thúc bằng 39, theo quy luật hay về lại trong vòng 3 ngày.</p><p>Anh em nuôi con này nhé, mình tự tin 70%!</p>',
  '<p>Phân tích KQXS hôm nay:</p><p>- Giải ĐB: <strong>66239</strong> → Đầu 6 Đuôi 9</p><p>- Tổng: 6+9 = 15 → Đầu 1 Đuôi 5</p><p>- Ngày mai theo cặp <span class="num-tag">15</span> và <span class="num-tag">51</span></p>',
  '<p>Cầu lô kép đôi tuần này theo mình là <strong>55-66-77</strong>. Tần suất lô kép đôi về vào cuối tuần rất cao, khoảng 60-70%.</p><p>Anh em muốn chơi chắc thì xiên 2 hai cặp này!</p>',
  '<p>Chia sẻ phương pháp bạch thủ 3 ngày của mình:</p><p>Ngày 1: Chọn con số theo đầu giải ĐB</p><p>Ngày 2: Nếu chưa về, tăng gấp đôi</p><p>Ngày 3: Nếu vẫn chưa về, bỏ và chọn con khác</p>',
  '<p>Top 5 con số hot nhất tuần này theo thống kê tần suất 30 ngày:</p><p>1. <span class="num-tag">27</span> - về 8 lần</p><p>2. <span class="num-tag">39</span> - về 7 lần</p><p>3. <span class="num-tag">84</span> - về 7 lần</p><p>4. <span class="num-tag">15</span> - về 6 lần</p><p>5. <span class="num-tag">62</span> - về 6 lần</p>',
];

const tags = ['tl', 'mb', 'de36', 'bc', 'k2n', 'ht'];

async function createFakePosts() {
  try {
    // Lấy users
    const [users] = await db.query('SELECT id, username FROM users LIMIT 20');
    if (!users.length) { console.log('Không có user!'); process.exit(1); }

    // Lấy categories
    const [cats] = await db.query('SELECT id FROM categories');
    if (!cats.length) { console.log('Không có category!'); process.exit(1); }

    let count = 0;
    const now = new Date();

    // Tạo 300 bài viết trong 6 tháng qua
    for (let i = 0; i < 300; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const cat = cats[Math.floor(Math.random() * cats.length)];
      const tag = tags[Math.floor(Math.random() * tags.length)];
      
      // Random ngày trong 6 tháng qua
      const daysAgo = Math.floor(Math.random() * 180);
      const postDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
      const dateStr = postDate.toLocaleDateString('vi-VN');
      const monthStr = postDate.toLocaleDateString('vi-VN', {month: 'long', year: 'numeric'});

      // Random title và content
      let title = titles[Math.floor(Math.random() * titles.length)];
      title = title.replace('{date}', dateStr).replace('{month}', monthStr);
      
      const content = contents[Math.floor(Math.random() * contents.length)];
      const views = Math.floor(Math.random() * 5000) + 50;
      const likes = Math.floor(Math.random() * 100);
      const replies = Math.floor(Math.random() * 200);

      await db.query(
        'INSERT INTO posts (title, content, user_id, category_id, tag, views, likes, reply_count, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [title, content, user.id, cat.id, tag, views, likes, replies, postDate, postDate]
      );
      count++;
      if (count % 50 === 0) console.log(`✅ Đã tạo ${count} bài viết...`);
    }

    // Cập nhật post_count cho categories
    await db.query('UPDATE categories c SET post_count = (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id)');
    
    console.log(`✅ Hoàn thành! Đã tạo ${count} bài viết giả trong 6 tháng qua.`);
    process.exit(0);
  } catch(e) {
    console.error('❌ Lỗi:', e.message);
    process.exit(1);
  }
}

createFakePosts();
