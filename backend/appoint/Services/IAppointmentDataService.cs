namespace appoint.Services;

public interface IAppointmentDataService
{
    Task<IEnumerable<string>> GetAvailableHoursAsync(DateTime date, int? doctorId = null, int? locationId = null);
}