using appoint.Domain;

namespace appoint.Services;

public interface IConfigurationService
{
    Task<Dictionary<string, string>> GetConfigurationAsync();
    Task UpdateConfigurationAsync(UpdateConfigurationRequest request);
}