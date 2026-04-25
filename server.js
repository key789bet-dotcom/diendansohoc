const express  = require('express');
const path     = require('path');
const session  = require('express-session');
const http     = require('http');
const { Server } = require('socket.io');
const MySQLStore = require('express-mysql-session')(session);
const app      = express();
const server   = http.createServer(app);
const io       = new Server(server);
const PORT     = process.env.PORT || 3000;
require('dotenv').config();

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session store MySQL
const sessionStore = new MySQLStore({
  host:     process.env.DB_HOST || 'localhost',
  port:     3306,
  user:     process.env.DB_USER || 'gmsh',
  password: process.env.DB_PASS || 'Gmsh@2026',
  database: process.env.DB_NAME || 'diendansohoc',
  clearExpired: true,
  checkExpirationInterval: 900000,
  expiration: 7 * 24 * 60 * 60 * 1000,
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'gmsh_secret_2026',
  resave: false,
  saveUninitialized: true,
  store: sessionStore,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: "lax", secure: false }
}));

const { engine } = require('express-handlebars');
app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir:  path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    eq: (a, b) => a === b,
    timeAgo: (date) => {
      const d = new Date(date);
      return d.toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit'});
    },
    neq: (a, b) => a !== b,
    gt:  (a, b) => a > b,
    lt:  (a, b) => a < b,
    arr: (...args) => args.slice(0, -1),
    formatDate: (date) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('vi-VN', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
    },
  }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', require('./routes/index'));

app.use((req, res) => {
  res.status(404).render('404', { title: 'Không tìm thấy trang' });
});

// Socket.io
const db = require('./db');
const online = {};
io.on('connection', (socket) => {
  socket.on('join', (data) => {
    socket.username = data.username || 'Khách';
    socket.room = data.room || 'nhap-mon';
    socket.join(socket.room);
    online[socket.id] = { username: socket.username, room: socket.room };
    io.to(socket.room).emit('online_count',
      Object.values(online).filter(u => u.room === socket.room).length);
  });
  socket.on('chat_message', async (data) => {
    if (!data.message || !data.message.trim()) return;
    const msg = {
      username: socket.username,
      message: data.message.trim().substring(0, 500),
      time: new Date().toTimeString().slice(0,5),
      room: socket.room,
    };
    try {
      if (data.user_id) {
        await db.query('INSERT INTO chat_messages (user_id, room, message) VALUES (?,?,?)',
          [data.user_id, socket.room, msg.message]);
      }
    } catch(e) {}
    io.to(socket.room).emit('chat_message', msg);
  });
  socket.on('disconnect', () => {
    delete online[socket.id];
    if (socket.room) {
      io.to(socket.room).emit('online_count',
        Object.values(online).filter(u => u.room === socket.room).length);
    }
  });
});

require('./kqxs-auto');

server.listen(PORT, () => {
  console.log(`✅ GMSH + Socket.io chạy tại: http://localhost:${PORT}`);
});
