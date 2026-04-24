const db = require('./db');

const conversations = [
  ['Sáng nay ae có cầu hay không? Mình đang phân vân con 27 với 72', 'Mình thấy con 27 đang vào chu kỳ đẹp hơn bác ơi, tuần này về 3 lần rồi', 'Đồng ý, thêm con 84 vào xiên 2 thì chắc ăn hơn', 'Ok mình sẽ đánh xiên 2: 27-84, cảm ơn ae nhé 👍'],
  ['Hôm qua ae trúng không? Mình về 2 cặp lô 🥳', 'Wow bác trúng cả 2 cặp! Con mấy vậy bác?', 'Con 39 và 93, mình nuôi khung 5 ngày rồi mới về', 'Khủng quá! Mình thua hôm qua rồi, hôm nay gỡ tiếp 😅'],
  ['Ae ơi hôm qua giải ĐB về 66239, đuôi 9 đang hot đây', 'Ừ mình thấy rồi, tuần này đuôi 9 về 4 lần rồi', 'Theo chu kỳ thì mai đuôi 9 sẽ nghỉ, mình chuyển sang đuôi 3', 'Vậy ae cùng theo đuôi 3 ngày mai nhé 💪'],
  ['Ae ơi cho mình hỏi, lô gan bao nhiêu ngày thì nên nuôi?', 'Theo kinh nghiệm mình thì từ 10-15 ngày là đáng nuôi bác ơi', 'Đồng ý, nhưng cũng cần xem tần suất lịch sử nữa nhé', 'Cảm ơn bác nhiều, mình sẽ nuôi con 47 này!'],
  ['Còn 2 tiếng nữa xổ rồi ae ơi, ai chốt số chưa?', 'Mình chốt con 28 rồi, bạch thủ ngày hôm nay', 'Mình xiên 3: 15-51-84, hy vọng về 1 cặp thôi cũng vui', 'Chúc ae may mắn nhé! Cùng cầu nguyện trúng nào 🙏'],
  ['Xổ xong rồi ae ơi! Ai trúng không?', 'Mình trúng bạch thủ con 39 rồi! Vui quá 🎉', 'Wow chúc mừng bác! Ăn bao nhiêu vậy?', 'Ăn gấp 80 lần bác ơi, hôm nay đãi ae cà phê ☕'],
  ['Ae muốn nghe bí quyết chơi lô bền vững không?', 'Muốn muốn! Bác share với đi 🙏', 'Không bao giờ đặt quá 10% vốn 1 ngày, chỉ nuôi tối đa 3 con', 'Hay quá bác ơi! Mình sẽ áp dụng ngay 👍'],
  ['Ae nào chơi miền Nam không? Mình thấy cầu MN đang đẹp lắm', 'Mình chơi MN bác ơi, hôm nay bác thấy con nào?', 'Bạch thủ MN hôm nay mình chốt con 36, đầu 3 đang vào chu kỳ', 'Ok mình theo con này luôn, cảm ơn bác nhé!'],
  ['Tổng kết hôm nay: đầu 6 đuôi 9 về nhiều nhất ae nhé', 'Cảm ơn bác tổng kết! Ngày mai mình theo đầu 6 tiếp', 'Ae nhớ xem thống kê 30 ngày trước khi chốt số nhé', 'Chúc ae ngủ ngon! Ngày mai chiến tiếp 🌙'],
  ['Ae có dùng công cụ gì để tạo dàn số không?', 'Mình dùng trang này luôn bác ơi, có tool tạo dàn số rất tiện', 'Mình dùng phương pháp ma trận, tự tính tay', 'Bác chỉ mình cách tính ma trận với, nghe hay lắm'],
];

let queue = [];
let usedIdx = new Set();

async function fillQueue() {
  if (usedIdx.size >= conversations.length) usedIdx.clear();
  let idx;
  do { idx = Math.floor(Math.random() * conversations.length); } while (usedIdx.has(idx));
  usedIdx.add(idx);
  const conv = conversations[idx];
  const [users] = await db.query(
    "SELECT id FROM users WHERE username NOT IN ('testuser','ADMIN') ORDER BY RAND() LIMIT 4"
  );
  if (!users.length) return;
  conv.forEach((msg, i) => {
    queue.push({ user_id: users[i % users.length].id, msg });
  });
  console.log('Queue filled:', queue.length, 'messages');
}

async function sendNextMessage() {
  try {
    const hour = new Date().getHours();
    if (hour < 8 || hour >= 21) return;
    if (queue.length === 0) await fillQueue();
    if (queue.length === 0) return;
    const item = queue.shift();
    await db.query(
      'INSERT INTO chat_messages (user_id, room, message) VALUES (?,?,?)',
      [item.user_id, 'nhap-mon', item.msg]
    );
    console.log('💬 Auto chat: ' + item.msg.substring(0,50));
  } catch(e) {
    console.error('Auto chat error:', e.message);
  }
}

function scheduleNext() {
  const hour = new Date().getHours();
  let delay;
  if (hour < 8 || hour >= 21) {
    delay = 30 * 60 * 1000;
  } else if (queue.length > 0) {
    delay = (Math.floor(Math.random() * 60) + 30) * 1000;
  } else {
    delay = (Math.floor(Math.random() * 5) + 3) * 60 * 1000;
  }
  setTimeout(async () => { await sendNextMessage(); scheduleNext(); }, delay);
}

scheduleNext();
console.log('✅ Auto chat đã khởi động! (8h-21h)');
module.exports = { sendNextMessage };
