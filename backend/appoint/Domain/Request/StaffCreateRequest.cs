using System.ComponentModel.DataAnnotations;

namespace appoint.Domain.Request;

public class StaffCreateRequest
{
    [Required(ErrorMessage = "First name is required.")]
    [StringLength(100)]
    public string FirstName { get; set; }

    [Required(ErrorMessage = "Last name is required.")]
    [StringLength(100)]
    public string LastName { get; set; }

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    [StringLength(255)]
    public string Email { get; set; }

    [Required(ErrorMessage = "Password is required.")]
    [StringLength(255, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters long.")]
    public string Password { get; set; }

    [Compare("Password", ErrorMessage = "Password and confirmation password do not match.")]
    public string PasswordConfirmation { get; set; } // Para la validación 'same' de Laravel

    [StringLength(50)]
    public string? Contact { get; set; }

    [Required(ErrorMessage = "Gender is required.")]
    [Range(0, 1, ErrorMessage = "Gender must be 0 for Male or 1 for Female.")]
    public int Gender { get; set; } // 0: Male, 1: Female

    [Required(ErrorMessage = "Role is required.")]
    public Guid RoleId { get; set; } // Se asume que el rol se selecciona por ID
    // OJO: Si tu Laravel permitía elegir un 'role' como string directamente,
    // pero tu DB tiene una tabla Roles, es mejor pasar el GUID del rol.

    // No hay campo 'profile' (para archivo) directamente en el DTO, se gestionaría aparte.
}