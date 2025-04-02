# Cloudflare Pages 部署问题排查指南

## Node.js 版本兼容性问题

在 Cloudflare Pages 部署过程中，如果您遇到 Node.js 版本兼容性警告，请按照以下步骤解决：

1. **更新 Node.js 版本**：
   - 当前文档中推荐的 `NODE_VERSION=20.1` 与某些依赖包（如sharp@0.33.5）不兼容
   - 建议更新为Node.js 20.11.x或更高版本，例如：`NODE_VERSION=20.11.1`

2. **更新环境变量**：
   - 登录 Cloudflare Dashboard
   - 进入您的 Pages 项目
   - 点击 "Settings" > "Environment variables"
   - 找到 `NODE_VERSION` 变量并更新其值
   - 保存更改

3. **确保设置 nodejs_compat 标志**：
   - 前往 "Build settings" > "Functions"
   - 在 "Configure Production compatibility flag" 和 "Configure Preview compatibility flag" 中填写 "nodejs_compat"

## BASE_URL 配置问题

如果您遇到 API 路径重复问题（例如 `Invalid URL (POST /v1/v1/chat/completions)` 错误），请检查您的 BASE_URL 配置：

1. **检查 API 地址格式**：
   - 如果您的 API 地址已包含 `/v1` 路径（例如 `https://your-api-endpoint.com/v1`）
   - 正确设置：`BASE_URL=https://your-api-endpoint.com`（不要包含 `/v1`）
   - 错误设置：`BASE_URL=https://your-api-endpoint.com/v1`（会导致路径重复：`/v1/v1/chat/completions`）

2. **验证完整 URL**：
   - 确保 BASE_URL 包含完整的协议和域名（例如 `https://your-api-endpoint.com`）
   - 不要在末尾添加斜杠

## CUSTOM_MODELS 配置问题

如果您需要使用特定模型但遇到问题：

1. **正确设置 CUSTOM_MODELS**：
   - 确保格式正确，例如：`CUSTOM_MODELS=grok-3@openai`
   - 如果需要多个模型，使用逗号分隔：`CUSTOM_MODELS=gpt-3.5-turbo@openai,claude-3-opus@anthropic`

2. **确认 API 提供商支持**：
   - 确认您的 API 提供商支持您配置的模型
   - 如果不确定，可以尝试使用提供商已知支持的模型

3. **DEFAULT_MODEL 配置**：
   - 确保 `DEFAULT_MODEL` 与 `CUSTOM_MODELS` 中的模型名称一致
   - 例如：如果设置 `CUSTOM_MODELS=grok-3@openai`，则应设置 `DEFAULT_MODEL=grok-3`

## 包管理器不匹配问题

如果您在部署日志中看到类似 `The project is set up for yarn but it is currently being run via npm` 的警告，这意味着您的项目配置使用 `yarn`，但 Cloudflare Pages 的构建命令默认使用了 `npm`。

1. **设置包管理器**:
   - 在 Cloudflare Pages 的项目设置中，找到 "Build settings" > "Build command"。
   - 如果您的项目使用 `yarn`，请确保构建命令使用 `yarn`。例如，您的构建命令可能需要从 `npx @cloudflare/next-on-pages` 修改为 `yarn build && npx @cloudflare/next-on-pages` 或类似的命令，具体取决于您的项目配置。
   - 或者，您可以尝试在环境变量中设置 `NPM_FLAGS="--prefix=/dev/null"` 来强制 Cloudflare Pages 使用 `yarn`。

2. **确认 `package-lock.json` 文件**:
   - 如果您打算使用 `npm`，请确保项目中存在 `package-lock.json` 文件，

完成上述配置更改后：

1. 前往 "Deployments" 页面
2. 点击 "Retry deployment"
3. 查看部署日志，确认问题是否已解决

如果仍然遇到问题，请检查部署日志中的具体错误信息，这可能提供更多关于问题原因的线索。