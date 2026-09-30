# Linux 安裝

需要：Node.js 18+（建議 20/22）、npm、git（遠端安裝時）。

## 一鍵安裝（有 git）

```bash
curl -fsSL https://raw.githubusercontent.com/lycryan90/hk-fin-pulse/main/install/linux/install.sh | bash
```

或手動 clone 後就地安裝（腳本偵測到本 repo 會裝喺當前目錄）：

```bash
git clone https://github.com/lycryan90/hk-fin-pulse.git ~/hk-fin-pulse
cd ~/hk-fin-pulse
bash install/linux/install.sh
```

## 啟動

```bash
hk-fin-pulse
# 瀏覽器開 http://127.0.0.1:3457
```

首次請開 **設定** 頁填 LLM API Key，或本地 Ollama：

- Base URL: `http://127.0.0.1:11434/v1`
- Key: `ollama`
- Model: 你本機模型名

## 卸載

```bash
bash ~/hk-fin-pulse/install/linux/uninstall.sh
```

## 環境變數（可選）

```bash
INSTALL_DIR=$HOME/apps/hk-fin-pulse \
REPO_URL=https://github.com/lycryan90/hk-fin-pulse.git \
PORT=3457 \
WITH_CRON=yes \
bash install/linux/install.sh
```
