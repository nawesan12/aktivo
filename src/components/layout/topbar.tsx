"use client";

import { useSession } from "next-auth/react";
import { Menu, Moon, Sun } from "lucide-react";
import { CommandSearch } from "@/components/dashboard/command-search";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUIStore } from "@/stores/ui-store";
import { useTheme } from "@/components/providers/theme-provider";
import { signOut } from "next-auth/react";
import Link from "next/link";

export function Topbar() {
  const { data: session } = useSession();
  const { setMobileNavOpen } = useUIStore();
  const { theme, toggleTheme } = useTheme();

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>

        <CommandSearch />
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>

        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/mi-cuenta">Mi cuenta</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/panel/configuracion">Configuración</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
