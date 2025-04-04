// 按钮禁用状态配置

export interface ButtonDisableConfig {
  // 聊天相关按钮
  chat: {
    send: boolean;      // 发送消息按钮
    regenerate: boolean;  // 重新生成回复按钮
    stop: boolean;      // 停止生成按钮
    clear: boolean;     // 清除聊天按钮
  };
  // 会话管理按钮
  session: {
    new: boolean;       // 新建会话按钮
    delete: boolean;    // 删除会话按钮
    edit: boolean;      // 编辑会话按钮
  };
  // 设置相关按钮
  settings: {
    save: boolean;      // 保存设置按钮
    reset: boolean;     // 重置设置按钮
  };
  // 导航按钮
  navigation: {
    discovery: boolean;  // 发现按钮
    github: boolean;     // GitHub链接按钮
  };
}

// 默认配置
export const defaultButtonConfig: ButtonDisableConfig = {
  chat: {
    send: true,
    regenerate: true,
    stop: true,
    clear: true,
  },
  session: {
    new: true,
    delete: true,
    edit: true,
  },
  settings: {
    save: false,      // 禁用保存设置按钮
    reset: false,     // 禁用重置设置按钮
  },
  navigation: {
    discovery: true,    // 默认禁用发现按钮
    github: true,       // 默认禁用GitHub链接按钮
  },
};

// 获取按钮禁用状态
export function getButtonDisableState(key: string): boolean {
  const [category, button] = key.split('.');
  const config = defaultButtonConfig as any;
  return config[category]?.[button] ?? false;
}

// 更新按钮禁用状态
export function updateButtonDisableState(key: string, disabled: boolean) {
  const [category, button] = key.split('.');
  const config = defaultButtonConfig as any;
  if (config[category] && typeof config[category][button] !== 'undefined') {
    config[category][button] = disabled;
  }
}