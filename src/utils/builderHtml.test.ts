import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import type { BuilderBlock } from '../types';
const dom = new JSDOM('');
Object.assign(globalThis, { window: dom.window, document: dom.window.document, DOMParser: dom.window.DOMParser });
const { getDefaultProps, getBlockInnerHtml, generateBuilderHtml, normalizedBlockProps, safeLinkUrl, reorderBlocks } = await import('./builderHtml');
const { prepareResponsiveHtml } = await import('./htmlContent');
function block(type: string, subtype?: string, overrides: BuilderBlock['props'] = {}): BuilderBlock {
  return { id: `${type}-${subtype}`, type, subtype, props: { ...getDefaultProps(type, subtype), ...overrides } };
}
function doc(html: string) { return new JSDOM(html).window.document; }

test('highlight cards preserve optional icons, escaped content, typography and zero spacing through export', () => {
  for (const [cardIcon, symbol] of Object.entries({ none:'', check:'✓', star:'★', arrow:'→', dot:'•' })) {
    const item = block('card',undefined,{cardIcon:cardIcon as BuilderBlock['props']['cardIcon'],title:'Dica <img src=x onerror=alert(1)>',content:'Español & English\n' + 'x'.repeat(200),cardBgColor:'#123456',cardPadding:0,borderRadius:0,titleFontFamily:'Roboto',titleFontSize:'29',titleMarginBottom:0});
    const before = JSON.stringify(item);
    const preview = doc(getBlockInnerHtml(item)).querySelector('.appify-builder-card') as HTMLElement;
    const card = doc(prepareResponsiveHtml(generateBuilderHtml(JSON.parse(JSON.stringify([item]))))).querySelector('.appify-builder-card') as HTMLElement;
    assert.equal(card.getAttribute('style'),preview.getAttribute('style'));
    assert.equal(card.style.background,'rgb(18, 52, 86)');
    assert.equal(card.style.padding,'0px');
    assert.equal(card.style.borderRadius,'0px');
    assert.equal(card.querySelector('h3')!.textContent,item.props.title);
    assert.equal(card.querySelector('h3')!.style.fontSize,'29px');
    assert.match(card.querySelector('h3')!.style.fontFamily,/Roboto/);
    assert.equal(card.querySelector('h3')!.style.marginBottom,'0px');
    assert.equal(card.querySelector('p')!.textContent,item.props.content);
    assert.equal(card.querySelector('p')!.style.whiteSpace,'pre-wrap');
    assert.equal(card.querySelector('p')!.style.overflowWrap,'anywhere');
    assert.equal(card.querySelector('span')?.textContent || '',symbol);
    if (symbol) assert.equal(card.querySelector('span')!.getAttribute('aria-hidden'),'true');
    assert.equal(card.querySelector('img,script'),null);
    assert.equal(JSON.stringify(item),before);
  }
  assert.equal(doc(getBlockInnerHtml(block('card',undefined,{title:''}))).querySelector('h3'),null);
});

test('icon lists preserve items, icons and spacing through saved HTML and responsive preparation', () => {
  const content = 'Benefício em português\r\n\r\n<script>alert("x")</script> & texto\n' + 'Texto longo '.repeat(30);
  for (const [listIcon, symbol] of Object.entries({ check:'✓', star:'★', arrow:'→', dot:'•' })) {
    const item = block('list', undefined, { content, listIcon:listIcon as BuilderBlock['props']['listIcon'], listIconColor:'#123456', gap:0 });
    const saved = doc(prepareResponsiveHtml(generateBuilderHtml(JSON.parse(JSON.stringify([item])))));
    const list = saved.querySelector('ul')!;
    assert.equal(list.getAttribute('role'), 'list');
    assert.equal(list.style.gap, '0px');
    assert.equal(list.children.length, 3);
    assert.equal(list.children[1].lastElementChild!.textContent, '<script>alert("x")</script> & texto');
    assert.equal(list.querySelector('script'), null);
    const marker = list.querySelector('span')!;
    assert.equal(marker.textContent, symbol);
    assert.equal(marker.getAttribute('aria-hidden'), 'true');
    assert.equal(marker.style.color, 'rgb(18, 52, 86)');
    assert.equal((list.children[2].lastElementChild as HTMLElement).style.overflowWrap, 'anywhere');
  }
  assert.equal(doc(generateBuilderHtml([block('list',undefined,{content:''})])).querySelectorAll('li').length, 0);
});

test('all heading blocks keep independently edited font, size, weight and zero margin through saved HTML', () => {
  for (const item of [block('header'), ...['oneColumn','hero','cta','twoColumn','threeColumn','imageText'].map(type => block('container',type))]) {
    item.props = { ...item.props, titleFontFamily:'Roboto', titleFontSize:'37', titleFontWeight:'600', titleMarginBottom:0, fontSize:'19' };
    const preview = doc(getBlockInnerHtml(item)).querySelector('h1,h2,h3')!;
    const saved = doc(prepareResponsiveHtml(generateBuilderHtml(JSON.parse(JSON.stringify([item]))))).querySelector('h1,h2,h3')!;
    assert.equal(preview.getAttribute('style'), saved.getAttribute('style'));
    assert.equal((saved as HTMLElement).style.fontSize, '37px');
    assert.match((saved as HTMLElement).style.fontFamily, /Roboto/);
    assert.equal((saved as HTMLElement).style.marginBottom, '0px');
    assert.equal((saved as HTMLElement).style.fontWeight, '600');
  }
});

test('two and three columns export their cards, gap, padding and responsive rules without adding preview padding', () => {
  for (const subtype of ['twoColumn','threeColumn']) {
    const html = generateBuilderHtml([block('container',subtype,{ gap:0, padding:0, cardPadding:0, columnPadding:0 })]);
    const d = doc(prepareResponsiveHtml(html));
    const grid = d.querySelector('.appify-builder-grid') as HTMLElement;
    assert.equal(grid.children.length, subtype === 'twoColumn' ? 2 : 3);
    assert.equal(grid.style.gap, '0px');
    assert.equal((grid.children[0] as HTMLElement).style.padding, '0px');
    assert.equal((d.querySelector('section') as HTMLElement).style.padding, '0px');
    assert.match(d.querySelector('style:not(#appify-responsive-html)')!.textContent || '', /@container appify-blocks/);
    assert.equal(d.querySelector('.custom-html-container'),null);
  }
});

test('both image blocks retain width, fixed height, radius zero and fit through sanitization/export', () => {
  for (const item of [block('image',undefined,{src:'data:image/png;base64,AA==',width:55,imgHeight:180,imgBorderRadius:0,imgObjectFit:'contain'}),block('container','imageText',{ imageSrc:'data:image/png;base64,AA==',imageWidth:55,imageHeight:180,imageBorderRadius:0,imageObjectFit:'contain' })]) {
    const html = prepareResponsiveHtml(generateBuilderHtml([item]));
    const image = doc(html).querySelector('img') as HTMLElement;
    assert.equal(image.style.width,'55%');
    assert.equal(image.style.height,'180px');
    assert.equal(image.style.borderRadius,'0px');
    assert.equal(image.style.objectFit,'contain');
    assert.match(html,/img:not\(\.appify-sized-image\)/);
  }
});

test('button and CTA links use the same secure external URL policy and escaped labels', () => {
  for (const item of [block('link'),block('container','cta')]) {
    item.props.url = 'pay.hotmart.com/ABC?x=1&y=2';
    item.props.text = 'A < B & "C"'; item.props.buttonText = item.props.text;
    const a = doc(prepareResponsiveHtml(generateBuilderHtml([item]))).querySelector('a')!;
    assert.equal(a.getAttribute('href'),'https://pay.hotmart.com/ABC?x=1&y=2');
    assert.equal(a.textContent,item.props.text);
    assert.equal(a.getAttribute('target'),'_blank');
    assert.equal(a.getAttribute('rel'),'noopener noreferrer');
  }
  for (const value of ['javascript:alert(1)','file:///secret','https://user:secret@example.com','http://example.com','/private','#','https://']) assert.equal(safeLinkUrl(value),'#');
  assert.equal(safeLinkUrl('mailto:help@example.com'),'mailto:help@example.com');
});

test('old blocks receive missing defaults without modifying saved data; invalid sizes do not break layout', () => {
  const old: BuilderBlock = {id:'old',type:'container',subtype:'threeColumn',props:{col1Title:'Old',padding:0,titleFontSize:'garbage'}};
  const before = JSON.stringify(old);
  assert.equal(normalizedBlockProps(old).titleFontSize,'18');
  assert.equal(normalizedBlockProps(old).padding,'0');
  assert.equal(JSON.stringify(old),before);
  assert.equal(doc(generateBuilderHtml([old])).querySelector('h3')?.textContent,'Old');
  assert.equal(normalizedBlockProps(block('header',undefined,{titleFontSize:'99999'})).titleFontSize,'96');
});

test('reordering moves only the requested block and never mutates content or loses boundary blocks', () => {
  const blocks = [block('header'),block('text'),block('image')];
  const before = JSON.stringify(blocks);
  const result = reorderBlocks(blocks,blocks[1].id,-1);
  assert.deepEqual(result.map(b=>b.id),[blocks[1].id,blocks[0].id,blocks[2].id]);
  assert.equal(JSON.stringify(blocks),before);
  assert.equal(reorderBlocks(blocks,'missing',1),blocks);
  assert.equal(reorderBlocks(blocks,blocks[0].id,-1),blocks);
  assert.equal(reorderBlocks(blocks,blocks[2].id,1),blocks);
});

test('all available elements and containers produce content without undefined fields or injected HTML', () => {
  const items = [...['header','text','image','link','spacer','divider'].map(t=>block(t)),...['oneColumn','hero','twoColumn','threeColumn','imageText','testimonial','cta'].map(t=>block('container',t))];
  for (const item of items) { assert.ok(getBlockInnerHtml(item).length); assert.doesNotMatch(generateBuilderHtml([item]),/undefined|NaN/); }
  const malicious = block('header',undefined,{title:'<img src=x onerror=alert(1)>',subtitle:'<script>bad</script>'});
  const d = doc(generateBuilderHtml([malicious]));
  assert.equal(d.querySelector('h1')?.textContent, malicious.props.title);
  assert.equal(d.querySelector('img,script'),null);
});

test('one-column sections preserve title, text, content width and outer margins; columns support deliberate equal-height alignment',()=>{
  const section=block('container','oneColumn');section.props={...section.props,title:'Uma seção',text:'Primeira linha\nSegunda linha',maxWidth:'720',marginTop:'18',marginBottom:'26',titleFontSize:'29',borderRadius:'0'};
  const html=generateBuilderHtml([section]);const doc=new JSDOM(html).window.document;
  assert.equal(doc.querySelector('h2')!.textContent,'Uma seção');
  assert.equal(doc.querySelector('h2')!.style.fontSize,'29px');
  assert.equal((doc.querySelector('.appify-builder-content') as HTMLElement).style.maxWidth,'720px');
  assert.equal((doc.querySelector('section') as HTMLElement).style.marginTop,'18px');
  assert.equal((doc.querySelector('section') as HTMLElement).style.marginBottom,'26px');
  assert.match(doc.querySelector('p')!.textContent!,/Primeira linha\nSegunda linha/);
  const columns=block('container','twoColumn');columns.props.columnAlign='stretch';
  assert.equal((new JSDOM(generateBuilderHtml([columns])).window.document.querySelector('.appify-builder-grid') as HTMLElement).style.alignItems,'stretch');
});
