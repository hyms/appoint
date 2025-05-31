namespace appoint.Services.implement;

public class AppointmentDataService:IAppointmentDataService
{
    private readonly Dictionary<DateTime, List<string>> _mockAvailability = new Dictionary<DateTime, List<string>>();

    public AppointmentDataService()
    {
        // Disponibilidad para los próximos 3 días
        _mockAvailability.Add(DateTime.Today.AddDays(0).Date, new List<string> { "09:00", "10:00", "11:00", "14:00", "15:00" });
        _mockAvailability.Add(DateTime.Today.AddDays(1).Date, new List<string> { "08:30", "09:30", "10:30", "16:00", "17:00" });
        _mockAvailability.Add(DateTime.Today.AddDays(2).Date, new List<string> { "09:00", "10:00", "11:00", "12:00" });
    }

    public Task<IEnumerable<string>> GetAvailableHoursAsync(DateTime date, int? doctorId = null, int? locationId = null)
    {
        // En una aplicación real, aquí consultarías la base de datos
        // filtrando por fecha, doctor y/o ubicación.
        if (_mockAvailability.TryGetValue(date.Date, out var hours))
        {
            // Podrías añadir lógica para filtrar por doctor/ubicación si los IDs no son nulos
            return Task.FromResult<IEnumerable<string>>(hours);
        }
        return Task.FromResult<IEnumerable<string>>(new List<string>()); // No hay disponibilidad
    }
}