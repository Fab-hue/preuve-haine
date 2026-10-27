import { zipSync, strToU8 } from "fflate";
import { lister, mettreAJour, lireAssociations } from "./stockage.js";
import { el, tampon, dateLocale, texteDossier, nomFichier, libelleInfraction, VERDICTS } from "./ui.js";

const etapes = document.getElementById("etapes");
const outils = document.getElementById("outils");
const rapport = document.getElementById("rapport");

// Le dossier est figé à l'ouverture de la page : une pièce validée ensuite ira dans le dossier suivant.
const preuves = (await lister()).filter((p) => p.statut === "valide").sort((a, b) => a.numero - b.numero);
const aujourdhui = new Date().toISOString().slice(0, 10);
const nomZip = `dossier-signalement-${aujourdhui}.zip`;

const extrait = (texte, max = 100) => (texte.length > max ? `${texte.slice(0, max).trim()}…` : texte);

function telechargerZip() {
  const fichiers = { "dossier.txt": strToU8(texteDossier(preuves)) };
  const octets = (dataUrl) => Uint8Array.from(atob(dataUrl.split(",")[1]), (c) => c.charCodeAt(0));
  for (const p of preuves) {
    fichiers[nomFichier(p, "commentaire")] = octets(p.capture);
    if (p.capturePublication) fichiers[nomFichier(p, "publication")] = octets(p.capturePublication);
  }
  const lien = el("a", { href: URL.createObjectURL(new Blob([zipSync(fichiers)], { type: "application/zip" })), download: nomZip });
  lien.click();
  setTimeout(() => URL.revokeObjectURL(lien.href), 1000);
}

// Le mail s'ouvre en brouillon : rien ne part tant que l'utilisateur n'a pas cliqué sur « Envoyer ».
function liensMail(associations) {
  const sujet = `Signalement de ${preuves.length} contenu(s) haineux en ligne`;
  const resume = preuves.slice(0, 15).flatMap((p) => [
    `- Pièce n°${p.numero} : ${p.auteur || "auteur non identifié"}, « ${extrait(p.texte)} » (${VERDICTS[p.analyse?.verdict]?.libelle ?? "non analysée"})`,
    `  ${p.lienCommentaire || p.url}`,
  ]);
  if (preuves.length > 15) resume.push(`- … et ${preuves.length - 15} autre(s), détaillée(s) dans le dossier joint.`);
  const corps = [
    "Bonjour,",
    "",
    `Je vous transmets un dossier de ${preuves.length} contenu(s) publié(s) en ligne qui me semblent relever de la haine raciale ou religieuse, ou de l'apologie de crimes contre l'humanité. Le dossier complet (captures d'écran, empreintes SHA-256, liens et qualification envisagée) est joint au format ZIP (${nomZip}).`,
    "",
    "Résumé :",
    ...resume,
    "",
    "Je reste à votre disposition pour tout complément.",
    "",
    "Cordialement,",
  ].join("\n");
  const bcc = associations.join(",");
  const gmail = new URL("https://mail.google.com/mail/");
  gmail.search = new URLSearchParams({ view: "cm", fs: "1", bcc, su: sujet, body: corps }).toString();
  const mailto = `mailto:?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
  return { gmail: gmail.href, mailto };
}

function etape(titre, texte, ...actions) {
  return el("li", {}, el("strong", {}, titre), el("p", {}, texte), el("div", { class: "actions" }, ...actions));
}

function section(preuve) {
  const analyse = preuve.analyse;
  return el(
    "section",
    { class: "piece-rapport" },
    el("div", { class: "entete" }, el("h2", {}, `Pièce n°${preuve.numero}`), tampon(preuve)),
    el(
      "dl",
      { class: "meta" },
      el("dt", {}, "Date"),
      el("dd", {}, `${dateLocale(preuve.horodatage)} (UTC : ${preuve.horodatage})`),
      el("dt", {}, "Page"),
      el("dd", {}, preuve.url),
      preuve.lienCommentaire && el("dt", {}, "Commentaire"),
      preuve.lienCommentaire && el("dd", {}, preuve.lienCommentaire),
      el("dt", {}, "Auteur présumé"),
      el("dd", {}, preuve.auteur || "Non identifié"),
    ),
    preuve.publication && el("h3", {}, "Publication commentée"),
    preuve.publication && el("p", { class: "publication" }, preuve.publication),
    el("h3", {}, "Contenu signalé"),
    el("blockquote", {}, preuve.texte),
    analyse && el("h3", {}, "Qualification envisagée"),
    analyse &&
      (analyse.infractions.length > 0
        ? el("ul", {}, analyse.infractions.map((i) => el("li", {}, libelleInfraction(i))))
        : el("p", {}, "Aucune infraction précisée.")),
    analyse && el("p", {}, analyse.explication),
    preuve.capturePublication && el("h3", {}, "Capture de la publication"),
    preuve.capturePublication && el("img", { src: preuve.capturePublication, alt: `Publication commentée, pièce n°${preuve.numero}` }),
    preuve.capturePublication && el("p", { class: "source" }, `${nomFichier(preuve, "publication")}, SHA-256 : ${preuve.sha256Publication}`),
    el("h3", {}, "Capture du commentaire"),
    el("img", { src: preuve.capture, alt: `Commentaire signalé, pièce n°${preuve.numero}` }),
    el("p", { class: "source" }, `${nomFichier(preuve, "commentaire")}, SHA-256 : ${preuve.sha256}`),
    (preuve.commentairesVoisins ?? []).length > 0 && el("h3", {}, "Autres commentaires visibles au moment de la capture"),
    (preuve.commentairesVoisins ?? []).length > 0 &&
      el("ul", {}, preuve.commentairesVoisins.map((v) => el("li", {}, `${v.auteur || "Auteur inconnu"} : ${v.texte.replace(/\s+/g, " ")}`))),
  );
}

if (preuves.length === 0) {
  rapport.replaceChildren(el("p", {}, "Aucune pièce validée. Ajoute des pièces au dossier depuis l'onglet « À examiner »."));
} else {
  document.title = `Dossier de signalement (${preuves.length})`;
  const associations = await lireAssociations();
  const mail = liensMail(associations);
  const confirmation = el("p", { class: "confirmation", role: "status" });

  const boutonsClore = [];
  const boutonClore = (classe) => {
    const bouton = el("button", { class: `bouton ${classe}`, type: "button", onclick: clore }, "Clore le dossier");
    boutonsClore.push(bouton);
    return bouton;
  };
  async function clore() {
    const dateEnvoi = new Date().toISOString();
    for (const p of preuves) await mettreAJour(p.id, { statut: "envoye", dateEnvoi });
    for (const b of boutonsClore) b.disabled = true;
    const message = `Dossier clos : ${preuves.length} pièce(s) rangée(s) dans « Envoyée ».`;
    confirmation.textContent = message;
    bandeau.replaceChildren(el("p", {}, message), el("a", { class: "bouton", href: "dossier.html" }, "Retour au dossier de preuves"));
  }

  // Dès que le brouillon est ouvert, le bouton de clôture reste à portée de main.
  const bandeau = el(
    "div",
    { class: "bandeau", hidden: true, role: "region", "aria-label": "Clôture du dossier" },
    el("p", {}, "Mail envoyé ? Clos le dossier pour repartir d'un dossier vide."),
    boutonClore("bouton--plein"),
  );
  document.body.append(bandeau);
  const afficherBandeau = () => bandeau.removeAttribute("hidden");

  etapes.replaceChildren(
    etape("Télécharger le dossier", `Un seul fichier ZIP : le récapitulatif texte et les ${preuves.length * 2} captures au plus.`, el("button", { class: "bouton bouton--plein", type: "button", onclick: telechargerZip }, "Télécharger le ZIP")),
    etape(
      "Envoyer un seul mail",
      associations.length > 0
        ? `Le brouillon s'ouvre avec ${associations.length} association(s) en copie cachée. Joins le ZIP, relis, puis clique sur « Envoyer ».`
        : "Aucune association enregistrée : ajoute leurs adresses dans les options.",
      associations.length > 0
        ? [
            el("a", { class: "bouton bouton--plein", href: mail.gmail, target: "_blank", rel: "noreferrer", title: `CCI : ${associations.join(", ")}`, onclick: afficherBandeau }, "Ouvrir le brouillon Gmail"),
            el("a", { class: "bouton", href: mail.mailto, onclick: afficherBandeau }, "Autre messagerie"),
          ]
        : el("a", { class: "bouton", href: "options.html" }, "Ouvrir les options"),
    ),
    etape(
      "Clore le dossier",
      "Une fois le mail parti, range ces pièces dans « Envoyée » pour repartir d'un dossier vide.",
      boutonClore(""),
      confirmation,
    ),
  );

  const boutonCopier = el(
    "button",
    {
      class: "bouton",
      type: "button",
      onclick: async () => {
        await navigator.clipboard.writeText(texteDossier(preuves));
        boutonCopier.textContent = "Texte copié";
      },
    },
    "Copier le texte du dossier",
  );
  outils.replaceChildren(
    boutonCopier,
    el("a", { class: "bouton", href: "https://www.internet-signalement.gouv.fr", target: "_blank", rel: "noreferrer" }, "Signaler sur Pharos (France)"),
    el("a", { class: "bouton", href: "https://www.unia.be", target: "_blank", rel: "noreferrer" }, "Signaler à Unia (Belgique)"),
    el("button", { class: "bouton", type: "button", onclick: () => print() }, "Imprimer ou enregistrer en PDF"),
  );

  rapport.replaceChildren(
    el("h1", {}, "Dossier de signalement"),
    el("p", { class: "intro" }, `${preuves.length} contenu(s), constitué le ${dateLocale(new Date().toISOString())}. Les zones qui identifient l'auteur du signalement sont masquées en noir sur les captures.`),
    ...preuves.map(section),
  );
}
