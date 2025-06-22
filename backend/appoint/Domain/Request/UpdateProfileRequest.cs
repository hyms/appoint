using System.ComponentModel.DataAnnotations;

namespace appoint.Domain.Request;

public class UpdateProfileRequest
{
    [Required(ErrorMessage = "First name is required.")]
    [StringLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Last name is required.")]
    [StringLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    [StringLength(255)]
    public string Email { get; set; } = string.Empty;

    [StringLength(50)]
    public string? Contact { get; set; } // Puede ser nulo

    [StringLength(10)]
    public string? RegionCode { get; set; } // Puede ser nulo
    
    // No incluir password aquí, ya que se maneja con ChangePasswordRequest
}