using appoint.Models;

namespace appoint.Repository;

public interface IQualificationRepository
{
    // Obtener todas las calificaciones de un usuario específico
    Task<IEnumerable<QualificationModel>> GetQualificationsByUserIdAsync(Guid userId);

    // Añadir una nueva calificación
    Task<Guid> AddQualificationAsync(QualificationModel qualification);

    // Actualizar una calificación existente
    Task UpdateQualificationAsync(QualificationModel qualification);

    // Eliminar una calificación por su ID
    Task DeleteQualificationAsync(Guid qualificationId);
}