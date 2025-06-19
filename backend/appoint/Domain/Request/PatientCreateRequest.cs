using System.ComponentModel.DataAnnotations;

namespace appoint.Domain.Request;

public class PatientCreateRequest
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(100, ErrorMessage = "El nombre no puede exceder los 100 caracteres.")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "El apellido es obligatorio.")]
    [StringLength(100, ErrorMessage = "El apellido no puede exceder los 100 caracteres.")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "El email es obligatorio.")]
    [EmailAddress(ErrorMessage = "Formato de email inválido.")]
    [StringLength(255, ErrorMessage = "El email no puede exceder los 255 caracteres.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    [MinLength(6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres.")]
    public string Password { get; set; } = string.Empty;

    [StringLength(50, ErrorMessage = "El número de contacto no puede exceder los 50 caracteres.")]
    public string? Contact { get; set; }

    [StringLength(10, ErrorMessage = "El código de región no puede exceder los 10 caracteres.")]
    public string? RegionCode { get; set; }

    [Range(0, 1, ErrorMessage = "El género debe ser 0 (Masculino) o 1 (Femenino).")]
    public int? Gender { get; set; }

    public DateTime? Dob { get; set; }

    [StringLength(10, ErrorMessage = "El grupo sanguíneo no puede exceder los 10 caracteres.")]
    public string? BloodGroup { get; set; }

    [Required(ErrorMessage = "El ID único del paciente es obligatorio.")]
    [StringLength(50, ErrorMessage = "El ID único del paciente no puede exceder los 50 caracteres.")]
    [RegularExpression(@"^\S*$", ErrorMessage = "El ID único del paciente no debe contener espacios.")]
    public string PatientUniqueId { get; set; } = string.Empty;

    // --- ID DE LA SUCURSAL ASOCIADA ---
    [Required(ErrorMessage = "La sucursal es obligatoria.")]
    public Guid BranchId { get; set; }
}