using System.ComponentModel.DataAnnotations;

namespace appoint.Models;

public class SessionWeekDayModel
{
    public Guid Id { get; set; }

    [Required]
    public Guid DoctorSessionId { get; set; }
    public DoctorSessionModel? DoctorSession { get; set; } // Propiedad de navegación

    [Required]
    [Range(0, 6, ErrorMessage = "WeekDay must be between 0 (Sunday) and 6 (Saturday).")]
    public int WeekDay { get; set; } // 0: Domingo, 1: Lunes, ..., 6: Sábado

    [Required]
    public TimeSpan DayStartTime { get; set; } // Hora de inicio para este día específico de la sesión

    [Required]
    public TimeSpan DayEndTime { get; set; } // Hora de fin para este día específico de la sesión
}