// SIGNAL BOSS V4 - indicators.js
// EMA / RSI Wilder / ATR / LL HH / Rejection - ใช้สูตรเดียวกันทุกตลาด
function ema(arr,p){let k=2/(p+1),e=arr[0];for(let i=1;i<arr.length;i++)e=arr[i]*k+e*(1-k);return e;}
function rsi(closes){let g=[],l=[];for(let i=1;i<closes.length;i++){let d=closes[i]-closes[i-1];g.push(Math.max(d,0));l.push(Math.max(-d,0));}let ag=g.slice(0,14).reduce((a,b)=>a+b,0)/14,al=l.slice(0,14).reduce((a,b)=>a+b,0)/14;for(let i=14;i<g.length;i++){ag=(ag*13+g[i])/14;al=(al*13+l[i])/14;}return al===0?100:100-(100/(1+ag/al));}
function atr(kl){let trs=[];for(let i=1;i<kl.length;i++){let h=kl[i].h,l=kl[i].l,pc=kl[i-1].c;trs.push(Math.max(h-l,Math.abs(h-pc),Math.abs(l-pc)));}return trs.slice(-14).reduce((a,b)=>a+b,0)/14;}
function countLL(kl){let n=0;for(let i=kl.length-1;i>kl.length-12&&i>0;i--){if(kl[i].l<kl[i-1].l)n++;else break;}return n;}
function countHH(kl){let n=0;for(let i=kl.length-1;i>kl.length-12&&i>0;i--){if(kl[i].h>kl[i-1].h)n++;else break;}return n;}
function countRejection(kl){let up=0,down=0;for(let i=kl.length-5;i<kl.length;i++){let o=kl[i].o,h=kl[i].h,l=kl[i].l,c=kl[i].c,body=Math.abs(c-o)||0.0001;if(Math.min(o,c)-l>2*body)up++;if(h-Math.max(o,c)>2*body)down++;}return {up,down};}
