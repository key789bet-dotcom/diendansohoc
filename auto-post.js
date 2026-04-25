const cron = require('node-cron');
const axios = require('axios');

function randomPost() {
  const titles = [
    'Soi cầu miền Bắc hôm nay',
    'Dự đoán xổ số chuẩn xác',
    'Cao thủ chốt số hôm nay',
    'Phân tích lô gan cực chuẩn'
  ];

  const contents = [
    '<h2>Soi cầu hôm nay</h2><p>Dàn số đẹp: 23 - 45 - 67</p>',
    '<h2>Nhận định</h2><p>Cầu đang chạy mạnh 68 - 86</p>',
    '<h2>Chốt số</h2><p>Bạch thủ: 99</p>'
  ];

  return {
    title: titles[Math.floor(Math.random() * titles.length)],
    content: contents[Math.floor(Math.random() * contents.length)]
  };
}

cron.schedule('*/5 * * * *', async () => {
  const post = randomPost();

  console.log('Đăng:', post.title);

  try {
    await axios.post('http://localhost:3000/api/posts', post);
    console.log('✅ Thành công');
  } catch (err) {
    console.log('❌ Lỗi:', err.message);
  }
});
