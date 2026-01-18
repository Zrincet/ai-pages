# 阿里云 ESA 部署文档

本文档详细介绍如何部署边缘函数到阿里云 ESA（Edge Security Acceleration），实现 HTML 页面的边缘存储和全球访问。

## 📋 前提条件

- 已开通阿里云 ESA 服务
- 已完成域名接入（详见 [ESA_SETUP.md](ESA_SETUP.md)）
- 拥有阿里云账号管理权限

## 🚀 部署步骤

### 步骤 1：创建 EdgeKV 存储空间

1. **登录阿里云 ESA 控制台**
   - 访问：https://esa.console.aliyun.com/
   - 选择对应的站点

2. **进入边缘存储管理**
   - 左侧菜单：边缘计算 → 边缘存储
   - 点击"创建存储空间"

3. **创建 Namespace**
   - **存储空间名称**：`html_pages`（必须与边缘函数代码中的 NAMESPACE 一致）
   - **描述**：HTML 页面存储
   - 点击"确定"创建

4. **记录信息**
   - 创建成功后，在列表中可以看到 `html_pages` 存储空间
   - 记录存储空间名称，后续边缘函数会使用

### 步骤 2：创建边缘函数

1. **进入函数管理**
   - 左侧菜单：边缘计算 → 函数和 Pages
   - 点击"创建函数"

2. **填写基本信息**
   - **函数名称**：`html-storage-function`
   - **描述**：HTML 存储和访问服务
   - **运行环境**：选择最新的 JavaScript 运行时
   - 点击"下一步"

3. **编写函数代码**
   - 复制 `edge-functions/html-storage.js` 的完整内容
   - 粘贴到代码编辑器中
   - **重要**：确保代码中的 `NAMESPACE` 变量值为 `html_pages`

   ```javascript
   const NAMESPACE = 'html_pages';
   ```

4. **验证代码**
   - 点击"测试运行"（可选）
   - 检查是否有语法错误

5. **保存并发布**
   - 点击"保存"
   - 点击"发布到测试环境"
   - 等待发布完成

### 步骤 3：配置路由规则

#### 方案 A：使用路由规则（推荐）

1. **添加路由规则**
   - 在函数详情页，选择"路由"页签
   - 点击"添加路由"

2. **配置存储 API 路由**
   - **路径模式**：`/api/storage`
   - **匹配方式**：完全匹配
   - **转发目标**：当前函数
   - 点击"确定"

3. **配置页面访问路由**
   - 点击"添加路由"
   - **路径模式**：`/pages/*`
   - **匹配方式**：前缀匹配
   - **转发目标**：当前函数
   - 点击"确定"

4. **验证路由**
   - 确保两条路由规则都已生效
   - 路由优先级：`/api/storage` > `/pages/*`

#### 方案 B：使用域名绑定（全量转发）

1. **绑定域名**
   - 在函数详情页，选择"域名"页签
   - 点击"绑定域名"
   - 选择已接入的域名或添加子域名（如 `html.example.com`）
   - 点击"确定"

2. **注意事项**
   - 域名绑定后，该域名的**所有请求**都会转发到该函数
   - 适合专门用于 HTML 生成服务的独立域名

### 步骤 4：测试边缘函数

1. **获取测试域名**
   - 测试环境：在函数详情页查看测试域名
   - 生产环境：使用已绑定的正式域名

2. **测试存储 API**

   使用 curl 或 Postman 测试：

   ```bash
   # 测试存储 HTML
   curl -X POST https://your-domain.com/api/storage \
     -H "Content-Type: application/json" \
     -d '{
       "key": "test-page",
       "html": "<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello World</h1></body></html>",
       "title": "测试页面"
     }'
   ```

   预期响应：
   ```json
   {
     "success": true,
     "message": "HTML stored successfully",
     "key": "test-page"
   }
   ```

3. **测试页面访问**

   在浏览器中访问：
   ```
   https://your-domain.com/pages/test-page
   ```

   应该能看到 HTML 页面正常渲染

### 步骤 5：发布到生产环境

1. **生成版本**
   - 在函数详情页，点击"生成版本"
   - 输入版本说明（如 `v1.0.0 - 初始版本`）
   - 点击"确定"

2. **发布到生产**
   - 选择刚生成的版本
   - 点击"发布到生产环境"
   - 选择发布策略：
     - **全量发布**：立即全量上线
     - **灰度发布**：按流量百分比逐步发布（推荐）
   - 点击"确定"

3. **验证生产环境**
   - 使用生产域名重新测试存储和访问功能
   - 确保功能正常

### 步骤 6：更新前端配置

1. **配置环境变量**
   
   编辑项目根目录的 `.env` 文件：

   ```env
   VITE_ESA_DOMAIN=https://your-domain.com
   ```

   替换 `your-domain.com` 为实际的 ESA 域名

2. **重新构建前端**

   ```bash
   npm run build
   ```

3. **部署前端**
   - 将 `dist/` 目录部署到您的服务器或 CDN
   - 或使用 Vercel、Netlify 等平台部署

## 🔧 高级配置

### 自定义域名

如果使用自定义域名：

1. **DNS 配置**
   - 在域名服务商处添加 CNAME 记录
   - 记录值：ESA 提供的 CNAME 地址

2. **SSL 证书**
   - ESA 自动提供免费 SSL 证书
   - 或上传自定义证书

### 访问控制

如需限制访问：

1. **IP 白名单**
   
   在边缘函数中添加 IP 检查：
   
   ```javascript
   function checkIPWhitelist(request) {
     const clientIP = request.headers.get('X-Real-IP');
     const whitelist = ['1.2.3.4', '5.6.7.8'];
     return whitelist.includes(clientIP);
   }
   ```

2. **API Key 验证**
   
   在边缘函数中添加 API Key 验证：
   
   ```javascript
   function validateAPIKey(request) {
     const apiKey = request.headers.get('X-API-Key');
     return apiKey === 'your-secret-key';
   }
   ```

### 性能优化

1. **缓存配置**
   - GET `/pages/*` 请求已设置 1 小时缓存
   - 可根据需要调整 `Cache-Control` 头

2. **压缩**
   - ESA 自动启用 Gzip/Brotli 压缩
   - 无需额外配置

## 📊 监控和日志

### 查看函数日志

1. **进入日志中心**
   - 左侧菜单：边缘计算 → 日志中心
   - 选择对应的函数

2. **查看日志**
   - 实时日志：查看当前正在产生的日志
   - 历史日志：查询历史时间段的日志

3. **日志内容**
   - 请求路径、方法、状态码
   - 错误信息（如有）
   - 自定义 console.log 输出

### 查看监控指标

1. **进入监控中心**
   - 函数详情页 → "监控"页签

2. **关键指标**
   - 请求次数
   - 响应时间
   - 错误率
   - CPU/内存使用情况

## ❗ 常见问题

### 1. 函数创建失败

**原因**：代码语法错误或依赖问题

**解决**：
- 检查代码语法
- 确保使用的 API 在边缘函数环境中可用
- 参考官方文档：https://help.aliyun.com/zh/esa/

### 2. EdgeKV 无法访问

**原因**：Namespace 不存在或名称不匹配

**解决**：
- 确认已创建 `html_pages` 存储空间
- 检查代码中的 NAMESPACE 常量值
- 确保名称完全一致（区分大小写）

### 3. CORS 跨域错误

**原因**：前端域名与边缘函数域名不同

**解决**：
- 已在代码中配置 CORS 头
- 如仍有问题，检查 `getCORSHeaders()` 函数
- 确保 `Access-Control-Allow-Origin` 正确设置

### 4. 页面访问 404

**原因**：路由配置错误或 HTML 未成功存储

**解决**：
- 检查路由规则是否正确配置
- 使用 curl 测试存储 API 是否成功
- 查看边缘函数日志确认请求是否到达

### 5. HTML 大小限制

**问题**：单个 HTML 超过 1.8MB

**解决**：
- 前端已有大小检查和警告
- 建议优化 HTML（压缩、移除注释）
- 或拆分成多个文件并使用外部资源

## 📞 技术支持

- **官方文档**：https://help.aliyun.com/zh/esa/
- **工单支持**：阿里云控制台提交工单
- **社区论坛**：https://developer.aliyun.com/ask/

## 🔄 更新和维护

### 更新边缘函数

1. 修改 `edge-functions/html-storage.js`
2. 在 ESA 控制台更新代码
3. 生成新版本
4. 发布到测试环境验证
5. 发布到生产环境

### 回滚版本

1. 在函数详情页查看历史版本
2. 选择要回滚的版本
3. 点击"发布到生产环境"

---

完成以上步骤后，您的 AI HTML Generator 就可以正常使用了！🎉
