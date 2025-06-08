namespace appoint.Models;

public class Doctor
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Specialty { get; set; }
    public int LocationId { get; set; } // Opcional: para vincular con una ubicación
}