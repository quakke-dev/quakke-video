import './global.css';

export const metadata = {
  title: 'Quakke Studio',
  description: 'Creator workspace for Quakke Video',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
