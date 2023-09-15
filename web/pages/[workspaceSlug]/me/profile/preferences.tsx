import {useEffect, useState} from "react";
import {useTranslation} from "next-i18next";

// hooks
import useUserAuth from "hooks/use-user-auth";
// layouts
import {WorkspaceAuthorizationLayout} from "layouts/auth-layout";
import SettingsNavbar from "layouts/settings-navbar";
// components
import {CustomThemeSelector, ThemeSwitch} from "components/core";
// ui
import {Spinner} from "components/ui";
import {BreadcrumbItem, Breadcrumbs} from "components/breadcrumbs";
// types
import {ICustomTheme} from "types";
// mobx react lite
import {observer} from "mobx-react-lite";
// mobx store
import {useMobxStore} from "lib/mobx/store-provider";
import {GetStaticProps} from "next";
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

const ProfilePreferences = observer(() => {
    const {user: myProfile} = useUserAuth();

    const store: any = useMobxStore();

    // console.log("store", store?.theme?.theme);
    // console.log("theme", theme);

    const [customThemeSelectorOptions, setCustomThemeSelectorOptions] = useState(false);

    const [preLoadedData, setPreLoadedData] = useState<ICustomTheme | null>(null);

    useEffect(() => {
        if (store?.user && store?.theme?.theme === "custom") {
            const currentTheme = store?.user?.currentUserSettings?.theme;
            if (currentTheme.palette)
                setPreLoadedData({
                    background: currentTheme.background !== "" ? currentTheme.background : "#0d101b",
                    text: currentTheme.text !== "" ? currentTheme.text : "#c5c5c5",
                    primary: currentTheme.primary !== "" ? currentTheme.primary : "#3f76ff",
                    sidebarBackground:
                        currentTheme.sidebarBackground !== "" ? currentTheme.sidebarBackground : "#0d101b",
                    sidebarText: currentTheme.sidebarText !== "" ? currentTheme.sidebarText : "#c5c5c5",
                    darkPalette: false,
                    palette:
                        currentTheme.palette !== ",,,,"
                            ? currentTheme.palette
                            : "#0d101b,#c5c5c5,#3f76ff,#0d101b,#c5c5c5",
                    theme: "custom",
                });
            setCustomThemeSelectorOptions((prevData) => true);
        }
    }, [store, store?.theme?.theme]);


    const {t} = useTranslation();
    return (
        <WorkspaceAuthorizationLayout
            breadcrumbs={
                <Breadcrumbs>
                    <BreadcrumbItem title={t("profile.my-profile-preferences")}/>
                </Breadcrumbs>
            }
        >
            {myProfile ? (
                <div className="p-8">
                    <div className="mb-8 space-y-6">
                        <div>
                            <h3 className="text-3xl font-semibold">{t("profile.profile-settings")}</h3>
                            <p className="mt-1 text-custom-text-200">
                                {t("profile.information-visible-only-you")}
                            </p>
                        </div>
                        <SettingsNavbar profilePage/>
                    </div>
                    <div className="space-y-8 sm:space-y-12">
                        <div className="grid grid-cols-12 gap-4 sm:gap-16">
                            <div className="col-span-12 sm:col-span-6">
                                <h4 className="text-lg font-semibold text-custom-text-100">{t("profile.theme")}</h4>
                                <p className="text-sm text-custom-text-200">
                                    {t("profile.select-your-color-scheme")}
                                </p>
                            </div>
                            <div className="col-span-12 sm:col-span-6">
                                <ThemeSwitch
                                    setPreLoadedData={setPreLoadedData}
                                    customThemeSelectorOptions={customThemeSelectorOptions}
                                    setCustomThemeSelectorOptions={setCustomThemeSelectorOptions}
                                />
                            </div>
                        </div>
                        {customThemeSelectorOptions && <CustomThemeSelector preLoadedData={preLoadedData}/>}
                    </div>
                </div>
            ) : (
                <div className="grid h-full w-full place-items-center px-4 sm:px-0">
                    <Spinner/>
                </div>
            )}
        </WorkspaceAuthorizationLayout>
    );
});

export default ProfilePreferences;
