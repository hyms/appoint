using System.ComponentModel.DataAnnotations;

namespace appoint.Domain.Request;

public class DoctorCreateRequest
{
    // Campos de Usuario (esenciales para crear la cuenta de usuario)
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

    // Campos específicos de Doctor
    [Range(0, 100, ErrorMessage = "Experience must be between 0 and 100 years.")]
    public int? Experience { get; set; }

    [Required(ErrorMessage = "Specializations are required.")]
    public List<Guid>? SpecializationIds { get; set; } = new List<Guid>(); // Lista de GUIDs de Especializaciones

    [Required(ErrorMessage = "Gender is required.")]
    [Range(0, 1, ErrorMessage = "Gender must be 0 for Male or 1 for Female.")]
    public int Gender { get; set; } // 0: Male, 1: Female

    public string? Contact { get; set; }
    public string? RegionCode { get; set; }
    public string? BloodGroup { get; set; }
    public DateTime? Dob { get; set; }

    // Campos de Dirección (el doctor tiene una dirección)
    [Required(ErrorMessage = "Address line 1 is required.")]
    [StringLength(255)]
    public string Address1 { get; set; }

    [StringLength(255)]
    public string? Address2 { get; set; }

    public Guid? CountryId { get; set; }
    public Guid? StateId { get; set; }
    public Guid? CityId { get; set; }

    [StringLength(20)]
    public string? PostalCode { get; set; }

    // URLs de redes sociales
    [StringLength(255)]
    public string? TwitterUrl { get; set; }
    [StringLength(255)]
    public string? LinkedinUrl { get; set; }
    [StringLength(255)]
    public string? InstagramUrl { get; set; }
}