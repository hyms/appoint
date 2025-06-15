using System.ComponentModel.DataAnnotations;

namespace appoint.Models;


public class ServiceCategoryModel
{
    public Guid Id { get; set; }
    
    [Required]
    [StringLength(255)]
    public string Name { get; set; }
    // Puedes añadir CreatedAt, UpdatedAt si tu migración los incluye.
}