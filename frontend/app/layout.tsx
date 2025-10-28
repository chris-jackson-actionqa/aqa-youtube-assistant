import type { Metadata } from "next";
import "./globals.css";
import { ProjectProvider } from "./contexts/ProjectContext";

export const metadata: Metadata = {
  title: "YouTube Assistant",
  description:
    "Helper for planning and making YouTube videos for the ActionaQA channel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ProjectProvider>{children}</ProjectProvider>
      </body>
    </html>
  );
}
