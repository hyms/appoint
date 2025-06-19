namespace appoint.Models;

public class PatientModel
{
    public Guid Id { get; set; } // PK de la tabla Patients
    public Guid UserId { get; set; } // FK a la tabla Users
    
    public UserModel? User { get; set; } // Propiedad de navegación para los datos de Usuario relacionados (contiene BranchId y Branch)

    public string PatientUniqueId { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}