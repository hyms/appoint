using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using appoint.Domain;
using appoint.Services;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<AuthController> _logger;
    private readonly IPermissionService _permissionService; 

    public AuthController(IUserService userService, ILogger<AuthController> logger,IPermissionService permissionService)
    {
        _userService = userService;
        _logger = logger;
        _permissionService = permissionService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest model)
    {
        _logger.LogInformation($"Attempting login for user: {model.Username}");

        if (!ModelState.IsValid)
        {
            _logger.LogWarning($"Login failed for user: {model.Username} due to invalid model state.");
            return BadRequest(new ApiResponse<object>(ModelState.ToString(), 400));
        }

        var user = await _userService.Authenticate(model.Username, model.Password);

        if (user == null)
        {
            _logger.LogWarning($"Login failed for user: {model.Username} - Invalid credentials.");
            return Unauthorized(new ApiResponse<object>("Invalid credentials", 401));
        }

        var token = _userService.GenerateJwtToken(user);
        _logger.LogInformation($"User: {user.Username} logged in successfully. JWT token generated.");

        // Obtener los permisos del usuario (asumiendo que tienes un servicio para esto)
        var permissions = await _permissionService.GetPermissionsForUserAsync(user.Id);

        
        return Ok(new ApiResponse<object>(new { Token = token, User = user, Permissions = permissions }, "Authentication successful"));
    }
}


