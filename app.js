// SIGNAL BOSS V4.1 - app.js (FIX undefined)
// สาเหตุเดิม: whitelist.json บน GitHub ใช้ชื่อฟิลด์ไม่ตรงกัน / ไฟล์อยู่คนละโฟลเดอร์
// แก้: 1) ลองโหลดทั้ง data/*.json และ *.json ที่ Root  2) รับชื่อฟิลด์ได้หลายแบบ symbol/ticker/code/sym  3) ถ้า JSON พัง ใช้ Whitelist สำรองในโค้ด
let CONFIG=null, ASSETS=[], errs=[];
const FALLBACK=[
 {symbol:'BTC-USD',name:'BTC',market:'CRYPTO',ccy:'$'},
 {symbol:'AAPL',name:'Apple',market:'US',ccy:'$'},
 {symbol:'MSFT',name:'Microsoft',market:'US',ccy:'$'},
 {symbol:'NVDA',name:'Nvidia',market:'US',ccy:'$'},
 {symbol:'TSLA',name:'Tesla',market:'US',ccy:'$'},
 {symbol:'PTT.BK',name:'PTT',market:'TH',ccy:'฿'},
 {symbol:'AOT.BK',name:'AOT',market:'TH',ccy:'฿'},
 {symbol:'CPALL.BK',name:'CPALL',market:'TH',ccy:'฿'},
 {symbol:'ADVANC.BK',name:'ADVANC',market:'TH',ccy:'฿'},
 {symbol:'DELTA.BK',name:'DELTA',market:'TH',ccy:'฿'},
];
function logErr(t,m){errs.unshift({at:new Date().toLocaleString('th-TH'),t,m});document.getElementById('errBox').innerHTML=errs.map(e=>`<div style="border:1px solid #7f1d1d;border-radius:10px;padding:8px;margin-top:6px"><b>[${e.t}]</b> ${e.m}<br><small>${e.at}</small></div>`).join('');}
function exportLog(){const b=new Blob([errs.map(e=>`[${e.at}] [${e.t}] ${e.m}`).join('\n')],{type:'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='v4-multiasset-log.txt';a.click();}
async function loadJSONAny(paths){ for(const p of paths){ try{ const r=await fetch(p); if(!r.ok) continue; const j=await r.json(); return {j, path:p}; }catch(e){} } throw new Error('โหลดไม่ได้เลย: '+paths.join(' / ')); }
function normalizeWhitelist(wl){
  let raw=[];
  if(Array.isArray(wl)) raw=wl;
  else if(Array.isArray(wl.assets)) raw=wl.assets;
  else if(Array.isArray(wl.data)) raw=wl.data;
  else raw=[...(wl.crypto||[]),...(wl.us||[]),...(wl.th||[]),...(wl.stocks||[])];
  return raw.map(x=>{
    const symbol=x.symbol||x.ticker||x.code||x.sym||x.yahoo||x.id||'';
    const name=x.name||symbol||'Unknown';
    const market=x.market||x.exchange||(symbol.endsWith('.BK')?'TH':symbol.includes('-')?'CRYPTO':'US');
    const ccy=x.ccy||x.currency||(market==='TH'?'฿':'$');
    return {symbol, name, market, ccy};
  }).filter(x=>x.symbol);
}
function decide(kl){
  const closes=kl.map(k=>k.c), price=closes[closes.length-1];
  const e20=ema(closes,20), e50=ema(closes,50), r=rsi(closes), at=atr(kl);
  const support=Math.min(...kl.slice(-40).map(k=>k.l)), resistance=Math.max(...kl.slice(-40).map(k=>k.h));
  const supDist=(price-support)/support*100, resDist=(resistance-price)/price*100;
  const ll=countLL(kl), hh=countHH(kl), rej=countRejection(kl);
  let dir=price>e20&&e20>e50?'UP':price<e20&&e20<e50?'DOWN':'SIDE';
  let decision=dir==='UP'?'LONG BIAS':dir==='DOWN'?'SHORT BIAS':'WAIT'; let reason='EMA+Trend '+dir;
  if(decision==='SHORT BIAS'&&supDist<1.5&&(rej.up>=1||ll>=3)){decision='WAIT / REVERSAL WATCH';reason+=' • ใกล้แนวรับ + Rejection - ห้าม Short ใส่แนวรับ';}
  if(decision==='LONG BIAS'&&resDist<1.5&&(rej.down>=1||hh>=3)){decision='WAIT / REVERSAL WATCH';reason+=' • ใกล้แนวต้าน + Rejection - ห้าม Long ใส่แนวต้าน';}
  if(ll>=4&&supDist<2){decision='WAIT / REVERSAL WATCH';reason+=' • EXHAUSTION LL 4 ครั้ง';}
  if(hh>=4&&resDist<2){decision='WAIT / REVERSAL WATCH';reason+=' • EXHAUSTION HH 4 ครั้ง';}
  if(!at||at<=0){decision='BLOCK / NO SL';reason+=' • ATR หาย คำนวณ SL ไม่ได้';}
  return {price,e20,e50,r,at,support,resistance,supDist,resDist,ll,hh,rej,decision,reason};
}
function backtest(kl){
  let wins=0,total=0,pnls=[];
  for(let i=kl.length-25;i<kl.length-5;i++){if(i<50)continue;const closes=kl.slice(0,i+1).map(k=>k.c);const e20=ema(closes,20);const dir=closes[closes.length-1]>e20?'UP':'DOWN';const entry=kl[i].c,exit=kl[i+5]?.c;if(!exit)continue;const pct=(exit-entry)/entry*100;let win=dir==='UP'?pct>0:pct<0;total++;if(win)wins++;pnls.push(pct*(dir==='DOWN'?-1:1));}
  return {wr:total?Math.round(wins/total*100):0,total,avg:pnls.length?pnls.reduce((a,b)=>a+b,0)/pnls.length:0};
}
async function runAll(){
  document.getElementById('status').innerHTML='⏳ กำลังโหลด config + whitelist (ลองทั้ง data/ และ Root)...';
  try{ const c=await loadJSONAny(['data/config.json','config.json']); CONFIG=c.j; }catch(e){ CONFIG={portfolio:{paperBalance:1000,riskPerRoundPct:1},paperTest:{requiredRounds:20}}; logErr('CONFIG FALLBACK','ใช้ค่าเริ่มต้น - '+e.message); }
  try{ const w=await loadJSONAny(['data/whitelist.json','whitelist.json']); ASSETS=normalizeWhitelist(w.j); if(!ASSETS.length) throw new Error('whitelist ว่าง / ชื่อฟิลด์ไม่ตรง'); }
  catch(e){ logErr('WHITELIST FALLBACK','ใช้ Whitelist สำรองในโค้ด - '+e.message); ASSETS=FALLBACK; }
  document.getElementById('status').innerHTML='⏳ โหลด Whitelist ได้ '+ASSETS.length+' ตัว: '+ASSETS.map(a=>a.symbol).join(', ')+' — กำลังดึงข้อมูลจริง...';
  let rows=[];
  for(const a of ASSETS){
    try{ const kl=await fetchYahoo(a.symbol); const d=decide(kl); const bt=backtest(kl); rows.push({...a,...d,bt}); }
    catch(e){ logErr('FETCH FAIL', a.symbol+' - '+e.message); rows.push({...a,price:0,decision:'NO DATA',reason:'ดึง '+a.symbol+' ไม่ได้: '+e.message,bt:{wr:0,total:0,avg:0},e20:0,e50:0,r:0,at:0,support:0,resistance:0,supDist:0,resDist:0,ll:0,hh:0,rej:{up:0,down:0}}); }
  }
  const byM=m=>rows.filter(r=>r.market===m);
  const sumM=m=>{const rs=byM(m).filter(r=>r.bt.total>0);return {avgWr:rs.length?Math.round(rs.reduce((a,b)=>a+b.bt.wr,0)/rs.length):0,avgPnl:rs.length?rs.reduce((a,b)=>a+b.bt.avg,0)/rs.length:0,losers:rs.filter(r=>r.bt.wr<50).map(r=>r.name)};};
  const sC=sumM('CRYPTO'),sU=sumM('US'),sT=sumM('TH');
  document.getElementById('summary').innerHTML=`<table><tr><th>ตลาด</th><th>Win Rate เฉลี่ย</th><th>กำไร/ขาดทุนเฉลี่ย</th><th>ตัวที่ขาดทุน (Win <50%)</th></tr>
  <tr><td>🪙 Crypto</td><td><b>${sC.avgWr}%</b></td><td>${sC.avgPnl>=0?'+':''}${sC.avgPnl.toFixed(2)}%</td><td>${sC.losers.join(', ')||'—'}</td></tr>
  <tr><td>🇺🇸 หุ้น US</td><td><b>${sU.avgWr}%</b></td><td>${sU.avgPnl>=0?'+':''}${sU.avgPnl.toFixed(2)}%</td><td>${sU.losers.join(', ')||'—'}</td></tr>
  <tr><td>🇹🇭 หุ้นไทย</td><td><b>${sT.avgWr}%</b></td><td>${sT.avgPnl>=0?'+':''}${sT.avgPnl.toFixed(2)}%</td><td>${sT.losers.join(', ')||'—'}</td></tr></table><small>Config: Risk ${CONFIG.portfolio.riskPerRoundPct}% / Paper ${CONFIG.portfolio.paperBalance} / ต้องครบ ${CONFIG.paperTest.requiredRounds} รอบ</small>`;
  document.getElementById('dash').innerHTML='<div class="grid">'+rows.map(r=>`<div class="asset"><b>${r.name} (${r.symbol})</b> • <span class="pill gray">${r.market}</span><div class="price">${r.ccy}${r.price?r.price.toLocaleString(undefined,{maximumFractionDigits:2}):'—'}</div><small>RSI ${r.r?r.r.toFixed(1):'—'} • EMA20 ${r.e20.toFixed(2)} • EMA50 ${r.e50.toFixed(2)} • ATR ${r.at?r.at.toFixed(2):'—'}</small><br><small>รับ ${r.support.toFixed(2)} (${r.supDist.toFixed(2)}%) • ต้าน ${r.resistance.toFixed(2)} (${r.resDist.toFixed(2)}%) • LL ${r.ll} • HH ${r.hh} • Rej↑ ${r.rej.up} • Rej↓ ${r.rej.down}</small><br><span class="pill ${r.decision.includes('LONG')?'green':r.decision.includes('SHORT')?'red':r.decision.includes('REVERSAL')?'yellow':'gray'}">${r.decision}</span><br><small>${r.reason}</small><br><div style="margin-top:8px;background:#111936;border-radius:10px;padding:10px"><b>Backtest:</b> Win Rate <b>${r.bt.wr}%</b> (${r.bt.total} เทรด) • ${r.bt.avg>=0?'+':''}${r.bt.avg.toFixed(2)}% ${r.bt.wr<50&&r.bt.total>0?'• <span style="color:#f87171">⚠️ ตัวนี้ขาดทุนด้วยกลยุทธ์นี้</span>':r.bt.wr>=50?'• ✅ ตัวนี้กำไรด้วยกลยุทธ์นี้':''}</div></div>`).join('')+'</div>';
  document.getElementById('status').innerHTML='✅ ทดสอบครบ 3 ตลาดแล้ว — ถ้ายังขึ้น NO DATA แปลว่า Yahoo/Proxy ติด CORS ให้กด RUN ใหม่อีกรอบ';
}
window.addEventListener('load',runAll);
