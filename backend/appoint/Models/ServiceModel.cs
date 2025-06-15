using System.ComponentModel.DataAnnotations;

namespace appoint.Models;

public class ServiceModel
{
    public Guid Id { get; set; }

    [Required]
    [StringLength(255)]
    public string Name { get; set; }

    public Guid CategoryId { get; set; } // FK a ServiceCategories
    public ServiceCategoryModel? ServiceCategory { get; set; } // Propiedad de navegación

    [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than 0.")]
    public decimal Price { get; set; } // Mapea a 'charges' en Laravel

    [StringLength(60)]
    public string? ShortDescription { get; set; }

    public string Status { get; set; } // Ej. "Active", "Inactive"

    // Opcional: Si tienes iconos de servicio como URLs o rutas
    public string? Icon { get; set; }

    // Propiedad de navegación para los Doctores que ofrecen este servicio
    public ICollection<DoctorModel>? Doctors { get; set; }

    // Campos de auditoría (si tu migración los incluye)
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}