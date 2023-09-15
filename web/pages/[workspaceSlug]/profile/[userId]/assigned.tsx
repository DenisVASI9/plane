import React from "react";

// contexts
import { ProfileIssuesContextProvider } from "contexts/profile-issues-context";
import { ProfileAuthWrapper } from "layouts/profile-layout";
// components
import { ProfileIssuesView } from "components/profile";
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


const ProfileAssignedIssues: NextPage = () => (
  <ProfileIssuesContextProvider>
    <ProfileAuthWrapper>
      <ProfileIssuesView />
    </ProfileAuthWrapper>
  </ProfileIssuesContextProvider>
);

export default ProfileAssignedIssues;
