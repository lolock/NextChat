import Fuse from "fuse.js";
import { nanoid } from "nanoid";
import { StoreKey } from "../constant";
import { getLang } from "../locales";
import { createPersistStore } from "../utils/store";

export interface Prompt {
  id: string;
  isUser?: boolean;
  title: string;
  content: string;
  createdAt: number;
}

export const SearchService = {
  ready: false,
  // builtinEngine: new Fuse<Prompt>([], { keys: ["title"] }), // Remove built-in engine
  userEngine: new Fuse<Prompt>([], { keys: ["title"] }),
  /* count: { // Remove count
    builtin: 0,
  }, */
  allPrompts: [] as Prompt[],
  // builtinPrompts: [] as Prompt[], // Remove built-in prompts array

  init(/* builtinPrompts: Prompt[], */ userPrompts: Prompt[]) { // Remove builtinPrompts from init params
    if (this.ready) {
      return;
    }
    this.allPrompts = userPrompts.slice(); // Only use user prompts
    // this.builtinPrompts = builtinPrompts.slice(); // Remove built-in prompts assignment
    // this.builtinEngine.setCollection(builtinPrompts); // Remove setting collection for built-in engine
    this.userEngine.setCollection(userPrompts);
    this.ready = true;
  },

  remove(id: string) {
    this.userEngine.remove((doc) => doc.id === id);
  },

  add(prompt: Prompt) {
    this.userEngine.add(prompt);
  },

  search(text: string) {
    const userResults = this.userEngine.search(text);
    // const builtinResults = this.builtinEngine.search(text); // Remove search in built-in engine
    return userResults.map((v) => v.item); // Return only user results
  },
};

export const usePromptStore = createPersistStore(
  {
    counter: 0,
    prompts: {} as Record<string, Prompt>,
  },

  (set, get) => ({
    add(prompt: Prompt) {
      const prompts = get().prompts;
      prompt.id = nanoid();
      prompt.isUser = true;
      prompt.createdAt = Date.now();
      prompts[prompt.id] = prompt;

      set(() => ({
        prompts: prompts,
      }));

      return prompt.id!;
    },

    get(id: string) {
      const targetPrompt = get().prompts[id];

      /* if (!targetPrompt) { // Remove fallback to built-in prompts
        return SearchService.builtinPrompts.find((v) => v.id === id);
      } */

      return targetPrompt;
    },

    remove(id: string) {
      const prompts = get().prompts;
      delete prompts[id];

      Object.entries(prompts).some(([key, prompt]) => {
        if (prompt.id === id) {
          delete prompts[key];
          return true;
        }
        return false;
      });

      SearchService.remove(id);

      set(() => ({
        prompts,
        counter: get().counter + 1,
      }));
    },

    getUserPrompts() {
      const userPrompts = Object.values(get().prompts ?? {});
      userPrompts.sort((a, b) =>
        b.id && a.id ? b.createdAt - a.createdAt : 0,
      );
      return userPrompts;
    },

    updatePrompt(id: string, updater: (prompt: Prompt) => void) {
      const prompt = get().prompts[id] ?? {
        title: "",
        content: "",
        id,
      };

      SearchService.remove(id);
      updater(prompt);
      const prompts = get().prompts;
      prompts[id] = prompt;
      set(() => ({ prompts }));
      SearchService.add(prompt);
    },

    search(text: string) {
      if (text.length === 0) {
        // return all prompts
        return this.getUserPrompts(); // Return only user prompts
      }
      return SearchService.search(text) as Prompt[];
    },
  }),
  {
    name: StoreKey.Prompt,
    version: 3,

    migrate(state, version) {
      const newState = JSON.parse(JSON.stringify(state)) as {
        prompts: Record<string, Prompt>;
      };

      if (version < 3) {
        Object.values(newState.prompts).forEach((p) => (p.id = nanoid()));
      }

      return newState as any;
    },

    onRehydrateStorage(state) {
      // Skip store rehydration on server side
      if (typeof window === "undefined") {
        return;
      }

      /* // Remove fetching and processing prompts.json
      const PROMPT_URL = "./prompts.json";

      type PromptList = Array<[string, string]>;

      fetch(PROMPT_URL)
        .then((res) => res.json())
        .then((res) => {
          let fetchPrompts = [res.en, res.tw, res.cn];
          if (getLang() === "cn") {
            fetchPrompts = fetchPrompts.reverse();
          }
          const builtinPrompts = fetchPrompts.map((promptList: PromptList) => {
            return promptList.map(
              ([title, content]) =>
                ({
                  id: nanoid(),
                  title,
                  content,
                  createdAt: Date.now(),
                }) as Prompt,
            );
          });

          const userPrompts = usePromptStore.getState().getUserPrompts() ?? [];

          const allPromptsForSearch = builtinPrompts
            .reduce((pre, cur) => pre.concat(cur), [])
            .filter((v) => !!v.title && !!v.content);
          SearchService.count.builtin =
            res.en.length + res.cn.length + res.tw.length;
          SearchService.init(allPromptsForSearch, userPrompts);
        });
      */
      // Initialize SearchService with only user prompts after rehydration
      const userPrompts = usePromptStore.getState().getUserPrompts() ?? [];
      SearchService.init(userPrompts);
    },
  },
);
