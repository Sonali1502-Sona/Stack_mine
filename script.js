const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const W = 420, H = 560;
canvas.width = W; canvas.height = H;

const BLOCK_H = 28;
const COLORS = ['#7c6aff','#ff6a9b','#6affdb','#ffb86a','#6ab4ff','#ff6a6a','#b86aff','#6affa0'];

let state = 'idle', blocks = [], moving = null;
let score = 0, best = 0, speed = 1.8, baseSpeed = 1.8;
let dir = 1, raf = null, speedMode = 'normal', perfectStreak = 0;

const scoreEl = document.getElementById('score-display');
const bestEl = document.getElementById('best-score');
const finalEl = document.getElementById('final-score');
const overMsg = document.getElementById('over-msg');
const startOverlay = document.getElementById('start-overlay');
const overOverlay = document.getElementById('over-overlay');
const pfEl = document.getElementById('perfect-flash');
const hintEl = document.getElementById('hint-text');

function colorForLevel(i) { return COLORS[i % COLORS.length]; }

function initGame() {
  blocks = []; score = 0; scoreEl.textContent = '0';
  speed = baseSpeed; dir = 1; perfectStreak = 0;
  const groundY = H - BLOCK_H, groundW = 220;
  blocks.push({ x: (W - groundW) / 2, y: groundY, w: groundW, color: colorForLevel(0) });
  spawnMoving();
  state = 'playing';
  hintEl.style.opacity = '0.3';
  startOverlay.classList.add('hidden');
  overOverlay.classList.add('hidden');
  loop();
}

function spawnMoving() {
  const last = blocks[blocks.length - 1];
  const y = last.y - BLOCK_H;
  if (y < BLOCK_H * 2) { endGame('tower'); return; }
  moving = { x: dir > 0 ? -last.w : W, y, w: last.w, color: colorForLevel(blocks.length) };
  dir *= -1;
}

function drop() {
  if (state !== 'playing' || !moving) return;
  const last = blocks[blocks.length - 1];
  const ol = Math.max(moving.x, last.x);
  const or = Math.min(moving.x + moving.w, last.x + last.w);
  const overlap = or - ol;
  if (overlap <= 0) { endGame('miss'); return; }
  const isPerfect = Math.abs(overlap - last.w) < 6;
  if (isPerfect) {
    blocks.push({ x: last.x, y: moving.y, w: last.w, color: moving.color });
    perfectStreak++;
    showPerfect();
    score += perfectStreak >= 3 ? 3 : 2;
  } else {
    blocks.push({ x: ol, y: moving.y, w: overlap, color: moving.color });
    perfectStreak = 0;
    score += 1;
  }
  scoreEl.textContent = score;
  if (score > best) { best = score; bestEl.textContent = best; }
  moving = null;
  speed = baseSpeed + blocks.length * 0.06;
  spawnMoving();
}

function showPerfect() {
  pfEl.classList.remove('show');
  void pfEl.offsetWidth;
  pfEl.classList.add('show');
}

function endGame(reason) {
  state = 'over'; cancelAnimationFrame(raf); moving = null;
  finalEl.textContent = score;
  overMsg.textContent = reason === 'tower' ? 'you reached the top!'
    : score < 5 ? 'keep practicing!' : score < 15 ? 'nice try!' : 'great run!';
  overOverlay.classList.remove('hidden');
  hintEl.style.opacity = '1';
  draw();
}

function loop() {
  if (state !== 'playing') return;
  if (moving) {
    moving.x += speed * dir * -1;
    if (moving.x > W + 10) { moving.x = W; dir = 1; }
    if (moving.x < -moving.w - 10) { moving.x = -moving.w; dir = -1; }
  }
  draw();
  raf = requestAnimationFrame(loop);
}

function roundRect(ctx, x, y, w, h, r) {
  if (w < 2*r) r = w/2; if (h < 2*r) r = h/2;
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r); ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);     ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#13131a'; ctx.fillRect(0, 0, W, H);
  const topBlock = blocks[blocks.length - 1];
  const cameraY = topBlock ? Math.min(0, H - BLOCK_H * 2 - topBlock.y) : 0;
  ctx.save(); ctx.translate(0, cameraY);
  blocks.slice(-18).forEach(b => {
    ctx.fillStyle = b.color; roundRect(ctx, b.x, b.y, b.w, BLOCK_H-2, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; roundRect(ctx, b.x, b.y, b.w, 8, 6); ctx.fill();
  });
  if (moving) {
    ctx.fillStyle = moving.color; roundRect(ctx, moving.x, moving.y, moving.w, BLOCK_H-2, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; roundRect(ctx, moving.x, moving.y, moving.w, 8, 6); ctx.fill();
    if (topBlock) {
      const ol = Math.max(moving.x, topBlock.x), or = Math.min(moving.x+moving.w, topBlock.x+topBlock.w);
      if (or > ol) { ctx.fillStyle='rgba(255,255,255,0.1)'; roundRect(ctx,ol,moving.y,or-ol,BLOCK_H-2,4); ctx.fill(); }
    }
  }
  ctx.restore();
  if (state === 'playing' && blocks.length > 1) {
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(0, 0, W, 44);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '500 13px Space Mono, monospace';
    ctx.textAlign = 'left'; ctx.fillText('level ' + (blocks.length - 1), 16, 28);
    const barW = Math.min((blocks.length-1)/30,1)*(W-32);
    ctx.fillStyle='rgba(124,106,255,0.2)'; ctx.fillRect(16,36,W-32,3);
    ctx.fillStyle='#7c6aff'; ctx.fillRect(16,36,barW,3);
  }
}

canvas.addEventListener('click', () => { if (state==='playing') drop(); });
document.getElementById('start-btn').addEventListener('click', initGame);
document.getElementById('retry-btn').addEventListener('click', initGame);
document.addEventListener('keydown', e => {
  if (e.code==='Space'||e.code==='ArrowDown') {
    e.preventDefault();
    if (state==='playing') drop(); else initGame();
  }
});
document.getElementById('speed-btn').addEventListener('click', function() {
  if (speedMode==='normal') { speedMode='fast'; baseSpeed=3.2; this.textContent='speed: fast'; }
  else if (speedMode==='fast') { speedMode='slow'; baseSpeed=1.0; this.textContent='speed: slow'; }
  else { speedMode='normal'; baseSpeed=1.8; this.textContent='speed: normal'; }
  if (state==='playing') speed = baseSpeed + (blocks.length-1)*0.06;
});
document.getElementById('sound-btn').addEventListener('click', function() {
  this.textContent = this.textContent.includes('off') ? 'sound: on' : 'sound: off';
});

draw();