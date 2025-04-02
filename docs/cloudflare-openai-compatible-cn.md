# Cloudflare Pages 部署 OpenAI 兼容 API 指南

本指南将帮助您在 Cloudflare Pages 上配置 NextChat 以使用 OpenAI 兼容的 API 和 grok-3 模型。

## 配置步骤

在 Cloudflare Pages 的环境变量设置中，您需要配置以下变量：

### 基本环境变量

这些是必须设置的基本环境变量：

- `NODE_VERSION=20.1`
- `NEXT_TELEMETRY_DISABLE=1`
- `YARN_VERSION=1.22.19`
- `PHP_VERSION=7.4`

### OpenAI 兼容 API 配置

为了使用您的 OpenAI 兼容 API，请设置以下环境变量：

- `BASE_URL=您的API地址` - 设置为您的 OpenAI 兼容 API 的基础 URL（**重要：如果您的API地址已经包含`/v1`路径，请不要在BASE_URL中重复包含该路径，否则会导致请求错误**）
- `OPENAI_API_KEY=您的API密钥` - 设置为您的 API 密钥

### 默认模型配置

要将 grok3 设置为默认模型，请添加以下环境变量：

- `CUSTOM_MODELS=grok-3@openai` - 添加 grok3 模型到可用模型列表
- `DEFAULT_MODEL=grok-3` - 设置 grok-3 为默认模型

### 可选配置

根据您的需求，可以添加以下可选配置：

- `CODE=访问密码` - 可选，设置访问密码，多个密码可以用逗号分隔
- `HIDE_USER_API_KEY=1` - 可选，不允许用户自行填入 API Key
- `DISABLE_GPT4=1` - 可选，不允许用户使用 GPT-4
- `ENABLE_BALANCE_QUERY=1` - 可选，允许用户查询余额

## 兼容性标志设置

在完成环境变量设置后，您还需要设置兼容性标志：

1. 在 Cloudflare Pages 的「构建设置」中，找到「函数」部分
2. 找到「兼容性标志」设置
3. 在「配置生产兼容性标志」和「配置预览兼容性标志」中填入 `nodejs_compat`

## 验证配置

完成以上设置后，部署您的应用。当用户访问您的网站时，系统将自动使用 grok-3 作为默认模型，并连接到您配置的 OpenAI 兼容 API。

## 故障排除

如果您遇到问题：

1. 确认您的 API 地址格式正确，应该包含完整的 URL（例如 `https://your-api-endpoint.com`）
2. 如果遇到 `Invalid URL (POST /v1/v1/chat/completions)` 错误，这表明您的BASE_URL配置有误，URL路径重复。请检查您的API地址是否已经包含了`/v1`路径：
   - 如果API地址已包含`/v1`（如`https://your-api-endpoint.com/v1`），则应设置`BASE_URL=https://your-api-endpoint.com`（不要包含`/v1`）
   - 如果API地址不包含`/v1`，则正确设置为`BASE_URL=https://your-api-endpoint.com`
3. 验证 API 密钥是否正确
4. 检查 Cloudflare Pages 的部署日志，查看是否有错误信息
5. 确保您的 API 服务支持 OpenAI 兼容的接口格式

### 模型可用性问题

如果您遇到类似 `当前分组 default 下对于模型 grok-3 无可用渠道` 的错误：

1. **确认API提供商支持grok-3模型**：首先确认您使用的API服务提供商是否支持grok-3模型。不同的API提供商支持的模型列表可能不同。
   - 如果您已确认API提供商支持grok-3模型，请确保模型名称拼写正确，某些提供商可能使用略微不同的模型名称

2. **检查账户权限**：确认您的账户有权限访问grok-3模型。某些模型可能需要特定的账户等级或额外付费。

3. **检查BASE_URL配置**：
   - 确保您的BASE_URL配置正确，没有重复的`/v1`路径
   - 如果您的API地址是`https://your-api-endpoint.com/v1`，则应设置`BASE_URL=https://your-api-endpoint.com`
   - 错误示例：如果设置`BASE_URL=https://your-api-endpoint.com/v1`，系统会尝试访问`https://your-api-endpoint.com/v1/v1/chat/completions`，导致错误

4. **调整CUSTOM_MODELS配置**：
   - 确保正确设置`CUSTOM_MODELS=grok-3@openai`
   - 如果您的API提供商使用不同的模型标识符，请相应调整，例如可能需要使用`CUSTOM_MODELS=grok-3@openai`或其他变体
   - 如果确定API提供商不支持grok-3模型，请修改为其他支持的模型，例如：`CUSTOM_MODELS=gpt-3.5-turbo@openai,claude-3-opus@anthropic`

5. **调整DEFAULT_MODEL配置**：
   - 确保设置`DEFAULT_MODEL=grok-3`与CUSTOM_MODELS中的模型名称完全一致
   - 如果更改了CUSTOM_MODELS中的模型名称，也需要相应更新DEFAULT_MODEL

6. **联系API提供商**：如果您确信应该能够访问grok-3模型但仍然遇到问题，请联系您的API服务提供商，确认：
   - 您的账户状态和模型可用性
   - grok-3模型的确切名称（可能与标准名称有所不同）
   - 是否需要特殊的API调用参数