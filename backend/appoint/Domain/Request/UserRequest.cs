using System.ComponentModel.DataAnnotations;

namespace appoint.Domain.Request;
public class UserRequest
{
    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    [StringLength(255)]
    public string Email { get; set; }

    // La contraseña es requerida para la creación, opcional para la actualización
    [StringLength(255, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters long.")]
    public string? Password { get; set; }

    [Required(ErrorMessage = "Role is required.")]
    [StringLength(50)]
    public string Role { get; set; } // Este mapeará a la columna 'Type' en la tabla User también

    [Required(ErrorMessage = "First name is required.")]
    [StringLength(100)]
    public string FirstName { get; set; }

    [Required(ErrorMessage = "Last name is required.")]
    [StringLength(100)]
    public string LastName { get; set; }

    // Campos opcionales para creación/actualización de usuario
    [StringLength(50)]
    public string? Contact { get; set; }

    [StringLength(10)]
    public string? RegionCode { get; set; }

    [StringLength(10)]
    public string? BloodGroup { get; set; }

    [Range(0, 1, ErrorMessage = "Gender must be 0 for Male or 1 for Female.")]
    public int? Gender { get; set; }

    public DateTime? Dob { get; set; } // Fecha de Nacimiento

    // CRÍTICO: Necesitamos el BranchId para crear/actualizar un usuario
    // Ya que cada usuario debe estar asociado a una sucursal.
    [Required(ErrorMessage = "Branch ID is required.")]
    public Guid BranchId { get; set; }
}
