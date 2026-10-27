// src/stockage.js
async function lireCleApi() {
  const { cleApi = "" } = await chrome.storage.local.get("cleApi");
  return cleApi;
}
async function ecrireCleApi(valeur) {
  await chrome.storage.local.set({ cleApi: valeur.trim() });
}
var ASSOCIATIONS_PAR_DEFAUT = ["accueil@mrap.fr", "ldh@ldh-france.org"];
async function lireAssociations() {
  const { associations = ASSOCIATIONS_PAR_DEFAUT } = await chrome.storage.local.get("associations");
  return associations;
}
async function ecrireAssociations(adresses) {
  await chrome.storage.local.set({ associations: adresses });
}

// src/options.js
var champ = document.getElementById("cle");
var confirmation = document.getElementById("confirmation");
if (await lireCleApi()) champ.placeholder = "Cl\xE9 enregistr\xE9e. Colle une nouvelle cl\xE9 pour la remplacer.";
document.getElementById("formulaire").addEventListener("submit", async (e) => {
  e.preventDefault();
  await ecrireCleApi(champ.value);
  champ.value = "";
  champ.placeholder = "Cl\xE9 enregistr\xE9e. Colle une nouvelle cl\xE9 pour la remplacer.";
  confirmation.textContent = "Cl\xE9 enregistr\xE9e.";
});
document.getElementById("supprimer-cle").addEventListener("click", async () => {
  await ecrireCleApi("");
  champ.placeholder = "sk-ant-\u2026";
  confirmation.textContent = "Cl\xE9 supprim\xE9e. Tu qualifieras les pi\xE8ces toi-m\xEAme.";
});
var zoneAssociations = document.getElementById("associations");
var confirmationAssociations = document.getElementById("confirmation-associations");
zoneAssociations.value = (await lireAssociations()).join("\n");
document.getElementById("formulaire-associations").addEventListener("submit", async (e) => {
  e.preventDefault();
  const adresses = zoneAssociations.value.split(/[\s,;]+/).filter(Boolean);
  const invalides = adresses.filter((a) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a));
  if (invalides.length > 0) {
    confirmationAssociations.textContent = `Adresse invalide : ${invalides.join(", ")}. Corrige-la puis enregistre.`;
    return;
  }
  await ecrireAssociations(adresses);
  zoneAssociations.value = adresses.join("\n");
  confirmationAssociations.textContent = `${adresses.length} adresse(s) enregistr\xE9e(s).`;
});
