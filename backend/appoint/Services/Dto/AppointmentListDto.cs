// MedicalAppointments.Application/DTOs/Appointment/AppointmentFilterDto.cs

using System.ComponentModel.DataAnnotations;

// Para validación
namespace appoint.Application.Dto;

// DTO para listar pacientes en tabla
public class PatientListDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int TotalAppointments { get; set; } // Simulated count
    public DateTime? EmailVerifiedAt { get; set; }
    public string CreatedAt { get; set; } = string.Empty; // Formatted string
}

// DTO para la creación de un paciente
public class CreatePatientRequestDto
{
    [Required(ErrorMessage = "First name is required.")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Last name is required.")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Patient unique ID is required.")]
    [RegularExpression(@"^\S*$", ErrorMessage = "Patient unique ID cannot contain spaces.")]
    public string PatientUniqueId { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    public string Password { get; set; } = string.Empty; // Password for new user

    public string? Contact { get; set; }
    public string? RegionCode { get; set; }
    public int? Gender { get; set; } // 0: Male, 1: Female
    public DateTime? Dob { get; set; } // Date of birth
    public string? BloodGroup { get; set; }

    // Address fields (can be a nested DTO if complex)
    public string? Address1 { get; set; }
    public string? Address2 { get; set; }
    public Guid? CountryId { get; set; }
    public Guid? StateId { get; set; }
    public Guid? CityId { get; set; }
    public string? PostalCode { get; set; }
    public IFormFile? Profile { get; set; } // For profile image upload
}

// DTO para la actualización de un paciente
public class UpdatePatientRequestDto
{
    [Required(ErrorMessage = "First name is required.")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Last name is required.")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Patient unique ID is required.")]
    [RegularExpression(@"^\S*$", ErrorMessage = "Patient unique ID cannot contain spaces.")]
    public string PatientUniqueId { get; set; } = string.Empty; // To check unique, but exclude current ID

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    public string Email { get; set; } = string.Empty;

    public string? Contact { get; set; }
    public string? RegionCode { get; set; }
    public int? Gender { get; set; }
    public DateTime? Dob { get; set; }
    public string? BloodGroup { get; set; }

    // Address fields
    public string? Address1 { get; set; }
    public string? Address2 { get; set; }
    public Guid? CountryId { get; set; }
    public Guid? StateId { get; set; }
    public Guid? CityId { get; set; }
    public string? PostalCode { get; set; }
    public IFormFile? Profile { get; set; } // For profile image upload
}

// DTO para la vista de detalle del paciente
public class PatientDetailDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public string? RegionCode { get; set; }
    public string? Contact { get; set; }
    public int TodayAppointmentCount { get; set; }
    public int UpcomingAppointmentCount { get; set; }
    public int CompletedAppointmentCount { get; set; }
    public string? BloodGroup { get; set; }
    public int? Gender { get; set; }
    public DateTime? Dob { get; set; }
    public string? Address1 { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
    public string ProfileImageUrl { get; set; } = string.Empty; // URL to profile image
}

// DTO para los datos del paciente para edición (edit form pre-fill)
public class PatientForEditDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PatientUniqueId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Contact { get; set; }
    public string? RegionCode { get; set; }
    public int? Gender { get; set; }
    public DateTime? Dob { get; set; }
    public string? BloodGroup { get; set; }
    public string? Address1 { get; set; }
    public string? Address2 { get; set; }
    public string? CountryId { get; set; } // Converted to string for form select
    public string? StateId { get; set; } // Converted to string for form select
    public string? CityId { get; set; } // Converted to string for form select
    public string? PostalCode { get; set; }
}

// DTO para el listado de citas del paciente
public class PatientAppointmentListDto
{
    public Guid Id { get; set; }
    public Guid DoctorId { get; set; }
    public string FullName { get; set; } = string.Empty; // Doctor's full name
    public string DoctorEmail { get; set; } = string.Empty; // Doctor's email
    public string FromTime { get; set; } = string.Empty;
    public string FromTimeType { get; set; } = string.Empty;
    public string ToTime { get; set; } = string.Empty;
    public string ToTimeType { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty; // Formatted date string
    public int Status { get; set; }
}