import { enregistrer, mettreAJour, prochainNumero, lireCleApi } from "./stockage.js";
import { analyser } from "./analyse.js";
import { anonymiser } from "./images.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "archiver", title: "Archiver comme preuve", contexts: ["selection"] });
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("dossier.html") });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "archiver" || !tab?.id) return;
  archiver(info, tab).catch((e) => afficherToast(tab.id, `Échec de l'archivage : ${e.message}`, true));
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "analyser") lancerAnalyse(message.id);
});

async function archiver(info, tab) {
  // Capture en premier : rien ne doit modifier la page avant la photo.
  const brute = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
  const horodatage = new Date().toISOString();
  const [{ result: contexte }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: extraireContexte,
  });
  // La page n'a pas bougé depuis la capture : les mesures correspondent à l'image.
  const capture = await anonymiser(brute, await mesurerPage(tab.id));
  const capturePublication = contexte?.publicationTrouvee ? await capturerPublication(tab) : null;

  const preuve = {
    id: crypto.randomUUID(),
    numero: await prochainNumero(),
    horodatage,
    url: tab.url,
    titrePage: tab.title,
    texte: contexte?.selection || info.selectionText || "",
    auteur: contexte?.auteur || "",
    contexteCommentaire: contexte?.bloc || "",
    lienCommentaire: contexte?.lien || "",
    publication: contexte?.publication || "",
    commentairesVoisins: contexte?.voisins || [],
    capture,
    sha256: await sha256(capture),
    capturePublication,
    sha256Publication: capturePublication ? await sha256(capturePublication) : "",
    navigateur: navigator.userAgent,
    statut: "a_examiner",
    analyse: null,
    etatAnalyse: "en_cours",
    erreurAnalyse: "",
  };

  await enregistrer(preuve);
  const avecAnalyse = Boolean(await lireCleApi());
  afficherToast(tab.id, `Pièce n°${preuve.numero} archivée. ${avecAnalyse ? "Analyse en cours…" : "Qualifie-la dans le dossier."}`);
  lancerAnalyse(preuve.id);
}

const executer = (tabId, func) => chrome.scripting.executeScript({ target: { tabId }, func });

async function mesurerPage(tabId) {
  const [{ result }] = await executer(tabId, mesurer);
  return result;
}

// Exécutée dans la page : zone à garder (la publication) et zones à noircir (identité de la personne connectée).
function mesurer() {
  const rect = (el, marge = 0, gauche = 0) => {
    const r = el.getBoundingClientRect();
    return { x: r.left - marge - gauche, y: r.top - marge, l: r.width + 2 * marge + gauche, h: r.height + 2 * marge };
  };

  let zone = { x: 0, y: 0, l: innerWidth, h: innerHeight };
  const publication = document.querySelector("[data-preuve-publication]");
  if (publication) {
    const r = publication.getBoundingClientRect();
    const x = Math.max(0, r.left);
    const y = Math.max(0, r.top);
    zone = { x, y, l: Math.min(innerWidth, r.right) - x, h: Math.min(innerHeight, r.bottom) - y };
  }

  const masques = [];
  // Champ « Écrire un commentaire » : il montre la photo et parfois le nom de la personne connectée.
  for (const champ of document.querySelectorAll('[contenteditable="true"][role="textbox"]')) {
    masques.push(rect(champ.closest("form") ?? champ.parentElement, 8, 56));
  }
  // Photo de profil de la personne connectée, repérée via le bouton de compte de Facebook.
  const source = (img) => img?.getAttribute("xlink:href") || img?.getAttribute("href") || img?.src || "";
  const chemin = (url) => {
    try {
      return new URL(url, location.href).pathname;
    } catch {
      return "";
    }
  };
  const compte = document.querySelector('[aria-label="Votre profil"], [aria-label="Your profile"], [aria-label="Compte"], [aria-label="Account"]');
  const avatar = chemin(source(compte?.querySelector("image, img")));
  if (avatar.length > 1) {
    for (const img of document.querySelectorAll("image, img")) {
      if (chemin(source(img)) === avatar) masques.push(rect(img.closest("svg") ?? img, 2));
    }
  }

  return { zone, masques, largeurVue: innerWidth };
}

// Deuxième capture : on fait défiler jusqu'au haut de la publication, puis on revient au commentaire.
async function capturerPublication(tab) {
  await executer(tab.id, () => {
    const publication = document.querySelector("[data-preuve-publication]");
    const commentaire = document.querySelector("[data-preuve-commentaire]");
    if (!publication || !commentaire) return;
    if (publication.getAttribute("role") === "dialog") {
      // Publication ouverte en fenêtre : c'est le conteneur interne qui défile, pas la page.
      for (let el = commentaire.parentElement; el && el !== publication; el = el.parentElement) {
        const defilement = getComputedStyle(el).overflowY;
        if ((defilement === "auto" || defilement === "scroll") && el.scrollHeight > el.clientHeight) {
          el.scrollTop = 0;
          break;
        }
      }
    } else {
      publication.scrollIntoView({ block: "start" });
      window.scrollBy(0, -70); // dégage le bandeau fixe de Facebook
    }
  });
  // Chrome limite captureVisibleTab à deux appels par seconde ; ce délai laisse aussi la page se redessiner.
  await new Promise((resoudre) => setTimeout(resoudre, 700));
  try {
    const brute = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
    return await anonymiser(brute, await mesurerPage(tab.id));
  } finally {
    await executer(tab.id, () => {
      document.querySelector("[data-preuve-commentaire]")?.scrollIntoView({ block: "center" });
      for (const el of document.querySelectorAll("[data-preuve-publication], [data-preuve-commentaire]")) {
        el.removeAttribute("data-preuve-publication");
        el.removeAttribute("data-preuve-commentaire");
      }
    });
  }
}

async function lancerAnalyse(id) {
  // Sans clé API, l'extension marche quand même : la personne qualifie la pièce elle-même.
  if (!(await lireCleApi())) {
    await mettreAJour(id, { etatAnalyse: "manuelle", erreurAnalyse: "" });
    return;
  }
  const preuve = await mettreAJour(id, { etatAnalyse: "en_cours", erreurAnalyse: "" });
  if (!preuve) return;
  try {
    const analyse = await analyser(preuve);
    await mettreAJour(id, { analyse, etatAnalyse: "terminee" });
  } catch (e) {
    await mettreAJour(id, { etatAnalyse: "echec", erreurAnalyse: e.message });
  }
}

// Empreinte du fichier PNG lui-même : elle correspond au fichier téléchargé depuis le dossier.
async function sha256(dataUrl) {
  const octets = Uint8Array.from(atob(dataUrl.split(",")[1]), (c) => c.charCodeAt(0));
  const empreinte = await crypto.subtle.digest("SHA-256", octets);
  return [...new Uint8Array(empreinte)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Exécutée dans la page : doit rester autonome, sans référence au reste du module.
function extraireContexte() {
  const selection = window.getSelection();
  const texte = selection?.toString().trim() || "";
  let noeud = selection?.anchorNode ?? null;
  if (noeud && noeud.nodeType !== Node.ELEMENT_NODE) noeud = noeud.parentElement;

  // Facebook entoure chaque commentaire d'un role="article" dont l'aria-label nomme l'auteur.
  const article = noeud?.closest?.('[role="article"]') ?? null;
  if (!article) return { selection: texte, auteur: "", bloc: "", lien: "", publication: "", voisins: [], publicationTrouvee: false };

  const nomAuteur = (el) =>
    (el.getAttribute("aria-label") || "")
      .replace(/^(Commentaire|Réponse|Comment|Reply)\s+(de|by|from)\s+/i, "")
      .replace(/\s+(il y a|·|\d+\s*(h|min|j|sem|an)).*$/i, "")
      .trim();
  const lien = [...article.querySelectorAll("a[href]")].find((a) => /comment_id=/.test(a.href));

  // La publication commentée donne le sens du commentaire (« les chèvres… » sous une photo de femmes voilées).
  // Selon la vue Facebook, c'est l'article parent (fil d'actualité) ou la fenêtre de la publication.
  const parent = article.parentElement?.closest('[role="article"], [role="dialog"]');
  const commentaires = parent ? [...parent.querySelectorAll('[role="article"]')] : [];
  // Le texte des commentaires et du champ de saisie (« Commenter en tant que… », qui nomme la personne
  // connectée) est retiré pour ne garder que celui de la publication.
  const saisies = parent
    ? [...parent.querySelectorAll('[contenteditable="true"][role="textbox"]')].map((c) => c.closest("form") ?? c.parentElement)
    : [];
  const publication = parent
    ? [...commentaires, ...saisies].reduce((t, c) => t.replace(c.innerText, ""), parent.innerText).trim().slice(0, 1500)
    : "";
  const voisins = commentaires
    .filter((c) => c !== article && !c.contains(article))
    .slice(0, 30)
    .map((c) => ({ auteur: nomAuteur(c), texte: c.innerText.slice(0, 400) }));

  // Repères pour la seconde capture ; capturerPublication les retire ensuite.
  if (parent) {
    article.setAttribute("data-preuve-commentaire", "");
    parent.setAttribute("data-preuve-publication", "");
  }

  return {
    selection: texte,
    auteur: nomAuteur(article) || article.getAttribute("aria-label") || "",
    bloc: article.innerText.slice(0, 3000),
    lien: lien?.href || "",
    publication,
    voisins,
    publicationTrouvee: Boolean(parent),
  };
}

function afficherToast(tabId, message, erreur = false) {
  chrome.scripting
    .executeScript({
      target: { tabId },
      args: [message, erreur],
      func: (message, erreur) => {
        const toast = document.createElement("div");
        toast.textContent = message;
        Object.assign(toast.style, {
          position: "fixed",
          right: "16px",
          bottom: "16px",
          zIndex: "2147483647",
          padding: "10px 14px",
          borderRadius: "6px",
          font: "14px system-ui, sans-serif",
          color: "#fff",
          background: erreur ? "#a52a24" : "#1b2a3a",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25)",
        });
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
      },
    })
    .catch(() => {});
}
