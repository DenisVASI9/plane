import React, { useState } from "react";
import {useTranslation} from 'next-i18next';
import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// services
import estimatesService from "services/estimates.service";
import projectService from "services/project.service";
// hooks
import useProjectDetails from "hooks/use-project-details";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// components
import { CreateUpdateEstimateModal, SingleEstimate } from "components/estimates";
import { SettingsSidebar } from "components/project";
//hooks
import useToast from "hooks/use-toast";
import useUserAuth from "hooks/use-user-auth";
// ui
import { EmptyState, Loader, PrimaryButton, SecondaryButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// images
import emptyEstimate from "public/empty-state/estimate.svg";
// types
import { IEstimate, IProject } from "types";
import type {GetStaticProps, NextPage} from "next";
// fetch-keys
import { ESTIMATES_LIST, PROJECT_DETAILS } from "constants/fetch-keys";
// helper
import { truncateText } from "helpers/string.helper";

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

const EstimatesSettings: NextPage = () => {
    const { t } = useTranslation();
    const [estimateFormOpen, setEstimateFormOpen] = useState(false);

  const [estimateToUpdate, setEstimateToUpdate] = useState<IEstimate | undefined>();

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { user } = useUserAuth();

  const { setToastAlert } = useToast();

  const { projectDetails } = useProjectDetails();

  const { data: estimatesList } = useSWR<IEstimate[]>(
    workspaceSlug && projectId ? ESTIMATES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => estimatesService.getEstimatesList(workspaceSlug as string, projectId as string)
      : null
  );

  const editEstimate = (estimate: IEstimate) => {
    setEstimateToUpdate(estimate);
    setEstimateFormOpen(true);
  };

  const removeEstimate = (estimateId: string) => {
    if (!workspaceSlug || !projectId) return;

    mutate<IEstimate[]>(
      ESTIMATES_LIST(projectId as string),
      (prevData) => (prevData ?? []).filter((p) => p.id !== estimateId),
      false
    );

    estimatesService
      .deleteEstimate(workspaceSlug as string, projectId as string, estimateId, user)
      .catch(() => {
        setToastAlert({
          type: "error",
          title: t("error"),
          message: t("projects.settings.estimate-not-deleted"),
        });
      });
  };

  const disableEstimates = () => {
    if (!workspaceSlug || !projectId) return;

    mutate<IProject>(
      PROJECT_DETAILS(projectId as string),
      (prevData) => {
        if (!prevData) return prevData;

        return { ...prevData, estimate: null };
      },
      false
    );

    projectService
      .updateProject(workspaceSlug as string, projectId as string, { estimate: null }, user)
      .catch(() =>
        setToastAlert({
          type: "error",
          title: t("error"),
          message: t("projects.settings.estimate-not-disabled"),
        })
      );
  };

  return (
    <>
      <CreateUpdateEstimateModal
        isOpen={estimateFormOpen}
        data={estimateToUpdate}
        handleClose={() => {
          setEstimateFormOpen(false);
          setEstimateToUpdate(undefined);
        }}
        user={user}
      />
      <ProjectAuthorizationWrapper
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem
              title={`${truncateText(projectDetails?.name ?? t("project"), 32)}`}
              link={`/${workspaceSlug}/projects/${projectDetails?.id}/issues`}
              linkTruncate
            />
            <BreadcrumbItem title="Estimates Settings" unshrinkTitle />
          </Breadcrumbs>
        }
      >
        <div className="flex flex-row gap-2 h-full overflow-hidden">
          <div className="w-80 py-8">
            <SettingsSidebar />
          </div>
          <div className="pr-9 py-8 flex flex-col w-full">
            <section className="flex items-center justify-between pt-2 pb-3.5 border-b border-custom-border-200">
              <h3 className="text-xl font-medium">{t("estimates")}</h3>
              <div className="col-span-12 space-y-5 sm:col-span-7">
                <div className="flex items-center gap-2">
                  <PrimaryButton
                    onClick={() => {
                      setEstimateToUpdate(undefined);
                      setEstimateFormOpen(true);
                    }}
                  >
                      {t("projects.settings.add-estimate")}
                  </PrimaryButton>
                  {projectDetails?.estimate && (
                    <SecondaryButton onClick={disableEstimates}>{t("projects.settings.disable-estimates")}</SecondaryButton>
                  )}
                </div>
              </div>
            </section>
            {estimatesList ? (
              estimatesList.length > 0 ? (
                <section className="h-full bg-custom-background-100 overflow-y-auto">
                  {estimatesList.map((estimate) => (
                    <SingleEstimate
                      key={estimate.id}
                      estimate={estimate}
                      editEstimate={(estimate) => editEstimate(estimate)}
                      handleEstimateDelete={(estimateId) => removeEstimate(estimateId)}
                      user={user}
                    />
                  ))}
                </section>
              ) : (
                <div className="h-full w-full overflow-y-auto">
                  <EmptyState
                    title={t("projects.settings.no-estimates-yet")}
                    description={t("projects.settings.estimates-help-you")}
                    image={emptyEstimate}
                    primaryButton={{
                      icon: <PlusIcon className="h-4 w-4" />,
                      text: t("projects.settings.add-estimate"),
                      onClick: () => {
                        setEstimateToUpdate(undefined);
                        setEstimateFormOpen(true);
                      },
                    }}
                  />
                </div>
              )
            ) : (
              <Loader className="mt-5 space-y-5">
                <Loader.Item height="40px" />
                <Loader.Item height="40px" />
                <Loader.Item height="40px" />
                <Loader.Item height="40px" />
              </Loader>
            )}
          </div>
        </div>
      </ProjectAuthorizationWrapper>
    </>
  );
};

export default EstimatesSettings;
