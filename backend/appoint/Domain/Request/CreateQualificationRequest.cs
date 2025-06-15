using System.ComponentModel.DataAnnotations;

namespace appoint.Domain.Request;

public class CreateQualificationRequest
{
    [Required(ErrorMessage = "User ID is required for qualification.")]
    public Guid UserId { get; set; } // O DoctorId si la calificación está directamente ligada a la tabla Doctor

    [Required(ErrorMessage = "Qualification name is required.")]
    [StringLength(255)]
    public string Name { get; set; }

    [StringLength(255)]
    public string? Institute { get; set; }

    public DateTime? CompletionDate { get; set; }
}