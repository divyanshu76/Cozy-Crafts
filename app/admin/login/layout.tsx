// This layout completely overrides the parent admin/layout.tsx for the login page.
// It renders without the sidebar or auth check so unauthenticated users can log in.
export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
