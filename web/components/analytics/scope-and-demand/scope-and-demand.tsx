import { useRouter } from "next/router";
import {useTranslation} from 'next-i18next';
import useSWR from "swr";

// services
import analyticsService from "services/analytics.service";
// components
import {
  AnalyticsDemand,
  AnalyticsLeaderboard,
  AnalyticsScope,
  AnalyticsYearWiseIssues,
} from "components/analytics";
// ui
import { Loader, PrimaryButton } from "components/ui";
// fetch-keys
import { DEFAULT_ANALYTICS } from "constants/fetch-keys";

type Props = {
  fullScreen?: boolean;
};

export const ScopeAndDemand: React.FC<Props> = ({ fullScreen = true }) => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;
  const { t } = useTranslation();
  const isProjectLevel = projectId ? true : false;

  const params = isProjectLevel
    ? {
        project: projectId ? [projectId.toString()] : null,
        cycle: cycleId ? cycleId.toString() : null,
        module: moduleId ? moduleId.toString() : null,
      }
    : undefined;

  const {
    data: defaultAnalytics,
    error: defaultAnalyticsError,
    mutate: mutateDefaultAnalytics,
  } = useSWR(
    workspaceSlug ? DEFAULT_ANALYTICS(workspaceSlug.toString(), params) : null,
    workspaceSlug
      ? () => analyticsService.getDefaultAnalytics(workspaceSlug.toString(), params)
      : null
  );

  return (
    <>
      {!defaultAnalyticsError ? (
        defaultAnalytics ? (
          <div className="h-full overflow-y-auto p-5 text-sm">
            <div className={`grid grid-cols-1 gap-5 ${fullScreen ? "md:grid-cols-2" : ""}`}>
              <AnalyticsDemand defaultAnalytics={defaultAnalytics} />
              <AnalyticsScope defaultAnalytics={defaultAnalytics} />
              <AnalyticsLeaderboard
                users={defaultAnalytics.most_issue_created_user?.map((user) => ({
                  avatar: user?.created_by__avatar,
                  firstName: user?.created_by__first_name,
                  lastName: user?.created_by__last_name,
                  display_name: user?.created_by__display_name,
                  count: user?.count,
                  id: user?.created_by__id,
                }))}
                title={t("components.analytics.most-issues-created")}
                emptyStateMessage={t("components.analytics.co-workers-and-number-issues-created")}
                workspaceSlug={workspaceSlug?.toString() ?? ""}
              />
              <AnalyticsLeaderboard
                users={defaultAnalytics.most_issue_closed_user?.map((user) => ({
                  avatar: user?.assignees__avatar,
                  firstName: user?.assignees__first_name,
                  lastName: user?.assignees__last_name,
                  display_name: user?.assignees__display_name,
                  count: user?.count,
                  id: user?.assignees__id,
                }))}
                title={t("components.analytics.most-issues-closed")}
                emptyStateMessage={t("components.analytics.co-workers-and-number-issues-closed")}
                workspaceSlug={workspaceSlug?.toString() ?? ""}
              />
              <div className={fullScreen ? "md:col-span-2" : ""}>
                <AnalyticsYearWiseIssues defaultAnalytics={defaultAnalytics} />
              </div>
            </div>
          </div>
        ) : (
          <Loader className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-2">
            <Loader.Item height="250px" />
            <Loader.Item height="250px" />
            <Loader.Item height="250px" />
            <Loader.Item height="250px" />
          </Loader>
        )
      ) : (
        <div className="grid h-full place-items-center p-5">
          <div className="space-y-4 text-custom-text-200">
            <p className="text-sm">{t("components.analytics.error-fetching-data")}</p>
            <div className="flex items-center justify-center gap-2">
              <PrimaryButton onClick={() => mutateDefaultAnalytics()}>{t("refresh")}</PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
