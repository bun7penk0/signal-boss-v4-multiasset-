// SIGNAL BOSS V4.2 - fetch.js
// สาเหตุที่ยัง FAIL: Stooq ตรงๆ โดนบล็อก CORS บนมือถือ / Vercel เหมือน Yahoo
// แก้: ทุกแหล่งข้อมูลต้องลองผ่าน Proxy ด้วย ไม่ใช่ลองตรงอย่างเดียว
const PROXIES=[
  u=>u,
  u=>'https://api.allorigins.win/raw?url='+encodeURIComponent(u),
  u=>'https://api.codetabs.com/v1/proxy?quest='+encodeURIComponent(u),
  u=>'https://corsproxy.io/?url='+encodeURIComponent(u),
  u=>'https://api.allorigins.win/get?url='+encodeURIComponent(u),
];
async function fetchTextViaProxies(url){
  for(const p of PROXIES){
    try{
      const u=p(url);
      const r=await fetch(u);
      if(!r.ok) continue;
      // allorigins /get returns JSON {contents: "..."}
      if(u.includes('/get?url=')){
        const j=await r.json();
        if(j.contents) return j.contents;
        continue;
      }
      const t=await r.text();
      if(t && t.length>100) return t;
    }catch(e){}
  }
  throw new Error('Proxy ทุกตัวพัง');
}
async function fetchJSONViaProxies(url){
  const txt=await fetchTextViaProxies(url);
  try{ return JSON.parse(txt); }catch(e){ throw new Error('JSON พัง'); }
}
async function fetchYahoo(sym){
  // 1) BTC - Binance ตรงก่อน แล้วค่อยผ่าน Proxy
  if(sym==='BTC-USD'||sym==='BTCUSDT'){
    const url='https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=180';
    try{ const j=await fetchJSONViaProxies(url); if(Array.isArray(j)&&j.length>30) return j.map(k=>({t:k[0],o:parseFloat(k[1]),h:parseFloat(k[2]),l:parseFloat(k[3]),c:parseFloat(k[4])})); }catch(e){}
  }
  // 2) หุ้น US - Stooq ผ่าน Proxy ทุกตัว (ไม่ใช่ตรงอย่างเดียว)
  const stooqMap={AAPL:'aapl.us',MSFT:'msft.us',NVDA:'nvda.us',TSLA:'tsla.us'};
  if(stooqMap[sym]){
    const url='https://stooq.com/q/d/l/?s='+stooqMap[sym]+'&i=d';
    try{
      const txt=await fetchTextViaProxies(url);
      const lines=txt.trim().split('\n').slice(1);
      let kl=lines.map(l=>{const p=l.split(','); return {t:new Date(p[0]).getTime(),o:parseFloat(p[1]),h:parseFloat(p[2]),l:parseFloat(p[3]),c:parseFloat(p[4])};}).filter(k=>!isNaN(k.c));
      if(kl.length>30) return kl.slice(-180);
    }catch(e){}
    // Stooq แบบ quote เดี่ยวเป็นสำรอง
    try{
      const url2='https://stooq.com/q/l/?s='+stooqMap[sym]+'&f=sd2t2ohlcv&h&e=csv';
      const txt2=await fetchTextViaProxies(url2);
      const lines2=txt2.trim().split('\n').slice(1);
      let kl2=lines2.map(l=>{const p=l.split(','); return {t:new Date(p[0]).getTime(),o:parseFloat(p[1]),h:parseFloat(p[2]),l:parseFloat(p[3]),c:parseFloat(p[4])};}).filter(k=>!isNaN(k.c));
      if(kl2.length>30) return kl2.slice(-180);
    }catch(e){}
  }
  // 3) Yahoo - ทั้ง query1 และ query2 ผ่าน Proxy ทุกตัว (หุ้นไทยต้องใช้ทางนี้)
  for(const host of ['query1.finance.yahoo.com','query2.finance.yahoo.com']){
    const url=`https://${host}/v8/finance/chart/${sym}?range=6mo&interval=1d`;
    try{
      const j=await fetchJSONViaProxies(url);
      const res=j.chart?.result?.[0]; if(!res) continue;
      const q=res.indicators.quote[0]; const ts=res.timestamp; let kl=[];
      for(let i=0;i<ts.length;i++){ if(q.close[i]==null) continue; kl.push({t:ts[i]*1000,o:q.open[i],h:q.high[i],l:q.low[i],c:q.close[i]}); }
      if(kl.length>30) return kl;
    }catch(e){}
  }
  throw new Error('ดึง '+sym+' ไม่ได้ (Yahoo/Stooq/Binance ติด CORS - ลองกด RUN ใหม่อีกรอบ เน็ตมือถือบางที Proxy ตัวแรกพัง)');
}
async function loadJSON(path){const r=await fetch(path);return await r.json();}
