using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using appoint.Domain; // Asegúrate de que esta referencia sea correcta si defines ApiResponse aquí
using appoint.Models;
using appoint.Services;
using System;
using UserRequest = appoint.Domain.UserRequest; // Añadir para Guid

namespace appoint.Controllers;

[Authorize(Roles = "administrador")] // Asegúrate que este rol (ej. "administrador" o "Admin") coincida exactamente con el valor en tu DB y JWT.
[ApiController]
[Route("[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var users = await _userService.GetAllUsersAsync();
        return Ok(new ApiResponse<IEnumerable<UserModel>>(users, "Users retrieved successfully"));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id) // CAMBIO: int id a Guid id
    {
        var user = await _userService.GetUserByIdAsync(id);
        if (user == null)
        {
            return NotFound(new ApiResponse("User not found", 404));
        }
        return Ok(new ApiResponse<UserModel>(user, "User retrieved successfully"));
    }

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] UserRequest request)
    {
        if (!ModelState.IsValid)
        {
            // Una mejor práctica sería devolver errores de validación específicos
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(new ApiResponse(string.Join("; ", errors), 400));
        }
        
        // Verifica si ya existe un usuario con el mismo email
        // Esto es importante para evitar duplicados, ya que Email es UNIQUE
        var existingUser = await _userService.GetUserByUsernameAsync(request.Username);
        if (existingUser != null)
        {
            return Conflict(new ApiResponse("User with this email already exists", 409));
        }

        var newUser = await _userService.CreateUserAsync(request);
        // CreatedAtAction requiere un objeto anónimo con la propiedad del ID
        return CreatedAtAction(nameof(Get), new { id = newUser.Id }, new ApiResponse<UserModel>(newUser, "User created successfully"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Put(Guid id, [FromBody] UserRequest request) // CAMBIO: int id a Guid id
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(new ApiResponse(string.Join("; ", errors), 400));
        }

        // Antes de actualizar, si el email cambia, verifica que el nuevo email no esté ya en uso por otro usuario
        if (request.Username != null) // Solo si el email se está actualizando
        {
            var userByNewEmail = await _userService.GetUserByUsernameAsync(request.Username);
            if (userByNewEmail != null && userByNewEmail.Id != id)
            {
                return Conflict(new ApiResponse("Another user with this email already exists", 409));
            }
        }

        var updatedUser = await _userService.UpdateUserAsync(id, request);
        if (updatedUser == null)
        {
            return NotFound(new ApiResponse("User not found", 404));
        }
        return Ok(new ApiResponse<UserModel>(updatedUser, "User updated successfully"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id) // CAMBIO: int id a Guid id
    {
        var deleted = await _userService.DeleteUserAsync(id);
        if (!deleted)
        {
            return NotFound(new ApiResponse("User not found", 404));
        }
        return Ok(new ApiResponse("User deleted successfully"));
    }

    // Nuevo endpoint para autenticación (login)
    [AllowAnonymous] // Permitir acceso sin autenticación previa
    [HttpPost("authenticate")] // Ruta específica para la autenticación
    public async Task<IActionResult> Authenticate([FromBody] LoginRequest request)
    {
        // Asumiendo que LoginRequest tiene Email y Password
        if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
        {
            return BadRequest(new ApiResponse("Email and password are required.", 400));
        }

        var user = await _userService.Authenticate(request.Username, request.Password);

        if (user == null)
        {
            return Unauthorized(new ApiResponse("Invalid credentials.", 401));
        }

        var token = _userService.GenerateJwtToken(user);

        // Puedes devolver el token y los datos básicos del usuario
        return Ok(new ApiResponse<AuthenticatedUserResponse>(new AuthenticatedUserResponse
        {
            Id = user.Id,
            Username = user.Username,
            Role = user.Role,
            Token = token
        }, "Authentication successful"));
    }
}
