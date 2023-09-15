import React, {useState} from "react";
import {useTranslation} from 'next-i18next'
import {useRouter} from "next/router";

import useSWR from "swr";
// icons
import {ArrowLeftIcon} from "@heroicons/react/24/outline";
import {CyclesIcon} from "components/icons";
// layouts
import {ProjectAuthorizationWrapper} from "layouts/auth-layout";
// contexts
import {IssueViewContextProvider} from "contexts/issue-view.context";
// components
import {ExistingIssuesListModal, IssuesFilterView, IssuesView} from "components/core";
import {CycleDetailsSidebar, TransferIssues, TransferIssuesModal} from "components/cycles";
// services
import issuesService from "services/issues.service";
import cycleServices from "services/cycles.service";
// hooks
import useToast from "hooks/use-toast";
import useUserAuth from "hooks/use-user-auth";
// components
import {AnalyticsProjectModal} from "components/analytics";
// ui
import {CustomMenu, EmptyState, SecondaryButton} from "components/ui";
import {BreadcrumbItem, Breadcrumbs} from "components/breadcrumbs";
// images
import emptyCycle from "public/empty-state/cycle.svg";
// helpers
import {truncateText} from "helpers/string.helper";
import {getDateRangeStatus} from "helpers/date-time.helper";
// types
import {ISearchIssueResponse} from "types";
import {GetStaticProps} from "next";
// fetch-keys
import {CYCLE_DETAILS, CYCLES_LIST} from "constants/fetch-keys";

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

const SingleCycle: React.FC = () => {
    const [cycleIssuesListModal, setCycleIssuesListModal] = useState(false);
    const [cycleSidebar, setCycleSidebar] = useState(true);
    const [analyticsModal, setAnalyticsModal] = useState(false);
    const [transferIssuesModal, setTransferIssuesModal] = useState(false);
    const {t} = useTranslation();
    const router = useRouter();
    const {workspaceSlug, projectId, cycleId} = router.query;

    const {user} = useUserAuth();

    const {setToastAlert} = useToast();

    const {data: cycles} = useSWR(
        workspaceSlug && projectId ? CYCLES_LIST(projectId as string) : null,
        workspaceSlug && projectId
            ? () => cycleServices.getCyclesWithParams(workspaceSlug as string, projectId as string, "all")
            : null
    );

    const {data: cycleDetails, error} = useSWR(
        workspaceSlug && projectId && cycleId ? CYCLE_DETAILS(cycleId.toString()) : null,
        workspaceSlug && projectId && cycleId
            ? () =>
                cycleServices.getCycleDetails(
                    workspaceSlug.toString(),
                    projectId.toString(),
                    cycleId.toString()
                )
            : null
    );

    const cycleStatus =
        cycleDetails?.start_date && cycleDetails?.end_date
            ? getDateRangeStatus(cycleDetails?.start_date, cycleDetails?.end_date)
            : t("projects.cycles.cycleStatus-draft");

    const openIssuesListModal = () => {
        setCycleIssuesListModal(true);
    };

    const handleAddIssuesToCycle = async (data: ISearchIssueResponse[]) => {
        if (!workspaceSlug || !projectId) return;

        const payload = {
            issues: data.map((i) => i.id),
        };

        await issuesService
            .addIssueToCycle(
                workspaceSlug as string,
                projectId as string,
                cycleId as string,
                payload,
                user
            )
            .catch(() => {
                setToastAlert({
                    type: "error",
                    title: t("error"),
                    message: t("projects.cycles.issues-couldnt-be-added-cycle"),
                });
            });
    };

    return (
        <IssueViewContextProvider>
            <ExistingIssuesListModal
                isOpen={cycleIssuesListModal}
                handleClose={() => setCycleIssuesListModal(false)}
                searchParams={{cycle: true}}
                handleOnSubmit={handleAddIssuesToCycle}
            />
            <ProjectAuthorizationWrapper
                breadcrumbs={
                    <Breadcrumbs>
                        <BreadcrumbItem
                            title={`${truncateText(cycleDetails?.project_detail.name ?? t("project"), 32)} ${t("cycles")}`}
                            link={`/${workspaceSlug}/projects/${projectId}/cycles`}
                            linkTruncate
                        />
                    </Breadcrumbs>
                }
                left={
                    <CustomMenu
                        label={
                            <>
                                <CyclesIcon className="h-3 w-3"/>
                                {cycleDetails?.name && truncateText(cycleDetails.name, 40)}
                            </>
                        }
                        className="ml-1.5 flex-shrink-0"
                        width="auto"
                    >
                        {cycles?.map((cycle) => (
                            <CustomMenu.MenuItem
                                key={cycle.id}
                                renderAs="a"
                                href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycle.id}`}
                            >
                                {truncateText(cycle.name, 40)}
                            </CustomMenu.MenuItem>
                        ))}
                    </CustomMenu>
                }
                right={
                    <div className={`flex flex-shrink-0 items-center gap-2 duration-300`}>
                        <IssuesFilterView/>
                        <SecondaryButton
                            onClick={() => setAnalyticsModal(true)}
                            className="!py-1.5 font-normal rounded-md text-custom-text-200 hover:text-custom-text-100"
                            outline
                        >
                            Analytics
                        </SecondaryButton>
                        <button
                            type="button"
                            className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-custom-background-90 ${
                                cycleSidebar ? "rotate-180" : ""
                            }`}
                            onClick={() => setCycleSidebar((prevData) => !prevData)}
                        >
                            <ArrowLeftIcon className="h-4 w-4"/>
                        </button>
                    </div>
                }
            >
                {error ? (
                    <EmptyState
                        image={emptyCycle}
                        title={t("projects.cycles.cycle-does-not-exist")}
                        description={t("projects.cycles.cycle-not-exist-or-deleted")}
                        primaryButton={{
                            text: t("projects.cycles.view-other-cycles"),
                            onClick: () => router.push(`/${workspaceSlug}/projects/${projectId}/cycles`),
                        }}
                    />
                ) : (
                    <>
                        <TransferIssuesModal
                            handleClose={() => setTransferIssuesModal(false)}
                            isOpen={transferIssuesModal}
                        />
                        <AnalyticsProjectModal
                            isOpen={analyticsModal}
                            onClose={() => setAnalyticsModal(false)}
                        />
                        <div
                            className={`h-full flex flex-col ${cycleSidebar ? "mr-[24rem]" : ""} ${
                                analyticsModal ? "mr-[50%]" : ""
                            } duration-300`}
                        >
                            {cycleStatus === t("completed") && (
                                <TransferIssues handleClick={() => setTransferIssuesModal(true)}/>
                            )}
                            <IssuesView
                                openIssuesListModal={openIssuesListModal}
                                disableUserActions={cycleStatus === t("completed") ?? false}
                            />
                        </div>
                        <CycleDetailsSidebar
                            cycleStatus={cycleStatus}
                            cycle={cycleDetails}
                            isOpen={cycleSidebar}
                            isCompleted={cycleStatus ===  t("completed")  ?? false}
                            user={user}
                        />
                    </>
                )}
            </ProjectAuthorizationWrapper>
        </IssueViewContextProvider>
    );
};

export default SingleCycle;
