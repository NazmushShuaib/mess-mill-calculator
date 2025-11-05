// Elements
const membersDiv = document.getElementById('members');
const addMemberBtn = document.getElementById('addMemberBtn');
const calculateBtn = document.getElementById('calculateBtn');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const resetBtn = document.getElementById('resetBtn');

const summaryDiv = document.getElementById('summary');
const totalMealsEl = document.getElementById('totalMeals');
const totalBazarEl = document.getElementById('totalBazar');
const mealRateEl = document.getElementById('mealRate');
const balanceCheckEl = document.getElementById('balanceCheck');

const resultsPanel = document.getElementById('resultsPanel');
const resultTableBody = document.querySelector('#resultTable tbody');

// Create input row
function createRow(data = { name: '', meals: '', bazar: '' }) {
  const row = document.createElement('div');
  row.className = 'row';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'নাম';
  nameInput.value = data.name ?? '';

  const mealsInput = document.createElement('input');
  mealsInput.type = 'number';
  mealsInput.placeholder = 'মিল';
  mealsInput.min = '0';
  mealsInput.step = '0.5';
  mealsInput.value = data.meals ?? '';

  const bazarInput = document.createElement('input');
  bazarInput.type = 'number';
  bazarInput.placeholder = 'বাজার (৳)';
  bazarInput.min = '0';
  bazarInput.step = '0.01';
  bazarInput.value = data.bazar ?? '';

  const delBtn = document.createElement('button');
  delBtn.className = 'btn btn-danger';
  delBtn.textContent = 'মুছুন';
  delBtn.onclick = () => row.remove();

  row.appendChild(nameInput);
  row.appendChild(mealsInput);
  row.appendChild(bazarInput);
  row.appendChild(delBtn);

  membersDiv.appendChild(row);
}

// Read all rows
function getData() {
  const rows = Array.from(membersDiv.querySelectorAll('.row'));
  return rows.map(r => {
    const [nameEl, mealsEl, bazarEl] = r.querySelectorAll('input');
    return {
      name: (nameEl.value || '').trim(),
      meals: parseFloat(mealsEl.value) || 0,
      bazar: parseFloat(bazarEl.value) || 0
    };
  }).filter(d => d.name !== '' || d.meals > 0 || d.bazar > 0);
}

// Calculate and render
function calculate() {
  const data = getData();

  const totalMeals = data.reduce((s, d) => s + d.meals, 0);
  const totalBazar = data.reduce((s, d) => s + d.bazar, 0);
  const mealRate = totalMeals > 0 ? (totalBazar / totalMeals) : 0;

  // Summary
  summaryDiv.style.display = 'grid';
  totalMealsEl.textContent = formatNumber(totalMeals);
  totalBazarEl.textContent = formatCurrency(totalBazar);
  mealRateEl.textContent = formatCurrency(mealRate);

  // Table
  resultsPanel.style.display = 'block';
  resultTableBody.innerHTML = '';

  let plusSum = 0, minusSum = 0;

  data.forEach(d => {
    const eatCost = d.meals * mealRate;      // খাওয়ার খরচ
    const settlement = eatCost - d.bazar;    // প্লাস/মাইনাস

    if (settlement >= 0) plusSum += settlement;
    else minusSum += settlement;

    const tr = document.createElement('tr');

    const statusBadge = document.createElement('span');
    statusBadge.className = 'badge ' + (settlement >= 0 ? 'badge-pos' : 'badge-neg');
    statusBadge.textContent = settlement >= 0 ? 'দিতে হবে' : 'নিতে হবে';

    tr.innerHTML = `
      <td class="name">${escapeHtml(d.name || '(নাম নেই)')}</td>
      <td>${formatNumber(d.meals)}</td>
      <td>${formatCurrency(d.bazar)}</td>
      <td>${formatCurrency(eatCost)}</td>
      <td>${formatCurrency(settlement)}</td>
      <td>${statusBadge.outerHTML}</td>
    `;
    resultTableBody.appendChild(tr);
  });

  // Balance check
  const balance = plusSum + minusSum; // minusSum is negative
  balanceCheckEl.textContent = Math.abs(balance) < 0.05 ? 'OK' : formatCurrency(balance);
  balanceCheckEl.style.color = Math.abs(balance) < 0.05 ? '#22c55e' : '#ef4444';
}

// Formatting helpers
function formatCurrency(n) {
  return new Intl.NumberFormat('bn-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 2
  }).format(n || 0);
}
function formatNumber(n) {
  return new Intl.NumberFormat('bn-BD', { maximumFractionDigits: 2 }).format(n || 0);
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// Persistence
function save() {
  const data = getData();
  localStorage.setItem('meal-data', JSON.stringify(data));
  alert('ডেটা সেভ হয়েছে।');
}
function load() {
  const raw = localStorage.getItem('meal-data');
  if (!raw) { alert('কোনো সেভড ডেটা নেই।'); return; }
  const data = JSON.parse(raw);
  membersDiv.innerHTML = '';
  data.forEach(d => createRow(d));
  alert('ডেটা লোড হয়েছে।');
}
function resetAll() {
  if (!confirm('সব ডেটা রিসেট হবে, নিশ্চিত?')) return;
  localStorage.removeItem('meal-data');
  membersDiv.innerHTML = '';
  summaryDiv.style.display = 'none';
  resultsPanel.style.display = 'none';
}

// Default rows
function init() {
  ['A','B','C','D','E','F'].forEach(n => createRow({ name: n, meals: '', bazar: '' }));
}

// Events
addMemberBtn.onclick = () => createRow();
calculateBtn.onclick = calculate;
saveBtn.onclick = save;
loadBtn.onclick = load;
resetBtn.onclick = resetAll;

document.getElementById("downloadInvoice").onclick = () => {
  const data = getData();
  const totalMeals = data.reduce((s, d) => s + d.meals, 0);
  const totalBazar = data.reduce((s, d) => s + d.bazar, 0);
  const mealRate = totalMeals > 0 ? (totalBazar / totalMeals) : 0;

  const tbody = document.getElementById("invoiceBody");
  tbody.innerHTML = "";

  data.forEach(d => {
    const eatCost = d.meals * mealRate;
    const balance = eatCost - d.bazar;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.name}</td>
      <td>${d.meals}</td>
      <td>${d.bazar.toFixed(2)}</td>
      <td>${eatCost.toFixed(2)}</td>
      <td>${balance.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("invTotalMeals").textContent = totalMeals.toFixed(2);
  document.getElementById("invTotalBazar").textContent = totalBazar.toFixed(2);
  document.getElementById("invMealRate").textContent = mealRate.toFixed(2);

  const today = new Date();
  const formatted = today.toLocaleDateString('bn-BD', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  document.getElementById("invDate").textContent = formatted;

  const invoice = document.getElementById("invoice");
  invoice.style.display = "block";
  html2pdf().set({
    margin: 10,
    filename: 'Mess_Invoice_Nov_2025.pdf',
    image: { type: 'png', quality: 1.0 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).from(invoice).save().then(() => {
    invoice.style.display = "none";
  });
};

init();