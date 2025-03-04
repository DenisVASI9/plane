import React, { useState } from "react";
import {useTranslation} from 'next-i18next';
import { useRouter } from "next/router";

import useSWR from "swr";

// hooks
import useUserAuth from "hooks/use-user-auth";
// services
import viewsService from "services/views.service";
import projectService from "services/project.service";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
//icons
import { PlusIcon } from "components/icons";
// images
import emptyView from "public/empty-state/view.svg";
// fetching keys
import { PROJECT_DETAILS, VIEWS_LIST } from "constants/fetch-keys";
// components
import { PrimaryButton, Loader, EmptyState } from "components/ui";
import { DeleteViewModal, CreateUpdateViewModal, SingleViewItem } from "components/views";
// types
import { IView } from "types";
import type { NextPage, GetStaticProps } from "next";

import {serverSideTranslations} from "next-i18next/serverSideTranslations";

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

const ProjectViews: NextPage = () => {
  const [createUpdateViewModal, setCreateUpdateViewModal] = useState(false);
  const [selectedViewToUpdate, setSelectedViewToUpdate] = useState<IView | null>(null);
  const { t } = useTranslation();
  const [deleteViewModal, setDeleteViewModal] = useState(false);
  const [selectedViewToDelete, setSelectedViewToDelete] = useState<IView | null>(null);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { user } = useUserAuth();

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

  const handleEditView = (view: IView) => {
    setSelectedViewToUpdate(view);
    setCreateUpdateViewModal(true);
  };

  const handleDeleteView = (view: IView) => {
    setSelectedViewToDelete(view);
    setDeleteViewModal(true);
  };

  return (
    <ProjectAuthorizationWrapper
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
          <BreadcrumbItem title={`${activeProject?.name ?? t("project")} ${t("views")}`} />
        </Breadcrumbs>
      }
      right={
        <div className="flex items-center gap-2">
          <PrimaryButton
            type="button"
            className="flex items-center gap-2"
            onClick={() => {
              const e = new KeyboardEvent("keydown", { key: "v" });
              document.dispatchEvent(e);
            }}
          >
            <PlusIcon className="h-4 w-4" />
            Create View
          </PrimaryButton>
        </div>
      }
    >
      <CreateUpdateViewModal
        isOpen={createUpdateViewModal}
        handleClose={() => setCreateUpdateViewModal(false)}
        data={selectedViewToUpdate}
        user={user}
      />
      <DeleteViewModal
        isOpen={deleteViewModal}
        data={selectedViewToDelete}
        setIsOpen={setDeleteViewModal}
        user={user}
      />
      {views ? (
        views.length > 0 ? (
          <div className="space-y-5 p-8">
            <h3 className="text-2xl font-semibold text-custom-text-100">{t("views")}</h3>
            <div className="divide-y divide-custom-border-200 rounded-[10px] border border-custom-border-200">
              {views.map((view) => (
                <SingleViewItem
                  key={view.id}
                  view={view}
                  handleEditView={() => handleEditView(view)}
                  handleDeleteView={() => handleDeleteView(view)}
                />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title={t("projects.settings.get-focused-with-views")}
            description={t("projects.settings.views-aid-in-saving-your-issues")}
            image={emptyView}
            primaryButton={{
              icon: <PlusIcon className="h-4 w-4" />,
              text: t("projects.settings.new-view"),
              onClick: () => {
                const e = new KeyboardEvent("keydown", {
                  key: "v",
                });
                document.dispatchEvent(e);
              },
            }}
          />
        )
      ) : (
        <Loader className="space-y-3 p-8">
          <Loader.Item height="30px" />
          <Loader.Item height="30px" />
          <Loader.Item height="30px" />
        </Loader>
      )}
    </ProjectAuthorizationWrapper>
  );
};

export default ProjectViews;
