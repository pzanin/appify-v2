import fs from 'node:fs';

const path = 'src/components/PWARuntime.tsx';
let source = fs.readFileSync(path, 'utf8');

const beforeHeader = `                      <div style={{ \n                        display: 'flex', \n                        alignItems: 'center', \n                        justifyContent: 'space-between',\n                        padding: selectedMockupSubmodule ? '12px 16px 8px' : '10px 0 8px', \n                        flexShrink: 0 \n                      }}>`;
const afterHeader = `                      <div style={{ \n                        display: 'flex', \n                        alignItems: 'center', \n                        justifyContent: 'space-between',\n                        padding: selectedMockupSubmodule ? '12px 16px 8px' : '10px 0 8px', \n                        flexShrink: 0,\n                        position: 'relative',\n                        zIndex: 40,\n                        pointerEvents: 'auto',\n                        background: isPhoneDark ? '#091218' : '#f6f8fa'\n                      }}>`;
if (!source.includes(beforeHeader)) throw new Error('lesson header not found');
source = source.replace(beforeHeader, afterHeader);

source = source.replace(
  `<div className="flex items-center">\n                            {!isCurrentLessonCompleted ? (`,
  `<div className="flex items-center" style={{ position:'relative', zIndex:50, pointerEvents:'auto' }}>\n                            {!isCurrentLessonCompleted ? (`
);

source = source.replace(
  `                                  onClick={handleSimulateCompletion}\n                                  className="flex items-center gap-1 text-[12px] font-bold px-2 py-1 rounded-full transition-all"\n                                  style={{ color: themeColor, backgroundColor: \`${'${themeColor}'}20\`, border: 'none', cursor: 'pointer' }}`,
  `                                  type="button"\n                                  onClick={(event) => { event.preventDefault(); event.stopPropagation(); handleSimulateCompletion(); }}\n                                  className="flex items-center gap-1 text-[12px] font-bold px-2 py-1 rounded-full transition-all"\n                                  style={{ color: themeColor, backgroundColor: \`${'${themeColor}'}20\`, border: 'none', cursor: 'pointer', position:'relative', zIndex:60, pointerEvents:'auto' }}`
);

source = source.replace(
  `<button type="button" onClick={handleSimulateCompletion} className="flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full transition-all text-green-500 bg-green-500/10" style={{ border: 'none', cursor: 'pointer' }} title="Marcar como não concluída">`,
  `<button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); handleSimulateCompletion(); }} className="flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full transition-all text-green-500 bg-green-500/10" style={{ border: 'none', cursor: 'pointer', position:'relative', zIndex:60, pointerEvents:'auto' }} title="Marcar como não concluída">`
);

source = source.replace(
  `className="flex flex-col flex-1 w-full h-full min-h-0 relative">`,
  `className="flex flex-col flex-1 w-full h-full min-h-0 relative" style={{ zIndex: 1 }}>`
);

fs.writeFileSync(path, source);
console.log('Lesson completion click layer fix applied.');
