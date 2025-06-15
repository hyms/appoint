namespace appoint.Models;

public class ServiceListItemModel
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string? CategoryName { get; set; } // Nombre de la categoría
    public string? Icon { get; set; }
    public string Status { get; set; }
    public decimal Charge { get; set; } // Price del servicio
}