import { useRouter } from "next/router";
import {useTranslation} from 'next-i18next';
import useSWR from "swr";

// services
import projectService from "services/project.service";
import viewsService from "services/views.service";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// contexts
import { IssueViewContextProvider } from "contexts/issue-view.context";
// components
import { IssuesFilterView, IssuesView } from "components/core";
// ui
import { CustomMenu, EmptyState, PrimaryButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
import { StackedLayersIcon } from "components/icons";
// images
import emptyView from "public/empty-state/view.svg";
// helpers
import { truncateText } from "helpers/string.helper";
// fetch-keys
import { PROJECT_DETAILS, VIEWS_LIST, VIEW_DETAILS } from "constants/fetch-keys";

import {serverSideTranslations} from "next-i18next/serverSideTranslations";
import {GetStaticProps} from "next";

export async function getStaticPaths() {
    return {
        paths: [],
        fallback: 'blocking',
    };
}

export const getStaticProps: GetStaticProps = async (context) => ({
    props: {
        ...(await serverSideTranslations(context.locale!)),
    },
});

const SingleView: React.FC = () => {
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;
    const { t } = useTranslation();
  const { data: activeProject } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: views } = useSWR(
    workspaceSlug && projectId ? VIEWS_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => viewsService.getViews(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: viewDetails, error } = useSWR(
    workspaceSlug && projectId && viewId ? VIEW_DETAILS(viewId as string) : null,
    workspaceSlug && projectId && viewId
      ? () =>
          viewsService.getViewDetails(
            workspaceSlug as string,
            projectId as string,
            viewId as string
          )
      : null
  );

  return (
    <IssueViewContextProvider>
      <ProjectAuthorizationWrapper
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem
              title={`${activeProject?.name ?? t("project")} ${t("views")}`}
              link={`/${workspaceSlug}/projects/${activeProject?.id}/cycles`}
            />
          </Breadcrumbs>
        }
        left={
          <CustomMenu
            label={
              <>
                <StackedLayersIcon height={12} width={12} />
                {viewDetails?.name && truncateText(viewDetails.name, 40)}
              </>
            }
            className="ml-1.5"
            width="auto"
          >
            {views?.map((view) => (
              <CustomMenu.MenuItem
                key={view.id}
                renderAs="a"
                href={`/${workspaceSlug}/projects/${projectId}/views/${view.id}`}
              >
                {truncateText(view.name, 40)}
              </CustomMenu.MenuItem>
            ))}
          </CustomMenu>
        }
        right={
          <div className="flex items-center gap-2">
            <IssuesFilterView />
            <PrimaryButton
              className="flex items-center gap-2"
              onClick={() => {
                const e = new KeyboardEvent("keydown", { key: "c" });
                document.dispatchEvent(e);
              }}
            >
              <PlusIcon className="h-4 w-4" />
                {t("add-issue")}
            </PrimaryButton>
          </div>
        }
      >
        {error ? (
          <EmptyState
            image={emptyView}
            title={t("projects.settings.view-not-exist")}
            description={t("projects.settings.view-you-looking-does-not-exist")}
            primaryButton={{
              text: t("projects.settings.view-other-views"),
              onClick: () => router.push(`/${workspaceSlug}/projects/${projectId}/views`),
            }}
          />
        ) : (
          <div className="h-full w-full flex flex-col">
            <IssuesView />
          </div>
        )}
      </ProjectAuthorizationWrapper>
    </IssueViewContextProvider>
  );
};

export default SingleView;
