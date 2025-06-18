import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  Outlet,
  useFetcher,
  useLoaderData,
  useNavigate,
  useLocation,
  isRouteErrorResponse,
  Link,
  useRouteError,
  NavLink,
  useNavigation,
} from "@remix-run/react";
import {
  Apple,
  ChevronDown,
  Maximize2,
  Minus,
  Square,
  X,
  Menu,
  Monitor,
  BadgeCheck,
  LogOut,
  Moon,
  Settings2,
  Sun,
  AlertTriangle,
  MenuIcon,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { ThemeToggle } from "~/components/val/theme-provider";
import { EmployeeOfTheMonth } from "~/components/EmployeeOfTheMonth";
import { TinyEmployeeOfTheMonth } from "~/components/TinyEmployeeOfTheMonth";

import { LoaderFunction } from "@remix-run/node";
import { authService } from "~/services/auth.service.server";
import { employeeOfTheMonthService } from "~/services/employeeOfTheMonth.service.server";
import { getByUrl, navigationsDataSet } from "~/datas/navigations";
import { PermissionCondition } from "~/core/entities/utils/access-permission";
import { NavigationItem } from "~/types/global"; // If you keep your NavigationItem interface in a separate file


export const loader: LoaderFunction = async ({ request }) => {
  const user = await authService.requireUser(request);
  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") || "all";

  //console.log("User: ", user);

  // Helper function to filter items by permission
  const filterNavWithPermissions = async (
    items: NavigationItem[],
    user: { id: string }
  ): Promise<NavigationItem[]> => {
    const filteredItems: NavigationItem[] = [];
    for (const item of items) {
      const canAccess =
        (await authService.can(
          user.id as string,
          item.condition as PermissionCondition
        )) || !item.condition;

      if (!canAccess) {
        continue;
      }
      // Recursively filter children
      const children = item.taskbarChildren
        ? await filterNavWithPermissions(item.taskbarChildren, user)
        : [];
      filteredItems.push({
        ...item,
        taskbarChildren: children,
      });
    }
    return filteredItems;
  };

  // 1) Filter each part of navDatas individually
  const filteredNavAllUsers = await filterNavWithPermissions(
    navigationsDataSet.navAllUsers,
    user
  );
  const filteredNavHRManagers = await filterNavWithPermissions(
    navigationsDataSet.navHRManagers,
    user
  );
  const filteredNavGeneralManagement = await filterNavWithPermissions(
    navigationsDataSet.navGeneralManagement,
    user
  );

  // 2) For determining "activeTaskbarItems", we can combine them:
  const combinedNavItems = [
    ...filteredNavAllUsers,
    ...filteredNavHRManagers,
    ...filteredNavGeneralManagement,
  ];

  // 3) Derive activeTaskbarItems from partial/exact matching
  const currentPath = url.pathname;
  const currentItem =
    combinedNavItems.find((item) => {
      if (currentPath.startsWith(item.url)) {
        return (
          item.taskbarChildren?.some((child) => child.url === currentPath) ||
          true
        );
      }
      return false;
    }) || combinedNavItems[0];

  const exactMatch = combinedNavItems.find((item) =>
    item.taskbarChildren?.some((child) => child.url === currentPath)
  );

  const partialMatch = combinedNavItems.find((item) =>
    item.taskbarChildren?.some((child) => {
      const [childUrlPath] = child.url.split("?");
      const [currentPathPath] = currentPath.split("?");
      const childUrlSegments = childUrlPath.split("/");
      const currentPathSegments = currentPathPath.split("/");

      if (childUrlSegments.length !== currentPathSegments.length) {
        return false;
      }

      return childUrlSegments.every(
        (segment, index) =>
          segment === "{id}" || segment === currentPathSegments[index]
      );
    })
  );

  const activeItem = partialMatch || exactMatch || currentItem;
  const activeTaskbarItems = activeItem?.taskbarChildren || [];

  // 4) Return data in the shape we want
  const employeeOfThisMonth =
    await employeeOfTheMonthService.getWinnerForPeriod();

  return Response.json({
    user,
    employeeOfThisMonth,
    activeTab: tab,
    activeTaskbarItems,
    // Return them in the same shape of navDatas, but under "filteredNavData"
    filteredNavData: {
      navAllUsers: filteredNavAllUsers,
      navHRManagers: filteredNavHRManagers,
      navGeneralManagement: filteredNavGeneralManagement,
    },
  });
};

// Write a function which on sidebar item from filteredNavData, find the correspond item in navigationsDataSet

////////////////////////////////////////////////////////////////////////////////
// 1) A small custom hook to track screen size (Solution A approach)
////////////////////////////////////////////////////////////////////////////////
function useIsSmallScreen() {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsSmallScreen(window.innerWidth < 768);
    }
    handleResize(); // set initial value on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isSmallScreen;
}

////////////////////////////////////////////////////////////////////////////////
// 2) DesktopAppLayout: The main component
////////////////////////////////////////////////////////////////////////////////
export default function DesktopAppLayout() {
  const [theme, setTheme] = useState("light");
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMaximized, setIsMaximized] = useState(false);
  const [layoutStyle, setLayoutStyle] = useState<"macos" | "windows">("windows");
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return true;
  });

  // === Use the custom hook ===
  const isOnSmallScreen = useIsSmallScreen();

  // === Grab data from the loader ===
  const {
    user,
    employeeOfThisMonth,
    activeTab: activeTabFromServer,
    activeTaskbarItems,
    filteredNavData, // Our object with { navAllUsers, navHRManagers, navGeneralManagement }
  } = useLoaderData<typeof loader>();

  // Local state for the active tab
  const [activeTab, setActiveTab] = useState(activeTabFromServer);

  // Maximize or restore window (for demonstration)
  const handleMaximize = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsMaximized(false);
    } else {
      document.documentElement.requestFullscreen();
      setIsMaximized(true);
    }
  };

  // Open/close sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
    fetch("/api/set-theme", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        isSidebarOpen: isSidebarOpen === true ? false : true,
      }),
    });
  };

  // Logout user
  const logout = () => {
    fetcher.submit(null, { method: "post", action: "/logout" });
  };

  // Navigate to item.url with the active tab
  const handleNavItemClick = (url: string) => {
    navigate(`${url}?tab=${activeTab}`);
  };

  // Keep ?tab= in the URL updated
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", value);
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params.toString()}`
    );
  };

  // Listen for screen resizes
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // For bottom taskbar items that rely on the current route param
  const taskBarItemLinkWithParent = (
    child: string,
    queries: Record<string, string> = {}
  ) => {
    const url = location.pathname;
    const id = url.split("/").pop() as string;
    const newUrl = child.replace("{id}", id);
    let finalUrl = newUrl;

    const searchParams = new URLSearchParams(queries);
    const search = searchParams.toString();
    if (search) {
      if (newUrl.includes("?")) {
        finalUrl = `${newUrl}&${search}`;
      } else {
        finalUrl = `${newUrl}?${search}`;
      }
    }
    return finalUrl;
  };

  // This function return "active" or "" if the current url is in his taskbarChildren
  const inferedCn = (
    item: NavigationItem
  ) => {
    return item.taskbarChildren?.some((child) => child.url === location.pathname)
      ? "active"
      : "";
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-background text-foreground",
        layoutStyle === "macos" ? "font-sans" : "font-sans-serif"
      )}
    >
      {/* ========== Titlebar (Mac or Windows style controls) ========== */}
      <div
        className={cn(
          "flex flex-col px-4 bg-secondary",
          "shadow-xl border-0 border-e-primary-foreground"
        )}
      >
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center flex-1">
            {layoutStyle === "macos" && (
              <div className="flex space-x-2 mr-4">
                <button
                  className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600"
                  onClick={() => window.close()}
                />
                <button
                  className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600"
                  onClick={() => setIsMaximized(!isMaximized)}
                />
                <button
                  className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600"
                  onClick={handleMaximize}
                />
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          {/* Tiny Employee of the Month in the center (if any) */}
          <div className="flex-1 text-center">
            {employeeOfThisMonth && (
              <TinyEmployeeOfTheMonth
                employeeOfThisMonth={employeeOfThisMonth}
              />
            )}
          </div>

          {/* Right side actions: theme toggle, layout style toggle, etc. */}
          <div className="flex items-center space-x-2 flex-1 justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ThemeToggle />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {theme === "dark"
                      ? "Passer en mode clair"
                      : "Passer en mode sombre"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setLayoutStyle(
                        layoutStyle === "macos" ? "windows" : "macos"
                      )
                    }
                  >
                    {layoutStyle === "macos" ? (
                      <Apple className="h-4 w-4" />
                    ) : (
                      <Monitor className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {layoutStyle === "macos"
                      ? "Passer au style Windows"
                      : "Passer au style macOS"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider> */}

            {layoutStyle === "windows" && (
              <>
                {/* <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.close()}
                >
                  <Minus className="h-4 w-4" />
                </Button> */}
                <Button variant="ghost" size="icon" onClick={handleMaximize}>
                  {isMaximized ? (
                    <Square className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                {/* <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.close()}
                >
                  <X className="h-4 w-4" />
                </Button> */}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ========== Main Layout (Sidebar & Content) ========== */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Card */}
        <Card
          className={cn(
            "flex flex-col border-r rounded-none transition-all duration-300 ease-in-out",
            isSidebarOpen ? "w-64" : "w-0",
            "md:relative absolute z-10 h-full shadow-xl border-2 border-e-primary-foreground"
          )}
        >
          {isSidebarOpen && (
            <>
              {/* Optionally show big EmployeeOfTheMonth */}
              <div className="w-full max-w-sm">
                {employeeOfThisMonth && (
                  <EmployeeOfTheMonth
                    employeeOfThisMonth={employeeOfThisMonth}
                  />
                )}
              </div>

              {/* Tabs for user vs HR vs Management */}
              <Tabs
                value={activeTab}
                className="flex-1 flex flex-col"
                onValueChange={handleTabChange}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">Tous</TabsTrigger>
                  <TabsTrigger value="hr">RH</TabsTrigger>
                  <TabsTrigger value="management">Direction</TabsTrigger>
                </TabsList>

                {/* ScrollArea for the sidebar menu items */}
                <ScrollArea className="flex-1">
                  <TabsContent value="all" className="m-0">
                    <SidebarContent
                      items={filteredNavData.navAllUsers}
                      tab={activeTab}
                      inferedCn={inferedCn}
                    />
                  </TabsContent>
                  <TabsContent value="hr" className="m-0">
                    <SidebarContent
                      tab={activeTab}
                      inferedCn={inferedCn}
                      items={filteredNavData.navHRManagers}
                    />
                  </TabsContent>
                  <TabsContent value="management" className="m-0">
                    <SidebarContent
                      tab={activeTab}
                      inferedCn={inferedCn}
                      items={filteredNavData.navGeneralManagement}
                    />
                  </TabsContent>
                </ScrollArea>
              </Tabs>

              <Separator />

              {/* User dropdown at bottom of the sidebar */}
              <div className="p-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between">
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={user.avatar?.file?.url} />
                          <AvatarFallback>
                            {(user.firstName + " " + user.lastName)
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <strong>
                          {user.firstName} {user.lastName}
                        </strong>
                      </div>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      onClick={() => navigate(`/o/users/view/${user.id}`)}
                    >
                      <BadgeCheck className="mr-2 h-4 w-4" />
                      <span>Compte</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      <Sun className="mr-2 h-4 w-4" />
                      <span>Thème clair</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      <Moon className="mr-2 h-4 w-4" />
                      <span>Thème sombre</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>
                      <Settings2 className="mr-2 h-4 w-4" />
                      <span>Thème système</span>
                    </DropdownMenuItem>
                    <Separator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Se déconnecter</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </Card>

        {/* ========== The Page Content (Outlet) ========== */}
        <div className="flex-1 mb-10 overflow-x-scroll">
          <Outlet />
        </div>
      </div>

      {/* ========== Taskbar Footer ========== */}
      <div
        className={cn(
          "h-16 bg-secondary/70 backdrop-blur-md flex items-end overflow-x-auto px-4 mx-4",
          "justify-center shadow-xl fixed bottom-0 left-0 right-0"
        )}
      >
        <TooltipProvider>
          {activeTaskbarItems.map(
            (
              {
                icon,
                label,
                url,
              }: { icon: React.ComponentType; label: string; url: string },
              index: number
            ) => {
              const IconComponent = typeof icon === "function" ? icon : null;
              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <NavLink to={`${url}?tab=${activeTab}`} className="pl-2 pr-2">
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start mb-4 whitespace-nowrap ",
                          index === 0 && "ml-5"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {IconComponent && <IconComponent />}
                          <span>{label}</span>
                        </div>
                      </Button>
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }
          )}
        </TooltipProvider>
      </div>
    </div>
  );
}

////////////////////////////////////////////////////////////////////////////////
// 3) SidebarContent: Renders a list of items
////////////////////////////////////////////////////////////////////////////////
function SidebarContent({
  items,
  inferedCn,
  tab,
}: {
  items: {
    title: string;
    url: string;
    icon: React.ComponentType;
  }[];
  inferedCn?: (item: NavigationItem) => "" | "active";
  tab?: string;
}) {
  const renderItemIcon = (url: string) => {
    const item = getByUrl(url);
    return item?.icon ? <item.icon className="mr-2 h-4 w-4" /> : null;
  };

  return (
    <div className="space-y-2 p-2">
      {items.map((item) => {
        
        return (
        
        <TooltipProvider key={item.title}>
          <Tooltip>
            <TooltipTrigger asChild>
               <NavLink to={`${item.url}?tab=${tab}`} className={inferedCn && inferedCn(item)}>
                <Button variant="ghost" className="w-full justify-start ">
                  <div className="flex items-center gap-2">
                    {renderItemIcon(item.url)}
                    <span>{item.title}</span>
                  </div>
                </Button>
              </NavLink> 
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.title}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
      }
      )}
    </div>
  );
}

////////////////////////////////////////////////////////////////////////////////
// 4) ErrorBoundary: Handle errors in your route
////////////////////////////////////////////////////////////////////////////////
export function ErrorBoundary() {
  const error = useRouteError();
  console.error("Error details:", error);

  let errorTitle: string;
  let errorMessage: string;
  let statusCode: number | null = null;

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    errorTitle = `${error.status} ${error.statusText}`;
    errorMessage =
      error.data.message || "Une erreur inattendue s'est produite.";
  } else {
    errorTitle = "Erreur Inattendue";
    errorMessage =
      error instanceof Error
        ? error.message
        : "Une erreur inattendue s'est produite lors du chargement de la page.";
  }

  switch (statusCode) {
    case 403:
      errorTitle = "403 Accès Refusé";
      errorMessage =
        "Vous n'avez pas la permission d'accéder à cette ressource.";
      break;
    case 404:
      errorTitle = "404 Page Introuvable";
      errorMessage =
        "La ressource que vous cherchez n'existe pas ou a été supprimée.";
      break;
    case 500:
      errorTitle = "500 Erreur Interne du Serveur";
      errorMessage =
        "Une erreur est survenue sur le serveur. L'équipe a été informée.";
      break;
    case 400:
      console.warn("400 Mauvaise Requête: ", errorMessage);
      return null;
    default:
      break;
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="mr-2 h-5 w-5" />
            {errorTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{errorMessage}</p>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button asChild variant="outline">
            <Link prefetch="intent" to="..">
              Retour
            </Link>
          </Button>
          <Button onClick={() => window.location.reload()}>Réessayer</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
