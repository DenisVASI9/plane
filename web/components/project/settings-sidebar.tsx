import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {useTranslation} from 'next-i18next';

export const SettingsSidebar = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  const { t } = useTranslation();
  const projectLinks: Array<{
    label: string;
    href: string;
  }> = [
    {
      label: t("general"),
      href: `/${workspaceSlug}/projects/${projectId}/settings`,
    },
    {
      label: t("members"),
      href: `/${workspaceSlug}/projects/${projectId}/settings/members`,
    },
    {
      label: t("reatures"),
      href: `/${workspaceSlug}/projects/${projectId}/settings/features`,
    },
    {
      label: t("states"),
      href: `/${workspaceSlug}/projects/${projectId}/settings/states`,
    },
    {
      label: t("labels"),
      href: `/${workspaceSlug}/projects/${projectId}/settings/labels`,
    },
    {
      label: t("integrations"),
      href: `/${workspaceSlug}/projects/${projectId}/settings/integrations`,
    },
    {
      label: t("estimates"),
      href: `/${workspaceSlug}/projects/${projectId}/settings/estimates`,
    },
    {
      label: t("automations"),
      href: `/${workspaceSlug}/projects/${projectId}/settings/automations`,
    },
  ];
  return (
    <div className="flex flex-col gap-2 w-80 px-9">
      <span className="text-xs text-custom-sidebar-text-400 font-semibold">SETTINGS</span>
      <div className="flex flex-col gap-1 w-full">
        {projectLinks.map((link) => (
          (<Link key={link.href} href={link.href}>

            <div
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                (
                  link.label === "Import"
                    ? router.asPath.includes(link.href)
                    : router.asPath === link.href
                )
                  ? "bg-custom-primary-100/10 text-custom-primary-100"
                  : "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80 focus:bg-custom-sidebar-background-80"
              }`}
            >
              {link.label}
            </div>

          </Link>)
        ))}
      </div>
    </div>
  );
};
