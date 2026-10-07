import React from 'react';
import i18n from '../i18n';
type Props={children:React.ReactNode;product?:boolean};
export class ScreenErrorBoundary extends React.Component<Props,{hasError:boolean;error:Error|null}> {
  declare props:Props;
  state={hasError:false,error:null as Error|null};
  static getDerivedStateFromError(error:Error){return {hasError:true,error};}
  componentDidCatch(error:Error,info:React.ErrorInfo){console.error('[Appify] Screen failed to load.',error,info);}
  render(){
    if(!this.state.hasError)return this.props.children;
    const t=i18n.getFixedT((this.props.product ? document.documentElement.lang || navigator.language : i18n.language).split('-')[0]);
    return <div style={{padding:40,textAlign:'center',color:'#ff6b6b'}}>
      <h1>{t('app.errors.errorTitle')}</h1><p>{t('app.errors.errorBody')}</p>
      {Boolean((import.meta as any).env?.DEV) && this.state.error?.message && <pre style={{maxWidth:760,margin:'20px auto',padding:16,textAlign:'left',whiteSpace:'pre-wrap',wordBreak:'break-word',background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:10,color:'#ffd2d2',fontSize:12}}>{this.state.error.message}</pre>}
      <button className="btn-primary" onClick={()=>window.location.reload()}>{t('app.errors.reload')}</button>
    </div>;
  }
}
