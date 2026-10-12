import fs from 'node:fs';

const files = {
  common: 'src/components/CommonComponents.tsx',
  hooks: 'src/hooks.ts',
  app: 'src/App.tsx',
};

function editFile(path, edits) {
  const raw = fs.readFileSync(path, 'utf8');
  const crlf = raw.includes('\r\n');
  let source = raw.replace(/\r\n/g, '\n');
  for (const [label, before, after] of edits) {
    if (!source.includes(before)) throw new Error(`Patch marker not found (${path}): ${label}`);
    source = source.replace(before, after);
  }
  if (crlf) source = source.replace(/\n/g, '\r\n');
  fs.writeFileSync(path, source);
}

editFile(files.common, [
  ['remove Sparkles import', "import { Smartphone, Calendar, Users, Plus, Check, ArrowLeft, RotateCcw, Download, Sparkles, Sun, Moon, Bell, Home, Rss, User, Trash2, Copy, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';", "import { Smartphone, Calendar, Users, Plus, Check, ArrowLeft, RotateCcw, Download, Sun, Moon, Bell, Home, Rss, User, Trash2, Copy, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';"],
  ['remove Header publish prop', "  handlePublish: () => void;\n", ""],
  ['remove Header publish argument', "export function Header({ handleOpenProject, handlePublish, showToast }: HeaderProps) {", "export function Header({ handleOpenProject, showToast }: HeaderProps) {"],
  ['remove publish button', "            <button className=\"btn-primary\" onClick={handlePublish}><Sparkles size={16} /> Publicar</button>\n", ""],
]);

editFile(files.hooks, [
  ['remove fake handlePublish', "  const handlePublish = () => {\n    showToast('Iniciando deploy na edge...', 'loading');\n    setTimeout(() => showToast('App serviço publicado com sucesso!', 'success'), 2000);\n  };\n\n", ""],
  ['remove handlePublish return', "    handlePublish,\n", ""],
]);

editFile(files.app, [
  ['remove Header handlePublish prop', "        handlePublish={builderActions.handlePublish}\n", ""],
]);

console.log('Fake publish action removed from header and builder actions.');
