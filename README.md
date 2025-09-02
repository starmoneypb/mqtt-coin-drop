# Next.js MQTT Payment Simulator (GitHub Pages Ready)

ฟรอนต์เอนด์ Next.js แบบ Static Export สำหรับ Publish คำสั่งจำลองจ่ายเงิน (COINDROP) ไปยัง MQTT topic `device/ESP32-D15644`
ผ่าน **Eclipse Mosquitto** test broker

- Broker (WebSocket Secure): `wss://test.mosquitto.org:8081/mqtt`
- Topic: `device/ESP32-D15644`
- ปุ่ม: `30 THB`, `40 THB`, `50 THB` (มี Loading + Cooldown 5 วินาทีร่วมกัน)

> หมายเหตุ: เบราว์เซอร์ **เชื่อมต่อ TCP 1883 โดยตรงไม่ได้** ต้องใช้ MQTT-over-WebSocket (WSS/8081) จึงปรับเป็น `wss://test.mosquitto.org:8081/mqtt` ให้ใช้งานบน GitHub Pages ได้

## รันบนเครื่อง

```bash
npm i
npm run dev          # http://localhost:3000
# ตรวจสอบว่า UI ต่อ broker ได้ (Connected) แล้วลองกดปุ่ม publish
```

## Build & Export แบบ Static

```bash
npm run build
npm run export
# โค้ด static จะอยู่ในโฟลเดอร์ ./out
```

## Deploy ขึ้น GitHub Pages (Project Pages)

1. สร้าง repo และ push โค้ดนี้ขึ้น branch `main`
2. ใช้ GitHub Actions ที่เตรียมไว้ใน `.github/workflows/gh-pages.yml`  
   Action จะ build + export แล้ว publish โฟลเดอร์ `out` ไปที่ branch `gh-pages`
3. ไปที่ **Settings → Pages** เลือก Source = `Deploy from a branch`, Branch = `gh-pages`

### การตั้งค่า Base Path อัตโนมัติ
ไฟล์ `next.config.mjs` รองรับตัวแปร `BASE_PATH` (เช่น `/your-repo-name`).  
Workflow ได้ตั้งค่าเป็น `/${{ github.event.repository.name }}` อัตโนมัติแล้ว ไม่ต้องแก้โค้ดเพิ่ม

## ปรับแต่งผ่าน Environment Variables

- `NEXT_PUBLIC_MQTT_URL` : (ค่าเริ่มต้น `wss://test.mosquitto.org:8081/mqtt`)
- `NEXT_PUBLIC_MQTT_TOPIC` : (ค่าเริ่มต้น `device/ESP32-D15644`)

> ถ้าจะ build สำหรับ GitHub Pages: ตั้งค่า `BASE_PATH` เป็น `/<repo>` ตอน build/export (workflow ทำให้แล้ว)

## สถาปัตยกรรมโดยสรุป
- Next.js (App Router) + Static Export (ไม่มีเซิร์ฟเวอร์รันไทม์)
- ใช้ `mqtt/dist/mqtt.min.js` (เวอร์ชัน browser) เพื่อหลีกเลี่ยงปัญหา polyfill ของ Node APIs
- QoS=1 เพื่อรอ PUBACK แล้วจึงเริ่มนับ cooldown 5 วินาที
- UI responsive / ปุ่มจัดกึ่งกลาง / Loading ชัดเจน / แถบ progress cooldown

## ทดสอบ Publish ด้วย MQTT CLI (ออปชัน)
คุณสามารถ subscribe เพื่อดูข้อความได้จากเครื่องอื่น ๆ เช่น
```bash
mosquitto_sub -h test.mosquitto.org -p 1883 -t device/ESP32-D15644 -v
```

---

© 2025
