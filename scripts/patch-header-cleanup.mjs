import fs from 'node:fs';

function patchFile(path, replacements) {
  const raw = fs.readFileSync(path, 'utf8');
  const usesCrLf = raw.includes('\r\n');
  let source = raw.replace(/\r\n/g, '\n');
  for (const { before, after, label } of replacements) {
    if (!source.includes(before)) throw new Error(`Patch marker not found: ${label}`);
    source = source.replace(before, after);
  }
  if (usesCrLf) source = source.replace(/\n/g, '\r\n');
  fs.writeFileSync(path, source);
}

patchFile('src/components/BuilderLayout.tsx', [
  {
    label: 'remove fake progress calculation',
    before: `  const progressPercent = Math.round((Math.max(0, steps.findIndex(step => step.id === activeStep)) / steps.length) * 100);\n`,
    after: ''
  },
  {
    label: 'remove fake progress display',
    before: `          {!showHelp && <div className="progress-bar-wrap"><span>{progressPercent}% completo</span><div className="progress-bar"><div className="progress-fill" style={{ width: \`${'${progressPercent}'}%\` }}></div></div></div>}\n`,
    after: ''
  }
]);

patchFile('src/components/CommonComponents.tsx', [
  {
    label: 'rename eye icon import',
    before: `ArrowLeft, Eye, Download`,
    after: `ArrowLeft, RotateCcw, Download`
  },
  {
    label: 'rename misleading preview button',
    before: `            <button \n              className="btn-ghost" \n              onClick={() => {\n                setSplash(true);\n                setTimeout(() => setSplash(false), 1500);\n              }}\n            >\n              <Eye size={16} /> Preview PWA\n            </button>`,
    after: `            <button \n              className="btn-ghost" \n              title="Reproduzir novamente a tela de abertura no preview ao lado"\n              onClick={() => {\n                setSplash(true);\n                setTimeout(() => setSplash(false), 1500);\n              }}\n            >\n              <RotateCcw size={16} /> Rever abertura\n            </button>`
  }
]);

console.log('Header cleanup patch applied.');
