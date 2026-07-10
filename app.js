let records = JSON.parse(localStorage.getItem('inspectsafe_v2_records') || '[]');
let photoData = '';

const today = new Date().toISOString().slice(0,10);
document.getElementById('inspectionDate').value = today;

document.getElementById('photo').addEventListener('change', e => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    photoData = ev.target.result;
    const img = document.getElementById('preview');
    img.src = photoData;
    img.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
});

function showView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if(id==='dashboard') updateDashboard();
  if(id==='records') renderRecords();
  window.scrollTo(0,0);
}

function saveFinding(){
  const finding = document.getElementById('finding').value.trim();
  if(!finding){alert('Please enter Finding / Concern.');return;}

  const r = {
    id: 'INS-' + Date.now(),
    date: document.getElementById('inspectionDate').value,
    location: document.getElementById('location').value,
    department: document.getElementById('department').value.trim(),
    category: document.getElementById('category').value,
    finding,
    action: document.getElementById('action').value.trim(),
    risk: document.getElementById('risk').value,
    status: document.getElementById('status').value,
    pic: document.getElementById('pic').value.trim(),
    phone: normalizePhone(document.getElementById('phone').value),
    dueDate: document.getElementById('dueDate').value,
    photo: photoData,
    createdAt: new Date().toLocaleString()
  };

  records.unshift(r);
  persist();
  alert('Finding saved successfully.');
  clearForm();
  updateDashboard();
  showView('records');
}

function clearForm(){
  ['department','finding','action','pic','phone','dueDate'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('status').value='Open';
  document.getElementById('risk').value='Medium';
  document.getElementById('photo').value='';
  photoData='';
  document.getElementById('preview').classList.add('hidden');
}

function persist(){
  try{localStorage.setItem('inspectsafe_v2_records', JSON.stringify(records));}
  catch(e){alert('Storage is full. Try saving without a photo.');}
}

function updateDashboard(){
  document.getElementById('totalCount').textContent = records.length;
  document.getElementById('openCount').textContent = records.filter(r=>r.status==='Open').length;
  document.getElementById('progressCount').textContent = records.filter(r=>r.status==='In Progress').length;
  document.getElementById('closedCount').textContent = records.filter(r=>r.status==='Closed').length;
  const t = new Date(today);
  document.getElementById('overdueCount').textContent = records.filter(r=>r.status!=='Closed' && r.dueDate && new Date(r.dueDate)<t).length;
}

function renderRecords(){
  const q = document.getElementById('search').value.toLowerCase();
  const st = document.getElementById('filterStatus').value;
  const filtered = records.filter(r=>{
    const hay = `${r.finding} ${r.pic} ${r.location} ${r.department}`.toLowerCase();
    return (!q || hay.includes(q)) && (!st || r.status===st);
  });
  document.getElementById('recordsList').innerHTML = filtered.length ? filtered.map((r,i)=>`
    <div class="card">
      <b>${escapeHtml(r.id)} — ${escapeHtml(r.location)}</b>
      <div class="small">${escapeHtml(r.date)} | ${escapeHtml(r.category)} | <span class="risk-${r.risk}">${escapeHtml(r.risk)}</span> | ${escapeHtml(r.status)}</div>
      <p><b>Finding:</b><br>${escapeHtml(r.finding)}</p>
      <p><b>Action:</b><br>${escapeHtml(r.action||'-')}</p>
      <p><b>PIC:</b> ${escapeHtml(r.pic||'-')}<br><b>Due:</b> ${escapeHtml(r.dueDate||'-')}</p>
      ${r.photo ? `<img src="${r.photo}" alt="Inspection photo">` : ''}
      <div class="card-actions">
        <button class="whatsapp" onclick="sendRecordToWhatsApp('${r.id}')">WhatsApp</button>
        <button onclick="toggleStatus('${r.id}')">Change Status</button>
        <button onclick="deleteRecord('${r.id}')">Delete</button>
      </div>
    </div>`).join('') : '<p>No records found.</p>';
}

function normalizePhone(phone){
  let p = String(phone||'').replace(/\D/g,'');
  if(p.startsWith('0')) p = '60' + p.slice(1);
  return p;
}

function buildMessage(r){
  return `*INSPECTSAFE – HSE FINDING*\n\n`+
  `Finding No: ${r.id}\n`+
  `Date: ${r.date}\n`+
  `Location: ${r.location}\n`+
  `Department: ${r.department||'-'}\n`+
  `Category: ${r.category}\n`+
  `Risk: ${r.risk}\n\n`+
  `*Finding:*\n${r.finding}\n\n`+
  `*Required Action:*\n${r.action||'-'}\n\n`+
  `PIC: ${r.pic||'-'}\n`+
  `Due Date: ${r.dueDate||'-'}\n`+
  `Status: ${r.status}`;
}

function sendCurrentToWhatsApp(){
  const r = {
    id:'DRAFT', date:document.getElementById('inspectionDate').value,
    location:document.getElementById('location').value,
    department:document.getElementById('department').value.trim(),
    category:document.getElementById('category').value,
    risk:document.getElementById('risk').value,
    finding:document.getElementById('finding').value.trim(),
    action:document.getElementById('action').value.trim(),
    pic:document.getElementById('pic').value.trim(),
    dueDate:document.getElementById('dueDate').value,
    status:document.getElementById('status').value
  };
  const phone = normalizePhone(document.getElementById('phone').value);
  openWhatsApp(phone, buildMessage(r));
}

function sendRecordToWhatsApp(id){
  const r = records.find(x=>x.id===id);
  if(r) openWhatsApp(r.phone, buildMessage(r));
}

function openWhatsApp(phone,message){
  if(!phone){alert('Please enter PIC WhatsApp number, for example 60123456789.');return;}
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url,'_blank');
}

function toggleStatus(id){
  const r = records.find(x=>x.id===id);
  if(!r) return;
  r.status = r.status==='Open' ? 'In Progress' : r.status==='In Progress' ? 'Closed' : 'Open';
  persist(); renderRecords(); updateDashboard();
}

function deleteRecord(id){
  if(confirm('Delete this finding?')){
    records = records.filter(r=>r.id!==id);
    persist(); renderRecords(); updateDashboard();
  }
}

function generateWorkplaceReport(){
  if(!records.length){alert('No records available.');return;}
  const rows = records.map((r,i)=>`<tr>
    <td>${i+1}</td><td>${escapeHtml(r.date)}</td><td>${escapeHtml(r.location)}</td>
    <td>${escapeHtml(r.finding)}</td><td>${escapeHtml(r.action||'-')}</td>
    <td>${escapeHtml(r.pic||'-')}</td><td>${escapeHtml(r.dueDate||'-')}</td><td>${escapeHtml(r.status)}</td>
  </tr>`).join('');
  const photos = records.filter(r=>r.photo).map((r,i)=>`<div class="photo-card">
    <b>Photo ${i+1}: ${escapeHtml(r.location)}</b>
    <p>${escapeHtml(r.finding)}</p><img src="${r.photo}">
  </div>`).join('');
  document.getElementById('reportContent').innerHTML = `
    <div class="no-print"><button class="primary" onclick="window.print()">Print / Save PDF</button></div>
    <div class="report-head"><h2>WORKPLACE INSPECTION / AUDIT REPORT</h2><p>Generated: ${new Date().toLocaleString()}</p></div>
    <table class="report-table">
      <thead><tr><th>No</th><th>Date</th><th>Location</th><th>Hazard / Finding</th><th>Recommended Corrective Action</th><th>PIC</th><th>Target Date</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <h3>Photo Evidence</h3><div class="photo-grid">${photos||'<p>No photo attached.</p>'}</div>`;
  showView('report');
}

function generateSHOReport(){
  if(!records.length){alert('No records available.');return;}
  const open = records.filter(r=>r.status==='Open').length;
  const progress = records.filter(r=>r.status==='In Progress').length;
  const closed = records.filter(r=>r.status==='Closed').length;
  const rows = records.map((r,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(r.location)}</td><td>${escapeHtml(r.category)}</td><td>${escapeHtml(r.finding)}</td><td>${escapeHtml(r.action||'-')}</td><td>${escapeHtml(r.status)}</td></tr>`).join('');
  document.getElementById('reportContent').innerHTML = `
    <div class="no-print"><button class="primary" onclick="window.print()">Print / Save PDF</button></div>
    <div class="report-head"><h2>SHO MONTHLY REPORT — WORKPLACE INSPECTION SUMMARY</h2><p>Generated: ${new Date().toLocaleString()}</p></div>
    <h3>Summary</h3><p>Total Findings: <b>${records.length}</b> | Open: <b>${open}</b> | In Progress: <b>${progress}</b> | Closed: <b>${closed}</b></p>
    <h3>Method of Establishing and Maintaining Safe and Healthy Working Conditions</h3>
    <p>Workplace inspections were conducted to identify unsafe acts and unsafe conditions. Findings were assigned to responsible PICs with due dates for corrective action and follow-up.</p>
    <table class="report-table">
      <thead><tr><th>No</th><th>Location</th><th>Item</th><th>Concern</th><th>Recommendation / Action Plan</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <h3>Outstanding Matters</h3>
    <p>${open+progress > 0 ? `${open+progress} finding(s) require further follow-up until closure.` : 'No outstanding findings.'}</p>
    <h3>Management Advice</h3>
    <p>Department Heads are advised to monitor all assigned corrective actions, submit evidence of completion and prevent recurrence through routine workplace monitoring.</p>`;
  showView('report');
}

function escapeHtml(s){
  return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

updateDashboard();
