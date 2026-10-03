import "./globals.css";
export const metadata = { title: "Course site (demo)" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body>{children}</body></html>
  );
}
