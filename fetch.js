// SIGNAL BOSS V4 - fetch.js
// ดึงหุ้น US / ไทย / BTC ผ่าน Yahoo + Proxy สำรอง (ไม่มี API Key)
async function fetchYahoo(sym){
  const url=`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=6mo&interval=1d`;
  const tries=[url,`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,`https://corsproxy.io/?url=${encodeURIComponent(url)}`];
  for(const u of tries){try{const r=await fetch(u);const j=await r.json();const res=j.chart?.result?.[0];if(!res)continue;const q=res.indicators.quote[0];const ts=res.timestamp;let kl=[];for(let i=0;i<ts.length;i++){if(q.close[i]==null)continue;kl.push({t:ts[i]*1000,o:q.open[i],h:q.high[i],l:q.low[i],c:q.close[i]});}if(kl.length>30)return kl;}catch(e){}}
  throw new Error('ดึง '+sym+' ไม่ได้ (Yahoo/Proxy ติด CORS)');
}
async function loadJSON(path){const r=await fetch(path);return await r.json();}
