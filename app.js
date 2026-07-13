let photoDataList=[];
let records=[];
let unsubscribeCloud=null;

function today(){return new Date().toISOString().slice(0,10)}
function monthNow(){return new Date().toISOString().slice(0,7)}

document.getElementById("inspectionDate").value=today();

document.getElementById("reportMonth").value=monthNow();

function initializeMasterData(){
  const picSelect=document.getElementById("pic");
  if(!picSelect){console.error("PIC dropdown not found in index.html");return;}
  picSelect.innerHTML='<option value="">Select PIC / Department</option>'+
    MASTER_PIC.map(p=>`<option value="${p.id}">${esc(p.name)}${p.department&&p.department!==p.name?` - ${esc(p.department)}`:""}</option>`).join("");

  const groupSelect=document.getElementById("whatsappGroup");
  if(!groupSelect){console.error("WhatsApp group dropdown not found in index.html");return;}
  groupSelect.innerHTML='<option value="">No WhatsApp group</option>'+
    MASTER_GROUPS.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join("");
}
initializeMasterData();

function setCloudStatus(text,isError=false){
  const el=document.getElementById("cloudStatus");
  el.textContent=text;
  el.style.color=isError?"#b00020":"#087a35";
}

function localPhotoKey(id){return "inspectsafe_photos_"+id}

function getLocalPhotos(id){
  try{return JSON.parse(localStorage.getItem(localPhotoKey(id))||"[]")}
  catch(e){return []}
}

function saveLocalPhotos(id,photos){
  if(!photos.length)return;
  try{localStorage.setItem(localPhotoKey(id),JSON.stringify(photos))}
  catch(e){alert("Photo not saved locally because phone storage is full.")}
}

function loadRecords(){
  setCloudStatus("Connecting to Firestore...");
  if(unsubscribeCloud)unsubscribeCloud();

  unsubscribeCloud=inspectionsRef.onSnapshot(snapshot=>{
    records=snapshot.docs
      .map(doc=>{
        const data=doc.data();
        return {
          id:doc.id,
          ...data,
          photos:getLocalPhotos(doc.id)
        };
      })
      .filter(r=>!r.test)
      .sort((a,b)=>{
        const at=a.createdAt&&a.createdAt.toMillis?a.createdAt.toMillis():0;
        const bt=b.createdAt&&b.createdAt.toMillis?b.createdAt.toMillis():0;
        return bt-at;
      });

    renderRecords();
    setCloudStatus("☁️ Cloud connected — records are synchronized.");
  },error=>{
    console.error(error);
    setCloudStatus("Cloud connection failed: "+error.message,true);
  });
}

function readFiles(files){
  const selected=[...files].slice(0,4);
  photoDataList=[];
  if(!selected.length){renderPhotoPreviews();return}
  let done=0;
  selected.forEach(file=>{
    const reader=new FileReader();
    reader.onload=e=>{
      photoDataList.push(e.target.result);
      done++;
      if(done===selected.length)renderPhotoPreviews();
    };
    reader.readAsDataURL(file);
  });
}

function renderPhotoPreviews(){
  document.getElementById("photoPreviewWrap").innerHTML=
    photoDataList.map(src=>`<img src="${src}" alt="Photo preview">`).join("");
}

document.getElementById("camera").addEventListener("change",e=>readFiles(e.target.files));
document.getElementById("gallery").addEventListener("change",e=>readFiles(e.target.files));


async function generateFindingNumber(){
  const year=new Date().getFullYear();
  const counterRef=db.collection("counters").doc("finding_"+year);

  return db.runTransaction(async transaction=>{
    const snap=await transaction.get(counterRef);
    const next=snap.exists?(Number(snap.data().lastNumber||0)+1):1;
    transaction.set(counterRef,{lastNumber:next,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
    return `HSE-${year}-${String(next).padStart(4,"0")}`;
  });
}

async function saveRecord(){
  const findingEl=document.getElementById("finding");
  const finding=findingEl.value.trim();
  if(!finding){alert("Please type Finding / Concern.");findingEl.focus();return}

  const saveButton=document.querySelector(".save");
  saveButton.disabled=true;
  saveButton.textContent="SAVING TO CLOUD...";

  const selectedPicId=document.getElementById("pic").value;
  const selectedPic=MASTER_PIC.find(p=>p.id===selectedPicId)||{name:"",department:"",phone:""};
  const selectedGroupId=document.getElementById("whatsappGroup").value;
  const selectedGroup=MASTER_GROUPS.find(g=>g.id===selectedGroupId)||{name:"",link:""};

  if(!selectedPicId){
    alert("Please select PIC / Department.");
    document.getElementById("pic").focus();
    saveButton.disabled=false;
    saveButton.textContent="SAVE FINDING";
    return;
  }

  const findingNo=await generateFindingNumber();

  const r={
    findingNo,
    dateSaved:new Date().toLocaleString(),
    inspectionDate:document.getElementById("inspectionDate").value,
    month:document.getElementById("reportMonth").value,
    location:document.getElementById("location").value,
    category:document.getElementById("category").value,
    finding,
    action:document.getElementById("action").value.trim(),
    pic:selectedPic.name,
    picDepartment:selectedPic.department,
    picPhone:selectedPic.phone,
    whatsappGroup:selectedGroup.name,
    whatsappGroupLink:selectedGroup.link,
    due:document.getElementById("due").value,
    status:document.getElementById("status").value,
    createdAt:firebase.firestore.FieldValue.serverTimestamp()
  };

  try{
    const doc=await inspectionsRef.add(r);
    saveLocalPhotos(doc.id,[...photoDataList]);
    resetForm();
    alert("Finding saved to Firestore cloud.");
  }catch(error){
    console.error(error);
    alert("Cloud save failed: "+error.message);
  }finally{
    saveButton.disabled=false;
    saveButton.textContent="SAVE FINDING";
  }
}

function resetForm(){
  document.getElementById("finding").value="";
  document.getElementById("action").value="";
  document.getElementById("pic").value="";
  document.getElementById("whatsappGroup").value="";
  document.getElementById("due").value="";
  document.getElementById("camera").value="";
  document.getElementById("gallery").value="";
  photoDataList=[];
  renderPhotoPreviews();
}

function renderRecords(){
  const total=records.length;
  const open=records.filter(r=>r.status==="Open").length;
  const progress=records.filter(r=>r.status==="In Progress").length;
  const closed=records.filter(r=>r.status==="Closed").length;

  document.getElementById("summary").innerHTML=
    `Total: ${total} | Open: ${open} | In Progress: ${progress} | Closed: ${closed}`;

  document.getElementById("records").innerHTML=records.length
    ?records.map((r,i)=>`
      <div class="card">
        <b>${i+1}. ${esc(r.findingNo||r.id||"-")} — ${esc(r.location)} - ${esc(r.category)}</b><br>
        <span class="small">Inspection: ${esc(r.inspectionDate)} | Status: ${esc(r.status)}</span>
        <p><b>Finding:</b><br>${esc(r.finding)}</p>
        <p><b>Action:</b><br>${esc(r.action||"-")}</p>
        <p><b>PIC:</b> ${esc(r.pic||"-")}<br><b>Due:</b> ${esc(r.due||"-")}</p>
        ${(r.photos||[]).length?`<div class="photo-grid">${r.photos.map(p=>`<img src="${p}" alt="Finding photo">`).join("")}</div>`:""}
        <button class="whatsapp no-print" onclick="sendWhatsApp(${i})">📱 SEND TO PIC</button>
        ${r.whatsappGroupLink?`<button class="whatsapp no-print" onclick="sendToWhatsAppGroup(${i})">👥 OPEN ${esc(r.whatsappGroup||"WHATSAPP GROUP")}</button>`:""}
      </div>`).join("")
    :"<p class='small'>No saved records yet.</p>";
}

function exportCSV(){
  if(!records.length){alert("No records to export.");return}
  const h=["No","Finding No","Document ID","Date Saved","Inspection Date","Month","Location","Category","Finding","Action","PIC","PIC Phone","WhatsApp Group","Due Date","Status"];
  const rows=records.map((r,i)=>[
    i+1,r.findingNo||"",r.id||"",r.dateSaved,r.inspectionDate,r.month,r.location,r.category,
    r.finding,r.action,r.pic,r.picPhone||"",r.whatsappGroup||"",r.due,r.status
  ]);
  const csv=[h,...rows].map(row=>
    row.map(c=>`"${String(c||"").replace(/"/g,'""')}"`).join(",")
  ).join("\n");
  downloadText(csv,"HSE_Master_Data_Cloud.csv","text/csv");
}

function downloadText(text,filename,type){
  const blob=new Blob([text],{type});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=filename;a.click();
  URL.revokeObjectURL(url);
}

async function clearAll(){
  if(!confirm("Delete ALL cloud inspection records? This affects every device."))return;
  try{
    const snapshot=await inspectionsRef.get();
    const batch=db.batch();
    snapshot.docs.forEach(doc=>{
      if(!doc.data().test)batch.delete(doc.ref);
      localStorage.removeItem(localPhotoKey(doc.id));
    });
    await batch.commit();
    alert("All inspection records deleted.");
  }catch(error){
    alert("Delete failed: "+error.message);
  }
}

function esc(t){
  return String(t||"").replace(/[&<>"']/g,m=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

loadRecords();
