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
    public string PasswordConfirmation { get; set; }

    [StringLength(50)]
    public string? Contact { get; set; }

    [Required(ErrorMessage = "Gender is required.")]
    [Range(0, 1, ErrorMessage = "Gender must be 0 for Male or 1 for Female.")]
    public int Gender { get; set; }

    [Required(ErrorMessage = "Role is required.")]
    public Guid RoleId { get; set; }

    // --- ID DE LA SUCURSAL ASOCIADA ---
    [Required(ErrorMessage = "Branch is required.")]
    public Guid BranchId { get; set; }
}
