import {
  getMessageTextContent,
  isDalle3,
  safeLocalStorage,
  trimTopic,
} from "../utils";

import { indexedDBStorage } from "@/app/utils/indexedDB-storage";
import { nanoid } from "nanoid";
import type {
  MultimodalContent,
  RequestMessage,
} from "../client/api";
import { ClientApi } from "../client/api"; // Import ClientApi directly
import { ChatControllerPool } from "../client/controller";
import { showToast } from "../components/ui-lib";
import {
  DEFAULT_INPUT_TEMPLATE,
  DEFAULT_MODELS,
  DEFAULT_SYSTEM_TEMPLATE,
  GEMINI_SUMMARIZE_MODEL,
  DEEPSEEK_SUMMARIZE_MODEL,
  KnowledgeCutOffDate,
  MCP_SYSTEM_TEMPLATE,
  MCP_TOOLS_TEMPLATE,
  ServiceProvider,
  StoreKey,
  SUMMARIZE_MODEL,
} from "../constant";
import Locale, { getLang } from "../locales";
import { prettyObject } from "../utils/format";
import { createPersistStore } from "../utils/store";
import { estimateTokenLength } from "../utils/token";
import { ModelConfig, ModelType, useAppConfig } from "./config";
import { useAccessStore } from "./access";
import { collectModelsWithDefaultModel } from "../utils/model";
import { getISOLang, getLang } from "../locales";
import { DEFAULT_TOPIC, ChatMessage, ModelType } from "./chat";
import { nanoid } from "nanoid";
import { ChatCompletionRequestMessageRoleEnum } from "openai";

const localStorage = safeLocalStorage();

export type ChatMessageTool = {
  id: string;
  index?: number;
  type?: string;
  function?: {
    name: string;
    arguments?: string;
  };
  content?: string;
  isError?: boolean;
  errorMsg?: string;
};

export type ChatMessage = RequestMessage & {
  date: string;
  streaming?: boolean;
  isError?: boolean;
  id: string;
  model?: ModelType;
  tools?: ChatMessageTool[];
  audio_url?: string;
  isMcpResponse?: boolean;
};

export function createMessage(override: Partial<ChatMessage>): ChatMessage {
  return {
    id: nanoid(),
    date: new Date().toLocaleString(),
    role: "user",
    content: "",
    ...override,
  };
}

export interface ChatStat {
  tokenCount: number;
  wordCount: number;
  charCount: number;
}

export interface ChatSession {
  id: string;
  topic: string;

  memoryPrompt: string;
  messages: ChatMessage[];
  stat: ChatStat;
  lastUpdate: number;
  lastSummarizeIndex: number;
  clearContextIndex?: number;

  // mask: Mask; // Remove mask property
}

export const DEFAULT_TOPIC = Locale.Store.DefaultTopic;
export const BOT_HELLO: ChatMessage = createMessage({
  role: "assistant",
  content: Locale.Store.BotHello,
});

export const createEmptySession = (): ChatSession => ({
  id: nanoid(),
  topic: Locale.Store.DefaultTopic,
  memoryPrompt: "",
  messages: [],
  stat: {
    tokenCount: 0,
    wordCount: 0,
    charCount: 0,
  },
  lastUpdate: Date.now(),
  lastSummarizeIndex: 0,
  // mask: createEmptyMask(), // Remove mask initialization
});

function getSummarizeModel(
  currentModel: string,
  providerName: string,
): string[] {
  // if it is using gpt-* models, force to use 4o-mini to summarize
  if (currentModel.startsWith("gpt") || currentModel.startsWith("chatgpt")) {
    const configStore = useAppConfig.getState();
    const accessStore = useAccessStore.getState();
    const allModel = collectModelsWithDefaultModel(
      configStore.models,
      [configStore.customModels, accessStore.customModels].join(","),
      accessStore.defaultModel,
    );
    const summarizeModel = allModel.find(
      (m) => m.name === SUMMARIZE_MODEL && m.available,
    );
    if (summarizeModel) {
      return [
        summarizeModel.name,
        summarizeModel.provider?.providerName as string,
      ];
    }
  }
  if (currentModel.startsWith("gemini")) {
    return [GEMINI_SUMMARIZE_MODEL, ServiceProvider.Google];
  } else if (currentModel.startsWith("deepseek-")) {
    return [DEEPSEEK_SUMMARIZE_MODEL, ServiceProvider.DeepSeek];
  }

  return [currentModel, providerName];
}

function countMessages(msgs: ChatMessage[]) {
  return msgs.reduce(
    (pre, cur) => pre + estimateTokenLength(getMessageTextContent(cur)),
    0,
  );
}

// function fillTemplateWith(input: string, modelConfig: ModelConfig) {
//   const cutoff =
//     KnowledgeCutOffDate[modelConfig.model] ?? KnowledgeCutOffDate.default;
//   // Find the model in the DEFAULT_MODELS array that matches the modelConfig.model
//   const modelInfo = DEFAULT_MODELS.find((m) => m.name === modelConfig.model);

//   var serviceProvider = "OpenAI";
//   if (modelInfo) {
//     // TODO: auto detect the providerName from the modelConfig.model

//     // Directly use the providerName from the modelInfo
//     serviceProvider = modelInfo.provider.providerName;
//   }

//   const vars = {
//     ServiceProvider: serviceProvider,
//     cutoff,
//     model: modelConfig.model,
//     time: new Date().toString(),
//     lang: getLang(),
//     input: input,
//   };

//   let output = modelConfig.template ?? DEFAULT_INPUT_TEMPLATE;

//   // remove duplicate
//   if (input.startsWith(output)) {
//     output = "";
//   }

//   // must contains {{input}}
//   const inputVar = "{{input}}";
//   if (!output.includes(inputVar)) {
//     output += "\n" + inputVar;
//   }

//   Object.entries(vars).forEach(([name, value]) => {
//     const regex = new RegExp(`{{${name}}}`, "g");
//     output = output.replace(regex, value.toString()); // Ensure value is a string
//   });

//   return output;
// }

// function createDefaultModelConfig() {
//   const configStore = useAppConfig.getState();
//   return {
//     ...configStore.modelConfig,
//   };
// }

const CHAT_PAGE_SIZE = 15;
const MAX_RENDER_MSG_COUNT = 45;

export const useChatStore = createPersistStore(
  {
    sessions: [createEmptySession()],
    currentSessionIndex: 0,
    globalId: 0,
    clearSessions() {
      this.sessions = [createEmptySession()];
      this.currentSessionIndex = 0;
      // this.save();
    },

    getIndex(sessions: ChatSession[]) {
      return Math.max(
        0,
        sessions.length - 1 - this.globalId,
      );
    },

    removeSession(index: number) {
      const deletingLastSession = index === this.sessions.length - 1;
      this.sessions.splice(index, 1);

      if (this.sessions.length === 0) {
        this.sessions.push(createEmptySession());
      }

      if (deletingLastSession) {
        this.currentSessionIndex = Math.max(0, this.sessions.length - 1);
      } else {
        this.currentSessionIndex = Math.min(
          this.currentSessionIndex,
          this.sessions.length - 1,
        );
      }
    },

    moveSession(from: number, to: number) {
      const session = this.sessions[from];
      this.sessions.splice(from, 1);
      this.sessions.splice(to, 0, session);

      // modify currentSessionIndex
      if (this.currentSessionIndex === from) {
        this.currentSessionIndex = to;
      } else if (this.currentSessionIndex > from && this.currentSessionIndex <= to) {
        this.currentSessionIndex -= 1;
      } else if (this.currentSessionIndex < from && this.currentSessionIndex >= to) {
        this.currentSessionIndex += 1;
      }
    },

    selectSession(index: number) {
      this.currentSessionIndex = index;
    },

    newSession(mask?: Mask) {
      // Determine the model and providerName to use
      let modelType = useAppConfig.getState().modelConfig.model;
      let providerName = useAppConfig.getState().modelConfig.providerName;

      // If a mask is provided, use its model and provider information
      if (mask) {
        modelType = mask.modelConfig.model;
        providerName = mask.modelConfig.providerName;
      }

      const session = createEmptySession();
      session.id = nanoid();
      // session.mask.modelConfig.model = modelType;
      // session.mask.modelConfig.providerName = providerName;

      if (mask) {
        // const config = useAppConfig.getState();
        // const globalModelConfig = config.modelConfig;

        // session.mask = {
        //   ...mask,
        //   id: nanoid(),
        //   modelConfig: {
        //     ...globalModelConfig,
        //     ...mask.modelConfig,
        //   },
        // };
        // session.topic = mask.name;
      }

      this.sessions.unshift(session);
      this.currentSessionIndex = 0;

      // Return the newly created session ID
      return session.id;
    },

    nextSession(delta: number) {
      const n = this.sessions.length;
      const nextIndex = (this.currentSessionIndex + delta + n) % n;
      this.selectSession(nextIndex);
    },

    currentChat() {
      const index = this.currentSessionIndex;
      let currentSession = this.sessions[index];
      if (!currentSession) {
        this.newSession();
        this.currentSessionIndex = 0;
        currentSession = this.sessions[0];
      }
      return currentSession;
    },

    currentSession() {
      let index = this.currentSessionIndex;
      // Check if the index is valid; if not, default to 0
      if (index < 0 || index >= this.sessions.length) {
        // console.error(`[Chat] currentSessionIndex is invalid: ${this.currentSessionIndex}, corrections will be made`);
        index = 0;
        if (this.sessions.length === 0) {
          // If there are no sessions, create a new one
          this.newSession();
        }
        this.currentSessionIndex = index;
      }
      const session = this.sessions[index];
      return session;
    },

    onNewMessage(message: ChatMessage, disableAutoRename = false) {
      let currentSession = this.currentSession();
      currentSession.messages.push(message);
      currentSession.lastUpdate = Date.now();
      this.updateStat(currentSession);

      if (
        !disableAutoRename &&
        !currentSession.topic ||
        currentSession.topic === DEFAULT_TOPIC
      ) {
        this.renameTopic(currentSession);
      }
    },

    async renameTopic(session: ChatSession) {
      if (
        !session ||
        session.messages.length === 0 ||
        session.topic !== DEFAULT_TOPIC
      ) {
        return;
      }

      const [summarizeModel, summarizeModelProviderName] = getSummarizeModel(
-       session.mask.modelConfig.model,
-       session.mask.modelConfig.providerName,
+       useAppConfig.getState().modelConfig.model, // Use global model config as base
+       useAppConfig.getState().modelConfig.providerName, // Use global provider name as base
      );
      const modelConfig = {
        ...useAppConfig.getState().modelConfig,
        model: summarizeModel,
        providerName: summarizeModelProviderName,
      };

      const clientApi = new ClientApi(); // Replace getClientApi call
      const messages
      const requestMessages = messages.concat(
        {
          role: "user",
          content: Locale.Store.RenameTopic,
          date: "",
          id: nanoid(),
        },
        {
          role: "assistant",
          content: "Okay, I will summarize the topic based on the conversation:"",
          date: "",
          id: nanoid(),
        },
      );

      // Override model config to use summarizing model
      const controller = new AbortController();
      clientApi.llm.chat({
        messages: requestMessages,
        config: {
          ...modelConfig,
          stream: false,
        },
        onUpdate(message) {},
        onFinish(message) {
          session.topic = trimTopic(message);
        },
        onError(error) {
          showToast(error.message);
        },
        onController(c) {
          controller.signal.addEventListener("abort", () => c.abort());
        },
      });
    },

    async onUserInput(content: string, attachImages?: string[]) {
      const session = this.currentSession();
-     // const modelConfig = session.mask.modelConfig;
      const modelConfig = useAppConfig.getState().modelConfig;

      let messageContent: ChatMessage["content

   * if (!modelConfig.sendMemory) return 0;
   *
   */
-  summarizeSession(): ChatMessage | undefined {
-   // const config = useAppConfig.getState();
-   // const session = this.currentSession();
-   // const modelConfig = session.mask.modelConfig;
-   // // if context is too long, summary error
-   // const messages = trimTopic(session.messages);
-
-   // // remove error messages if any
-   // const messages = session.messages.filter((m) => !m.isError);
-   // const recentMessages = messages.slice(
-   //   Math.max(0, messages.length - modelConfig.historyMessageCount),
-   // );
-
-   // // if session does not have any messages yet
-   // if (recentMessages.length === 0) {
-   //   return;
-   // }
-
-   // // let lastSummarizeIndex = session.lastSummarizeIndex;
-
-   // // construct a request payload
-   // // forget summarization result
-   // const requestMessages = recentMessages.slice(lastSummarizeIndex);
-
-   // // if user did not send large enough context, skip summarization
-   // // if (this.usedTokens(requestMessages) < 4000) {
-   // //   return;
-   // // }
-
-   // // every time summarize longest 2 messages to balance the summarize cache length and the token usage
-   // // find the longest 2 messages to summarize
-   // const sortedMessages = requestMessages
-   //   .filter((m) => !m.isError && !m.streaming)
-   //   .sort((a, b) => getMessageTextContent(b).length - getMessageTextContent(a).length);
-
-   // // add memory prompt
-   // sortedMessages.unshift({
-   //   role: "system",
-   //   content: summarizePrompt,
-   //   date: "",
-   // });
-
-   // const usedTokens = this.usedTokens(sortedMessages);
-
-   // const summaryMessage: ChatMessage = {
-   //   role: "system",
-   //   content: "",
-   //   date: new Date().toLocaleString(),
-   //   summarized: true,
-   //   id: nanoid(),
-   //   model: modelConfig.model,
-   // };
