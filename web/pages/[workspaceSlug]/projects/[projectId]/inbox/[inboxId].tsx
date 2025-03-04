import { useRouter } from "next/router";
import { useTranslation } from 'next-i18next'
// hooks
import useProjectDetails from "hooks/use-project-details";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// contexts
import { InboxViewContextProvider } from "contexts/inbox-view-context";
// components
import { InboxActionHeader, InboxMainContent, IssuesListSidebar } from "components/inbox";
// helper
import { truncateText } from "helpers/string.helper";
// ui
import { PrimaryButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import type { NextPage, GetStaticProps } from "next";

import {serverSideTranslations} from "next-i18next/serverSideTranslations";

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

const ProjectInbox: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;
    const { t } = useTranslation();

  const { projectDetails } = useProjectDetails();

  return (
    <InboxViewContextProvider>
      <ProjectAuthorizationWrapper
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
            <BreadcrumbItem
              title={`${truncateText(projectDetails?.name ?? t("project"), 32)} ${t("inbox")}`}
            />
          </Breadcrumbs>
        }
        right={
          <div className="flex items-center gap-2">
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
        <div className="flex flex-col h-full">
          <InboxActionHeader />
          <div className="grid grid-cols-4 flex-1 divide-x divide-custom-border-200 overflow-hidden">
            <IssuesListSidebar />
            <div className="col-span-3 h-full overflow-auto">
              <InboxMainContent />
            </div>
          </div>
        </div>
      </ProjectAuthorizationWrapper>
    </InboxViewContextProvider>
  );
};

export default ProjectInbox;
