namespace appoint.Application.Dto;

// DTO para listar visitas de pacientes
public class PatientVisitListDto
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public string PatientFullName { get; set; } = string.Empty;
    public string PatientEmail { get; set; } = string.Empty;
    public string VisitDate { get; set; } = string.Empty; // Formato string
    public string? Description { get; set; }
    public string CreatedAt { get; set; } = string.Empty; // Formato string
}

// DTO para la vista detallada de una visita de paciente
public class PatientVisitDetailDto
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public string PatientFullName { get; set; } = string.Empty;
    public string PatientEmail { get; set; } = string.Empty;
    public DateTime VisitDate { get; set; }
    public string? Description { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
    // Añadir otros campos de detalle si existen en la entidad Visit
}