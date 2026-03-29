# 小区物业监督助手

一款为小区业主提供的物业问题监督工具，业主可以记录、反馈小区内的物业服务问题，并通过社区互动形成监督合力。

---

## 功能特性

- **问题发布**：业主可发布物业问题（标题、描述、图片、位置）
- **问题列表**：展示所有问题，支持下拉刷新、上拉加载更多
- **问题详情**：查看问题详情，图片轮播预览
- **点赞评论**：用户可对问题点赞、发表评论
- **我的发布**：管理自己发布的问题，支持删除
- **管理员功能**：标记问题处理状态（待处理→处理中→已整改）

---

## 项目结构

```
├── app.js                      # 应用入口
├── app.json                    # 全局配置
├── app.wxss                    # 全局样式
├── project.config.json         # 微信开发者工具配置
├── sitemap.json                # SEO配置
├── pages/
│   ├── index/                  # 首页/问题列表
│   ├── publish/                # 发布问题页
│   ├── detail/                 # 问题详情页
│   ├── my/                     # 我的页面
│   └── my-issues/              # 我的问题列表
├── components/
│   ├── issue-card/             # 问题卡片组件
│   ├── comment-item/           # 评论条目组件
│   └── empty-state/            # 空状态组件
├── cloudfunctions/
│   ├── userLogin/              # 用户登录
│   ├── publishIssue/           # 发布问题
│   ├── toggleLike/             # 点赞/取消点赞
│   ├── addComment/             # 添加评论
│   ├── updateIssueStatus/       # 更新问题状态(管理员)
│   └── securityCheck/          # 内容安全检测
└── assets/
    └── images/                 # 静态资源图片
```

---

## 部署指南

### 前提条件

1. 已注册微信小程序账号
2. 已开通微信云开发服务
3. 已安装微信开发者工具

### 步骤 1：替换云开发环境 ID

在以下文件中，将 `cloud-xxx` 替换为您的实际云开发环境 ID：

- `app.js` 第 4 行和第 14 行
- `project.config.json` 第 27 行（appid）

**如何获取环境 ID：**
1. 打开微信开发者工具
2. 点击左侧「云开发」图标
3. 在云开发控制台中查看「环境 ID」

### 步骤 2：创建数据库集合

在微信开发者工具中，打开「云开发控制台」→「数据库」，创建以下集合：

| 集合名称 | 说明 |
|---------|------|
| `users` | 用户信息 |
| `issues` | 问题记录 |
| `comments` | 评论记录 |
| `likes` | 点赞记录 |
| `config` | 配置表 |
| `statusChangeLogs` | 状态变更日志（可选） |

### 步骤 3：设置数据库权限

在云开发控制台中，为每个集合设置权限：

**users 集合：**
- 权限：仅创建者可读写
```json
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```

**issues 集合：**
- 权限：所有人可读，创建者可写
```json
{
  "read": true,
  "write": "doc._openid == auth.openid"
}
```

**comments 集合：**
- 权限：所有人可读，创建者可写
```json
{
  "read": true,
  "write": "doc._openid == auth.openid"
}
```

**likes 集合：**
- 权限：仅创建者可读写
```json
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```

**config 集合：**
- 权限：所有人可读，管理员可写
```json
{
  "read": true,
  "write": false
}
```

### 步骤 4：上传并部署云函数

在微信开发者工具中：

1. 右键点击 `cloudfunctions` 文件夹
2. 选择「上传并部署：云端安装依赖」
3. 等待部署完成

重复以上步骤，为每个云函数都进行部署。

### 步骤 5：初始化管理员列表

1. 在云开发控制台中，打开 `config` 集合
2. 添加一条记录：
```json
{
  "key": "adminList",
  "value": ["你的openid"]
}
```

**如何获取 openid：**
- 在小程序中登录后，查看开发者工具控制台日志输出的 openid
- 或在云开发控制台的「用户管理」中查看

### 步骤 6：添加 tabBar 图标

在 `assets/images/` 目录下添加以下图片：

| 文件名 | 说明 |
|-------|------|
| `home.png` | 首页 tabBar 图标 |
| `home-active.png` | 首页 tabBar 选中图标 |
| `my.png` | 我的 tabBar 图标 |
| `my-active.png` | 我的 tabBar 选中图标 |
| `add.png` | 发布按钮图标 |
| `like.png` | 点赞图标 |
| `like-active.png` | 已点赞图标 |
| `comment.png` | 评论图标 |
| `delete.png` | 删除图标 |
| `camera.png` | 相机图标 |
| `location.png` | 位置图标 |
| `arrow-right.png` | 箭头图标 |
| `close.png` | 关闭图标 |
| `admin.png` | 管理员图标 |
| `default-avatar.png` | 默认头像 |
| `empty.png` | 空状态图标 |
| `my-issues.png` | 我的发布图标 |
| `about.png` | 关于我们图标 |

图标规格：
- tabBar 图标：81x81px
- 其他图标：建议 44x44px 或根据实际需求调整

### 步骤 7：在微信开发者工具中导入项目

1. 打开微信开发者工具
2. 点击「导入项目」
3. 选择项目目录
4. 填写 AppID（必须与 `project.config.json` 中的 appid 一致）
5. 点击「确定」

### 步骤 8：编译预览

1. 点击「编译」按钮
2. 使用微信扫描二维码预览
3. 测试各项功能是否正常

---

## 数据库集合设计

### users（用户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | string | 自动生成 |
| `_openid` | string | 微信 openid |
| `nickName` | string | 用户昵称 |
| `avatarUrl` | string | 用户头像 |
| `createTime` | date | 首次登录时间 |

### issues（问题表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | string | 自动生成 |
| `_openid` | string | 发布者 openid |
| `title` | string | 标题（限30字） |
| `description` | string | 描述（限200字） |
| `images` | array | 图片云存储路径数组 |
| `location` | string | 位置信息（可选） |
| `status` | string | 状态：pending/processing/resolved |
| `statusDesc` | string | 整改说明（管理员填写） |
| `statusImages` | array | 整改照片 |
| `likeCount` | number | 点赞数 |
| `commentCount` | number | 评论数 |
| `createTime` | date | 发布时间 |
| `updateTime` | date | 更新时间 |
| `isDeleted` | boolean | 软删除标记 |

### comments（评论表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | string | 自动生成 |
| `_openid` | string | 评论者 openid |
| `issueId` | string | 关联的问题ID |
| `content` | string | 评论内容（限100字） |
| `nickName` | string | 评论者昵称 |
| `avatarUrl` | string | 评论者头像 |
| `createTime` | date | 评论时间 |
| `isDeleted` | boolean | 软删除标记 |

### likes（点赞记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | string | 自动生成 |
| `_openid` | string | 点赞者 openid |
| `issueId` | string | 关联的问题ID |
| `createTime` | date | 点赞时间 |

### config（配置表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | string | 自动生成 |
| `key` | string | 配置键（如"adminList"） |
| `value` | array | 配置值（如管理员 openid 列表） |

---

## 云函数说明

| 云函数 | 功能 |
|--------|------|
| `userLogin` | 用户登录，记录/获取用户信息 |
| `publishIssue` | 发布问题，包含内容安全检测 |
| `toggleLike` | 点赞/取消点赞 |
| `addComment` | 添加评论，包含内容安全检测 |
| `updateIssueStatus` | 管理员更新问题状态 |
| `securityCheck` | 内容安全检测（文本/图片） |

---

## 常见问题

### Q: 云函数部署失败怎么办？

A: 确保云函数目录下有 `package.json` 文件，且依赖已正确配置。删除 `node_modules` 后重新部署。

### Q: 如何添加管理员？

A: 在 `config` 集合中修改 `adminList` 数组，添加管理员的 openid。

### Q: 图片上传失败怎么办？

A: 检查云存储是否已开通，确保网络连接正常，图片大小不超过限制。

### Q: 内容安全检测一直失败？

A: 确保云函数已正确部署，且微信公众平台已开通内容安全检测能力。

---

## 更新日志

### v1.0.0 (2026-03-26)
- 初始版本
- 实现问题发布、列表、详情、评论、点赞功能
- 实现管理员状态标记功能
- 实现内容安全检测
