using System.ComponentModel.DataAnnotations;

namespace appoint.Domain.Request;

public class StaffUpdateRequest
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

    [StringLength(50)]
    public string? Contact { get; set; }

    [Required(ErrorMessage = "Gender is required.")]
    [Range(0, 1, ErrorMessage = "Gender must be 0 for Male or 1 for Female.")]
    public int Gender { get; set; }

    [Required(ErrorMessage = "Role is required.")]
    public Guid RoleId { get; set; } // Se asume que el rol se actualiza por ID

    // No hay campo 'profile' (para archivo) directamente en el DTO, se gestionaría aparte.
    // Contraseña no se incluye aquí, se maneja con UpdateChangePasswordRequest
}