// SIGNAL BOSS V4 - app.js (โหลด config + whitelist จาก data/*.json)
let CONFIG=null, ASSETS=[], errs=[];
function logErr(t,m){errs.unshift({at:new Date().toLocaleString('th-TH'),t,m});document.getElementById('errBox').innerHTML=errs.map(e=>`<div style="border:1px solid #7f1d1d;border-radius:10px;padding:8px;margin-top:6px"><b>[${e.t}]</b> ${e.m}<br><small>${e.at}</small></div>`).join('');}
function exportLog(){const b=new Blob([errs.map(e=>`[${e.at}] [${e.t}] ${e.m}`).join('\n')],{type:'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='v4-multiasset-log.txt';a.click();}
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
  document.getElementById('status').innerHTML='⏳ กำลังโหลด config.json + whitelist.json + ดึงข้อมูลจริง 3 ตลาด...';
  try{
    CONFIG=await loadJSON('data/config.json');
    const wl=await loadJSON('data/whitelist.json');
    ASSETS=[...wl.crypto,...wl.us,...wl.th];
  }catch(e){logErr('JSON FAIL','โหลด data/*.json ไม่ได้ - '+e.message);document.getElementById('status').innerHTML='❌ โหลด JSON ไม่ได้ ตรวจว่าไฟล์อยู่ในโฟลเดอร์ data/ ครบ';return;}
  let rows=[];
  for(const a of ASSETS){
    try{const kl=await fetchYahoo(a.sym);const d=decide(kl);const bt=backtest(kl);rows.push({...a,...d,bt});}
    catch(e){logErr('FETCH FAIL',a.sym+' - '+e.message);rows.push({...a,price:0,decision:'NO DATA',reason:e.message,bt:{wr:0,total:0,avg:0},e20:0,e50:0,r:0,at:0,support:0,resistance:0,supDist:0,resDist:0,ll:0,hh:0,rej:{up:0,down:0}});}
  }
  const byM=m=>rows.filter(r=>r.market===m);
  const sumM=m=>{const rs=byM(m).filter(r=>r.bt.total>0);return {avgWr:rs.length?Math.round(rs.reduce((a,b)=>a+b.bt.wr,0)/rs.length):0,avgPnl:rs.length?rs.reduce((a,b)=>a+b.bt.avg,0)/rs.length:0,losers:rs.filter(r=>r.bt.wr<50).map(r=>r.name)};};
  const sC=sumM('CRYPTO'),sU=sumM('US'),sT=sumM('TH');
  document.getElementById('summary').innerHTML=`<table><tr><th>ตลาด</th><th>Win Rate เฉลี่ย</th><th>กำไร/ขาดทุนเฉลี่ย</th><th>ตัวที่ขาดทุน (Win <50%)</th></tr>
  <tr><td>🪙 Crypto</td><td><b>${sC.avgWr}%</b></td><td>${sC.avgPnl>=0?'+':''}${sC.avgPnl.toFixed(2)}%</td><td>${sC.losers.join(', ')||'—'}</td></tr>
  <tr><td>🇺🇸 หุ้น US</td><td><b>${sU.avgWr}%</b></td><td>${sU.avgPnl>=0?'+':''}${sU.avgPnl.toFixed(2)}%</td><td>${sU.losers.join(', ')||'—'}</td></tr>
  <tr><td>🇹🇭 หุ้นไทย</td><td><b>${sT.avgWr}%</b></td><td>${sT.avgPnl>=0?'+':''}${sT.avgPnl.toFixed(2)}%</td><td>${sT.losers.join(', ')||'—'}</td></tr></table><small>Config: Risk ${CONFIG.portfolio.riskPerRoundPct}% / Paper ${CONFIG.portfolio.paperBalance} / ต้องครบ ${CONFIG.paperTest.requiredRounds} รอบ</small>`;
  document.getElementById('dash').innerHTML='<div class="grid">'+rows.map(r=>`<div class="asset"><b>${r.name} (${r.sym})</b> • <span class="pill gray">${r.market}</span><div class="price">${r.ccy}${r.price?r.price.toLocaleString(undefined,{maximumFractionDigits:2}):'—'}</div><small>RSI ${r.r?r.r.toFixed(1):'—'} • EMA20 ${r.e20.toFixed(2)} • EMA50 ${r.e50.toFixed(2)} • ATR ${r.at?r.at.toFixed(2):'—'}</small><br><small>รับ ${r.support.toFixed(2)} (${r.supDist.toFixed(2)}%) • ต้าน ${r.resistance.toFixed(2)} (${r.resDist.toFixed(2)}%) • LL ${r.ll} • HH ${r.hh} • Rej↑ ${r.rej.up} • Rej↓ ${r.rej.down}</small><br><span class="pill ${r.decision.includes('LONG')?'green':r.decision.includes('SHORT')?'red':r.decision.includes('REVERSAL')?'yellow':'gray'}">${r.decision}</span><br><small>${r.reason}</small><br><div style="margin-top:8px;background:#111936;border-radius:10px;padding:10px"><b>Backtest:</b> Win Rate <b>${r.bt.wr}%</b> (${r.bt.total} เทรด) • ${r.bt.avg>=0?'+':''}${r.bt.avg.toFixed(2)}% ${r.bt.wr<50&&r.bt.total>0?'• <span style="color:#f87171">⚠️ ตัวนี้ขาดทุนด้วยกลยุทธ์นี้</span>':r.bt.wr>=50?'• ✅ ตัวนี้กำไรด้วยกลยุทธ์นี้':''}</div></div>`).join('')+'</div>';
  document.getElementById('status').innerHTML='✅ ทดสอบครบ 3 ตลาดแล้ว (โหลดจาก data/*.json + js/*.js)';
}
window.addEventListener('load',runAll);
