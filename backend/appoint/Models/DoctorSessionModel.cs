using System.ComponentModel.DataAnnotations;

namespace appoint.Models;

public class DoctorSessionModel
{
    public Guid Id { get; set; }

    [Required]
    public Guid DoctorId { get; set; }
    public DoctorModel? Doctor { get; set; } // Propiedad de navegación

    [Required]
    [StringLength(255)]
    public string SessionName { get; set; } = string.Empty;

    // Se asume que estos son TimeSpans para las horas de inicio/fin de la sesión global
    [Required]
    public TimeSpan StartTime { get; set; }

    [Required]
    public TimeSpan EndTime { get; set; }

    [Required]
    [Range(0, int.MaxValue, ErrorMessage = "Session meeting time must be a positive integer.")]
    public int SessionMeetingTime { get; set; } // Duración de cada cita dentro de la sesión (ej. 30 minutos)

    [Required]
    [Range(0, int.MaxValue, ErrorMessage = "Session gap must be a positive integer.")]
    public int SessionGap { get; set; } // Intervalo entre citas (ej. 15 minutos)

    public bool IsActive { get; set; } = true; // Por defecto activo

    // Propiedad de navegación para los días de la semana específicos de esta sesión
    public ICollection<SessionWeekDayModel>? SessionWeekDays { get; set; }
}