using appoint.Domain.Request;
using appoint.Domain.Response;
using appoint.Models;

namespace appoint.Services;

public interface IDoctorSessionService
{
// Métodos para la gestión de sesiones CRUD
    Task<IEnumerable<DoctorSessionListItemModel>> GetAllDoctorSessionsAsync(Guid? loggedInDoctorId = null);

    Task<DoctorSessionDetailsResponse?> GetDoctorSessionDetailsAsync(Guid doctorSessionId,
        Guid? loggedInDoctorUserId = null);

    Task<Guid> CreateDoctorSessionAsync(DoctorSessionCreateRequest request);
    Task UpdateDoctorSessionAsync(Guid id, DoctorSessionUpdateRequest request);
    Task DeleteDoctorSessionAsync(Guid doctorSessionId);

// Métodos de apoyo (Laravel getGAPS, getMeetingTime, getDoctors)
    Dictionary<int, string> GetSessionGaps();
    Dictionary<int, string> GetSessionMeetingTimes();
    Task<IEnumerable<DoctorModel>> GetDoctorSyncListAsync();

// Obtener horarios de clínica (ya migrado a ClinicScheduleService, pero puede ser referenciado aquí si se necesita una vista combinada)
// Task<IEnumerable<ClinicScheduleModel>> GetClinicSchedulesWithSlotsAsync(); // Desactivado si el frontend maneja esto

// Método para obtener slots de tiempo disponibles para una cita (el complejo getDoctorSession de Laravel)
    Task<DoctorSessionTimeSlotsResponse> GetDoctorSessionAvailableSlotsAsync(DoctorSessionByDateRequest request,
        Guid loggedInUserId);

// Helper para generar slots de tiempo (getTimeSlot de Laravel)
// Se mantiene como privado en la implementación si solo se usa internamente
// Dictionary<string, List<string>> GetTimeSlot(int interval, TimeSpan startTime, TimeSpan endTime);
}