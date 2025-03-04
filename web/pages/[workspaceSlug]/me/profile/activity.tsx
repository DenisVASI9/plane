import { useTranslation } from 'next-i18next'
import useSWR from "swr";

import { useRouter } from "next/router";
import Link from "next/link";

// services
import userService from "services/user.service";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
import SettingsNavbar from "layouts/settings-navbar";
// components
import { ActivityIcon, ActivityMessage } from "components/core";
import { TipTapEditor } from "components/tiptap";
// icons
import { ArrowTopRightOnSquareIcon, ChatBubbleLeftEllipsisIcon } from "@heroicons/react/24/outline";
// ui
import { Icon, Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// fetch-keys
import { USER_ACTIVITY } from "constants/fetch-keys";
// helper
import { timeAgo } from "helpers/date-time.helper";

import {serverSideTranslations} from "next-i18next/serverSideTranslations";
import {GetStaticProps} from "next";

export const getStaticProps: GetStaticProps = async (context) => ({
  props: {
    ...(await serverSideTranslations(context.locale!)),
  },
});

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  };
}

const ProfileActivity = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: userActivity } = useSWR(
    workspaceSlug ? USER_ACTIVITY : null,
    workspaceSlug ? () => userService.getUserWorkspaceActivity(workspaceSlug.toString()) : null
  );
  const { t } = useTranslation()
  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="My Profile Activity"  />
        </Breadcrumbs>
      }
    >
      <div className="p-8">
        <div className="mb-8 space-y-6">
          <div>
            <h3 className="text-3xl font-semibold">{t("profile.profile-settings")}</h3>
            <p className="mt-1 text-custom-text-200">
              {t("profile.information-visible-only-you")}
            </p>
          </div>
          <SettingsNavbar profilePage />
        </div>
        {userActivity ? (
          <div>
            <ul role="list" className="-mb-4">
              {userActivity.results.map((activityItem: any, activityIdx: number) => {
                if (activityItem.field === "comment") {
                  return (
                    <div key={activityItem.id} className="mt-2">
                      <div className="relative flex items-start space-x-3">
                        <div className="relative px-1">
                          {activityItem.field ? (
                            activityItem.new_value === "restore" && (
                              <Icon iconName="history" className="text-sm text-custom-text-200" />
                            )
                          ) : activityItem.actor_detail.avatar &&
                            activityItem.actor_detail.avatar !== "" ? (
                            <img
                              src={activityItem.actor_detail.avatar}
                              alt={activityItem.actor_detail.display_name}
                              height={30}
                              width={30}
                              className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-gray-500 text-white"
                            />
                          ) : (
                            <div
                              className={`grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-gray-500 text-white`}
                            >
                              {activityItem.actor_detail.display_name?.charAt(0)}
                            </div>
                          )}

                          <span className="ring-6 flex h-7 w-7 items-center justify-center rounded-full bg-custom-background-80 text-custom-text-200 ring-white">
                            <ChatBubbleLeftEllipsisIcon
                              className="h-3.5 w-3.5 text-custom-text-200"
                              aria-hidden="true"
                            />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div>
                            <div className="text-xs">
                              {activityItem.actor_detail.is_bot
                                ? activityItem.actor_detail.first_name + " Bot"
                                : activityItem.actor_detail.display_name}
                            </div>
                            <p className="mt-0.5 text-xs text-custom-text-200">
                              {t("Commented")} {timeAgo(activityItem.created_at)}
                            </p>
                          </div>
                          <div className="issue-comments-section p-0">
                            <TipTapEditor
                              workspaceSlug={workspaceSlug as string}
                              value={
                                activityItem?.new_value !== ""
                                  ? activityItem.new_value
                                  : activityItem.old_value
                              }
                              customClassName="text-xs border border-custom-border-200 bg-custom-background-100"
                              noBorder
                              borderOnFocus={false}
                              editable={false}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                const message =
                  activityItem.verb === "created" &&
                  activityItem.field !== "cycles" &&
                  activityItem.field !== "modules" &&
                  activityItem.field !== "attachment" &&
                  activityItem.field !== "link" &&
                  activityItem.field !== "estimate" ? (
                    <span className="text-custom-text-200">
                      {t("created")}{" "}
                      <Link
                        href={`/${workspaceSlug}/projects/${activityItem.project}/issues/${activityItem.issue}`}
                        className="inline-flex items-center hover:underline">
                          {t("this-issue")}<ArrowTopRightOnSquareIcon className="ml-1 h-3.5 w-3.5" />

                      </Link>
                    </span>
                  ) : activityItem.field ? (
                    <ActivityMessage activity={activityItem} showIssue />
                  ) : (
                    t("created-the-issue")
                  );

                if ("field" in activityItem && activityItem.field !== "updated_by") {
                  return (
                    <li key={activityItem.id}>
                      <div className="relative pb-1">
                        {userActivity.results.length > 1 &&
                        activityIdx !== userActivity.results.length - 1 ? (
                          <span
                            className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-custom-background-80"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex items-start space-x-2">
                          <>
                            <div>
                              <div className="relative px-1.5">
                                <div className="mt-1.5">
                                  <div className="ring-6 flex h-7 w-7 items-center justify-center rounded-full bg-custom-background-80 text-custom-text-200 ring-white">
                                    {activityItem.field ? (
                                      activityItem.new_value === "restore" ? (
                                        <Icon
                                          iconName="history"
                                          className="text-sm text-custom-text-200"
                                        />
                                      ) : (
                                        <ActivityIcon activity={activityItem} />
                                      )
                                    ) : activityItem.actor_detail.avatar &&
                                      activityItem.actor_detail.avatar !== "" ? (
                                      <img
                                        src={activityItem.actor_detail.avatar}
                                        alt={activityItem.actor_detail.display_name}
                                        height={24}
                                        width={24}
                                        className="rounded-full"
                                      />
                                    ) : (
                                      <div
                                        className={`grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-gray-700 text-xs text-white`}
                                      >
                                        {activityItem.actor_detail.display_name?.charAt(0)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1 py-3">
                              <div className="text-xs text-custom-text-200 break-words">
                                {activityItem.field === "archived_at" &&
                                activityItem.new_value !== "restore" ? (
                                  <span className="text-gray font-medium">{t("profile.plane")}</span>
                                ) : activityItem.actor_detail.is_bot ? (
                                  <span className="text-gray font-medium">
                                    {activityItem.actor_detail.first_name} Bot
                                  </span>
                                ) : (
                                  (<Link
                                    href={`/${workspaceSlug}/profile/${activityItem.actor_detail.id}`}
                                    className="text-gray font-medium">

                                    {activityItem.actor_detail.display_name}

                                  </Link>)
                                )}{" "}
                                {message}{" "}
                                <span className="whitespace-nowrap">
                                  {timeAgo(activityItem.created_at)}
                                </span>
                              </div>
                            </div>
                          </>
                        </div>
                      </div>
                    </li>
                  );
                }
              })}
            </ul>
          </div>
        ) : (
          <Loader className="space-y-5">
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
          </Loader>
        )}
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default ProfileActivity;
