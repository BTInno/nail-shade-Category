# 项目需求文档 — Nail Shape（甲型）Collection 筛选

版本: 0.1.0
日期: 2026-05-05

## 概要
为 Shopify 店铺实现一个 App Extension（Theme App Extension — App Block），在 Collection 页面顶部展示“甲型（nail shape）”选择 UI（图标 + 文本），用户点击后筛选出该甲型的产品。分类数据来源为 Product 的 metafield `shopify.nail_shape`（single_select），商家通过 Shopify 后台为产品设置该 metafield（已存在）。

## 目标
- 在用户安装 App 后，使商家能够在 theme editor 中将 `Nail Shape Filter` block 放到 collection 模板顶部并立即展示筛选 UI。
- 点击任一甲型按钮后，collection 页面仅显示该甲型的产品；支持将所选状态写入 URL（例如 `?nail_shape=almond`）以便分享。
- 最小化对现有主题的侵入性，优先使用 Liquid 输出 `data-nail-shape` 到产品卡以便客户端快速过滤。

## 范围（Scope）
- 包含：Theme App Extension (App Block + assets)、前端 widget（JS/CSS）、迁移脚本（CSV 模板 + Node 脚手架）、说明文档。
- 不包含：复杂后台管理界面（mini 管理功能暂不实现，使用 Shopify Admin 管理 metafield）、多店铺发布流程与 Shopify 审核提交（这属于部署/发布步骤）。

## 功能性需求

1. Metafield
   - 标识：`shopify.nail_shape`
   - 所有者：Product
   - 类型：`single_select`（枚举）
   - 预定义选项（内部值 / 显示名）:
     - `super_short` / SUPER SHORT
     - `oval` / OVAL
     - `almond` / ALMOND
     - `squoval` / SQUOVAL
     - `round` / ROUND
     - `coffin` / COFFIN

2. Theme App Extension（App Block）
   - Block 名称：`Nail Shape Filter`
   - Block 输出：一个容器 DOM，用于渲染图标 + 文字按钮行；加载 `filter-widget.js` 与 `filter-widget.css` 资源。
   - Merchant 操作：安装 App → Theme Editor → 在 collection 模板中放置 Block。

3. 前端行为（filter-widget）
   - 渲染：显示每个甲型的图标（可选）与显示名为按钮。
   - 点击：选择某一甲型后，页面隐藏不匹配产品（基于 `data-nail-shape` 属性），并更新浏览器地址栏 querystring `nail_shape`；取消选择移除该参数并恢复显示。
   - 初次加载：若 URL 包含 `nail_shape` 参数则自动应用过滤并高亮对应按钮。
   - 无 metatfield 输出回退：若产品 DOM 未输出 `data-nail-shape`，widget 将保持原样（后续可增强为调用 Storefront API 或后端代理查询）。

4. 主题集成规范（建议）
   - 在 product card 模板里輸出 metafield 到 DOM，例如：
     `<div class="product-card" data-product-id="{{ product.id }}" data-nail-shape="{{ product.metafields.shopify.nail_shape }}">`。
   - 该做法避免客户端额外请求，提高性能与兼容性。

5. 迁移/填充
   - 提供 CSV 模板與 `scripts/migrate-nail-shape.js`（dry-run），用於批量寫入 metafield（商家或開發者在本地運行）。

## 非功能性需求
- 可訪問性（a11y）：按鈕應可鍵盤訪問、使用 ARIA 屬性（aria-pressed）；視覺高對比度。  
- 性能：避免在客戶端一次性請求大量產品資料；推薦 Liquid 輸出以本地過濾。  
- 相容性：支持主流 Online Store 2.0 主題；樣式使用命名空間避免全局衝突。  
- 安全：不在公共位置暴露 Admin API token；所有寫入操作需在受信任環境下執行。

## API 與權限
- Admin API scopes（當需要自動創建/寫入 metafield 時）: `read_products`, `write_products`, `read_product_metafields`, `write_product_metafields`。
- Storefront API：若前端需直接查詢 metafields，需提供 Storefront access token 或通過後端代理返回資料以避免泄露敏感憑證。

## 測試計劃
- 單元測試：JS 中的過濾邏輯與 URL 操作函數。  
- 集成測試：在開發店鋪中，放置 Block 並驗證點擊按鈕後產品過濾正確；測試 URL 參數的應用與取消。  
- 手動測試：在兩款不同主題與移動端環境進行視覺檢查與交互測試。

## 驗收標準
1. 在安裝 App 並將 Block 放置於 collection 頂部後，頁面顯示甲型選擇 UI（圖標 + 文本）。
2. 點擊某甲型後，頁面僅顯示對應 `shopify.nail_shape` 的產品（基於 DOM 輸出）。
3. 選擇後 URL 更新為 `?nail_shape=<value>`，刷新頁面仍保持過濾狀態。  
4. 提供 CSV 模板與遷移腳本，能為示例產品生成寫入命令（dry-run），並在開發者確認後執行寫入。  

## 部署與安裝說明（概要）
1. 開發者/商家在 Shopify Admin 中啟用開發應用或安裝 App。  
2. 在 Theme Editor 中把 `Nail Shape Filter` block 拖入 collection 模板頂部並保存。  
3. 確保 product card 模板輸出 `data-nail-shape`（或使用後端代理在運行時填充）。  
4. 若需批量寫入，使用 CSV + `scripts/migrate-nail-shape.js`（按文檔設置 `SHOP_NAME` 與 `SHOPIFY_ADMIN_TOKEN` 在本地運行）。

## 交付物
- `extensions/theme/` App Block 源碼與 assets（JS/CSS）。
- `scripts/create-metafield.js`（metafield 定義生成/預覽）。
- `scripts/migrate-nail-shape.js` 與 `scripts/nail-shape-sample.csv`。  
- `docs/requirements.md`（本文件）與 README 中的安裝/運行說明。

---
如需我把文檔的語言/格式調整為產品規格書（PRD）或把其導出為 PDF 以便分享給團隊，請告訴我具體格式要求。 
