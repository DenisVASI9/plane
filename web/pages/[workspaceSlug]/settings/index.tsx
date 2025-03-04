import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// services
import workspaceService from "services/workspace.service";
import fileService from "services/file.service";
// hooks
import useToast from "hooks/use-toast";
import useUserAuth from "hooks/use-user-auth";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// components
import { ImageUploadModal } from "components/core";
import { DeleteWorkspaceModal, SettingsHeader } from "components/workspace";
// ui
import { Spinner, Input, CustomSelect, SecondaryButton, DangerButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { LinkIcon } from "@heroicons/react/24/outline";
// helpers
import { copyTextToClipboard, truncateText } from "helpers/string.helper";
// types
import type { IWorkspace } from "types";
import type { NextPage, GetStaticProps } from "next";
// fetch-keys
import { WORKSPACE_DETAILS, USER_WORKSPACES, WORKSPACE_MEMBERS_ME } from "constants/fetch-keys";
// constants
import { ORGANIZATION_SIZE } from "constants/workspace";

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


const defaultValues: Partial<IWorkspace> = {
  name: "",
  url: "",
  organization_size: "2-10",
  logo: null,
};

const WorkspaceSettings: NextPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isImageRemoving, setIsImageRemoving] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { user } = useUserAuth();

  const { data: memberDetails } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS_ME(workspaceSlug.toString()) : null,
    workspaceSlug ? () => workspaceService.workspaceMemberMe(workspaceSlug.toString()) : null
  );

  const { setToastAlert } = useToast();

  const { data: activeWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null,
    () => (workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null)
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<IWorkspace>({
    defaultValues: { ...defaultValues, ...activeWorkspace },
  });

  useEffect(() => {
    if (activeWorkspace) reset({ ...activeWorkspace });
  }, [activeWorkspace, reset]);

  const onSubmit = async (formData: IWorkspace) => {
    if (!activeWorkspace) return;

    const payload: Partial<IWorkspace> = {
      logo: formData.logo,
      name: formData.name,
      organization_size: formData.organization_size,
    };

    await workspaceService
      .updateWorkspace(activeWorkspace.slug, payload, user)
      .then((res) => {
        mutate<IWorkspace[]>(USER_WORKSPACES, (prevData) =>
          prevData?.map((workspace) => (workspace.id === res.id ? res : workspace))
        );
        mutate<IWorkspace>(WORKSPACE_DETAILS(workspaceSlug as string), (prevData) => {
          if (!prevData) return prevData;

          return {
            ...prevData,
            logo: formData.logo,
          };
        });
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Workspace updated successfully",
        });
      })
      .catch((err) => console.error(err));
  };

  const handleDelete = (url: string | null | undefined) => {
    if (!activeWorkspace || !url) return;

    setIsImageRemoving(true);

    fileService.deleteFile(activeWorkspace.id, url).then(() => {
      workspaceService
        .updateWorkspace(activeWorkspace.slug, { logo: "" }, user)
        .then((res) => {
          setToastAlert({
            type: "success",
            title: "Success!",
            message: "Workspace picture removed successfully.",
          });
          mutate<IWorkspace[]>(USER_WORKSPACES, (prevData) =>
            prevData?.map((workspace) => (workspace.id === res.id ? res : workspace))
          );
          mutate<IWorkspace>(WORKSPACE_DETAILS(workspaceSlug as string), (prevData) => {
            if (!prevData) return prevData;

            return {
              ...prevData,
              logo: "",
            };
          });
        })
        .catch(() => {
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "There was some error in deleting your profile picture. Please try again.",
          });
        })
        .finally(() => setIsImageRemoving(false));
    });
  };

  const isAdmin = memberDetails?.role === 20;

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${truncateText(activeWorkspace?.name ?? "Workspace", 32)} Settings`}
          />
        </Breadcrumbs>
      }
    >
      <ImageUploadModal
        isOpen={isImageUploadModalOpen}
        onClose={() => setIsImageUploadModalOpen(false)}
        onSuccess={(imageUrl) => {
          setIsImageUploading(true);
          setValue("logo", imageUrl);
          setIsImageUploadModalOpen(false);
          handleSubmit(onSubmit)().then(() => setIsImageUploading(false));
        }}
        value={watch("logo")}
      />
      <DeleteWorkspaceModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
        data={activeWorkspace ?? null}
        user={user}
      />
      <div className="p-8">
        <SettingsHeader />
        {activeWorkspace ? (
          <div className={`space-y-8 sm:space-y-12 ${isAdmin ? "" : "opacity-60"}`}>
            <div className="grid grid-cols-12 gap-4 sm:gap-16">
              <div className="col-span-12 sm:col-span-6">
                <h4 className="text-lg font-semibold">Logo</h4>
                <p className="text-sm text-custom-text-200">
                  Max file size is 5MB. Supported file types are .jpg and .png.
                </p>
              </div>
              <div className="col-span-12 sm:col-span-6">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setIsImageUploadModalOpen(true)}
                    disabled={!isAdmin}
                  >
                    {watch("logo") && watch("logo") !== null && watch("logo") !== "" ? (
                      <div className="relative mx-auto flex h-12 w-12">
                        <img
                          src={watch("logo")!}
                          className="absolute top-0 left-0 h-full w-full object-cover rounded-md"
                          alt="Workspace Logo"
                        />
                      </div>
                    ) : (
                      <div className="relative flex h-12 w-12 items-center justify-center rounded bg-gray-700 p-4 uppercase text-white">
                        {activeWorkspace?.name?.charAt(0) ?? "N"}
                      </div>
                    )}
                  </button>
                  {isAdmin && (
                    <div className="flex gap-4">
                      <SecondaryButton
                        onClick={() => {
                          setIsImageUploadModalOpen(true);
                        }}
                      >
                        {isImageUploading ? "Uploading..." : "Upload"}
                      </SecondaryButton>
                      {activeWorkspace.logo && activeWorkspace.logo !== "" && (
                        <DangerButton
                          onClick={() => handleDelete(activeWorkspace.logo)}
                          loading={isImageRemoving}
                        >
                          {isImageRemoving ? "Removing..." : "Remove"}
                        </DangerButton>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-4 sm:gap-16">
              <div className="col-span-12 sm:col-span-6">
                <h4 className="text-lg font-semibold">URL</h4>
                <p className="text-sm text-custom-text-200">Your workspace URL.</p>
              </div>
              <div className="col-span-12 flex items-center gap-2 sm:col-span-6">
                <div className="flex flex-col gap-1">
                  <Input
                    id="url"
                    name="url"
                    autoComplete="off"
                    register={register}
                    error={errors.url}
                    className="w-full"
                    value={`${
                      typeof window !== "undefined" &&
                      window.location.origin.replace("http://", "").replace("https://", "")
                    }/${activeWorkspace.slug}`}
                    disabled
                  />
                </div>
                <SecondaryButton
                  className="h-min"
                  onClick={() =>
                    copyTextToClipboard(
                      `${typeof window !== "undefined" && window.location.origin}/${
                        activeWorkspace.slug
                      }`
                    ).then(() => {
                      setToastAlert({
                        type: "success",
                        title: "Link Copied!",
                        message: "Workspace link copied to clipboard.",
                      });
                    })
                  }
                  outline
                >
                  <LinkIcon className="h-[18px] w-[18px]" />
                </SecondaryButton>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-4 sm:gap-16">
              <div className="col-span-12 sm:col-span-6">
                <h4 className="text-lg font-semibold">Name</h4>
                <p className="text-sm text-custom-text-200">Give a name to your workspace.</p>
              </div>
              <div className="col-span-12 sm:col-span-6">
                <Input
                  id="name"
                  name="name"
                  placeholder="Name"
                  autoComplete="off"
                  register={register}
                  error={errors.name}
                  validations={{
                    required: "Name is required",
                    maxLength: {
                      value: 80,
                      message: "Workspace name should not exceed 80 characters",
                    },
                  }}
                  disabled={!isAdmin}
                />
              </div>
            </div>
            <div className="grid grid-cols-12 gap-4 sm:gap-16">
              <div className="col-span-12 sm:col-span-6">
                <h4 className="text-lg font-semibold">Organization Size</h4>
                <p className="text-sm text-custom-text-200">What size is your organization?</p>
              </div>
              <div className="col-span-12 sm:col-span-6">
                <Controller
                  name="organization_size"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <CustomSelect
                      value={value}
                      onChange={onChange}
                      label={
                        ORGANIZATION_SIZE.find((c) => c === value) ?? "Select organization size"
                      }
                      width="w-full"
                      input
                      disabled={!isAdmin}
                    >
                      {ORGANIZATION_SIZE?.map((item) => (
                        <CustomSelect.Option key={item} value={item}>
                          {item}
                        </CustomSelect.Option>
                      ))}
                    </CustomSelect>
                  )}
                />
              </div>
            </div>

            {isAdmin && (
              <>
                <div className="sm:text-right">
                  <SecondaryButton
                    onClick={handleSubmit(onSubmit)}
                    loading={isSubmitting}
                    disabled={!isAdmin}
                  >
                    {isSubmitting ? "Updating..." : "Update Workspace"}
                  </SecondaryButton>
                </div>
                <div className="grid grid-cols-12 gap-4 sm:gap-16">
                  <div className="col-span-12 sm:col-span-6">
                    <h4 className="text-lg font-semibold">Danger Zone</h4>
                    <p className="text-sm text-custom-text-200">
                      The danger zone of the workspace delete page is a critical area that requires
                      careful consideration and attention. When deleting a workspace, all of the
                      data and resources within that workspace will be permanently removed and
                      cannot be recovered.
                    </p>
                  </div>
                  <div className="col-span-12 sm:col-span-6">
                    <DangerButton onClick={() => setIsOpen(true)} outline>
                      Delete the workspace
                    </DangerButton>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="grid h-full w-full place-items-center px-4 sm:px-0">
            <Spinner />
          </div>
        )}
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default WorkspaceSettings;
