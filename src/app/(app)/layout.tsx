import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense fallback={<div className="h-14 border-b border-neutral-200 dark:border-neutral-800" />}>
        <SiteHeader />
      </Suspense>
      {children}
    </>
  );
}
