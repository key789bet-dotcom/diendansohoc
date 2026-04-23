// GMSH DIENDANSOHOC — Global JS
document.addEventListener('DOMContentLoaded', () => {
  initChat(); initTicker(); initTabs(); initFlash();
});

function initChat() {
  const box = document.getElementById('chatBox');
  const inp = document.getElementById('chatInput');
  const btn = document.getElementById('chatSend');
  if (!box || !inp) return;
  box.scrollTop = box.scrollHeight;
  const send = () => {
    const msg = inp.value.trim(); if (!msg) return;
    const t = new Date().toTimeString().slice(0,5);
    const d = document.createElement('div'); d.className = 'chat-msg';
    d.innerHTML = `<span class="chat-user">@ Bạn</span><span class="chat-time">${t}</span><br><span class="chat-text">${msg.replace(/</g,'&lt;')}</span>`;
    box.appendChild(d); box.scrollTop = box.scrollHeight; inp.value = '';
  };
  if (btn) btn.onclick = send;
  inp.onkeypress = e => { if (e.key === 'Enter') send(); };
}

function initTicker() {
  const t = document.querySelector('.ticker-text');
  if (!t) return;
  t.addEventListener('mouseenter', () => t.style.animationPlayState = 'paused');
  t.addEventListener('mouseleave', () => t.style.animationPlayState = 'running');
}

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = function() {
      const g = this.closest('.tab-group');
      g.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      g.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      const p = document.getElementById(this.dataset.tab);
      if (p) p.classList.add('active');
    };
  });
}

function initFlash() {
  document.querySelectorAll('.alert.auto-hide').forEach(el => {
    setTimeout(() => el.remove(), 4000);
  });
}
