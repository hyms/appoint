using System.Security.Claims;
using appoint.Domain.Request;
using appoint.Domain.Response;
using appoint.Models;
using appoint.Services;
using appoint.Services.implement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace appoint.Controllers;

[Authorize] // Asegura que solo usuarios autenticados puedan acceder a este controlador
[ApiController]
[Route("api/[controller]")] // Ruta base: /api/Patients
public class PatientsController : ControllerBase
{
    private readonly IPatientService _patientService;
    private readonly IUserService _userService; // Necesario para obtener roles del usuario logueado

    public PatientsController(IPatientService patientService, IUserService userService)
    {
        _patientService = patientService;
        _userService = userService;
    }

    /// <summary>
    /// Obtiene una lista de todos los pacientes, con conteo de citas.
    /// (Corresponde a Laravel PatientController::index y getTable)
    /// </summary>
    /// <returns>Una lista de PatientListItemModel.</returns>
    [HttpGet] // Ruta: /api/Patients
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PatientListItemModel>>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)] // No patients found
    public async Task<IActionResult> GetAllPatients()
    {
        var patients = await _patientService.GetAllPatientsAsync();
        
        if (patients == null || !patients.Any())
        {
            return NotFound(new ApiResponse("No patients found.", 404));
        }
        return Ok(new ApiResponse<IEnumerable<PatientListItemModel>>(patients, "Patients retrieved successfully"));
    }

    /// <summary>
    /// Obtiene datos necesarios para la creación de un paciente (ej. lista de sucursales).
    /// (Corresponde a Laravel PatientController::create)
    /// </summary>
    /// <returns>PatientCreationDataResponse con datos iniciales.</returns>
    [HttpGet("create-data")] // Ruta: /api/Patients/create-data
    [ProducesResponseType(typeof(ApiResponse<PatientCreationDataResponse>), 200)]
    public async Task<IActionResult> GetPatientCreateData()
    {
        var data = await _patientService.GetPatientCreationDataAsync();
        return Ok(new ApiResponse((PatientCreationDataResponse)data));
    }

    /// <summary>
    /// Crea un nuevo paciente en el sistema.
    /// (Corresponde a Laravel PatientController::store)
    /// </summary>
    /// <param name="request">Datos del paciente a crear.</param>
    /// <returns>El ID del paciente creado.</returns>
    [HttpPost] // Ruta: /api/Patients
    [ProducesResponseType(typeof(ApiResponse<Guid>), 201)] // 201 Created
    [ProducesResponseType(typeof(ApiResponse), 400)] // Bad Request (validación, sucursal/rol no encontrado)
    [ProducesResponseType(typeof(ApiResponse), 409)] // Conflict (email/contacto/ID único ya existe)
    [ProducesResponseType(typeof(ApiResponse), 500)] // Internal Server Error
    public async Task<IActionResult> CreatePatient([FromBody] PatientCreateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse(ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList(), 400));
        }

        try
        {
            var newPatientId = await _patientService.CreatePatientAsync(request);
            return StatusCode(201, new ApiResponse<Guid>(newPatientId, "Patient created successfully"));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase) || ex.Message.Contains("invalid", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new ApiResponse(ex.Message, 400));
            }
            if (ex.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(new ApiResponse(ex.Message, 409));
            }
            return StatusCode(500, new ApiResponse($"An unexpected business error occurred: {ex.Message}", 500));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiResponse(ex.Message, 400));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse($"An unexpected error occurred while creating the patient: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// Obtiene los detalles completos de un paciente.
    /// (Corresponde a Laravel PatientController::show)
    /// </summary>
    /// <param name="id">El ID del paciente.</param>
    /// <returns>PatientDetailsResponse con los datos completos del paciente.</returns>
    [HttpGet("{id}")] // Ruta: /api/Patients/{id}
    [ProducesResponseType(typeof(ApiResponse<PatientDetailsResponse>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 403)] // Forbidden si un doctor no tiene citas con este paciente
    [ProducesResponseType(typeof(ApiResponse), 404)] // Not Found
    public async Task<IActionResult> GetPatientDetails(Guid id)
    {
        // Obtener el ID del usuario logueado y sus roles para la validación de acceso de Laravel
        var loggedInUserIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
        if (loggedInUserIdClaim == null || !Guid.TryParse(loggedInUserIdClaim.Value, out Guid loggedInUserId))
        {
            return Unauthorized(new ApiResponse("Invalid user ID in token.", 401));
        }

        var loggedInUser = await _userService.GetUserByIdAsync(loggedInUserId);
        if (loggedInUser == null)
        {
            return Unauthorized(new ApiResponse("Logged in user not found.", 401));
        }

        // Lógica de Laravel: si el usuario logueado es un doctor, solo puede ver pacientes con cita.
        // Esto es una validación de negocio que podría ir en el servicio, pero la replicamos aquí por cómo Laravel lo manejaba.
        if (loggedInUser.Role.Equals("Doctor", StringComparison.OrdinalIgnoreCase))
        {
            // Necesitamos el DoctorId del usuario logueado. Asumiendo que existe un servicio para esto.
            // Esto implicaría una consulta a la tabla Doctors para obtener el DoctorId
            // Por simplicidad, asumiré que podemos obtenerlo directamente o que el servicio de paciente lo manejará.
            // Si el DoctorId es null, el check de citas fallaría.
            
            // Para la migración actual: Necesitaríamos un IDoctorRepository o IPatientRepository.GetPatientAppointmentsAsync para verificar.
            // La validación en Laravel era: Appointment::wherePatientId($patient->id)->whereDoctorId(getLogInUser()->doctor->id)->exists()
            // Una forma de replicarlo aquí sería:
            var patientAppointments = await _patientService.GetPatientAppointmentsAsync(id, loggedInDoctorId: loggedInUserId); // Si loggedInDoctorId se mapea a UserId del doctor
            if (patientAppointments == null || !patientAppointments.Any())
            {
                return Ok(new ApiResponse("Access denied: Doctor does not have appointments with this patient.", 403));
            }
        }

        var patientDetails = await _patientService.GetPatientDetailsAsync(id, loggedInUserId); // Pasar loggedInUserId para posibles checks de seguridad en el servicio
        if (patientDetails == null)
        {
            return NotFound(new ApiResponse($"Patient with ID '{id}' not found.", 404));
        }
        return Ok(new ApiResponse<PatientDetailsResponse>(patientDetails, "Patient details retrieved successfully"));
    }

    /// <summary>
    /// Actualiza un paciente existente.
    /// (Corresponde a Laravel PatientController::update)
    /// </summary>
    /// <param name="id">El ID del paciente a actualizar.</param>
    /// <param name="request">Datos actualizados del paciente.</param>
    /// <returns>Mensaje de éxito.</returns>
    [HttpPut("{id}")] // Ruta: /api/Patients/{id}
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)] // Bad Request
    [ProducesResponseType(typeof(ApiResponse), 404)] // Not Found
    [ProducesResponseType(typeof(ApiResponse), 409)] // Conflict (email/contacto/ID único ya existe)
    [ProducesResponseType(typeof(ApiResponse), 500)] // Internal Server Error
    public async Task<IActionResult> UpdatePatient(Guid id, [FromBody] PatientUpdateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse(ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList(), 400));
        }

        try
        {
            await _patientService.UpdatePatientAsync(id, request);
            return Ok(new ApiResponse("Patient updated successfully"));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new ApiResponse(ex.Message, 404));
            }
            if (ex.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase) || ex.Message.Contains("invalid", StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(new ApiResponse(ex.Message, 409));
            }
            return StatusCode(500, new ApiResponse($"An unexpected business error occurred: {ex.Message}", 500));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiResponse(ex.Message, 400));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse($"An unexpected error occurred while updating the patient: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// Elimina un paciente del sistema.
    /// (Corresponde a Laravel PatientController::destroy)
    /// </summary>
    /// <param name="id">El ID del paciente a eliminar.</param>
    /// <returns>Mensaje de éxito.</returns>
    [HttpDelete("{id}")] // Ruta: /api/Patients/{id}
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)] // Not Found
    [ProducesResponseType(typeof(ApiResponse), 409)] // Conflict (paciente tiene citas/visitas activas)
    [ProducesResponseType(typeof(ApiResponse), 500)] // Internal Server Error
    public async Task<IActionResult> DeletePatient(Guid id)
    {
        try
        {
            await _patientService.DeletePatientAsync(id);
            return Ok(new ApiResponse("Patient deleted successfully"));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new ApiResponse(ex.Message, 404));
            }
            return Conflict(new ApiResponse(ex.Message, 409)); // Para errores de negocio como "paciente tiene dependencias"
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse($"An unexpected error occurred while deleting the patient: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// Obtiene las citas de un paciente.
    /// (Corresponde a Laravel PatientController::patientAppointment)
    /// </summary>
    /// <param name="id">El ID del paciente.</param>
    /// <param name="statusFilter">Filtro por estado de la cita.</param>
    /// <param name="dateFilter">Rango de fechas (ej. "YYYY-MM-DD - YYYY-MM-DD").</param>
    /// <returns>Una lista de PatientAppointmentListItemModel.</returns>
    [HttpGet("{id}/appointments")] // Ruta: /api/Patients/{id}/appointments
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PatientAppointmentListItemModel>>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)] // No appointments found
    [ProducesResponseType(typeof(ApiResponse), 400)] // Bad Request (dateFilter format)
    public async Task<IActionResult> GetPatientAppointments(
        Guid id,
        [FromQuery] string? statusFilter = null,
        [FromQuery] string? dateFilter = null) // dateFilter como string para parsear
    {
        // Obtener el ID del usuario logueado para posibles filtros de doctor
        var loggedInUserIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
        Guid? loggedInUserId = null;
        if (loggedInUserIdClaim != null && Guid.TryParse(loggedInUserIdClaim.Value, out Guid parsedId))
        {
            loggedInUserId = parsedId;
        }

        DateTime? startDate = null;
        DateTime? endDate = null;

        if (!string.IsNullOrEmpty(dateFilter))
        {
            var dates = dateFilter.Split(" - ");
            if (dates.Length == 2 && DateTime.TryParse(dates[0], out DateTime start) && DateTime.TryParse(dates[1], out DateTime end))
            {
                startDate = start;
                endDate = end;
            }
            else
            {
                return BadRequest(new ApiResponse("Invalid date filter format. Use 'YYYY-MM-DD - YYYY-MM-DD'.", 400));
            }
        }

        try
        {
            var appointments = await _patientService.GetPatientAppointmentsAsync(
                id,
                statusFilter: statusFilter,
                startDate: startDate,
                endDate: endDate,
                loggedInDoctorId: loggedInUserId // Pasa el ID del usuario logueado (podría ser un doctor)
            );

            if (appointments == null || !appointments.Any())
            {
                return NotFound(new ApiResponse($"No appointments found for patient ID '{id}' with the given filters.", 404));
            }
            return Ok(new ApiResponse<IEnumerable<PatientAppointmentListItemModel>>(appointments, "Patient appointments retrieved successfully"));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new ApiResponse(ex.Message, 404));
            }
            return StatusCode(500, new ApiResponse($"An unexpected business error occurred: {ex.Message}", 500));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse($"An unexpected error occurred while retrieving patient appointments: {ex.Message}", 500));
        }
    }
}