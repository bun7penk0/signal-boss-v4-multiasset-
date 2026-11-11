Pipeline 5 ขั้น / 11 หมวด — SIGNAL BOSS V4
ขั้นที่ 1: Data Validation
Data Quality Gate — ตรวจ OHLC, ใช้เฉพาะแท่งปิดแล้ว (Closed Candle), ผูก Snapshot Close Time
Whitelist Control — ล็อกเฉพาะตัวที่ทดสอบ
ขั้นที่ 2: Context & Macro
Macro & News Intelligence — News Impact -5..+5, ถ้า <= -4 บังคับ WAIT / NEWS BLOCK
Market Structure & Exhaustion — นับ LL/HH, ครบ 4 ครั้ง + ชนแนว = EXHAUSTION
S/R Proximity — ใกล้แนวรับ/ต้าน < 1.5% + Rejection -> ลดระดับเป็น REVERSAL WATCH
ขั้นที่ 3: Technical & Trend
Technical — EMA20/50, RSI Wilder, ATR
MTF Engine — 15m / 30m / 1h / 4h (Crypto) / Daily (หุ้น) — Conflict = มีทั้ง up และ down เท่านั้น, side ไม่นับ
ขั้นที่ 4: Fusion & Decision
Intelligence Fusion — เอา Context มาหักล้าง Technical
Conflict Detector & Reversal Watch — MTF ขัดกัน หรือเสี่ยงกลับตัว -> WAIT / REVERSAL WATCH
ขั้นที่ 5: Risk & Learning
Risk Management Gate — Position Size จาก ATR, Macro Risk-Off x0.5, SL BLOCK ถ้า ATR หาย (Size=0)
Outcome Tracking & Adaptive Learning — บันทึก 1h/4h/24h, Guard 20 รอบก่อนเสนอปรับสูตร, ไม่ปรับอัตโนมัติ
