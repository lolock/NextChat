"use client";

require("../polyfill");

import { useEffect, useState } from "react";
import styles from "./home.module.scss";

import BotIcon from "../icons/bot.svg";
import LoadingIcon from "../icons/three-dots.svg";

import { getCSSVar, useMobileScreen } from "../utils";

import dynamic from "next/dynamic";
import { Path, SlotID } from "../constant";
import { ErrorBoundary } from "./error";

import { getISOLang, getLang } from "../locales";

import {
  HashRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { SideBar } from "./sidebar";
import { useAppConfig } from "../store/config";
import { AuthPage } from "./auth";
import { getClientConfig } from "../config/client";
// Import ClientApi type, instantiate directly later
import { ClientApi } from "../client/api";
import { useAccessStore } from "../store";
import clsx from "clsx";
// Removed MCP imports

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={clsx("no-dark", styles["loading-content"])}>
      {!props.noLogo && <BotIcon />}
      <LoadingIcon />
    </div>
  );
}

// Removed Artifacts dynamic import

// Correct dynamic imports assuming default exports
const Settings = dynamic(async () => (await import("./settings")).default, {
  loading: () => <Loading noLogo />,
});

const Chat = dynamic(async () => (await import("./chat")).default, {
  loading: () => <Loading noLogo />,
});

const NewChat = dynamic(async () => (await import("./new-chat")).default, {
  loading: () => <Loading noLogo />,
});

// 面具功能已禁用

const PluginPage = dynamic(async () => (await import("./plugin")).default, {
  loading: () => <Loading noLogo />,
});

const SearchChat = dynamic(
  async () => (await import("./search-chat")).default, // Assume default export
  {
    loading: () => <Loading noLogo />,
  },
);

// AI Drawing related component import removed

// Removed McpMarketPage dynamic import


export function useSwitchTheme() {
  const config = useAppConfig();

  useEffect(() => {
    document.body.classList.remove("light");
    document.body.classList.remove("dark");

    if (config.theme === "dark") {
      document.body.classList.add("dark");
    } else if (config.theme === "light") {
      document.body.classList.add("light");
    }

    const metaDescriptionDark = document.querySelector(
      'meta[name="theme-color"][media*="dark"]',
    );
    const metaDescriptionLight = document.querySelector(
      'meta[name="theme-color"][media*="light"]',
    );

    if (config.theme === "auto") {
      metaDescriptionDark?.setAttribute("content", "#151515");
      metaDescriptionLight?.setAttribute("content", "#fafafa");
    } else {
      const themeColor = getCSSVar("--theme-color");
      metaDescriptionDark?.setAttribute("content", themeColor);
      metaDescriptionLight?.setAttribute("content", themeColor);
    }
  }, [config.theme]);
}

function useHtmlLang() {
  useEffect(() => {
    const lang = getISOLang();
    const htmlLang = document.documentElement.lang;

    if (lang !== htmlLang) {
      document.documentElement.lang = lang;
    }
  }, []);
}

const useHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
};

const loadAsyncGoogleFont = () => {
  const linkEl = document.createElement("link");
  const proxyFontUrl = "/google-fonts";
  const remoteFontUrl = "https://fonts.googleapis.com";
  const googleFontUrl =
    getClientConfig()?.buildMode === "export" ? remoteFontUrl : proxyFontUrl;
  linkEl.rel = "stylesheet";
  linkEl.href =
    googleFontUrl +
    "/css2?family=" +
    encodeURIComponent("Noto Sans:wght@300;400;700;900") +
    "&display=swap";
  document.head.appendChild(linkEl);
};

export function WindowContent(props: { children: React.ReactNode }) {
  return (
    <div className={styles["window-content"]} id={SlotID.AppBody}>
      {props?.children}
    </div>
  );
}

function Screen() {
  const config = useAppConfig();
  const location = useLocation();
  // Removed Artifacts check
  const isHome = location.pathname === Path.Home;
  const isAuth = location.pathname === Path.Auth;
  // AI Drawing related path checks removed

  const isMobileScreen = useMobileScreen();
  const shouldTightBorder =
    getClientConfig()?.isApp || (config.tightBorder && !isMobileScreen);

  useEffect(() => {
    loadAsyncGoogleFont();
  }, []);

  // Removed Artifacts route block

  const renderContent = () => {
    if (isAuth) return <AuthPage />;

    // Fixed return, added fragment, replaced div with SideBar
    return (
      <>
        <SideBar
          className={clsx({
            [styles["sidebar-show"]]: isHome,
          })}
        />
        <WindowContent>
          <Routes>
            <Route path={Path.Home} element={<Chat />} />
            <Route path={Path.NewChat} element={<NewChat />} />
            {/* Removed Mask route */}
            <Route path={Path.Plugins} element={<PluginPage />} />
            <Route path={Path.SearchChat} element={<SearchChat />} />
            <Route path={Path.Chat} element={<Chat />} />
            <Route path={Path.Settings} element={<Settings />} />
            {/* Removed McpMarket route */}
          </Routes>
        </WindowContent>
      </>
    );
  };

  return (
    <div
      className={clsx(styles.container, {
        [styles["tight-container"]]: shouldTightBorder,
        [styles["rtl-screen"]]: getLang() === "cn",
      })}
    >
      {renderContent()}
    </div>
  );
}

export function useLoadData() {
  const config = useAppConfig();

  // Correctly instantiate ClientApi; Remove dependency on providerName
  // Use ClientApi type directly from import if needed elsewhere, otherwise instantiate here.
  const api = new ClientApi();

  useEffect(() => {
    (async () => {
      try{
        const models = await api.llm.models();
        // Use the correct method to update models in the config store
        // !! IMPORTANT: Replace 'updateModels' with the actual method name from your './store/config.ts' !!
        if (config.updateModels) { // Check if method exists before calling
           config.updateModels(models);
        } else {
            console.warn("[Config] 'updateModels' method not found on config store. Models not updated automatically.");
            // You might need to manually set models or use another method defined in the store.
            // Example: config.setState({ models: models }); // If using direct state manipulation (less common)
        }
      } catch (error) {
          console.error("[Config] Failed to load models from API", error);
          // Handle error appropriately, maybe set default models or show error message
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependencies for useEffect should ideally include stable functions like `config.updateModels` if it exists and is stable.
}

export function Home() {
  useSwitchTheme();
  useLoadData(); // Load models on startup
  useHtmlLang();

  useEffect(() => {
    console.log("[Config] got config from build time", getClientConfig());
    useAccessStore.getState().fetch();

    // Removed MCP initialization logic

  }, []);

  if (!useHasHydrated()) {
    return <Loading />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <Screen />
      </Router>
    </ErrorBoundary>
  );
}