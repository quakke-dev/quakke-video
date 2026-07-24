import './global.css';

export const metadata = {
  title: 'Quakke Video',
  description: 'Video hosting platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
