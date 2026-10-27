// Chaque pièce est stockée sous sa propre clé pour ne pas réécrire tout le dossier à chaque modification.
const cle = (id) => `preuve:${id}`;

export async function enregistrer(preuve) {
  await chrome.storage.local.set({ [cle(preuve.id)]: preuve });
}

export async function lire(id) {
  const resultat = await chrome.storage.local.get(cle(id));
  return resultat[cle(id)] ?? null;
}

export async function mettreAJour(id, champs) {
  const preuve = await lire(id);
  if (!preuve) return null;
  const nouvelle = { ...preuve, ...champs };
  await enregistrer(nouvelle);
  return nouvelle;
}

export async function lister() {
  const tout = await chrome.storage.local.get(null);
  return Object.entries(tout)
    .filter(([k]) => k.startsWith("preuve:"))
    .map(([, v]) => v)
    .sort((a, b) => b.numero - a.numero);
}

export async function supprimer(id) {
  await chrome.storage.local.remove(cle(id));
}

export async function prochainNumero() {
  const { compteur = 0 } = await chrome.storage.local.get("compteur");
  await chrome.storage.local.set({ compteur: compteur + 1 });
  return compteur + 1;
}

export async function lireCleApi() {
  const { cleApi = "" } = await chrome.storage.local.get("cleApi");
  return cleApi;
}

export async function ecrireCleApi(valeur) {
  await chrome.storage.local.set({ cleApi: valeur.trim() });
}

// Adresses vérifiées sur les sites officiels des associations (octobre 2026).
export const ASSOCIATIONS_PAR_DEFAUT = ["accueil@mrap.fr", "ldh@ldh-france.org"];

export async function lireAssociations() {
  const { associations = ASSOCIATIONS_PAR_DEFAUT } = await chrome.storage.local.get("associations");
  return associations;
}

export async function ecrireAssociations(adresses) {
  await chrome.storage.local.set({ associations: adresses });
}
