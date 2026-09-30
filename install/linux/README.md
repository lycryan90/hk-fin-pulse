# Linux 安裝（最簡單）

## 方法 A：已經下載咗 ZIP／USB（推薦）

入去解壓後嘅資料夾，打一行：

```bash
bash setup.sh
```

完成後：

```bash
hk-fin-pulse
```

瀏覽器開 `http://127.0.0.1:3457`。

`setup.sh` 會自動：裝 Node（用 nvm，多數情況唔使 sudo）→ `npm install` → build → 加啟動指令。

## 方法 B：有網絡，一鍵（連下載）

```bash
curl -fsSL https://raw.githubusercontent.com/lycryan90/hk-fin-pulse/main/setup.sh | bash
```

## 卸載

```bash
bash ~/hk-fin-pulse/install/linux/uninstall.sh
```

## 進階選項

```bash
PORT=3457 WITH_CRON=yes INSTALL_DIR=$HOME/apps/hk-fin-pulse bash setup.sh
```
