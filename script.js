var a = function(){
    const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");

let width = 0;
let height = 0;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
window.addEventListener("resize", resize);

const colors = ["#ec17ff", "#2fff4b", "#06c8d6", "#8183ff", "#b388ff", "#ff9f1c"];
const rand = (min, max) => Math.random() * (max - min) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- توپ‌ها ---------------- */
const BALL_COUNT = 40;

function createBall(anywhere) {
  return {
    x: rand(0, width),
    y: anywhere ? rand(0, height) : rand(-100, -20),
    r: rand(8, 26),
    speed: rand(0.6, 2.2),
    sway: rand(0.5, 2),
    phase: rand(0, Math.PI * 2),
    color: pick(colors),
    alpha: rand(0.35, 0.8),
  };
}

const balls = Array.from({ length: BALL_COUNT }, () => createBall(true));

function updateBall(i, time, dt) {
  const b = balls[i];
  b.y += b.speed * dt;
  b.x += Math.sin(time * 0.001 + b.phase) * b.sway * 0.3 * dt;

  // وقتی کامل از پایین صفحه رد شد، یه توپ تازه از بالا بیار
  if (b.y - b.r > height) {
    balls[i] = createBall(false);
  }
}

function drawBall(b) {
  ctx.globalAlpha = b.alpha;
  ctx.fillStyle = b.color;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.fill();

  // نقطه‌ی براق روی توپ
  ctx.globalAlpha = b.alpha * 0.5;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

/* ---------------- خطوط ---------------- */
const lines = [];
let lastSpawn = 0;

function createLine() {
  const dir = Math.random() < 0.5 ? 1 : -1; // چپ‌به‌راست یا راست‌به‌چپ
  const angle = rand(0.4, 1.0);             // شیب به سمت پایین
  return {
    x: dir === 1 ? rand(-200, width * 0.6) : rand(width * 0.4, width + 200),
    y: rand(-150, -20),
    ux: Math.cos(angle) * dir,
    uy: Math.sin(angle),
    speed: rand(6, 12),
    len: rand(120, 260),
    lineWidth: rand(1.5, 3),
    color: pick(colors),
  };
}

function updateLines(time, dt) {
  if (time - lastSpawn > 900 && lines.length < 6) {
    lines.push(createLine());
    lastSpawn = time;
  }

  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i];
    l.x += l.ux * l.speed * dt;
    l.y += l.uy * l.speed * dt;

    const out = l.y - l.len > height || l.x < -400 || l.x > width + 400;
    if (out) lines.splice(i, 1);
  }
}

function drawLine(l) {
  const tailX = l.x - l.ux * l.len;
  const tailY = l.y - l.uy * l.len;

  const grad = ctx.createLinearGradient(tailX, tailY, l.x, l.y);
  grad.addColorStop(0, "rgba(255,255,255,0)");
  grad.addColorStop(1, l.color);

  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = grad;
  ctx.lineWidth = l.lineWidth;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(l.x, l.y);
  ctx.stroke();
}

/* ---------------- ترکیدن حباب‌ها ---------------- */
const particles = [];
const rings = [];

function popBall(i) {
  const b = balls[i];

  // ذرات که به همه‌ی جهت‌ها پخش می‌شن
  const count = 14;
  for (let k = 0; k < count; k++) {
    const angle = (Math.PI * 2 * k) / count + rand(-0.2, 0.2);
    const speed = rand(2, 6);
    particles.push({
      x: b.x,
      y: b.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: rand(2, 4.5),
      life: 1,
      color: b.color,
    });
  }

  // حلقه‌ای که از جای حباب بزرگ می‌شه و محو می‌شه
  rings.push({ x: b.x, y: b.y, r: b.r, life: 1, color: b.color });

  // حباب تازه از بالا میاد، پس تعداد حباب‌ها ثابت می‌مونه
  balls[i] = createBall(false);
}

function updateEffects(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 0.15 * dt; // کشش گرانش
    p.vx *= 0.98;
    p.life -= 0.03 * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }

  for (let i = rings.length - 1; i >= 0; i--) {
    const g = rings[i];
    g.r += 2.2 * dt;
    g.life -= 0.06 * dt;
    if (g.life <= 0) rings.splice(i, 1);
  }
}

function drawEffects() {
  particles.forEach(function (p) {
    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });

  rings.forEach(function (g) {
    ctx.globalAlpha = Math.max(g.life, 0) * 0.8;
    ctx.strokeStyle = g.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
    ctx.stroke();
  });
}

// کلیک (و لمس) روی صفحه
window.addEventListener("pointerdown", function (e) {
  for (let i = balls.length - 1; i >= 0; i--) {
    const b = balls[i];
    const dx = e.clientX - b.x;
    const dy = e.clientY - b.y;
    const hit = b.r + 6; // کمی تلورانس برای لمس با انگشت

    if (dx * dx + dy * dy <= hit * hit) {
      popBall(i);
      break; // فقط یک حباب در هر کلیک
    }
  }
});

/* ---------------- حلقه‌ی اصلی ---------------- */
let last = 0;

function animate(time) {
  // dt یعنی «چند برابر یه فریم ۶۰ تایی گذشته»، تا سرعت روی هر مانیتوری یکی باشه
  const dt = Math.min((time - last) / 16.67 || 1, 3);
  last = time;

  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i < balls.length; i++) {
    updateBall(i, time, dt);
    drawBall(balls[i]);
  }

  updateLines(time, dt);
  lines.forEach(drawLine);

  updateEffects(dt);
  drawEffects();

  ctx.globalAlpha = 1;

  // اگه کاربر انیمیشن رو خاموش کرده، فقط یه فریم ثابت می‌کشیم
  if (!reduceMotion) requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
}
a()

var currentPage = -1;
const start = document.getElementById("startBtn");
start.addEventListener("click",function(){
    const main = document.querySelector(".main");
    main.classList.add("flipp");
    currentPage++;
    update()    
    pages[currentPage].style.display="flex";
})



let pages = document.querySelectorAll(".back-page")
function hide(){
  pages.forEach(function(item){
    item.style.display = "none";
  })
}
hide()



let next = document.querySelectorAll(".nextBtn");
let pre = document.querySelectorAll(".preBtn");
next.forEach(function(item){
  item.addEventListener("click", ()=>{
    if(currentPage < pages.length-1){
      currentPage++
      update()
      hide();
      pages[currentPage].style.display = "flex"
    }
  })
})



pre.forEach(function(item){
  item.addEventListener("click", ()=>{
    if(currentPage > -2){
      currentPage--;
      update()

      if(currentPage === -1){
        const main = document.querySelector(".main");
        main.classList.remove("flipp");
      }
      hide();

      if(currentPage>-1){
        pages[currentPage].style.display= "flex";
      }
       
    }
  })
})

let again = document.getElementById("finishBtn");
again.addEventListener("click", function(){
    const main = document.querySelector(".main");
        main.classList.remove("flipp");
        currentPage = -1
        hide()

})

let pointer = document.querySelector(".pointer");
for(var i =0; i<pages.length; i++){
  var el = document.createElement("span");
  el.setAttribute("class", "dot");
  pointer.appendChild(el);
}


function update(){
  let dots = document.querySelectorAll(".dot");
  dots.forEach(function(item,index){
    item.style.backgroundColor = "purple"
    if(index === currentPage){
      item.style.backgroundColor = "gold"
      item.classList.add("active")
    }
    else{
      item.style.backgroundColor = "purple"
      item.classList.remove("active")
    }
  })
}
update()

// --------------------------------------------------------------------

