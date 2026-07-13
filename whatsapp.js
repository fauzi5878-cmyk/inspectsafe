function buildWhatsAppMessage(r){
  return `🚨 *HSE INSPECTION FINDING*

*Finding No:* ${r.findingNo||r.id||"-"}
*Inspection Date:* ${formatDateForMessage(r.inspectionDate)}
*Location:* ${r.location}
*Category:* ${r.category}

*Finding / Concern:*
${r.finding}

*Recommendation / Action Plan:*
${r.action||"-"}

*PIC / Department:* ${r.pic||"-"}
*Due Date:* ${formatDateForMessage(r.due)}
*Status:* ${r.status}

Please take the necessary corrective action and provide completion evidence.

_Reported via InspectSafe_`;
}

function normalizePhone(phone){
  let value=String(phone||"").replace(/\D/g,"");
  if(value.startsWith("0"))value="60"+value.slice(1);
  return value;
}

function sendWhatsApp(index){
  const r=records[index];
  if(!r){alert("Record not found.");return;}

  const phone=normalizePhone(r.picPhone);
  if(!phone || phone.length<10){
    alert("PIC WhatsApp number has not been entered in master-data.js.");
    return;
  }

  const url="https://wa.me/"+phone+"?text="+encodeURIComponent(buildWhatsAppMessage(r));
  window.open(url,"_blank");
}

async function sendToWhatsAppGroup(index){
  const r=records[index];
  if(!r){alert("Record not found.");return;}
  if(!r.whatsappGroupLink){
    alert("WhatsApp group link has not been entered in master-data.js.");
    return;
  }

  const message=buildWhatsAppMessage(r);
  try{
    await navigator.clipboard.writeText(message);
    alert("Message copied. WhatsApp group will open. Paste the message and press Send.");
  }catch(error){
    prompt("Copy this message, then open the group:",message);
  }
  window.open(r.whatsappGroupLink,"_blank");
}

function formatDateForMessage(value){
  const parts=String(value||"").split("-");
  if(parts.length!==3)return value||"-";
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
