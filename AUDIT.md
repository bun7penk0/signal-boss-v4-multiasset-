AUDIT — SIGNAL BOSS V4
WARNING 1: Look-ahead Bias — แก้แล้ว
ใช้เฉพาะแท่งปิดแล้ว (slice(0,-1)) ทุก Timeframe
ทุก Decision ผูก Snapshot Close Time ของแท่งที่ปิดแล้ว
WARNING 2: Loop Risk — แก้แล้ว
Price Action มองย้อนหลังสูงสุด 40 แท่ง
LL/HH มอง 12 แท่ง, Rejection มอง 5 แท่ง
ไม่มีการ Loop เกินขอบเขตนี้
WARNING 3: State Conflict / side — แก้แล้ว
side ถูกมองข้ามเสมอ
Conflict = มีทั้ง up และ down พร้อมกันเท่านั้น
Reversal ใช้กฎเดียวกัน
ช่องโหว่ที่เติมใน v3.2
News Impact -5..+5 + Override <= -4 -> WAIT / NEWS BLOCK
SL BLOCK — ATR = 0 / หาย -> BLOCK, Size = 0, RiskBudget = 0
Adaptive Guard — Outcome ต้องครบ 20 รอบถึงเสนอปรับสูตรได้, ไม่ปรับอัตโนมัติ
