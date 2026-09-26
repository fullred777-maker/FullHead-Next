import fs from "fs";
import path from "path";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getTestFirebaseConfig } from "./firebaseConfig.js";

function slug(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function main() {
  const app = initializeApp(getTestFirebaseConfig());
  const db = getFirestore(app);

  const file = path.resolve("presets.json");
  const raw = fs.readFileSync(file, "utf-8");
  const presets = JSON.parse(raw);

  let ok = 0;

  for (const p of presets) {
    const id = `${slug(p.brand)}_${slug(p.model)}_${slug(p.profile)}`;

    await setDoc(doc(db, "presets", id), {
      brand: p.brand,
      model: p.model,
      profile: p.profile,
      general: Number(p.general ?? 0),
      redDot: Number(p.redDot ?? 0),
      x2: Number(p.x2 ?? 0),
      x4: Number(p.x4 ?? 0),
      awm: Number(p.awm ?? 0),
      freeLook: Number(p.freeLook ?? 0),
      dpi: Number(p.dpi ?? 0),
      notes: p.notes ?? "",
      isPremium: Boolean(p.isPremium ?? false),
      updatedAt: new Date(),
    });

    ok++;
    console.log(`✅ Importado: ${id}`);
  }

  console.log(`\n🎉 Finalizado. Total importado: ${ok}`);
}

main().catch((e) => {
  console.error("❌ Erro:", e);
  process.exit(1);
});
