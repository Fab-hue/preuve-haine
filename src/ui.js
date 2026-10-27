// Construction du DOM par textContent : le contenu archivé n'est jamais interprété comme du HTML.
export function el(tag, attributs = {}, ...enfants) {
  const noeud = document.createElement(tag);
  for (const [nom, valeur] of Object.entries(attributs)) {
    if (valeur === undefined || valeur === null || valeur === false) continue;
    if (nom.startsWith("on")) noeud.addEventListener(nom.slice(2), valeur);
    else if (nom === "class") noeud.className = valeur;
    else noeud.setAttribute(nom, valeur === true ? "" : valeur);
  }
  for (const enfant of enfants.flat()) {
    if (enfant === null || enfant === undefined || enfant === false) continue;
    noeud.append(enfant instanceof Node ? enfant : String(enfant));
  }
  return noeud;
}

export const VERDICTS = {
  probablement_illegal: { libelle: "Probablement illégal", classe: "tampon--illegal" },
  limite: { libelle: "Limite", classe: "tampon--limite" },
  probablement_legal: { libelle: "Probablement légal", classe: "tampon--legal" },
};

export const STATUTS = {
  a_examiner: "À examiner",
  valide: "Validée",
  rejete: "Rejetée",
  envoye: "Envoyée",
};

// Une qualification rédigée à la main n'a pas forcément de pays ni d'article.
export function libelleInfraction(i) {
  const pays = { FR: "France", BE: "Belgique" }[i.pays];
  return `${pays ? `${pays} : ` : ""}${i.qualification}${i.texte ? ` (${i.texte})` : ""}`;
}

export function tampon(preuve) {
  if (preuve.etatAnalyse === "en_cours") return el("span", { class: "tampon tampon--attente" }, "Analyse en cours…");
  if (preuve.etatAnalyse === "echec") return el("span", { class: "tampon tampon--attente" }, "Analyse impossible");
  if (!preuve.analyse) return el("span", { class: "tampon tampon--attente" }, "À qualifier");
  const verdict = VERDICTS[preuve.analyse?.verdict];
  return verdict ? el("span", { class: `tampon ${verdict.classe}` }, verdict.libelle) : null;
}

export function dateLocale(iso) {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "medium" });
}

export const nomFichier = (preuve, type) => `piece-${preuve.numero}-${type}.png`;

export function texteDossier(preuves) {
  return [
    `Dossier de signalement : ${preuves.length} contenu(s) illicite(s) en ligne`,
    `Constitué le ${dateLocale(new Date().toISOString())}`,
    "",
    ...preuves.map((p) => `${"=".repeat(60)}\n${texteSignalement(p)}\n`),
  ].join("\n");
}

export function texteSignalement(preuve) {
  const infractions = preuve.analyse?.infractions ?? [];
  return [
    `Pièce n°${preuve.numero}`,
    "",
    `Date de constatation : ${dateLocale(preuve.horodatage)} (UTC : ${preuve.horodatage})`,
    `Page : ${preuve.url}`,
    preuve.lienCommentaire ? `Lien direct du commentaire : ${preuve.lienCommentaire}` : null,
    `Auteur présumé : ${preuve.auteur || "non identifié"}`,
    "",
    ...(preuve.publication ? ["Publication commentée :", preuve.publication, ""] : []),
    "Contenu publié :",
    `« ${preuve.texte} »`,
    "",
    ...(infractions.length > 0
      ? [
          "Qualification envisagée :",
          ...infractions.map((i) => `- ${libelleInfraction(i)}`),
          ...(preuve.analyse.explication ? ["", preuve.analyse.explication] : []),
          "",
        ]
      : []),
    "Captures (zones identifiant l'auteur du signalement masquées en noir) :",
    `- ${nomFichier(preuve, "commentaire")} (SHA-256 : ${preuve.sha256})`,
    preuve.capturePublication ? `- ${nomFichier(preuve, "publication")} (SHA-256 : ${preuve.sha256Publication})` : null,
  ]
    .filter((ligne) => ligne !== null)
    .join("\n");
}
