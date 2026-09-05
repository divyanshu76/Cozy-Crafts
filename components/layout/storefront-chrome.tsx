"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

interface StorefrontChromeProps {
  children: React.ReactNode;
}

export function StorefrontChrome({ children }: StorefrontChromeProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-1 relative z-10 bg-cream min-h-[50vh]">
        {children}
      </main>
      <Footer />
    </>
  );
}
