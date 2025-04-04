import { useState, useEffect, useMemo } from "react";

import styles from "./settings.module.scss";

import ResetIcon from "../icons/reload.svg";
import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import CopyIcon from "../icons/copy.svg";
import ClearIcon from "../icons/clear.svg";
import LoadingIcon from "../icons/three-dots.svg";
import EditIcon from "../icons/edit.svg";
import FireIcon from "../icons/fire.svg";
import EyeIcon from "../icons/eye.svg";
import DownloadIcon from "../icons/download.svg";
import UploadIcon from "../icons/upload.svg";
import ConfigIcon from "../icons/config.svg";
import ConfirmIcon from "../icons/confirm.svg";

import ConnectionIcon from "../icons/connection.svg";
import CloudSuccessIcon from "../icons/cloud-success.svg";
import CloudFailIcon from "../icons/cloud-fail.svg";
import { trackSettingsPageGuideToCPaymentClick } from "../utils/auth-settings-events";
import {
  Input,
  List,
  ListItem,
  Modal,
  PasswordInput,
  Popover,
  Select,
  showConfirm,
  showToast,
} from "./ui-lib";
import { ModelConfigList } from "./model-config";

import { IconButton } from "./button";
import {
  SubmitKey,
  useChatStore,
  Theme,
  useUpdateStore,
  useAccessStore,
  useAppConfig,
} from "../store";

import Locale, {
  AllLangs,
  ALL_LANG_OPTIONS,
  changeLang,
  getLang,
} from "../locales";
import { copyToClipboard, clientUpdate, semverCompare } from "../utils";
import Link from "next/link";
import {
  Azure, // Keep Azure as OpenAI compatible
  OPENAI_BASE_URL,
  Path,
  RELEASE_URL,
  STORAGE_KEY,
  ServiceProvider, // Keep for OpenAI/Azure distinction if needed
  SlotID,
  UPDATE_URL,
  Stability, // Keep Stability for potential future image gen
  SAAS_CHAT_URL,
} from "../constant";
// Removed imports for Anthropic, Baidu, Tencent, ByteDance, Alibaba, Moonshot, XAI, Google, Iflytek, ChatGLM, DeepSeek, SiliconFlow
import { Prompt, SearchService, usePromptStore } from "../store/prompt";
import { ErrorBoundary } from "./error";
import { InputRange } from "./input-range";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarPicker } from "./emoji";
import { getClientConfig } from "../config/client";
import { useSyncStore } from "../store/sync";
import { nanoid } from "nanoid";
// import { useMaskStore } from "../store/mask"; // MaskStore related code/import removed
import { ProviderType } from "../utils/cloud";
import { TTSConfigList } from "./tts-config";
import { RealtimeConfigList } from "./realtime-chat/realtime-config";

function EditPromptModal(props: { id: string; onClose: () => void }) {
  const promptStore = usePromptStore();
  const prompt = promptStore.get(props.id);

  return prompt ? (
    <div className="modal-mask">
      <Modal
        title={Locale.Settings.Prompt.EditModal.Title}
        onClose={props.onClose}
        actions={[
          <IconButton
            key=""
            onClick={props.onClose}
            text={Locale.UI.Confirm}
            bordered
          />,
        ]}
      >
        <div className={styles["edit-prompt-modal"]}>
          <input
            type="text"
            value={prompt.title}
            readOnly={!prompt.isUser}
            className={styles["edit-prompt-title"]}
            onInput={(e) =>
              promptStore.updatePrompt(
                props.id,
                (prompt) => (prompt.title = e.currentTarget.value),
              )
            }
          ></input>
          <Input
            value={prompt.content}
            readOnly={!prompt.isUser}
            className={styles["edit-prompt-content"]}
            rows={10}
            onInput={(e) =>
              promptStore.updatePrompt(
                props.id,
                (prompt) => (prompt.content = e.currentTarget.value),
              )
            }
          ></Input>
        </div>
      </Modal>
    </div>
  ) : null;
}

function UserPromptModal(props: { onClose?: () => void }) {
  const promptStore = usePromptStore();
  const userPrompts = promptStore.getUserPrompts();
  const builtinPrompts = SearchService.builtinPrompts;
  const allPrompts = userPrompts.concat(builtinPrompts);
  const [searchInput, setSearchInput] = useState("");
  const [searchPrompts, setSearchPrompts] = useState<Prompt[]>([]);
  const prompts = searchInput.length > 0 ? searchPrompts : allPrompts;

  const [editingPromptId, setEditingPromptId] = useState<string>();

  useEffect(() => {
    if (searchInput.length > 0) {
      const searchResult = SearchService.search(searchInput);
      setSearchPrompts(searchResult);
    } else {
      setSearchPrompts([]);
    }
  }, [searchInput]);

  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Settings.Prompt.Modal.Title}
        onClose={() => props.onClose?.()}
        actions={[
          <IconButton
            key="add"
            onClick={() => {
              const promptId = promptStore.add({
                id: nanoid(),
                createdAt: Date.now(),
                title: "Empty Prompt",
                content: "Empty Prompt Content",
              });
              setEditingPromptId(promptId);
            }}
            icon={<AddIcon />}
            bordered
            text={Locale.Settings.Prompt.Modal.Add}
          />,
        ]}
      >
        <div className={styles["user-prompt-modal"]}>
          <input
            type="text"
            className={styles["user-prompt-search"]}
            placeholder={Locale.Settings.Prompt.Modal.Search}
            value={searchInput}
            onInput={(e) => setSearchInput(e.currentTarget.value)}
          ></input>

          <div className={styles["user-prompt-list"]}>
            {prompts.map((v, _) => (
              <div className={styles["user-prompt-item"]} key={v.id ?? v.title}>
                <div className={styles["user-prompt-header"]}>
                  <div className={styles["user-prompt-title"]}>{v.title}</div>
                  <div className={styles["user-prompt-content"] + " one-line"}>
                    {v.content}
                  </div>
                </div>

                <div className={styles["user-prompt-buttons"]}>
                  {v.isUser && (
                    <IconButton
                      icon={<ClearIcon />}
                      className={styles["user-prompt-button"]}
                      onClick={() => promptStore.remove(v.id!)}
                    />
                  )}
                  {v.isUser ? (
                    <IconButton
                      icon={<EditIcon />}
                      className={styles["user-prompt-button"]}
                      onClick={() => setEditingPromptId(v.id)}
                    />
                  ) : (
                    <IconButton
                      icon={<EyeIcon />}
                      className={styles["user-prompt-button"]}
                      onClick={() => setEditingPromptId(v.id)}
                    />
                  )}
                  <IconButton
                    icon={<CopyIcon />}
                    className={styles["user-prompt-button"]}
                    onClick={() => copyToClipboard(v.content)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {editingPromptId !== undefined && (
        <EditPromptModal
          id={editingPromptId!}
          onClose={() => setEditingPromptId(undefined)}
        />
      )}
    </div>
  );
}

function DangerItems() {
  const chatStore = useChatStore();
  const appConfig = useAppConfig();

  return (
    <List>
      <ListItem
        title={Locale.Settings.Danger.Reset.Title}
        subTitle={Locale.Settings.Danger.Reset.SubTitle}
      >
        <IconButton
          aria={Locale.Settings.Danger.Reset.Title}
          text={Locale.Settings.Danger.Reset.Action}
          onClick={async () => {
            if (await showConfirm(Locale.Settings.Danger.Reset.Confirm)) {
              appConfig.reset();
            }
          }}
          type="danger"
        />
      </ListItem>
      <ListItem
        title={Locale.Settings.Danger.Clear.Title}
        subTitle={Locale.Settings.Danger.Clear.SubTitle}
      >
        <IconButton
          aria={Locale.Settings.Danger.Clear.Title}
          text={Locale.Settings.Danger.Clear.Action}
          onClick={async () => {
            if (await showConfirm(Locale.Settings.Danger.Clear.Confirm)) {
              chatStore.clearAllData();
            }
          }}
          type="danger"
        />
      </ListItem>
    </List>
  );
}

function CheckButton() {
  const syncStore = useSyncStore();

  const couldCheck = useMemo(() => {
    return syncStore.cloudSync();
  }, [syncStore]);

  const [checkState, setCheckState] = useState<
    "none" | "checking" | "success" | "failed"
  >("none");

  async function check() {
    setCheckState("checking");
    const valid = await syncStore.check();
    setCheckState(valid ? "success" : "failed");
  }

  if (!couldCheck) return null;

  return (
    <IconButton
      text={Locale.Settings.Sync.Config.Modal.Check}
      bordered
      onClick={check}
      icon={
        checkState === "none" ? (
          <ConnectionIcon />
        ) : checkState === "checking" ? (
          <LoadingIcon />
        ) : checkState === "success" ? (
          <CloudSuccessIcon />
        ) : checkState === "failed" ? (
          <CloudFailIcon />
        ) : (
          <ConnectionIcon />
        )
      }
    ></IconButton>
  );
}

function SyncConfigModal(props: { onClose?: () => void }) {
  const syncStore = useSyncStore();

  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Settings.Sync.Config.Modal.Title}
        onClose={() => props.onClose?.()}
        actions={[
          <CheckButton key="check" />,
          <IconButton
            key="confirm"
            onClick={props.onClose}
            icon={<ConfirmIcon />}
            bordered
            text={Locale.UI.Confirm}
          />,
        ]}
      >
        <List>
          <ListItem
            title={Locale.Settings.Sync.Config.SyncType.Title}
            subTitle={Locale.Settings.Sync.Config.SyncType.SubTitle}
          >
            <select
              value={syncStore.provider}
              onChange={(e) => {
                syncStore.update(
                  (config) =>
                    (config.provider = e.target.value as ProviderType),
                );
              }}
            >
              {Object.entries(ProviderType).map(([k, v]) => (
                <option value={v} key={k}>
                  {k}
                </option>
              ))}
            </select>
          </ListItem>

          <ListItem
            title={Locale.Settings.Sync.Config.Proxy.Title}
            subTitle={Locale.Settings.Sync.Config.Proxy.SubTitle}
          >
            <input
              type="checkbox"
              checked={syncStore.useProxy}
              onChange={(e) => {
                syncStore.update(
                  (config) => (config.useProxy = e.currentTarget.checked),
                );
              }}
            ></input>
          </ListItem>
          {syncStore.useProxy ? (
            <ListItem
              title={Locale.Settings.Sync.Config.ProxyUrl.Title}
              subTitle={Locale.Settings.Sync.Config.ProxyUrl.SubTitle}
            >
              <input
                type="text"
                value={syncStore.proxyUrl}
                onChange={(e) => {
                  syncStore.update(
                    (config) => (config.proxyUrl = e.currentTarget.value),
                  );
                }}
              ></input>
            </ListItem>
          ) : null}
        </List>

        {syncStore.provider === ProviderType.WebDAV && (
          <>
            <List>
              <ListItem title={Locale.Settings.Sync.Config.WebDav.Endpoint}>
                <input
                  type="text"
                  value={syncStore.webdav.endpoint}
                  onChange={(e) => {
                    syncStore.update(
                      (config) =>
                        (config.webdav.endpoint = e.currentTarget.value),
                    );
                  }}
                ></input>
              </ListItem>

              <ListItem title={Locale.Settings.Sync.Config.WebDav.UserName}>
                <input
                  type="text"
                  value={syncStore.webdav.username}
                  onChange={(e) => {
                    syncStore.update(
                      (config) =>
                        (config.webdav.username = e.currentTarget.value),
                    );
                  }}
                ></input>
              </ListItem>
              <ListItem title={Locale.Settings.Sync.Config.WebDav.Password}>
                <PasswordInput
                  value={syncStore.webdav.password}
                  onChange={(e) => {
                    syncStore.update(
                      (config) =>
                        (config.webdav.password = e.currentTarget.value),
                    );
                  }}
                ></PasswordInput>
              </ListItem>
            </List>
          </>
        )}

        {syncStore.provider === ProviderType.UpStash && (
          <List>
            <ListItem title={Locale.Settings.Sync.Config.UpStash.Endpoint}>
              <input
                type="text"
                value={syncStore.upstash.endpoint}
                onChange={(e) => {
                  syncStore.update(
                    (config) =>
                      (config.upstash.endpoint = e.currentTarget.value),
                  );
                }}
              ></input>
            </ListItem>

            <ListItem title={Locale.Settings.Sync.Config.UpStash.UserName}>
              <input
                type="text"
                value={syncStore.upstash.username}
                placeholder={STORAGE_KEY}
                onChange={(e) => {
                  syncStore.update(
                    (config) =>
                      (config.upstash.username = e.currentTarget.value),
                  );
                }}
              ></input>
            </ListItem>
            <ListItem title={Locale.Settings.Sync.Config.UpStash.Password}>
              <PasswordInput
                value={syncStore.upstash.apiKey}
                onChange={(e) => {
                  syncStore.update(
                    (config) => (config.upstash.apiKey = e.currentTarget.value),
                  );
                }}
              ></PasswordInput>
            </ListItem>
          </List>
        )}
      </Modal>
    </div>
  );
}

function SyncItems() {
  const syncStore = useSyncStore();
  const chatStore = useChatStore();
  const promptStore = usePromptStore();
  // const maskStore = useMaskStore(); // Removed mask store usage
  const pluginStore = usePluginStore(); // Added plugin store
  const couldSync = useMemo(() => {
    return syncStore.cloudSync();
  }, [syncStore]);

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.getUserPrompts();

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.getUserPrompts();

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.getUserPrompts();

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.getUserPrompts();

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.getUserPrompts();

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.getUserPrompts();

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.getUserPrompts();

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.getUserPrompts();

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.getUserPrompts();

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.getUserPrompts();

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.getUserPrompts();

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.getUserPrompts();

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.getUserPrompts();

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.getUserPrompts();

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.getUserPrompts();

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.getUserPrompts();

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.getUserPrompts();

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.getUserPrompts();

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.getUserPrompts();

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.getUserPrompts();

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.getUserPrompts();

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.getUserPrompts();

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.getUserPrompts();

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.getUserPrompts();

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prompt: prompts.length,
      // mask: masks.length, // Removed mask count
      plugin: pluginStore.plugins.length,
    };
  }, [chatStore.sessions, promptStore.prompts, pluginStore.plugins]); // Removed maskStore dependency, added pluginStore

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    // const masks = maskStore.getAll(); // Removed mask store usage
    const prompts = promptStore.prompts;

    return {
      chat: sessions.length,
      prom
