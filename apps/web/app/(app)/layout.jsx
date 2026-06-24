import { AppShell } from "@/components/layout/app-shell";

export default function AuthenticatedLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}
