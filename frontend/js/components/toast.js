/* =========================================================
   HEYPITCH STORE - Toast Notifications
   ========================================================= */

let toastT;
function toast(msg){
  const t = $("#toast");
  if(!t) return;
  t.textContent = msg;
  t.classList.add("on");
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove("on"), 2200);
}
