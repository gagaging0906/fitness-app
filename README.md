# AI 健身助手 · Web（手机端优先）

面向中国大陆健身小白的 AI 驱动减脂/增肌助手。**手机浏览器 + 安卓/iOS 双端兼容**，
核心能力：每日热量计算、训练记录（渐进超负荷）、饮食记录（AI 拍照识餐）、
AI 未来身材预览（激励）。

---

## 技术栈

| 层     | 选型                                                    |
|--------|---------------------------------------------------------|
| 前端   | Next.js 15（App Router）、React 19 RC、TypeScript        |
| 样式   | Tailwind CSS、shadcn/ui、lucide-react                    |
| 后端   | Next.js Route Handlers（Serverless）                    |
| 数据库 | Supabase Postgres（含 Auth、Storage、RLS）              |
| AI     | Gemini 2.5 Flash（识餐 / 未来身材）、通义千问或 DeepSeek（推荐餐 / 文案）|
| 部署   | Vercel（免费额度内可跑）                                 |

---

## 快速开始（Windows 小白指南）

> **前置：** 已装好 Node.js 20 LTS、pnpm、Git、VS Code。没装请先看根目录 `../00_Windows_环境搭建.md`。

### 1. 安装依赖

```powershell
cd web
pnpm install
```

### 2. 配置环境变量

把 `.env.example` 复制为 `.env.local`，逐项填写：

```bash
cp .env.example .env.local
```

| 变量                          | 用途                                                 | 获取方式                          |
|-------------------------------|------------------------------------------------------|-----------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`    | Supabase 项目 URL                                    | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| Supabase 匿名 Key                                   | 同上                              |
| `SUPABASE_SERVICE_ROLE_KEY`   | Supabase 服务端 Key（私密）                          | 同上（仅后端使用，不要泄露）      |
| `GEMINI_API_KEY`              | Google Gemini API Key（识餐 / 未来身材）              | [aistudio.google.com](https://aistudio.google.com) |
| `DASHSCOPE_API_KEY`           | 通义千问 API Key（可选，用于餐食推荐 & 文案）        | [dashscope.console.aliyun.com](https://dashscope.console.aliyun.com) |
| `DEEPSEEK_API_KEY`            | DeepSeek API Key（上述二选一）                       | [platform.deepseek.com](https://platform.deepseek.com) |
| `NEXT_PUBLIC_SITE_URL`        | 本机 / 线上地址                                      | `http://localhost:3000` 或 Vercel 域名 |

### 3. 初始化 Supabase 数据库

1. 访问 [supabase.com](https://supabase.com) → New Project（区域选新加坡，中国访问快）
2. 控制台 → **SQL Editor** → 新建查询 → 粘贴 `supabase/schema.sql` 全文 → **RUN**
3. 控制台 → **Storage** → 分别创建三个 **私有** bucket：
   - `meal-photos`
   - `future-input`
   - `future-output`
4. 控制台 → **Authentication** → Providers → 打开 **Email OTP**（邮箱验证码）

### 4. 本地开发

```powershell
pnpm dev
```

浏览器访问 <http://localhost:3000>，用 **手机 Chrome 远程调试** 或
浏览器 DevTools → 切换设备模式为 iPhone / Android 查看手机效果。

### 5. 跑单元测试

```powershell
pnpm test
```

应该看到 `lib/calc.ts` 的 20+ 测试全部 PASS。

### 6. 部署到 Vercel

1. 把 `web/` 推到 GitHub 仓库
2. Vercel → New Project → Import Git Repository
3. **Root Directory** 设置为 `web`
4. 把 `.env.local` 里的每个变量在 Vercel → Settings → Environment Variables 中新建
5. Deploy。部署完成后会得到一个 `xxx.vercel.app` 的地址，手机扫码即可访问。

> 🇨🇳 **中国大陆可用性提示**：Vercel 默认域名在部分省份访问不稳定。
> 建议部署后 **绑定自有域名**（阿里云 / 腾讯云购入、在 Vercel 添加 CNAME），
> 并开启 Vercel 的 `Edge Middleware`；必要时再用 Cloudflare 中转。

---

## 目录结构

```
web/
├─ app/
│  ├─ page.tsx                    首页（今日卡路里仪表盘）
│  ├─ login/                      邮箱验证码登录
│  ├─ onboarding/                 新用户建档
│  ├─ workout/                    训练列表 / 新建 / 详情
│  ├─ meal/                       饮食列表 / 拍照识餐 / 手动录入
│  ├─ future/                     AI 未来身材预览
│  ├─ me/                         个人档案
│  ├─ api/
│  │  ├─ daily-target/            GET 返回 BMR/TDEE/宏量
│  │  ├─ recognize-food/          POST Gemini 识餐
│  │  ├─ recommend-meal/          POST 通义/DeepSeek 推荐餐
│  │  ├─ generate-future-photo/   POST 生成未来身材（加水印 + 限频）
│  │  ├─ workout-suggestion/      POST 渐进超负荷建议
│  │  ├─ daily-quote/             GET 每日一句
│  │  └─ logout/                  POST 退出登录
│  ├─ globals.css                 全局样式（手机端优先）
│  └─ layout.tsx                  根布局 + viewport
├─ components/
│  ├─ ui/                         shadcn 基础组件
│  ├─ Navbar.tsx                  底部 Tab 栏（iPhone 安全区适配）
│  ├─ Header.tsx                  顶部标题栏
│  ├─ KcalCard.tsx                今日卡路里大卡片
│  ├─ ProgressRing.tsx            SVG 进度环
│  ├─ FutureBodyCard.tsx          未来身材卡片
│  ├─ WorkoutCard.tsx             训练模板卡片
│  ├─ MealItem.tsx                饮食单条
│  └─ QuoteCard.tsx               鼓励语卡片
├─ lib/
│  ├─ calc.ts                     核心算法（BMR/TDEE/渐进超负荷/MET）
│  ├─ calc.test.ts                Vitest 单元测试
│  ├─ utils.ts                    cn / todayStr / fmt
│  └─ supabase/
│     ├─ client.ts                浏览器端 Supabase
│     ├─ server.ts                服务端 Supabase（含 Service Role）
│     └─ types.ts                 Database 类型
├─ supabase/
│  └─ schema.sql                  全部 DDL + RLS 策略 + 种子模板
├─ middleware.ts                  Supabase 会话刷新
├─ tailwind.config.ts             Tailwind + 品牌橙
├─ next.config.mjs
├─ package.json
└─ README.md                     （本文件）
```

---

## 手机端设计要点

1. **viewport 锁 1.0 + safe-area**：iOS 刘海屏完美适配，不会被双指缩放破坏布局。
2. **触控区 ≥ 44×44 px**：所有按钮和底部 Tab 都走 `tap-target` 类。
3. **输入框 16 px 字体**：防止 iOS Safari 聚焦时自动放大页面。
4. **原生 `<select>`**：直接调用 iOS/Android 系统滚轮选择器，体验最佳。
5. **拍照优先**：`<input capture="environment">` 在手机上直接调起相机，
   同时兼容微信内置浏览器。
6. **bottom-tab 固定**：底部 Tab 栏使用 `env(safe-area-inset-bottom)`
   避开 iPhone Home 指示器。
7. **中文字体栈**：优先使用 PingFang SC（iOS）/ Source Han Sans / 微软雅黑。
8. **PWA 清单**：`/manifest.webmanifest` 支持"添加到主屏幕"。

---

## 核心算法（lib/calc.ts）

| 函数                         | 说明                                                  |
|------------------------------|-------------------------------------------------------|
| `calcBMR(profile)`           | Mifflin-St Jeor 公式                                 |
| `calcTDEE(bmr, activity)`    | 活动系数 1.2~1.9                                     |
| `detectGoal(w, wTarget)`     | 基于目标体重差返回 cut/bulk/maintain                 |
| `calcDailyTarget(profile)`   | 完整管线 + 安全下限（男 1500 / 女 1200）             |
| `calcMacros(kcal, w, goal)`  | 蛋白 1.6-2.0 g/kg、脂肪 25-30%、其余碳水             |
| `calcBurnKcal(met, w, min)`  | MET 法消耗：`met × w × min / 60`                     |
| `estimateWorkoutBurn`        | 基于 sets/reps 的综合估算                            |
| `getProgression(lastSets, e, consecutiveZeroRir)` | 渐进超负荷：上肢 +1.25 kg / 下肢 +2.5 kg / 连续 2 次 RIR=0 提示 deload |
| `calcWeeklyScore`            | 每周打分 0-100                                        |

**安全提醒**：绝不能把每日热量算到安全下限以下；当 `deficit_adjusted=true`
时，前端必须提示用户"目标过于激进，已按安全下限调整"。

---

## 下一步（TODO 给你自己）

- [ ] 把 `public/` 下的 icon-192 / icon-512 / apple-touch-icon 换成你的品牌图
- [ ] 在 `/privacy` `/terms` 补充真实的隐私协议 & 用户协议（合规必需）
- [ ] 接入微信登录（需有 ICP 备案的公众号） —— 后置到 V1.0
- [ ] 统计埋点：Plausible 或自建 Supabase 表
- [ ] 每周报告：用 Vercel Cron 周日 20:00 调用一个 `/api/weekly-report`
- [ ] 中国 ICP 备案：绑定自有域名后，在阿里云 / 腾讯云发起备案

---

## 合规与安全

- **未成年保护**：未来身材功能强制勾选"已满 18 周岁"
- **图像处理**：所有生成图都加 AI 水印 "AI 生成参考图 · 非真实承诺"
- **存储策略**：原图与生成图存入 **私有** Supabase bucket，仅 2 小时签名 URL
- **限频**：每用户每 14 天限生成 1 张未来身材图
- **RLS**：所有表启用行级安全，只允许 `auth.uid() = user_id` 的用户读写
- **不存医疗建议**：所有计算结果只作健身参考，页脚标注"不构成医疗建议"

---

## 常见问题

**Q：微信里打开页面，`<input capture>` 不弹相机？**
A：微信内置浏览器需要走 `<input type="file" accept="image/*">`（不带 capture）
   会弹出"拍照 / 从相册选择"二选一，兼容性最好。

**Q：iPhone 上底部按钮被 Home Indicator 遮住？**
A：已用 `env(safe-area-inset-bottom)` 处理，如仍有问题检查 viewport 是否
   含 `viewport-fit=cover`（已在 `app/layout.tsx` 配）。

**Q：中国大陆访问 Vercel 速度慢？**
A：绑自有域名 + Cloudflare 中转；或把中国用户多的静态资源放到阿里云 OSS
   + CDN，动态 API 保留在 Vercel。

---

## License

MIT（仅代码部分）· 文档和产品设计归作者所有
