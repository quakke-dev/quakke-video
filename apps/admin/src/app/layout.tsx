import './global.css';

export const metadata = {
  title: 'Quakke Admin',
  description: 'Administration workspace for Quakke Video',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
