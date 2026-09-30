# Linux 安裝

## 方法 A：免安裝可攜版（最簡單，推薦）

1. 下載：https://github.com/lycryan90/hk-fin-pulse/releases  
   檔案名：`hk-fin-pulse-linux-x64.tar.gz`
2. 解壓到桌面（或任意資料夾）
3. 開終端：

```bash
cd ~/Desktop/hk-fin-pulse-linux-x64   # 路徑按你實際解壓位置改
chmod +x 開始.sh
./開始.sh
```

瀏覽器開 `http://127.0.0.1:3457`。  
**唔使** 預先裝 Node.js / npm。用完喺終端撳 `Ctrl+C` 停止。

## 方法 B：原始碼一鍵裝（會裝 Node）

已經下載咗 ZIP／USB：

```bash
cd ~/Desktop/hk-fin-pulse-main/hk-fin-pulse-main   # 按實際路徑
bash setup.sh
```

有網絡一鍵：

```bash
curl -fsSL https://cdn.jsdelivr.net/gh/lycryan90/hk-fin-pulse@main/setup.sh | bash
```

然後：

```bash
source ~/.bashrc
source ~/.nvm/nvm.sh   # 若用咗 nvm
hk-fin-pulse
# 或：~/hk-fin-pulse/bin/hk-fin-pulse
```

## 卸載（方法 B）

```bash
bash ~/hk-fin-pulse/install/linux/uninstall.sh
```

可攜版（方法 A）只需刪解壓出來嗰個資料夾。
