import Link from "next/link";
import {useTranslation} from 'next-i18next';
// layouts
import DefaultLayout from "layouts/default-layout";
// ui
import { PrimaryButton, SecondaryButton } from "components/ui";

export const NotAWorkspaceMember = () => {
  const { t } = useTranslation();
  return <DefaultLayout>
    <div className="grid h-full place-items-center p-4">
      <div className="space-y-8 text-center">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{t("components.auth-screens.not-authorized")}</h3>
          <p className="mx-auto w-1/2 text-sm text-custom-text-200">
            {t("components.auth-screens.not-member-this-workspace")}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Link href="/invitations">

            <SecondaryButton>{t("components.auth-screens.check-pending-invites")}</SecondaryButton>

          </Link>
          <Link href="/create-workspace">

            <PrimaryButton>{t("create-new-workspace")}</PrimaryButton>

          </Link>
        </div>
      </div>
    </div>
  </DefaultLayout>
};
