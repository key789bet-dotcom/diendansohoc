const express = require('express');
const path    = require('path');
const app     = express();
const PORT    = process.env.PORT || 3000;

// ── Static files (CSS, JS, images) ─────────────────────────────
app.use('/public', express.static(path.join(__dirname, 'public')));

// ── Template engine (Handlebars) ───────────────────────────────
const { engine } = require('express-handlebars');
app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir:   path.join(__dirname, 'views/layouts'),
  partialsDir:  path.join(__dirname, 'views/partials'),
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// ── Routes ─────────────────────────────────────────────────────
app.use('/', require('./routes/index'));

// ── 404 ────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('404', { title: 'Không tìm thấy trang' });
});

app.listen(PORT, () => {
  console.log(`\n✅ GMSH Diễn Đàn chạy tại: http://localhost:${PORT}`);
  console.log(`   /home       → http://localhost:${PORT}/home`);
  console.log(`   /login      → http://localhost:${PORT}/login`);
  console.log(`   /register   → http://localhost:${PORT}/register`);
  console.log(`   /forum      → http://localhost:${PORT}/forum`);
  console.log(`   /post/:id   → http://localhost:${PORT}/post/1`);
  console.log(`   /profile    → http://localhost:${PORT}/profile`);
  console.log(`   /kqxs       → http://localhost:${PORT}/kqxs`);
  console.log(`   /soi-cau    → http://localhost:${PORT}/soi-cau`);
  console.log(`   /cao-thu    → http://localhost:${PORT}/cao-thu`);
  console.log(`   /chat       → http://localhost:${PORT}/chat`);
  console.log(`   /tools      → http://localhost:${PORT}/tools`);
  console.log(`   /search     → http://localhost:${PORT}/search`);
  console.log(`   /admin      → http://localhost:${PORT}/admin\n`);
});
