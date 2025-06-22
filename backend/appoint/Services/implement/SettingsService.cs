using appoint.Models;
using System.Reflection; // Para Reflection
// Para Any()
using System.Text.Json;
using appoint.Repository; // Para serialización JSON

namespace appoint.Services.implement;

public class SettingsService : ISettingsService
{
    private readonly ISettingsRepository _settingsRepository;
    private readonly ILogger<SettingsService> _logger;

    public SettingsService(ISettingsRepository settingsRepository, ILogger<SettingsService> logger)
    {
        _settingsRepository = settingsRepository;
        _logger = logger;
    }

    public async Task<Dictionary<string, string>> GetAppSettingsAsync()
    {
        _logger.LogInformation("Fetching all app settings.");
        var settingsList = await _settingsRepository.GetAllSettingsAsync();
        return settingsList.ToDictionary(s => s.Key, s => s.Value);
    }

    public async Task<string?> GetSettingByKeyAsync(string key)
    {
        _logger.LogInformation("Fetching setting by key: {Key}", key);
        var setting = await _settingsRepository.GetSettingByKeyAsync(key);
        return setting?.Value;
    }

    public async Task<bool> UpdateSettingByKeyAsync(string key, string value)
    {
        _logger.LogInformation("Updating setting key: {Key} with value: {Value}", key, value);
        return await _settingsRepository.UpdateSettingAsync(key, value);
    }

    /// <summary>
    /// Actualiza un conjunto de configuraciones generales basándose en el DTO de solicitud.
    /// </summary>
    /// <param name="request">El DTO que contiene los nuevos valores de configuración.</param>
    public async Task UpdateAppSettingsAsync(AppGeneralSettingsRequest request)
    {
        _logger.LogInformation("Starting update for general app settings.");

        // Usamos Reflection para iterar sobre las propiedades del DTO de solicitud
        // y mapearlas a claves en la tabla Settings.
        // Esto asume que el nombre de la propiedad en el DTO coincide con la 'Key' en la tabla Settings.
        // Ej: request.Clinic_Name -> Key "Clinic_Name", Value "..."

        // Obtenemos todas las propiedades públicas del objeto request
        var properties = typeof(AppGeneralSettingsRequest).GetProperties(BindingFlags.Public | BindingFlags.Instance);

        foreach (var prop in properties)
        {
            var key = prop.Name; // La clave en la tabla Settings será el nombre de la propiedad

            // Obtener el valor de la propiedad del objeto request
            var value = prop.GetValue(request);
            string? stringValue = null;

            // Manejar tipos específicos:
            if (prop.PropertyType == typeof(bool))
            {
                // Convertir booleano a "true" o "false" string
                stringValue = value?.ToString()?.ToLowerInvariant();
            }
            else if (prop.PropertyType == typeof(List<string>))
            {
                // Serializar List<string> a JSON string
                var listValue = value as List<string>;
                stringValue = listValue != null && listValue.Any() ? JsonSerializer.Serialize(listValue) : null;
            }
            else if (value != null)
            {
                // Para otros tipos (string, int, etc.), usar ToString()
                stringValue = value.ToString();
            }

            // Si el valor no es nulo, proceder a actualizar/insertar en la base de datos
            if (stringValue != null)
            {
                _logger.LogDebug("Attempting to update setting: Key='{Key}', Value='{Value}'", key, stringValue);
                // Llama al repositorio para actualizar o insertar el setting
                await _settingsRepository.UpdateSettingAsync(key, stringValue);
            }
            else
            {
                 _logger.LogDebug("Setting property '{Key}' has a null value, skipping update.", key);
            }
        }
        _logger.LogInformation("Finished updating general app settings.");
    }
}
