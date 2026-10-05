import { randomUUID } from 'node:crypto';

// Ephemeral preview documents: opaque URLs, no disk writes or filesystem routes.
export class InteractiveContentStore {
  private documents = new Map<string,{owner:number;html:string}>();
  create(owner:number, html:unknown) {
    if (typeof html !== 'string' || !html.trim() || Buffer.byteLength(html,'utf8') > 8*1024*1024) throw new Error('Conteúdo interativo inválido.');
    if ([...this.documents.values()].filter(doc=>doc.owner===owner).length >= 12) throw new Error('Feche outras prévias antes de abrir esta atividade.');
    const url=`appify-content://activity/${randomUUID()}`;
    this.documents.set(url,{owner,html});return url;
  }
  get(url:string) { return this.documents.get(url)?.html; }
  release(owner:number,url:unknown) {
    if (typeof url==='string' && this.documents.get(url)?.owner===owner) this.documents.delete(url);
  }
  clear(owner:number) { for(const [url,doc] of this.documents) if(doc.owner===owner)this.documents.delete(url); }
}
