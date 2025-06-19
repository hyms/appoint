namespace appoint.Models;

public class DoctorModel
{
    public Guid Id { get; set; } // PK de la tabla Doctors
    public Guid UserId { get; set; } // FK a la tabla Users

    // Propiedad de navegación para los datos de Usuario relacionados
    public UserModel? User { get; set; }

    // Otras propiedades específicas de Doctor (asumiendo que existen o se añadirán)
    public int? Experience { get; set; } // Del código Laravel
    
    // URLs de redes sociales (del código Laravel)
    public string? TwitterUrl { get; set; }
    public string? LinkedinUrl { get; set; }
    public string? InstagramUrl { get; set; }

    // Colección para Especializaciones (relación muchos a muchos)
    public ICollection<SpecializationModel>? Specializations { get; set; }

    // Colección para Calificaciones/Títulos (si Qualification es una entidad separada)
    public ICollection<QualificationModel>? Qualifications { get; set; }

    // Estado simplificado del usuario (1 para activo, 0 para inactivo)
    public bool IsActive { get; set; } // Mapeado de user.status == 1
}