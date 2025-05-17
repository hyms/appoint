using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using appoint.Domain;
using appoint.Services;

namespace appoint.Controllers;

[Authorize]
[ApiController]
[Route("[controller]")]
public class ConfigurationController : ControllerBase
{
    private readonly IConfigurationService _configurationService;

    public ConfigurationController(IConfigurationService configurationService)
    {
        _configurationService = configurationService;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var config = await _configurationService.GetConfigurationAsync();
        if (config == null)
        {
            return NotFound(new ApiResponse("Configuration not found", 404));
        }

        return Ok(new ApiResponse<Dictionary<string, string>>(config, "Configuration retrieved successfully"));
    }

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] ConfigurationRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse(ModelState.ToString()!, 400)); // O puedes personalizar el mensaje de error
        }

        await _configurationService.UpdateConfigurationAsync(request);
        return Ok(new ApiResponse("Configuration saved successfully"));
    }

// Ejemplo para un DELETE (asumiendo un controlador con un ID)
    // [HttpDelete("{id}")]
    // public async Task<IActionResult> Delete(int id)
    // {
    //     var deleted = await _miServicio.EliminarRecursoAsync(id);
    //     if (!deleted)
    //     {
    //         return NotFound(new ApiResponse("Resource not found", 404));
    //     }
    //     return Ok(new ApiResponse("Resource deleted successfully"));
    // }
}