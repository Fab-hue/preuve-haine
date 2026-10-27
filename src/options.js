import { lireCleApi, ecrireCleApi, lireAssociations, ecrireAssociations } from "./stockage.js";

const champ = document.getElementById("cle");
const confirmation = document.getElementById("confirmation");

if (await lireCleApi()) champ.placeholder = "Clé enregistrée. Colle une nouvelle clé pour la remplacer.";

document.getElementById("formulaire").addEventListener("submit", async (e) => {
  e.preventDefault();
  await ecrireCleApi(champ.value);
  champ.value = "";
  champ.placeholder = "Clé enregistrée. Colle une nouvelle clé pour la remplacer.";
  confirmation.textContent = "Clé enregistrée.";
});

document.getElementById("supprimer-cle").addEventListener("click", async () => {
  await ecrireCleApi("");
  champ.placeholder = "sk-ant-…";
  confirmation.textContent = "Clé supprimée. Tu qualifieras les pièces toi-même.";
});

const zoneAssociations = document.getElementById("associations");
const confirmationAssociations = document.getElementById("confirmation-associations");
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
  confirmationAssociations.textContent = `${adresses.length} adresse(s) enregistrée(s).`;
});
