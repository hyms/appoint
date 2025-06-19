using appoint.Domain.Request;
using appoint.Domain.Response;
using appoint.Models;
using appoint.Services.implement;

namespace appoint.Services;

public interface IPatientService
{
    // Obtener todos los pacientes para la tabla de índice, incluyendo el conteo de citas.
    Task<IEnumerable<PatientListItemModel>> GetAllPatientsAsync();

    // Obtener los detalles completos de un paciente, incluyendo contadores de citas.
    Task<PatientDetailsResponse?> GetPatientDetailsAsync(Guid patientId, Guid loggedInUserId);

    // Obtener datos iniciales para la vista de creación de paciente (ej. dropdowns de sucursales).
    Task<PatientCreationDataResponse> GetPatientCreationDataAsync();

    // Crear un nuevo paciente.
    Task<Guid> CreatePatientAsync(PatientCreateRequest request);

    // Actualizar un paciente existente.
    Task UpdatePatientAsync(Guid patientId, PatientUpdateRequest request);

    // Eliminar un paciente por su ID.
    Task DeletePatientAsync(Guid patientId);

    // Obtener las citas de un paciente.
    Task<IEnumerable<PatientAppointmentListItemModel>> GetPatientAppointmentsAsync(
        Guid patientId,
        string? statusFilter = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        Guid? loggedInDoctorId = null);
}