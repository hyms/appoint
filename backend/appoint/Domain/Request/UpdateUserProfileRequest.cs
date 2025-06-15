using System.ComponentModel.DataAnnotations;

namespace appoint.Domain.Request;

public class UpdateUserProfileRequest
{
    // Estos campos deben coincidir con las propiedades de UserModel que puede actualizar un usuario
    [Required(ErrorMessage = "First name is required.")]
    [StringLength(100)]
    public string FirstName { get; set; }

    [Required(ErrorMessage = "Last name is required.")]
    [StringLength(100)]
    public string LastName { get; set; }

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    [StringLength(255)]
    public string Email { get; set; } // Nota: Los cambios de email a menudo requieren verificación

    [StringLength(50)]
    public string? Contact { get; set; }

    [StringLength(10)]
    public string? RegionCode { get; set; }

    [StringLength(10)]
    public string? BloodGroup { get; set; }

    [Range(0, 1, ErrorMessage = "Gender must be 0 for Male or 1 for Female.")]
    public int? Gender { get; set; }

    public DateTime? Dob { get; set; }

    // Idioma (de updateLanguage)
    [StringLength(10)]
    public string? Language { get; set; }

    // Otros campos específicos del perfil como DarkMode, EmailNotification
    public bool? DarkMode { get; set; }
    public bool? EmailNotification { get; set; }
}