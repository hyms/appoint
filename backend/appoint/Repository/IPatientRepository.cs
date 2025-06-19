using appoint.Models;

namespace appoint.Repository;

public interface IPatientRepository
{
    // Obtener todos los pacientes para la tabla de índice, incluyendo el conteo de citas.
    Task<IEnumerable<PatientListItemModel>> GetAllPatientListItemsAsync();

    // Obtener un paciente por su ID, incluyendo sus datos de usuario y sucursal relacionada.
    Task<PatientModel?> GetPatientByIdAsync(Guid patientId);

    // Obtener un paciente por su PatientUniqueId.
    Task<PatientModel?> GetPatientByUniqueIdAsync(string patientUniqueId);

    // Obtener un usuario por su Email (para validación de unicidad en creación/actualización de paciente).
    Task<UserModel?> GetUserByEmailAsync(string email);

    // Obtener un usuario por su Contacto (para validación de unicidad en creación/actualización de paciente).
    Task<UserModel?> GetUserByContactAsync(string contact);

    // Crear un nuevo paciente (implicará crear un usuario y un registro de paciente).
    Task<Guid> AddPatientAsync(PatientModel patient, UserModel user);

    // Actualizar un paciente existente (implicará actualizar usuario y registro de paciente).
    Task UpdatePatientAsync(PatientModel patient, UserModel user);

    // Eliminar un paciente por su ID, con validaciones de citas/visitas.
    Task DeletePatientAsync(Guid patientId);

    // Verificar si un paciente tiene citas pendientes (no canceladas/finalizadas).
    Task<bool> HasPendingAppointmentsAsync(Guid patientId, IEnumerable<int> excludedStatuses);

    // Verificar si un paciente tiene visitas registradas.
    Task<bool> HasVisitsAsync(Guid patientId);

    // Obtener las citas de un paciente por ID, con filtros de estado y fecha.
    Task<IEnumerable<PatientAppointmentListItemModel>> GetPatientAppointmentsAsync(
        Guid patientId,
        string? statusFilter = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        Guid? loggedInDoctorId = null);
}