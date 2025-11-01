import type { Metadata } from "next";
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
                  <div className="flex items-center">
                    <div className="text-xl font-semibold text-gray-900 dark:text-white">
                      YouTube Assistant
                    </div>
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
