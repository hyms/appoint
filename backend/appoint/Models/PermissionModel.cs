namespace appoint.Models;

public class PermissionModel
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string GuardName { get; set; } // Campo 'GuardName' de la tabla 'Permissions'
}