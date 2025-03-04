// next
import Link from "next/link";
// react
import React from "react";
// icons
import { ChevronRightIcon } from "@heroicons/react/24/outline";

type EmptySpaceProps = {
  title: string;
  description: string;
  children: any;
  Icon?: any;
  link?: { text: string; href: string };
};

const EmptySpace: React.FC<EmptySpaceProps> = ({ title, description, children, Icon, link }) => (
  <>
    <div className="max-w-lg">
      {Icon ? (
        <div className="mb-4">
          <Icon className="h-14 w-14 text-custom-text-200" />
        </div>
      ) : null}

      <h2 className="text-lg font-medium text-custom-text-100">{title}</h2>
      <div className="mt-1 text-sm text-custom-text-200">{description}</div>
      <ul
        role="list"
        className="mt-6 divide-y divide-custom-border-200 border-t border-b border-custom-border-200"
      >
        {children}
      </ul>
      {link ? (
        <div className="mt-6 flex">
          <Link
            href={link.href}
            className="text-sm font-medium text-custom-primary hover:text-custom-primary">

            {link.text}
            <span aria-hidden="true"> &rarr;</span>

          </Link>
        </div>
      ) : null}
    </div>
  </>
);

type EmptySpaceItemProps = {
  title: string;
  description?: React.ReactNode | string;
  Icon: any;
  action: () => void;
};

const EmptySpaceItem: React.FC<EmptySpaceItemProps> = ({ title, description, Icon, action }) => (
  <>
    <li className="cursor-pointer" onClick={action}>
      <div
        className={`group relative flex ${
          description ? "items-start" : "items-center"
        } space-x-3 py-4`}
      >
        <div className="flex-shrink-0">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-custom-primary">
            <Icon className="h-6 w-6 text-white" aria-hidden="true" />
          </span>
        </div>
        <div className="min-w-0 flex-1 text-custom-text-200">
          <div className="text-sm font-medium group-hover:text-custom-text-100">{title}</div>
          {description ? <div className="text-sm">{description}</div> : null}
        </div>
        <div className="flex-shrink-0 self-center">
          <ChevronRightIcon
            className="h-5 w-5 text-custom-text-200 group-hover:text-custom-text-100"
            aria-hidden="true"
          />
        </div>
      </div>
    </li>
  </>
);

export { EmptySpace, EmptySpaceItem };
