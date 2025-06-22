using appoint.Domain.Response;
using appoint.Models;

namespace appoint.Repository;

public interface IDoctorSessionRepository
{
    // Obtener lista de sesiones de doctor para la tabla (index)
    Task<IEnumerable<DoctorSessionListItemModel>> GetAllDoctorSessionListItemsAsync(Guid? doctorIdFilter = null);

    // Obtener detalles completos de una sesión de doctor por ID
    Task<DoctorSessionDetailsResponse?> GetDoctorSessionDetailsAsync(Guid doctorSessionId, Guid? doctorUserIdFilter = null);

    // Obtener un DoctorSessionModel completo por ID
    Task<DoctorSessionModel?> GetDoctorSessionByIdAsync(Guid id);

    // Crear una nueva sesión de doctor
    Task<Guid> AddDoctorSessionAsync(DoctorSessionModel doctorSession, IEnumerable<SessionWeekDayModel> sessionWeekDays);

    // Actualizar una sesión de doctor existente
    Task UpdateDoctorSessionAsync(DoctorSessionModel doctorSession, IEnumerable<SessionWeekDayModel> sessionWeekDays);

    // Eliminar una sesión de doctor por ID
    Task DeleteDoctorSessionAsync(Guid doctorSessionId);

    // Obtener la lista de doctores para selectores (similar a getDoctors en Laravel)
    Task<IEnumerable<DoctorModel>> GetSyncListDoctorsAsync();

    // Obtener una sesión de doctor por DoctorId y DayOfWeek (para el complejo getTimeSlot)
    Task<IEnumerable<SessionWeekDayModel>> GetDoctorWeekDaySessionsAsync(Guid doctorId, int dayOfWeek);
    
    // Obtener feriados del doctor por ID y fecha
    // Task<IEnumerable<DoctorHolidayModel>> GetDoctorHolidaysAsync(Guid doctorId, DateTime date);

    // Obtener citas reservadas para un doctor en una fecha específica
    // Task<IEnumerable<AppointmentModel>> GetBookedAppointmentsAsync(Guid doctorId, DateTime date);
    
    // Método para obtener la información de un usuario dado su Id (para el contexto de login)
    Task<UserModel?> GetUserByIdAsync(Guid userId);
}