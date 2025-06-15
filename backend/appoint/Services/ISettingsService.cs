using appoint.Models;

namespace appoint.Services;

public interface ISettingsService
{
    // Método para obtener todas las configuraciones como un diccionario (Key -> Value)
    Task<Dictionary<string, string>> GetAppSettingsAsync();

    // Método para actualizar un conjunto específico de configuraciones de la aplicación
    Task UpdateAppSettingsAsync(AppGeneralSettingsRequest request);

    // Método para obtener un valor de configuración por su clave
    Task<string> GetSettingByKeyAsync(string key);

    // Método para actualizar un valor de configuración específico por su clave
    // Retorna true si se actualizó, false si no se encontró la clave
    Task<bool> UpdateSettingByKeyAsync(string key, string value);
}