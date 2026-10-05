export function customerButtonTextColor(color:string):string {
  const hex=/^#[a-f0-9]{6}$/i.test(color) ? color.slice(1) : '394cc6';
  const channels=[0,2,4].map(index=>parseInt(hex.slice(index,index+2),16)/255).map(value=>value<=0.04045 ? value/12.92 : ((value+0.055)/1.055)**2.4);
  const luminance=channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722;
  return 1.05/(luminance+0.05)>=4.5 ? '#ffffff' : '#111111';
}
