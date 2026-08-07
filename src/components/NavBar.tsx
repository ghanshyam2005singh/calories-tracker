"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/diary", label: "Diary" },
  { href: "/calendar", label: "Calendar" },
  { href: "/foods", label: "Foods" },
  { href: "/progress", label: "Progress" },
  { href: "/settings", label: "Settings" },
];

export default function NavBar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header
      className="sticky top-0 z-10 border-b border-gray-200 bg-white"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-2 py-2 sm:px-4 sm:py-3">
        <nav className="flex flex-1 gap-1 overflow-x-auto [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-md px-2.5 py-1.5 text-sm font-medium sm:px-3 ${
                  active
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="shrink-0 rounded-md px-2.5 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 sm:px-3"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
