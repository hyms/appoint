namespace appoint.Models;

public class DoctorModel
{
    public Guid Id { get; set; } // PK de la tabla Doctors
    public Guid UserId { get; set; } // FK a la tabla Users

    public UserModel? User { get; set; } // Propiedad de navegación para los datos de Usuario relacionados (contiene BranchId y Branch)

    public int? Experience { get; set; }
    public string? TwitterUrl { get; set; }
    public string? LinkedinUrl { get; set; }
    public string? InstagramUrl { get; set; }

    public ICollection<SpecializationModel>? Specializations { get; set; }
    public ICollection<QualificationModel>? Qualifications { get; set; }

    public bool IsActive { get; set; }
}