namespace appoint.Models;

public class RoleModel
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    // Asumo que 'GuardName' no es relevante para el frontend en este modelo de respuesta general.
    // Si necesitas más propiedades, añádelas aquí.

    // Opcional: Para incluir las asignaciones directas de permisos si se requiere en una vista de detalle.
    public ICollection<PermissionModel>? Permissions { get; set; }
}