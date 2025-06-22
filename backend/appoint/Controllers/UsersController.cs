using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using appoint.Domain; // Asegúrate de que esta referencia sea correcta si defines ApiResponse aquí
using appoint.Models;
using appoint.Services;
using System;
using System.Security.Claims;
using appoint.Domain.Request;
using appoint.Domain.Response;
using UserRequest = appoint.Domain.Request.UserRequest; // Añadir para Guid

namespace appoint.Controllers;

[Authorize(Roles = "administrador")] // Asegúrate que este rol (ej. "administrador" o "Admin") coincida exactamente con el valor en tu DB y JWT.
[ApiController]
[Route("[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UsersController> _logger; // Inyectar ILogger

    public UsersController(IUserService userService, ILogger<UsersController> logger) // Añadir ILogger al constructor
    {
        _userService = userService;
        _logger = logger; // Asignar el logger
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        _logger.LogInformation("Attempting to retrieve all users.");
        try
        {
            var users = await _userService.GetAllUsersAsync();
            _logger.LogInformation("Successfully retrieved {UserCount} users.", users.Count());
            return Ok(new ApiResponse<IEnumerable<UserModel>>(users, "Users retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all users.");
            return StatusCode(500, new ApiResponse($"An unexpected error occurred: {ex.Message}", 500));
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        _logger.LogInformation("Attempting to retrieve user with ID: {UserId}", id);
        try
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                _logger.LogWarning("User with ID: {UserId} not found.", id);
                return NotFound(new ApiResponse("User not found", 404));
            }
            _logger.LogInformation("Successfully retrieved user with ID: {UserId}", id);
            return Ok(new ApiResponse<UserModel>(user, "User retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user with ID: {UserId}", id);
            return StatusCode(500, new ApiResponse($"An unexpected error occurred: {ex.Message}", 500));
        }
    }

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] UserRequest request)
    {
        _logger.LogInformation("Attempting to create a new user with email: {Email}", request.Email);

        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            _logger.LogWarning("Invalid ModelState for user creation: {Errors}", string.Join("; ", errors));
            return BadRequest(new ApiResponse(string.Join("; ", errors), 400));
        }
        
        try
        {
            var existingUser = await _userService.GetUserByEmailAsync(request.Email);
            if (existingUser != null)
            {
                _logger.LogWarning("User creation failed: Email '{Email}' already exists.", request.Email);
                return Conflict(new ApiResponse("User with this email already exists", 409));
            }

            var newUser = await _userService.CreateUserAsync(request);
            _logger.LogInformation("Successfully created new user with ID: {UserId} and email: {Email}", newUser.Id, newUser.Email);
            return CreatedAtAction(nameof(Get), new { id = newUser.Id }, new ApiResponse<UserModel>(newUser, "User created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user with email: {Email}", request.Email);
            return StatusCode(500, new ApiResponse($"An unexpected error occurred: {ex.Message}", 500));
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Put(Guid id, [FromBody] UserRequest request)
    {
        _logger.LogInformation("Attempting to update user with ID: {UserId}. New email: {NewEmail}", id, request.Email);

        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            _logger.LogWarning("Invalid ModelState for user update (ID: {UserId}): {Errors}", id, string.Join("; ", errors));
            return BadRequest(new ApiResponse(string.Join("; ", errors), 400));
        }

        try
        {
            if (request.Email != null)
            {
                var userByNewEmail = await _userService.GetUserByEmailAsync(request.Email);
                if (userByNewEmail != null && userByNewEmail.Id != id)
                {
                    _logger.LogWarning("User update failed (ID: {UserId}): New email '{NewEmail}' already exists for another user (ID: {ExistingUserId}).", id, request.Email, userByNewEmail.Id);
                    return Conflict(new ApiResponse("Another user with this email already exists", 409));
                }
            }

            var updatedUser = await _userService.UpdateUserAsync(id, request);
            if (updatedUser == null)
            {
                _logger.LogWarning("User update failed: User with ID: {UserId} not found.", id);
                return NotFound(new ApiResponse("User not found", 404));
            }
            _logger.LogInformation("Successfully updated user with ID: {UserId}", id);
            return Ok(new ApiResponse<UserModel>(updatedUser, "User updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user with ID: {UserId}", id);
            return StatusCode(500, new ApiResponse($"An unexpected error occurred: {ex.Message}", 500));
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        _logger.LogInformation("Attempting to delete user with ID: {UserId}", id);
        try
        {
            var deleted = await _userService.DeleteUserAsync(id);
            if (!deleted)
            {
                _logger.LogWarning("User deletion failed: User with ID: {UserId} not found.", id);
                return NotFound(new ApiResponse("User not found", 404));
            }
            _logger.LogInformation("Successfully deleted user with ID: {UserId}", id);
            return Ok(new ApiResponse("User deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user with ID: {UserId}", id);
            return StatusCode(500, new ApiResponse($"An unexpected error occurred: {ex.Message}", 500));
        }
    }

    [AllowAnonymous]
    [HttpPost("auth")]
    public async Task<IActionResult> Authenticate([FromBody] LoginRequest request)
    {
        _logger.LogInformation("Authentication attempt for email: {Email}", request.Email);

        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
        {
            _logger.LogWarning("Authentication failed for email '{Email}': Email or password is missing.", request.Email);
            return BadRequest(new ApiResponse("Email and password are required.", 400));
        }

        try
        {
            var user = await _userService.Authenticate(request.Email, request.Password);

            if (user == null)
            {
                _logger.LogWarning("Authentication failed for email '{Email}': Invalid credentials.", request.Email);
                return Unauthorized(new ApiResponse("Invalid credentials.", 401));
            }

            var token = _userService.GenerateJwtToken(user);
            _logger.LogInformation("Authentication successful for user ID: {UserId}", user.Id);

            return Ok(new ApiResponse<AuthenticatedUserResponse>(new AuthenticatedUserResponse
            {
                UserId = user.Id,
                Email = user.Email,
                Role = user.Type, // Aquí mapeas el Type del UserModel al Role del DTO
                Permissions = user.Permissions ?? new List<string>(), // Asumes que user.Permissions existe o es una lista vacía
                Token = token
            }, "Authentication successful"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during authentication for email: {Email}", request.Email);
            return StatusCode(500, new ApiResponse($"An unexpected error occurred during authentication: {ex.Message}", 500));
        }
    }
    
    /// <summary>
    /// Endpoint para que un usuario cambie su propia contraseña.
    /// (Corresponde a Laravel '/change-user-password')
    /// </summary>
    /// <param name="request">DTO con la contraseña actual, nueva y confirmación.</param>
    /// <returns>Mensaje de éxito.</returns>
    [HttpPut("change-password")] // Ruta: /api/Users/change-password
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)] // Bad Request (validación, contraseñas no coinciden)
    [ProducesResponseType(typeof(ApiResponse), 401)] // Unauthorized (contraseña actual incorrecta)
    [ProducesResponseType(typeof(ApiResponse), 404)] // Not Found (usuario no encontrado - poco probable con Authorize)
    [ProducesResponseType(typeof(ApiResponse), 500)] // Internal Server Error
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        // 1. Validar el modelo (data annotations en ChangePasswordRequest)
        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse(ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList(), 400));
        }

        // 2. Obtener el ID del usuario logueado desde el token JWT
        var userIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out Guid userId))
        {
            return Unauthorized(new ApiResponse("User ID not found in token or invalid format.", 401));
        }

        try
        {
            await _userService.ChangePasswordAsync(userId, request);
            return Ok(new ApiResponse("Password changed successfully."));
        }
        catch (UnauthorizedAccessException ex)
        {
            // Captura el error lanzado por el servicio si la contraseña actual es incorrecta
            return Unauthorized(new ApiResponse(ex.Message, 401));
        }
        catch (InvalidOperationException ex)
        {
            // Otros errores de negocio como "usuario no encontrado" (aunque con [Authorize] es raro)
            if (ex.Message.Contains("User not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new ApiResponse(ex.Message, 404));
            }
            return StatusCode(500, new ApiResponse($"An unexpected error occurred: {ex.Message}", 500));
        }
        catch (Exception ex)
        {
            // Captura cualquier otra excepción inesperada
            return StatusCode(500, new ApiResponse($"An unexpected error occurred while changing password: {ex.Message}", 500));
        }
    }
    
     /// <summary>
    /// Obtiene el perfil del usuario actualmente logueado.
    /// (Corresponde a la carga inicial de datos en el frontend 'profile/edit')
    /// </summary>
    /// <returns>UserProfileDetailsResponse con los datos del perfil.</returns>
    [HttpGet("profile")] // Ruta: /api/Users/profile
    [ProducesResponseType(typeof(ApiResponse<UserProfileDetailsResponse>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    [ProducesResponseType(typeof(ApiResponse), 401)]
    [ProducesResponseType(typeof(ApiResponse), 500)]
    public async Task<IActionResult> GetUserProfile()
    {
        var userIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out Guid userId))
        {
            return Unauthorized(new ApiResponse("User ID not found in token or invalid format.", 401));
        }

        try
        {
            var profile = await _userService.GetUserProfileAsync(userId);
            if (profile == null)
            {
                return NotFound(new ApiResponse($"User profile for ID '{userId}' not found.", 404));
            }
            return Ok(new ApiResponse<UserProfileDetailsResponse>(profile, "User profile retrieved successfully."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse($"An unexpected error occurred while retrieving user profile: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// Actualiza el perfil del usuario actualmente logueado.
    /// (Corresponde a Laravel '/profile/update')
    /// </summary>
    /// <param name="request">DTO con los datos actualizados del perfil.</param>
    /// <returns>Mensaje de éxito.</returns>
    [HttpPut("profile")] // Ruta: /api/Users/profile
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    [ProducesResponseType(typeof(ApiResponse), 401)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    [ProducesResponseType(typeof(ApiResponse), 409)] // Conflict (email ya tomado)
    [ProducesResponseType(typeof(ApiResponse), 500)]
    public async Task<IActionResult> UpdateUserProfile([FromBody] UpdateProfileRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse(ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList(), 400));
        }

        var userIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out Guid userId))
        {
            return Unauthorized(new ApiResponse("User ID not found in token or invalid format.", 401));
        }

        try
        {
            await _userService.UpdateUserProfileAsync(userId, request);
            return Ok(new ApiResponse("User profile updated successfully."));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("User not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new ApiResponse(ex.Message, 404));
            }
            if (ex.Message.Contains("Email already taken", StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(new ApiResponse(ex.Message, 409));
            }
            return StatusCode(500, new ApiResponse($"An unexpected error occurred: {ex.Message}", 500));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse($"An unexpected error occurred while updating user profile: {ex.Message}", 500));
        }
    }
}