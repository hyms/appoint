using appoint.Models;

namespace appoint.Services;

public interface ILocationService
{
    Task<IEnumerable<Location>> GetAllLocationsAsync();
    Task<Location> GetLocationByNameAsync(string name);
}