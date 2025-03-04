import React from "react";
// next
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
// layouts
import DefaultLayout from "layouts/default-layout";
// hooks
import useUser from "hooks/use-user";
// images
import ProjectNotAuthorizedImg from "public/auth/project-not-authorized.svg";
import WorkspaceNotAuthorizedImg from "public/auth/workspace-not-authorized.svg";
import {useTranslation} from 'next-i18next';
type Props = {
  actionButton?: React.ReactNode;
  type: "project" | "workspace";
};

export const NotAuthorizedView: React.FC<Props> = ({ actionButton, type }) => {
  const { user } = useUser();
  const { asPath: currentPath } = useRouter();
  const { t } = useTranslation();
  return (
    <DefaultLayout>
      <div className="flex h-full w-full flex-col items-center justify-center gap-y-5 bg-custom-background-100 text-center">
        <div className="h-44 w-72">
          <Image
            src={type === "project" ? ProjectNotAuthorizedImg : WorkspaceNotAuthorizedImg}
            height="176"
            width="288"
            alt="ProjectSettingImg"
          />
        </div>
        <h1 className="text-xl font-medium text-custom-text-100">
          {t("components.auth-screens.not-authorized-view-this-page")}
        </h1>

        <div className="w-full max-w-md text-base text-custom-text-200">
          {user ? (
            <p>
              {t("components.auth-screens.signed-in-as")} {user.email}. <br />
              <Link
                href={`/?next=${currentPath}`}
                className="font-medium text-custom-text-100">
                {t("sign-in")}
              </Link>{" "}
              {t("components.auth-screens.with-different-account-has-access-to-page")}
            </p>
          ) : (
            <p>
              {t("components.auth-screens.you-need-to")}{" "}
              <Link
                href={`/?next=${currentPath}`}
                className="font-medium text-custom-text-100">
                {t("sign-in")}
              </Link>{" "}
              {t("components.auth-screens.with-account-has-access-to-this-page")}
            </p>
          )}
        </div>

        {actionButton}
      </div>
    </DefaultLayout>
  );
};
