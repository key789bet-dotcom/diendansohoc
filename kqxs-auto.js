const axios = require('axios');
const cron  = require('node-cron');
const db    = require('./db');

async function createKqxsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS kqxs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tinh VARCHAR(50),
      ngay DATE,
      giai_db VARCHAR(10),
      giai_1  VARCHAR(10),
      giai_2  VARCHAR(50),
      giai_3  VARCHAR(200),
      giai_4  VARCHAR(100),
      giai_5  VARCHAR(200),
      giai_6  VARCHAR(100),
      giai_7  VARCHAR(100),
      dau VARCHAR(2),
      duoi VARCHAR(2),
      region ENUM('mb','mn','mt') DEFAULT 'mb',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_tinh_ngay (tinh, ngay)
    )
  `);
}

async function fetchKQXS_MB() {
  try {
    const res = await axios.get('https://xskt.com.vn/rss-feed/mien-bac-xsmb.rss', { timeout: 10000 });
    const data = res.data;

    const itemMatch = data.match(/<item>([\s\S]*?)<\/item>/);
    if (!itemMatch) return console.log('❌ Không tìm thấy item');

    const item = itemMatch[1];
    const desc = item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '';
    const clean = desc.replace(/<!\[CDATA\[|\]\]>/g,'').trim();

    const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
    let giai_db='',giai_1='',giai_2='',giai_3='',giai_4='',giai_5='',giai_6='',giai_7='';

    lines.forEach(line => {
      if      (line.startsWith('ĐB:'))  giai_db = line.replace('ĐB:','').trim();
      else if (line.startsWith('1:'))   giai_1  = line.replace('1:','').trim();
      else if (line.startsWith('2:'))   giai_2  = line.replace('2:','').trim();
      else if (line.startsWith('3:'))   giai_3  = line.replace('3:','').trim();
      else if (line.startsWith('4:'))   giai_4  = line.replace('4:','').trim();
      else if (line.startsWith('5:'))   giai_5  = line.replace('5:','').trim();
      else if (line.startsWith('6:'))   giai_6  = line.replace('6:','').trim();
      else if (line.startsWith('7:'))   giai_7  = line.replace('7:','').trim();
    });

    if (!giai_db) return console.log('❌ Không parse được giải ĐB');

    const dau  = giai_db.charAt(0);
    const duoi = giai_db.charAt(giai_db.length - 1);
    const today = new Date().toISOString().slice(0,10);

    await db.query(`
      INSERT INTO kqxs (tinh, ngay, giai_db, giai_1, giai_2, giai_3, giai_4, giai_5, giai_6, giai_7, dau, duoi, region)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'mb')
      ON DUPLICATE KEY UPDATE
        giai_db=VALUES(giai_db), giai_1=VALUES(giai_1), giai_2=VALUES(giai_2),
        giai_3=VALUES(giai_3), giai_4=VALUES(giai_4), giai_5=VALUES(giai_5),
        giai_6=VALUES(giai_6), giai_7=VALUES(giai_7), dau=VALUES(dau), duoi=VALUES(duoi)
    `, ['Miền Bắc', today, giai_db, giai_1, giai_2, giai_3, giai_4, giai_5, giai_6, giai_7, dau, duoi]);

    console.log(`✅ KQXS MB ${today}: ĐB ${giai_db} | Đầu ${dau} Đuôi ${duoi}`);
  } catch(err) {
    console.error('❌ Lỗi fetch KQXS:', err.message);
  }
}

createKqxsTable().then(() => {
  fetchKQXS_MB();
  cron.schedule('30 18 * * *', fetchKQXS_MB, { timezone: 'Asia/Ho_Chi_Minh' });
  cron.schedule('45 18 * * *', fetchKQXS_MB, { timezone: 'Asia/Ho_Chi_Minh' });
  cron.schedule('0 19 * * *',  fetchKQXS_MB, { timezone: 'Asia/Ho_Chi_Minh' });
  console.log('✅ KQXS Auto-fetch đã khởi động!');
});

module.exports = { fetchKQXS_MB };

async function tinhDiem() {
  try {
    const today = new Date().toISOString().slice(0,10);
    const [kq] = await db.query('SELECT * FROM kqxs WHERE ngay = ? AND region = ?', [today, 'mb']);
    if (!kq.length || !kq[0].giai_db) return console.log('⏳ Chưa có KQXS để tính điểm');

    const k = kq[0];
    const allNums = [k.giai_db, k.giai_1, ...(k.giai_2||'').split(' - '),
      ...(k.giai_3||'').split(' - '), ...(k.giai_4||'').split(' - '),
      ...(k.giai_5||'').split(' - '), ...(k.giai_6||'').split(' - '),
      ...(k.giai_7||'').split(' - ')].filter(Boolean);

    const [preds] = await db.query(
      "SELECT * FROM predictions WHERE ngay = ? AND region = 'mb' AND ket_qua = 'pending'", [today]);

    for (const pred of preds) {
      let trung = false;
      let diem = 0;
      if (pred.loai === 'lo') {
        trung = allNums.some(n => n.slice(-2) === pred.so_du_doan.padStart(2,'0'));
        diem = trung ? 2 : 0;
      } else if (pred.loai === 'de') {
        trung = k.giai_db.slice(-2) === pred.so_du_doan.padStart(2,'0');
        diem = trung ? 5 : 0;
      } else if (pred.loai === 'bacang') {
        trung = allNums.some(n => n.slice(-3) === pred.so_du_doan.padStart(3,'0'));
        diem = trung ? 10 : 0;
      }
      await db.query('UPDATE predictions SET ket_qua = ?, diem_thuong = ? WHERE id = ?',
        [trung ? 'trung' : 'thua', diem, pred.id]);
      if (trung && diem > 0) {
        await db.query('UPDATE users SET diem = diem + ? WHERE id = ?', [diem, pred.user_id]);
        await db.query(`INSERT INTO leaderboard (user_id, month, year, diem, trung, tong_du_doan)
          VALUES (?, MONTH(NOW()), YEAR(NOW()), ?, 1, 1)
          ON DUPLICATE KEY UPDATE diem=diem+VALUES(diem), trung=trung+1, tong_du_doan=tong_du_doan+1`,
          [pred.user_id, diem]);
      } else {
        await db.query(`INSERT INTO leaderboard (user_id, month, year, tong_du_doan)
          VALUES (?, MONTH(NOW()), YEAR(NOW()), 1)
          ON DUPLICATE KEY UPDATE tong_du_doan=tong_du_doan+1`, [pred.user_id]);
      }
    }
    console.log(`✅ Tính điểm xong: ${preds.length} dự đoán`);
  } catch(e) { console.error('❌ Lỗi tính điểm:', e.message); }
}

// Tính điểm lúc 18:40 hàng ngày
cron.schedule('40 18 * * *', tinhDiem, { timezone: 'Asia/Ho_Chi_Minh' });
cron.schedule('0 19 * * *', tinhDiem, { timezone: 'Asia/Ho_Chi_Minh' });

module.exports.tinhDiem = tinhDiem;
