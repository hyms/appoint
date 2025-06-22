using appoint.Models;

namespace appoint.Repository;

public interface ISettingsRepository
{
    // Obtener todas las configuraciones.
    Task<IEnumerable<SettingModel>> GetAllSettingsAsync();

    // Obtener una configuración por su clave.
    Task<SettingModel?> GetSettingByKeyAsync(string key);

    // Actualizar un setting existente o insertarlo si no existe.
    Task<bool> UpdateSettingAsync(string key, string value);
}
