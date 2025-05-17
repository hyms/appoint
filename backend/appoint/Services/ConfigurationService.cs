using appoint.Domain;
using appoint.Models;
using Dapper;
using System.Data;
namespace appoint.Services;

public class ConfigurationService : IConfigurationService
{
    private readonly IDbConnection _dbConnection;

    public ConfigurationService(IDbConnection dbConnection)
    {
        _dbConnection = dbConnection;
    }

    public async Task<Dictionary<string, string>> GetConfigurationAsync()
    {
        const string sql = "SELECT setting_name, setting_value FROM configurations";
        var configurations = await _dbConnection.QueryAsync<ConfigurationModel>(sql);
        return configurations.ToDictionary(c => c.SettingName, c => c.SettingValue);
    }

    public async Task UpdateConfigurationAsync(ConfigurationRequest request)
    {
        // Ejemplo básico: podrías querer hacer esto de forma más dinámica
        await UpdateSettingAsync("nombreEmpresa", request.NombreEmpresa);
        await UpdateSettingAsync("direccionEmpresa", request.DireccionEmpresa);
        await UpdateSettingAsync("telefonoEmpresa", request.TelefonoEmpresa);
        await UpdateSettingAsync("whatsappApiKey", request.WhatsappApiKey);
        await UpdateSettingAsync("onesignalAppId", request.OnesignalAppId);
        // Añade más líneas para otros campos
    }

    private async Task UpdateSettingAsync(string settingName, string settingValue)
    {
        const string sql = "UPDATE configurations SET setting_value = @settingValue, updated_at = NOW() WHERE setting_name = @settingName";
        await _dbConnection.ExecuteAsync(sql, new { settingName, settingValue });
    }
}