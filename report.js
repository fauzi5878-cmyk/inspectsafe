function generateWorkplaceReport(){
  if(!records.length){alert("No records available.");return}
  const rows=records.map((r,i)=>`
    <tr><td>${i+1}</td><td>${esc(r.findingNo||"-")}</td><td>${esc(r.inspectionDate)}</td><td>${esc(r.location)}</td>
    <td>${esc(r.category)}</td><td>${esc(r.finding)}</td><td>${esc(r.action||"-")}</td>
    <td>${esc(r.pic||"-")}</td><td>${esc(r.due||"-")}</td><td>${esc(r.status)}</td></tr>`).join("");

  document.getElementById("output").innerHTML=`
    <div class="no-print"><button class="export" onclick="window.print()">PRINT / SAVE AS PDF</button>
    <button onclick="location.reload()">BACK</button></div>
    <h2>WORKPLACE INSPECTION REPORT</h2>
    <p><b>Company:</b> ${esc(document.getElementById("company").value)}<br>
    <b>Report Generated:</b> ${new Date().toLocaleString()}<br>
    <b>Total Findings:</b> ${records.length}</p>
    <table><tr><th>No</th><th>Finding No</th><th>Date</th><th>Location</th><th>Category</th><th>Concern</th>
    <th>Action Plan</th><th>PIC</th><th>Due Date</th><th>Status</th></tr>${rows}</table>`;
}

function generateSHOReport(){
  if(!records.length){alert("No records available.");return}
  const month=document.getElementById("reportMonth").value;
  const data=records.filter(r=>!month||r.month===month||(r.inspectionDate||"").startsWith(month));
  const selected=data.length?data:records;
  const open=selected.filter(r=>r.status==="Open").length;
  const progress=selected.filter(r=>r.status==="In Progress").length;
  const closed=selected.filter(r=>r.status==="Closed").length;
  const rows=selected.map((r,i)=>`
    <tr><td>${i+1}</td><td>${esc(r.findingNo||"-")}</td><td>${esc(r.location)}</td><td>${esc(r.category)}</td>
    <td>${esc(r.finding)}</td><td>${esc(r.action||"-")}</td>
    <td>${esc(r.pic||"-")}</td><td>${esc(r.status)}</td></tr>`).join("");

  document.getElementById("output").innerHTML=`
    <div class="no-print"><button class="export" onclick="window.print()">PRINT / SAVE AS PDF</button>
    <button onclick="location.reload()">BACK</button></div>
    <h2>SHO MONTHLY REPORT - WORKPLACE INSPECTION SUMMARY</h2>
    <p><b>Company:</b> ${esc(document.getElementById("company").value)}<br>
    <b>Month:</b> ${esc(month||"-")}<br>
    <b>Total:</b> ${selected.length} | <b>Open:</b> ${open} |
    <b>In Progress:</b> ${progress} | <b>Closed:</b> ${closed}</p>
    <table><tr><th>No</th><th>Finding No</th><th>Location</th><th>Item</th><th>Concern</th>
    <th>Action Plan</th><th>PIC</th><th>Status</th></tr>${rows}</table>
    <h3>Management Advice</h3>
    <p>${open>0?"Management attention is required to close all open findings within the agreed due dates.":"All findings are closed. Continue monitoring."}</p>`;
}