require('dotenv').config();
const cron = require('node-cron');
const db = require('./db');
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const categories = [
  { id: 1, name: 'Thảo Luận Tổng Hợp', tag: 'tl', topics: ['kinh nghiệm chơi lô đề', 'quản lý vốn xổ số', 'chiến thuật đánh lô', 'tâm lý chơi lô đề', 'sai lầm thường gặp khi chơi lô'] },
  { id: 3, name: 'Huyền Thoại Chốt Số', tag: 'ht', topics: ['bạch thủ lô hôm nay', 'chốt số may mắn', 'con số vàng tuần này', 'dự đoán cao thủ', 'số đẹp hôm nay'] },
  { id: 4, name: 'Bản Tin Cao Thủ', tag: 'bc', topics: ['phân tích KQXS hôm nay', 'xu hướng lô đề tuần này', 'tổng hợp dự đoán cao thủ', 'nhận định xổ số', 'thống kê lô đề'] },
  { id: 5, name: 'Cầu Lô MB - Bạch Thủ', tag: 'mb', topics: ['soi cầu lô MB', 'bạch thủ miền Bắc', 'cầu lô kép MB', 'phân tích đầu đuôi MB', 'lô gan miền Bắc'] },
  { id: 6, name: 'Đề 36 Số - Khung 3 Ngày', tag: 'de36', topics: ['dàn đề 36 số', 'khung 3 ngày chuẩn', 'bộ số đề hôm nay', 'đề đặc biệt', 'dàn số may mắn'] },
  { id: 7, name: 'Cầu Lô K2N - Miền Nam', tag: 'k2n', topics: ['soi cầu lô miền Nam', 'bạch thủ miền Nam', 'KQXS miền Nam', 'cầu lô K2N', 'phân tích xổ số MN'] },
];

let usedTopics = new Set();

function getRandomTopic() {
  const available = categories.flatMap(c => 
    c.topics.map(t => ({ ...c, topic: t }))
  ).filter(t => !usedTopics.has(t.topic));
  
  if (available.length === 0) { usedTopics.clear(); return getRandomTopic(); }
  
  const item = available[Math.floor(Math.random() * available.length)];
  usedTopics.add(item.topic);
  return item;
}

async function generatePost(category, topic) {
  const today = new Date().toLocaleDateString("vi-VN", {day:"2-digit", month:"2-digit", year:"numeric"});
  
  const prompt = `Bạn là chuyên gia về xổ số và lô đề Việt Nam. Hãy viết một bài đăng diễn đàn chuẩn SEO về chủ đề: "${topic}" ngày ${today}.

Yêu cầu:
- Danh mục: ${category.name}
- Viết bằng tiếng Việt tự nhiên, không AI-like
- Độ dài: 300-500 từ
- Có H2, H3 headings
- Có từ khóa SEO liên quan đến xổ số, lô đề
- Nội dung hữu ích, thực tế
- KHÔNG trùng lặp với các bài trước

Trả về JSON format:
{
  "title": "tiêu đề bài viết chuẩn SEO dưới 70 ký tự",
  "content": "nội dung HTML đầy đủ với h2, h3, p tags"
}

Chỉ trả về JSON, không có text khác.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text;
  const json = JSON.parse(text.replace(/```json|```/g, '').trim());
  return json;
}

async function autoPost() {
  try {
    const hour = new Date().getHours();
    if (hour < 7 || hour >= 22) return;

    const catTopic = getRandomTopic();
    console.log("🤖 Đang tạo bài:", catTopic.topic);
    
    const post = await generatePost(catTopic, catTopic.topic);
    
    // Danh sách users giả đăng bài luân phiên
    const fakeUserIds = [2, 3, 4, 5, 6, 7, 8, 9];
    const randomUserId = fakeUserIds[Math.floor(Math.random() * fakeUserIds.length)];
    const admin = [{ id: randomUserId }];

    const [result] = await db.query(
      'INSERT INTO posts (title, content, user_id, category_id, tag, is_approved) VALUES (?,?,?,?,?,1)',
      [post.title, post.content, admin[0].id, catTopic.id, catTopic.tag]
    );

    await db.query('UPDATE users SET diem=diem+1 WHERE id=?', [admin[0].id]);
    console.log("✅ Đã đăng:", post.title, "| ID:", result.insertId);
  } catch(e) {
    console.error("❌ Lỗi:", e.message);
  }
}

// Test ngay khi khởi động
autoPost();

// Cron: 8h, 12h, 18h mỗi ngày
cron.schedule("0 8 * * *",  autoPost, { timezone: "Asia/Ho_Chi_Minh" });
cron.schedule("0 12 * * *", autoPost, { timezone: "Asia/Ho_Chi_Minh" });
cron.schedule("0 18 * * *", autoPost, { timezone: "Asia/Ho_Chi_Minh" });

console.log("✅ Auto-post AI đã khởi động! Đăng lúc 8h, 12h, 18h");
module.exports = { autoPost };
