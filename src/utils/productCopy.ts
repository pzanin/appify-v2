import type { FeedPost, PwaConfig } from '../types';
import i18n from '../i18n';
export function productTagline(config:PwaConfig) {
  const text=config.tagline?.trim() || '';
  return text==='O melhor app do mundo' ? '' : text;
}
export function feedTimestamp(post:FeedPost,language:string) {
  const t=i18n.getFixedT(language.split('-')[0]);
  if (/^(Agora mesmo|Just now|Ahora mismo|À l’instant)$/i.test(post.timestamp || ''))return t('app.community.justNow');
  let date:number|undefined=post.displayDate;
  if(!date && /^\d{4}-\d{2}-\d{2}T/.test(post.timestamp || ''))date=Date.parse(post.timestamp);
  const legacy=/^(\d{2})\/(\d{2})\/(\d{4}),?\s+(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(post.timestamp || '');
  if(!date && legacy)date=new Date(+legacy[3],+legacy[2]-1,+legacy[1],+legacy[4],+legacy[5],+(legacy[6] || 0)).getTime();
  if(!date && !post.timestamp)date=post.createdAt;
  if(date && Number.isFinite(date)) {
    if(!post.displayDate && !post.timestamp && Date.now()-date<60000)return t('app.community.justNow');
    return new Intl.DateTimeFormat(language,{dateStyle:'short',timeStyle:'short'}).format(date);
  }
  return post.timestamp || '';
}

export function productName(name:string|undefined,language:string) {
  return !name?.trim() || name==='Meu App' ? i18n.getFixedT(language.split('-')[0])('app.defaultName') : name;
}
