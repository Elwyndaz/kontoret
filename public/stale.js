// After a deploy, an index.html still cached from before (max-age 600) asks for hashed JS and CSS that Pages no
// longer has; without the JS nothing ever enables the start button. A reload revalidates index.html.
// Deferred: it runs after stylesheets settle (a failed one has no rules) and before the module entry, whose error it catches.
function offerReload() {
  var button = document.getElementById("start-button");
  button.dataset.stale = "1";
  button.disabled = false;
  button.textContent = "LADDA OM";
  button.onclick = function () { location.reload(); };
  document.getElementById("load-status").textContent = "Kontoret har fått en ny version. Ladda om sidan.";
}
document.querySelectorAll('link[rel="stylesheet"][href*="/kontoret/assets/"]').forEach(function (link) {
  if (!link.sheet || !link.sheet.cssRules.length) offerReload();
});
addEventListener("error", function (event) {
  if (event.target instanceof HTMLScriptElement && event.target.src.indexOf("/kontoret/assets/") >= 0) offerReload();
}, true);
