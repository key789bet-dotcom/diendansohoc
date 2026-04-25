const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const db      = require('../db');

const kqxs = { dacBiet:'53728', nhat:'14793', dau:'2', duoi:'8' };

function auth(req,res,next){ if(req.session&&req.session.user) return next(); res.redirect('/login'); }

router.get('/', (req,res) => res.redirect('/home'));

router.get('/home', async (req,res) => {
  try {
    const [cats] = await db.query(`
      SELECT c.*, 
        (SELECT p.title FROM posts p WHERE p.category_id = c.id ORDER BY p.created_at DESC LIMIT 1) as last_title,
        (SELECT p.id FROM posts p WHERE p.category_id = c.id ORDER BY p.created_at DESC LIMIT 1) as last_id,
        (SELECT u.username FROM posts p JOIN users u ON p.user_id=u.id WHERE p.category_id = c.id ORDER BY p.created_at DESC LIMIT 1) as last_author,
        (SELECT p.created_at FROM posts p WHERE p.category_id = c.id ORDER BY p.created_at DESC LIMIT 1) as last_date
      FROM categories c ORDER BY c.sort_order
    `);
    const [chatHistory] = await db.query("SELECT m.*,u.username,u.avatar FROM chat_messages m JOIN users u ON m.user_id=u.id WHERE m.room='nhap-mon' ORDER BY m.created_at DESC LIMIT 20");
    const [bxh2] = await db.query('SELECT l.*,u.username as name FROM leaderboard l JOIN users u ON l.user_id=u.id WHERE l.month=MONTH(NOW()) AND l.year=YEAR(NOW()) ORDER BY l.diem DESC LIMIT 5');
    const [b] = await db.query('SELECT p.*,u.username as author,c.name as tagLabel,u.avatar as author_avatar FROM posts p JOIN users u ON p.user_id=u.id JOIN categories c ON p.category_id=c.id ORDER BY p.created_at DESC LIMIT 20');
    res.render('home',{title:'Trang Chủ',pageHome:true,kqxs:{ dacBiet:"--", nhat:"--", dau:"-", duoi:"-" },bxh:bxh2.length?bxh2:mockBxh(),cats,chatHistory:chatHistory.reverse(),baiViet:b.length?b:mockBaiViet(),user:req.session.user||null});
  } catch(e){ res.render('home',{title:'Trang Chủ',pageHome:true,kqxs:{ dacBiet:"--", nhat:"--", dau:"-", duoi:"-" },bxh:mockBxh(),baiViet:mockBaiViet(),user:null}); }
});

router.get('/login',(req,res)=>{
  if(req.session.user) return res.redirect('/home');
  const error=req.session.loginError; const success=req.session.loginSuccess;
  delete req.session.loginError; delete req.session.loginSuccess;
  res.render('login',{title:'Đăng Nhập',layout:'auth',error,success});
});

router.post('/login', async (req,res)=>{
  const {username,password}=req.body;
  try {
    const [rows]=await db.query('SELECT * FROM users WHERE (username=? OR email=?) AND is_active=1',[username,username]);
    if(!rows.length){req.session.loginError='Sai tên đăng nhập hoặc mật khẩu!';return res.redirect('/login');}
    const ok=await bcrypt.compare(password,rows[0].password);
    if(!ok){req.session.loginError='Sai tên đăng nhập hoặc mật khẩu!';return res.redirect('/login');}
    req.session.user={id:rows[0].id,username:rows[0].username,rank:rows[0].user_rank};
    res.redirect('/home');
  } catch(e){console.error(e);req.session.loginError='Lỗi: '+e.message;res.redirect('/login');}
});

router.get('/register',(req,res)=>{
  const error=req.session.regError; delete req.session.regError;
  res.render('register',{title:'Đăng Ký',layout:'auth',error});
});

router.post('/register', async (req,res)=>{
  const {username,email,password,confirm,ho,ten,phone,region}=req.body;
  try {
    if(password!==confirm){req.session.regError='Mật khẩu không khớp!';return res.redirect('/register');}
    const [ex]=await db.query('SELECT id FROM users WHERE username=? OR email=?',[username,email]);
    if(ex.length){req.session.regError='Username hoặc email đã tồn tại!';return res.redirect('/register');}
    const hash=await bcrypt.hash(password,10);
    await db.query('INSERT INTO users(username,email,password,ho_ten,phone,region) VALUES(?,?,?,?,?,?)',[username,email,hash,((ho||'')+' '+(ten||'')).trim(),phone||null,region||'mb']);
    const [newUser2] = await db.query('SELECT * FROM users WHERE id=?', [result.insertId]);
req.session.user = { id: newUser2[0].id, username: newUser2[0].username, user_rank: newUser2[0].user_rank, avatar: newUser2[0].avatar };
req.session.loginSuccess = 'Đăng ký thành công! Chào mừng bạn!';
res.redirect('/home');
    res.redirect('/login');
  } catch(e){console.error(e);req.session.regError='Lỗi: '+e.message;res.redirect('/register');}
});

router.get('/logout',(req,res)=>{req.session.destroy();res.redirect('/home');});
router.get('/forum',async(req,res)=>{try{const [c]=await db.query('SELECT * FROM categories ORDER BY sort_order');res.render('forum',{title:'Diễn Đàn',kqxs:{ dacBiet:"--", nhat:"--", dau:"-", duoi:"-" },cats:c,user:req.session.user||null});}catch(e){res.render('forum',{title:'Diễn Đàn',kqxs:{ dacBiet:"--", nhat:"--", dau:"-", duoi:"-" },cats:[],user:null});}});
router.get('/post/:id',async(req,res)=>{try{const [p]=await db.query('SELECT po.*,u.username as author,u.avatar,c.name as tagLabel FROM posts po JOIN users u ON po.user_id=u.id JOIN categories c ON po.category_id=c.id WHERE po.id=?',[req.params.id]);if(!p.length)return res.render('404',{title:'404'});await db.query('UPDATE posts SET views=views+1 WHERE id=?',[p[0].id]);const [cm]=await db.query('SELECT c.*,u.username,u.avatar FROM comments c JOIN users u ON c.user_id=u.id WHERE c.post_id=? ORDER BY c.created_at',[p[0].id]);res.render('post',{title:p[0].title,post:p[0],comments:cm,kqxs:{ dacBiet:"--", nhat:"--", dau:"-", duoi:"-" },user:req.session.user||null});}catch(e){console.error(e);res.redirect('/home');}});
router.get('/post',(req,res)=>res.redirect('/forum'));
router.get('/profile',auth,(req,res)=>res.redirect('/profile/'+req.session.user.username));
router.get('/profile/:username',async(req,res)=>{try{const [u]=await db.query('SELECT * FROM users WHERE username=?',[req.params.username]);if(!u.length)return res.render('404',{title:'404'});const [b]=await db.query('SELECT * FROM posts WHERE user_id=? ORDER BY created_at DESC LIMIT 10',[u[0].id]);res.render('profile',{title:u[0].username,username:u[0].username,profile:u[0],baiViet:b,kqxs:{ dacBiet:"--", nhat:"--", dau:"-", duoi:"-" },user:req.session.user||null});}catch(e){console.error(e);res.redirect('/home');}});
router.get('/kqxs',(req,res)=>res.render('kqxs',{title:'KQXS',kqxs:{ dacBiet:"--", nhat:"--", dau:"-", duoi:"-" },user:req.session.user||null}));
router.get('/soi-cau',(req,res)=>res.render('soi-cau',{title:'Soi Cầu',kqxs:{ dacBiet:"--", nhat:"--", dau:"-", duoi:"-" },user:req.session.user||null}));
router.get('/cao-thu', async (req,res) => {
  try {
    const [cats] = await db.query(`
      SELECT c.*, 
        (SELECT p.title FROM posts p WHERE p.category_id = c.id ORDER BY p.created_at DESC LIMIT 1) as last_title,
        (SELECT p.id FROM posts p WHERE p.category_id = c.id ORDER BY p.created_at DESC LIMIT 1) as last_id,
        (SELECT u.username FROM posts p JOIN users u ON p.user_id=u.id WHERE p.category_id = c.id ORDER BY p.created_at DESC LIMIT 1) as last_author,
        (SELECT p.created_at FROM posts p WHERE p.category_id = c.id ORDER BY p.created_at DESC LIMIT 1) as last_date
      FROM categories c ORDER BY c.sort_order
    `);
    const [chatHistory] = await db.query("SELECT m.*,u.username,u.avatar FROM chat_messages m JOIN users u ON m.user_id=u.id WHERE m.room='nhap-mon' ORDER BY m.created_at DESC LIMIT 20");
    const [bxh] = await db.query(`
      SELECT l.*, u.username as name, u.user_rank,
             ROUND(l.trung/GREATEST(l.tong_du_doan,1)*100) as ty_le,
             RANK() OVER (ORDER BY l.diem DESC) as \`rank\`
      FROM leaderboard l
      JOIN users u ON l.user_id = u.id
      WHERE l.month = MONTH(NOW()) AND l.year = YEAR(NOW())
      ORDER BY l.diem DESC LIMIT 20
    `);
    res.render('cao-thu', {
      title: 'BXH Cao Thủ — GMSH',
      bxh: bxh.length ? bxh : mockBxh(),
      kqxs: { dacBiet:"--", nhat:"--", dau:"-", duoi:"-" },
      user: req.session.user||null
    });
  } catch(e) { res.render('cao-thu', { title: 'BXH', bxh: mockBxh(), kqxs: { dacBiet:"--", nhat:"--", dau:"-", duoi:"-" }, user: null }); }
});
router.get('/chat',(req,res)=>res.render('chat',{title:'Chat',layout:'main-full',user:req.session.user||null}));
router.get('/tools',(req,res)=>res.render('tools',{title:'Công Cụ',kqxs:{ dacBiet:"--", nhat:"--", dau:"-", duoi:"-" },user:req.session.user||null}));
router.get('/search',async(req,res)=>{const q=req.query.q||'';try{let r=[];if(q){const [rows]=await db.query('SELECT p.*,u.username as author,c.name as tagLabel,u.avatar as author_avatar FROM posts p JOIN users u ON p.user_id=u.id JOIN categories c ON p.category_id=c.id WHERE p.title LIKE ? LIMIT 20',[`%${q}%`]);r=rows;}res.render('search',{title:'Tìm: '+q,q,results:r,kqxs:{ dacBiet:"--", nhat:"--", dau:"-", duoi:"-" },user:req.session.user||null});}catch(e){res.render('search',{title:'Tìm',q,results:[],kqxs:{ dacBiet:"--", nhat:"--", dau:"-", duoi:"-" },user:null});}});
router.get('/admin',async(req,res)=>{try{const [[tp]]=await db.query('SELECT COUNT(*) as total_posts FROM posts');const [[tu]]=await db.query('SELECT COUNT(*) as total_users FROM users');const [rp]=await db.query('SELECT p.*,u.username as author FROM posts p JOIN users u ON p.user_id=u.id ORDER BY p.created_at DESC LIMIT 10');const [ru]=await db.query('SELECT * FROM users ORDER BY created_at DESC LIMIT 10');res.render('admin',{title:'Admin',layout:'admin',total_posts:tp.total_posts,total_users:tu.total_users,recentPosts:rp,recentUsers:ru,user:req.session.user||null});}catch(e){res.render('admin',{title:'Admin',layout:'admin',total_posts:0,total_users:0,recentPosts:[],recentUsers:[],user:null});}});

function mockBxh(){return[{rank:1,name:'sosegiau68',diem:72,ty_le:'72%'},{rank:2,name:'BEOHP88',diem:70,ty_le:'70%'},{rank:3,name:'ledung123d',diem:68,ty_le:'68%'},{rank:4,name:'OTTHOC77',diem:66,ty_le:'66%'},{rank:5,name:'ANHVTP83',diem:64,ty_le:'64%'}];}
function mockBaiViet(){return[{id:1,tag:'tl',tagLabel:'Thảo luận',title:'CÁI BANG THỐNG NHẤT THIÊN HA 2,3,4D',author:'MAIDEN86',likes:53,views:'84K',reply_count:2511},{id:2,tag:'mb',tagLabel:'Cầu MB',title:'Cầu Lô MB 23/04/2026',author:'ADMIN',likes:2,views:'327',reply_count:23}];}


// Xóa dòng module.exports ở cuối trước khi thêm

router.get('/create-post', (req,res,next)=>{if(!req.session||!req.session.user){return res.redirect('/login');}next()}, async (req,res) => {
  try {
    const [cats] = await db.query(`
      SELECT c.*, 
        (SELECT p.title FROM posts p WHERE p.category_id = c.id ORDER BY p.created_at DESC LIMIT 1) as last_title,
        (SELECT p.id FROM posts p WHERE p.category_id = c.id ORDER BY p.created_at DESC LIMIT 1) as last_id,
        (SELECT u.username FROM posts p JOIN users u ON p.user_id=u.id WHERE p.category_id = c.id ORDER BY p.created_at DESC LIMIT 1) as last_author,
        (SELECT p.created_at FROM posts p WHERE p.category_id = c.id ORDER BY p.created_at DESC LIMIT 1) as last_date
      FROM categories c ORDER BY c.sort_order
    `);
    const [chatHistory] = await db.query("SELECT m.*,u.username,u.avatar FROM chat_messages m JOIN users u ON m.user_id=u.id WHERE m.room='nhap-mon' ORDER BY m.created_at DESC LIMIT 20");
    res.render('create-post', { title: 'Đăng Bài Viết — GMSH', cats, user: req.session.user });
  } catch(e) { res.redirect('/forum'); }
});

router.post('/create-post', (req,res,next)=>{if(!req.session||!req.session.user){return res.redirect('/login');}next()}, async (req,res) => {
  const { title, content, category_id, tag } = req.body;
  try {
    if (!title || !content || !category_id) {
      return res.render('create-post', { title: 'Đăng Bài', error: 'Vui lòng điền đầy đủ thông tin!', user: req.session.user, cats: [] });
    }
    const [result] = await db.query(
      'INSERT INTO posts (title, content, user_id, category_id, tag) VALUES (?, ?, ?, ?, ?)',
      [title.trim(), content, req.session.user.id, category_id, tag || 'tl']
    );
    await db.query('UPDATE categories SET post_count = post_count + 1 WHERE id = ?', [category_id]);
    await db.query('UPDATE users SET diem = diem + 1 WHERE id = ?', [req.session.user.id]);
    res.redirect('/post/' + result.insertId);
  } catch(e) { console.error(e); res.redirect('/create-post'); }
});



router.post('/post/:id/like', async (req,res) => {
  if (!req.session.user) return res.json({ error: 'Chưa đăng nhập' });
  try {
    await db.query('UPDATE posts SET likes = likes + 1 WHERE id = ?', [req.params.id]);
    const [[post]] = await db.query('SELECT likes FROM posts WHERE id = ?', [req.params.id]);
    res.json({ likes: post.likes });
  } catch(e) { res.json({ error: e.message }); }
});



router.get('/settings', (req,res,next)=>{if(!req.session||!req.session.user){return res.redirect('/login');}next()}, async (req,res) => {
  try {
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.session.user.id]);
    const success = req.session.settingsSuccess; const error = req.session.settingsError;
    delete req.session.settingsSuccess; delete req.session.settingsError;
    res.render('settings', { title: 'Cài Đặt — GMSH', profile: users[0], user: req.session.user, success, error });
  } catch(e) { res.redirect('/home'); }
});

router.post('/settings/profile', (req,res,next)=>{if(!req.session||!req.session.user){return res.redirect('/login');}next()}, async (req,res) => {
  const { ho_ten, phone, email, region } = req.body;
  try {
    await db.query('UPDATE users SET ho_ten=?, phone=?, email=?, region=? WHERE id=?',
      [ho_ten, phone, email, region, req.session.user.id]);
    req.session.settingsSuccess = 'Cập nhật thông tin thành công!';
    res.redirect('/settings');
  } catch(e) { req.session.settingsError = 'Lỗi: ' + e.message; res.redirect('/settings'); }
});

router.post('/settings/password', (req,res,next)=>{if(!req.session||!req.session.user){return res.redirect('/login');}next()}, async (req,res) => {
  const { old_password, new_password, confirm_password } = req.body;
  try {
    if (new_password !== confirm_password) {
      req.session.settingsError = 'Mật khẩu mới không khớp!';
      return res.redirect('/settings');
    }
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.session.user.id]);
    const match = await bcrypt.compare(old_password, users[0].password);
    if (!match) { req.session.settingsError = 'Mật khẩu hiện tại không đúng!'; return res.redirect('/settings'); }
    const hash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.session.user.id]);
    req.session.settingsSuccess = 'Đổi mật khẩu thành công!';
    res.redirect('/settings');
  } catch(e) { req.session.settingsError = 'Lỗi: ' + e.message; res.redirect('/settings'); }
});



router.get('/kqxs', async (req,res) => {
  try {
    const today = new Date().toISOString().slice(0,10);
    const [rows] = await db.query('SELECT * FROM kqxs WHERE ngay = ? ORDER BY region', [today]);
    const mb = rows.find(r => r.region === 'mb') || null;
    const mn = rows.find(r => r.region === 'mn') || null;
    const mt = rows.find(r => r.region === 'mt') || null;
    res.render('kqxs', { title: 'KQXS — GMSH', kqxs: mb || kqxsFallback(), mb, mn, mt, user: req.session.user||null });
  } catch(e) {
    res.render('kqxs', { title: 'KQXS', kqxs: kqxsFallback(), user: req.session.user||null });
  }
});

function kqxsFallback() {
  return { dacBiet:'--', nhat:'--', dau:'-', duoi:'-' };
}



// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
router.get('/notifications', async (req,res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [notifs] = await db.query(`
      SELECT n.*, u.username as from_username, p.title as post_title
      FROM notifications n
      JOIN users u ON n.from_user_id = u.id
      JOIN posts p ON n.post_id = p.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [req.session.user.id]);
    await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.session.user.id]);
    res.render('notifications', { title: 'Thông Báo — GMSH', notifs, user: req.session.user });
  } catch(e) { res.redirect('/home'); }
});

router.get('/notifications/count', async (req,res) => {
  if (!req.session.user) return res.json({ count: 0 });
  try {
    const [[row]] = await db.query('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0', [req.session.user.id]);
    res.json({ count: row.count });
  } catch(e) { res.json({ count: 0 }); }
});



// ── ADMIN MIDDLEWARE ──────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  if (req.session.user.rank !== 'admin') {
    return res.status(403).render('404', { title: '403 — Không có quyền truy cập' });
  }
  next();
}

// ── ADMIN ROUTES ──────────────────────────────────────────────────────────────
router.get('/admin', requireAdmin, async (req,res) => {
  try {
    const [[{total_posts}]] = await db.query('SELECT COUNT(*) as total_posts FROM posts');
    const [[{total_users}]] = await db.query('SELECT COUNT(*) as total_users FROM users');
    const [[{total_comments}]] = await db.query('SELECT COUNT(*) as total_comments FROM comments');
    const [recentPosts] = await db.query(`SELECT p.id, p.title, p.views, p.created_at, u.username as author FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC LIMIT 10`);
    const [recentUsers] = await db.query('SELECT id, username, email, user_rank, created_at, is_active FROM users ORDER BY created_at DESC LIMIT 10');
    res.render('admin', {
      title: 'Admin Dashboard', layout: 'admin',
      total_posts, total_users, total_comments,
      recentPosts, recentUsers,
      user: req.session.user
    });
  } catch(e) { console.error(e); res.redirect('/home'); }
});

router.post('/admin/user/:id/ban', requireAdmin, async (req,res) => {
  try {
    await db.query('UPDATE users SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.json({ error: e.message }); }
});

router.post('/admin/user/:id/unban', requireAdmin, async (req,res) => {
  try {
    await db.query('UPDATE users SET is_active = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.json({ error: e.message }); }
});

router.post('/admin/user/:id/rank', requireAdmin, async (req,res) => {
  const { rank } = req.body;
  try {
    await db.query('UPDATE users SET user_rank = ? WHERE id = ?', [rank, req.params.id]);
    res.json({ success: true });
  } catch(e) { res.json({ error: e.message }); }
});

router.post('/admin/post/:id/delete', requireAdmin, async (req,res) => {
  try {
    await db.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.json({ error: e.message }); }
});



router.get('/sitemap.xml', (req,res) => {
  res.sendFile('/var/www/diendansohoc/public/sitemap.xml');
});
router.get('/robots.txt', (req,res) => {
  res.sendFile('/var/www/diendansohoc/public/robots.txt');
});



// ── QUÊN MẬT KHẨU ────────────────────────────────────────────────────────────
router.get('/forgot-password', (req,res) => {
  const error = req.session.fpError; const success = req.session.fpSuccess;
  delete req.session.fpError; delete req.session.fpSuccess;
  res.render('forgot-password', { title: 'Quên Mật Khẩu — GMSH', layout: 'auth', error, success });
});

router.post('/forgot-password', async (req,res) => {
  const { email } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users.length) {
      req.session.fpError = 'Email không tồn tại trong hệ thống!';
      return res.redirect('/forgot-password');
    }
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 phút
    await db.query('DELETE FROM password_resets WHERE email = ?', [email]);
    await db.query('INSERT INTO password_resets (email, token, expires_at) VALUES (?,?,?)',
      [email, token, expires]);
    const mailer = require('../mailer');
    await mailer.sendResetEmail(email, users[0].username, token);
    req.session.fpSuccess = '✅ Email đặt lại mật khẩu đã được gửi! Kiểm tra hộp thư của bạn.';
    res.redirect('/forgot-password');
  } catch(e) { console.error(e); req.session.fpError = 'Lỗi: ' + e.message; res.redirect('/forgot-password'); }
});

router.get('/reset-password/:token', async (req,res) => {
  try {
    const [rows] = await db.query('SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()', [req.params.token]);
    if (!rows.length) return res.render('reset-password', { title: 'Reset Mật Khẩu', layout: 'auth', error: 'Link đã hết hạn hoặc không hợp lệ!' });
    res.render('reset-password', { title: 'Đặt Lại Mật Khẩu — GMSH', layout: 'auth', token: req.params.token });
  } catch(e) { res.redirect('/forgot-password'); }
});

router.post('/reset-password/:token', async (req,res) => {
  const { password, confirm } = req.body;
  try {
    if (password !== confirm) return res.render('reset-password', { title: 'Reset', layout: 'auth', error: 'Mật khẩu không khớp!', token: req.params.token });
    if (password.length < 6) return res.render('reset-password', { title: 'Reset', layout: 'auth', error: 'Mật khẩu phải ít nhất 6 ký tự!', token: req.params.token });
    const [rows] = await db.query('SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()', [req.params.token]);
    if (!rows.length) return res.render('reset-password', { title: 'Reset', layout: 'auth', error: 'Link đã hết hạn!', token: req.params.token });
    const hash = await bcrypt.hash(password, 10);
    await db.query('UPDATE users SET password = ? WHERE email = ?', [hash, rows[0].email]);
    await db.query('DELETE FROM password_resets WHERE token = ?', [req.params.token]);
    req.session.loginSuccess = '✅ Đặt lại mật khẩu thành công! Mời đăng nhập.';
    res.redirect('/login');
  } catch(e) { console.error(e); res.redirect('/forgot-password'); }
});



// ── DỰ ĐOÁN ──────────────────────────────────────────────────────────────────
router.get('/du-doan', async (req,res) => {
  try {
    const today = new Date().toISOString().slice(0,10);
    const [allPreds] = await db.query(`
      SELECT p.*, u.username FROM predictions p
      JOIN users u ON p.user_id = u.id
      WHERE p.ngay = ? ORDER BY p.created_at DESC LIMIT 50
    `, [today]);
    let myPreds = [];
    if (req.session.user) {
      const [mp] = await db.query('SELECT * FROM predictions WHERE user_id = ? AND ngay = ?', [req.session.user.id, today]);
      myPreds = mp;
    }
    const success = req.session.predSuccess; const error = req.session.predError;
    delete req.session.predSuccess; delete req.session.predError;
    res.render('du-doan', { title: 'Dự Đoán Hôm Nay — GMSH', today, allPreds, myPreds, totalPreds: allPreds.length, user: req.session.user||null, success, error });
  } catch(e) { console.error(e); res.redirect('/home'); }
});

router.post('/du-doan', async (req,res) => {
  if (!req.session.user) return res.redirect('/login');
  const { so_du_doan, loai, region } = req.body;
  try {
    if (!so_du_doan || !so_du_doan.match(/^\d{2,3}$/)) {
      req.session.predError = 'Số dự đoán không hợp lệ! Nhập 2-3 chữ số.';
      return res.redirect('/du-doan');
    }
    const today = new Date().toISOString().slice(0,10);
    await db.query('INSERT INTO predictions (user_id, ngay, region, so_du_doan, loai) VALUES (?,?,?,?,?)',
      [req.session.user.id, today, region||'mb', so_du_doan, loai||'lo']);
    req.session.predSuccess = `✅ Đã chốt số ${so_du_doan} thành công!`;
    res.redirect('/du-doan');
  } catch(e) {
    if (e.code === 'ER_DUP_ENTRY') req.session.predError = 'Bạn đã chốt số này rồi!';
    else req.session.predError = 'Lỗi: ' + e.message;
    res.redirect('/du-doan');
  }
});

router.post('/du-doan/:id/delete', async (req,res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await db.query('DELETE FROM predictions WHERE id = ? AND user_id = ?', [req.params.id, req.session.user.id]);
    res.redirect('/du-doan');
  } catch(e) { res.redirect('/du-doan'); }
});





// ── ADMIN: GHIM & DUYỆT BÀI ──────────────────────────────────────────────────
router.post('/admin/post/:id/pin', requireAdmin, async (req,res) => {
  try {
    await db.query('UPDATE posts SET is_pinned = NOT is_pinned WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.json({ error: e.message }); }
});

router.post('/admin/post/:id/approve', requireAdmin, async (req,res) => {
  try {
    await db.query('UPDATE posts SET is_approved = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.json({ error: e.message }); }
});

router.post('/admin/post/:id/reject', requireAdmin, async (req,res) => {
  try {
    await db.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.json({ error: e.message }); }
});



// ── UPLOAD AVATAR ─────────────────────────────────────────────────────────────
const { upload, saveAvatar, uploadPost } = require('../upload');

router.post('/settings/avatar', upload.single('avatar'), async (req,res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    if (!req.file) {
      req.session.settingsError = 'Vui lòng chọn file ảnh!';
      return res.redirect('/settings');
    }
    const avatarUrl = await saveAvatar(req.file.buffer, req.session.user.username);
    // Xóa avatar cũ
    const [users] = await db.query('SELECT avatar FROM users WHERE id = ?', [req.session.user.id]);
    if (users[0].avatar && users[0].avatar.includes('/uploads/')) {
      const oldPath = '/var/www/diendansohoc/public' + users[0].avatar;
      try { require('fs').unlinkSync(oldPath); } catch(e) {}
    }
    await db.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, req.session.user.id]);
    req.session.user.avatar = avatarUrl;
    req.session.settingsSuccess = '✅ Cập nhật avatar thành công!';
    res.redirect('/settings');
  } catch(e) {
    req.session.settingsError = 'Lỗi upload: ' + e.message;
    res.redirect('/settings');
  }
});



// ── REPLY COMMENT ─────────────────────────────────────────────────────────────
router.post('/post/:id/reply/:commentId', async (req,res) => {
  if (!req.session.user) return res.redirect('/login');
  const { content } = req.body;
  const postId = req.params.id;
  const parentId = req.params.commentId;
  if (!content || !content.trim()) return res.redirect('/post/' + postId);
  try {
    await db.query('INSERT INTO comments (post_id, user_id, content, parent_id) VALUES (?,?,?,?)',
      [postId, req.session.user.id, content.trim(), parentId]);
    await db.query('UPDATE posts SET reply_count = reply_count + 1 WHERE id = ?', [postId]);
    await db.query('UPDATE users SET diem = diem + 1 WHERE id = ?', [req.session.user.id]);
    res.redirect('/post/' + postId + '#comment-' + parentId);
  } catch(e) { console.error(e); res.redirect('/post/' + postId); }
});



router.post('/post/:id/comment', async (req,res) => {
  if (!req.session.user) return res.redirect('/login');
  const { content } = req.body;
  const postId = req.params.id;
  if (!content || !content.trim()) return res.redirect('/post/' + postId);
  try {
    await db.query('INSERT INTO comments (post_id, user_id, content) VALUES (?,?,?)',
      [postId, req.session.user.id, content.trim()]);
    await db.query('UPDATE posts SET reply_count = reply_count + 1 WHERE id = ?', [postId]);
    await db.query('UPDATE users SET diem = diem + 1 WHERE id = ?', [req.session.user.id]);
    res.redirect('/post/' + postId);
  } catch(e) { console.error(e); res.redirect('/post/' + postId); }
});


// ── MESSAGES ──────────────────────────────────────────────────────────────────
router.get('/messages', async (req,res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [conversations] = await db.query(`
      SELECT 
        CASE WHEN m.from_user_id = ? THEN m.to_user_id ELSE m.from_user_id END as other_id,
        u.username as other_username,
        MAX(m.content) as last_message,
        SUM(CASE WHEN m.to_user_id = ? AND m.is_read = 0 THEN 1 ELSE 0 END) as unread
      FROM messages m
      JOIN users u ON u.id = CASE WHEN m.from_user_id = ? THEN m.to_user_id ELSE m.from_user_id END
      WHERE m.from_user_id = ? OR m.to_user_id = ?
      GROUP BY other_id, other_username
      ORDER BY MAX(m.created_at) DESC
    `, [req.session.user.id, req.session.user.id, req.session.user.id, req.session.user.id, req.session.user.id]);
    res.render('messages', { title: 'Tin Nhắn — DDSH', conversations, user: req.session.user });
  } catch(e) { console.error(e); res.redirect('/home'); }
});

router.get('/messages/new', (req,res) => {
  if (!req.session.user) return res.redirect('/login');
  const error = req.session.msgError; delete req.session.msgError;
  res.render('messages-new', { title: 'Tin Nhắn Mới — DDSH', user: req.session.user, error });
});

router.post('/messages/new', async (req,res) => {
  if (!req.session.user) return res.redirect('/login');
  const { to_username, content } = req.body;
  try {
    const [users] = await db.query('SELECT id FROM users WHERE username = ?', [to_username]);
    if (!users.length) { req.session.msgError = 'Không tìm thấy thành viên này!'; return res.redirect('/messages/new'); }
    if (users[0].id === req.session.user.id) { req.session.msgError = 'Không thể nhắn tin cho chính mình!'; return res.redirect('/messages/new'); }
    await db.query('INSERT INTO messages (from_user_id, to_user_id, content) VALUES (?,?,?)', [req.session.user.id, users[0].id, content]);
    res.redirect('/messages/' + users[0].id);
  } catch(e) { console.error(e); res.redirect('/messages/new'); }
});

router.get('/messages/:userId', async (req,res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [users] = await db.query('SELECT id, username FROM users WHERE id = ?', [req.params.userId]);
    if (!users.length) return res.redirect('/messages');
    const [msgs] = await db.query(
      'SELECT * FROM messages WHERE (from_user_id=? AND to_user_id=?) OR (from_user_id=? AND to_user_id=?) ORDER BY created_at ASC',
      [req.session.user.id, req.params.userId, req.params.userId, req.session.user.id]
    );
    await db.query('UPDATE messages SET is_read=1 WHERE to_user_id=? AND from_user_id=?', [req.session.user.id, req.params.userId]);
    const [conversations] = await db.query(`
      SELECT CASE WHEN m.from_user_id = ? THEN m.to_user_id ELSE m.from_user_id END as other_id,
        u.username as other_username, MAX(m.content) as last_message,
        SUM(CASE WHEN m.to_user_id = ? AND m.is_read = 0 THEN 1 ELSE 0 END) as unread
      FROM messages m
      JOIN users u ON u.id = CASE WHEN m.from_user_id = ? THEN m.to_user_id ELSE m.from_user_id END
      WHERE m.from_user_id = ? OR m.to_user_id = ?
      GROUP BY other_id, other_username ORDER BY MAX(m.created_at) DESC
    `, [req.session.user.id, req.session.user.id, req.session.user.id, req.session.user.id, req.session.user.id]);
    res.render('messages', { title: 'Tin Nhắn — DDSH', conversations, msgs, activeId: parseInt(req.params.userId), activeUser: users[0].username, user: req.session.user });
  } catch(e) { console.error(e); res.redirect('/messages'); }
});

router.post('/messages/:userId/send', async (req,res) => {
  if (!req.session.user) return res.json({ error: 'Chưa đăng nhập' });
  const { content } = req.body;
  try {
    await db.query('INSERT INTO messages (from_user_id, to_user_id, content) VALUES (?,?,?)', [req.session.user.id, req.params.userId, content]);
    res.json({ success: true });
  } catch(e) { res.json({ error: e.message }); }
});


// ── UPLOAD ẢNH BÀI VIẾT ───────────────────────────────────────────────────────
router.post('/upload-image', (req,res,next) => {
  if (!req.session.user) return res.json({ error: 'Chưa đăng nhập' });
  next();
}, uploadPost.single('image'), async (req,res) => {
  try {
    if (!req.file) return res.json({ error: 'Không có file!' });
    res.json({ url: '/uploads/posts/' + req.file.filename });
  } catch(e) {
    res.json({ error: e.message });
  }
});

module.exports = router;
