using appoint.Domain;
using appoint.Domain.Request;
using appoint.Domain.Response;
using appoint.Models;
using appoint.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace appoint.Controllers;

[Authorize] // Puedes especificar roles si es necesario, ej. [Authorize(Roles = "administrador")]
[ApiController]
[Route("[controller]")] // Esto hará que la ruta base sea /Settings
public class SettingsController : ControllerBase // CAMBIO: Renombrado del controlador
{
    private readonly ISettingsService _settingsService; // CAMBIO: Inyección de ISettingsService

    public SettingsController(ISettingsService settingsService) // CAMBIO: Constructor
    {
        _settingsService = settingsService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAppSettings() // CAMBIO: Nombre del método
    {
        var settings = await _settingsService.GetAppSettingsAsync(); // CAMBIO: Llamada al método del servicio
        // Si no hay configuraciones, podría devolver un diccionario vacío o un error 404 si es un requisito de negocio
        if (settings == null || !settings.Any())
        {
            return NotFound(new ApiResponse("No app settings found", 404));
        }
        return Ok(new ApiResponse<Dictionary<string, string>>(settings, "App settings retrieved successfully"));
    }

    [HttpPut("general")] // Ruta específica para la actualización de configuraciones generales
    public async Task<IActionResult> UpdateGeneralAppSettings([FromBody] AppGeneralSettingsRequest request) // CAMBIO: Tipo de DTO
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(new ApiResponse(string.Join("; ", errors), 400));
        }

        await _settingsService.UpdateAppSettingsAsync(request); // CAMBIO: Llamada al método del servicio
        return Ok(new ApiResponse("App general settings updated successfully"));
    }

    // --- Nuevos Endpoints para gestión individual de settings (opcional, pero recomendado) ---

    [HttpGet("{key}")]
    public async Task<IActionResult> GetSetting(string key)
    {
        var value = await _settingsService.GetSettingByKeyAsync(key);
        if (value == null)
        {
            return NotFound(new ApiResponse($"Setting with key '{key}' not found", 404));
        }
        return Ok(new ApiResponse<string>(value, $"Setting '{key}' retrieved successfully"));
    }

    [HttpPut("{key}")] // Endpoint para actualizar o insertar un setting individual
    public async Task<IActionResult> UpdateSetting(string key, [FromBody] SettingRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(new ApiResponse(string.Join("; ", errors), 400));
        }

        // El servicio UpdateSettingByKeyAsync ya maneja la inserción si la clave no existe.
        var updated = await _settingsService.UpdateSettingByKeyAsync(key, request.Value);
        
        // Si 'updated' es false, significa que el método del servicio no pudo realizar la operación
        // (aunque con la lógica actual de insertar/actualizar, siempre debería ser true si no hay un error de DB).
        if (!updated)
        {
            return StatusCode(500, new ApiResponse("Failed to update or create setting.", 500));
        }
        return Ok(new ApiResponse($"Setting '{key}' updated successfully"));
    }
}

// Asegúrate de que esta clase esté definida en tu carpeta Models o DTOs
// File: appoint.Models/UpdateSettingValueRequest.cs
/*
using System.ComponentModel.DataAnnotations;

namespace appoint.Models;

public class UpdateSettingValueRequest
{
    [Required(ErrorMessage = "Value is required.")]
    public string Value { get; set; }
}
*/