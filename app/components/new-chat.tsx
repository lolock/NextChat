import { useEffect, useRef, useState } from "react";
import { Path, SlotID } from "../constant";
import { IconButton } from "./button";

import styles from "./new-chat.module.scss";

import LeftIcon from "../icons/left.svg";



import { useLocation, useNavigate } from "react-router-dom";

import Locale from "../locales";
import { useAppConfig, useChatStore } from "../store";



import { showConfirm } from "./ui-lib";























































































export function NewChat() {
  const chatStore = useChatStore();
  
  
  
  

  const navigate = useNavigate();
  const config = useAppConfig();
  

  const { state } = useLocation();

  
  const startChat = () => {
    setTimeout(() => {
      
      chatStore.newSession();
      navigate(Path.Chat);
    }, 10);
  };

  
  
  
  
  
  
  
  
  
  
  

  
  
  
  
  
  
  

  return (
    <div className={styles["new-chat"]}>
      <div className={styles["mask-header"]}>
        <IconButton
          icon={<LeftIcon />}
          text={Locale.NewChat.Return}
          onClick={() => navigate(Path.Home)}
        ></IconButton>
        {!state?.fromHome && (
          <IconButton
            text={Locale.NewChat.NotShow}
            onClick={async () => {
              if (await showConfirm(Locale.NewChat.ConfirmNoShow)) {
                // User confirmed not to show this screen again.
                // Update config and start a new chat directly.
                startChat();
                config.update(
                  (config) => (config.dontShowMaskSplashScreen = true),
                );
              }
            }}
          ></IconButton>
        )}
      </div>
      
      
      
      
      
      
      
      
      
      

      
      <div className={styles["title"]}>{Locale.Home.NewChat}</div>
      

      
      <div className={styles["actions"]}>
        <IconButton
          text={Locale.NewChat.Start}
          type="primary"
          shadow
          className={styles["button"]}
          onClick={() => startChat()} // No mask parameter passed
          autoFocus
        />
      </div>

      
      
      
      
      
      
      
      
      
      
      
      
      
      
    </div>
  );
}
