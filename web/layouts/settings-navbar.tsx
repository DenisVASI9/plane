import Link from "next/link";
import { useRouter } from "next/router";
import {useTranslation} from 'next-i18next';
type Props = {
  profilePage?: boolean;
};

const SettingsNavbar: React.FC<Props> = ({ profilePage = false }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  const { t } = useTranslation();
  const workspaceLinks: Array<{
    label: string;
    href: string;
  }> = [
    {
      label: t("general"),
      href: `/${workspaceSlug}/settings`,
    },
    {
      label: t("members"),
      href: `/${workspaceSlug}/settings/members`,
    },
    {
      label: t("reatures"),
      href: `/${workspaceSlug}/settings/features`,
    },
    {
      label: t("states"),
      href: `/${workspaceSlug}/settings/states`,
    },
    {
      label: t("labels"),
      href: `/${workspaceSlug}/settings/labels`,
    },
    {
      label: t("integrations"),
      href: `/${workspaceSlug}/settings/integrations`,
    },
    {
      label: t("estimates"),
      href: `/${workspaceSlug}/settings/estimates`,
    },
    {
      label: t("automations"),
      href: `/${workspaceSlug}/settings/automations`,
    },
  ];

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

  const profileLinks: Array<{
    label: string;
    href: string;
  }> = [
    {
      label: t("general"),
      href: `/${workspaceSlug}/me/profile`,
    },
    {
      label: t("activity"),
      href: `/${workspaceSlug}/me/profile/activity`,
    },
    {
      label: t("preferences"),
      href: `/${workspaceSlug}/me/profile/preferences`,
    },
  ];

  return (
    <div className="flex flex-wrap gap-4">
      {(profilePage ? profileLinks : projectId ? projectLinks : workspaceLinks).map((link) => (
        (<Link key={link.href} href={link.href}>

          <div
            className={`rounded-full border px-5 py-1.5 text-sm outline-none ${
              (
                link.label === "Import"
                  ? router.asPath.includes(link.href)
                  : router.asPath === link.href
              )
                ? "border-custom-primary bg-custom-primary text-white"
                : "border-custom-border-200 bg-custom-background-100 hover:bg-custom-background-90"
            }`}
          >
            {link.label}
          </div>

        </Link>)
      ))}
    </div>
  );
};

export default SettingsNavbar;
