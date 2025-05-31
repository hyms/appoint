namespace appoint.Services;

public class LocationService
{
    private readonly List<Location> _locations = new List<Location>
    {
        new Location { Id = 1, Name = "Clínica Central", Address = "Av. Principal 123", City = "Santa Cruz" },
        new Location { Id = 2, Name = "Consultorio Norte", Address = "Calle Norte 45", City = "Santa Cruz" },
        new Location { Id = 3, Name = "Centro Médico Sur", Address = "Av. Sur 789", City = "Santa Cruz" }
    };

    public Task<IEnumerable<Location>> GetAllLocationsAsync()
    {
        return Task.FromResult<IEnumerable<Location>>(_locations);
    }

    public Task<Location> GetLocationByNameAsync(string name)
    {
        return Task.FromResult(_locations.FirstOrDefault(l => l.Name.Contains(name, StringComparison.OrdinalIgnoreCase)));
    }
}