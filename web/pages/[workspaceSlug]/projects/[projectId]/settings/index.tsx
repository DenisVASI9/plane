import { useEffect, useState } from "react";
import {useTranslation} from 'next-i18next';
import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// headless ui
import { Disclosure, Transition } from "@headlessui/react";
// react-hook-form
import { Controller, useForm } from "react-hook-form";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// services
import projectService from "services/project.service";
// components
import { DeleteProjectModal, SettingsSidebar } from "components/project";
import { ImagePickerPopover } from "components/core";
import EmojiIconPicker from "components/emoji-icon-picker";
// hooks
import useToast from "hooks/use-toast";
import useUserAuth from "hooks/use-user-auth";
// ui
import {
  Input,
  TextArea,
  Loader,
  CustomSelect,
  SecondaryButton,
  DangerButton,
  Icon,
  PrimaryButton,
} from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// helpers
import { renderEmoji } from "helpers/emoji.helper";
import { truncateText } from "helpers/string.helper";
import { renderShortDateWithYearFormat } from "helpers/date-time.helper";
// types
import { IProject, IWorkspace } from "types";
import type {GetStaticProps, NextPage} from "next";
// fetch-keys
import { PROJECTS_LIST, PROJECT_DETAILS, USER_PROJECT_VIEW } from "constants/fetch-keys";
// constants
import { NETWORK_CHOICES } from "constants/project";

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

const defaultValues: Partial<IProject> = {
  name: "",
  description: "",
  identifier: "",
  network: 0,
};

const GeneralSettings: NextPage = () => {
  const { t } = useTranslation();
  const [selectProject, setSelectedProject] = useState<string | null>(null);

  const { user } = useUserAuth();

  const { setToastAlert } = useToast();

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: projectDetails } = useSWR<IProject>(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: memberDetails, error } = useSWR(
    workspaceSlug && projectId ? USER_PROJECT_VIEW(projectId.toString()) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMemberMe(workspaceSlug.toString(), projectId.toString())
      : null
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<IProject>({
    defaultValues,
  });

  useEffect(() => {
    if (projectDetails)
      reset({
        ...projectDetails,
        emoji_and_icon: projectDetails.emoji ?? projectDetails.icon_prop,
        workspace: (projectDetails.workspace as IWorkspace).id,
      });
  }, [projectDetails, reset]);

  const updateProject = async (payload: Partial<IProject>) => {
    if (!workspaceSlug || !projectDetails) return;

    await projectService
      .updateProject(workspaceSlug as string, projectDetails.id, payload, user)
      .then((res) => {
        mutate<IProject>(
          PROJECT_DETAILS(projectDetails.id),
          (prevData) => ({ ...prevData, ...res }),
          false
        );

        mutate(
          PROJECTS_LIST(workspaceSlug as string, {
            is_favorite: "all",
          })
        );

        setToastAlert({
          type: "success",
          title: t("success"),
          message: t("projects.settings.project-updated-successfully"),
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: t("error"),
          message: t("projects.settings.project-not-updated"),
        });
      });
  };

  const onSubmit = async (formData: IProject) => {
    if (!workspaceSlug || !projectDetails) return;

    const payload: Partial<IProject> = {
      name: formData.name,
      network: formData.network,
      identifier: formData.identifier,
      description: formData.description,
      cover_image: formData.cover_image,
    };

    if (typeof formData.emoji_and_icon === "object") {
      payload.emoji = null;
      payload.icon_prop = formData.emoji_and_icon;
    } else {
      payload.emoji = formData.emoji_and_icon;
      payload.icon_prop = null;
    }

    if (projectDetails.identifier !== formData.identifier)
      await projectService
        .checkProjectIdentifierAvailability(workspaceSlug as string, payload.identifier ?? "")
        .then(async (res) => {
          if (res.exists) setError("identifier", { message: t("projects.settings.identifier-already-exists") });
          else await updateProject(payload);
        });
    else await updateProject(payload);
  };

  const handleIdentifierChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;

    const alphanumericValue = value.replace(/[^a-zA-Z0-9]/g, "");
    const formattedValue = alphanumericValue.toUpperCase();

    setValue("identifier", formattedValue);
  };

  const currentNetwork = NETWORK_CHOICES.find((n) => n.key === projectDetails?.network);

  const isAdmin = memberDetails?.role === 20;

  return (
    <ProjectAuthorizationWrapper
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${truncateText(projectDetails?.name ?? t("project"), 32)}`}
            link={`/${workspaceSlug}/projects/${projectDetails?.id}/issues`}
            linkTruncate
          />
          <BreadcrumbItem title={t("general-settings")} unshrinkTitle />
        </Breadcrumbs>
      }
    >
      <DeleteProjectModal
        data={projectDetails ?? null}
        isOpen={Boolean(selectProject)}
        onClose={() => setSelectedProject(null)}
        user={user}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-row gap-2">
          <div className="w-80 py-8">
            <SettingsSidebar />
          </div>
          <div className={`pr-9 py-8 w-full ${isAdmin ? "" : "opacity-60"}`}>
            <div className="relative h-44 w-full mt-6">
              <img
                src={watch("cover_image")!}
                alt={watch("cover_image")!}
                className="h-44 w-full rounded-md object-cover"
              />
              <div className="flex items-end justify-between absolute bottom-4 w-full px-4">
                <div className="flex gap-3">
                  <div className="flex items-center justify-center bg-custom-background-90 h-[52px] w-[52px] rounded-lg">
                    {projectDetails ? (
                      <div className="h-7 w-7 grid place-items-center">
                        <Controller
                          control={control}
                          name="emoji_and_icon"
                          render={({ field: { value, onChange } }) => (
                            <EmojiIconPicker
                              label={value ? renderEmoji(value) : "Icon"}
                              value={value}
                              onChange={onChange}
                              disabled={!isAdmin}
                            />
                          )}
                        />
                      </div>
                    ) : (
                      <Loader>
                        <Loader.Item height="46px" width="46px" />
                      </Loader>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 text-white">
                    <span className="text-lg font-semibold">{watch("name")}</span>
                    <span className="flex items-center gap-2 text-sm">
                      <span>
                        {watch("identifier")} . {currentNetwork?.label}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex justify-center">
                  {projectDetails ? (
                    <div>
                      <Controller
                        control={control}
                        name="cover_image"
                        render={({ field: { value, onChange } }) => (
                          <ImagePickerPopover
                            label={"Change cover"}
                            onChange={(imageUrl) => {
                              setValue("cover_image", imageUrl);
                            }}
                            value={watch("cover_image")}
                            disabled={!isAdmin}
                          />
                        )}
                      />
                    </div>
                  ) : (
                    <Loader>
                      <Loader.Item height="32px" width="108px" />
                    </Loader>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-8 my-8">
              <div className="flex flex-col gap-1">
                <h4 className="text-sm">{t("projects.settings.project-name")}</h4>
                {projectDetails ? (
                  <Input
                    id="name"
                    name="name"
                    error={errors.name}
                    register={register}
                    className="!p-3 rounded-md font-medium"
                    placeholder="Project Name"
                    validations={{
                      required: t("projects.settings.name-is-required"),
                    }}
                    disabled={!isAdmin}
                  />
                ) : (
                  <Loader>
                    <Loader.Item height="46px" width="100%" />
                  </Loader>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <h4 className="text-sm">{t("description")}</h4>
                {projectDetails ? (
                  <TextArea
                    id="description"
                    name="description"
                    error={errors.description}
                    register={register}
                    placeholder="Enter project description"
                    validations={{}}
                    className="min-h-[102px] text-sm"
                    disabled={!isAdmin}
                  />
                ) : (
                  <Loader className="w-full">
                    <Loader.Item height="102px" width="full" />
                  </Loader>
                )}
              </div>

              <div className="flex items-center justify-between gap-10 w-full">
                <div className="flex flex-col gap-1 w-1/2">
                  <h4 className="text-sm">{t("projects.settings.identifier")}</h4>
                  {projectDetails ? (
                    <Input
                      id="identifier"
                      name="identifier"
                      error={errors.identifier}
                      register={register}
                      placeholder="Enter identifier"
                      onChange={handleIdentifierChange}
                      validations={{
                        required: t("projects.settings.identifier-is-required"),
                        validate: (value) =>
                          /^[A-Z0-9]+$/.test(value.toUpperCase()) ||
                          t("projects.settings.identifier-must-be-uppercase"),
                        minLength: {
                          value: 1,
                          message: t("projects.settings.identifier-must-least-be-of-1"),
                        },
                        maxLength: {
                          value: 5,
                          message: t("projects.settings.identifier-must-at-most-be-of-5"),
                        },
                      }}
                      disabled={!isAdmin}
                    />
                  ) : (
                    <Loader>
                      <Loader.Item height="36px" width="100%" />
                    </Loader>
                  )}
                </div>

                <div className="flex flex-col gap-1 w-1/2">
                  <h4 className="text-sm">{t("network")}</h4>
                  {projectDetails ? (
                    <Controller
                      name="network"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <CustomSelect
                          value={value}
                          onChange={onChange}
                          label={currentNetwork?.label ?? "Select network"}
                          className="!border-custom-border-200 !shadow-none"
                          input
                          disabled={!isAdmin}
                        >
                          {NETWORK_CHOICES.map((network) => (
                            <CustomSelect.Option key={network.key} value={network.key}>
                              {network.label}
                            </CustomSelect.Option>
                          ))}
                        </CustomSelect>
                      )}
                    />
                  ) : (
                    <Loader className="w-full">
                      <Loader.Item height="46px" width="100%" />
                    </Loader>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                {projectDetails ? (
                  <>
                    <PrimaryButton type="submit" loading={isSubmitting} disabled={!isAdmin}>
                      {isSubmitting ? "Updating Project..." : "Update Project"}
                    </PrimaryButton>
                    <span className="text-sm text-custom-sidebar-text-400 italic">
                      {t("projects.settings.сreated-on")} {renderShortDateWithYearFormat(projectDetails?.created_at)}
                    </span>
                  </>
                ) : (
                  <Loader className="mt-2 w-full">
                    <Loader.Item height="34px" width="100px" />
                  </Loader>
                )}
              </div>
            </div>

            <Disclosure as="div" className="border-t border-custom-border-400">
              {({ open }) => (
                <div className="w-full">
                  <Disclosure.Button
                    as="button"
                    type="button"
                    className="flex items-center justify-between w-full py-4"
                  >
                    <span className="text-xl tracking-tight">{t("projects.settings.danger-zone")}</span>
                    <Icon iconName={open ? "expand_more" : "expand_less"} className="!text-2xl" />
                  </Disclosure.Button>

                  <Transition
                    show={open}
                    enter="transition duration-100 ease-out"
                    enterFrom="transform opacity-0"
                    enterTo="transform opacity-100"
                    leave="transition duration-75 ease-out"
                    leaveFrom="transform opacity-100"
                    leaveTo="transform opacity-0"
                  >
                    <Disclosure.Panel>
                      <div className="flex flex-col gap-8">
                        <span className="text-sm tracking-tight">
                          {t("projects.settings.the-danger-zone")}
                        </span>
                        <div>
                          {projectDetails ? (
                            <div>
                              <DangerButton
                                onClick={() => setSelectedProject(projectDetails.id ?? null)}
                                className="!text-sm"
                                outline
                              >
                                {t("projects.settings.delete-my-project")}
                              </DangerButton>
                            </div>
                          ) : (
                            <Loader className="mt-2 w-full">
                              <Loader.Item height="38px" width="144px" />
                            </Loader>
                          )}
                        </div>
                      </div>
                    </Disclosure.Panel>
                  </Transition>
                </div>
              )}
            </Disclosure>
          </div>
        </div>
      </form>
    </ProjectAuthorizationWrapper>
  );
};

export default GeneralSettings;
