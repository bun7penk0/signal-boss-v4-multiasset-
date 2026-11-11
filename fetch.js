// SIGNAL BOSS V4.1 - fetch.js
// Yahoo บล็อก CORS บ่อย -> เพิ่ม Stooq (US) + Binance (BTC) เป็นทางสำรอง
async function fetchYahoo(sym){
  // 1) BTC ใช้ Binance โดยตรง (ไม่ติด CORS)
  if(sym==='BTC-USD' || sym==='BTCUSDT'){
    try{
      const r=await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=180');
      const j=await r.json();
      return j.map(k=>({t:k[0],o:parseFloat(k[1]),h:parseFloat(k[2]),l:parseFloat(k[3]),c:parseFloat(k[4])}));
    }catch(e){}
  }
  // 2) หุ้น US ใช้ Stooq (ไม่ติด CORS มาก)
  const stooqMap={AAPL:'aapl.us',MSFT:'msft.us',NVDA:'nvda.us',TSLA:'tsla.us'};
  if(stooqMap[sym]){
    try{
      const r=await fetch('https://stooq.com/q/d/l/?s='+stooqMap[sym]+'&i=d');
      const txt=await r.text();
      const lines=txt.trim().split('\n').slice(1);
      let kl=lines.map(l=>{const p=l.split(','); return {t:new Date(p[0]).getTime(),o:parseFloat(p[1]),h:parseFloat(p[2]),l:parseFloat(p[3]),c:parseFloat(p[4])};}).filter(k=>!isNaN(k.c));
      if(kl.length>30) return kl.slice(-180);
    }catch(e){}
  }
  // 3) Yahoo + Proxy สำรอง (หุ้นไทยต้องใช้ทางนี้)
  const url=`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=6mo&interval=1d`;
  const tries=[url,`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,`https://corsproxy.io/?url=${encodeURIComponent(url)}`];
  for(const u of tries){ try{ const r=await fetch(u); const j=await r.json(); const res=j.chart?.result?.[0]; if(!res) continue; const q=res.indicators.quote[0]; const ts=res.timestamp; let kl=[]; for(let i=0;i<ts.length;i++){ if(q.close[i]==null) continue; kl.push({t:ts[i]*1000,o:q.open[i],h:q.high[i],l:q.low[i],c:q.close[i]});} if(kl.length>30) return kl; }catch(e){} }
  throw new Error('ดึง '+sym+' ไม่ได้ (Yahoo/Stooq/Binance ติด CORS)');
}
async function loadJSON(path){const r=await fetch(path);return await r.json();}
