export async function chargerBitmap(dataUrl) {
  return createImageBitmap(await (await fetch(dataUrl)).blob());
}

export async function blobVersBase64(blob) {
  const octets = new Uint8Array(await blob.arrayBuffer());
  let binaire = "";
  for (const octet of octets) binaire += String.fromCharCode(octet);
  return btoa(binaire);
}

// Recadre la capture sur la publication et noircit les zones qui identifient la personne connectée.
// La capture brute n'est jamais conservée : seule la version anonymisée est stockée et hachée.
export async function anonymiser(dataUrl, { zone, masques, largeurVue }) {
  const bitmap = await chargerBitmap(dataUrl);
  const k = bitmap.width / largeurVue;
  const cadre = zone.l > 0 && zone.h > 0 ? zone : { x: 0, y: 0, l: largeurVue, h: bitmap.height / k };
  const canvas = new OffscreenCanvas(Math.round(cadre.l * k), Math.round(cadre.h * k));
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, -cadre.x * k, -cadre.y * k);
  ctx.fillStyle = "#000";
  for (const m of masques) ctx.fillRect((m.x - cadre.x) * k, (m.y - cadre.y) * k, m.l * k, m.h * k);
  const blob = await canvas.convertToBlob({ type: "image/png" });
  return `data:image/png;base64,${await blobVersBase64(blob)}`;
}
