"use client"

import * as React from "react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  ListIcon,
  ReceiptIcon,
  NotebookPenIcon,
  ScrollTextIcon,
} from "lucide-react"

const data = {
  user: {
    name: "Max",
    email: "me@maxxfuu.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Accounts",
      url: "/accounts",
      icon: <ListIcon />,
    },
    {
      title: "Tax",
      url: "/tax",
      icon: <ReceiptIcon />,
    },
    {
      title: "Notes",
      url: "/notes",
      icon: <NotebookPenIcon />,
    },
  ],
  // Hidden for now - Settings/Get Help/Search (icons: CircleHelpIcon, SearchIcon):
  // navSecondary: [
  //   { title: "Get Help", url: "#", icon: <CircleHelpIcon /> },
  //   { title: "Search", url: "#", icon: <SearchIcon /> },
  // ],
  documents: [
    {
      name: "Receipt",
      url: "/receipt",
      icon: <ScrollTextIcon />,
    },
  ],
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="/dashboard" />}
            >
              <span className="text-base font-semibold">Bookie</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        {/* Settings (with theme toggle) only - Get Help/Search stay hidden. */}
        <NavSecondary items={[]} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
