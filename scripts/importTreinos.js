import fs from "fs";
import path from "path";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getTestFirebaseConfig } from "./firebaseConfig.js";

function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function main() {
  const app = initializeApp(getTestFirebaseConfig());
  const db = getFirestore(app);

  const raw = fs.readFileSync(path.resolve("treinos.json"), "utf-8");
  const treinos = JSON.parse(raw);

  let ok = 0;

  for (const t of treinos) {
    const id = slug(t.title);
    await setDoc(doc(db, "treinos", id), {
      ...t,
      updatedAt: new Date(),
    });
    ok++;
    console.log(`✅ Treino importado: ${id}`);
  }

  console.log(`🎉 Total de treinos: ${ok}`);
}

main();
