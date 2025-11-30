import * as React from "react";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import {
  ArchiveBoxXMarkIcon,
  ChevronDownIcon,
  PencilIcon,
  Square2StackIcon,
  TrashIcon,
} from '@heroicons/react/16/solid'
// import {
//   Popover,
//   PopoverTrigger,
//   PopoverContent,
// } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Getting Started",
      url: "#",
      items: [
        {
          title: "Installation",
          url: "#",
        },
        {
          title: "Project Structure",
          url: "#",
        },
      ],
    },
    {
      title: "Building Your Application",
      url: "#",
      items: [
        {
          title: "Routing",
          url: "#",
        },
        {
          title: "Data Fetching",
          url: "#",
          isActive: true,
        },
        {
          title: "Rendering",
          url: "#",
        },
        {
          title: "Caching",
          url: "#",
        },
        {
          title: "Styling",
          url: "#",
        },
        {
          title: "Optimizing",
          url: "#",
        },
        {
          title: "Configuring",
          url: "#",
        },
        {
          title: "Testing",
          url: "#",
        },
        {
          title: "Authentication",
          url: "#",
        },
        {
          title: "Deploying",
          url: "#",
        },
        {
          title: "Upgrading",
          url: "#",
        },
        {
          title: "Examples",
          url: "#",
        },
      ],
    },
    {
      title: "API Reference",
      url: "#",
      items: [
        {
          title: "Components",
          url: "#",
        },
        {
          title: "File Conventions",
          url: "#",
        },
        {
          title: "Functions",
          url: "#",
        },
        {
          title: "next.config.js Options",
          url: "#",
        },
        {
          title: "CLI",
          url: "#",
        },
        {
          title: "Edge Runtime",
          url: "#",
        },
      ],
    },
    {
      title: "Architecture",
      url: "#",
      items: [
        {
          title: "Accessibility",
          url: "#",
        },
        {
          title: "Fast Refresh",
          url: "#",
        },
        {
          title: "Next.js Compiler",
          url: "#",
        },
        {
          title: "Supported Browsers",
          url: "#",
        },
        {
          title: "Turbopack",
          url: "#",
        },
      ],
    },
    {
      title: "Community",
      url: "#",
      items: [
        {
          title: "Contribution Guide",
          url: "#",
        },
      ],
    },
  ],
};

export function AppSidebar({
  username = "User",
  email = "",
  onLogout = () => { },
  ...props
}) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Menu as="div" className="relative">
              <MenuButton as={SidebarMenuButton} size="lg" className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground pr-2">
                <img
                  src="/default_user.png"
                  alt={`${username} avatar`}
                  className="size-8 rounded-lg object-cover"
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{username}</span>
                  <span
                    className="truncate text-xs text-muted-foreground"
                    title={email}
                  >
                    {email}
                  </span>
                </div>
                <ChevronDownIcon className="ml-auto size-4" />
              </MenuButton>
              <MenuItems
                transition
                anchor="bottom start"
                className="w-64 origin-top-left rounded-xl border border-border bg-popover p-1 text-sm/6 text-popover-foreground shadow-lg transition duration-100 ease-out [--anchor-gap:4px] focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 z-50"
              >
                <div className="p-1">
                  <MenuItem>
                    {({ active }) => (
                      <button
                        onClick={onLogout}
                        className={`${active ? "bg-accent text-accent-foreground" : "text-popover-foreground"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        View Profile
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ active }) => (
                      <button
                        onClick={onLogout}
                        className={`${active ? "bg-accent text-accent-foreground" : "text-popover-foreground"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        Switch Account
                      </button>
                    )}
                  </MenuItem>
                  <div className="my-1 h-px bg-border" />
                  <MenuItem>
                    {({ active }) => (
                      <button
                        onClick={onLogout}
                        className={`${active ? "bg-destructive text-destructive-foreground" : "text-destructive"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        Logout
                      </button>
                    )}
                  </MenuItem>
                </div>
              </MenuItems>
            </Menu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader >
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url} className="font-medium">
                    {item.title}
                  </a>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub>
                    {item.items.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild isActive={item.isActive}>
                          <a href={item.url}>{item.title}</a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar >
  );
}
