1. 安裝 Node.js

官方下載網址：https://nodejs.org/en/download

安裝完成後，重新開啟 VS Code，進入 Terminal執行以下指令確認是否安裝成功：

node -v
npm -v

如果成功，終端機會顯示 Node.js 和 npm 的版本號。

2. 安裝 Angular CLI 並建立前端專案

官方網站：https://angular.dev/tools/cli

安裝 Angular CLI

確認 Node.js 和 npm 可以正常使用後，執行：

npm install -g @angular/cli

確認 Angular CLI 是否安裝成功：

ng version

建立 Angular 專案

在專案根目錄 D:\MyExpenseTracker 執行：

ng new frontend

依照終端機提示完成設定。

建立完成後，進入前端資料夾：

cd frontend

啟動 Angular 開發伺服器：

ng serve


在瀏覽器開啟：

http://localhost:4200

如果看到 Angular 網頁，代表前端已成功啟動。

3. 安裝 .NET SDK 並建立 C# 後端

.NET SDK 用來建立、編譯和執行 C# 程式，以及開發 ASP.NET Core Web API。

官方下載網址：https://dotnet.microsoft.com/en-us/download
建議版本：.NET 10 LTS
Windows 一般 Intel / AMD 電腦通常選擇 x64 SDK Installer。
確認是否安裝成功

安裝完成後，重新開啟 VS Code，執行：

dotnet --version

如果成功，終端機會顯示 .NET SDK 版本號。

也可以查看已安裝的 SDK：

dotnet --list-sdks
建立 ASP.NET Core Web API

在專案根目錄 D:\MyExpenseTracker 執行：

dotnet new webapi -o backend

進入後端資料夾：

cd backend

執行後端：

dotnet run

終端機會顯示實際啟動網址。使用該網址測試 API；若專案有啟用 Swagger，也可以開啟終端機顯示的 Swagger 網址進行測試。

4. 安裝與設定 Oracle Database

Oracle Database 用來儲存記賬網站的收入、支出、日期、類別和備註等資料。

Oracle Database 官方網站：https://www.oracle.com/database/
Oracle Database Free：https://www.oracle.com/database/free/

安裝完成後，可以使用 Oracle SQL Developer 管理資料庫及執行 SQL。

Oracle SQL Developer 官方下載網址：

https://www.oracle.com/database/sqldeveloper/

後續設定步驟：

安裝 Oracle Database。
建立或確認可用的資料庫使用者。
使用 SQL Developer 連線資料庫。
建立記賬網站需要的資料表。
設定 C# ASP.NET Core Web API 連接 Oracle。
5. 專案資料夾結構

預計專案結構如下：

MyExpenseTracker/
├── frontend/          # Angular 前端
├── backend/           # C# ASP.NET Core Web API
└── database/          # Oracle SQL 腳本與資料庫相關檔案

frontend 和 backend 會由專案建立指令自動產生。database 可以在開始整理 SQL 腳本時再建立。

6. 技術架構
Frontend: Angular, TypeScript, HTML, CSS
Backend: C#, ASP.NET Core Web API
Database: Oracle Database
Database Client: Oracle SQL Developer
Development Environment: Visual Studio Code
7. 開發順序
安裝 Node.js 並確認 npm 正常。
安裝 Angular CLI，建立並啟動前端。
安裝 .NET SDK，建立並啟動後端 API。
安裝 Oracle Database，建立資料表。
設定 C# 後端連接 Oracle。
讓 Angular 呼叫後端 API。
實作新增、查詢、修改、刪除記賬紀錄（CRUD）。
加入收入支出統計、篩選及圖表功能。