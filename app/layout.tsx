import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MQTT Payment Simulator',
  description: 'Publish COINDROP messages to device/ESP32-D15644 via Mosquitto test server',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
