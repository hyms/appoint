using appoint.Models;

namespace appoint.Services;

public interface ISettingsService
{
    // Obtener todas las configuraciones como un diccionario clave-valor.
    Task<Dictionary<string, string>> GetAppSettingsAsync();

    // Actualizar un conjunto de configuraciones generales.
    Task UpdateAppSettingsAsync(AppGeneralSettingsRequest request); // Aquí el cambio

    // Obtener una configuración específica por su clave.
    Task<string?> GetSettingByKeyAsync(string key);

    // Actualizar o insertar una configuración individual por clave y valor.
    Task<bool> UpdateSettingByKeyAsync(string key, string value);
}