# 东京十月手帐 · 部署说明

这个文件夹就是一个完整的网站：`public/index.html` 是页面（单文件、零外部依赖、离线也能打开），
`wrangler.jsonc` 告诉 Cloudflare Workers 把 `public/` 当静态网站发布。

## 你需要亲手做的步骤（只做一次）

标【电脑】的必须在电脑上做，其余手机也行。

1. 【电脑】注册 / 登录 GitHub，新建一个仓库（建议设为 Private），名字随意，例如 `tokyo-trip`。
2. 【电脑】把这个文件夹里的 `public/`、`wrangler.jsonc`、`README.md` 上传到仓库根目录
   （网页上点 “Add file → Upload files” 拖进去即可，不需要装 git）。
3. 【电脑】注册 / 登录 Cloudflare → Workers & Pages → Create → Import a repository，
   授权 GitHub 并选中这个仓库。构建设置保持默认：Build command 留空，Deploy command 为 `npx wrangler deploy`。
4. 点 Deploy。完成后得到网址：`https://tokyo-oct-k7q2.<你的子域>.workers.dev`。
   名字故意起得不好猜；如果想换，改 `wrangler.jsonc` 里的 `name`。
5. 手机上打开这个网址，Safari 点「分享 → 添加到主屏幕」，之后像 App 一样打开。

## 之后怎么更新

让 Claude 改页面后，它会把新的 `public/index.html` 写进这个文件夹；
你在 GitHub 仓库里重新上传覆盖这个文件（或用 git push），Cloudflare 会自动重新发布，约 1 分钟生效。

## 隐私

公开网址任何拿到链接的人都能看到你住哪家酒店、每天几点在哪。页面里没有确认号、证件号和房间号；
`robots.txt` 和 `noindex` 已禁止搜索引擎收录。只把链接发给需要的人。
