import { lister, mettreAJour, supprimer, lireCleApi } from "./stockage.js";
import { el, tampon, STATUTS, VERDICTS, dateLocale, libelleInfraction } from "./ui.js";

const conteneur = document.getElementById("pieces");
const onglets = document.getElementById("onglets");
const visionneuse = document.getElementById("visionneuse");
const imageVisionneuse = document.getElementById("visionneuse-image");

let filtre = "a_examiner";

const MESSAGES_VIDES = {
  a_examiner: ["Aucune pièce à examiner", "Sur Facebook, sélectionne le texte d'un commentaire, fais un clic droit, puis choisis « Archiver comme preuve »."],
  valide: ["Aucune pièce validée", "Valide une pièce de l'onglet « À examiner » pour préparer son signalement."],
  rejete: ["Aucune pièce rejetée", "Les pièces que tu écartes apparaîtront ici."],
  envoye: ["Aucune pièce envoyée", "Les pièces d'un dossier clos apparaîtront ici."],
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
          },
        },
        `${libelle} (${nombre})`,
      );
    }),
  );

  const visibles = preuves.filter((p) => p.statut === filtre);
  if (visibles.length === 0) {
    const [titre, texte] = MESSAGES_VIDES[filtre];
    conteneur.replaceChildren(el("div", { class: "vide" }, el("strong", {}, titre), texte));
    return;
  }
  const enTete =
    filtre === "valide" &&
    el(
      "div",
      { class: "envoi" },
      el("p", {}, `Les ${visibles.length} pièce(s) validée(s) partiront ensemble, dans un seul mail. Remets à examiner celles à garder pour plus tard.`),
      el(
        "div",
        { class: "actions", style: "margin: 0" },
        el("a", { class: "bouton bouton--plein", href: "rapport.html", target: "_blank" }, `Préparer le dossier (${visibles.length})`),
        el(
          "button",
          {
            class: "bouton",
            type: "button",
            onclick: async () => {
              if (!confirm(`Le mail est parti ? Les ${visibles.length} pièce(s) seront rangées dans « Envoyée ».`)) return;
              const dateEnvoi = new Date().toISOString();
              for (const p of visibles) await mettreAJour(p.id, { statut: "envoye", dateEnvoi });
            },
          },
          "Clore le dossier",
        ),
      ),
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
      preuve.capturePublication && vignette(preuve.capturePublication, "Publication", preuve.numero),
    ),
    el(
      "div",
      {},
      el(
        "div",
        { class: "entete" },
        el("h2", {}, `Pièce n°${preuve.numero}`),
        tampon(preuve),
      ),
      el("blockquote", {}, preuve.texte || "(texte non capturé)"),
      el(
        "dl",
        { class: "meta" },
        el("dt", {}, "Auteur présumé"),
        el("dd", {}, preuve.auteur || "Non identifié"),
        el("dt", {}, "Publié sur"),
        el("dd", {}, el("a", { href: preuve.lienCommentaire || preuve.url, target: "_blank", rel: "noreferrer" }, preuve.titrePage || preuve.url)),
        el("dt", {}, "Archivé le"),
        el("dd", {}, dateLocale(preuve.horodatage)),
        el("dt", {}, "SHA-256"),
        el("dd", {}, el("code", {}, preuve.sha256)),
      ),
      blocAnalyse(preuve),
      actions(preuve),
    ),
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
        "aria-label": `Agrandir la capture « ${legende} » de la pièce n°${numero}`,
        onclick: () => {
          imageVisionneuse.src = capture;
          visionneuse.showModal();
        },
      },
      el("img", { src: capture, alt: "" }),
    ),
    el("figcaption", {}, legende),
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
    analyse.elements_a_verifier && el("p", {}, el("strong", {}, "À vérifier : "), analyse.elements_a_verifier),
    el(
      "p",
      { class: "source" },
      analyse.modele === "manuel" ? `Qualification rédigée à la main, ${dateLocale(analyse.date)}` : `Analyse ${analyse.modele}, ${dateLocale(analyse.date)}`,
    ),
    formulaireQualification(preuve),
  );
}

// Qualification à la main : remplace l'analyse Claude, ou la corrige.
function formulaireQualification(preuve, ouvert = false) {
  const analyse = preuve.analyse;
  const verdict = el(
    "select",
    { name: "verdict" },
    Object.entries(VERDICTS).map(([valeur, { libelle }]) =>
      el("option", { value: valeur, selected: (analyse?.verdict ?? "probablement_illegal") === valeur }, libelle),
    ),
  );
  const infractions = el(
    "textarea",
    { name: "infractions", rows: "3", placeholder: "Ex. : Injure publique à caractère racial (loi du 29 juillet 1881, art. 33)" },
    (analyse?.infractions ?? []).map(libelleInfraction).join("\n"),
  );
  const explication = el(
    "textarea",
    { name: "explication", rows: "4", placeholder: "Pourquoi ce contenu te semble illégal : qui est visé, quels mots posent problème…" },
    analyse?.explication ?? "",
  );
  return el(
    "details",
    { class: "qualification", open: ouvert },
    el("summary", {}, analyse ? "Modifier la qualification" : "Qualifier moi-même"),
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
              infractions: infractions.value
                .split("\n")
                .map((l) => l.trim())
                .filter(Boolean)
                .map((qualification) => ({ pays: "", qualification, texte: "" })),
              explication: explication.value.trim(),
              elements_a_verifier: "",
              modele: "manuel",
              date: new Date().toISOString(),
            },
          });
          // Le focus est encore dans le formulaire : on force l'affichage de la qualification enregistrée.
          rafraichissementEnAttente = false;
          document.activeElement?.blur();
          afficher();
        },
      },
      el("label", {}, "Verdict", verdict),
      el("label", {}, "Infraction(s) envisagée(s), une par ligne", infractions),
      el("label", {}, "Explication", explication),
      el("button", { class: "bouton bouton--plein", type: "submit" }, "Enregistrer la qualification"),
    ),
  );
}

function actions(preuve) {
  const changerStatut = (statut) => () => mettreAJour(preuve.id, { statut });
  return el(
    "div",
    { class: "actions" },
    preuve.statut !== "valide" && el("button", { class: "bouton bouton--plein", type: "button", onclick: changerStatut("valide") }, "Ajouter au dossier"),
    preuve.statut !== "rejete" && el("button", { class: "bouton", type: "button", onclick: changerStatut("rejete") }, "Rejeter"),
    preuve.statut !== "a_examiner" && el("button", { class: "bouton", type: "button", onclick: changerStatut("a_examiner") }, "Remettre à examiner"),
    avecCle &&
      el(
        "button",
        {
          class: "bouton",
          type: "button",
          disabled: preuve.etatAnalyse === "en_cours",
          onclick: () => chrome.runtime.sendMessage({ type: "analyser", id: preuve.id }),
        },
        preuve.analyse ? "Relancer l'analyse" : "Lancer l'analyse",
      ),
    el(
      "button",
      {
        class: "bouton bouton--danger",
        type: "button",
        onclick: () => {
          if (confirm(`Supprimer définitivement la pièce n°${preuve.numero} ? Cette action est irréversible.`)) supprimer(preuve.id);
        },
      },
      "Supprimer",
    ),
  );
}

document.getElementById("exporter").addEventListener("click", async () => {
  const preuves = await lister();
  const blob = new Blob([JSON.stringify(preuves, null, 2)], { type: "application/json" });
  const lien = el("a", { href: URL.createObjectURL(blob), download: `preuves-${new Date().toISOString().slice(0, 10)}.json` });
  lien.click();
  setTimeout(() => URL.revokeObjectURL(lien.href), 1000);
});

// Rafraîchit la page dès qu'une pièce est archivée ou qu'une analyse se termine,
// sauf pendant la saisie d'une qualification : le rafraîchissement effacerait le texte en cours.
let avecCle = Boolean(await lireCleApi());
let rafraichissementEnAttente = false;
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
