using System.Text.Json;
using appoint.Domain.Request;
using appoint.Domain.Response;
using appoint.Models;
using appoint.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace appoint.Controllers;

[Authorize] // Asegura que solo usuarios autenticados puedan acceder a este controlador
[ApiController]
[Route("api/[controller]")] // Ruta base: /api/Roles
public class RolesController : ControllerBase
{
    private readonly IRoleService _roleService;

    public RolesController(IRoleService roleService)
    {
        _roleService = roleService;
    }

    /// <summary>
    /// Obtiene una lista de todos los roles. (Corresponde a Laravel RoleController::index)
    /// </summary>
    /// <returns>Una lista de RoleModel.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<RoleModel>>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> GetAllRoles()
    {
        var roles = await _roleService.GetAllRolesAsync();
        if (roles == null || !roles.Any())
        {
            // Aunque sería más común devolver una lista vacía si no hay roles,
            // si la intención es que "no se encontraron" sea un 404, se puede hacer.
            // Para una API REST más estándar, si la colección puede estar vacía, un 200 con una lista vacía es lo esperado.
            // Si "no se encontraron" es una condición excepcional, un 404 es válido.
            return NotFound(new ApiResponse("No roles found", 404));
        }
        return Ok(new ApiResponse<IEnumerable<RoleModel>>(roles, "Roles retrieved successfully"));
    }

    /// <summary>
    /// Obtiene los detalles de un rol específico para edición. (Corresponde a Laravel RoleController::edit)
    /// Incluye el rol, sus permisos asignados y todos los permisos disponibles.
    /// </summary>
    /// <param name="id">El ID del rol.</param>
    /// <returns>RoleDetailsResponse con los datos del rol y los permisos.</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<RoleDetailsResponse>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> GetRoleDetails(Guid id)
    {
        var roleDetails = await _roleService.GetRoleDetailsForEditAsync(id);
        if (roleDetails == null)
        {
            return NotFound(new ApiResponse($"Role with ID '{id}' not found.", 404));
        }
        return Ok(new ApiResponse<RoleDetailsResponse>(roleDetails, "Role details retrieved successfully"));
    }

    /// <summary>
    /// Crea un nuevo rol en el sistema. (Corresponde a Laravel RoleController::store)
    /// </summary>
    /// <param name="request">Datos del rol a crear.</param>
    /// <returns>El ID del rol creado.</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<Guid>), 201)] // 201 Created
    [ProducesResponseType(typeof(ApiResponse), 400)] // Bad Request por validación de modelo
    [ProducesResponseType(typeof(ApiResponse), 409)] // Conflict (ej. nombre de rol ya existe)
    [ProducesResponseType(typeof(ApiResponse), 500)] // Internal Server Error
    public async Task<IActionResult> CreateRole([FromBody] RoleRequest request)
    {
        // Validación automática del modelo (requiere atributos como [Required] en RoleRequest)
        if (!ModelState.IsValid)
        {
            // Devuelve errores de validación del modelo
            return BadRequest(new ApiResponse(ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList(), 400));
        }

        try
        {
            var newRoleId = await _roleService.CreateRoleAsync(request);
            // StatusCode(201, ...) para devolver un 201 Created
            return StatusCode(201, new ApiResponse<Guid>(newRoleId, "Role created successfully"));
        }
        catch (InvalidOperationException ex)
        {
            // Usamos 409 Conflict si la operación no es válida debido a una condición de negocio (ej. rol ya existe)
            return Conflict(new ApiResponse(ex.Message, 409));
        }
        catch (Exception ex)
        {
            // Captura cualquier otra excepción no manejada específicamente
            // Para depuración, puedes loggear 'ex'
            return StatusCode(500, new ApiResponse($"An unexpected error occurred while creating the role: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// Actualiza un rol existente. (Corresponde a Laravel RoleController::update)
    /// </summary>
    /// <param name="id">El ID del rol a actualizar.</param>
    /// <param name="request">Datos actualizados del rol.</param>
    /// <returns>Mensaje de éxito.</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)] // Bad Request
    [ProducesResponseType(typeof(ApiResponse), 404)] // Not Found
    [ProducesResponseType(typeof(ApiResponse), 409)] // Conflict (ej. nombre de rol ya existe)
    [ProducesResponseType(typeof(ApiResponse), 500)] // Internal Server Error
    public async Task<IActionResult> UpdateRole(Guid id, [FromBody] RoleRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse(ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList(), 400));
        }

        try
        {
            await _roleService.UpdateRoleAsync(id, request);
            return Ok(new ApiResponse("Role updated successfully"));
        }
        catch (InvalidOperationException ex)
        {
            // Por ejemplo, si el nombre del rol ya existe o si el servicio detecta otra regla de negocio violada
            return Conflict(new ApiResponse(ex.Message, 409));
        }
        catch (Exception ex)
        {
            // Si el rol no fue encontrado por el servicio (aquí estamos asumiendo que el servicio lanza una Excepción genérica con un mensaje específico)
            // Idealmente, el servicio lanzaría una NotFoundException personalizada.
            if (ex.Message.Contains("Role not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new ApiResponse(ex.Message, 404));
            }
            return StatusCode(500, new ApiResponse($"An unexpected error occurred while updating the role: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// Elimina un rol del sistema. (Corresponde a Laravel RoleController::destroy)
    /// </summary>
    /// <param name="id">El ID del rol a eliminar.</param>
    /// <returns>Mensaje de éxito o error.</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)] // Not Found
    [ProducesResponseType(typeof(ApiResponse), 409)] // Conflict (ej. rol por defecto o asignado a usuarios)
    [ProducesResponseType(typeof(ApiResponse), 500)] // Internal Server Error
    public async Task<IActionResult> DeleteRole(Guid id)
    {
        try
        {
            await _roleService.DeleteRoleAsync(id);
            return Ok(new ApiResponse("Role deleted successfully"));
        }
        catch (InvalidOperationException ex)
        {
            // Captura las excepciones específicas del servicio para rol por defecto o asignado a usuarios
            return Conflict(new ApiResponse(ex.Message, 409));
        }
        catch (Exception ex)
        {
            // Si el rol no fue encontrado por el servicio
            if (ex.Message.Contains("Role not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new ApiResponse(ex.Message, 404));
            }
            return StatusCode(500, new ApiResponse($"An unexpected error occurred while deleting the role: {ex.Message}", 500));
        }
    }
}