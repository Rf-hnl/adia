"use client";

import Link from "next/link";
import { Menu, User, LogOut, Settings } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/icons";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/30 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-6 w-6" />
          <span className="font-bold text-lg">AdIA</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Button asChild variant="ghost">
            <Link href="/">Panel</Link>
          </Button>
          <Button variant="ghost">Integraciones</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-user.jpg" alt="@usuario" />
                  <AvatarFallback>
                    <User />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Equipo de Marketing
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    team@example.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/settings">
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle className="sr-only">Menú</SheetTitle>
                <SheetDescription className="sr-only">Navegación principal de la aplicación.</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-6 pt-8">
                <Link href="/" className="flex items-center gap-2 mb-4">
                    <Logo className="h-6 w-6" />
                    <span className="font-bold text-lg">AdIA</span>
                </Link>
                <div className="flex flex-col gap-2">
                    <SheetClose asChild>
                        <Link href="/" className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2">Panel</Link>
                    </SheetClose>
                    <SheetClose asChild>
                        <Link href="#" className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2">Integraciones</Link>
                    </SheetClose>
                    <SheetClose asChild>
                        <Link href="/settings" className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2">Configuración</Link>
                    </SheetClose>
                </div>
                <Separator />
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder-user.jpg" alt="@usuario" />
                      <AvatarFallback>
                        <User />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium leading-none">Equipo de Marketing</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        team@example.com
                      </p>
                    </div>
                  </div>
                  <SheetClose asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar sesión
                    </Button>
                  </SheetClose>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
