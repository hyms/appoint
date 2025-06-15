using System.ComponentModel.DataAnnotations;

namespace appoint.Models;

public class QualificationModel
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; } // Asumiendo un FK a la tabla Users
    
    [Required]
    [StringLength(255)]
    public string Name { get; set; } // Ej., "Grado en Medicina", "Residencia"

    [StringLength(255)]
    public string? Institute { get; set; } // Ej., "Universidad Mayor de San Andrés"

    public DateTime? CompletionDate { get; set; } // Ej., "2010-06-30"
}