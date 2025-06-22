using appoint.Infrastructure;
using appoint.Models;
using Dapper;

namespace appoint.Repository.impl;

public class SettingsRepository : ISettingsRepository
{
    private readonly ISqlDataAccess _db;

    public SettingsRepository(ISqlDataAccess db)
    {
        _db = db;
    }

    public async Task<IEnumerable<SettingModel>> GetAllSettingsAsync()
    {
        // CORRECCIÓN: Encerrar 'Key' entre backticks para MySQL/MariaDB
        const string sql = "SELECT Id, `Key`, Value FROM Settings";
        return await _db.LoadData<SettingModel, dynamic>(sql, new { });
    }

    public async Task<SettingModel?> GetSettingByKeyAsync(string key)
    {
        // CORRECCIÓN: Encerrar 'Key' entre backticks para MySQL/MariaDB
        const string sql = "SELECT Id, `Key`, Value FROM Settings WHERE `Key` = @Key";
        return await _db.QueryFirstOrDefaultAsync<SettingModel, dynamic>(sql, new { Key = key });
    }

    public async Task<bool> UpdateSettingAsync(string key, string value)
    {
        // CORRECCIÓN: Sentencia UPSERT para MySQL/MariaDB usando ON DUPLICATE KEY UPDATE.
        // El `Id` también se generará si es una inserción.
        const string sql = @"
            INSERT INTO Settings (Id, `Key`, Value)
            VALUES (UUID(), @Key, @Value) -- UUID() para generar GUIDs en MySQL
            ON DUPLICATE KEY UPDATE Value = VALUES(Value);
        ";

        // NOTA: Si estuvieras usando SQL Server, sería:
        // const string sql = @"
        //    MERGE INTO Settings AS target
        //    USING (VALUES (@Key, @Value)) AS source ([Key], [Value])
        //    ON target.[Key] = source.[Key]
        //    WHEN MATCHED THEN
        //        UPDATE SET target.Value = source.Value
        //    WHEN NOT MATCHED THEN
        //        INSERT (Id, [Key], Value) VALUES (NEWID(), source.[Key], source.Value);
        // ";
        // Y para PostgreSQL (como en versiones anteriores):
        // const string sql = @"
        //    INSERT INTO Settings (Id, Key, Value)
        //    VALUES (gen_random_uuid(), @Key, @Value)
        //    ON CONFLICT (Key) DO UPDATE SET Value = EXCLUDED.Value;
        // ";


        var parameters = new DynamicParameters();
        // Ya no necesitamos pasar @Id aquí directamente, UUID() lo genera en MySQL
        parameters.Add("Key", key);
        parameters.Add("Value", value);

        int rowsAffected = await _db.SaveData(sql, parameters);
        return rowsAffected > 0;
    }
}