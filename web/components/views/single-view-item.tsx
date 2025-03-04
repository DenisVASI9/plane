import React from "react";
import { mutate } from "swr";
import Link from "next/link";
import { useRouter } from "next/router";

// icons
import { TrashIcon, StarIcon, PencilIcon } from "@heroicons/react/24/outline";
import { StackedLayersIcon } from "components/icons";
//components
import { CustomMenu, Tooltip } from "components/ui";
// services
import viewsService from "services/views.service";
// types
import { IView } from "types";
// fetch keys
import { VIEWS_LIST } from "constants/fetch-keys";
// hooks
import useToast from "hooks/use-toast";
// helpers
import { truncateText } from "helpers/string.helper";
import { renderShortDateWithYearFormat, render24HourFormatTime } from "helpers/date-time.helper";

type Props = {
  view: IView;
  handleEditView: () => void;
  handleDeleteView: () => void;
};

export const SingleViewItem: React.FC<Props> = ({ view, handleEditView, handleDeleteView }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const handleAddToFavorites = () => {
    if (!workspaceSlug || !projectId || !view) return;

    mutate<IView[]>(
      VIEWS_LIST(projectId as string),
      (prevData) =>
        (prevData ?? []).map((v) => ({
          ...v,
          is_favorite: v.id === view.id ? true : v.is_favorite,
        })),
      false
    );

    viewsService
      .addViewToFavorites(workspaceSlug as string, projectId as string, {
        view: view.id,
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Couldn't add the view to favorites. Please try again.",
        });
      });
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug || !view) return;

    mutate<IView[]>(
      VIEWS_LIST(projectId as string),
      (prevData) =>
        (prevData ?? []).map((v) => ({
          ...v,
          is_favorite: v.id === view.id ? false : v.is_favorite,
        })),
      false
    );

    viewsService
      .removeViewFromFavorites(workspaceSlug as string, projectId as string, view.id)
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Couldn't remove the view from favorites. Please try again.",
        });
      });
  };

  return (
    <div className="first:rounded-t-[10px] last:rounded-b-[10px] hover:bg-custom-background-90">
      <Link href={`/${workspaceSlug}/projects/${projectId}/views/${view.id}`}>

        <div className="relative rounded p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StackedLayersIcon height={18} width={18} />
              <p className="mr-2 truncate text-sm">{truncateText(view.name, 75)}</p>
            </div>
            <div className="ml-2 flex flex-shrink-0">
              <div className="flex items-center gap-2">
                <p className="rounded-full bg-custom-background-80 py-0.5 px-2 text-xs text-custom-text-200">
                  {Object.keys(view.query_data)
                    .map((key: string) =>
                      view.query_data[key as keyof typeof view.query_data] !== null
                        ? (view.query_data[key as keyof typeof view.query_data] as any).length
                        : 0
                    )
                    .reduce((curr, prev) => curr + prev, 0)}{" "}
                  filters
                </p>
                <Tooltip
                  tooltipContent={`Last updated at ${render24HourFormatTime(
                    view.updated_at
                  )} ${renderShortDateWithYearFormat(view.updated_at)}`}
                >
                  <p className="text-sm text-custom-text-200">
                    {render24HourFormatTime(view.updated_at)}
                  </p>
                </Tooltip>
                {view.is_favorite ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveFromFavorites();
                    }}
                  >
                    <StarIcon className="h-4 w-4 text-orange-400" fill="#f6ad55" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAddToFavorites();
                    }}
                  >
                    <StarIcon className="h-4 w-4 " color="rgb(var(--color-text-200))" />
                  </button>
                )}
                <CustomMenu width="auto" verticalEllipsis>
                  <CustomMenu.MenuItem
                    onClick={(e: any) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEditView();
                    }}
                  >
                    <span className="flex items-center justify-start gap-2">
                      <PencilIcon className="h-3.5 w-3.5" />
                      <span>Edit View</span>
                    </span>
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem
                    onClick={(e: any) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteView();
                    }}
                  >
                    <span className="flex items-center justify-start gap-2">
                      <TrashIcon className="h-3.5 w-3.5" />
                      <span>Delete View</span>
                    </span>
                  </CustomMenu.MenuItem>
                </CustomMenu>
              </div>
            </div>
          </div>
          {view?.description && (
            <p className="px-[27px] text-sm font-normal leading-5 text-custom-text-200">
              {view.description}
            </p>
          )}
        </div>

      </Link>
    </div>
  );
};
