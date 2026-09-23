import * as fs from "fs";
import * as path from "path";
import AdmZip from "adm-zip";

function buildCleanZip() {
  const rootDir = process.cwd();
  const zipPath = path.join(rootDir, "gouauth-deploy.zip");

  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  const zip = new AdmZip();

  // 1. Arquivos na raiz
  const rootFiles = [
    "server.js",
    "squarecloud.app",
    "package.json",
    "package-lock.json",
    "next.config.mjs",
    "tailwind.config.ts",
    "postcss.config.js",
    "tsconfig.json",
    "drizzle.config.ts",
    "variaveis-squarecloud.txt",
    "README.md",
  ];

  for (const file of rootFiles) {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) {
      zip.addLocalFile(fullPath);
    }
  }

  // 2. Pastas
  zip.addLocalFolder(path.join(rootDir, "banco de dados"), "banco de dados");
  zip.addLocalFolder(path.join(rootDir, "migrations"), "migrations");
  zip.addLocalFolder(path.join(rootDir, "scripts"), "scripts");
  zip.addLocalFolder(path.join(rootDir, "src"), "src");

  // 3. Adiciona .next excluindo estritamente a pasta 'cache'
  function addFolderRecursively(dirPath: string, zipPrefix: string) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      const zipSubPath = `${zipPrefix}/${entry.name}`;

      if (entry.isDirectory()) {
        if (entry.name === "cache") {
          // Ignora estritamente a pasta cache conforme aviso da Square Cloud
          continue;
        }
        addFolderRecursively(full, zipSubPath);
      } else {
        const fileContent = fs.readFileSync(full);
        zip.addFile(zipSubPath, fileContent);
      }
    }
  }

  const nextDir = path.join(rootDir, ".next");
  if (fs.existsSync(nextDir)) {
    addFolderRecursively(nextDir, ".next");
  }

  zip.writeZip(zipPath);

  const stats = fs.statSync(zipPath);
  const sizeMb = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`[ZIP SUCCESS] Arquivo gerado com sucesso: ${zipPath}`);
  console.log(`[ZIP SUCCESS] Tamanho: ${sizeMb} MB`);
  console.log(`[ZIP SUCCESS] Formato ZIP UNIX padrão (sem .next/cache e sem node_modules)`);
}

buildCleanZip();
