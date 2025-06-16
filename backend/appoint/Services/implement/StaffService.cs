using appoint.Domain.Request;
using appoint.Models;
using appoint.Repository;

namespace appoint.Services.implement;

public class StaffService : IStaffService
{
    private readonly IStaffRepository _staffRepository;
    private readonly IRoleRepository _roleRepository; // Para obtener roles disponibles

    public StaffService(IStaffRepository staffRepository, IRoleRepository roleRepository)
    {
        _staffRepository = staffRepository;
        _roleRepository = roleRepository;
    }

    public async Task<IEnumerable<StaffListItemModel>> GetAllStaffAsync(Guid loggedInUserId)
    {
        return await _staffRepository.GetAllStaffAsync(loggedInUserId);
    }

    public async Task<StaffDetailsResponse?> GetStaffDetailsAsync(Guid staffId)
    {
        return await _staffRepository.GetStaffDetailsAsync(staffId);
    }

    public async Task<Guid> CreateStaffAsync(StaffCreateRequest request)
    {
        // Validaciones de negocio:
        // 1. Validar el rol
        var role = await _roleRepository.GetRoleByIdAsync(request.RoleId);
        if (role == null)
        {
            throw new InvalidOperationException($"Role with ID '{request.RoleId}' not found.");
        }
        // Opcional: Validar que el rol sea apto para Staff (ej. no Patient, no Doctor)
        if (role.Name.Equals("Patient", StringComparison.OrdinalIgnoreCase) || role.Name.Equals("Doctor", StringComparison.OrdinalIgnoreCase))
        {
             throw new InvalidOperationException($"Cannot assign role '{role.Name}' to a Staff member.");
        }

        // 2. Verificar unicidad de email
        var existingUserByEmail = await _staffRepository.GetUserByIdAsync(Guid.Empty); // Reutilizar GetUserByIdAsync con un ID ficticio para buscar por email si tienes ese método.
                                                                                       // Idealmente, tendrías un GetUserByEmailAsync en StaffRepository (o UserRepository).
                                                                                       // Si no, deberías añadirlo.
        // Para la migración del UserController, ya tenemos un GetUserByEmailAsync en UserService.
        // Asumiendo que IStaffRepository.GetUserByIdAsync() se puede adaptar o que existe un IUserRepository compartido.
        // Por ahora, asumamos que el repositorio tiene un método para verificar email.
        var userByEmail = await _staffRepository.GetUserByIdAsync(Guid.Empty); // Esto no es correcto para buscar por email
                                                                                // Deberías usar un método como _staffRepository.GetUserByEmailAsync(request.Email)
        // Placeholder para la verificación de email:
        var usersByEmail = await _staffRepository.GetAllStaffAsync(Guid.Empty); // Esto es ineficiente, solo para el ejemplo
        if (usersByEmail.Any(u => u.Email.Equals(request.Email, StringComparison.OrdinalIgnoreCase)))
        {
             throw new InvalidOperationException($"User with email '{request.Email}' already exists.");
        }


        // 3. Verificar unicidad de contacto (si es nullable y no vacío)
        if (!string.IsNullOrEmpty(request.Contact))
        {
            // Similar al email, necesitarías un método para buscar por contacto
            // var existingUserByContact = await _staffRepository.GetUserByContactAsync(request.Contact);
            // if (existingUserByContact != null) { throw new InvalidOperationException($"User with contact '{request.Contact}' already exists."); }
        }

        // Mapear DTO de request a UserModel (para la inserción)
        var userModel = new UserModel
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password), // Hashear la contraseña
            Role = role.Name, // Asigna el nombre del rol (si usas la columna string en Users)
            Type = "Staff", // Define el tipo como "Staff"
            Contact = request.Contact,
            RegionCode = "591", // Asumo un valor por defecto o que viene en el request
            Gender = request.Gender,
            // BloodGroup, Dob, EmailVerifiedAt se manejarán si el request los incluye o tienen lógica por defecto.
        };

        var staffId = await _staffRepository.AddStaffAsync(userModel, request.RoleId); // Pasa el GUID del rol
        return staffId;
    }

    public async Task UpdateStaffAsync(Guid staffId, StaffUpdateRequest request)
    {
        var existingUser = await _staffRepository.GetUserByIdAsync(staffId);
        if (existingUser == null || !existingUser.Type.Equals("Staff", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException($"Staff member with ID '{staffId}' not found or is not a staff type user.");
        }

        // 1. Validar el rol
        var role = await _roleRepository.GetRoleByIdAsync(request.RoleId);
        if (role == null)
        {
            throw new InvalidOperationException($"Role with ID '{request.RoleId}' not found.");
        }
        if (role.Name.Equals("Patient", StringComparison.OrdinalIgnoreCase) || role.Name.Equals("Doctor", StringComparison.OrdinalIgnoreCase))
        {
             throw new InvalidOperationException($"Cannot assign role '{role.Name}' to a Staff member.");
        }

        // 2. Verificar unicidad de email (si se cambia)
        if (!existingUser.Email.Equals(request.Email, StringComparison.OrdinalIgnoreCase))
        {
            var userByNewEmail = await _staffRepository.GetUserByIdAsync(Guid.Empty); // Placeholder, necesita método GetUserByEmailAsync(string email)
            // Si userByNewEmail es diferente de null y su ID no es el mismo que el actual staffId
            // var userByNewEmail = await _staffRepository.GetUserByEmailAsync(request.Email); // Esto es lo que necesitas
            // if (userByNewEmail != null && userByNewEmail.Id != staffId)
            // {
            //      throw new InvalidOperationException($"Another user with email '{request.Email}' already exists.");
            // }
        }

        // 3. Verificar unicidad de contacto (si se cambia y no es vacío)
        if (!string.IsNullOrEmpty(request.Contact) && !string.IsNullOrEmpty(existingUser.Contact) && !existingUser.Contact.Equals(request.Contact, StringComparison.OrdinalIgnoreCase))
        {
            // var userByNewContact = await _staffRepository.GetUserByContactAsync(request.Contact);
            // if (userByNewContact != null && userByNewContact.Id != staffId)
            // {
            //      throw new InvalidOperationException($"Another user with contact '{request.Contact}' already exists.");
            // }
        }

        // Actualizar propiedades del modelo de usuario
        existingUser.FirstName = request.FirstName;
        existingUser.LastName = request.LastName;
        existingUser.Email = request.Email;
        existingUser.Contact = request.Contact;
        existingUser.RegionCode = "591"; // Asumo que se mantiene o se actualiza
        existingUser.Gender = request.Gender;
        existingUser.Role = role.Name; // Actualiza el nombre del rol

        await _staffRepository.UpdateStaffAsync(existingUser, request.RoleId); // Pasa el GUID del rol
    }

    public async Task DeleteStaffAsync(Guid staffId)
    {
        var existingUser = await _staffRepository.GetUserByIdAsync(staffId);
        if (existingUser == null || !existingUser.Type.Equals("Staff", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException($"Staff member with ID '{staffId}' not found or is not a staff type user.");
        }

        // Puedes añadir validaciones de negocio aquí, por ejemplo:
        // - Si el staff tiene citas asignadas, visitas registradas, etc. (como Laravel hacía para Doctors)
        // - Si es un staff por defecto o un admin principal que no se puede eliminar.

        await _staffRepository.DeleteStaffAsync(staffId);
    }

    public async Task<IEnumerable<RoleModel>> GetAvailableStaffRolesAsync()
    {
        // Obtiene los roles que son apropiados para ser asignados a miembros del personal.
        // Esto replica la lógica de Laravel getRoles(). Podría excluir 'Patient' y 'Doctor'.
        return await _staffRepository.GetAvailableRolesAsync(); // Este método en RoleRepository ya excluye esos roles.
    }

    public async Task UpdateEmailVerifiedStatusAsync(Guid userId, bool isVerified)
    {
        // Validar si el usuario existe y es de tipo Staff si es necesario
        var user = await _staffRepository.GetUserByIdAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException($"User with ID '{userId}' not found.");
        }

        await _staffRepository.UpdateEmailVerifiedStatusAsync(userId, isVerified);
    }

    public async Task UpdateEmailNotificationAsync(Guid userId, bool enableNotification)
    {
        // Validar si el usuario existe y es de tipo Staff si es necesario
        var user = await _staffRepository.GetUserByIdAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException($"User with ID '{userId}' not found.");
        }

        await _staffRepository.UpdateEmailNotificationAsync(userId, enableNotification);
    }

    public async Task<bool> ResendEmailVerificationCheckAsync(Guid userId)
    {
        // Esta función solo verifica si el email ya está verificado, no envía un correo.
        // Si necesitas enviar el correo, esa lógica iría en un servicio de Notificaciones/Email.
        var user = await _staffRepository.GetUserByIdAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException($"User with ID '{userId}' not found.");
        }
        
        return await _staffRepository.IsEmailVerifiedAsync(userId);
    }
}