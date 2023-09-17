import React from "react";
import {useTranslation} from 'next-i18next';
import {useRouter} from "next/router";

import {mutate} from "swr";

// services
import projectService from "services/project.service";
// layouts
import {ProjectAuthorizationWrapper} from "layouts/auth-layout";
// hooks
import useUserAuth from "hooks/use-user-auth";
import useProjectDetails from "hooks/use-project-details";
import useToast from "hooks/use-toast";
// components
import {AutoArchiveAutomation, AutoCloseAutomation} from "components/automation";
import {SettingsSidebar} from "components/project";
// ui
import {BreadcrumbItem, Breadcrumbs} from "components/breadcrumbs";
// types
import type {GetStaticProps, NextPage} from "next";
import {IProject} from "types";
// constant
import {PROJECT_DETAILS, PROJECTS_LIST} from "constants/fetch-keys";
// helper
import {truncateText} from "helpers/string.helper";

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

const AutomationsSettings: NextPage = () => {
    const {t} = useTranslation();
    const router = useRouter();
    const {workspaceSlug, projectId} = router.query;

    const {user} = useUserAuth();
    const {setToastAlert} = useToast();

    const {projectDetails} = useProjectDetails();

    const handleChange = async (formData: Partial<IProject>) => {
        if (!workspaceSlug || !projectId || !projectDetails) return;

        mutate<IProject>(
            PROJECT_DETAILS(projectId as string),
            (prevData) => ({...(prevData as IProject), ...formData}),
            false
        );

        mutate<IProject[]>(
            PROJECTS_LIST(workspaceSlug as string, {is_favorite: "all"}),
            (prevData) =>
                (prevData ?? []).map((p) => (p.id === projectDetails.id ? {...p, ...formData} : p)),
            false
        );

        await projectService
            .updateProject(workspaceSlug as string, projectId as string, formData, user)
            .then(() => {
            })
            .catch(() => {
                setToastAlert({
                    type: "error",
                    title: t("error"),
                    message: t("something-went-wrong"),
                });
            });
    };

    return (
        <ProjectAuthorizationWrapper
            breadcrumbs={
                <Breadcrumbs>
                    <BreadcrumbItem
                        title={`${truncateText(projectDetails?.name ?? t("project"), 32)}`}
                        link={`/${workspaceSlug}/projects/${projectDetails?.id}/issues`}
                        linkTruncate
                    />
                    <BreadcrumbItem title="Automations Settings" unshrinkTitle/>
                </Breadcrumbs>
            }
        >
            <div className="flex flex-row gap-2">
                <div className="w-80 py-8">
                    <SettingsSidebar/>
                </div>
                <section className="pr-9 py-8 w-full">
                    <div className="flex items-center py-3.5 border-b border-custom-border-200">
                        <h3 className="text-xl font-medium">{t("automations")}</h3>
                    </div>
                    <AutoArchiveAutomation projectDetails={projectDetails} handleChange={handleChange}/>
                    <AutoCloseAutomation projectDetails={projectDetails} handleChange={handleChange}/>
                </section>
            </div>
        </ProjectAuthorizationWrapper>
    );
};

export default AutomationsSettings;
