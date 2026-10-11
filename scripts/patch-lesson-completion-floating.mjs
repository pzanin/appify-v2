import fs from 'node:fs';

const path = 'src/components/PWARuntime.tsx';
let source = fs.readFileSync(path, 'utf8');

const startMarker = `                        {selectedMockupSubmodule && (\n                          <div className="flex items-center" style={{ position:'relative', zIndex:50, pointerEvents:'auto' }}>`;
const endMarker = `                          </div>\n                        )}`;
const start = source.indexOf(startMarker);
if (start < 0) throw new Error('completion control start not found');
const end = source.indexOf(endMarker, start);
if (end < 0) throw new Error('completion control end not found');
source = source.slice(0, start) + `                        {selectedMockupSubmodule && <div style={{ width: 132, flexShrink: 0 }} />}` + source.slice(end + endMarker.length);

const contentMarker = `        <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">\n          <AnimatePresence mode="wait">`;
const floating = `        <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">\n          {selectedMockupSubmodule && (\n            <div style={{ position:'absolute', top:10, right:14, zIndex:1200, pointerEvents:'auto' }}>\n              {!isCurrentLessonCompleted ? (\n                !canCompleteLesson ? (\n                  <div className="flex items-center gap-1 text-[11px] font-semibold px-3 py-2 rounded-full animate-pulse" style={{ background: isPhoneDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.96)', color: isPhoneDark ? '#ffffff' : '#111111', boxShadow:'0 2px 10px rgba(0,0,0,.12)' }}>\n                    <Clock size={14} /><span>{lessonCompletionTimer}s</span>\n                  </div>\n                ) : (\n                  <button type="button" aria-pressed={false} onClick={(event) => { event.preventDefault(); event.stopPropagation(); handleSimulateCompletion(); }} style={{ display:'flex', alignItems:'center', gap:6, minHeight:36, padding:'8px 12px', borderRadius:999, border:'none', cursor:'pointer', pointerEvents:'auto', color:themeColor, background:'#ffffff', boxShadow:'0 2px 12px rgba(0,0,0,.18)', fontWeight:800, fontSize:12 }}>\n                    <CheckCircle size={18} /><span>{t('app.modules.complete')}</span>\n                  </button>\n                )\n              ) : (\n                <button type="button" aria-pressed={true} aria-label={t('app.modules.completed_status')} title="Marcar como não concluída" onClick={(event) => { event.preventDefault(); event.stopPropagation(); handleSimulateCompletion(); }} style={{ display:'flex', alignItems:'center', gap:7, minHeight:36, padding:'8px 12px', borderRadius:999, border:'1px solid rgba(34,197,94,.35)', cursor:'pointer', pointerEvents:'auto', color:'#15803d', background:'#ffffff', boxShadow:'0 2px 12px rgba(0,0,0,.18)', fontWeight:800, fontSize:12 }}>\n                  <span style={{ background:'#22c55e', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}><Check size={12} strokeWidth={4}/></span>\n                  <span>{t('app.modules.completed_status')}</span>\n                </button>\n              )}\n            </div>\n          )}\n          <AnimatePresence mode="wait">`;
if (!source.includes(contentMarker)) throw new Error('content marker not found');
source = source.replace(contentMarker, floating);

fs.writeFileSync(path, source);
console.log('Floating lesson completion control applied.');
