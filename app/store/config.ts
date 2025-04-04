import { LLMModel } from "../client/api";
import { DalleQuality, DalleStyle, ModelSize } from "../typing";
import { getClientConfig } from "../config/client";
import {
  DEFAULT_INPUT_TEMPLATE,
  DEFAULT_MODELS,
  DEFAULT_SIDEBAR_WIDTH,
  DEFAULT_TTS_ENGINE,
  DEFAULT_TTS_ENGINES,
  DEFAULT_TTS_MODEL,
  DEFAULT_TTS_MODELS,
  DEFAULT_TTS_VOICE,
  DEFAULT_TTS_VOICES,
  StoreKey,
\n  // ServiceProvider import removed as provider selection is removed
} from "../constant";
import { createPersistStore } from "../utils/store";
import type { Voice } from "rt-client";

export type ModelType = (typeof DEFAULT_MODELS)[number]["name"];
export type TTSModelType = (typeof DEFAULT_TTS_MODELS)[number];
export type TTSVoiceType = (typeof DEFAULT_TTS_VOICES)[number];
export type TTSEngineType = (typeof DEFAULT_TTS_ENGINES)[number];

export enum SubmitKey {
  Enter = "Enter",
  CtrlEnter = "Ctrl + Enter",
  ShiftEnter = "Shift + Enter",
  AltEnter = "Alt + Enter",
  MetaEnter = "Meta + Enter",
}

export enum Theme {
  Auto = "auto",
  Dark = "dark",
  Light = "light",
}

const config = getClientConfig();

export const DEFAULT_CONFIG = {
  lastUpdate: Date.now(), // timestamp, to merge state

  submitKey: SubmitKey.Enter,
  avatar: "1f603",
  fontSize: 14,
  fontFamily: "",
  theme: Theme.Auto as Theme,
  tightBorder: !!config?.isApp,
  sendPreviewBubble: true,
  enableAutoGenerateTitle: true,
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,

  enableArtifacts: true, // show artifacts config

  enableCodeFold: true, // code fold config

  disablePromptHint: false,

  // dontShowMaskSplashScreen: false, // dont show splash screen when create chat
  // hideBuiltinMasks: false, // dont add builtin masks

  customModels: "",
  models: DEFAULT_MODELS as any as LLMModel[],

  modelConfig: {
    model: "gpt-4o-mini" as ModelType,
    // providerName field removed
    temperature: 0.5,
    top_p: 1,
    max_tokens: 4000,
    presence_penalty: 0,
    frequency_penalty: 0,
    sendMemory: true,
    historyMessageCount: 4,
    compressMessageLengthThreshold: 1000,
    compressModel: "",
    // compressProviderName field removed
    enableInjectSystemPrompts: true,
    template: config?.template ?? DEFAULT_INPUT_TEMPLATE,
    size: "1024x1024" as ModelSize,
    quality: "standard" as DalleQuality,
    style: "vivid" as DalleStyle,
  },

  ttsConfig: {
    enable: false,
    autoplay: false,
    engine: DEFAULT_TTS_ENGINE,
    model: DEFAULT_TTS_MODEL,
    voice: DEFAULT_TTS_VOICE,
    speed: 1.0,
  },

  realtimeConfig: {
    enable: false,
    // provider field removed
    model: "gpt-4o-realtime-preview-2024-10-01",
    apiKey: "",
    azure: {
      endpoint: "",
      deployment: "",
    },
    temperature: 0.9,
    voice: "alloy" as Voice,
  },
};

export type ChatConfig = typeof DEFAULT_CONFIG;

export type ModelConfig = ChatConfig["modelConfig"];
export type TTSConfig = ChatConfig["ttsConfig"];
export type RealtimeConfig = ChatConfig["realtimeConfig"];

export function limitNumber(
  x: number,
  min: number,
  max: number,
  defaultValue: number,
) {
  if (isNaN(x)) {
    return defaultValue;
  }

  return Math.min(max, Math.max(min, x));
}

export const TTSConfigValidator = {
  engine(x: string) {
    return x as TTSEngineType;
  },
  model(x: string) {
    return x as TTSModelType;
  },
  voice(x: string) {
    return x as TTSVoiceType;
  },
  speed(x: number) {
    return limitNumber(x, 0.25, 4.0, 1.0);
  },
};

export const ModalConfigValidator = {
  model(x: string) {
    return x as ModelType;
  },
  max_tokens(x: number) {
    return limitNumber(x, 0, 512000, 1024);
  },
  presence_penalty(x: number) {
    return limitNumber(x, -2, 2, 0);
  },
  frequency_penalty(x: number) {
    return limitNumber(x, -2, 2, 0);
  },
  temperature(x: number) {
    return limitNumber(x, 0, 2, 1);
  },
  top_p(x: number) {
    return limitNumber(x, 0, 1, 1);
  },
};

export const useAppConfig = createPersistStore(
  { ...DEFAULT_CONFIG },
  (set, get) => ({
    reset() {
      set(() => ({ ...DEFAULT_CONFIG }));
    },

    // mergeModels function is removed as provider logic is simplified

    updateModels(newModels: LLMModel[]) {
      if (!newModels) return;
      // Directly set the models provided by the backend
      set(() => ({ models: newModels.filter(m => m.available) }));
    },

    allModels() {
      // This might need adjustment depending on how models are fetched now
      return get().models;
    },
  }),
  {
    name: StoreKey.Config,
    version: 4.2, // Increment version due to schema change

    merge(persistedState, currentState) {
      const state = persistedState as ChatConfig | undefined;
      if (!state) return { ...currentState };
      const models = currentState.models.slice();
      // Simplified merge logic assuming single provider source
      state.models.forEach((pModel) => {
        const idx = models.findIndex((v) => v.name === pModel.name);
        if (idx === -1) {
          models.push(pModel);
        } else {
          // Optional: update existing model details if needed
          // models[idx] = { ...models[idx], ...pModel };
      return { ...currentState, ...state, models: models };
    },

    migrate(persistedState, version) {
      const state = persistedState as ChatConfig;

      if (version < 3.4) {
        state.modelConfig.sendMemory = true;
        state.modelConfig.historyMessageCount = 4;
        state.modelConfig.compressMessageLengthThreshold = 1000;
        state.modelConfig.frequency_penalty = 0;
        state.modelConfig.top_p = 1;
        state.modelConfig.template = DEFAULT_INPUT_TEMPLATE;
        // state.dontShowMaskSplashScreen = false;
        // state.hideBuilt

      if (version < 3.5) {
        state.customModels = "claude,claude-100k";
      }

      if (version < 3.6) {
        state.modelConfig.enableInjectSystemPrompts = true;
      }

      if (version < 3.7) {
        state.enableAutoGenerateTitle = true;
      }

      if (version < 3.8) {
        state.lastUpdate = Date.now();
      }

      if (version < 3.9) {
        state.modelConfig.template =
          state.modelConfig.template !== DEFAULT_INPUT_TEMPLATE
            ? state.modelConfig.template
            : config?.template ?? DEFAULT_INPUT_TEMPLATE;
      }

      if (version < 4.1) {
        state.modelConfig.compressModel =
          DEFAULT_CONFIG.modelConfig.compressModel;
        // state.modelConfig.compressProviderName = // Field removed
        //   DEFAULT_CONFIG.modelConfig.compressProviderName;
      }

      // Migration for version 4.2: remove provider fields
      if (version < 4.2) {
        if (state.modelConfig && 'providerName' in state.modelConfig) {
           delete (state.modelConfig as any).providerName;
        }
        if (state.modelConfig && 'compressProviderName' in state.modelConfig) {
           delete (state.modelConfig as any).compressProviderName;
        }
         if (state.realtimeConfig && 'provider' in state.realtimeConfig) {
           delete (state.realtimeConfig as any).provider;
        }
        // Consider how to handle the 'models' array if it contains provider info
        // E.g., reset to default or filter based on the single supported provider concept
        // state.models = DEFAULT_MODELS; // Simpl

      return state as any;
    },
  },
);

export interface AppConfig {
  resetConfig() {
    set(() => ({
      ...DEFAULT_CONFIG,
    }));
  },

  // resetPersistConfig() {
  //   set((state) => {
  //     state.token = "";
  //     state.accessCode = "";
  //     state.useCustomConfig = false;
  //     state.providerName = ServiceProvider.OpenAI;
  //     state.modelConfig = {
  //       ...DEFAULT_CONFIG.modelConfig,
  //       model: ModelProvider.getModelForProvider(state.providerName)?.[0]?.name ?? "",
  //       providerName: state.providerName,
  //     };
  //     state.openaiApiKey = "";
  //     state.anthropicApiKey = "";
  //     state.azureApiKey = "";
  //     state.azureApiVersion = DEFAULT_CONFIG.azureApiVersion;
  //     state.azureEndpoint = "";
  //     state.googleApiKey = "";
  //     state.googleApiVersion = DEFAULT_CONFIG.googleApiVersion;
  //     state.googleGeminiModel = "";
  //     state.baiduApiKey = "";
  //     state.baiduSecretKey = "";
  //     state.alibabaApiKey = "";
  //     state.tencentApiKey = "";
  //     state.tencentSecretId = "";
  //     state.tencentSecretKey = "";
  //     state.bytedanceApiKey = "";
  //     state.bytedanceSecretKey = "";
  //     state.moonshotApiKey = "";
  //     state.iflytekApiKey = "";
  //     state.iflytekApiSecret = "";
  //     state.iflytekAppId = "";
  //     state.glmApiKey = "";
  //     state.deepseekApiKey = "";
  //     state.xaiApiKey = "";
  //     state.sunoApiKey = "";
  //     state.sunoBaseUrl = "";
  //     state.sunoGptModel = "";
  //     state.sunoOutputsDir = "";
  //     state.sunoHistoryDir = "";
  //     state.sunoKeepTemp = false;
  //     state.siliconflowApiKey = "";
  //     state.submitKey = "";
  //     state.tightBorder = false;
  //     state.disablePromptHint = DEFAULT_CONFIG.disablePromptHint;
  //     state.enableAutoGenerateTitle = DEFAULT_CONFIG.enableAutoGenerateTitle;
  //     state.dontShowMaskSplashScreen = false;
  //     state.hideBuiltinMasks = false;
  //     state.customModels = "";
  //     state.pluginConfig = DEFAULT_CONFIG.pluginConfig;
  //     state.ttsConfig = DEFAULT_CONFIG.ttsConfig;
  //     state.webDav = DEFAULT_CONFIG.webDav;
  //     state.upstash = DEFAULT_CONFIG.upstash;
  //     state.artifactsConfig = DEFAULT_CONFIG.artifactsConfig;
  //   });
  // },

  update(updater) {
    set(() => ({
      ...DEFAULT_CONFIG,
    }));
  },

  // resetPersistConfig() {
  //   set((state) => {
  //     state.token = "";
  //     state.accessCode = "";
  //     state.useCustomConfig = false;
  //     state.providerName = ServiceProvider.OpenAI;
  //     state.modelConfig = {
  //       ...DEFAULT_CONFIG.modelConfig,
  //       model: ModelProvider.getModelForProvider(state.providerName)?.[0]?.name ?? "",
  //       providerName: state.providerName,
  //     };
  //     state.openaiApiKey = "";
  //     state.anthropicApiKey = "";
  //     state.azureApiKey = "";
  //     state.azureApiVersion = DEFAULT_CONFIG.azureApiVersion;
  //     state.azureEndpoint = "";
  //     state.googleApiKey = "";
  //     state.googleApiVersion = DEFAULT_CONFIG.googleApiVersion;
  //     state.googleGeminiModel = "";
  //     state.baiduApiKey = "";
  //     state.baiduSecretKey = "";
  //     state.alibabaApiKey = "";
  //     state.tencentApiKey = "";
  //     state.tencentSecretId = "";
  //     state.tencentSecretKey = "";
  //     state.bytedanceApiKey = "";
  //     state.bytedanceSecretKey = "";
  //     state.moonshotApiKey = "";
  //     state.iflytekApiKey = "";
  //     state.iflytekApiSecret = "";
  //     state.iflytekAppId = "";
  //     state.glmApiKey = "";
  //     state.deepseekApiKey = "";
  //     state.xaiApiKey = "";
  //     state.sunoApiKey = "";
  //     state.sunoBaseUrl = "";
  //     state.sunoGptModel = "";
  //     state.sunoOutputsDir = "";
  //     state.sunoHistoryDir = "";
  //     state.sunoKeepTemp = false;
  //     state.siliconflowApiKey = "";
  //     state.submitKey = "";
  //     state.tightBorder = false;
  //     state.disablePromptHint = DEFAULT_CONFIG.disablePromptHint;
  //     state.enableAutoGenerateTitle = DEFAULT_CONFIG.enableAutoGenerateTitle;
  //     state.dontShowMaskSplashScreen = false;
  //     state.hideBuiltinMasks = false;
  //     state.customModels = "";
  //     state.pluginConfig = DEFAULT_CONFIG.pluginConfig;
  //     state.ttsConfig = DEFAULT_CONFIG.ttsConfig;
  //     state.webDav = DEFAULT_CONFIG.webDav;
  //     state.upstash = DEFAULT_CONFIG.upstash;
  //     state.artifactsConfig = DEFAULT_CONFIG.artifactsConfig;
  //   });
  // },

  update(updater) {
    set(() => ({
      ...DEFAULT_CONFIG,
    }));
  },

  // resetPersistConfig() {
  //   set((state) => {
  //     state.token = "";
  //     state.accessCode = "";
  //     state.useCustomConfig = false;
  //     state.providerName = ServiceProvider.OpenAI;
  //     state.modelConfig = {
  //       ...DEFAULT_CONFIG.modelConfig,
  //       model: ModelProvider.getModelForProvider(state.providerName)?.[0]?.name ?? "",
  //       providerName: state.providerName,
  //     };
  //     state.openaiApiKey = "";
  //     state.anthropicApiKey = "";
  //     state.azureApiKey = "";
  //     state.azureApiVersion = DEFAULT_CONFIG.azureApiVersion;
  //     state.azureEndpoint = "";
  //     state.googleApiKey = "";
  //     state.googleApiVersion = DEFAULT_CONFIG.googleApiVersion;
  //     state.googleGeminiModel = "";
  //     state.baiduApiKey = "";
  //     state.baiduSecretKey = "";
  //     state.alibabaApiKey = "";
  //     state.tencentApiKey = "";
  //     state.tencentSecretId = "";
  //     state.tencentSecretKey = "";
  //     state.bytedanceApiKey = "";
  //     state.bytedanceSecretKey = "";
  //     state.moonshotApiKey = "";
  //     state.iflytekApiKey = "";
  //     state.iflytekApiSecret = "";
  //     state.iflytekAppId = "";
  //     state.glmApiKey = "";
  //     state.deepseekApiKey = "";
  //     state.xaiApiKey = "";
  //     state.sunoApiKey = "";
  //     state.sunoBaseUrl = "";
  //     state.sunoGptModel = "";
  //     state.sunoOutputsDir = "";
  //     state.sunoHistoryDir = "";
  //     state.sunoKeepTemp = false;
  //     state.siliconflowApiKey = "";
  //     state.submitKey = "";
  //     state.tightBorder = false;
  //     state.disablePromptHint = DEFAULT_CONFIG.disablePromptHint;
  //     state.enableAutoGenerateTitle = DEFAULT_CONFIG.enableAutoGenerateTitle;
  //     state.dontShowMaskSplashScreen = false;
  //     state.hideBuiltinMasks = false;
  //     state.customModels = "";
  //     state.pluginConfig = DEFAULT_CONFIG.pluginConfig;
  //     state.ttsConfig = DEFAULT_CONFIG.ttsConfig;
  //     state.webDav = DEFAULT_CONFIG.webDav;
  //     state.upstash = DEFAULT_CONFIG.upstash;
  //     state.artifactsConfig = DEFAULT_CONFIG.artifactsConfig;
  //   });
  // },

  update(updater) {
    set(() => ({
      ...DEFAULT_CONFIG,
    }));
  },

  // resetPersistConfig() {
  //   set((state) => {
  //     state.token = "";
  //     state.accessCode = "";
  //     state.useCustomConfig = false;
  //     state.providerName = ServiceProvider.OpenAI;
  //     state.modelConfig = {
  //       ...DEFAULT_CONFIG.modelConfig,
  //       model: ModelProvider.getModelForProvider(state.providerName)?.[0]?.name ?? "",
  //       providerName: state.providerName,
  //     };
  //     state.openaiApiKey = "";
  //     state.anthropicApiKey = "";
  //     state.azureApiKey = "";
  //     state.azureApiVersion = DEFAULT_CONFIG.azureApiVersion;
  //     state.azureEndpoint = "";
  //     state.googleApiKey = "";
  //     state.googleApiVersion = DEFAULT_CONFIG.googleApiVersion;
  //     state.googleGeminiModel = "";
  //     state.baiduApiKey = "";
  //     state.baiduSecretKey = "";
  //     state.alibabaApiKey = "";
  //     state.tencentApiKey = "";
  //     state.tencentSecretId = "";
  //     state.tencentSecretKey = "";
  //     state.bytedanceApiKey = "";
  //     state.bytedanceSecretKey = "";
  //     state.moonshotApiKey = "";
  //     state.iflytekApiKey = "";
  //     state.iflytekApiSecret = "";
  //     state.iflytekAppId = "";
  //     state.glmApiKey = "";
  //     state.deepseekApiKey = "";
  //     state.xaiApiKey = "";
  //     state.sunoApiKey = "";
  //     state.sunoBaseUrl = "";
  //     state.sunoGptModel = "";
  //     state.sunoOutputsDir = "";
  //     state.sunoHistoryDir = "";
  //     state.sunoKeepTemp = false;
  //     state.siliconflowApiKey = "";
  //     state.submitKey = "";
  //     state.tightBorder = false;
  //     state.disablePromptHint = DEFAULT_CONFIG.disablePromptHint;
  //     state.enableAutoGenerateTitle = DEFAULT_CONFIG.enableAutoGenerateTitle;
  //     state.dontShowMaskSplashScreen = false;
  //     state.hideBuiltinMasks = false;
  //     state.customModels = "";
  //     state.pluginConfig = DEFAULT_CONFIG.pluginConfig;
  //     state.ttsConfig = DEFAULT_CONFIG.ttsConfig;
  //     state.webDav = DEFAULT_CONFIG.webDav;
  //     state.upstash = DEFAULT_CONFIG.upstash;
  //     state.artifactsConfig = DEFAULT_CONFIG.artifactsConfig;
  //   });
  // },

  update(updater) {
    set(() => ({
      ...DEFAULT_CONFIG,
    }));
  },

  // resetPersistConfig() {
  //   set((state) => {
  //     state.token = "";
  //     state.accessCode = "";
  //     state.useCustomConfig = false;
  //     state.providerName = ServiceProvider.OpenAI;
  //     state.modelConfig = {
  //       ...DEFAULT_CONFIG.modelConfig,
  //       model: ModelProvider.getModelForProvider(state.providerName)?.[0]?.name ?? "",
  //       providerName: state.providerName,
  //     };
  //     state.openaiApiKey = "";
  //     state.anthropicApiKey = "";
  //     state.azureApiKey = "";
  //     state.azureApiVersion = DEFAULT_CONFIG.azureApiVersion;
  //     state.azureEndpoint = "";
  //     state.googleApiKey = "";
  //     state.googleApiVersion = DEFAULT_CONFIG.googleApiVersion;
  //     state.googleGeminiModel = "";
  //     state.baiduApiKey = "";
  //     state.baiduSecretKey = "";
  //     state.alibabaApiKey = "";
  //     state.tencentApiKey = "";
  //     state.tencentSecretId = "";
  //     state.tencentSecretKey = "";
  //     state.bytedanceApiKey = "";
  //     state.bytedanceSecretKey = "";
  //     state.moonshotApiKey = "";
  //     state.iflytekApiKey = "";
  //     state.iflytekApiSecret = "";
  //     state.iflytekAppId = "";
  //     state.glmApiKey = "";
  //     state.deepseekApiKey = "";
  //     state.xaiApiKey = "";
  //     state.sunoApiKey = "";
  //     state.sunoBaseUrl = "";
  //     state.sunoGptModel = "";
  //     state.sunoOutputsDir = "";
  //     state.sunoHistoryDir = "";
  //     state.sunoKeepTemp = false;
  //     state.siliconflowApiKey = "";
  //     state.submitKey = "";
  //     state.tightBorder = false;
  //     state.disablePromptHint = DEFAULT_CONFIG.disablePromptHint;
  //     state.enableAutoGenerateTitle = DEFAULT_CONFIG.enableAutoGenerateTitle;
  //     state.dontShowMaskSplashScreen = false;
  //     state.hideBuiltinMasks = false;
  //     state.customModels = "";
  //     state.pluginConfig = DEFAULT_CONFIG.pluginConfig;
  //     state.ttsConfig = DEFAULT_CONFIG.ttsConfig;
  //     state.webDav = DEFAULT_CONFIG.webDav;
  //     state.upstash = DEFAULT_CONFIG.upstash;
  //     state.artifactsConfig = DEFAULT_CONFIG.artifactsConfig;
  //   });
  // },

  update(updater) {
    set(() => ({
      ...DEFAULT_CONFIG,
    }));
  },

  // resetPersistConfig() {
  //   set((state) => {
  //     state.token = "";
  //     state.accessCode = "";
  //     state.useCustomConfig = false;
  //     state.providerName = ServiceProvider.OpenAI;
  //     state.modelConfig = {
  //       ...DEFAULT_CONFIG.modelConfig,
  //       model: ModelProvider.getModelForProvider(state.providerName)?.[0]?.name ?? "",
  //       providerName: state.providerName,
  //     };
  //     state.openaiApiKey = "";
  //     state.anthropicApiKey = "";
  //     state.azureApiKey = "";
  //     state.azureApiVersion = DEFAULT_CONFIG.azureApiVersion;
  //     state.azureEndpoint = "";
  //     state.googleApiKey = "";
  //     state.googleApiVersion = DEFAULT_CONFIG.googleApiVersion;
  //     state.googleGeminiModel = "";
  //     state.baiduApiKey = "";
  //     state.baiduSecretKey = "";
  //     state.alibabaApiKey = "";
  //     state.tencentApiKey = "";
  //     state.tencentSecretId = "";
  //     state.tencentSecretKey = "";
  //     state.bytedanceApiKey = "";
  //     state.bytedanceSecretKey = "";
  //     state.moonshotApiKey = "";
  //     state.iflytekApiKey = "";
  //     state.iflytekApiSecret = "";
  //     state.iflytekAppId = "";
  //     state.glmApiKey = "";
  //     state.deepseekApiKey = "";
  //     state.xaiApiKey = "";
  //     state.sunoApiKey = "";
  //     state.sunoBaseUrl = "";
  //     state.sunoGptModel = "";
  //     state.sunoOutputsDir = "";
  //     state.sunoHistoryDir = "";
  //     state.sunoKeepTemp = false;
  //     state.siliconflowApiKey = "";
  //     state.submitKey = "";
  //     state.tightBorder = false;
  //     state.disablePromptHint = DEFAULT_CONFIG.disablePromptHint;
  //     state.enableAutoGenerateTitle = DEFAULT_CONFIG.enableAutoGenerateTitle;
  //     state.dontShowMaskSplashScreen = false;
  //     state.hideBuiltinMasks = false;
  //     state.customModels = "";
  //     state.pluginConfig = DEFAULT_CONFIG.pluginConfig;
  //     state.ttsConfig = DEFAULT_CONFIG.ttsConfig;
  //     state.webDav = DEFAULT_CONFIG.webDav;
  //     state.upstash = DEFAULT_CONFIG.upstash;
  //     state.artifactsConfig = DEFAULT_CONFIG.artifactsConfig;
  //   });
  // },

  update(updater) {
    set(() => ({
      ...DEFAULT_CONFIG,
    }));
  },

  // resetPersistConfig() {
  //   set((state) => {
  //     state.token = "";
  //     state.accessCode = "";
  //     state.useCustomConfig = false;
  //     state.providerName = ServiceProvider.OpenAI;
  //     state.modelConfig = {
  //       ...DEFAULT_CONFIG.modelConfig,
  //       model: ModelProvider.getModelForProvider(state.providerName)?.[0]?.name ?? "",
  //       providerName: state.providerName,
  //     };
  //     state.openaiApiKey = "";
  //     state.anthropicApiKey = "";
  //     state.azureApiKey = "";
  //     state.azureApiVersion = DEFAULT_CONFIG.azureApiVersion;
  //     state.azureEndpoint = "";
  //     state.googleApiKey = "";
  //     state.googleApiVersion = DEFAULT_CONFIG.googleApiVersion;
  //     state.googleGeminiModel = "";
  //     state.baiduApiKey = "";
  //     state.baiduSecretKey = "";
  //     state.alibabaApiKey = "";
  //     state.tencentApiKey = "";
  //     state.tencentSecretId = "";
  //     state.tencentSecretKey = "";
  //     state.bytedanceApiKey = "";
  //     state.bytedanceSecretKey = "";
  //     state.moonshotApiKey = "";
  //     state.iflytekApiKey = "";
  //     state.iflytekApiSecret = "";
  //     state.iflytekAppId = "";
  //     state.glmApiKey = "";
  //     state.deepseekApiKey = "";
  //     state.xaiApiKey = "";
  //     state.sunoApiKey = "";
  //     state.sunoBaseUrl = "";
  //     state.sunoGptModel = "";
  //     state.sunoOutputsDir = "";
  //     state.sunoHistoryDir = "";
  //     state.sunoKeepTemp = false;
  //     state.siliconflowApiKey = "";
  //     state.submitKey = "";
  //     state.tightBorder = false;
  //     state.disablePromptHint = DEFAULT_CONFIG.disablePromptHint;
  //     state.enableAutoGenerateTitle = DEFAULT_CONFIG.enableAutoGenerateTitle;
  //     state.dontShowMaskSplashScreen = false;
  //     state.hideBuiltinMasks = false;
  //     state.customModels = "";
  //     state.pluginConfig = DEFAULT_CONFIG.pluginConfig;
  //     state.ttsConfig = DEFAULT_CONFIG.ttsConfig;
  //     state.webDav = DEFAULT_CONFIG.webDav;
  //     state.upstash = DEFAULT_CONFIG.upstash;
  //     state.artifactsConfig = DEFAULT_CONFIG.artifactsConfig;
  //   });
  // },

  update(updater) {
    set(() => ({
      ...DEFAULT_CONFIG,
    }));
  },

  // resetPersistConfig() {
  //   set((state) => {
  //     state.token = "";
  //     state.accessCode = "";
  //     state.useCustomConfig = false;
  //     state.providerName = ServiceProvider.OpenAI;
  //     state.modelConfig = {
  //       ...DEFAULT_CONFIG.modelConfig,
  //       model: ModelProvider.getModelForProvider(state.providerName)?.[0]?.name ?? "",
  //       providerName: state.providerName,
  //     };
  //     state.openaiApiKey = "";
  //     state.anthropicApiKey = "";
  //     state.azureApiKey = "";
  //     state.azureApiVersion = DEFAULT_CONFIG.azureApiVersion;
  //     state.azureEndpoint = "";
  //     state.googleApiKey = "";
  //     state.googleApiVersion = DEFAULT_CONFIG.googleApiVersion;
  //     state.googleGeminiModel = "";
  //     state.baiduApiKey = "";
  //     state.baiduSecretKey = "";
  //     state.alibabaApiKey = "";
  //     state.tencentApiKey = "";
  //     state.tencentSecretId = "";
  //     state.tencentSecretKey = "";
  //     state.bytedanceApiKey = "";
  //     state.bytedanceSecretKey = "";
  //     state.moonshotApiKey = "";
  //     state.iflytekApiKey = "";
  //     state.iflytekApiSecret = "";
  //     state.iflytekAppId = "";
  //     state.glmApiKey = "";
  //     state.deepseekApiKey = "";
  //     state.xaiApiKey = "";
  //     state.sunoApiKey = "";
  //     state.sunoBaseUrl = "";
  //     state.sunoGptModel = "";
  //     state.sunoOutputsDir = "";
  //     state.sunoHistoryDir = "";
  //     state.sunoKeepTemp = false;
  //     state.siliconflowApiKey = "";
  //     state.submitKey = "";
  //     state.tightBorder = false;
  //     state.disablePromptHint = DEFAULT_CONFIG.disablePromptHint;
  //     state.enableAutoGenerateTitle = DEFAULT_CONFIG.enableAutoGenerateTitle;
  //     state.dontShowMaskSplashScreen = false;
  //     state.hideBuiltinMasks = false;
  //     state.customModels = "";
  //     state.pluginConfig = DEFAULT_CONFIG.pluginConfig;
  //     state.ttsConfig = DEFAULT_CONFIG.ttsConfig;
  //     state.webDav = DEFAULT_CONFIG.webDav;
  //     state.upstash = DEFAULT_CONFIG.upstash;
  //     state.artifactsConfig = DEFAULT_CONFIG.artifactsConfig;
  //   });
  // },

  update(updater) {
    set(() => ({
      ...DEFAULT_CONFIG,
    }));
  },

  // resetPersistConfig() {
  //   set((state) => {
  //     state.token = "";
  //     state.accessCode = "";
  //     state.useCustomConfig = false;
  //     state.providerName = ServiceProvider.OpenAI;
  //     state.modelConfig = {
  //       ...DEFAULT_CONFIG.modelConfig,
  //       model: ModelProvider.getModelForProvider(state.providerName)?.[0]?.name ?? "",
  //       providerName: state.providerName,
  //     };
  //     state.openaiApiKey = "";
  //     state.anthropicApiKey = "";
  //     state.azureApiKey = "";
  //     state.azureApiVersion = DEFAULT_CONFIG.azureApiVersion;
  //     state.azureEndpoint = "";
  //     state.googleApiKey = "";
  //     state.googleApiVersion = DEFAULT_CONFIG.googleApiVersion;
  //     state.googleGeminiModel = "";
  //     state.baiduApiKey = "";
  //     state.baiduSecretKey = "";
  //     state.alibabaApiKey = "";
  //     state.tencentApiKey = "";
  //     state.tencentSecretId = "";
  //     state.tencentSecretKey = "";
  //     state.bytedanceApiKey = "";
  //     state.bytedanceSecretKey = "";
  //     state.moonshotApiKey = "";
  //     state.iflytekApiKey = "";
  //     state.iflytekApiSecret = "";
  //     state.iflytekAppId = "";
  //     state.glmApiKey = "";
  //     state.deepseekApiKey = "";
  //     state.xaiApiKey = "";
  //     state.sunoApiKey = "";
  //     state.sunoBaseUrl = "";
  //     state.sunoGptModel = "";
  //     state.sunoOutputsDir = "";
  //     state.sunoHistoryDir = "";
  //     state.sunoKeepTemp = false;
  //     state.siliconflowApiKey = "";
  //     state.submitKey = "";
  //     state.tightBorder = false;
  //     state.disablePromptHint = DEFAULT_CONFIG.disablePromptHint;
  //     state.enableAutoGenerateTitle = DEFAULT_CONFIG.enableAutoGenerateTitle;
  //     state.dontShowMaskSplashScreen = false;
  //     state.hideBuiltinMasks = false;
  //     state.customModels = "";
  //     state.pluginConfig = DEFAULT_CONFIG.pluginConfig;
  //     state.ttsConfig = DEFAULT_CONFIG.ttsConfig;
  //     state.webDav = DEFAULT_CONFIG.webDav;
  //     state.upstash = DEFAULT_CONFIG.upstash;
  //     state.artifactsConfig = DEFAULT_CONFIG.artifactsConfig;
  //   });
  // },

  update(updater) {
    set(() => ({
      ...DEFAULT_CONFIG,
    }));
  },

  // resetPersistConfig() {
  //   set((state) => {
  //     state.token = "";
  //     state.accessCode = "";
  //     state.useCustomConfig = false;
  //     state.providerName = ServiceProvider.OpenAI;
  //     state.modelConfig = {
  //       ...DEFAULT_CONFIG.modelConfig,
  //       model: ModelProvider.getModelForProvider(state.providerName)?.[0]?.name ?? "",
  //       providerName: state.providerName,
  //     };
  //     state.openaiApiKey = "";
  //     state.anthropicApiKey = "";
  //     state.azureApiKey = "";
  //     state.azureApiVersion = DEFAULT_CONFIG.azureApiVersion;
  //     state.azureEndpoint = "";
  //     state.googleApiKey = "";
  //     state.googleApiVersion = DEFAULT_CONFIG.googleApiVersion;
  //     state.googleGeminiModel = "";
  //     state.baiduApiKey = "";
  //     state.baiduSecretKey = "";
  //     state.alibabaApiKey = "";
  //     state.tencentApiKey = "";
  //     state.tencentSecretId = "";
  //     state.tencentSecretKey = "";
  //     state.bytedanceApiKey = "";
  //     state.bytedanceSecretKey = "";
  //     state.moonshotApiKey = "";
  //     state.iflytekApiKey = "";
  //     state.iflytekApiSecret = "";
  //     state.iflytekAppId = "";
  //     state.glmApiKey = "";
  //     state.deepseekApiKey = "";
  //     state.xaiApiKey = "";
  //     state.sunoApiKey = "";
  //     state.sunoBaseUrl = "";
  //     state.sunoGptModel = "";
  //     state.sunoOutputsDir = "";
  //     state.sunoHistoryDir = "";
  //     state.sunoKeepTemp = false;
  //     state.siliconflowApiKey = "";
  //     state.submitKey = "";
  //     state.tightBorder = false;
  //     state.disablePromptHint = DEFAULT_CONFIG.disablePromptHint;
  //     state.enableAutoGenerateTitle = DEFAULT_CONFIG.enableAutoGenerateTitle;
  //     state.dontShowMaskSplashScreen = false;
  //     state.hideBuiltinMasks = false;
  //     state.customModels = "";
  //     state.pluginConfig = DEFAULT_CONFIG.pluginConfig;
  //     state.ttsConfig = DEFAULT_CONFIG.ttsConfig;
  //     state.webDav = DEFAULT_CONFIG.webDav;
  //     state.upstash = DEFAULT_CONFIG.upstash;
  //     state.artifactsConfig = DEFAULT_CONFIG.artifactsConfig;
  //   });
  // },

  update(updater) {
    set(() => ({
      ...DEFAULT_CONFIG,
    }));
  },

  // resetPersistConfig() {
  //   set((state) => {
  //     state.token = "";
  //     state.accessCode = "";
  //     state.useCustomConfig = false;
  //     state.providerName = ServiceProvider.OpenAI;
  //     state.modelConfig = {
  //       ...DEFAULT_CONFIG.modelConfig,
  //       model: ModelProvider.getModelForProvider(state.providerName)?.[0]?.name ?? "",
  //       providerName: state.providerName,
  //     };
  //     state.openaiApiKey = "";
  //     state.anthropicApiKey = "";
  //     state.azureApiKey = "";
  //     state.azureApiVersion = DEFAULT_CONFIG.azureApiVersion;
  //     state.azureEndpoint = "";
  //     state.googleApiKey = "";
  //     state.googleApiVersion = DEFAULT_CONFIG.googleApiVersion;
  //     state.googleGeminiModel = "";
  //     state.baiduApiKey = "";
  //     state.baiduSecretKey = "";
  //     state.alibabaApiKey = "";
  //     state.tencentApiKey = "";
  //     state.tencentSecretId = "";
  //     state.tencentSecretKey = "";
  //     state.bytedanceApiKey = "";
  //     state.bytedanceSecretKey = "";
  //     state.moonshotApiKey = "";
  //     state.iflytekApiKey = "";
  //     state.iflytekApiSecret = "";
  //     state.iflytekAppId = "";
  //     state.glmApiKey = "";
  //     state.deepseekApiKey = "";
  //     state.xaiApiKey = "";
  //     state.sunoApiKey = "";
  //     state.sunoBaseUrl = "";
  //     state.sunoGptModel = "";
  //     state.sunoOutputsDir = "";
  //     state.sunoHistoryDir = "";
  //     state.sunoKeepTemp = false;
  //     state.siliconflowApiKey = "";
  //     state.submitKey = "";
  //     state.tightBorder = false;
  //     state.disablePromptHint = DEFAULT_CONFIG.disablePromptHint;
  //     state.enableAutoGenerateTitle = DEFAULT_CONFIG.enableAutoGenerateTitle;
  //     state.dontShowMaskSplashScreen = false;
  //     state.hideBuiltinMasks = false;
  //     state.customModels = "";
  //     state.pluginConfig = DEFAULT_CONFIG.pluginConfig;
  //     state.ttsConfig = DEFAULT_CONFIG.ttsConfig;
  //     state.webDav = DEFAULT_CONFIG.webDav;
  //     state.upstash = DEFAULT_CONFIG.upstash;
  //     state.artifactsConfig = DEFAULT_CONFIG.artifactsConfig;
  //   });
  // },

  update(updater) {
    set(() => ({
      ...DEFAULT_CONFIG,
    }));
  },

  // resetPersistConfig() {
  //   set((state) => {
  //     state.token = "";
  //     state.accessCode = "";
  //     state.useCustomConfig = false;
  //     state.providerName = ServiceProvider.OpenAI;
  //     state.modelConfig = {
  //       ...DEFAULT_CONFIG.modelConfig,
  //       model: ModelProvider.getModelForProvider(state.providerName)?.[0]?.name ?? "",
  //       providerName: state.providerName,
  //     };
  //     state.openaiApiKey = "";
  //     state.anthropicApiKey = "";
  //     state.azureApiKey = "";
  //     state.azureApiVersion = DEFAULT_CONFIG.azureApiVersion;
  //     state.azureEndpoint = "";
  //     state.googleApiKey = "";
  //     state.googleApiVersion = DEFAULT_CONFIG.googleApiVersion;
  //     state.googleGeminiModel = "";
  //     state.baiduApiKey = "";
  //     state.baiduSecretKey = "";
  //     state.alibabaApiKey = "";
  //     state.tencentApiKey = "";
  //     state.tencentSecretId = "";
  //     state.tencentSecretKey = "";
  //     state.bytedanceApiKey = "";
  //     state.bytedanceSecretKey = "";
  //     state.moonshotApiKey = "";
  //     state.iflytekApiKey = "";
  //     state.iflytekApiSecret = "";
  //     state.iflytekAppId = "";
  //     state.glmApiKey = "";
  //     state.deepseekApiKey = "";
  //     state.xaiApiKey = "";
  //     state.sunoApiKey = "";
  //     state.sunoBaseUrl = "";
  //     state.sunoGptModel = "";
  //     state.sunoOutputsDir = "";
  //     state.sunoHistoryDir = "";
  //     state.sunoKeepTemp = false;
  //     state.siliconflowApiKey = "";
  //     state.submitKey = "";
  //     state.tightBorder = false;
  //     state.disablePromptHint = DEFAULT_CONFIG.disablePromptHint;
  //     state.enableAutoGenerateTitle = DEFAULT_CONFIG.enableAutoGenerateTitle;
  //     state.dontShowMaskSplashScreen = false;
  //     state.hideBuiltinMasks = false;
  //     state.customModels = "";
  //     state.pluginConfig = DEFAULT_CONFIG.pluginConfig;
  //     state.ttsConfig = DEFAULT_CONFIG.ttsConfig;
  //     state.webDav = DEFAULT_CONFIG.webDav;
  //     state.upstash = DEFAULT_CONFIG.upstash;
  //     state.artifactsConfig = DEFAULT_CONFIG.artifactsConfig;
  //   });
  // },

  update(updater) {
    set(() => ({
      ...DEFAULT_CONFIG,
    }));
  },

  // resetPersistConfig() {
  //   set((state) => {
  //     state.token = "";
  //     state.accessCode = "";
  //     state.useCustomConfig = false;
  //     state.providerName = ServiceProvider.OpenAI;
  //     state.modelConfig = {
  //       ...DEFAULT_CONFIG.modelConfig,
  //       model: ModelProvider.getModelForProvider(state.providerName)?.[0]?.name ?? "",
  //       providerName: state.providerName,
  //     };
  //     state.openaiApiKey = "";
  //     state.anthropicApiKey = "";
  //     state.azureApiKey = "";
  //     state.azureApiVersion = DEFAULT_CONFIG.azureApiVersion;
  //     state.azureEndpoint = "";
  //     state.googleApiKey = "";
  //     state.googleApiVersion = DEFAULT_CONFIG.googleApiVersion;
  //     state.googleGeminiModel = "";
  //     state.baiduApiKey = "";
  //     state.baiduSecretKey = "";
  //     state.alibabaApiKey = "";
  //     state.tencentApiKey = "";
  //     state.tencentSecretId = "";
  //     state.tencentSecretKey = "";
  //     state.bytedanceApiKey = "";
  //     state.bytedanceSecretKey = "";
  //     state.moonshotApiKey = "";
  //     state.iflytekApiKey = "";
  //     state.iflytekApiSecret = "";
  //     state.iflytekAppId = "";
  //     state.glmApiKey = "";
  //     state.deepseekApiKey = "";
  //     state.xaiApiKey = "";
  //     state.sunoApiKey = "";
  //     state.sunoBaseUrl = "";
  //     state.sunoGptModel = "";
  //     state.sunoOutputsDir = "";
  //     state.sunoHistoryDir = "";
  //     state.sunoKeepTemp = false;
  //     state.siliconflowApiKey = "";
  //     state.submitKey = "";
  //     state.tightBorder = false;
  //     state.disablePromptHint = DEFAULT_CONFIG.disablePromptHint;
  //     state.enableAutoGenerateTitle = DEFAULT_CONFIG.enableAutoGenerateTitle;
  //     state.dontShowMaskSplashScreen = false;
  //     state.hideBuiltinMasks = false;
  //     state.customModels = "";
  //     state.pluginConfig = DEFAULT_CONFIG.pluginConfig;
  //     state.ttsConfig = DEFAULT_CONFIG.ttsConfig;
  //     state.webDav = DEFAULT_CONFIG.webDav;
  //     state.upstash = DEFAULT_CONFIG.upstash;
  //     state.artifactsConfig = DEFAULT_CONFIG.artifactsConfig;
  //   });
  // },

  update(updater) {
    set(() => ({
      ...DEFAULT_CONFIG,
    }));
  },

  // resetPersistConfig() {
  //   set((state) => {
  //     state.token = "";
  //     state.accessCode = "";
  //     state.useCustomConfig = false;
  //     state.providerName = ServiceProvider.OpenAI;
  //     state.modelConfig = {
  //       ...DEFAULT_CONFIG.modelConfig,
  //       model: ModelProvider.getModelForProvider(state.providerName)?.[0]?.name ?? "",
  //       providerName: state.providerName,
  //     };
  //     state.openaiApiKey = "";
  //     state.anthropicApiKey = "";
  //     state.azureApiKey = "";
  //     state.azureApiVersion = DEFAULT_CONFIG.azureApiVersion;
  //     state.azureEndpoint = "";
  //     state.googleApiKey = "";
  //     state.googleApiVersion = DEFAULT_CONFIG.googleApiVersion;
  //     state.googleGeminiModel = "";
  //     state.baiduApiKey = "";
  //     state.baiduSecretKey = "";
  //     state.alibabaApiKey = "";
  //     state.tencentApiKey = "";
  //     state.tencentSecretId = "";
  //     state.tencentSecretKey = "";
  //     state.bytedanceApiKey = "";
  //     state.bytedanceSecretKey = "";
  //     state.moonshotApiKey = "";
  //     state.iflytekApiKey = "";
  //     state.iflytekApiSecret = "";
  //     state.iflytekAppId = "";
  //     state.glmApiKey = "";
  //     state.deepseekApiKey = "";
  //     state.xaiApiKey = "";
  //     state.sunoApiKey = "";
  //     state.sunoBaseUrl = "";
  //     state.sunoGptModel = "";
  //     state.sunoOutputsDir = "";
  //     state.sunoHistoryDir = "";
  //     state.sunoKeepTemp = false;
  //     state.siliconflowApiKey = "";
  //     state.submitKey = "";
  //     state.tightBorder = false;
  //     state.disablePromptHint = DEFAULT_CONFIG.disablePromptHint;
  //     state.enableAutoGenerateTitle = DEFAULT_CONFIG.enableAutoGenerateTitle;
  //     state.dontShowMaskSplashScreen = false;
  //     state.hideBuiltinMasks = false;
  //     state.customModels = "";
  //     state.pluginConfig = DEFAULT_CONFIG.pluginConfig;
  //     state.ttsConfig = DEFAULT_CONFIG.ttsConfig;
  //     state.webDav = DEFAULT_CONFIG.webDav;
  //     state.upstash = DEFAULT_CONFIG.upstash;
  //     state.artifactsConfig = DEFAULT_CONFIG.artifactsConfig;
  //   });
  // },

  update(updater) {
    set(() => ({
      ...DEFAULT_CONFIG,
    }));
  },

  // resetPersistConfig() {
  //   set((state) => {
  //     state.token = "";
  //     state.accessCode = "";
  //     state.useCustomConfig = false;
  //     state.providerName = ServiceProvider.OpenAI;
  //     state.modelConfig = {
  //       ...DEFAULT_CONFIG.modelConfig,
  //       model: ModelProvider.getModelForProvider(state.providerName)?.[0]?.name ?? "",
  //       providerName: state.providerName,
  //     };
  //     state.openaiApiKey = "";
  //     state.anthropicApiKey = "";
  //     state.azureApiKey = "";
  //     state.azureApiVersion = DEFAULT_CONFIG.azureApiVersion;
  //     state.azureEndpoint = "";
  //     state.googleApiKey = "";
  //     state.googleApiVersion = DEFAULT_CONFIG.googleApiVersion;
  //     state.googleGeminiModel = "";
  //     state.baiduApiKey = "";
  //     state.baiduSecretKey = "";
  //     state.alibabaApiKey = "";
  //     state.tencentApiKey = "";
  //     state.tencentSecretId = "";
  //     state.tencentSecretKey = "";
  //     state.bytedanceApiKey = "";
  //     state.bytedanceSecretKey = "";
  //     state.moonshotApiKey = "";
  //     state.iflytekApiKey = "";
  //     state.iflytekApiSecret = "";
  //     state.iflytekAppId = "";
  //     state.glmApiKey = "";
  //     state.deepseekApiKey = "";
  //     state.xaiApiKey = "";
  //     state.sunoApiKey = "";
  //     state.sunoBaseUrl = "";
  //     state.sunoGptModel = "";
  //     state.sunoOutputsDir = "";
  //     state.sunoHistoryDir = "";
  //     state.sunoKeepTemp = false;
  //     state.siliconflowApiKey = "";
  //     state.submitKey = "";
  //     state.tightBorder = false;
  //     state.disablePromptHint = DEFAULT_CONFIG.disablePromptHint;
  //     state.enableAutoGenerateTitle = DEFAULT_CONFIG.enableAutoGenerateTitle;
  //     state.dontShowMaskSplashScreen = false;
  //     state.hideBuiltinMasks = false;
  //     state.customModels = "";
  //     state.pluginConfig = DEFAULT_CONFIG.pluginConfig;
  //     state.ttsConfig = DEFAULT_CONFIG.ttsConfig;
  //     state.webDav = DEFAULT_CONFIG.webDav;
  //     state.upstash = DEFAULT_CONFIG.upstash;
  //     state.artifactsConfig = DEFAULT_CONFIG.artifactsConfig;
  //   });
  // },

  update(updater) {
    set(() => ({
      ...DEFAULT_CONFIG,
    }));
  },

  // resetPersistConfig() {
  //   set((state) => {
  //     state.token = "";
  //     state.accessCode = "";
  //     state.useCustomConfig = false;
  //     state.providerName = ServiceProvider.OpenAI;
  //     state.modelConfig = {
  //       ...DEFAULT_CONFIG.modelConfig,
  //       model: ModelProvider.getModelForProvider(state.providerName)?.[0]?.name ?? "",
  //       providerName: state.providerName,
  //     };
  //     state.openaiApiKey = "";
  //     state.anthropicApiKey = "";
  //     state.azureApiKey = "";
  //     state.azureApiVersion = DEFAULT_CONFIG.azureApiVersion;
  //     state.azureEndpoint = "";
  //     state.googleApiKey = "";
  //     state.googleApiVersion = DEFAULT_CONFIG.googleApiVersion;
  //     state.googleGeminiModel = "";
  //     state.baiduApiKey = "";
  //     state.baiduSecretKey = "";
  //     state.alibabaApiKey = "";
  //     state.tencentApiKey = "";
  //     state.tencentSecretId = "";
  //     state.tencentSecretKey = "";
  //     state.bytedanceApiKey = "";
  //     state.bytedanceSecretKey = "";
  //     state.moonshotApiKey = "";
  //     state.iflytekApiKey = "";
  //     state.iflytekApiSecret = "";
  //     state.iflytekAppId = "";
  //     state.glmApiKey = "";
  //     state.deepseekApiKey = "";
  //     state.xaiApiKey = "";
  //     state.sunoApiKey = "";
  //     state.sunoBaseUrl = "";
  //     state.sunoGptModel = "";
  //     state.sunoOutputsDir = "";
  //     state.sunoHistoryDir = "";
  //     state.sunoKeepTemp = false;
  //     state.siliconflowApiKey = "";
  //     state.submitKey = "";
  //     state.tightBorder = false;
  //     state.disablePromptHint = DEFAULT_CONFIG.disablePromptHint;
  //     state.enableAutoGenerateTitle = DEFAULT_CONFIG.enableAutoGenerateTitle;
  //     state.dontShowMaskSplashScreen = false;
  //     state.hideBuiltinMasks = false;
  //     state.customModels = "";
  //     state.pluginConfig = DEFAULT_CONFIG.pluginConfig;
  //     state.ttsConfig = DEFAULT_CONFIG.ttsConfig;
  //     state.webDav = DEFAULT_CONFIG.webDav;
  //     state.upstash = DEFAULT_CONFIG.upstash;
  //     state.artifactsConfig = DEFAULT_CONFIG.artifactsConfig;
  //   });
  // },

  update(updater) {
    set(() => ({
      ...DEFAULT_CONFIG,
    }));
  },

  // resetPersistConfig() {
  //   set((state) => {
  //     state.token = "";
  //     state.accessCode = "";
  //     state.useCustomConfig = false;
  //     state.providerName = ServiceProvider.OpenAI;
  //     state.modelConfig = {
  //       ...DEFAULT_CONFIG.modelConfig,
  //       model: ModelProvider.getModelForProvider(state.providerName)?.[0]?.name ?? "",
  //       providerName: state.providerName,
  //     };
  //     state.openaiApiKey = "";
  //     state.anthropicApiKey = "";
  //     state.azureApiKey = "";
  //     state.azureApiVersion = DEFAULT_CONFIG.azureApiVersion;
  //     state.azureEndpoint = "";
  //     state.googleApiKey = "";
  //     state.googleApiVersion = DEFAULT_CONFIG.googleApiVersion;
  //     state.googleGeminiModel = "";
  //     state.baiduApiKey = "";
  //     state.baiduSecretKey = "";
  //     state.alibabaApiKey = "";
  //     state.tencentApiKey = "";
  //     state.tencentSecretId = "";
  //     state.tencentSecretKey = "";
  //     state.bytedanceApiKey = "";
  //     state.bytedanceSecretKey = "";
  //     state.moonshotApiKey = "";
  //     state.iflytekApiKey = "";
  //     state.iflytekApiSecret = "";
  //     state.iflytekAppId = "";
  //     state.glmApiKey = "";
  //     state.deepseekApiKey = "";
  //     state.xaiApiKey = "";
  //     state.sunoApiKey = "";
  //     state.sunoBaseUrl = "";
  //     state.sunoGptModel = "";
  //     state.sunoOutputsDir = "";
  //     state.sunoHistoryDir = "";
  //     state.sunoKeepTemp = false;
  //     state.siliconflowApiKey = "";
  //     state.submitKey = "";
  //     state.tightBorder = false;
  //     state.disablePromptHint = DEFAULT_CONFIG.disablePromptHint;
  //     state.enableAutoGenerateTitle = DEFAULT_CONFIG.enableAutoGenerateTitle;
  //     state.dontShowMaskSplashScreen = false;
  //     state.hideBuiltinMasks = false;
  //     state.customModels = "";
  //     state.pluginConfig = DEFAULT_CONFIG.pluginConfig;
  //     state.ttsConfig = DEFAULT_CONFIG.ttsConfig;
  //     state.webDav = DEFAULT_CONFIG.webDav;
  //     state.upstash = DEFAULT_CONFIG.upstash;
  //     state.artifactsConfig = DEFAULT_CONFIG.artifactsConfig;
  //   });
  // },

  update(updater) {
    set(() => ({
      ...DEFAULT_CONFIG,
    }));
  },

  // resetPersistConfig() {
  //   set((state) => {
  //     state.token = "";
  //     state.accessCode = "";
  //     state.useCustomConfig = false;
  //     state.providerName = ServiceProvider.OpenAI;
  //     state.modelConfig = {
  //       ...DEFAULT_CONFIG.modelConfig,
  //       model: ModelProvider.getModelForProvider(state.providerName)?.[0]?.name ?? "",
  //       providerName: state.providerName,
  //     };
  //     state.openaiApiKey = "";
  //     state.anthropicApiKey = "";
  //     state.azureApiKey = "";
  //     state.azureApiVersion = DEFAULT_CONFIG.azureApiVersion;
  //     state.azureEndpoint = "";
  //     state.googleApiKey = "";
  //     state.googleApiVersion = DEFAULT_CONFIG.googleApiVersion;
  //     state.googleGeminiModel = "";
  //     state.baiduApiKey = "";
  //     state.baiduSecretKey = "";
  //     state.alibabaApiKey = "";
  //     state.tencentApiKey = "";
  //     state.tencentSecretId = "";
  //     state.tencentSecretKey = "";
  //     state.bytedanceApiKey = "";
  //     state.bytedanceSecretKey = "";
  //     state.moonshotApiKey = "";
  //     state.iflytekApiKey = "";
  //     state.iflytekApiSecret = "";
  //     state.iflytekAppId = "";
  //     state.glmApiKey = "";
  //     state.deepseekApiKey = "";
  //     state.xaiApiKey = "";
  //     state.sunoApiKey = "";
  //     state.sunoBaseUrl = "";
  //     state.sunoGptModel = "";
  //     state.sunoOutputsDir = "";
  //     state.sunoHistoryDir = "";
  //     state.sunoKeepTemp = false;
  //     state.siliconflowApiKey = "";
  //     state.submitKey = "";
  //     state.tightBorder = false;
  //     state.disablePromptHint = DEFAULT_CONFIG.disablePromptHint;
  //     state.enableAutoGenerateTitle = DEFAULT_CONFIG.enableAutoGenerateTitle;
  //     state.dontShowMaskSplashScreen = false;
  //     state.hideBuiltinMasks = false;
  //     state.customModels = "";
  //     state.pluginConfig = DEFAULT_CONFIG.pluginConfig;
  //     state.ttsConfig = DEFAULT_CONFIG.ttsConfig;
  //     state.webDav = DEFAULT_CONFIG.webDav;
  //     state.upstash = DEFAULT_CONFIG.upstash;
  //     state.artifactsConfig = DEFAULT_CONFIG.artifactsConfig;
  //   });
  // },

  update(updater) {
    set(() => ({
      ...DEFAULT_CONFIG,
    }));
  },

  // resetPersistConfig() {
  //   set((state) => {
  //     state.token = "";
  //     state.accessCode = "";
  //     state.useCustomConfig = false;
  //     state.providerName = ServiceProvider.OpenAI;
  //     state.modelConfig = {
  //       ...DEFAULT_CONFIG.modelConfig,
  //       model: ModelProvider.getModelForProvider(state.providerName)?.[0]?.name ?? "",
  //       providerName: state.providerName,
  //     };
  //     state.openaiApiKey = "";
  //     state.anthropicApiKey = "";
  //     state.azureApiKey = "";
  //     state.azureApiVersion = DEFAULT_CONFIG.azureApiVersion;
  //     state.azureEndpoint = "";
  //     state.googleApiKey = "";
  //     state.googleApiVersion = DEFAULT_CONFIG.googleApiVersion;
  //     state.googleGeminiModel = "";
  //     state.baiduApiKey = "";
  //     state.baiduSecretKey = "";
  //     state.alibabaApiKey = "";
  //     state.tencentApiKey = "";
  //     state.tencentSecretId = "";
  //     state.tencentSecretKey = "";
  //     state.bytedanceApiKey = "";
  //     state.bytedanceSecretKey = "";
  //     state.moonshotApiKey = "";
  //     state.iflytekApiKey = "";
  //     state.iflytekApiSecret = "";
  //     state.iflytekAppId = "";
  //     state.glmApiKey = "";
  //     state.deepseekApiKey = "";
  //     state.xaiApiKey = "";
  //     state.sunoApiKey = "";
  //     state.sunoBaseUrl = "";
  //     state.sunoGptModel = "";
  //     state.sunoOutputsDir = "";
  //     state.sunoHistoryDir = "";
  //     state.sunoKeepTemp = false;
  //     state.siliconflowApiKey = "";
  //     state.submitKey = "";
  //     state.tightBorder = false;
  //     state.disablePromptHint = DEFAULT_CONFIG.disablePromptHint;
  //     state.enableAutoGenerateTitle = DEFAULT_CONFIG.enableAutoGenerateTitle;
  //     state.dontShowMaskSplashScreen = false;
  //     state.hideBuiltinMasks = false;
  //     state.customModels = "";
  //     state.pluginConfig = DEFAULT_CONFIG.pluginConfig;
  //     state.ttsConfig = DEFAULT_CONFIG.ttsConfig;
  //     state.webDav = DEFAULT_CONFIG.webDav;
  //     state.upstash = DEFAULT_CONFIG.upstash;
  //     state.artifactsConfig = DEFAULT_CONFIG.artifactsConfig;
  //   });
  // },

  update(updater) {
    set(() => ({
      ...DEFAULT_CONFIG,
    }));
  },

  // resetPersistConfig() {
  //   set((state) => {
  //     state.token = "";
  //     state.accessCode = "";
  //     state.useCustomConfig = false;
  //     state.providerName = ServiceProvider.OpenAI;
  //     state.modelConfig = {
  //       ...DEFAULT_CONFIG.modelConfig,
  //       model: ModelProvider.getModelForProvider(state.providerName)?.[0]?.name ?? "",
  //       providerName: state.providerName,
  //     };
  //     state.openaiApiKey = "";
  //     state.anthropicApiKey = "";
  //     state.azureApiKey = "";
  //     state.azureApiVersion = DEFAULT_CONFIG.azureApiVersion;
  //     state.azureEndpoint = "";
  //     state.googleApiKey = "";
  //     state.googleApiVersion = DEFAULT_CONFIG.googleApiVersion;
  //     state.googleGeminiModel = "";
  //     state.baiduApiKey = "";
  //     state.baiduSecretKey = "";
  //     state.alibabaApiKey = "";
  //     state.tencentApiKey = "";
  //     state.tencentSecretId = "";
  //     state.tencentSecretKey = "";
  //     state.bytedanceApiKey = "";
  //     state.bytedanceSecretKey = "";
  //     state.moonshotApiKey = "";
  //     state.iflytekApiKey = "";
  //     state.iflytekApiSecret = "";
  //     state.iflytekAppId = "";
  //     state.glmApiKey = "";
  //     state.deepseekApiKey = "";
  //     state.xaiApiKey = "";
  //     state.sunoApiKey = "";
  //     state.sunoBaseUrl = "";
  //     state.sunoGptModel = "";
  //     state.sunoOutputsDir = "";
  //     state.sunoHistoryDir = "";
  //     state.sunoKeepTemp = false;
  //     state.siliconflowApiKey = "";
  //     state.submitKey = "";
  //     state.tightBorder = false;
  //     state.disablePromptHint = DEFAULT_CONFIG.disablePromptHint;
  //     state.enableAutoGenerateTitle = DEFAULT_CONFIG.enableAutoGenerateTitle;
  //     state.dontShowMaskSplashScreen = false;
  //     state.hideBuiltinMasks = false;
  //     state.customModels = "";
  //     state.pluginConfig = DEFAULT_CONFIG.pluginConfig;
  //     state.ttsConfig = DEFAULT_CONFIG.ttsConfig;
  //     state.webDav = DEFAULT_CONFIG.webDav;
  //     state.upstash = DEFAULT_CONFIG.upstash;
  //     state.artifactsConfig = DEFAULT_CONFIG.artifactsConfig;
  //   });
  // },

  update(updater) {
    set(() => ({
      ...DEFAULT_CONFIG,
    }));
  },

  // resetPersistConfig() {
  //   set((state) => {
  //     state.token = "";
  //     state.accessCode = "";
  //     state.useCustomConfig = false;
  //     state.providerName = ServiceProvider.OpenAI;
  //     state.modelConfig = {
  //       ...DEFAULT_CONFIG.modelConfig,
  //       model: ModelProvider.getModelForProvider(state.providerName)?.[0]?.name ?? "",
  //       providerName: state.providerName,
  //     };
  //     state.openaiApiKey = "";
  //     state.anthropicApiKey = "";
  //     state.azureApiKey = "";
  //     state.azureApiVersion = DEFAULT_CONFIG.azureApiVersion;
  //     state.azureEndpoint = "";
  //     state.googleApiKey = "";
  //     state.googleApiVersion = DEFAULT_CONFIG.googleApiVersion;
  //     state.googleGeminiModel = "";
  //     state.baiduApiKey = "";
  //     state.baiduSecretKey = "";
  //     state.alibabaApiKey = "";
  //     state.tencentApiKey = "";
  //     state.tencentSecretId = "";
  //     state.tencentSecretKey = "";
  //     state.bytedanceApiKey = "";
  //     state.bytedanceSecretKey = "";
  //     state.moonshotApiKey = "";
  //     state.iflytekApiKey = "";
  //     state.iflytekApiSecret = "";
  //     state.iflytekAppId = "";
  //     state.glmApiKey = "";
  //     state.deepseekApiKey = "";
  //     state.xaiApiKey = "";
  //     state.sunoApiKey = "";
  //     state.sunoBaseUrl = "";
  //     state.sunoGptModel = "";
  //     state.sunoOutputsDir = "";
  //     state.sunoHistoryDir = "";
  //     state.sunoKeepTemp = false;
  //     state.siliconflowApiKey = "";
  //     state.submitKey = "";
  //     state.tightBorder = false;
  //     state.disablePromptHint = DEFAULT_CONFIG.disablePromptHint;
  //     state.enableAutoGenerateTitle = DEFAULT_CONFIG.enableAutoGenerateTitle;
  //     state.dontShowMaskSplashScreen = false;
  //     state.hideBuiltinMasks = false;
  //     state.customModels = "";
  //     state.pluginConfig = DEFAULT_CONFIG.pluginConfig;
  //     state.ttsConfig = DEFAULT_CONFIG.ttsConfig;
  //     state.webDav = DEFAULT_CONFIG.webDav;
  //     state.upstash = DEFAULT_CONFIG.upstash;
  //     state.artifactsConfig = DEFAULT_CONFIG.artifactsConfig;
  //   });
  // },

  update(updater) {
    set(() => ({
      ...DEFAULT_CONFIG,
    }));
  },

  // resetPersistConfig() {
  //   set((state) => {
  //     state.token = "";
  //     state.accessCode = "";
  //     state.useCustomConfig = false;
  //     state.providerName = ServiceProvider.OpenAI;
  //     state.modelConfig = {
  //       ...DEFAULT_CONFIG.modelConfig,
  //       model: ModelProvider.getModelForProvider(state.providerName)?.[0]?.name ?? "",
  //       providerName: state.providerName,
  //     };
  //     state.openaiApiKey = "";
  //     state.anthropicApiKey = "";
  //     state.azureApiKey = "";
  //     state.azureApiVersion = DEFAULT_CONFIG.azureApiVersion;
  //     state.azureEndpoint = "";
  //     state.googleApiKey = "";
  //     state.googleApiVersion = DEFAULT_CONFIG.googleApiVersion;
  //     state.googleGeminiModel = "";
  //     state.baiduApiKey = "";
  //     state.baiduSecretKey = "";
  //     state.alibabaApiKey = "";
  //     state.tencentApiKey = "";
  //     state.tencentSecretId = "";
  //     state.tencentSecretKey = "";
  //     state.bytedanceApiKey = "";
  //     state.bytedanceSecretKey = "";
  //     state.moonshotApiKey = "";
  //     state.iflytekApiKey = "";
  //     state.iflytekApiSecret = "";
  //     state.iflytekAppId = "";
  //     state.glmApiKey = "";
  //     state.deepseekApiKey = "";
  //     state.xaiApiKey = "";
  //     state.sun
