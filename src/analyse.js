import Anthropic from "@anthropic-ai/sdk";
import { lireCleApi } from "./stockage.js";
import { chargerBitmap, blobVersBase64 } from "./images.js";

const SYSTEME = `Tu aides une personne à préparer des signalements de contenus haineux en ligne auprès des autorités (Pharos en France, Unia ou la police en Belgique). On te montre une capture d'écran, le texte d'un commentaire publié sur un réseau social et, quand elle est disponible, la publication qu'il commente.

Les contenus visés sont le néonazisme, le racisme, la xénophobie, l'antisémitisme, la haine anti-musulmans et plus largement la haine envers un groupe à raison de son origine, de sa religion, de son sexe, de son orientation sexuelle ou de son handicap.

Évalue si le contenu relève probablement d'une infraction en droit français ou belge, et laquelle. Repères :
- France : loi du 29 juillet 1881 — provocation à la discrimination, à la haine ou à la violence (art. 24), apologie de crimes contre l'humanité (art. 24), contestation de crimes contre l'humanité (art. 24 bis), diffamation publique à caractère raciste ou religieux (art. 32 : imputer un fait précis à un groupe), injure publique à caractère raciste ou religieux (art. 33 : terme outrageant ou méprisant visant un groupe, par exemple une comparaison animale ou une déshumanisation) ; port ou exhibition d'insignes nazis (art. R645-1 du Code pénal) ; menaces (art. 222-17 et suivants du Code pénal).
- Belgique : loi du 30 juillet 1981 (incitation à la haine, à la discrimination ou à la violence pour des critères raciaux) ; loi du 10 mai 2007 (mêmes faits pour la religion, l'orientation sexuelle, le handicap…) ; loi du 23 mars 1995 (négation, minimisation grossière, justification ou approbation du génocide nazi).

Distingue l'opinion choquante mais légale de l'infraction. Une critique de l'immigration, de la religion en tant que telle ou de l'action d'un État, un sarcasme ou un cliché isolé ne sont en général pas punissables. Le deviennent plutôt : l'insulte ou la déshumanisation d'un groupe, l'imputation de faits graves à tout un groupe, l'appel à exclure, discriminer ou violenter. Lis le commentaire à la lumière de la publication : un sous-entendu peut viser clairement un groupe.

Sois prudent et équitable : la personne visée n'est pas là pour se défendre. Tiens compte du second degré, des citations et surtout du contre-discours (quelqu'un qui cite un propos haineux pour le dénoncer). Repère aussi les codes (88, 14, 1488, (((…))), runes SS, emojis détournés). Si le contexte manque pour trancher, choisis « limite » et dis ce qu'il faudrait vérifier. Ta réponse est une aide, pas un avis juridique : la décision finale revient à l'utilisateur.

Rédige « explication » et « elements_a_verifier » en français, en deux à quatre phrases chacun. Si le contenu est probablement légal, laisse « infractions » vide.`;

const SCHEMA = {
  type: "object",
  properties: {
    verdict: { type: "string", enum: ["probablement_illegal", "limite", "probablement_legal"] },
    infractions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          pays: { type: "string", enum: ["FR", "BE"] },
          qualification: { type: "string" },
          texte: { type: "string" },
        },
        required: ["pays", "qualification", "texte"],
        additionalProperties: false,
      },
    },
    explication: { type: "string" },
    elements_a_verifier: { type: "string" },
  },
  required: ["verdict", "infractions", "explication", "elements_a_verifier"],
  additionalProperties: false,
};

// La capture d'origine reste intacte comme preuve ; le modèle reçoit une copie réduite (limite de 5 Mo par image).
async function imagePourAnalyse(dataUrl) {
  const bitmap = await chargerBitmap(dataUrl);
  const echelle = Math.min(1, 1600 / bitmap.width);
  const canvas = new OffscreenCanvas(Math.round(bitmap.width * echelle), Math.round(bitmap.height * echelle));
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return blobVersBase64(await canvas.convertToBlob({ type: "image/jpeg", quality: 0.85 }));
}

export async function analyser(preuve) {
  const apiKey = await lireCleApi();
  if (!apiKey) throw new Error("Aucune clé API. Ajoute-la dans les options de l'extension.");

  // La clé reste dans le stockage local de l'extension et ne part que vers api.anthropic.com.
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const image = async (dataUrl) => ({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: await imagePourAnalyse(dataUrl) } });
  const voisins = preuve.commentairesVoisins ?? [];

  const contenu = [
    ...(preuve.capturePublication ? [{ type: "text", text: "Capture de la publication :" }, await image(preuve.capturePublication)] : []),
    { type: "text", text: "Capture autour du commentaire :" },
    await image(preuve.capture),
    {
      type: "text",
      text: [
        `URL : ${preuve.url}`,
        `Auteur présumé : ${preuve.auteur || "inconnu"}`,
        "",
        "Publication commentée :",
        preuve.publication || "non disponible (voir la capture)",
        "",
        "Texte sélectionné :",
        preuve.texte,
        "",
        "Bloc du commentaire (contexte) :",
        preuve.contexteCommentaire || "non disponible",
        "",
        "Autres commentaires visibles sous la publication (contexte seulement, ne pas les qualifier) :",
        voisins.length > 0 ? voisins.map((v) => `- ${v.auteur || "?"} : ${v.texte.replace(/\s+/g, " ")}`).join("\n") : "aucun",
      ].join("\n"),
    },
  ];

  let reponse;
  try {
    reponse = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEME,
      messages: [{ role: "user", content: contenu }],
    });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw new Error("Clé API refusée. Vérifie-la dans les options.");
    if (e instanceof Anthropic.RateLimitError) throw new Error("Trop de requêtes. Relance l'analyse dans une minute.");
    if (e instanceof Anthropic.APIConnectionError) throw new Error("Impossible de joindre l'API Anthropic. Vérifie ta connexion.");
    if (e instanceof Anthropic.APIError) throw new Error(`Erreur API ${e.status} : ${e.message}`);
    throw e;
  }

  if (reponse.stop_reason === "refusal") throw new Error("Le modèle a refusé d'analyser ce contenu. Qualifie-le toi-même.");
  if (reponse.stop_reason === "max_tokens") throw new Error("Réponse tronquée. Relance l'analyse.");
  const bloc = reponse.content.find((b) => b.type === "text");
  if (!bloc) throw new Error("Réponse vide du modèle.");

  return { ...JSON.parse(bloc.text), modele: reponse.model, date: new Date().toISOString() };
}
