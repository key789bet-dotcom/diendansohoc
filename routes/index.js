const express = require('express');
const router  = express.Router();

// ── Mock data ────────────────────────────────────────────────────────────────
const kqxsToday = {
  date: 'Thứ Năm 23/04/2026',
  dacBiet: '53728',
  nhat:    '14793',
  nhi:     '38471 — 62904',
  dau: '2', duoi: '8',
};

const bxhTop5 = [
  { rank:1, name:'sosegiau68', diem:72, ty_le:'72%' },
  { rank:2, name:'BEOHP88',    diem:70, ty_le:'70%' },
  { rank:3, name:'ledung123d', diem:68, ty_le:'68%' },
  { rank:4, name:'OTTHOC77',   diem:66, ty_le:'66%' },
  { rank:5, name:'ANHVTP83',   diem:64, ty_le:'64%' },
];

const baiVietMoi = [
  { id:1, tag:'tl',   tagLabel:'Thảo luận', title:'CÁI BANG THỐNG NHẤT THIÊN HA 2,3,4D - T4/2026',          author:'MAIDEN86',   likes:53, views:'84K', replies:2511, time:'11 phút trước' },
  { id:2, tag:'tl',   tagLabel:'Thảo luận', title:'TIÊU DIỆT ĐỒNG NÁT VỚI 2,3,4D NAM TRUNG BẮC T4',         author:'VIETHOANG2', likes:28, views:'39K', replies:3194, time:'14 phút trước' },
  { id:3, tag:'k2n',  tagLabel:'Lô K2N',    title:'BẮT CHỐT BẠCH THỦ LÔ KHUNG 2N MIỀN NAM T4/2026',        author:'ADMIN',      likes:7,  views:'4K',  replies:465,  time:'30 phút trước' },
  { id:4, tag:'ht',   tagLabel:'Huyền Thoại',title:'NGÀY 23-04-2026 - CAO THỦ HUYỀN THOẠI CHỐT SỐ',        author:'ADMIN',      likes:3,  views:'347', replies:6,    time:'45 phút trước' },
  { id:5, tag:'de36', tagLabel:'Đề 36S',    title:'CÁCH NUÔI DÀN ĐỀ 36S - KHUNG 3 NGÀY KIẾM TIỀN',         author:'thantai779', likes:7,  views:'926', replies:0,    time:'Lúc 13:01'     },
  { id:6, tag:'bc',   tagLabel:'Bắt chốt',  title:'THỨ 5 NGÀY 23-04-2026 | THÀNH VIÊN CHỐT SỐ',            author:'ADMIN',      likes:5,  views:'333', replies:17,   time:'Lúc 12:44'     },
  { id:7, tag:'mb',   tagLabel:'Cầu MB',    title:'Cầu Lô + Đề XS Miền Bắc Ngày 23/04/2026 — Giải Mã Số Học',author:'ADMIN',   likes:2,  views:'327', replies:23,   time:'Lúc 12:01'     },
  { id:8, tag:'tl',   tagLabel:'Thảo luận', title:'PHƯƠNG PHÁP CHƠI LÔ ĐỀ HIỆU QUẢ — HỌC TỪ CAO THỦ',     author:'longpro99',  likes:41, views:'12K', replies:892,  time:'Lúc 11:55'     },
];

// sidebar data available

// ── Redirect / → /home ──────────────────────────────────────────────────────
router.get('/', (req, res) => res.redirect('/home'));

// ── HOME ────────────────────────────────────────────────────────────────────
router.get('/home', (req, res) => {
  res.render('home', {
    title:     'Trang Chủ — GMSH Diễn Đàn',
    pageHome:  true,
    kqxs:      kqxsToday,
    bxh:       bxhTop5,
    baiViet:   baiVietMoi,
  });
});

// ── LOGIN ───────────────────────────────────────────────────────────────────
router.get('/login', (req, res) => {
  res.render('login', { title: 'Đăng Nhập — GMSH', layout: 'auth' });
});
router.post('/login', (req, res) => {
  // TODO: xác thực DB
  res.redirect('/home');
});

// ── REGISTER ────────────────────────────────────────────────────────────────
router.get('/register', (req, res) => {
  res.render('register', { title: 'Đăng Ký — GMSH', layout: 'auth' });
});
router.post('/register', (req, res) => {
  // TODO: tạo tài khoản DB
  res.redirect('/login');
});

// ── FORUM ───────────────────────────────────────────────────────────────────
router.get('/forum', (req, res) => {
  res.render('forum', {
    title:  'Diễn Đàn — GMSH',
    kqxs:   kqxsToday,
    bxh:    bxhTop5,
  });
});

// ── POST chi tiết ───────────────────────────────────────────────────────────
router.get('/post/:id', (req, res) => {
  const post = baiVietMoi.find(b => b.id === parseInt(req.params.id)) || baiVietMoi[0];
  res.render('post', {
    title: post.title + ' — GMSH',
    post,
    kqxs:  kqxsToday,
  });
});
// /post không có id → redirect bài đầu
router.get('/post', (req, res) => res.redirect('/post/1'));

// ── PROFILE ─────────────────────────────────────────────────────────────────
router.get('/profile', (req, res) => {
  res.render('profile', { title: 'Hồ Sơ Thành Viên — GMSH', kqxs: kqxsToday });
});
router.get('/profile/:username', (req, res) => {
  res.render('profile', {
    title:    req.params.username + ' — GMSH',
    username: req.params.username,
    kqxs:     kqxsToday,
  });
});

// ── KQXS ────────────────────────────────────────────────────────────────────
router.get('/kqxs', (req, res) => {
  res.render('kqxs', { title: 'Kết Quả Xổ Số — GMSH', kqxs: kqxsToday });
});

// ── SOI-CAU ─────────────────────────────────────────────────────────────────
router.get('/soi-cau', (req, res) => {
  res.render('soi-cau', { title: 'Soi Cầu MB — GMSH', kqxs: kqxsToday });
});

// ── CAO-THU ─────────────────────────────────────────────────────────────────
router.get('/cao-thu', (req, res) => {
  res.render('cao-thu', { title: 'Bảng Xếp Hạng Cao Thủ — GMSH', bxh: bxhTop5, kqxs: kqxsToday });
});

// ── CHAT ────────────────────────────────────────────────────────────────────
router.get('/chat', (req, res) => {
  res.render('chat', { title: 'Chat Live — GMSH', layout: 'main-full' });
});

// ── TOOLS ───────────────────────────────────────────────────────────────────
router.get('/tools', (req, res) => {
  res.render('tools', { title: 'Công Cụ Xổ Số — GMSH', kqxs: kqxsToday });
});

// ── SEARCH ──────────────────────────────────────────────────────────────────
router.get('/search', (req, res) => {
  const q = req.query.q || '';
  const results = q ? baiVietMoi.filter(b => b.title.toLowerCase().includes(q.toLowerCase())) : [];
  res.render('search', { title: `Tìm kiếm: ${q} — GMSH`, q, results, kqxs: kqxsToday });
});

// ── ADMIN ───────────────────────────────────────────────────────────────────
router.get('/admin', (req, res) => {
  res.render('admin', { title: 'Admin Dashboard — GMSH', layout: 'admin' });
});

module.exports = router;
