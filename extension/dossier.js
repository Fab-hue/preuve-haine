// src/stockage.js
var cle = (id) => `preuve:${id}`;
async function enregistrer(preuve) {
  await chrome.storage.local.set({ [cle(preuve.id)]: preuve });
}
async function lire(id) {
  const resultat = await chrome.storage.local.get(cle(id));
  return resultat[cle(id)] ?? null;
}
async function mettreAJour(id, champs) {
  const preuve = await lire(id);
  if (!preuve) return null;
  const nouvelle = { ...preuve, ...champs };
  await enregistrer(nouvelle);
  return nouvelle;
}
async function lister() {
  const tout = await chrome.storage.local.get(null);
  return Object.entries(tout).filter(([k]) => k.startsWith("preuve:")).map(([, v]) => v).sort((a, b) => b.numero - a.numero);
}
async function supprimer(id) {
  await chrome.storage.local.remove(cle(id));
}
async function lireCleApi() {
  const { cleApi = "" } = await chrome.storage.local.get("cleApi");
  return cleApi;
}

// src/ui.js
function el(tag, attributs = {}, ...enfants) {
  const noeud = document.createElement(tag);
  for (const [nom, valeur] of Object.entries(attributs)) {
    if (valeur === void 0 || valeur === null || valeur === false) continue;
    if (nom.startsWith("on")) noeud.addEventListener(nom.slice(2), valeur);
    else if (nom === "class") noeud.className = valeur;
    else noeud.setAttribute(nom, valeur === true ? "" : valeur);
  }
  for (const enfant of enfants.flat()) {
    if (enfant === null || enfant === void 0 || enfant === false) continue;
    noeud.append(enfant instanceof Node ? enfant : String(enfant));
  }
  return noeud;
}
var VERDICTS = {
  probablement_illegal: { libelle: "Probablement ill\xE9gal", classe: "tampon--illegal" },
  limite: { libelle: "Limite", classe: "tampon--limite" },
  probablement_legal: { libelle: "Probablement l\xE9gal", classe: "tampon--legal" }
};
var STATUTS = {
  a_examiner: "\xC0 examiner",
  valide: "Valid\xE9e",
  rejete: "Rejet\xE9e",
  envoye: "Envoy\xE9e"
};
function libelleInfraction(i) {
  const pays = { FR: "France", BE: "Belgique" }[i.pays];
  return `${pays ? `${pays} : ` : ""}${i.qualification}${i.texte ? ` (${i.texte})` : ""}`;
}
function tampon(preuve) {
  if (preuve.etatAnalyse === "en_cours") return el("span", { class: "tampon tampon--attente" }, "Analyse en cours\u2026");
  if (preuve.etatAnalyse === "echec") return el("span", { class: "tampon tampon--attente" }, "Analyse impossible");
  if (!preuve.analyse) return el("span", { class: "tampon tampon--attente" }, "\xC0 qualifier");
  const verdict = VERDICTS[preuve.analyse?.verdict];
  return verdict ? el("span", { class: `tampon ${verdict.classe}` }, verdict.libelle) : null;
}
function dateLocale(iso) {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "medium" });
}

// src/dossier.js
var conteneur = document.getElementById("pieces");
var onglets = document.getElementById("onglets");
var visionneuse = document.getElementById("visionneuse");
var imageVisionneuse = document.getElementById("visionneuse-image");
var filtre = "a_examiner";
var MESSAGES_VIDES = {
  a_examiner: ["Aucune pi\xE8ce \xE0 examiner", "Sur Facebook, s\xE9lectionne le texte d'un commentaire, fais un clic droit, puis choisis \xAB Archiver comme preuve \xBB."],
  valide: ["Aucune pi\xE8ce valid\xE9e", "Valide une pi\xE8ce de l'onglet \xAB \xC0 examiner \xBB pour pr\xE9parer son signalement."],
  rejete: ["Aucune pi\xE8ce rejet\xE9e", "Les pi\xE8ces que tu \xE9cartes appara\xEEtront ici."],
  envoye: ["Aucune pi\xE8ce envoy\xE9e", "Les pi\xE8ces d'un dossier clos appara\xEEtront ici."]
};
async function afficher() {
  const preuves = await lister();
  onglets.replaceChildren(
    ...Object.entries(STATUTS).map(([statut, libelle]) => {
      const nombre = preuves.filter((p) => p.statut === statut).length;
      return el(
        "button",
        {
          class: "onglet",
          role: "tab",
          type: "button",
          "aria-selected": String(statut === filtre),
          onclick: () => {
            filtre = statut;
            afficher();
          }
        },
        `${libelle} (${nombre})`
      );
    })
  );
  const visibles = preuves.filter((p) => p.statut === filtre);
  if (visibles.length === 0) {
    const [titre, texte] = MESSAGES_VIDES[filtre];
    conteneur.replaceChildren(el("div", { class: "vide" }, el("strong", {}, titre), texte));
    return;
  }
  const enTete = filtre === "valide" && el(
    "div",
    { class: "envoi" },
    el("p", {}, `Les ${visibles.length} pi\xE8ce(s) valid\xE9e(s) partiront ensemble, dans un seul mail. Remets \xE0 examiner celles \xE0 garder pour plus tard.`),
    el(
      "div",
      { class: "actions", style: "margin: 0" },
      el("a", { class: "bouton bouton--plein", href: "rapport.html", target: "_blank" }, `Pr\xE9parer le dossier (${visibles.length})`),
      el(
        "button",
        {
          class: "bouton",
          type: "button",
          onclick: async () => {
            if (!confirm(`Le mail est parti ? Les ${visibles.length} pi\xE8ce(s) seront rang\xE9es dans \xAB Envoy\xE9e \xBB.`)) return;
            const dateEnvoi = (/* @__PURE__ */ new Date()).toISOString();
            for (const p of visibles) await mettreAJour(p.id, { statut: "envoye", dateEnvoi });
          }
        },
        "Clore le dossier"
      )
    )
  );
  conteneur.replaceChildren(...[enTete, ...visibles.map(carte)].filter(Boolean));
}
function carte(preuve) {
  return el(
    "article",
    { class: "piece" },
    el(
      "div",
      { class: "vignettes" },
      vignette(preuve.capture, "Commentaire", preuve.numero),
      preuve.capturePublication && vignette(preuve.capturePublication, "Publication", preuve.numero)
    ),
    el(
      "div",
      {},
      el(
        "div",
        { class: "entete" },
        el("h2", {}, `Pi\xE8ce n\xB0${preuve.numero}`),
        tampon(preuve)
      ),
      el("blockquote", {}, preuve.texte || "(texte non captur\xE9)"),
      el(
        "dl",
        { class: "meta" },
        el("dt", {}, "Auteur pr\xE9sum\xE9"),
        el("dd", {}, preuve.auteur || "Non identifi\xE9"),
        el("dt", {}, "Publi\xE9 sur"),
        el("dd", {}, el("a", { href: preuve.lienCommentaire || preuve.url, target: "_blank", rel: "noreferrer" }, preuve.titrePage || preuve.url)),
        el("dt", {}, "Archiv\xE9 le"),
        el("dd", {}, dateLocale(preuve.horodatage)),
        el("dt", {}, "SHA-256"),
        el("dd", {}, el("code", {}, preuve.sha256))
      ),
      blocAnalyse(preuve),
      actions(preuve)
    )
  );
}
function vignette(capture, legende, numero) {
  return el(
    "figure",
    {},
    el(
      "button",
      {
        class: "vignette",
        type: "button",
        "aria-label": `Agrandir la capture \xAB ${legende} \xBB de la pi\xE8ce n\xB0${numero}`,
        onclick: () => {
          imageVisionneuse.src = capture;
          visionneuse.showModal();
        }
      },
      el("img", { src: capture, alt: "" })
    ),
    el("figcaption", {}, legende)
  );
}
function blocAnalyse(preuve) {
  if (preuve.etatAnalyse === "echec") {
    return el("div", { class: "analyse" }, el("p", { class: "erreur" }, preuve.erreurAnalyse), formulaireQualification(preuve));
  }
  if (preuve.etatAnalyse === "en_cours") return null;
  const analyse = preuve.analyse;
  if (!analyse) return el("div", { class: "analyse" }, formulaireQualification(preuve, true));
  return el(
    "div",
    { class: "analyse" },
    el("p", {}, analyse.explication),
    analyse.infractions.length > 0 && el("ul", {}, analyse.infractions.map((i) => el("li", {}, libelleInfraction(i)))),
    analyse.elements_a_verifier && el("p", {}, el("strong", {}, "\xC0 v\xE9rifier : "), analyse.elements_a_verifier),
    el(
      "p",
      { class: "source" },
      analyse.modele === "manuel" ? `Qualification r\xE9dig\xE9e \xE0 la main, ${dateLocale(analyse.date)}` : `Analyse ${analyse.modele}, ${dateLocale(analyse.date)}`
    ),
    formulaireQualification(preuve)
  );
}
function formulaireQualification(preuve, ouvert = false) {
  const analyse = preuve.analyse;
  const verdict = el(
    "select",
    { name: "verdict" },
    Object.entries(VERDICTS).map(
      ([valeur, { libelle }]) => el("option", { value: valeur, selected: (analyse?.verdict ?? "probablement_illegal") === valeur }, libelle)
    )
  );
  const infractions = el(
    "textarea",
    { name: "infractions", rows: "3", placeholder: "Ex. : Injure publique \xE0 caract\xE8re racial (loi du 29 juillet 1881, art. 33)" },
    (analyse?.infractions ?? []).map(libelleInfraction).join("\n")
  );
  const explication = el(
    "textarea",
    { name: "explication", rows: "4", placeholder: "Pourquoi ce contenu te semble ill\xE9gal : qui est vis\xE9, quels mots posent probl\xE8me\u2026" },
    analyse?.explication ?? ""
  );
  return el(
    "details",
    { class: "qualification", open: ouvert },
    el("summary", {}, analyse ? "Modifier la qualification" : "Qualifier moi-m\xEAme"),
    el(
      "form",
      {
        onsubmit: async (e) => {
          e.preventDefault();
          await mettreAJour(preuve.id, {
            etatAnalyse: "terminee",
            erreurAnalyse: "",
            analyse: {
              verdict: verdict.value,
              infractions: infractions.value.split("\n").map((l) => l.trim()).filter(Boolean).map((qualification) => ({ pays: "", qualification, texte: "" })),
              explication: explication.value.trim(),
              elements_a_verifier: "",
              modele: "manuel",
              date: (/* @__PURE__ */ new Date()).toISOString()
            }
          });
          rafraichissementEnAttente = false;
          document.activeElement?.blur();
          afficher();
        }
      },
      el("label", {}, "Verdict", verdict),
      el("label", {}, "Infraction(s) envisag\xE9e(s), une par ligne", infractions),
      el("label", {}, "Explication", explication),
      el("button", { class: "bouton bouton--plein", type: "submit" }, "Enregistrer la qualification")
    )
  );
}
function actions(preuve) {
  const changerStatut = (statut) => () => mettreAJour(preuve.id, { statut });
  return el(
    "div",
    { class: "actions" },
    preuve.statut !== "valide" && el("button", { class: "bouton bouton--plein", type: "button", onclick: changerStatut("valide") }, "Ajouter au dossier"),
    preuve.statut !== "rejete" && el("button", { class: "bouton", type: "button", onclick: changerStatut("rejete") }, "Rejeter"),
    preuve.statut !== "a_examiner" && el("button", { class: "bouton", type: "button", onclick: changerStatut("a_examiner") }, "Remettre \xE0 examiner"),
    avecCle && el(
      "button",
      {
        class: "bouton",
        type: "button",
        disabled: preuve.etatAnalyse === "en_cours",
        onclick: () => chrome.runtime.sendMessage({ type: "analyser", id: preuve.id })
      },
      preuve.analyse ? "Relancer l'analyse" : "Lancer l'analyse"
    ),
    el(
      "button",
      {
        class: "bouton bouton--danger",
        type: "button",
        onclick: () => {
          if (confirm(`Supprimer d\xE9finitivement la pi\xE8ce n\xB0${preuve.numero} ? Cette action est irr\xE9versible.`)) supprimer(preuve.id);
        }
      },
      "Supprimer"
    )
  );
}
document.getElementById("exporter").addEventListener("click", async () => {
  const preuves = await lister();
  const blob = new Blob([JSON.stringify(preuves, null, 2)], { type: "application/json" });
  const lien = el("a", { href: URL.createObjectURL(blob), download: `preuves-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json` });
  lien.click();
  setTimeout(() => URL.revokeObjectURL(lien.href), 1e3);
});
var avecCle = Boolean(await lireCleApi());
var rafraichissementEnAttente = false;
chrome.storage.onChanged.addListener(async (changements) => {
  if ("cleApi" in changements) avecCle = Boolean(await lireCleApi());
  if (document.activeElement?.closest(".qualification")) rafraichissementEnAttente = true;
  else afficher();
});
conteneur.addEventListener("focusout", (e) => {
  if (rafraichissementEnAttente && !e.relatedTarget?.closest(".qualification")) {
    rafraichissementEnAttente = false;
    afficher();
  }
});
afficher();
