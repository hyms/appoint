using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using appoint.Domain;
using appoint.Models;
using appoint.Services;

namespace appoint.Controllers;

[Authorize(Roles = "administrador")] // Ejemplo: Solo los administradores pueden gestionar usuarios
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
    public async Task<IActionResult> Get(int id)
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
            return BadRequest(new ApiResponse(ModelState.ToString()!, 400));
        }
        var newUser = await _userService.CreateUserAsync(request);
        return CreatedAtAction(nameof(Get), new { id = newUser.Id }, new ApiResponse<UserModel>(newUser, "User created successfully"));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Put(int id, [FromBody] UserRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse(ModelState.ToString()!, 400));
        }
        var updatedUser = await _userService.UpdateUserAsync(id, request);
        if (updatedUser == null)
        {
            return NotFound(new ApiResponse("User not found", 404));
        }
        return Ok(new ApiResponse<UserModel>(updatedUser, "User updated successfully"));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _userService.DeleteUserAsync(id);
        if (!deleted)
        {
            return NotFound(new ApiResponse("User not found", 404));
        }
        return Ok(new ApiResponse("User deleted successfully"));
    }
}