using System.Data;
using appoint.Models;
using Dapper;

namespace appoint.Services.implement;

public class SettingsService : ISettingsService // CAMBIO: Renombrado de ConfigurationService
{
    private readonly IDbConnection _dbConnection;

    public SettingsService(IDbConnection dbConnection)
    {
        _dbConnection = dbConnection;
    }

    public async Task<Dictionary<string, string>> GetAppSettingsAsync()
    {
        // CAMBIO: Consulta la tabla 'Settings' y columnas 'Key', 'Value'
        const string sql = "SELECT `Key`, `Value` FROM Settings";
        var settings = await _dbConnection.QueryAsync<SettingModel>(sql);
        return settings.ToDictionary(s => s.Key, s => s.Value);
    }

    public async Task<string> GetSettingByKeyAsync(string key)
    {
        const string sql = "SELECT `Value` FROM Settings WHERE `Key` = @Key";
        return await _dbConnection.QueryFirstOrDefaultAsync<string>(sql, new { Key = key });
    }

    public async Task UpdateAppSettingsAsync(AppGeneralSettingsRequest request)
    {
        // CAMBIO: Llama a UpdateSettingByKeyAsync
        if (!string.IsNullOrEmpty(request.NombreEmpresa))
            await UpdateSettingByKeyAsync("NombreEmpresa", request.NombreEmpresa);
        if (!string.IsNullOrEmpty(request.DireccionEmpresa))
            await UpdateSettingByKeyAsync("DireccionEmpresa", request.DireccionEmpresa);
        if (!string.IsNullOrEmpty(request.TelefonoEmpresa))
            await UpdateSettingByKeyAsync("TelefonoEmpresa", request.TelefonoEmpresa);
        if (!string.IsNullOrEmpty(request.WhatsappApiKey))
            await UpdateSettingByKeyAsync("WhatsappApiKey", request.WhatsappApiKey);
        if (!string.IsNullOrEmpty(request.OnesignalAppId))
            await UpdateSettingByKeyAsync("OnesignalAppId", request.OnesignalAppId);
        // Añade más líneas para otros campos que hayas agregado a AppGeneralSettingsRequest
        if (!string.IsNullOrEmpty(request.EmailSoporte))
            await UpdateSettingByKeyAsync("EmailSoporte", request.EmailSoporte);
        if (!string.IsNullOrEmpty(request.MonedaPorDefecto))
            await UpdateSettingByKeyAsync("MonedaPorDefecto", request.MonedaPorDefecto);
    }

    public async Task<bool> UpdateSettingByKeyAsync(string key, string value)
    {
        // Primero, intenta encontrar si la clave ya existe
        const string checkSql = "SELECT COUNT(Id) FROM Settings WHERE `Key` = @Key";
        var count = await _dbConnection.ExecuteScalarAsync<int>(checkSql, new { Key = key });

        if (count > 0)
        {
            // Si existe, actualiza el valor
            // CAMBIO: Nombres de columna 'Key', 'Value'. NO hay 'updated_at' en la migración de Settings.
            const string updateSql = "UPDATE Settings SET `Value` = @Value WHERE `Key` = @Key";
            await _dbConnection.ExecuteAsync(updateSql, new { Key = key, Value = value });
            return true;
        }
        else
        {
            // Si no existe, inserta un nuevo registro
            // CAMBIO: Nombres de columna 'Key', 'Value'. Generamos un nuevo Guid para Id.
            const string insertSql = "INSERT INTO Settings (Id, `Key`, `Value`) VALUES (@Id, @Key, @Value)";
            await _dbConnection.ExecuteAsync(insertSql, new { Id = Guid.NewGuid(), Key = key, Value = value });
            return true; // Se considera actualizado porque el valor fue establecido (insertado)
        }
    }
}