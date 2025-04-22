import { ReactNode, useState } from "react";
import Navbar from "./navbar";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  activeTab: string;
}

export default function AppShell({ children, activeTab }: AppShellProps) {
  const [currentTab, setCurrentTab] = useState(activeTab);
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar activeTab={currentTab} onTabChange={setCurrentTab} />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
