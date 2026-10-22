<div align="center">

<img src="avenlet.png" width="96" height="96" alt="Avenlet 图标">

# Avenlet

**日常工作的 Windows 本地工具箱**

常用工具放在同一个工作区：连上手机浏览、采集、投屏，解析 SQLite、MMKV、Plist、Protobuf，<br>
还有 JSON、哈希、HTTP 等日常工具。数据在你的电脑上处理，不上传，免费使用。

**[下载最新版](https://github.com/xiaoxu123195/avenlet-releases/releases/latest)** · [用户许可协议](LICENSE) · [全部版本与更新说明](https://github.com/xiaoxu123195/avenlet-releases/releases)

</div>

本仓库只放 Avenlet 的安装包和更新文件，不含源码。

## 能做什么

| 分类       | 工具                                                       |
| ---------- | ---------------------------------------------------------- |
| 设备与取证 | 移动取证、真机数据浏览器、Android 与 iPhone 投屏、包名搜索 |
| 数据解析   | SQLite 搜索、MMKV 解析器、Plist 解析器、Protobuf 编解码    |
| 日常工具   | JSON 编辑器、文件哈希、HTTP 调试                           |

## 下载与安装

1. 打开 [最新版](https://github.com/xiaoxu123195/avenlet-releases/releases/latest)，在 Assets 里下载 `Avenlet_<版本>_x64-setup.exe`。
2. 运行安装包。安装到当前用户目录，不需要管理员权限。
3. 安装包暂未做数字签名，Windows 可能提示「Windows 已保护你的电脑」，点「更多信息」→「仍要运行」。

**系统要求**：Windows 10 / 11，64 位。需要 Microsoft Edge WebView2 运行时：Windows 11 自带，缺少时安装程序会联网安装。

**核对安装包**（可选）：在 PowerShell 里运行下面的命令，得到的值应和发布页上写的 SHA-256 一致。

```powershell
Get-FileHash "$env:USERPROFILE\Downloads\Avenlet_<版本>_x64-setup.exe"
```

`latest.json` 和 `.sig` 是程序自动更新用的，不用下载。

## 升级与卸载

- **升级**：直接运行新版本的安装包，设置、草稿、收藏和保存的密码都会保留。不能用旧版本覆盖新版本。
- **安装或卸载前**：先从托盘菜单选「退出」，等 Avenlet 保存好草稿。
- **卸载**：在 Windows「设置 → 应用」里卸载。只有勾选了删除应用数据，才会清掉设置和草稿。

## 数据与隐私

Avenlet 不收集、不上传任何数据，也没有使用统计或崩溃报告。只有在 HTTP 调试里发请求、用包名搜索查询应用市场时才会联网，数据直接发往你指定的地址或相应的应用市场。

## 许可与联系

- Avenlet 免费使用，按 [用户许可协议](LICENSE) 授权。个人和单位都可以用，包括在工作中使用；可以原样转发官方安装包，但不得修改、捆绑或收费。
- 使用设备与数据相关的功能时，只能用于自己的设备，或已获得明确授权的设备和数据。
- 程序使用的第三方开源组件及其许可，见安装目录 `legal` 文件夹，或程序里的「设置 › 关于」。

问题与建议：cherrytump@gmail.com
