using appoint.Domain.Request;
using appoint.Domain.Response;
using appoint.Models;
using appoint.Repository;

namespace appoint.Services.implement;


public class RoleService : IRoleService
{
    private readonly IRoleRepository _roleRepository;
    // Opcional: Si el IPermissionRepository tuviera más lógica de negocio de permisos.
    // private readonly IPermissionRepository _permissionRepository;

    public RoleService(IRoleRepository roleRepository /*, IPermissionRepository permissionRepository */)
    {
        _roleRepository = roleRepository;
        // _permissionRepository = permissionRepository;
    }

    public async Task<IEnumerable<RoleModel>> GetAllRolesAsync()
    {
        return await _roleRepository.GetAllRolesAsync();
    }

    public async Task<RoleDetailsResponse?> GetRoleDetailsForEditAsync(Guid roleId)
    {
        var role = await _roleRepository.GetRoleByIdAsync(roleId);
        if (role == null)
        {
            return null; // El rol no fue encontrado
        }

        var allPermissions = await _roleRepository.GetAllPermissionsAsync(); // O _permissionRepository.GetAllPermissionsAsync()
        
        // Obtiene los IDs de los permisos actualmente asignados al rol.
        var selectedPermissionIds = role.Permissions?.Select(p => p.Id).ToList() ?? new List<Guid>();

        return new RoleDetailsResponse
        {
            Role = role,
            AllPermissions = allPermissions.ToList(),
            SelectedPermissionIds = selectedPermissionIds
        };
    }

    public async Task<Guid> CreateRoleAsync(RoleRequest request)
    {
        // Crear el modelo de rol para el repositorio
        var newRole = new RoleModel
        {
            Name = request.Name
            // Id se generará en el repositorio
        };

        var roleId = await _roleRepository.AddRoleAsync(newRole);

        // Asignar permisos si se proporcionaron
        if (request.PermissionIds != null && request.PermissionIds.Any())
        {
            await _roleRepository.AssignPermissionsToRoleAsync(roleId, request.PermissionIds);
        }

        return roleId;
    }

    public async Task UpdateRoleAsync(Guid roleId, RoleRequest request)
    {
        var existingRole = await _roleRepository.GetRoleByIdAsync(roleId);
        if (existingRole == null)
        {
            // Podrías lanzar una excepción personalizada aquí, ej. NotFoundException
            throw new Exception("Role not found."); 
        }

        // Actualizar propiedades del rol
        existingRole.Name = request.Name;
        await _roleRepository.UpdateRoleAsync(existingRole);

        // Sincronizar permisos: Remover todos los antiguos y asignar los nuevos.
        // La implementación de AssignPermissionsToRoleAsync ya maneja esto,
        // eliminando los permisos existentes para el rol y reasignando los nuevos.
        await _roleRepository.AssignPermissionsToRoleAsync(roleId, request.PermissionIds);
    }

    public async Task DeleteRoleAsync(Guid roleId)
    {
        var existingRole = await _roleRepository.GetRoleByIdAsync(roleId);
        if (existingRole == null)
        {
            throw new Exception("Role not found.");
        }

        // Validación del rol por defecto (replicando la lógica de Laravel)
        if (await _roleRepository.IsRoleDefaultAsync(roleId))
        {
            throw new InvalidOperationException("Default role cannot be deleted.");
        }

        // Validación si el rol está asignado a usuarios (replicando la lógica de Laravel)
        if (await _roleRepository.HasUsersAssignedAsync(roleId))
        {
            throw new InvalidOperationException("Role cannot be deleted as it is assigned to one or more users.");
        }

        await _roleRepository.DeleteRoleAsync(roleId);
    }
}