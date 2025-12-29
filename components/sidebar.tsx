"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Boxes,
  ClipboardList,
  FileSpreadsheet,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  Package,
  Users,
  Settings,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { ProfileDialog } from "@/components/profile/profile-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

const initialNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Boxes },
  { href: "/pl-master", label: "PL Master", icon: ClipboardList },
  { href: "/pl-slave", label: "PL Slave", icon: FileSpreadsheet },
];

function NavItems({ pathname, isCollapsed, onLinkClick, items }: { pathname: string; isCollapsed?: boolean; onLinkClick?: () => void; items: typeof initialNavItems }) {
  return (
    <nav className="grid items-start gap-1 px-2 text-sm font-medium lg:px-4">
      {items.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={label}
            href={href}
            onClick={onLinkClick}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 relative",
              isActive 
                ? "bg-primary/10 text-primary font-bold shadow-sm" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? label : undefined}
          >
            {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full" />
            )}
            <Icon className={cn(
                "h-5 w-5 transition-transform duration-200", 
                isActive ? "scale-110" : "group-hover:scale-110"
            )} />
            {!isCollapsed && <span>{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

interface UserInfo {
  username: string;
  role: string;
}

export function Sidebar({ isCollapsed, toggleSidebar }: { isCollapsed: boolean; toggleSidebar: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [navItems, setNavItems] = useState(initialNavItems);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          if (userData.role === "admin") {
            setNavItems([
              ...initialNavItems,
              { href: "/users", label: "Users", icon: Users },
            ]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user info", error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/login");
      } else {
        console.error("Logout failed:", await response.text());
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const UserMenu = ({ isMobile = false }: { isMobile?: boolean }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
            variant="ghost" 
            className={cn(
                "w-full flex items-center gap-3 p-2 h-auto hover:bg-muted/50 transition-all", 
                isCollapsed && !isMobile ? "justify-center px-0" : "justify-start px-2",
                "rounded-xl border border-transparent hover:border-border"
            )}
        >
          <Avatar className="h-9 w-9 border cursor-pointer">
            <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.username}&background=random`} alt={user?.username} />
            <AvatarFallback>{user?.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          {(!isCollapsed || isMobile) && (
             <div className="flex flex-col items-start text-left overflow-hidden transition-all duration-200">
                <span className="text-sm font-semibold truncate w-full max-w-[140px] leading-none mb-1">
                    {user?.username || "Guest"}
                </span>
                <span className="text-xs text-muted-foreground capitalize font-medium">
                    {user?.role || "Visitor"}
                </span>
             </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" side={isCollapsed && !isMobile ? "right" : "top"}>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.username}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.role} account
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => setIsProfileOpen(true)} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Edit Profile</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <ProfileDialog isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user} />
      <div className={cn("hidden border-r bg-muted/40 md:flex flex-col transition-all duration-300 h-screen sticky top-0", isCollapsed ? "w-[60px]" : "w-[240px]")}>
        <div className="flex h-14 shrink-0 items-center border-b px-4 lg:h-[60px] justify-between">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2 font-semibold truncate">
              <Package className="h-6 w-6" />
              <span>Hexing Inventory</span>
            </Link>
          )}
          {isCollapsed && (
             <div className="w-full flex justify-center"><Package className="h-6 w-6" /></div>
          )}
          {!isCollapsed && (
             <Button variant="ghost" size="icon" onClick={toggleSidebar} className="ml-auto">
               <ChevronsLeft className="h-4 w-4" />
             </Button>
          )}
        </div>
        
        {isCollapsed && (
             <div className="flex justify-center py-2 border-b shrink-0">
                <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
          <NavItems pathname={pathname} isCollapsed={isCollapsed} items={navItems} />
        </div>

        {/* User Profile Section */}
        <div className="mt-auto border-t bg-background p-2">
            <UserMenu />
        </div>
      </div>
    </>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [navItems, setNavItems] = useState(initialNavItems);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          if (userData.role === "admin") {
            setNavItems([
              ...initialNavItems,
              { href: "/users", label: "Users", icon: Users },
            ]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user info", error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

   const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full flex items-center justify-start gap-3 p-2 h-auto rounded-xl border border-transparent hover:bg-muted/50 hover:border-border">
          <Avatar className="h-9 w-9 border">
            <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.username}&background=random`} alt={user?.username} />
            <AvatarFallback>{user?.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left">
            <span className="text-sm font-semibold">{user?.username || "Guest"}</span>
            <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[240px]" align="start" side="top">
         <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
          <User className="mr-2 h-4 w-4" />
          Edit Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
    <ProfileDialog isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user} />
    <div className="flex h-14 shrink-0 items-center border-b bg-muted/40 px-4 md:hidden sticky top-0 z-50 backdrop-blur-sm">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0 w-[280px]">
          <SheetHeader className="p-4 border-b shrink-0">
             <SheetTitle className="flex items-center gap-2 font-semibold">
               <Package className="h-6 w-6" />
               Hexing Inventory
             </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto py-4">
             <NavItems pathname={pathname} onLinkClick={() => setOpen(false)} items={navItems} />
          </div>
          
          <div className="p-4 border-t bg-background">
             <UserMenu />
          </div>
        </SheetContent>
      </Sheet>
      <div className="ml-4 font-bold text-lg truncate">
        Hexing Inventory
      </div>
    </div>
    </>
  );
}