import type { PropsWithChildren } from 'react';

import { AppRuntimeInfo } from './components/AppRuntimeInfo';
import { LocaleProvider } from './components/locale/LocaleProvider';
import { ThemeProvider } from './components/theme/ThemeProvider';
import './globals.css';

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="ru">
      <body>
        <LocaleProvider>
          <ThemeProvider>
            <AppRuntimeInfo />
            {children}
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
