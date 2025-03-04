import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import useSWR from "swr";

// services
import workspaceService from "services/workspace.service";
// hooks
import useToast from "hooks/use-toast";
import useUser from "hooks/use-user";
import useWorkspaceMembers from "hooks/use-workspace-members";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
import { SettingsHeader } from "components/workspace";
// components
import ConfirmWorkspaceMemberRemove from "components/workspace/confirm-workspace-member-remove";
import SendWorkspaceInvitationModal from "components/workspace/send-workspace-invitation-modal";
// ui
import { CustomMenu, CustomSelect, Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import type { NextPage, GetStaticProps } from "next";
// fetch-keys
import {
  WORKSPACE_DETAILS,
  WORKSPACE_INVITATION_WITH_EMAIL,
  WORKSPACE_MEMBERS_WITH_EMAIL,
} from "constants/fetch-keys";
// constants
import { ROLE } from "constants/workspace";
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

const MembersSettings: NextPage = () => {
  const [selectedRemoveMember, setSelectedRemoveMember] = useState<string | null>(null);
  const [selectedInviteRemoveMember, setSelectedInviteRemoveMember] = useState<string | null>(null);
  const [inviteModal, setInviteModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  const { user } = useUser();

  const { isOwner } = useWorkspaceMembers(workspaceSlug?.toString(), Boolean(workspaceSlug));

  const { data: activeWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug.toString()) : null,
    () => (workspaceSlug ? workspaceService.getWorkspace(workspaceSlug.toString()) : null)
  );

  const { data: workspaceMembers, mutate: mutateMembers } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS_WITH_EMAIL(workspaceSlug.toString()) : null,
    workspaceSlug
      ? () => workspaceService.workspaceMembersWithEmail(workspaceSlug.toString())
      : null
  );

  const { data: workspaceInvitations, mutate: mutateInvitations } = useSWR(
    workspaceSlug ? WORKSPACE_INVITATION_WITH_EMAIL(workspaceSlug.toString()) : null,
    workspaceSlug
      ? () => workspaceService.workspaceInvitationsWithEmail(workspaceSlug.toString())
      : null
  );

  const members = [
    ...(workspaceInvitations?.map((item) => ({
      id: item.id,
      memberId: item.id,
      avatar: "",
      first_name: item.email,
      last_name: "",
      email: item.email,
      display_name: item.email,
      role: item.role,
      status: item.accepted,
      member: false,
      accountCreated: item?.accepted ? false : true,
    })) || []),
    ...(workspaceMembers?.map((item) => ({
      id: item.id,
      memberId: item.member?.id,
      avatar: item.member?.avatar,
      first_name: item.member?.first_name,
      last_name: item.member?.last_name,
      email: item.member?.email,
      display_name: item.member?.display_name,
      role: item.role,
      status: true,
      member: true,
      accountCreated: true,
    })) || []),
  ];

  const currentUser = workspaceMembers?.find((item) => item.member?.id === user?.id);

  const handleInviteModalSuccess = () => {
    mutateInvitations();
  };

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${truncateText(activeWorkspace?.name ?? "Workspace", 32)}`}
            link={`/${workspaceSlug}`}
            linkTruncate
          />
          <BreadcrumbItem title="Members Settings" unshrinkTitle />
        </Breadcrumbs>
      }
    >
      <ConfirmWorkspaceMemberRemove
        isOpen={Boolean(selectedRemoveMember) || Boolean(selectedInviteRemoveMember)}
        onClose={() => {
          setSelectedRemoveMember(null);
          setSelectedInviteRemoveMember(null);
        }}
        data={
          selectedRemoveMember
            ? members.find((item) => item.id === selectedRemoveMember)
            : selectedInviteRemoveMember
            ? members.find((item) => item.id === selectedInviteRemoveMember)
            : null
        }
        handleDelete={async () => {
          if (!workspaceSlug) return;
          if (selectedRemoveMember) {
            workspaceService
              .deleteWorkspaceMember(workspaceSlug as string, selectedRemoveMember)
              .catch((err) => {
                const error = err?.error;
                setToastAlert({
                  type: "error",
                  title: "Error",
                  message: error || "Something went wrong",
                });
              })
              .finally(() => {
                mutateMembers(
                  (prevData: any) =>
                    prevData?.filter((item: any) => item.id !== selectedRemoveMember)
                );
              });
          }
          if (selectedInviteRemoveMember) {
            mutateInvitations(
              (prevData: any) =>
                prevData?.filter((item: any) => item.id !== selectedInviteRemoveMember),
              false
            );
            workspaceService
              .deleteWorkspaceInvitations(workspaceSlug as string, selectedInviteRemoveMember)
              .then(() => {
                setToastAlert({
                  type: "success",
                  title: "Success",
                  message: "Member removed successfully",
                });
              })
              .catch((err) => {
                const error = err?.error;
                setToastAlert({
                  type: "error",
                  title: "Error",
                  message: error || "Something went wrong",
                });
              })
              .finally(() => {
                mutateInvitations();
              });
          }
          setSelectedRemoveMember(null);
          setSelectedInviteRemoveMember(null);
        }}
      />
      <SendWorkspaceInvitationModal
        isOpen={inviteModal}
        setIsOpen={setInviteModal}
        workspace_slug={workspaceSlug as string}
        user={user}
        onSuccess={handleInviteModalSuccess}
      />
      <div className="p-8">
        <SettingsHeader />
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <h3 className="text-2xl font-semibold">Members</h3>
            <button
              type="button"
              className="flex items-center gap-2 text-custom-primary outline-none"
              onClick={() => setInviteModal(true)}
            >
              <PlusIcon className="h-4 w-4" />
              Add Member
            </button>
          </div>
          {!workspaceMembers || !workspaceInvitations ? (
            <Loader className="space-y-5">
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
            </Loader>
          ) : (
            <div className="divide-y divide-custom-border-200 rounded-[10px] border border-custom-border-200 bg-custom-background-100 px-6">
              {members.length > 0
                ? members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between py-6">
                      <div className="flex items-center gap-x-8 gap-y-2">
                        {member.avatar && member.avatar !== "" ? (
                          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg p-4 capitalize text-white">
                            <img
                              src={member.avatar}
                              className="absolute top-0 left-0 h-full w-full object-cover rounded-lg"
                              alt={member.display_name || member.email}
                            />
                          </div>
                        ) : member.display_name || member.email ? (
                          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg p-4 capitalize bg-gray-700 text-white">
                            {(member.display_name || member.email)?.charAt(0)}
                          </div>
                        ) : (
                          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg p-4 capitalize bg-gray-700 text-white">
                            ?
                          </div>
                        )}
                        <div>
                          {member.member ? (
                            (<Link href={`/${workspaceSlug}/profile/${member.memberId}`} className="text-sm">

                              <span>
                                {member.first_name} {member.last_name}
                              </span>
                              <span className="text-custom-text-300 text-sm ml-2">
                                ({member.display_name})
                              </span>

                            </Link>)
                          ) : (
                            <h4 className="text-sm">{member.display_name || member.email}</h4>
                          )}
                          {isOwner && (
                            <p className="text-xs text-custom-text-200">{member.email}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {!member?.status && (
                          <div className="mr-2 flex items-center justify-center rounded-full bg-yellow-500/20 px-2 py-1 text-center text-xs text-yellow-500">
                            <p>Pending</p>
                          </div>
                        )}
                        {member?.status && !member?.accountCreated && (
                          <div className="mr-2 flex items-center justify-center rounded-full bg-blue-500/20 px-2 py-1 text-center text-xs text-blue-500">
                            <p>Account not created</p>
                          </div>
                        )}
                        <CustomSelect
                          label={ROLE[member.role as keyof typeof ROLE]}
                          value={member.role}
                          onChange={(value: any) => {
                            if (!workspaceSlug) return;

                            mutateMembers(
                              (prevData: any) =>
                                prevData?.map((m: any) =>
                                  m.id === member.id ? { ...m, role: value } : m
                                ),
                              false
                            );

                            workspaceService
                              .updateWorkspaceMember(workspaceSlug?.toString(), member.id, {
                                role: value,
                              })
                              .catch(() => {
                                setToastAlert({
                                  type: "error",
                                  title: "Error!",
                                  message:
                                    "An error occurred while updating member role. Please try again.",
                                });
                              });
                          }}
                          position="right"
                          disabled={
                            member.memberId === currentUser?.member.id ||
                            !member.status ||
                            (currentUser &&
                              currentUser.role !== 20 &&
                              currentUser.role < member.role)
                          }
                        >
                          {Object.keys(ROLE).map((key) => {
                            if (
                              currentUser &&
                              currentUser.role !== 20 &&
                              currentUser.role < parseInt(key)
                            )
                              return null;

                            return (
                              <CustomSelect.Option key={key} value={key}>
                                <>{ROLE[parseInt(key) as keyof typeof ROLE]}</>
                              </CustomSelect.Option>
                            );
                          })}
                        </CustomSelect>
                        <CustomMenu ellipsis>
                          <CustomMenu.MenuItem
                            onClick={() => {
                              if (member.member) {
                                setSelectedRemoveMember(member.id);
                              } else {
                                setSelectedInviteRemoveMember(member.id);
                              }
                            }}
                          >
                            {user?.id === member.memberId ? "Leave" : "Remove member"}
                          </CustomMenu.MenuItem>
                        </CustomMenu>
                      </div>
                    </div>
                  ))
                : null}
            </div>
          )}
        </section>
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default MembersSettings;
