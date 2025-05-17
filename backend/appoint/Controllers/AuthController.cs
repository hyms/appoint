using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using appoint.Domain;
using appoint.Services;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;

    public AuthController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest model)
    {
        var user = await _userService.Authenticate(model.Username, model.Password);

        if (user == null)
        {
            return Unauthorized(new { message = "Credenciales incorrectas." });
        }

        // Generar token JWT
        var token = _userService.GenerateJwtToken(user);

        return Ok(new { token });
    }
}


