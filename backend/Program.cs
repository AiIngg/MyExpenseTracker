
using System.Data;
using Oracle.ManagedDataAccess.Client;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddAuthorization();


// 註冊 CORS（Cross-Origin Resource Sharing）設定
builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularDev", policy =>
    {
        policy.WithOrigins("http://localhost:4300")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});


var app = builder.Build();

app.UseHttpsRedirection();

app.UseRouting();

app.UseCors("AngularDev");

app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// -------------------------------------------------------------------------
// GET(CATEGORIES): 讀取所有類別
// -------------------------------------------------------------------------

app.MapGet("/api/categories", async (
    IConfiguration configuration) =>
{
    var connectionString =
        configuration.GetConnectionString("OracleDb");

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        return Results.Problem(
            "Oracle connection string is not configured.");
    }

    await using var connection =
        new OracleConnection(connectionString);

    await connection.OpenAsync();

    const string sql = @"
        SELECT ID, NAME, TYPE
        FROM CATEGORIES
        ORDER BY ID";

    await using var command =
        new OracleCommand(sql, connection);

    await using var reader =
        await command.ExecuteReaderAsync();

    var categories = new List<object>();

    while (await reader.ReadAsync())
    {
        categories.Add(new
        {
            id = Convert.ToInt32(reader.GetValue(0)),
            name = reader.GetString(1),
            type = reader.GetString(2)
        });
    }

    return Results.Ok(categories);
});


 // -------------------------------------------------------------------------
 // POST(CATEGORIES): 新增類別
 // -------------------------------------------------------------------------

app.MapPost("/api/categories", async (
    CategoryRequest request,
    IConfiguration configuration) =>
{
    // 1. 驗證類別名稱
    if (string.IsNullOrWhiteSpace(request.Name))
    {
        return Results.BadRequest(new
        {
            message = "Category name is required."
        });
    }

    // 2. 驗證類別類型
    var type = request.Type.Trim();

    if (type != "Income" && type != "Expense")
    {
        return Results.BadRequest(new
        {
            message = "Type must be INCOME or EXPENSE."
        });
    }

    // 3. 取得 Oracle 連線設定
    var connectionString =
        configuration.GetConnectionString("OracleDb");

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        return Results.Problem(
            "Oracle connection string is not configured."
        );
    }

    // 4. 連接 Oracle
    await using var connection =
        new OracleConnection(connectionString);

    await connection.OpenAsync();

    // 5. 新增類別並取得自動產生的 ID
    const string sql = @"
        INSERT INTO CATEGORIES (NAME, TYPE)
        VALUES (:name, :type)
        RETURNING ID INTO :newId";

    await using var command =
        new OracleCommand(sql, connection);

    command.BindByName = true;

    command.Parameters.Add(
        "name",
        OracleDbType.Varchar2
    ).Value = request.Name.Trim();

    command.Parameters.Add(
        "type",
        OracleDbType.Varchar2
    ).Value = type;

    var idParameter = new OracleParameter(
        "newId",
        OracleDbType.Int32
    )
    {
        Direction = ParameterDirection.Output
    };

    command.Parameters.Add(idParameter);

    await command.ExecuteNonQueryAsync();

    var newId = Convert.ToInt32(
        ((Oracle.ManagedDataAccess.Types.OracleDecimal)
            idParameter.Value).Value
    );

    // 6. 回傳新增結果
    return Results.Created(
        $"/api/categories/{newId}",
        new
        {
            id = newId,
            name = request.Name.Trim(),
            type
        }
    );
});



// -------------------------------------------------------------------------
// GET(TRANSACTION): 讀取所有交易
// -------------------------------------------------------------------------

app.MapGet("/api/transactions", async (IConfiguration configuration) =>
{
    // 從 User Secrets 取得 Oracle 連線設定
    var connectionString =
        configuration.GetConnectionString("OracleDb");

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        return Results.Problem(
            "Oracle connection string is not configured."
        );
    }

    var transactions = new List<object>();

    // 建立 Oracle 資料庫連線
    await using var connection =
        new OracleConnection(connectionString);

    await connection.OpenAsync();

    // 查詢 EXPENSES 資料表
    const string sql = @"
        SELECT
            ID,
            AMOUNT,
            DESCRIPTION,
            EXPENSE_DATE,
            CATEGORY_ID,
            PAYMENT_METHOD
        FROM EXPENSES
        ORDER BY EXPENSE_DATE DESC, ID DESC";

    await using var command =
        new OracleCommand(sql, connection);

    await using var reader =
        await command.ExecuteReaderAsync();

    // 逐筆讀取查詢結果
    while (await reader.ReadAsync())
    {
        transactions.Add(new
        {
            id = Convert.ToInt32(reader.GetValue(0)),

            amount = Convert.ToDecimal(reader.GetValue(1)),

            description = reader.IsDBNull(2)
                ? null
                : reader.GetString(2),

            date = reader.GetDateTime(3)
                .ToString("yyyy-MM-dd"),

            categoryId = reader.IsDBNull(4)
                ? (int?)null
                : Convert.ToInt32(reader.GetValue(4)),

            paymentMethodId = reader.IsDBNull(5)
                ? (int?)null
                : Convert.ToInt32(reader.GetValue(5))
        });
    }

    return Results.Ok(transactions);
});




 // -------------------------------------------------------------------------
 // GET(DEBTS): 讀取所有債務紀錄
 // -------------------------------------------------------------------------

app.MapGet("/api/debts", async (IConfiguration configuration) =>
{
    // 1. 取得 Oracle 連線設定
    var connectionString =
        configuration.GetConnectionString("OracleDb");

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        return Results.Problem(
            "Oracle connection string is not configured."
        );
    }

    var debts = new List<object>();

    // 2. 建立資料庫連線
    await using var connection =
        new OracleConnection(connectionString);

    await connection.OpenAsync();

    // 3. JOIN 兩張資料表，取得債務及欠款人姓名
    const string sql = @"
        SELECT
            d.ID,
            d.DEBTOR_ID,
            dr.NAME,
            d.DEBT_TYPE,
            d.AMOUNT,
            d.DEBT_DATE,
            d.DESCRIPTION,
            d.STATUS
        FROM DEBTS d
        LEFT JOIN DEBTORS dr
            ON d.DEBTOR_ID = dr.ID
        ORDER BY d.DEBT_DATE DESC, d.ID DESC";

    await using var command =
        new OracleCommand(sql, connection);

    await using var reader =
        await command.ExecuteReaderAsync();

    // 4. 逐筆讀取資料
    while (await reader.ReadAsync())
    {
        debts.Add(new
        {
            id = Convert.ToInt32(reader.GetValue(0)),

            debtorId = Convert.ToInt32(reader.GetValue(1)),

            debtorName = reader.IsDBNull(2)
                ? null
                : reader.GetString(2),

            debtType = reader.GetString(3),

            amount = Convert.ToDecimal(reader.GetValue(4)),

            date = reader.IsDBNull(5)
                ? (string?)null
                : reader.GetDateTime(5).ToString("yyyy-MM-dd"),

            description = reader.IsDBNull(6)
                ? null
                : reader.GetString(6),


            status = reader.GetString(reader.GetOrdinal("STATUS"))
        });
    }

    // 5. 回傳 JSON 給前端
    return Results.Ok(debts);
});



// -------------------------------------------------------------------------
// PUT(DEBTS)
// -------------------------------------------------------------------------

app.MapPut("/api/debts/{id:int}/status", async (
    int id,
    DebtStatusRequest request,
    IConfiguration configuration) =>
{
    if (id <= 0)
    {
        return Results.BadRequest(new { message = "Invalid debt ID." });
    }

    if (request.Status != "PAID" && request.Status != "RECEIVED")
    {
        return Results.BadRequest(
            new { message = "Status must be PAID or RECEIVED." }
        );
    }

    var connectionString =
        configuration.GetConnectionString("OracleDb");

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        return Results.Problem(
            "Oracle connection string is not configured."
        );
    }

    await using var connection =
        new OracleConnection(connectionString);

    await connection.OpenAsync();

    const string sql = @"
        UPDATE DEBTS
        SET STATUS = :status
        WHERE ID = :id";

    await using var command =
        new OracleCommand(sql, connection);

    command.BindByName = true;

    command.Parameters.Add("status", OracleDbType.Varchar2)
        .Value = request.Status;

    command.Parameters.Add("id", OracleDbType.Int32)
        .Value = id;

    var rowsAffected = await command.ExecuteNonQueryAsync();

    if (rowsAffected == 0)
    {
        return Results.NotFound(
            new { message = $"Debt with ID {id} was not found." }
        );
    }

    return Results.Ok(new
    {
        id,
        status = request.Status,
        message = "Debt status updated successfully."
    });
});



// -------------------------------------------------------------------------
// GET(DEBTORS): Add Debt Button - 讀取所有欠款人
// -------------------------------------------------------------------------

app.MapGet("/api/debtors", async (IConfiguration configuration) =>
{
    var connectionString =
        configuration.GetConnectionString("OracleDb");

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        return Results.Problem(
            "Oracle connection string is not configured.");
    }

    var debtors = new List<object>();

    await using var connection =
        new OracleConnection(connectionString);

    await connection.OpenAsync();

    const string sql = @"
        SELECT ID, NAME
        FROM DEBTORS
        ORDER BY NAME";

    await using var command =
        new OracleCommand(sql, connection);

    await using var reader =
        await command.ExecuteReaderAsync();

    while (await reader.ReadAsync())
    {
        debtors.Add(new
        {
            id = Convert.ToInt32(reader.GetValue(0)),
            name = reader.GetString(1)
        });
    }

    return Results.Ok(debtors);
});


// -------------------------------------------------------------------------
// POST(DEBTORS): 新增欠款人
// -------------------------------------------------------------------------

app.MapPost("/api/debtors", async (
    DebtorRequest request,
    IConfiguration configuration) =>
{
    if (string.IsNullOrWhiteSpace(request.Name))
    {
        return Results.BadRequest("Name is required.");
    }

    var connectionString =
        configuration.GetConnectionString("OracleDb");

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        return Results.Problem(
            "Oracle connection string is not configured.");
    }

    await using var connection =
        new OracleConnection(connectionString);

    await connection.OpenAsync();

    const string sql = @"
        INSERT INTO DEBTORS (NAME)
        VALUES (:Name)
        RETURNING ID INTO :Id";

    await using var command =
        new OracleCommand(sql, connection);

    command.Parameters.Add(
        "Name",
        OracleDbType.Varchar2
    ).Value = request.Name.Trim();

    var idParameter = new OracleParameter(
        "Id",
        OracleDbType.Int32
    )
    {
        Direction = System.Data.ParameterDirection.Output
    };

    command.Parameters.Add(idParameter);

    await command.ExecuteNonQueryAsync();

    return Results.Ok(new
    {
        id = Convert.ToInt32(idParameter.Value.ToString()),
        name = request.Name.Trim()
    });
});







// -------------------------------------------------------------------------
// POST(TRANSACTION): 新增一筆交易
// -------------------------------------------------------------------------

app.MapPost("/api/transactions", async (
    TransactionRequest request,
    IConfiguration configuration) =>
{
    // 檢查輸入資料
    if (request.Amount <= 0)
    {
        return Results.BadRequest(new
        {
            message = "Amount must be greater than zero."
        });
    }

    if (request.Date == default)
    {
        return Results.BadRequest(new
        {
            message = "Date is required."
        });
    }

    if (request.Description?.Length > 200)
    {
        return Results.BadRequest(new
        {
            message = "Description cannot exceed 200 characters."
        });
    }

    var connectionString =
        configuration.GetConnectionString("OracleDb");

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        return Results.Problem(
            "Oracle connection string is not configured."
        );
    }

    await using var connection =
        new OracleConnection(connectionString);

    await connection.OpenAsync();

    const string sql = @"
        INSERT INTO EXPENSES (
            AMOUNT,
            DESCRIPTION,
            EXPENSE_DATE,
            CATEGORY_ID,
            PAYMENT_METHOD
        )
        VALUES (
            :amount,
            :description,
            :expenseDate,
            :categoryId,
            :paymentMethod
        )
        RETURNING ID INTO :newId";

    await using var command =
        new OracleCommand(sql, connection);

    command.BindByName = true;

    command.Parameters.Add(
        "amount",
        OracleDbType.Decimal
    ).Value = request.Amount;

    command.Parameters.Add(
        "description",
        OracleDbType.Varchar2
    ).Value = (object?)request.Description ?? DBNull.Value;

    command.Parameters.Add(
        "expenseDate",
        OracleDbType.Date
    ).Value = request.Date;

    command.Parameters.Add(
        "categoryId",
        OracleDbType.Int32
    ).Value = (object?)request.CategoryId ?? DBNull.Value;

    command.Parameters.Add(
        "paymentMethod",
        OracleDbType.Int32
    ).Value = (object?)request.PaymentMethodId ?? DBNull.Value;

    var idParameter = new OracleParameter(
        "newId",
        OracleDbType.Int32
    )
    {
        Direction = ParameterDirection.Output
    };

    command.Parameters.Add(idParameter);

 
    await command.ExecuteNonQueryAsync();


    // 將資料庫的 int 轉換成 C# 的 int
    var newId = Convert.ToInt32(
        ((Oracle.ManagedDataAccess.Types.OracleDecimal)
            idParameter.Value).Value
    );

    return Results.Created(
        $"/api/transactions/{newId}",
        new
        {
            id = newId,
            amount = request.Amount,
            description = request.Description,
            date = request.Date.ToString("yyyy-MM-dd"),
            categoryId = request.CategoryId,
            paymentMethodId = request.PaymentMethodId
        }
    );
});


// -------------------------------------------------------------------------
// PUT(TRANSACTION): 更新指定交易
// -------------------------------------------------------------------------

app.MapPut("/api/transactions/{id:int}", async (
    int id,
    TransactionRequest request,
    IConfiguration configuration) =>
{
    // 1. 檢查輸入資料
    if (id <= 0)
    {
        return Results.BadRequest(new
        {
            message = "Invalid transaction ID."
        });
    }

    if (request.Amount <= 0)
    {
        return Results.BadRequest(new
        {
            message = "Amount must be greater than zero."
        });
    }

    if (request.Date == default)
    {
        return Results.BadRequest(new
        {
            message = "Date is required."
        });
    }

    if (request.Description?.Length > 200)
    {
        return Results.BadRequest(new
        {
            message = "Description cannot exceed 200 characters."
        });
    }

    // 2. 取得 Oracle 連線設定
    var connectionString =
        configuration.GetConnectionString("OracleDb");

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        return Results.Problem(
            "Oracle connection string is not configured."
        );
    }

    // 3. 連接 Oracle
    await using var connection =
        new OracleConnection(connectionString);

    await connection.OpenAsync();

    // 4. 更新指定 ID 的交易
    const string sql = @"
        UPDATE EXPENSES
        SET
            AMOUNT = :amount,
            DESCRIPTION = :description,
            EXPENSE_DATE = :expenseDate,
            CATEGORY_ID = :categoryId,
            PAYMENT_METHOD = :paymentMethod
        WHERE ID = :id";

    await using var command =
        new OracleCommand(sql, connection);

    command.BindByName = true;

    command.Parameters.Add(
        "amount",
        OracleDbType.Decimal
    ).Value = request.Amount;

    command.Parameters.Add(
        "description",
        OracleDbType.Varchar2
    ).Value = (object?)request.Description ?? DBNull.Value;

    command.Parameters.Add(
        "expenseDate",
        OracleDbType.Date
    ).Value = request.Date;

    command.Parameters.Add(
        "categoryId",
        OracleDbType.Int32
    ).Value = (object?)request.CategoryId ?? DBNull.Value;

    command.Parameters.Add(
        "paymentMethod",
        OracleDbType.Int32
    ).Value = (object?)request.PaymentMethodId ?? DBNull.Value;

    command.Parameters.Add(
        "id",
        OracleDbType.Int32
    ).Value = id;

    // 5. 執行更新
    var rowsAffected = await command.ExecuteNonQueryAsync();

    // 6. 如果找不到指定的交易
    if (rowsAffected == 0)
    {
        return Results.NotFound(new
        {
            message = $"Transaction with ID {id} was not found."
        });
    }

    // 7. 回傳更新結果
    return Results.Ok(new
    {
        id,
        amount = request.Amount,
        description = request.Description,
        date = request.Date.ToString("yyyy-MM-dd"),
        categoryId = request.CategoryId,
        paymentMethodId = request.PaymentMethodId
    });
});


// -------------------------------------------------------------------------
 // DELETE(TRANSACTION): 刪除指定交易
// -------------------------------------------------------------------------

app.MapDelete("/api/transactions/{id:int}", async (
    int id,
    IConfiguration configuration) =>
{
    // 1. 檢查交易 ID
    if (id <= 0)
    {
        return Results.BadRequest(new
        {
            message = "Invalid transaction ID."
        });
    }

    // 2. 取得 Oracle 連線設定
    var connectionString =
        configuration.GetConnectionString("OracleDb");

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        return Results.Problem(
            "Oracle connection string is not configured."
        );
    }

    // 3. 連接 Oracle
    await using var connection =
        new OracleConnection(connectionString);

    await connection.OpenAsync();

    // 4. 刪除指定 ID 的交易
    const string sql = @"
        DELETE FROM EXPENSES
        WHERE ID = :id";

    await using var command =
        new OracleCommand(sql, connection);

    command.BindByName = true;

    command.Parameters.Add(
        "id",
        OracleDbType.Int32
    ).Value = id;

    // 5. 執行刪除
    var rowsAffected = await command.ExecuteNonQueryAsync();

    // 6. 找不到指定的交易
    if (rowsAffected == 0)
    {
        return Results.NotFound(new
        {
            message = $"Transaction with ID {id} was not found."
        });
    }

    // 7. 回傳刪除成功訊息
    return Results.Ok(new
    {
        message = $"Transaction {id} deleted successfully.",
        id
    });
});


// -------------------------------------------------------------------------
 // POST(DEBTS): 新增一筆債務
// ------------------------------------------------------------------------

app.MapPost("/api/debts", async (
    DebtRequest request,
    IConfiguration configuration) =>
{
    // 1. 驗證資料
    if (request.DebtorId <= 0)
    {
        return Results.BadRequest(new
        {
            message = "Please select a person."
        });
    }

    if (request.DebtType != "I_OWE" &&
        request.DebtType != "OWED_TO_ME")
    {
        return Results.BadRequest(new
        {
            message = "Invalid debt type."
        });
    }

    if (request.Amount <= 0)
    {
        return Results.BadRequest(new
        {
            message = "Amount must be greater than zero."
        });
    }

    if (request.Date == default)
    {
        return Results.BadRequest(new
        {
            message = "Date is required."
        });
    }

    // 2. 取得 Oracle 連線設定
    var connectionString =
        configuration.GetConnectionString("OracleDb");

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        return Results.Problem(
            "Oracle connection string is not configured."
        );
    }

    // 3. 連接 Oracle
    await using var connection =
        new OracleConnection(connectionString);

    await connection.OpenAsync();

    // 4. 新增債務
    const string sql = @"
        INSERT INTO DEBTS (
            DEBTOR_ID,
            DEBT_TYPE,
            AMOUNT,
            DEBT_DATE,
            DESCRIPTION
        )
        VALUES (
            :debtorId,
            :debtType,
            :amount,
            :debtDate,
            :description
        )
        RETURNING ID INTO :newId";

    await using var command =
        new OracleCommand(sql, connection);

    command.BindByName = true;

    command.Parameters.Add(
        "debtorId",
        OracleDbType.Int32
    ).Value = request.DebtorId;

    command.Parameters.Add(
        "debtType",
        OracleDbType.Varchar2
    ).Value = request.DebtType;

    command.Parameters.Add(
        "amount",
        OracleDbType.Decimal
    ).Value = request.Amount;

    command.Parameters.Add(
        "debtDate",
        OracleDbType.Date
    ).Value = request.Date;

    command.Parameters.Add(
        "description",
        OracleDbType.Varchar2
    ).Value = (object?)request.Description
        ?? DBNull.Value;

    var idParameter = new OracleParameter(
        "newId",
        OracleDbType.Decimal
    )
    {
        Direction = ParameterDirection.Output
    };

    command.Parameters.Add(idParameter);

    await command.ExecuteNonQueryAsync();

    var newId = Convert.ToInt32(
        ((Oracle.ManagedDataAccess.Types.OracleDecimal)
            idParameter.Value).Value
    );

    // 5. 回傳新增結果
    return Results.Created(
        $"/api/debts/{newId}",
        new
        {
            id = newId,
            debtorId = request.DebtorId,
            debtType = request.DebtType,
            amount = request.Amount,
            date = request.Date.ToString("yyyy-MM-dd"),
            description = request.Description
        }
    );
});



 // -------------------------------------------------------------------------
 // GET(BUDGETS): 讀取所有預算
 // -------------------------------------------------------------------------

app.MapGet("/api/budgets", async (IConfiguration configuration) =>
{
    // 1. 取得 Oracle 連線設定
    var connectionString =
        configuration.GetConnectionString("OracleDb");

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        return Results.Problem(
            "Oracle connection string is not configured.");
    }

    // 2. 建立資料庫連線
    await using var connection =
        new OracleConnection(connectionString);

    await connection.OpenAsync();

    // 3. 查詢 BUDGETS 資料表
    const string sql = @"
        SELECT
            ID,
            CATEGORY_ID,
            BUDGET_MONTH,
            LIMIT_AMOUNT
        FROM BUDGETS
        ORDER BY BUDGET_MONTH DESC, CATEGORY_ID";

    await using var command =
        new OracleCommand(sql, connection);

    await using var reader =
        await command.ExecuteReaderAsync();

    // 4. 逐筆讀取資料
    var budgets = new List<object>();

    while (await reader.ReadAsync())
    {
        budgets.Add(new
        {
            id = Convert.ToInt32(reader.GetValue(0)),
            categoryId = Convert.ToInt32(reader.GetValue(1)),
            budgetMonth = reader.GetDateTime(2)
                .ToString("yyyy-MM-dd"),
            limitAmount = Convert.ToDecimal(reader.GetValue(3))
        });
    }

    // 5. 回傳 JSON 給 Angular
    return Results.Ok(budgets);
});



// -------------------------------------------------------------------------
// POST(BUDGETS): 新增預算
// -------------------------------------------------------------------------


app.MapPost("/api/budgets", async (
    IConfiguration configuration,
    BudgetRequest request) =>
{
    // 檢查預算金額
    if (request.LimitAmount <= 0)
    {
        return Results.BadRequest(
            "LimitAmount must be greater than zero.");
    }

    // 檢查月份格式，例如 2026-10
    if (!DateTime.TryParseExact(
        request.BudgetMonth,
        "yyyy-MM",
        System.Globalization.CultureInfo.InvariantCulture,
        System.Globalization.DateTimeStyles.None,
        out var budgetMonth))
    {
        return Results.BadRequest(
            "BudgetMonth must use yyyy-MM format.");
    }

    var connectionString =
        configuration.GetConnectionString("OracleDb");

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        return Results.Problem(
            "Oracle connection string is not configured.");
    }

    await using var connection =
        new OracleConnection(connectionString);

    await connection.OpenAsync();

    const string sql = @"
        INSERT INTO BUDGETS (
            CATEGORY_ID,
            BUDGET_MONTH,
            LIMIT_AMOUNT
        )
        VALUES (
            :CategoryId,
            :BudgetMonth,
            :LimitAmount
        )
        RETURNING ID INTO :NewId";

    await using var command = new OracleCommand(sql, connection);

    command.Parameters.Add(
        "CategoryId",
        OracleDbType.Int32).Value = request.CategoryId;

    command.Parameters.Add(
        "BudgetMonth",
        OracleDbType.Date).Value =
        new DateTime(budgetMonth.Year, budgetMonth.Month, 1);

    command.Parameters.Add(
        "LimitAmount",
        OracleDbType.Decimal).Value = request.LimitAmount;

    var newIdParameter = new OracleParameter(
        "NewId",
        OracleDbType.Int32)
    {
        Direction = System.Data.ParameterDirection.Output
    };

    command.Parameters.Add(newIdParameter);

    await command.ExecuteNonQueryAsync();

    return Results.Ok(new
    {
        id = Convert.ToInt32(newIdParameter.Value.ToString()),
        categoryId = request.CategoryId,
        budgetMonth = budgetMonth.ToString("yyyy-MM"),
        limitAmount = request.LimitAmount
    });
});


// -------------------------------------------------------------------------
// PUT(BUDGETS): 更新預算
// -------------------------------------------------------------------------

app.MapPut("/api/budgets/{id}", async (
    int id,
    IConfiguration configuration,
    BudgetRequest request) =>
{
    // 1. 檢查輸入資料
    if (id <= 0)
    {
        return Results.BadRequest("Invalid budget ID.");
    }

    if (request.CategoryId <= 0)
    {
        return Results.BadRequest("CategoryId must be greater than 0.");
    }

    if (request.LimitAmount <= 0)
    {
        return Results.BadRequest("LimitAmount must be greater than 0.");
    }

    // 2. 檢查月份格式，例如 2026-10
    if (!DateTime.TryParseExact(
        request.BudgetMonth,
        "yyyy-MM",
        System.Globalization.CultureInfo.InvariantCulture,
        System.Globalization.DateTimeStyles.None,
        out var parsedMonth))
    {
        return Results.BadRequest(
            "BudgetMonth must use yyyy-MM format, for example 2026-10.");
    }

    // 3. 取得資料庫連線
    var connectionString =
        configuration.GetConnectionString("OracleDb");

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        return Results.Problem(
            "Oracle connection string is not configured.");
    }

    await using var connection =
        new OracleConnection(connectionString);

    await connection.OpenAsync();

    // 4. 更新指定 ID 的預算
    const string sql = @"
        UPDATE BUDGETS
        SET CATEGORY_ID = :CategoryId,
            BUDGET_MONTH = :BudgetMonth,
            LIMIT_AMOUNT = :LimitAmount
        WHERE ID = :Id";

    await using var command = new OracleCommand(sql, connection);

    command.Parameters.Add(
        "CategoryId", OracleDbType.Int32
    ).Value = request.CategoryId;

    command.Parameters.Add(
        "BudgetMonth", OracleDbType.Date
    ).Value = new DateTime(parsedMonth.Year, parsedMonth.Month, 1);

    command.Parameters.Add(
        "LimitAmount", OracleDbType.Decimal
    ).Value = request.LimitAmount;

    command.Parameters.Add(
        "Id", OracleDbType.Int32
    ).Value = id;

    // 5. 執行更新
    var rowsAffected = await command.ExecuteNonQueryAsync();

    if (rowsAffected == 0)
    {
        return Results.NotFound(
            $"Budget with ID {id} was not found.");
    }

    return Results.Ok(new
    {
        message = "Budget updated successfully."
    });
});



// -------------------------------------------------------------------------
// DELETE(BUDGETS): 刪除預算
// -------------------------------------------------------------------------

app.MapDelete("/api/budgets/{id}", async (
    int id,
    IConfiguration configuration) =>
{
    // 1. 檢查預算 ID
    if (id <= 0)
    {
        return Results.BadRequest("Invalid budget ID.");
    }

    // 2. 取得資料庫連線設定
    var connectionString =
        configuration.GetConnectionString("OracleDb");

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        return Results.Problem(
            "Oracle connection string is not configured.");
    }

    // 3. 連接 Oracle
    await using var connection =
        new OracleConnection(connectionString);

    await connection.OpenAsync();

    // 4. 刪除指定 ID 的預算
    const string sql = @"
        DELETE FROM BUDGETS
        WHERE ID = :Id";

    await using var command =
        new OracleCommand(sql, connection);

    command.Parameters.Add(
        "Id",
        OracleDbType.Int32
    ).Value = id;

    // 5. 執行刪除
    var rowsAffected = await command.ExecuteNonQueryAsync();

    if (rowsAffected == 0)
    {
        return Results.NotFound(
            $"Budget with ID {id} was not found.");
    }

    return Results.Ok(new
    {
        message = "Budget deleted successfully."
    });
});





// -------------------------------------------------------------------------
// 啟動應用程式
// -------------------------------------------------------------------------
app.Run();


// -------------------------------------------------------------------------
// 前端傳入類別資料
// -------------------------------------------------------------------------
record CategoryRequest(
    string Name,
    string Type
);


// -------------------------------------------------------------------------
//  前端傳入交易資料
// -------------------------------------------------------------------------

record TransactionRequest(
    decimal Amount,
    string? Description,
    DateTime Date,
    int? CategoryId,
    int? PaymentMethodId
);

// -------------------------------------------------------------------------
//  前端傳入欠款人資料
// -------------------------------------------------------------------------
record DebtorRequest(string Name);

// -------------------------------------------------------------------------
//  前端傳入債務資料
// -------------------------------------------------------------------------
record DebtRequest(
    int DebtorId,
    string DebtType,
    decimal Amount,
    DateTime Date,
    string? Description
);


// -------------------------------------------------------------------------
//  前端傳入債務情況資料(PAID/RECEIVED)
// -------------------------------------------------------------------------
record DebtStatusRequest(string Status);

// -------------------------------------------------------------------------
//  前端傳入預算資料
// -------------------------------------------------------------------------
record BudgetRequest(
    int CategoryId,
    string BudgetMonth,
    decimal LimitAmount
);


