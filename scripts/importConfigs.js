/* global process */
import { runCatalogImport } from "./importCatalogs.js";

runCatalogImport({ argv: [...process.argv.slice(2), "--only=configs"] }).catch((error) => {
  console.error(`Importación cancelada: ${error.message}`);
  process.exitCode = 1;
});
