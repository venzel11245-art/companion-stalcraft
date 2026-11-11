import type { Metadata } from 'next'
import Sidebar from './components/Sidebar'
import DisclaimerBanner from './components/DisclaimerBanner' // 🔥 Добавлено
import Footer from './components/Footer' // 🔥 Добавлено
import './globals.css'

// Импортируем инициализацию сервера (запускает фоновый бот)
import { initializeServer } from '@/lib/server-init'

// Вызываем инициализацию на уровне модуля. 
// Выполнится один раз при старте Node.js процесса на сервере.
initializeServer()

export const metadata: Metadata = {
  title: 'TradeZon - Stalcraft Companion',
  description: 'TradeZon — помощник для игроков Stalcraft: аукцион, история цен, калькулятор оружия',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TradeZon',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      
      {/* 🔥 Добавлен flex-col, чтобы футер корректно прижимался к низу */}
      <body className="bg-gray-950 text-white min-h-screen flex flex-col">
        
        {/* 🔥 Баннер с предупреждением (фиксирован сверху) */}
        <DisclaimerBanner />

        <div className="flex flex-1">
          <Sidebar />

          {/* ОСНОВНОЙ КОНТЕНТ */}
          {/* pt-16 добавляет отступ сверху на мобильных, чтобы баннер не перекрывал контент */}
          <main className="flex-1 min-h-screen overflow-y-auto pt-16 md:pt-0">
            <div className="p-4 md:p-8 flex flex-col min-h-full">
              {children}
              
              {/* 🔥 Футер с отказом от ответственности (всегда внизу контента) */}
              <Footer />
            </div>
          </main>
        </div>

        {/* Скрипт для пробуждения сервера (оставлен как запасной вариант) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                fetch('/api/warmup', { method: 'GET' })
                  .then(res => res.json())
                  .then(data => console.log('Cache warmup:', data.message))
                  .catch(err => console.error('Warmup failed:', err));
              })();
            `,
          }}
        />

        {/* Eruda — консоль для отладки на телефоне */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/eruda';
                script.onload = function() { eruda.init(); };
                document.head.appendChild(script);
              })();
            `,
          }}
        />
      </body>
    </html>
  )
}