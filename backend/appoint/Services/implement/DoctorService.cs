using appoint.Models;

namespace appoint.Services;

public class DoctorService:IDoctorService
{
    private readonly List<Doctor> _doctors = new List<Doctor>
    {
        new Doctor { Id = 1, Name = "Dr. Juan Pérez", Specialty = "Odontología", LocationId = 1 },
        new Doctor { Id = 2, Name = "Dra. Ana Gómez", Specialty = "Pediatría", LocationId = 1 },
        new Doctor { Id = 3, Name = "Dr. Carlos Ruiz", Specialty = "Odontología", LocationId = 2 },
        new Doctor { Id = 4, Name = "Dra. Laura Díaz", Specialty = "Cardiología", LocationId = 3 }
    };

    public Task<IEnumerable<Doctor>> GetAllDoctorsAsync()
    {
        return Task.FromResult<IEnumerable<Doctor>>(_doctors);
    }

    public Task<Doctor> GetDoctorByNameAsync(string name)
    {
        return Task.FromResult(_doctors.FirstOrDefault(d => d.Name.Contains(name, StringComparison.OrdinalIgnoreCase)));
    }

    public Task<IEnumerable<Doctor>> GetDoctorsBySpecialtyAsync(string specialty)
    {
        return Task.FromResult(_doctors.Where(d => d.Specialty.Contains(specialty, StringComparison.OrdinalIgnoreCase)).AsEnumerable());
    }
}