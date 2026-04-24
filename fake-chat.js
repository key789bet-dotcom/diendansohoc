const db = require('./db');

const users = [
  'sosegiau68','BEOHP88','ledung123d','OTTHOC77','ANHVTP83',
  'VHPRO85','thantai779','longpro99','minhkhoa88','trucpari',
  'thanhtrungg','lanveo1812','khoahoc59','bachthu99','lotde247',
  'xoso888','caothu2026','soivip','bachthulo','dungpro99'
];

const messages = [
  // Hỏi thăm
  'Anh em hôm nay đánh con mấy?',
  'Có ai đang online không ta?',
  'Chào buổi sáng anh em, hôm nay thế nào?',
  'Mọi người ơi hôm nay xổ mấy giờ?',
  'Ae ơi hôm nay thứ mấy rồi nhỉ?',
  // Chia sẻ dự đoán
  'Tôi chốt con 28 hôm nay, anh em xem sao',
  'Bạch thủ của tôi hôm nay là 47',
  'Tôi theo cặp 36-63 ngày thứ 2 rồi',
  'Hôm nay tôi đánh xiên 3: 18-27-36',
  'Lô kép đôi 55-66-77 đang hot nha ae',
  'Tôi chốt 3 càng con 728 hôm nay',
  'Bạch thủ đề tôi con 39, ae cùng đánh',
  'Tôi theo khung 5 ngày con 84 nha',
  'Hôm nay tôi đánh song thủ 29-92',
  'Lô gan 12 ngày con 15, ae nuôi không?',
  // Kết quả
  'Hôm qua tôi trúng 2 cặp lô, vui quá 😍',
  'Ôi trật hết rồi, hôm nay đánh lại',
  'Con 47 về rồi, ai đánh không?',
  'Trúng 3 càng hôm qua 100k ăn 80 triệu 🔥',
  'Hôm qua về đuôi 9, ai theo không?',
  'Thua 3 ngày liên tiếp rồi, chuyển sang con khác',
  'Giải ĐB hôm qua 66239, đuôi 9 mạnh lắm',
  // Kinh nghiệm
  'Anh em nhớ xem thống kê trước khi đánh nhé',
  'Lô gan trên 10 ngày thường về mạnh lắm',
  'Đừng đánh theo cảm tính, phải có chiến thuật',
  'Tôi dùng phương pháp bạch thủ 3 ngày hiệu quả lắm',
  'Kinh nghiệm: đuôi 0 hay về vào thứ 6',
  'Anh em nên giới hạn vốn mỗi ngày nhé',
  'Theo cầu lô MB thứ 5 hay về cặp kép',
  'Đánh ít thôi ae, quan trọng là chắc',
  // Hỏi đáp
  'Ai có cầu 3 ngày tốt chỉ với?',
  'Cho hỏi lô gan con 27 mấy ngày rồi?',
  'Anh VHPRO85 ơi hôm nay chốt con gì vậy?',
  'Cao thủ nào cho xin dàn đề 10 số với',
  'Hỏi thật ai trúng đều không hay thua nhiều?',
  // Động viên
  'Cố lên ae, hôm nay may mắn hơn 💪',
  'Không sao, thua hôm nay thắng ngày mai',
  'Anh em bình tĩnh, đừng gỡ vội',
  'Chúc ae hôm nay trúng lớn nhé 🎯',
  'Cùng nhau phân tích cầu nào ae ơi',
  // Nhận xét KQXS
  'Hôm nay đầu 6 đuôi 9, ae chú ý',
  'Giải nhất về 39591, đuôi 1 mạnh đây',
  'Giải 7 hôm nay: 22-63-99-57, ae xem',
  'Lô về nhiều đuôi chẵn hôm nay',
  'Cầu lô đặc biệt 3 ngày nay toàn đuôi lẻ',
  // Vui vẻ
  'Hehe trúng rồi ae ơi, mừng quá 🥳',
  'Ăn tô phở sáng bằng tiền lô hôm qua 😂',
  'Chờ kết quả hồi hộp quá, tim đập loạn',
  'Xem KQXS xong mặt buồn như đưa đám 😭',
  'Hôm nay thắng mời ae cà phê ☕',
];

async function insertFakeChats() {
  try {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('123456', 10);
    
    for (let i = 0; i < users.length; i++) {
      await db.query(
        'INSERT IGNORE INTO users (username, email, password, user_rank, diem) VALUES (?,?,?,?,?)',
        [users[i], users[i]+'@ddsh.com', hash, 'member', Math.floor(Math.random()*150)+10]
      ).catch(()=>{});
    }

    const placeholders = users.map(()=>'?').join(',');
    const [fakeUsers] = await db.query(`SELECT id, username FROM users WHERE username IN (${placeholders})`, users);

    // Xóa chat giả cũ
    const ids = fakeUsers.map(u => u.id);
    if (ids.length) {
      await db.query(`DELETE FROM chat_messages WHERE user_id IN (${ids.map(()=>'?').join(',')}) AND room='nhap-mon'`, ids);
    }

    // Shuffle messages để không trùng
    const shuffled = [...messages].sort(() => Math.random() - 0.5);
    
    const now = new Date();
    for (let i = 0; i < shuffled.length; i++) {
      const user = fakeUsers[i % fakeUsers.length];
      const time = new Date(now - (shuffled.length - i) * 2 * 60 * 1000);
      await db.query(
        'INSERT INTO chat_messages (user_id, room, message, created_at) VALUES (?,?,?,?)',
        [user.id, 'nhap-mon', shuffled[i], time]
      );
    }
    console.log(`✅ Đã tạo ${shuffled.length} tin nhắn từ ${fakeUsers.length} user!`);
    process.exit(0);
  } catch(e) {
    console.error('❌ Lỗi:', e.message);
    process.exit(1);
  }
}

insertFakeChats();
