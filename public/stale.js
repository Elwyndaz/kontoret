// After a deploy, an index.html still cached from before (max-age 600) asks for hashed JS and CSS that Pages no
// longer has; without the JS nothing ever enables the start button. A reload revalidates index.html.
// Classic script at the top of <head>, not deferred: it must listen before the hashed files load. A deferred check of
// link.sheet raced the stylesheet in WebKit, which runs deferred scripts before it loads, and offered a reload on every visit.
var stale = false;
function offerReload() {
  var button = document.getElementById("start-button");
  if (!button) { stale = true; return; } // the error came before the body was parsed
  button.dataset.stale = "1";
  button.disabled = false;
  button.textContent = "LADDA OM";
  button.onclick = function () { location.reload(); };
  document.getElementById("load-status").textContent = "Kontoret har fått en ny version. Ladda om sidan.";
}
addEventListener("error", function (event) {
  // A missing file is Pages' HTML 404 with nosniff: every engine fires error on the script or stylesheet link.
  var el = event.target;
  var url = el instanceof HTMLScriptElement ? el.src : el instanceof HTMLLinkElement && el.rel === "stylesheet" ? el.href : "";
  if (url.indexOf("/kontoret/assets/") >= 0) offerReload();
}, true);
document.addEventListener("DOMContentLoaded", function () { if (stale) offerReload(); });
