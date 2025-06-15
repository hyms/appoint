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
[Route("api/[controller]")] // Ruta base: /api/Services
public class ServicesController : ControllerBase
{
    private readonly IServiceService _serviceService;

    public ServicesController(IServiceService serviceService)
    {
        _serviceService = serviceService;
    }

    /// <summary>
    /// Obtiene una lista paginada y filtrada de servicios. (Corresponde a Laravel ServiceController::getTable)
    /// </summary>
    /// <param name="statusFilter">Filtro por estado del servicio (ej. "Active", "Inactive", o vacío para "All").</param>
    /// <returns>Una lista de ServiceListItemModel.</returns>
    [HttpGet] // Ruta: /api/Services?statusFilter=...
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ServiceListItemModel>>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> GetAllServices([FromQuery] string? statusFilter = null)
    {
        var services = await _serviceService.GetAllServicesAsync(statusFilter);
        
        if (services == null || !services.Any())
        {
            return NotFound(new ApiResponse("No services found based on the provided filter.", 404));
        }
        return Ok(new ApiResponse<IEnumerable<ServiceListItemModel>>(services, "Services retrieved successfully"));
    }

    /// <summary>
    /// Obtiene los detalles de un servicio específico para edición. (Corresponde a Laravel ServiceController::edit)
    /// </summary>
    /// <param name="id">El ID del servicio.</param>
    /// <returns>ServiceModel con los detalles completos del servicio.</returns>
    [HttpGet("{id}")] // Ruta: /api/Services/{id}
    [ProducesResponseType(typeof(ApiResponse<ServiceModel>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> GetServiceDetails(Guid id)
    {
        var service = await _serviceService.GetServiceDetailsAsync(id);
        if (service == null)
        {
            return NotFound(new ApiResponse($"Service with ID '{id}' not found.", 404));
        }
        return Ok(new ApiResponse<ServiceModel>(service, "Service details retrieved successfully"));
    }

    /// <summary>
    /// Crea un nuevo servicio. (Corresponde a Laravel ServiceController::store)
    /// </summary>
    /// <param name="request">Datos del servicio a crear.</param>
    /// <returns>El ID del servicio creado.</returns>
    [HttpPost] // Ruta: /api/Services
    [ProducesResponseType(typeof(ApiResponse<Guid>), 201)] // 201 Created
    [ProducesResponseType(typeof(ApiResponse), 400)] // Bad Request (validación, categoría no encontrada)
    [ProducesResponseType(typeof(ApiResponse), 409)] // Conflict (ej. nombre de servicio ya existe)
    [ProducesResponseType(typeof(ApiResponse), 500)] // Internal Server Error
    public async Task<IActionResult> CreateService([FromBody] ServiceCreateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse(ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList(), 400));
        }

        try
        {
            var newServiceId = await _serviceService.CreateServiceAsync(request);
            return StatusCode(201, new ApiResponse<Guid>(newServiceId, "Service created successfully"));
        }
        catch (InvalidOperationException ex)
        {
            // Captura errores de negocio específicos lanzados por el servicio
            if (ex.Message.Contains("category not found", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new ApiResponse(ex.Message, 400));
            }
            // Puedes añadir más lógica para otros tipos de conflictos (ej. nombre duplicado)
            return Conflict(new ApiResponse(ex.Message, 409));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiResponse(ex.Message, 400));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse($"An unexpected error occurred while creating the service: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// Actualiza un servicio existente. (Corresponde a Laravel ServiceController::update)
    /// </summary>
    /// <param name="id">El ID del servicio a actualizar.</param>
    /// <param name="request">Datos actualizados del servicio.</param>
    /// <returns>Mensaje de éxito.</returns>
    [HttpPut("{id}")] // Ruta: /api/Services/{id}
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)] // Bad Request
    [ProducesResponseType(typeof(ApiResponse), 404)] // Not Found
    [ProducesResponseType(typeof(ApiResponse), 409)] // Conflict (ej. nombre de servicio ya existe)
    [ProducesResponseType(typeof(ApiResponse), 500)] // Internal Server Error
    public async Task<IActionResult> UpdateService(Guid id, [FromBody] ServiceUpdateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse(ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList(), 400));
        }

        try
        {
            await _serviceService.UpdateServiceAsync(id, request);
            return Ok(new ApiResponse("Service updated successfully"));
        }
        catch (InvalidOperationException ex)
        {
            // Distingue entre Not Found y otros errores de negocio
            if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new ApiResponse(ex.Message, 404));
            }
            return Conflict(new ApiResponse(ex.Message, 409));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiResponse(ex.Message, 400));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse($"An unexpected error occurred while updating the service: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// Elimina un servicio. (Corresponde a Laravel ServiceController::destroy)
    /// </summary>
    /// <param name="id">El ID del servicio a eliminar.</param>
    /// <returns>Mensaje de éxito.</returns>
    [HttpDelete("{id}")] // Ruta: /api/Services/{id}
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)] // Not Found
    [ProducesResponseType(typeof(ApiResponse), 409)] // Conflict (ej. servicio en uso)
    [ProducesResponseType(typeof(ApiResponse), 500)] // Internal Server Error
    public async Task<IActionResult> DeleteService(Guid id)
    {
        try
        {
            await _serviceService.DeleteServiceAsync(id);
            return Ok(new ApiResponse("Service deleted successfully"));
        }
        catch (InvalidOperationException ex)
        {
            // Distingue entre Not Found y otros errores de negocio (ej. servicio en uso)
            if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new ApiResponse(ex.Message, 404));
            }
            return Conflict(new ApiResponse(ex.Message, 409)); // Conflicto si está en uso o similar
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse($"An unexpected error occurred while deleting the service: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// Cambia el estado de un servicio. (Corresponde a Laravel ServiceController::changeServiceStatus)
    /// </summary>
    /// <param name="id">El ID del servicio.</param>
    /// <param name="request">DTO con el nuevo estado.</param>
    /// <returns>Mensaje de éxito.</returns>
    [HttpPut("{id}/status")] // Ruta: /api/Services/{id}/status
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)] // Bad Request (validación de estado)
    [ProducesResponseType(typeof(ApiResponse), 404)] // Not Found
    [ProducesResponseType(typeof(ApiResponse), 500)] // Internal Server Error
    public async Task<IActionResult> ChangeServiceStatus(Guid id, [FromBody] ServiceStatusUpdateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse(ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList(), 400));
        }

        try
        {
            // Asegurarse de que el ID en la ruta coincida con el DTO si ambos son obligatorios
            if (id != request.ServiceId)
            {
                return BadRequest(new ApiResponse("Service ID in route must match ID in body.", 400));
            }
            await _serviceService.UpdateServiceStatusAsync(request.ServiceId, request.Status);
            return Ok(new ApiResponse("Service status updated successfully"));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new ApiResponse(ex.Message, 404));
            }
            return Conflict(new ApiResponse(ex.Message, 409)); // Otros errores de negocio
        }
        catch (ArgumentException ex) // Para validar si el estado es válido
        {
            return BadRequest(new ApiResponse(ex.Message, 400));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse($"An unexpected error occurred while changing service status: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// Obtiene los servicios ofrecidos por un doctor específico. (Corresponde a Laravel ServiceController::getService)
    /// Usado para poblar dropdowns en la reserva de citas.
    /// </summary>
    /// <param name="appointmentDoctorId">El ID del doctor.</param>
    /// <returns>Una lista de ServiceModel.</returns>
    [HttpGet("by-doctor/{appointmentDoctorId}")] // Ruta: /api/Services/by-doctor/{appointmentDoctorId}
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ServiceModel>>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> GetServicesByDoctor(Guid appointmentDoctorId)
    {
        var services = await _serviceService.GetServicesByDoctorIdAsync(appointmentDoctorId);
        if (services == null || !services.Any())
        {
            return NotFound(new ApiResponse($"No active services found for doctor ID '{appointmentDoctorId}'.", 404));
        }
        return Ok(new ApiResponse<IEnumerable<ServiceModel>>(services, "Services for doctor retrieved successfully"));
    }

    /// <summary>
    /// Obtiene el precio (cargo) de un servicio específico. (Corresponde a Laravel ServiceController::getCharge)
    /// </summary>
    /// <param name="chargeId">El ID del servicio.</param>
    /// <returns>El precio del servicio.</returns>
    [HttpGet("{chargeId}/charge")] // Ruta: /api/Services/{chargeId}/charge
    [ProducesResponseType(typeof(ApiResponse<decimal>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> GetServiceCharge(Guid chargeId)
    {
        var charge = await _serviceService.GetServiceChargeByIdAsync(chargeId);
        if (charge == null)
        {
            return NotFound(new ApiResponse($"Service with ID '{chargeId}' not found or has no price defined.", 404));
        }
        return Ok(new ApiResponse<decimal>(charge.Value, "Service charge retrieved successfully"));
    }
}