import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
// hooks
import useTheme from "hooks/use-theme";
// components
import { NotificationPopover } from "components/notifications";
import { Tooltip } from "components/ui";
// icons
import {
  BarChartRounded,
  GridViewOutlined,
  TaskAltOutlined,
  WorkOutlineOutlined,
} from "@mui/icons-material";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// locations
import { useTranslation } from 'next-i18next'

const workspaceLinks = (workspaceSlug: string) => [
  {
    Icon: GridViewOutlined,
    name: "dashboard",
    href: `/${workspaceSlug}`,
  },
  {
    Icon: BarChartRounded,
    name: "analytics",
    href: `/${workspaceSlug}/analytics`,
  },
  {
    Icon: WorkOutlineOutlined,
    name: "projects",
    href: `/${workspaceSlug}/projects`,
  },
  {
    Icon: TaskAltOutlined,
    name: "my-issues",
    href: `/${workspaceSlug}/me/my-issues`,
  },
];

export const WorkspaceSidebarMenu = () => {
  const store: any = useMobxStore();

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { collapsed: sidebarCollapse } = useTheme();

  const { t } = useTranslation()


  return (
    <div className="w-full cursor-pointer space-y-1 p-4">
      {workspaceLinks(workspaceSlug as string).map((link, index) => {
        const isActive =
          link.name === "Settings"
            ? router.asPath.includes(link.href)
            : router.asPath === link.href;

        return (
          (<Link key={index} href={link.href} className="block w-full">

            <Tooltip
              tooltipContent={link.name}
              position="right"
              className="ml-2"
              disabled={!store?.theme?.sidebarCollapsed}
            >
              <div
                className={`group flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium outline-none ${
                  isActive
                    ? "bg-custom-primary-100/10 text-custom-primary-100"
                    : "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80 focus:bg-custom-sidebar-background-80"
                } ${store?.theme?.sidebarCollapsed ? "justify-center" : ""}`}
              >
                {<link.Icon fontSize="small" />}
                {!store?.theme?.sidebarCollapsed && t(link.name)}
              </div>
            </Tooltip>

          </Link>)
        );
      })}

      <NotificationPopover />
    </div>
  );
};
