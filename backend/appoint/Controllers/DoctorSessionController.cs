using System.Security.Claims;
using appoint.Domain.Request;
using appoint.Domain.Response;
using appoint.Models;
using appoint.Repository;
using appoint.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace appoint.Controllers;

[Authorize] // Este controlador puede ser accedido por Admin y Doctor (y Patient para getDoctorSession)
[ApiController]
[Route("api/[controller]")] // Ruta base: /api/DoctorSession
public class DoctorSessionController : ControllerBase
{
    private readonly IDoctorSessionService _doctorSessionService;
    private readonly IUserService _userService; // Para getLoginUser()->hasRole
    private readonly IDoctorRepository _doctorRepository; // Para getLoginUser()->doctor->id

    public DoctorSessionController(
        IDoctorSessionService doctorSessionService,
        IUserService userService,
        IDoctorRepository doctorRepository)
    {
        _doctorSessionService = doctorSessionService;
        _userService = userService;
        _doctorRepository = doctorRepository;
    }

    /// <summary>
    /// Obtiene una lista de todas las sesiones de doctor.
    /// (Corresponde a Laravel DoctorSessionController::getTable)
    /// </summary>
    /// <returns>Lista de DoctorSessionListItemModel.</returns>
    [HttpGet] // Ruta: /api/DoctorSession
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<DoctorSessionListItemModel>>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 401)]
    [ProducesResponseType(typeof(ApiResponse), 403)]
    public async Task<IActionResult> GetDoctorSessions()
    {
        Guid? loggedInDoctorId = null;
        var loggedInUserIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
        if (loggedInUserIdClaim != null && Guid.TryParse(loggedInUserIdClaim.Value, out Guid loggedInUserId))
        {
            var loggedInUser = await _userService.GetUserByIdAsync(loggedInUserId);
            if (loggedInUser != null && loggedInUser.Type == "Doctor") // Asumo que Type == "Doctor" es el rol principal
            {
                var doctor = await _doctorRepository.GetDoctorByUserIdAsync(loggedInUserId);
                if (doctor != null)
                {
                    loggedInDoctorId = doctor.Id;
                }
            }
        }

        var sessions = await _doctorSessionService.GetAllDoctorSessionsAsync(loggedInDoctorId);
        if (!sessions.Any())
        {
            return NotFound(new ApiResponse("No doctor sessions found.", 404));
        }
        return Ok(new ApiResponse<IEnumerable<DoctorSessionListItemModel>>(sessions, "Doctor sessions retrieved successfully."));
    }

    /// <summary>
    /// Obtiene la lista de doctores (para selectores en formularios, etc.).
    /// (Corresponde a Laravel DoctorSessionController::getDoctors)
    /// </summary>
    /// <returns>Lista de DoctorModel (simplificado).</returns>
    [HttpGet("doctors")] // Ruta: /api/DoctorSession/doctors
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<DoctorModel>>), 200)]
    public async Task<IActionResult> GetDoctorsForSelect()
    {
        var doctorsList = await _doctorSessionService.GetDoctorSyncListAsync();
        return Ok(new ApiResponse<IEnumerable<DoctorModel>>(doctorsList, "Doctor sync list retrieved successfully."));
    }

    /// <summary>
    /// Obtiene las opciones de 'gaps' para las sesiones.
    /// (Corresponde a Laravel DoctorSessionController::getGAPS)
    /// </summary>
    /// <returns>Diccionario de GAPS.</returns>
    [HttpGet("gaps")] // Ruta: /api/DoctorSession/gaps
    [ProducesResponseType(typeof(ApiResponse<Dictionary<int, string>>), 200)]
    public IActionResult GetSessionGaps()
    {
        var gaps = _doctorSessionService.GetSessionGaps();
        return Ok(new ApiResponse<Dictionary<int, string>>(gaps, "Session gaps retrieved successfully."));
    }

    /// <summary>
    /// Obtiene las opciones de 'meeting time' para las sesiones.
    /// (Corresponde a Laravel DoctorSessionController::getMeetingTime)
    /// </summary>
    /// <returns>Diccionario de Meeting Times.</returns>
    [HttpGet("meeting-time")] // Ruta: /api/DoctorSession/meeting-time
    [ProducesResponseType(typeof(ApiResponse<Dictionary<int, string>>), 200)]
    public IActionResult GetMeetingTime()
    {
        var meetingTimes = _doctorSessionService.GetSessionMeetingTimes();
        return Ok(new ApiResponse<Dictionary<int, string>>(meetingTimes, "Session meeting times retrieved successfully."));
    }

    /// <summary>
    /// Crea una nueva sesión de doctor.
    /// (Corresponde a Laravel DoctorSessionController::store)
    /// </summary>
    /// <param name="request">DTO con los datos de la sesión a crear.</param>
    /// <returns>El ID de la sesión creada.</returns>
    [HttpPost] // Ruta: /api/DoctorSession
    [ProducesResponseType(typeof(ApiResponse<Guid>), 201)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    [ProducesResponseType(typeof(ApiResponse), 500)]
    public async Task<IActionResult> CreateDoctorSession([FromBody] DoctorSessionCreateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse(ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList(), 400));
        }

        try
        {
            var newSessionId = await _doctorSessionService.CreateDoctorSessionAsync(request);
            return StatusCode(201, new ApiResponse<Guid>(newSessionId, "Doctor session created successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ApiResponse(ex.Message, 400));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiResponse(ex.Message, 400));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse($"An unexpected error occurred while creating the doctor session: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// Obtiene los detalles de una sesión de doctor por su ID.
    /// (Corresponde a Laravel DoctorSessionController::show y doctorScheduleEdit)
    /// </summary>
    /// <param name="id">El ID de la sesión de doctor.</param>
    /// <returns>DoctorSessionDetailsResponse con los detalles.</returns>
    [HttpGet("{id}")] // Ruta: /api/DoctorSession/{id}
    [ProducesResponseType(typeof(ApiResponse<DoctorSessionDetailsResponse>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    [ProducesResponseType(typeof(ApiResponse), 403)] // Si un doctor no puede ver la sesión de otro
    public async Task<IActionResult> GetDoctorSessionDetails(Guid id)
    {
        Guid? loggedInDoctorUserId = null;
        var loggedInUserIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
        if (loggedInUserIdClaim != null && Guid.TryParse(loggedInUserIdClaim.Value, out Guid loggedInUserId))
        {
            // Lógica para getLogInUser()->hasRole('doctor') y getLogInUser()->doctor->id
            var loggedInUser = await _userService.GetUserByIdAsync(loggedInUserId);
            if (loggedInUser != null && loggedInUser.Type == "Doctor")
            {
                loggedInDoctorUserId = loggedInUserId;
            }
        }
        
        var details = await _doctorSessionService.GetDoctorSessionDetailsAsync(id, loggedInDoctorUserId);
        if (details == null)
        {
            return NotFound(new ApiResponse($"Doctor session with ID {id} not found or access denied.", 404));
        }
        return Ok(new ApiResponse<DoctorSessionDetailsResponse>(details, "Doctor session details retrieved successfully."));
    }

    /// <summary>
    /// Actualiza una sesión de doctor existente.
    /// (Corresponde a Laravel DoctorSessionController::update)
    /// </summary>
    /// <param name="id">El ID de la sesión de doctor a actualizar.</param>
    /// <param name="request">DTO con los datos actualizados.</param>
    /// <returns>Mensaje de éxito.</returns>
    [HttpPut("{id}")] // Ruta: /api/DoctorSession/{id}
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    [ProducesResponseType(typeof(ApiResponse), 500)]
    public async Task<IActionResult> UpdateDoctorSession(Guid id, [FromBody] DoctorSessionUpdateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse(ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList(), 400));
        }

        try
        {
            await _doctorSessionService.UpdateDoctorSessionAsync(id, request);
            return Ok(new ApiResponse("Doctor session updated successfully."));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new ApiResponse(ex.Message, 404));
            }
            return BadRequest(new ApiResponse(ex.Message, 400)); // Otros errores de negocio como validación de hora
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiResponse(ex.Message, 400)); // Errores de formato de hora
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse($"An unexpected error occurred while updating the doctor session: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// Elimina una sesión de doctor.
    /// (Corresponde a Laravel DoctorSessionController::destroy)
    /// </summary>
    /// <param name="id">El ID de la sesión a eliminar.</param>
    /// <returns>Mensaje de éxito.</returns>
    [HttpDelete("{id}")] // Ruta: /api/DoctorSession/{id}
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    [ProducesResponseType(typeof(ApiResponse), 500)]
    public async Task<IActionResult> DeleteDoctorSession(Guid id)
    {
        try
        {
            await _doctorSessionService.DeleteDoctorSessionAsync(id);
            return Ok(new ApiResponse("Doctor session deleted successfully."));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new ApiResponse(ex.Message, 404));
            }
            return Conflict(new ApiResponse(ex.Message, 409)); // Si hay dependencias (ej. citas activas)
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse($"An unexpected error occurred while deleting the doctor session: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// Obtiene los slots de tiempo disponibles para una sesión de doctor en una fecha específica.
    /// (Corresponde a Laravel DoctorSessionController::getDoctorSession)
    /// </summary>
    /// <param name="request">DTO con la fecha, ID del doctor y offset de zona horaria.</param>
    /// <returns>DoctorSessionTimeSlotsResponse con slots reservados y disponibles.</returns>
    [HttpGet("available-slots")] // Ruta: /api/DoctorSession/available-slots
    [ProducesResponseType(typeof(ApiResponse<DoctorSessionTimeSlotsResponse>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> GetDoctorSessionAvailableSlots([FromQuery] DoctorSessionByDateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse(ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList(), 400));
        }

        var loggedInUserIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
        if (loggedInUserIdClaim == null || !Guid.TryParse(loggedInUserIdClaim.Value, out Guid loggedInUserId))
        {
            return Unauthorized(new ApiResponse("Invalid user ID in token.", 401));
        }

        try
        {
            var slots = await _doctorSessionService.GetDoctorSessionAvailableSlotsAsync(request, loggedInUserId);
            return Ok(new ApiResponse<DoctorSessionTimeSlotsResponse>(slots, "Available doctor session slots retrieved successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ApiResponse(ex.Message, 400)); // Vacaciones del doctor, etc.
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse($"An unexpected error occurred while retrieving available slots: {ex.Message}", 500));
        }
    }

    private IActionResult Unauthorized(ApiResponse apiResponse)
    {
        throw new NotImplementedException();
    }
}
