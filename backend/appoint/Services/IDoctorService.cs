using appoint.Models;

namespace appoint.Services;

public interface IDoctorService
{
    Task<IEnumerable<Doctor>> GetAllDoctorsAsync();
    Task<Doctor> GetDoctorByNameAsync(string name);
    Task<IEnumerable<Doctor>> GetDoctorsBySpecialtyAsync(string specialty);
}