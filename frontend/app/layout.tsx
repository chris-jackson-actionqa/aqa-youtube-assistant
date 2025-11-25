import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import { ProjectProvider } from "./contexts/ProjectContext";
import WorkspaceSelector from "./components/workspace/WorkspaceSelector";

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
        <WorkspaceProvider>
          <ProjectProvider>
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-center gap-8">
                    <Link
                      href="/"
                      className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                    >
                      YouTube Assistant
                    </Link>
                    <nav aria-label="Main navigation">
                      <ul className="flex items-center gap-6">
                        <li>
                          <Link
                            href="/templates"
                            className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                          >
                            Templates
                          </Link>
                        </li>
                      </ul>
                    </nav>
                  </div>
                  <div className="flex items-center">
                    <WorkspaceSelector />
                  </div>
                </div>
              </div>
            </header>
            <main id="main-content">{children}</main>
          </ProjectProvider>
        </WorkspaceProvider>
      </body>
    </html>
  );
}
