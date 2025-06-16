using System.Security.Claims;
using appoint.Domain.Request;
using appoint.Domain.Response;
using appoint.Models;
using appoint.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace appoint.Controllers;

[Authorize(Roles = "Admin")] // Asumo que solo los administradores pueden gestionar el personal. Ajusta si hay otros roles.
[ApiController]
[Route("api/[controller]")] // Ruta base: /api/Staffs
public class StaffsController : ControllerBase
{
    private readonly IStaffService _staffService;

    public StaffsController(IStaffService staffService)
    {
        _staffService = staffService;
    }

    /// <summary>
    /// Obtiene una lista de todos los miembros del personal, excluyendo al usuario actualmente logueado.
    /// (Corresponde a Laravel StaffController::index y getTable)
    /// </summary>
    /// <returns>Una lista de StaffListItemModel.</returns>
    [HttpGet] // Ruta: /api/Staffs
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<StaffListItemModel>>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 401)] // Unauthorized si no hay token o no es admin
    [ProducesResponseType(typeof(ApiResponse), 403)] // Forbidden si no tiene el rol correcto
    [ProducesResponseType(typeof(ApiResponse), 404)] // No staff found
    public async Task<IActionResult> GetAllStaff()
    {
        // Obtener el ID del usuario logueado del token JWT
        var loggedInUserIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
        if (loggedInUserIdClaim == null || !Guid.TryParse(loggedInUserIdClaim.Value, out Guid loggedInUserId))
        {
            // Esto no debería suceder con [Authorize], pero es un chequeo de seguridad
            return Unauthorized(new ApiResponse("Invalid user ID in token.", 401));
        }

        var staffMembers = await _staffService.GetAllStaffAsync(loggedInUserId);
        
        if (staffMembers == null || !staffMembers.Any())
        {
            return NotFound(new ApiResponse("No staff members found.", 404));
        }
        return Ok(new ApiResponse<IEnumerable<StaffListItemModel>>(staffMembers, "Staff members retrieved successfully"));
    }

    /// <summary>
    /// Obtiene los detalles completos de un miembro del personal.
    /// (Corresponde a Laravel StaffController::show y getStaff)
    /// </summary>
    /// <param name="id">El ID del miembro del personal.</param>
    /// <returns>StaffDetailsResponse con los datos completos del staff.</returns>
    [HttpGet("{id}")] // Ruta: /api/Staffs/{id}
    [ProducesResponseType(typeof(ApiResponse<StaffDetailsResponse>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> GetStaffDetails(Guid id)
    {
        var staffDetails = await _staffService.GetStaffDetailsAsync(id);
        if (staffDetails == null)
        {
            return NotFound(new ApiResponse($"Staff member with ID '{id}' not found.", 404));
        }
        return Ok(new ApiResponse<StaffDetailsResponse>(staffDetails, "Staff member details retrieved successfully"));
    }

    /// <summary>
    /// Obtiene los roles disponibles para la asignación de miembros del personal.
    /// (Corresponde a Laravel StaffController::getRoles)
    /// </summary>
    /// <returns>Una lista de RoleModel.</returns>
    [HttpGet("roles")] // Ruta: /api/Staffs/roles
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<RoleModel>>), 200)]
    public async Task<IActionResult> GetAvailableRoles()
    {
        var roles = await _staffService.GetAvailableStaffRolesAsync();
        // Es común devolver una lista vacía en lugar de 404 si no hay roles
        return Ok(new ApiResponse<IEnumerable<RoleModel>>(roles, "Available roles retrieved successfully"));
    }

    /// <summary>
    /// Crea un nuevo miembro del personal.
    /// (Corresponde a Laravel StaffController::store)
    /// </summary>
    /// <param name="request">Datos del staff a crear.</param>
    /// <returns>El ID del staff creado.</returns>
    [HttpPost] // Ruta: /api/Staffs
    [ProducesResponseType(typeof(ApiResponse<Guid>), 201)] // 201 Created
    [ProducesResponseType(typeof(ApiResponse), 400)] // Bad Request (validación, rol no encontrado)
    [ProducesResponseType(typeof(ApiResponse), 409)] // Conflict (email/contacto ya existe)
    [ProducesResponseType(typeof(ApiResponse), 500)] // Internal Server Error
    public async Task<IActionResult> CreateStaff([FromBody] StaffCreateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse(ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList(), 400));
        }

        try
        {
            var newStaffId = await _staffService.CreateStaffAsync(request);
            // StatusCode(201, ...) para devolver un 201 Created
            return StatusCode(201, new ApiResponse<Guid>(newStaffId, "Staff member created successfully"));
        }
        catch (InvalidOperationException ex)
        {
            // Captura errores de negocio específicos lanzados por el servicio
            if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase) || ex.Message.Contains("invalid role", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new ApiResponse(ex.Message, 400)); // Para errores de validación de negocio como rol no encontrado
            }
            if (ex.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(new ApiResponse(ex.Message, 409)); // Para conflictos de unicidad (email, contacto)
            }
            return StatusCode(500, new ApiResponse($"An unexpected business error occurred: {ex.Message}", 500));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiResponse(ex.Message, 400));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse($"An unexpected error occurred while creating the staff member: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// Actualiza un miembro del personal existente.
    /// (Corresponde a Laravel StaffController::update)
    /// </summary>
    /// <param name="id">El ID del staff a actualizar.</param>
    /// <param name="request">Datos actualizados del staff.</param>
    /// <returns>Mensaje de éxito.</returns>
    [HttpPut("{id}")] // Ruta: /api/Staffs/{id}
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)] // Bad Request
    [ProducesResponseType(typeof(ApiResponse), 404)] // Not Found
    [ProducesResponseType(typeof(ApiResponse), 409)] // Conflict (email/contacto ya existe)
    [ProducesResponseType(typeof(ApiResponse), 500)] // Internal Server Error
    public async Task<IActionResult> UpdateStaff(Guid id, [FromBody] StaffUpdateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse(ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList(), 400));
        }

        try
        {
            await _staffService.UpdateStaffAsync(id, request);
            return Ok(new ApiResponse("Staff member updated successfully"));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new ApiResponse(ex.Message, 404));
            }
            if (ex.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase) || ex.Message.Contains("invalid role", StringComparison.OrdinalIgnoreCase))
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
            return StatusCode(500, new ApiResponse($"An unexpected error occurred while updating the staff member: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// Elimina un miembro del personal.
    /// (Corresponde a Laravel StaffController::destroy)
    /// </summary>
    /// <param name="id">El ID del staff a eliminar.</param>
    /// <returns>Mensaje de éxito.</returns>
    [HttpDelete("{id}")] // Ruta: /api/Staffs/{id}
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)] // Not Found
    [ProducesResponseType(typeof(ApiResponse), 409)] // Conflict (ej. staff tiene dependencias)
    [ProducesResponseType(typeof(ApiResponse), 500)] // Internal Server Error
    public async Task<IActionResult> DeleteStaff(Guid id)
    {
        try
        {
            await _staffService.DeleteStaffAsync(id);
            return Ok(new ApiResponse("Staff member deleted successfully"));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new ApiResponse(ex.Message, 404));
            }
            return Conflict(new ApiResponse(ex.Message, 409)); // Para errores de negocio como "staff tiene dependencias"
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse($"An unexpected error occurred while deleting the staff member: {ex.Message}", 500));
        }
    }

    // --- Funcionalidades de perfil de usuario (se recomienda separar en un ProfileController o UsersController general) ---

    /// <summary>
    /// Actualiza la preferencia de notificación por correo electrónico de un usuario.
    /// (Corresponde a Laravel StaffController::emailNotification)
    /// </summary>
    /// <param name="id">El ID del usuario.</param>
    /// <param name="request">DTO con la preferencia de notificación.</param>
    /// <returns>Mensaje de éxito.</returns>
    [HttpPut("{id}/email-notification")] // Ruta: /api/Staffs/{id}/email-notification
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> UpdateEmailNotification(Guid id, [FromBody] EmailNotificationRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse(ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList(), 400));
        }

        try
        {
            // Aquí podrías validar que el ID en la ruta coincida con el ID del usuario logueado
            // si solo se permite a un usuario actualizar su propia notificación.
            // Si es una acción de administrador, el id de la ruta es el id del usuario a actualizar.
            await _staffService.UpdateEmailNotificationAsync(id, request.EmailNotificationEnabled);
            return Ok(new ApiResponse("Email notification preference updated successfully"));
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
            return StatusCode(500, new ApiResponse($"An unexpected error occurred: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// Actualiza el estado de verificación de correo electrónico de un usuario.
    /// (Corresponde a Laravel StaffController::emailVerified)
    /// </summary>
    /// <param name="id">El ID del usuario.</param>
    /// <param name="isVerified">Nuevo estado de verificación.</param>
    /// <returns>Mensaje de éxito.</returns>
    [HttpPut("{id}/email-verified/{isVerified}")] // Ruta: /api/Staffs/{id}/email-verified/{isVerified}
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> UpdateEmailVerifiedStatus(Guid id, bool isVerified)
    {
        try
        {
            await _staffService.UpdateEmailVerifiedStatusAsync(id, isVerified);
            return Ok(new ApiResponse("Email verification status updated successfully"));
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
            return StatusCode(500, new ApiResponse($"An unexpected error occurred: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// Verifica si el correo electrónico de un usuario ya está verificado.
    /// (Corresponde a Laravel StaffController::resendEmailVerification, pero solo la parte de chequeo)
    /// </summary>
    /// <param name="userId">El ID del usuario.</param>
    /// <returns>True si está verificado, false en caso contrario.</returns>
    [HttpGet("{userId}/email-verified-check")] // Ruta: /api/Staffs/{userId}/email-verified-check
    [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> ResendEmailVerificationCheck(Guid userId)
    {
        try
        {
            var isVerified = await _staffService.ResendEmailVerificationCheckAsync(userId);
            return Ok(new ApiResponse<bool>(isVerified, "Email verification status checked successfully"));
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
            return StatusCode(500, new ApiResponse($"An unexpected error occurred: {ex.Message}", 500));
        }
    }
}
