"use strict";

const AppState = {
  currentSection: 'hero',
  theme: localStorage.getItem('ecoswap-theme') || 'dark',
  ecoScore: parseInt(localStorage.getItem('ecoswap-score') || '0', 10),
  myItems: JSON.parse(localStorage.getItem('ecoswap-items') || '[]'),
  data: {
    users: [],
    recyclers: [],
    wasteItems: [],
    impact: null,
  },
  lastUploadedItem: null,
  demoRunning: false,
  demoTimeouts: [],
  chartsDrawn: false,
  countersAnimated: false,
};

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const sleep = ms => new Promise(r => setTimeout(r, ms));

function toastShow(msg, type = 'success', duration = 3000) {
  const container = $('#toast-container');
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <span>${msg}</span>
    <div class="toast-bar"></div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastSlideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function animateCounter(el, target, duration = 1800, decimals = 0) {
  const start = performance.now();
  const from = 0;
  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = from + (target - from) * eased;
    el.textContent = decimals > 0
      ? value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      : Math.round(value).toLocaleString();
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function getCategoryIcon(cat) {
  const map = {
    plastic: '🍾', 'e-waste': '📱', electronics: '💻',
    cardboard: '📦', paper: '📄', metal: '🔩',
    aluminium: '🥫', glass: '🫙', organic: '🌿',
    textile: '👗', furniture: '🪑', other: '🗂️', mixed: '🗃️',
  };
  return map[cat?.toLowerCase()] || '♻️';
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatNum(n, decimals = 0) {
  return decimals > 0 ? n.toFixed(decimals) : Math.round(n).toLocaleString();
}

const INLINE_DATA = {
  users: [
    { id:1, name:"Priya Sharma",   avatar:"PS", avatarColor:"#22c55e", ecoScore:2840, level:"Planet Saver 🚀",  itemsRecycled:47, co2Saved:134.2, wasteKg:89.5, badge:"🥇", joinDate:"2025-01-15", city:"Mumbai"    },
    { id:2, name:"Arjun Mehta",    avatar:"AM", avatarColor:"#3b82f6", ecoScore:2310, level:"Planet Saver 🚀",  itemsRecycled:39, co2Saved:112.7, wasteKg:74.2, badge:"🥈", joinDate:"2025-02-03", city:"Delhi"     },
    { id:3, name:"Sneha Patel",    avatar:"SP", avatarColor:"#a855f7", ecoScore:1975, level:"Eco Warrior 🌍",   itemsRecycled:31, co2Saved:93.4,  wasteKg:61.8, badge:"🥉", joinDate:"2025-02-18", city:"Bangalore" },
    { id:4, name:"Rahul Verma",    avatar:"RV", avatarColor:"#f59e0b", ecoScore:1640, level:"Eco Warrior 🌍",   itemsRecycled:26, co2Saved:78.1,  wasteKg:52.3, badge:"4️⃣", joinDate:"2025-03-05", city:"Pune"      },
    { id:5, name:"Ananya Krishnan",avatar:"AK", avatarColor:"#ef4444", ecoScore:1280, level:"Eco Warrior 🌍",   itemsRecycled:21, co2Saved:61.5,  wasteKg:40.7, badge:"5️⃣", joinDate:"2025-03-22", city:"Chennai"   },
    { id:6, name:"Dev Kapoor",     avatar:"DK", avatarColor:"#06b6d4", ecoScore:890,  level:"Beginner 🌱",      itemsRecycled:14, co2Saved:42.3,  wasteKg:28.1, badge:"6️⃣", joinDate:"2025-04-10", city:"Hyderabad" },
    { id:7, name:"Meera Nair",     avatar:"MN", avatarColor:"#ec4899", ecoScore:620,  level:"Beginner 🌱",      itemsRecycled:10, co2Saved:29.8,  wasteKg:19.4, badge:"7️⃣", joinDate:"2025-04-28", city:"Kochi"     }
  ],
  recyclers: [
    { id:1, name:"GreenCycle Solutions", logo:"GC", logoColor:"#22c55e", categories:["plastic","cardboard","paper"], distance:1.2, rating:4.9, reviews:234, availability:"Mon–Sat, 9AM–6PM", address:"Plot 14, Green Industrial Zone, Andheri East", city:"Mumbai",    phone:"+91 98200 12345", pickup:true,  certified:true,  description:"Mumbai's leading plastic and cardboard recycler. ISO 14001 certified with 10+ years experience.", acceptedItems:["PET Bottles","HDPE Containers","Cardboard","Paper"], pricePerKg:8  },
    { id:2, name:"TechReclaim India",    logo:"TR", logoColor:"#3b82f6", categories:["e-waste","electronics","batteries"],       distance:2.7, rating:4.8, reviews:189, availability:"Tue–Sun, 10AM–7PM",  address:"Tower B, Cyber Hub, Whitefield",             city:"Bangalore",phone:"+91 80 4567 8901",  pickup:true,  certified:true,  description:"Authorized e-waste recycler. Safely dismantles phones, laptops, and electronics. Data destruction guaranteed.", acceptedItems:["Smartphones","Laptops","Batteries","PCBs","Cables"], pricePerKg:45 },
    { id:3, name:"EcoRevive Hub",        logo:"ER", logoColor:"#a855f7", categories:["furniture","household","textile","glass"],  distance:3.5, rating:4.7, reviews:156, availability:"Mon–Fri, 8AM–5PM",   address:"Sector 18, Noida Industrial Area",           city:"Delhi NCR",phone:"+91 11 2345 6789",  pickup:false, certified:true,  description:"Specializes in furniture refurbishment and household item donation to NGOs and underprivileged communities.", acceptedItems:["Furniture","Clothes","Glass","Utensils","Books"], pricePerKg:0  },
    { id:4, name:"MetalMend Recyclers",  logo:"MM", logoColor:"#f59e0b", categories:["metal","aluminium","steel","copper"],      distance:4.1, rating:4.6, reviews:98,  availability:"Mon–Sat, 7AM–4PM",   address:"MIDC Industrial Estate, Bhosari",            city:"Pune",     phone:"+91 20 7890 1234",  pickup:true,  certified:false, description:"High-value metal recycling with instant price quotes. Best rates for scrap aluminium and copper.", acceptedItems:["Aluminium Cans","Copper Wire","Steel Scrap","Iron"], pricePerKg:62 },
    { id:5, name:"BioNxt Composters",    logo:"BN", logoColor:"#10b981", categories:["organic","food-waste","garden"],           distance:0.8, rating:4.5, reviews:74,  availability:"Daily, 6AM–8PM",      address:"Green Belt Zone, Koramangala",               city:"Bangalore",phone:"+91 80 9876 5432",  pickup:true,  certified:true,  description:"Community composting facility converting organic waste into rich compost. Free pickup for 5kg+ collections.", acceptedItems:["Food Waste","Garden Clippings","Fruit Peels","Compostables"], pricePerKg:0  },
    { id:6, name:"Parivesh Waste Mgmt",  logo:"PW", logoColor:"#06b6d4", categories:["mixed","industrial","plastic","paper","metal"], distance:5.3, rating:4.4, reviews:211, availability:"Mon–Sat, 8AM–6PM", address:"Phase 2, Industrial Area, Guindy",          city:"Chennai",  phone:"+91 44 3456 7890",  pickup:true,  certified:true,  description:"Full-spectrum waste management. Handles bulk collections for housing societies and offices.", acceptedItems:["All Categories","Bulk Collections","Industrial Waste"], pricePerKg:5  }
  ],
  wasteItems: [
    { id:1, name:"Plastic Bottle",   category:"plastic",   weight:0.05, co2Saved:0.12, ecoPoints:30,  suggestion:"recycle",  confidence:94, description:"PET plastic bottle",          tips:["Rinse before recycling","Remove the cap separately","Crush to save space"],                                 timestamp:"2025-06-01T09:15:00Z", status:"recycled" },
    { id:2, name:"Old Smartphone",   category:"e-waste",   weight:0.18, co2Saved:45.0, ecoPoints:150, suggestion:"donate",   confidence:88, description:"Electronic device",           tips:["Wipe personal data first","Check for authorized e-waste centers","Battery must be removed"],              timestamp:"2025-06-03T14:30:00Z", status:"matched"  },
    { id:3, name:"Cardboard Box",    category:"cardboard", weight:0.35, co2Saved:0.85, ecoPoints:45,  suggestion:"recycle",  confidence:97, description:"Corrugated cardboard",        tips:["Flatten before recycling","Remove any tape or staples","Keep dry"],                                        timestamp:"2025-06-05T11:00:00Z", status:"recycled" },
    { id:4, name:"Glass Jar",        category:"glass",     weight:0.40, co2Saved:0.32, ecoPoints:35,  suggestion:"reuse",    confidence:91, description:"Glass container",             tips:["Clean and reuse for storage","Separate from other glass types","Don't mix with ceramics"],                 timestamp:"2025-06-07T16:45:00Z", status:"uploaded" },
    { id:5, name:"Aluminium Can",    category:"metal",     weight:0.015,co2Saved:0.19, ecoPoints:25,  suggestion:"recycle",  confidence:99, description:"Aluminium – endlessly recyclable", tips:["Rinse thoroughly","Crush to save space","High resale value"],                                   timestamp:"2025-06-10T08:20:00Z", status:"recycled" }
  ],
  impact: {
    totals: { wasteKgSaved:1284.7, co2Reduced:3847.2, itemsRecycled:8432, treesEquivalent:512, usersActive:2847, recyclersConnected:6 },
    monthlyTrend: [
      { month:"Nov", waste:48,  co2:142, items:310 },
      { month:"Dec", waste:62,  co2:188, items:401 },
      { month:"Jan", waste:79,  co2:234, items:512 },
      { month:"Feb", waste:95,  co2:281, items:618 },
      { month:"Mar", waste:118, co2:347, items:784 },
      { month:"Apr", waste:143, co2:421, items:943 }
    ],
    categoryBreakdown: [
      { category:"Plastic",   percentage:34, color:"#22c55e", kg:436.8 },
      { category:"E-Waste",   percentage:22, color:"#3b82f6", kg:282.6 },
      { category:"Cardboard", percentage:18, color:"#f59e0b", kg:231.2 },
      { category:"Metal",     percentage:14, color:"#a855f7", kg:179.9 },
      { category:"Glass",     percentage:8,  color:"#06b6d4", kg:102.7 },
      { category:"Other",     percentage:4,  color:"#94a3b8", kg:51.5  }
    ],
    impactEquivalents: { treesPlanted:512, carKmAvoided:19236, waterLitersSaved:45820, energyKwhSaved:3240 }
  }
};

async function loadData() {

  AppState.data.users      = INLINE_DATA.users;
  AppState.data.recyclers  = INLINE_DATA.recyclers;
  AppState.data.wasteItems = INLINE_DATA.wasteItems;
  AppState.data.impact     = INLINE_DATA.impact;

  if (location.protocol === 'file:') return;

  const files = [
    { key: 'users',      path: 'data/users.json' },
    { key: 'recyclers',  path: 'data/recyclers.json' },
    { key: 'wasteItems', path: 'data/waste_items.json' },
    { key: 'impact',     path: 'data/impact_data.json' },
  ];
  await Promise.allSettled(files.map(async ({ key, path }) => {
    try {
      const res = await fetch(path);
      if (res.ok) AppState.data[key] = await res.json();
    } catch (e) {  }
  }));
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  AppState.theme = theme;
  localStorage.setItem('ecoswap-theme', theme);
  $('#theme-icon').textContent = theme === 'dark' ? '🌙' : '☀️';
}

function toggleTheme() {
  applyTheme(AppState.theme === 'dark' ? 'light' : 'dark');
}

function navigateTo(sectionId, updateLinks) { void(sectionId, updateLinks); } 

function openMobileMenu() {
  $('#nav-links').classList.add('open');
  $('#hamburger').classList.add('open');
  $('#mobile-menu-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeMobileMenu() {
  $('#nav-links').classList.remove('open');
  $('#hamburger').classList.remove('open');
  $('#mobile-menu-overlay').classList.remove('active');
  document.body.style.overflow = '';
}

function handleNavbarScroll() {
  const nav = $('#navbar');
  nav.classList.toggle('scrolled', window.scrollY > 20);
}

function initHeroStatCounters() {
  $$('.hero-stat-num[data-target]').forEach(el => {
    animateCounter(el, parseFloat(el.dataset.target), 2000, 0);
  });
}

const SAMPLE_ITEMS = {
  plastic: {
    name: 'Plastic Bottle (500ml)',
    category: 'plastic',
    weight: '0.05',
    notes: 'PET plastic, lightly used, ready for recycling.',
  },
  phone: {
    name: 'Old Smartphone (3 years)',
    category: 'e-waste',
    weight: '0.18',
    notes: 'Android phone, data wiped. Fair condition.',
  },
  cardboard: {
    name: 'Cardboard Delivery Box',
    category: 'cardboard',
    weight: '0.35',
    notes: 'Large corrugated cardboard, slightly damp.',
  },
};

function fillSampleItem(type) {
  const s = SAMPLE_ITEMS[type];
  if (!s) return;
  $('#item-name').value     = s.name;
  $('#item-category').value = s.category;
  $('#item-weight').value   = s.weight;
  $('#item-notes').value    = s.notes;

  $$('.btn-sample').forEach(b => b.classList.remove('active'));
  $(`#sample-${type}`).classList.add('active');
  toastShow(`Sample item "${s.name}" loaded! Click Analyze to proceed.`, 'info');
}

function setupImageUpload() {
  const zone     = $('#image-upload-zone');
  const input    = $('#item-image');
  const preview  = $('#image-preview');
  const previewWrap = $('#image-preview-wrap');
  const removeBtn = $('#remove-image');

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      toastShow('Please select a valid image file.', 'error'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toastShow('Image must be under 5MB.', 'error'); return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;
      zone.style.display = 'none';
      previewWrap.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  input.addEventListener('change', () => handleFile(input.files[0]));
  removeBtn.addEventListener('click', () => {
    preview.src = '';
    input.value = '';
    zone.style.display = 'block';
    previewWrap.style.display = 'none';
  });
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag-over');
    handleFile(e.dataTransfer.files[0]);
  });
}

const AI_RULES = {
  plastic: {
    action: 'recycle', icon: '♻️', confidence: 94,
    reasoning: 'Most plastic types (PET/HDPE) are highly recyclable and accepted by certified recyclers. Recycling plastic saves ~2.4 kg CO₂ per kg.',
    tips: ['Rinse thoroughly before recycling', 'Remove caps and labels if possible', 'Crush bottles to save space'],
    co2Factor: 2.4, pointsFactor: 30,
  },
  'e-waste': {
    action: 'donate',  icon: '📱', confidence: 88,
    reasoning: 'Electronics contain valuable rare-earth metals and toxic materials. Certified e-waste recyclers ensure safe extraction and data destruction.',
    tips: ['Wipe all personal data first', 'Check if device can be refurbished', 'Only use certified e-waste handlers'],
    co2Factor: 250.0, pointsFactor: 150,
  },
  cardboard: {
    action: 'recycle', icon: '📦', confidence: 97,
    reasoning: 'Cardboard is one of the most efficiently recycled materials with near-100% uptake. Saves trees and water.',
    tips: ['Flatten boxes before recycling', 'Remove tape, labels and staples', 'Keep dry — wet cardboard is not recyclable'],
    co2Factor: 2.4, pointsFactor: 45,
  },
  metal: {
    action: 'recycle', icon: '🔩', confidence: 99,
    reasoning: 'Metal recycling is highly profitable and infinitely recyclable. Aluminium recycling uses 95% less energy than virgin production.',
    tips: ['Clean off food residue', 'Separate different metals if possible', 'High scrap value — check local rates'],
    co2Factor: 4.1, pointsFactor: 55,
  },
  glass: {
    action: 'reuse',   icon: '🫙', confidence: 91,
    reasoning: 'Glass jars and bottles are ideal for home reuse. Clean glass is also 100% recyclable without quality loss.',
    tips: ['Reuse as storage containers', 'Remove lids and any food residue', 'Don\'t mix with ceramics or pyrex'],
    co2Factor: 0.8, pointsFactor: 35,
  },
  organic: {
    action: 'compost', icon: '🌿', confidence: 96,
    reasoning: 'Organic waste creates rich compost that improves soil health. Composting diverts waste from landfill and reduces methane emissions.',
    tips: ['Mix with dry material for balance', 'Avoid meat and dairy', 'Ideal temperatures: 55–65°C for fast composting'],
    co2Factor: 0.5, pointsFactor: 25,
  },
  textile: {
    action: 'donate',  icon: '👗', confidence: 85,
    reasoning: 'Textiles in usable condition should be donated. Fast fashion has a huge carbon footprint — extending garment life is very impactful.',
    tips: ['Wash before donating', 'NGOs like Goonj accept all conditions', 'Non-donatable textiles can be recycled for rags'],
    co2Factor: 7.0, pointsFactor: 60,
  },
  furniture: {
    action: 'donate',  icon: '🪑', confidence: 82,
    reasoning: 'Furniture can have multiple second lives. Donate to NGOs, refurbish, or upcycle before considering disposal.',
    tips: ['Check for NGO pickup services', 'Post on community groups first', 'Small repairs significantly extend life'],
    co2Factor: 5.0, pointsFactor: 80,
  },
  other: {
    action: 'reuse',   icon: '🗂️', confidence: 75,
    reasoning: 'For unlisted categories, repair and reuse is the best first step. Check community marketplaces before discarding.',
    tips: ['Try community swap groups', 'Upcycle if possible', 'Check local municipality for special collection days'],
    co2Factor: 1.0, pointsFactor: 20,
  },
};

function getAISuggestion(category, weight) {
  const rule = AI_RULES[category] || AI_RULES.other;
  const w    = parseFloat(weight) || 0.3;
  const co2  = +(w * rule.co2Factor).toFixed(2);
  const pts  = rule.pointsFactor + Math.round(w * 10);
  return { ...rule, weight: w, co2Saved: co2, ecoPoints: pts };
}

function showAISuggestion(item) {
  const suggestion = getAISuggestion(item.category, item.weight);
  AppState.lastUploadedItem = { ...item, suggestion };

  const card = $('#ai-card');
  card.style.display = 'block';
  card.classList.add('fade-enter');
  setTimeout(() => card.classList.remove('fade-enter'), 400);

  $('#confidence-num').textContent   = suggestion.confidence;
  $('#ai-action-icon').textContent   = suggestion.icon;
  $('#ai-action-text').textContent   = `${suggestion.action.charAt(0).toUpperCase() + suggestion.action.slice(1)}`;
  $('#ai-reasoning').textContent     = suggestion.reasoning;
  $('#ai-weight').textContent        = suggestion.weight.toFixed(2);
  $('#ai-co2').textContent           = suggestion.co2Saved;
  $('#ai-points').textContent        = suggestion.ecoPoints;

  const badge = $('#ai-action-badge');
  const colors = { recycle: '#22c55e', donate: '#3b82f6', reuse: '#f59e0b', compost: '#10b981' };
  badge.style.borderColor = colors[suggestion.action] + '55';
  badge.style.color = colors[suggestion.action];
  badge.style.background = colors[suggestion.action] + '15';

  const tipsEl = $('#ai-tips');
  tipsEl.innerHTML = `<ul>${suggestion.tips.map(t => `<li>💡 ${t}</li>`).join('')}</ul>`;

  setTimeout(() => {
    $('#confidence-bar').style.width = suggestion.confidence + '%';
  }, 100);

  activateJourneyStep(1);

  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function activateJourneyStep(upToStep) {
  const journeyCard = $('#journey-card');
  journeyCard.style.display = 'block';
  journeyCard.classList.add('fade-enter');
  setTimeout(() => journeyCard.classList.remove('fade-enter'), 400);

  $$('.journey-dot').forEach((dot, i) => {
    dot.classList.remove('active', 'completed');
    if (i < upToStep) dot.classList.add('completed');
    if (i === upToStep) dot.classList.add('active');
  });
}

function drawConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const particles = [];
  const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#fbbf24'];
  for (let i = 0; i < 80; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() * 200 - 100),
      y: canvas.height / 2 + 150,
      r: Math.random() * 5 + 3,
      dx: Math.random() * 12 - 6,
      dy: Math.random() * -12 - 6,
      c: colors[Math.floor(Math.random() * colors.length)],
      life: 1.0,
      rot: Math.random() * 360,
      rs: Math.random() * 10 - 5
    });
  }
  
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      p.dy += 0.35; // gravity
      p.rot += p.rs;
      p.life -= Math.random() * 0.015 + 0.005;
      if (p.life > 0) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
        ctx.restore();
      }
    });
    if (alive) {
      requestAnimationFrame(render);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(render);
}

function updateEcoScore(pts) {
  AppState.ecoScore += pts;
  localStorage.setItem('ecoswap-score', AppState.ecoScore);
  renderEcoScore();
  if (pts > 0) drawConfetti();
}

function renderEcoScore() {
  const score = AppState.ecoScore;
  const scoreEl  = $('#score-pts');
  const levelEl  = $('#score-level');
  const barEl    = $('#score-bar-fill');
  const nextEl   = $('#score-next');

  scoreEl.textContent = `${score.toLocaleString()} pts`;

  let level, pct, next;
  if (score < 500)         { level = 'Beginner 🌱'; pct = (score / 500) * 33; next = `${500 - score} pts to Eco Warrior 🌍`; }
  else if (score < 2000)   { level = 'Eco Warrior 🌍'; pct = 33 + ((score - 500) / 1500) * 34; next = `${2000 - score} pts to Planet Saver 🚀`; }
  else                     { level = 'Planet Saver 🚀'; pct = 67 + Math.min(((score - 2000) / 1000) * 33, 33); next = '🚀 Maximum level reached! You are a Planet Saver!'; }

  levelEl.textContent = level;
  barEl.style.width   = Math.min(pct, 100) + '%';
  nextEl.textContent  = next;
}

function setupWasteForm() {
  const form     = $('#waste-form');
  const submitBtn = $('#submit-btn');
  const spinner  = $('#btn-spinner');
  const btnText  = $('#btn-text');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (AppState.demoRunning) return;

    $('#ai-card').style.display = 'none';
    $('#journey-card').style.display = 'none';

    const name     = $('#item-name').value.trim();
    const category = $('#item-category').value;
    const weight   = $('#item-weight').value || '0.30';

    let valid = true;
    if (!name) { $('#name-error').textContent = 'Please enter an item name.'; valid = false; }
    else         $('#name-error').textContent = '';
    if (!category) { $('#cat-error').textContent = 'Please select a category.'; valid = false; }
    else             $('#cat-error').textContent = '';
    
    if (!valid) {
      toastShow('Please fill all required fields ⚠️', 'error');
      return;
    }

    submitBtn.disabled = true;
    spinner.style.display = 'block';
    btnText.textContent = 'Analyzing…';

    const loader = $('#ai-loader');
    const loaderText = $('#ai-loader-text');
    if (loader) {
      loader.style.display = 'block';
      loaderText.textContent = 'Analyzing waste...';
      await sleep(700);
      loaderText.textContent = 'Optimizing recycling method...';
      await sleep(700);
      loaderText.textContent = 'Calculating environmental impact...';
      await sleep(500);
      loader.style.display = 'none';
    } else {
      await sleep(1200);
    }

    const item = {
      id: Date.now(),
      name,
      category,
      weight: parseFloat(weight) || 0.3,
      notes: $('#item-notes').value.trim(),
      timestamp: new Date().toISOString(),
      status: 'uploaded',
    };

    AppState.myItems.unshift(item);
    if (AppState.myItems.length > 20) AppState.myItems.pop();
    localStorage.setItem('ecoswap-items', JSON.stringify(AppState.myItems));

    $('#journey-uploaded-desc').textContent = `"${name}" submitted`;

    showAISuggestion(item);

    const suggestion = getAISuggestion(category, item.weight);
    updateEcoScore(suggestion.ecoPoints);

    submitBtn.disabled = false;
    spinner.style.display = 'none';
    btnText.innerHTML = '<span class="emoji">🤖</span> Analyze & Upload';

    renderMyItems();
    showMyItemsSection();

    form.reset();
    $$('.btn-sample').forEach(b => b.classList.remove('active'));
    
    const preview = $('#image-preview');
    const input = $('#item-image');
    const zone = $('#image-upload-zone');
    const previewWrap = $('#image-preview-wrap');
    if (preview) preview.src = '';
    if (input) input.value = '';
    if (zone) zone.style.display = 'block';
    if (previewWrap) previewWrap.style.display = 'none';

    toastShow('Item uploaded successfully ✅', 'success');
  });
}

function showMyItemsSection() {
  const sec = $('#my-items-section');
  sec.style.display = 'block';
}

function renderMyItems() {
  const grid = $('#my-items-grid');
  if (!AppState.myItems.length) { grid.innerHTML = ''; return; }
  grid.innerHTML = AppState.myItems.slice(0, 8).map(item => {
    const sug = getAISuggestion(item.category, item.weight);
    return `
      <div class="item-card fade-enter">
        <div class="item-card-header">
          <span class="item-cat-icon">${getCategoryIcon(item.category)}</span>
          <div>
            <div class="item-card-name">${item.name}</div>
            <div class="item-card-cat">${item.category}</div>
          </div>
        </div>
        <div class="item-card-meta">
          <span class="item-meta-tag">⚖️ ${item.weight} kg</span>
          <span class="item-meta-tag">🌿 ${sug.co2Saved} kg CO₂</span>
          <span class="item-meta-tag">⭐ +${sug.ecoPoints} pts</span>
        </div>
        <span class="item-card-action">${sug.icon} ${sug.action}</span>
      </div>
    `;
  }).join('');
}

function renderImpactCounters() {
  const data = AppState.data.impact;
  if (!data) return;
  $$('.counter-num[data-target]').forEach(el => {
    const decimals = parseInt(el.dataset.decimal || '0', 10);
    animateCounter(el, parseFloat(el.dataset.target), 2000, decimals);
  });
}

function renderBarChart() {
  const data = AppState.data.impact;
  if (!data) return;
  const chart  = $('#bar-chart');
  const months = data.monthlyTrend || [];
  const maxWaste = Math.max(...months.map(m => m.waste));
  const maxCO2   = Math.max(...months.map(m => m.co2));

  chart.innerHTML = months.map(m => `
    <div class="bar-group">
      <div class="bar-wrap">
        <div class="bar bar-green" style="height:0%" data-val="${m.waste}kg"
             data-target="${Math.round((m.waste / maxWaste) * 130)}"></div>
        <div class="bar bar-blue"  style="height:0%" data-val="${m.co2}kg CO₂"
             data-target="${Math.round((m.co2  / maxCO2)  * 130)}"></div>
      </div>
      <div class="bar-label">${m.month}</div>
    </div>
  `).join('');

  setTimeout(() => {
    $$('.bar[data-target]').forEach(bar => {
      bar.style.transition = 'height 1.2s cubic-bezier(0.2,0,0,1)';
      bar.style.height = bar.dataset.target + 'px';

      bar.addEventListener('mouseenter', e => {
        let tooltip = document.querySelector('.chart-tooltip');
        if (!tooltip) {
          tooltip = document.createElement('div');
          tooltip.className = 'chart-tooltip';
          document.body.appendChild(tooltip);
        }
        tooltip.textContent = bar.dataset.val;
        tooltip.style.left = e.pageX + 'px';
        tooltip.style.top = (e.pageY - 40) + 'px';
        tooltip.classList.add('visible');
      });
      bar.addEventListener('mousemove', e => {
        const tooltip = document.querySelector('.chart-tooltip');
        if (tooltip) {
          tooltip.style.left = e.pageX + 'px';
          tooltip.style.top = (e.pageY - 40) + 'px';
        }
      });
      bar.addEventListener('mouseleave', () => {
        const tooltip = document.querySelector('.chart-tooltip');
        if (tooltip) tooltip.classList.remove('visible');
      });
    });
  }, 100);
}

function renderPieChart() {
  const data  = AppState.data.impact;
  if (!data) return;
  const canvas = $('#pie-chart');
  if (!canvas) return;

  if (canvas._animId) cancelAnimationFrame(canvas._animId);

  const ctx  = canvas.getContext('2d');
  const cats = data.categoryBreakdown || [];
  const total = cats.reduce((s, c) => s + c.percentage, 0);
  if (!total) return;

  const cx = canvas.width / 2, cy = canvas.height / 2;
  const r = 80, inner = 46;

  let progress = 0;
  const totalAngle = Math.PI * 2;

  function drawPie(prog) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let angle = -Math.PI / 2;
    const drawn = totalAngle * prog;
    let covered = 0;

    cats.forEach(cat => {
      const slice = (cat.percentage / total) * totalAngle;
      const draw  = Math.min(slice, Math.max(0, drawn - covered));
      if (draw <= 0) { covered += slice; return; }

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle, angle + draw);
      ctx.closePath();
      ctx.fillStyle = cat.color;
      ctx.fill();

      angle += slice;
      covered += slice;
    });

    angle = -Math.PI / 2;
    covered = 0;
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1.5;
    cats.forEach(cat => {
      const slice = (cat.percentage / total) * totalAngle;
      const draw  = Math.min(slice, Math.max(0, drawn - covered));
      if (draw > 0) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
        ctx.stroke();
      }
      angle += slice;
      covered += slice;
    });

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fill();
    ctx.restore();
  }

  function animate() {
    progress = Math.min(progress + 0.035, 1);
    drawPie(progress);
    if (progress < 1) {
      canvas._animId = requestAnimationFrame(animate);
    } else {
      canvas._animId = null;
    }
  }
  animate();

  const legend = $('#pie-legend');
  if (legend) {
    legend.innerHTML = cats.map(c => `
      <div class="pie-legend-item">
        <span class="pie-dot" style="background:${c.color}"></span>
        <span>${c.category} (${c.percentage}%)</span>
      </div>
    `).join('');
  }
}

function renderTimeline() {
  const container = $('#impact-timeline');
  const items = AppState.data.wasteItems || [];

  const timelineEvents = [
    ...items.map(it => ({
      type: it.status === 'recycled' ? 'recycle' : it.status === 'matched' ? 'match' : 'upload',
      icon: it.status === 'recycled' ? '♻️' : it.status === 'matched' ? '🤝' : '📤',
      title: it.name,
      action: it.status === 'recycled' ? 'Recycled' : it.status === 'matched' ? 'Matched with recycler' : 'Uploaded',
      desc: `${it.category} · ${it.weight} kg · CO₂ saved: ${(it.weight * (AI_RULES[it.category]?.co2Factor || 1)).toFixed(2)} kg`,
      time: it.timestamp,
      badge: it.status === 'recycled' ? `+${it.ecoPoints || 30} pts` : null,
    })),
    ...AppState.myItems.slice(0, 3).map(it => ({
      type: 'upload',
      icon: '📤',
      title: it.name,
      action: 'You uploaded',
      desc: `${it.category} · ${it.weight} kg`,
      time: it.timestamp,
      badge: `+${getAISuggestion(it.category, it.weight).ecoPoints} pts`,
    })),
  ].slice(0, 8);

  if (!timelineEvents.length) {
    container.innerHTML = `<div style="color:var(--text-muted);font-size:0.9rem;padding:1rem 0;">No activity yet. Upload your first waste item!</div>`;
    return;
  }

  container.innerHTML = timelineEvents.map((ev, i) => `
    <div class="tl-item" style="transition-delay:${i * 80}ms">
      <div class="tl-dot ${ev.type}">${ev.icon}</div>
      <div class="tl-content">
        <div class="tl-title-row">
          <span class="tl-action">${ev.action}: <strong>${ev.title}</strong></span>
          <span class="tl-time">⏱ ${timeAgo(ev.time)}</span>
          ${ev.badge ? `<span class="tl-badge">${ev.badge}</span>` : ''}
        </div>
        <div class="tl-desc">${ev.desc}</div>
      </div>
    </div>
  `).join('');

  setTimeout(() => {
    $$('.tl-item').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 80);
    });
  }, 100);
}

function renderRecyclers(filter = 'all') {
  const grid = $('#recyclers-grid');
  const recyclers = AppState.data.recyclers || [];

  const filtered = filter === 'all'
    ? recyclers
    : recyclers.filter(r => r.categories?.some(c => c.includes(filter)));

  if (!filtered.length) {
    grid.innerHTML = `<div style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:3rem;">No recyclers found for this category.</div>`;
    return;
  }

  grid.innerHTML = filtered.map((r, i) => `
    <div class="recycler-card fade-enter" style="animation-delay:${i * 60}ms">
      <div class="recycler-header">
        <div class="recycler-logo" style="background:${r.logoColor || '#22c55e'}">${r.logo}</div>
        <div>
          <div class="recycler-name">${r.name}</div>
          <div class="recycler-city">📍 ${r.city}</div>
        </div>
        ${r.certified ? `<span class="recycler-badge">✅ Certified</span>` : ''}
      </div>
      <div class="rating-row">
        <span class="stars">${'★'.repeat(Math.round(r.rating))}${'☆'.repeat(5 - Math.round(r.rating))}</span>
        <span class="rating-num">${r.rating}</span>
        <span class="rating-count">(${r.reviews} reviews)</span>
        ${r.pickup ? '<span class="pickup-chip">🚚 Pickup</span>' : ''}
      </div>
      <div class="recycler-desc">${r.description}</div>
      <div class="recycler-meta">
        <div class="recycler-meta-item">📏 <strong>${r.distance} km</strong> away</div>
        <div class="recycler-meta-item">🕒 ${r.availability}</div>
        <div class="recycler-meta-item">📞 ${r.phone}</div>
        <div class="recycler-meta-item">💰 ₹${r.pricePerKg}/kg ${r.pricePerKg === 0 ? '(Free)' : ''}</div>
      </div>
      <div class="recycler-tags">
        ${(r.acceptedItems || []).slice(0, 4).map(t => `<span class="recycler-tag">${t}</span>`).join('')}
      </div>
      <div class="recycler-actions">
        <button class="btn-contact" onclick="contactRecycler(${r.id})">📞 Contact</button>
        <button class="btn-directions" onclick="toastShow('Opening directions for ${r.name}…', 'info')">🗺️ Directions</button>
      </div>
    </div>
  `).join('');
}

function contactRecycler(id) {
  const r = (AppState.data.recyclers || []).find(x => x.id === id);
  if (!r) return;
  activateJourneyStep(2);
  toastShow(`🤝 Connecting you with ${r.name}… Call: ${r.phone}`, 'success', 4000);
  updateEcoScore(20);
}
window.contactRecycler = contactRecycler;

function renderLeaderboard() {
  const users = AppState.data.users || [];
  if (!users.length) return;

  const podium = $('#podium');
  const top3 = users.slice(0, 3);
  const order = [top3[1], top3[0], top3[2]]; 
  const rankClasses = ['rank-2', 'rank-1', 'rank-3'];
  const heights = ['60px', '80px', '44px'];

  podium.innerHTML = order.map((u, i) => u ? `
    <div class="podium-item ${rankClasses[i]}">
      <div class="podium-badge">${u.badge}</div>
      <div class="podium-avatar" style="background:${u.avatarColor}">${u.avatar}</div>
      <div class="podium-name">${u.name.split(' ')[0]}</div>
      <div class="podium-score">${u.ecoScore.toLocaleString()} pts</div>
      <div class="podium-platform" style="height:${heights[i]}">${['2nd','1st','3rd'][i]}</div>
    </div>
  ` : '').join('');

  const tbody = $('#leaderboard-body');
  tbody.innerHTML = users.map((u, i) => `
    <tr>
      <td class="lb-rank">${u.badge}</td>
      <td>
        <span class="lb-avatar" style="background:${u.avatarColor}">${u.avatar}</span>
        <span class="lb-name">${u.name}</span>
      </td>
      <td>${u.city}</td>
      <td><span class="lb-level">${u.level}</span></td>
      <td>${u.itemsRecycled}</td>
      <td>${u.co2Saved} kg</td>
      <td class="lb-score">${u.ecoScore.toLocaleString()}</td>
    </tr>
  `).join('');
}

const CO2_FACTORS = { plastic: 2.4, 'e-waste': 250, metal: 4.1, cardboard: 2.4, glass: 0.8 };

function updateSimulator() {
  const items    = parseInt($('#sim-items').value, 10);
  const months   = parseInt($('#sim-months').value, 10);
  const weight   = parseFloat($('#sim-weight').value);
  const category = $('#sim-category').value;
  const factor   = CO2_FACTORS[category] || 2.4;

  const totalItems = items * 4 * months;  
  const totalWaste = +(totalItems * weight).toFixed(1);
  const totalCO2   = +(totalWaste * factor).toFixed(1);
  const trees      = Math.round(totalCO2 / 21.7);  
  const pts        = totalItems * 30;

  function flashUpdate(id, val) {
    const el = $(id);
    el.style.transform = 'scale(1.15)';
    el.style.color = 'var(--teal-400)';
    el.textContent = val.toLocaleString();
    setTimeout(() => { el.style.transform = ''; el.style.color = ''; }, 300);
  }

  flashUpdate('#sim-waste-total', totalWaste);
  flashUpdate('#sim-co2-total',   totalCO2);
  flashUpdate('#sim-trees-total', trees);
  flashUpdate('#sim-pts-total',   pts);

  $('#sim-items-val').textContent  = items;
  $('#sim-months-val').textContent = months;
  $('#sim-weight-val').textContent = weight.toFixed(1) + ' kg';

  $('#sim-message').innerHTML = trees > 0
    ? `🌍 Recycling just <strong>${items} items/week</strong> for <strong>${months} months</strong> is equivalent to planting <strong>${trees} trees 🌳</strong>!`
    : `🌿 Even small actions add up. Start with <strong>${items} items/week</strong> and grow your impact!`;
}

function setupSimulator() {
  $$('.sim-slider, #sim-category').forEach(el => {
    el.addEventListener('input', updateSimulator);
    el.addEventListener('change', updateSimulator);
  });
  updateSimulator();
}

function scheduleDemoStep(callback, delay) {
  const timeoutId = setTimeout(() => {
    if (!AppState.demoRunning) return;
    callback();
  }, delay);
  AppState.demoTimeouts.push(timeoutId);
}

function startDemo() {
  if (AppState.demoRunning) return;
  AppState.demoRunning = true;
  updateDemoButtonUI();

  const progressBar  = $('#demo-progress-bar');
  const progressFill = $('#demo-progress-fill');
  if (progressBar) progressBar.classList.add('active');

  function setProgress(pct) { if (progressFill) progressFill.style.width = pct + '%'; }

  let t = 0;

  scheduleDemoStep(() => {
    toastShow('🎬 Demo Mode starting! Sit back and watch EcoSwap in action.', 'info', 3500);
  }, t);
  t += 800;

  scheduleDemoStep(() => {
    navigateTo('hero');
    setProgress(10);
  }, t);
  t += 1500;

  scheduleDemoStep(() => {
    navigateTo('upload');
    setProgress(20);
    toastShow('📤 Step 1: Uploading a waste item…', 'info');
  }, t);
  t += 1000;

  scheduleDemoStep(() => {
    fillSampleItem('plastic');
    setProgress(30);
  }, t);
  t += 1200;

  scheduleDemoStep(() => {
    const submitBtn = $('#submit-btn');
    const spinner   = $('#btn-spinner');
    const btnText   = $('#btn-text');
    if (submitBtn) submitBtn.disabled = true;
    if (spinner) spinner.style.display = 'block';
    if (btnText) btnText.textContent = 'Analyzing…';
    setProgress(45);
  }, t);
  t += 1500;

  scheduleDemoStep(() => {
    const name     = 'Plastic Bottle (500ml)';
    const category = 'plastic';
    const weight   = 0.05;

    const item = {
      id: Date.now(),
      name, category, weight,
      notes: 'Demo item — PET plastic, ready to recycle.',
      timestamp: new Date().toISOString(),
      status: 'uploaded',
    };
    AppState.myItems.unshift(item);
    localStorage.setItem('ecoswap-items', JSON.stringify(AppState.myItems));
    
    const desc = $('#journey-uploaded-desc');
    if (desc) desc.textContent = `"${name}" submitted`;

    showAISuggestion(item);
    const sug = getAISuggestion(category, weight);
    updateEcoScore(sug.ecoPoints);
    renderMyItems();
    showMyItemsSection();

    const submitBtn = $('#submit-btn');
    const spinner   = $('#btn-spinner');
    const btnText   = $('#btn-text');
    if (submitBtn) submitBtn.disabled = false;
    if (spinner) spinner.style.display = 'none';
    if (btnText) btnText.textContent = '🚀 Analyze & Upload';

    toastShow(`🤖 AI Suggestion: ${sug.icon} ${sug.action} with ${sug.confidence}% confidence!`, 'success', 3000);
    setProgress(55);
  }, t);
  t += 2000;

  scheduleDemoStep(() => {
    navigateTo('recyclers');
    setProgress(65);
    toastShow('🗺️ Step 3: Finding matching recyclers…', 'info');
  }, t);
  t += 2000;

  scheduleDemoStep(() => {
    const firstCard = $('#recyclers-grid .recycler-card');
    if (firstCard) {
      firstCard.classList.add('demo-highlight');
      setTimeout(() => firstCard.classList.remove('demo-highlight'), 1500);
    }
    activateJourneyStep(2);
    setProgress(75);
  }, t);
  t += 2000;

  scheduleDemoStep(() => {
    navigateTo('impact');
    setProgress(88);
    toastShow('📊 Step 4: Your environmental impact dashboard!', 'info');
  }, t);
  t += 2500;

  scheduleDemoStep(() => {
    navigateTo('leaderboard');
    setProgress(95);
    toastShow('🏆 Join top eco warriors on the leaderboard!', 'success');
  }, t);
  t += 2000;

  scheduleDemoStep(() => {
    setProgress(100);
  }, t);
  t += 500;

  scheduleDemoStep(() => {
    toastShow('🎉 Demo complete! EcoSwap — Turning Waste into Value 🌱', 'success', 5000);
    
    setTimeout(() => {
      const progressBar  = $('#demo-progress-bar');
      const progressFill = $('#demo-progress-fill');
      if (progressBar) progressBar.classList.remove('active');
      if (progressFill) progressFill.style.width = '0%';
      
      AppState.demoRunning = false;
      updateDemoButtonUI();
    }, 1000);
  }, t);
}

function stopDemo() {
  if (!AppState.demoRunning) return;
  
  AppState.demoTimeouts.forEach(id => clearTimeout(id));
  AppState.demoTimeouts = [];
  AppState.demoRunning = false;
  
  updateDemoButtonUI();

  const progressBar  = $('#demo-progress-bar');
  const progressFill = $('#demo-progress-fill');
  if (progressBar) progressBar.classList.remove('active');
  if (progressFill) progressFill.style.width = '0%';
  
  const submitBtn = $('#submit-btn');
  const spinner   = $('#btn-spinner');
  const btnText   = $('#btn-text');
  if (submitBtn) submitBtn.disabled = false;
  if (spinner) spinner.style.display = 'none';
  if (btnText && btnText.textContent === 'Analyzing…') btnText.innerHTML = '<span class="emoji">🤖</span> Analyze & Upload';

  toastShow('⛔ Demo stopped.', 'warning');
}

function toggleDemoMode() {
  if (AppState.demoRunning) {
    stopDemo();
  } else {
    startDemo();
  }
}

function updateDemoButtonUI() {
  const btn = $('#demo-btn');
  if (!btn) return;
  
  if (AppState.demoRunning) {
    btn.innerHTML = '<span class="emoji">⛔</span> Stop Demo';
    btn.classList.add('demo-active');
  } else {
    btn.innerHTML = '<span class="emoji">▶️</span> Start Demo';
    btn.classList.remove('demo-active');
  }
}

function setupRecyclerFilters() {
  $$('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderRecyclers(btn.dataset.filter);
    });
  });
}

function setupFindRecyclerBtn() {
  $('#find-recycler-btn')?.addEventListener('click', () => {
    const item = AppState.lastUploadedItem;
    navigateTo('recyclers');

    if (item) {
      const filterMap = {
        plastic: 'plastic', 'e-waste': 'e-waste', cardboard: 'plastic',
        metal: 'metal', glass: 'glass', organic: 'organic',
      };
      const f = filterMap[item.category] || 'all';
      $$('.filter-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.filter === f || (f === 'all' && b.dataset.filter === 'all'));
      });
      renderRecyclers(f);
    }
    toastShow('🗺️ Showing recyclers for your waste category!', 'info');
  });
}

function setupFooterLinks() {
  $$('.footer-links a[data-section]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(a.dataset.section);
    });
  });
}

function setupScrollAnimations() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  $$('.tl-item').forEach(el => observer.observe(el));
}

function setupHeroCTAs() {
  $('#hero-upload-btn')?.addEventListener('click', () => navigateTo('upload'));
  $('#hero-impact-btn')?.addEventListener('click', () => navigateTo('impact'));
  $('#nav-brand-link')?.addEventListener('click', e => { e.preventDefault(); navigateTo('hero'); });
}

function runTypewriter(el, text, speed = 55) {
  if (!el) return;
  let i = 0;
  el.innerHTML = '<span class="cursor"></span>';
  const cursor = el.querySelector('.cursor');

  function type() {
    if (i < text.length) {
      el.insertBefore(document.createTextNode(text[i]), cursor);
      i++;
      setTimeout(type, speed + (Math.random() * 30 - 15));
    } else {

      setTimeout(() => cursor.remove(), 2000);
    }
  }
  setTimeout(type, 700);  
}

function setupScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target); 
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  $$('.reveal, .glass-card, .counter-card, .recycler-card, .lb-podium-item').forEach((el, i) => {
    if (!el.classList.contains('reveal')) {
      el.classList.add('reveal');
    }

    const siblings = [...el.parentElement.children].filter(c =>
      c.classList.contains('reveal') || c.classList.contains('glass-card') ||
      c.classList.contains('counter-card') || c.classList.contains('recycler-card'));
    const sibIndex = siblings.indexOf(el);
    if (sibIndex > 0 && sibIndex <= 4) {
      el.style.transitionDelay = `${sibIndex * 0.08}s`;
    }
    observer.observe(el);
  });
}

function observeNewCards(container) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  $$('.reveal', container).forEach(el => {
    el.classList.remove('revealed');
    observer.observe(el);
  });
}

let selectedRating = 0;

function setupStarRating() {
  const stars = $$('.star', $('#star-rating'));
  if (!stars.length) return;

  stars.forEach(star => {
    const val = parseInt(star.dataset.value, 10);

    star.addEventListener('mouseenter', () => {
      stars.forEach(s => {
        const sv = parseInt(s.dataset.value, 10);
        s.classList.toggle('hovered', sv <= val);
        s.classList.remove('selected');
      });
    });

    star.addEventListener('mouseleave', () => {
      stars.forEach(s => {
        s.classList.remove('hovered');
        const sv = parseInt(s.dataset.value, 10);
        s.classList.toggle('selected', sv <= selectedRating);
      });
    });

    star.addEventListener('click', () => {
      selectedRating = val;
      stars.forEach(s => {
        const sv = parseInt(s.dataset.value, 10);
        s.classList.toggle('selected', sv <= selectedRating);
        s.classList.remove('hovered');
      });
    });
  });
}

function loadFeedback() {
  return JSON.parse(localStorage.getItem('ecoswap-feedback') || '[]');
}

function saveFeedback(entries) {
  localStorage.setItem('ecoswap-feedback', JSON.stringify(entries));
}

function renderRecentFeedback() {
  const list = $('#recent-feedback-list');
  if (!list) return;
  const entries = loadFeedback();

  if (!entries.length) {
    list.innerHTML = '<div class="fb-empty">No feedback yet. Be the first! 🌱</div>';
    return;
  }

  list.innerHTML = entries.slice(0, 5).map((fb, i) => {
    const initials = fb.name ? fb.name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '👤';
    const stars = '★'.repeat(fb.rating) + '☆'.repeat(5 - fb.rating);
    return `
      <div class="fb-card reveal" style="transition-delay:${i * 0.06}s">
        <div class="fb-card-header">
          <div class="fb-avatar" style="background:${avatarColor(i)}">${initials === '👤' ? '👤' : initials}</div>
          <span class="fb-name">${fb.name || 'Anonymous'}</span>
          <span class="fb-time">${timeAgo(fb.timestamp)}</span>
        </div>
        <div class="fb-stars">${stars}</div>
        <div class="fb-message">${escapeHtml(fb.message)}</div>
      </div>
    `;
  }).join('');

  setTimeout(() => observeNewCards(list), 50);
}

function avatarColor(i) {
  const colors = ['#22c55e','#3b82f6','#a855f7','#f59e0b','#ef4444','#06b6d4'];
  return colors[i % colors.length];
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function setupFeedbackForm() {
  const form      = $('#feedback-form');
  const successEl = $('#fb-success');
  const againBtn  = $('#fb-again-btn');
  const spinner   = $('#fb-spinner');
  const btnText   = $('#fb-btn-text');
  const errorEl   = $('#fb-error');

  if (!form) return;

  setupStarRating();

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const message = $('#fb-message').value.trim();
    if (!message) {
      errorEl.textContent = 'Please write something before submitting.';
      $('#fb-message').focus();
      return;
    }
    errorEl.textContent = '';

    $('#fb-submit-btn').disabled = true;
    spinner.style.display = 'inline-block';
    btnText.textContent = 'Saving…';

    await sleep(900);

    const entry = {
      name:      $('#fb-name').value.trim(),
      message,
      rating:    selectedRating || 5,
      timestamp: new Date().toISOString(),
    };

    const entries = loadFeedback();
    entries.unshift(entry);
    if (entries.length > 20) entries.pop();
    saveFeedback(entries);

    form.style.display = 'none';
    successEl.style.display = 'block';
    updateEcoScore(10); 
    toastShow('💬 Thank you! Feedback saved. +10 Eco Points!', 'success');

    renderRecentFeedback();
  });

  againBtn?.addEventListener('click', () => {
    form.reset();
    selectedRating = 0;
    $$('.star').forEach(s => s.classList.remove('selected', 'hovered'));
    $('#fb-name').value = '';
    '$fb-message';
    errorEl.textContent = '';
    successEl.style.display = 'none';
    form.style.display = 'block';
    $('#fb-submit-btn').disabled = false;
    spinner.style.display = 'none';
    btnText.innerHTML = '<span class="emoji">📤</span> Submit Feedback';
  });
}

async function init() {

  applyTheme(AppState.theme);

  const hero = $('#section-hero');
  if (hero) { hero.style.opacity = '0'; hero.classList.add('active'); }

  await loadData();

  if (hero) {
    hero.style.transition = 'opacity 0.6s ease';
    hero.style.opacity = '1';
  }

  runTypewriter($('#hero-tagline'), 'Small actions. Big impact. Starting today.');

  setTimeout(initHeroStatCounters, 300);

  if (AppState.myItems.length) {
    showMyItemsSection();
    renderMyItems();
  }

  renderEcoScore();

  $$('.nav-link[data-section]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(link.dataset.section);
    });
  });

  $('#theme-toggle')?.addEventListener('click', toggleTheme);

  $('#demo-btn')?.addEventListener('click', toggleDemoMode);

  $('#hamburger')?.addEventListener('click', () => {
    const isOpen = $('#nav-links').classList.contains('open');
    isOpen ? closeMobileMenu() : openMobileMenu();
  });
  $('#mobile-menu-overlay')?.addEventListener('click', closeMobileMenu);

  $$('.btn-sample[data-sample]').forEach(btn => {
    btn.addEventListener('click', () => fillSampleItem(btn.dataset.sample));
  });

  setupWasteForm();
  setupImageUpload();
  setupFindRecyclerBtn();

  setupRecyclerFilters();

  setupSimulator();

  setupFeedbackForm();
  renderRecentFeedback();

  setupFooterLinks();

  setupHeroCTAs();

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });

  setupScrollAnimations();

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMobileMenu();
  });

  const cursorGlow = document.createElement('div');
  cursorGlow.className = 'cursor-glow';
  document.body.appendChild(cursorGlow);
  document.addEventListener('mousemove', e => {
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top = e.clientY + 'px';
  });

  console.log('🌱 EcoSwap initialized successfully!');
}

function navigateTo(sectionId, updateLinks = true) {
  if (AppState.currentSection === sectionId) return;

  const prev = $(`#section-${AppState.currentSection}`);
  if (prev) prev.classList.remove('active');

  const next = $(`#section-${sectionId}`);
  if (!next) return;
  next.classList.add('active', 'fade-in');
  setTimeout(() => next.classList.remove('fade-in'), 600);

  AppState.currentSection = sectionId;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (updateLinks) {
    $$('.nav-link').forEach(l => {
      l.classList.toggle('active', l.dataset.section === sectionId);
    });
  }

  if (sectionId === 'impact') {
    setTimeout(() => {
      renderImpactCounters();
      renderBarChart();
      renderPieChart();
      renderTimeline();
    }, 150);
  }
  if (sectionId === 'leaderboard') renderLeaderboard();
  if (sectionId === 'recyclers')   renderRecyclers();
  if (sectionId === 'feedback')    renderRecentFeedback();

  closeMobileMenu();

  setTimeout(() => setupScrollAnimations(), 200);
}

document.addEventListener('DOMContentLoaded', init);
