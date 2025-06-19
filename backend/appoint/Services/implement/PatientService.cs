using appoint.Domain.Request;
using appoint.Domain.Response;
using appoint.Models;
using appoint.Repository;

namespace appoint.Services.implement;

public class PatientService : IPatientService
{
    private readonly IPatientRepository _patientRepository;
    private readonly IBranchRepository _branchRepository; // Para validar la existencia de la sucursal
    private readonly IRoleRepository _roleRepository; // Para buscar el GUID del rol 'Patient'

    public PatientService(IPatientRepository patientRepository, IBranchRepository branchRepository, IRoleRepository roleRepository)
    {
        _patientRepository = patientRepository;
        _branchRepository = branchRepository;
        _roleRepository = roleRepository;
    }

    public async Task<IEnumerable<PatientListItemModel>> GetAllPatientsAsync()
    {
        return await _patientRepository.GetAllPatientListItemsAsync();
    }

    public async Task<PatientDetailsResponse?> GetPatientDetailsAsync(Guid patientId, Guid loggedInUserId)
    {
        // El repositorio ya carga el PatientModel con el UserModel y BranchModel anidados.
        var patientModel = await _patientRepository.GetPatientByIdAsync(patientId);

        if (patientModel == null || patientModel.User == null || patientModel.User.Branch == null)
        {
            return null; // Paciente no encontrado o datos incompletos
        }

        // Lógica de validación de Laravel: Si es doctor, solo puede ver pacientes con cita.
        // Esto debería ir en el controlador o en un servicio de autorización.
        // Aquí solo completamos los contadores de citas que el repositorio ya obtiene.
        
        // Obtener contadores de citas directamente del repositorio
        // El PatientRepository ya implementa las funciones de conteo, pero aquí las invocamos para el DTO.
        // NOTA: Para replicar exactamente, necesitaríamos los conteos por separado si el GetPatientByIdAsync no los trae.
        // Simplificación: Estos contadores pueden ser calculados en el repositorio GetPatientDetailsAsync o en el servicio.
        // Por ahora, asumimos que el repositorio puede traer esta información o que la calculamos aquí.
        var todayAppointmentCount = await _patientRepository.GetPatientAppointmentsAsync(patientId, startDate: DateTime.Today, endDate: DateTime.Today);
        var upcomingAppointmentCount = await _patientRepository.GetPatientAppointmentsAsync(patientId, startDate: DateTime.Today.AddDays(1), endDate: DateTime.MaxValue); // Fecha futura
        var completedAppointmentCount = await _patientRepository.GetPatientAppointmentsAsync(patientId, endDate: DateTime.Today.AddDays(-1)); // Fecha pasada
        
        // Mapear a PatientDetailsResponse
        return new PatientDetailsResponse
        {
            Id = patientModel.Id,
            UserId = patientModel.UserId,
            RoleName = patientModel.User.Role, 
            FullName = patientModel.User.FullName,
            Email = patientModel.User.Email,
            RegionCode = patientModel.User.RegionCode,
            Contact = patientModel.User.Contact,
            TodayAppointmentCount = todayAppointmentCount.Count(),
            UpcomingAppointmentCount = upcomingAppointmentCount.Count(),
            CompletedAppointmentCount = completedAppointmentCount.Count(),
            BloodGroup = patientModel.User.BloodGroup,
            Gender = patientModel.User.Gender,
            Dob = patientModel.User.Dob,
            BranchId = patientModel.User.BranchId,
            BranchName = patientModel.User.Branch.Name,
            BranchAddress1 = patientModel.User.Branch.AddressLine1, 
            CreatedAt = patientModel.User.CreatedAt,
            UpdatedAt = patientModel.User.UpdatedAt 
        };
    }

    public async Task<PatientCreationDataResponse> GetPatientCreationDataAsync()
    {
        // Esto correspondería al método prepareData() del PatientRepository de Laravel.
        // En .NET, podría traer todas las sucursales disponibles para el dropdown.
        var branches = await _branchRepository.GetAllBranchesAsync();
        return new PatientCreationDataResponse
        {
            AvailableBranches = branches.ToList()
        };
    }

    public async Task<Guid> CreatePatientAsync(PatientCreateRequest request)
    {
        // Validaciones de negocio:
        // 1. Verificar si la sucursal existe
        var branch = await _branchRepository.GetBranchByIdAsync(request.BranchId);
        if (branch == null)
        {
            throw new InvalidOperationException($"Branch with ID '{request.BranchId}' not found.");
        }

        // 2. Verificar unicidad de email
        var existingUserByEmail = await _patientRepository.GetUserByEmailAsync(request.Email);
        if (existingUserByEmail != null)
        {
            throw new InvalidOperationException($"User with email '{request.Email}' already exists.");
        }

        // 3. Verificar unicidad de contacto (si es proporcionado)
        if (!string.IsNullOrEmpty(request.Contact))
        {
            var existingUserByContact = await _patientRepository.GetUserByContactAsync(request.Contact);
            if (existingUserByContact != null)
            {
                throw new InvalidOperationException($"User with contact '{request.Contact}' already exists.");
            }
        }

        // 4. Verificar unicidad de patient_unique_id
        var existingPatientByUniqueId = await _patientRepository.GetPatientByUniqueIdAsync(request.PatientUniqueId);
        if (existingPatientByUniqueId != null)
        {
            throw new InvalidOperationException($"Patient with unique ID '{request.PatientUniqueId}' already exists.");
        }

        // Mapear DTO de request a UserModel
        var userModel = new UserModel
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            PasswordHash = request.Password, // Se hasheará en el repositorio
            Contact = request.Contact,
            RegionCode = request.RegionCode,
            Gender = request.Gender,
            Dob = request.Dob,
            BloodGroup = request.BloodGroup,
            BranchId = request.BranchId, // Asigna el BranchId
            // Otros campos de UserModel se establecerán con valores por defecto en el repositorio (Type='Patient', Role='Patient', etc.)
        };

        // Mapear DTO de request a PatientModel
        var patientModel = new PatientModel
        {
            PatientUniqueId = request.PatientUniqueId
            // UserId se asignará en el repositorio
        };

        var patientId = await _patientRepository.AddPatientAsync(patientModel, userModel);
        return patientId;
    }

    public async Task UpdatePatientAsync(Guid patientId, PatientUpdateRequest request)
    {
        // Obtener el paciente existente y su usuario asociado
        var existingPatient = await _patientRepository.GetPatientByIdAsync(patientId);
        if (existingPatient == null || existingPatient.User == null)
        {
            throw new InvalidOperationException($"Patient with ID '{patientId}' not found.");
        }

        var existingUser = existingPatient.User;

        // Validaciones de negocio para la actualización:
        // 1. Verificar si la sucursal existe (si se cambió)
        if (existingUser.BranchId != request.BranchId)
        {
            var branch = await _branchRepository.GetBranchByIdAsync(request.BranchId);
            if (branch == null)
            {
                throw new InvalidOperationException($"Branch with ID '{request.BranchId}' not found.");
            }
        }

        // 2. Verificar unicidad de email (si se cambió)
        if (!existingUser.Email.Equals(request.Email, StringComparison.OrdinalIgnoreCase))
        {
            var userByNewEmail = await _patientRepository.GetUserByEmailAsync(request.Email);
            if (userByNewEmail != null && userByNewEmail.Id != existingUser.Id)
            {
                throw new InvalidOperationException($"Another user with email '{request.Email}' already exists.");
            }
        }

        // 3. Verificar unicidad de contacto (si se cambió y no es vacío)
        if (!string.IsNullOrEmpty(request.Contact) && !string.IsNullOrEmpty(existingUser.Contact) && !existingUser.Contact.Equals(request.Contact, StringComparison.OrdinalIgnoreCase))
        {
            var userByNewContact = await _patientRepository.GetUserByContactAsync(request.Contact);
            if (userByNewContact != null && userByNewContact.Id != existingUser.Id)
            {
                throw new InvalidOperationException($"Another user with contact '{request.Contact}' already exists.");
            }
        }

        // 4. Verificar unicidad de patient_unique_id (si se cambió)
        if (!existingPatient.PatientUniqueId.Equals(request.PatientUniqueId, StringComparison.OrdinalIgnoreCase))
        {
            var patientByNewUniqueId = await _patientRepository.GetPatientByUniqueIdAsync(request.PatientUniqueId);
            if (patientByNewUniqueId != null && patientByNewUniqueId.Id != patientId)
            {
                throw new InvalidOperationException($"Another patient with unique ID '{request.PatientUniqueId}' already exists.");
            }
        }
        
        // Actualizar propiedades del modelo de usuario
        existingUser.FirstName = request.FirstName;
        existingUser.LastName = request.LastName;
        existingUser.Email = request.Email;
        existingUser.Contact = request.Contact;
        existingUser.RegionCode = request.RegionCode;
        existingUser.Gender = request.Gender;
        existingUser.Dob = request.Dob;
        existingUser.BloodGroup = request.BloodGroup;
        existingUser.BranchId = request.BranchId; // Actualiza el BranchId

        // Actualizar propiedades del modelo de paciente
        existingPatient.PatientUniqueId = request.PatientUniqueId;

        await _patientRepository.UpdatePatientAsync(existingPatient, existingUser);
    }

    public async Task DeletePatientAsync(Guid patientId)
    {
        var existingPatient = await _patientRepository.GetPatientByIdAsync(patientId);
        if (existingPatient == null)
        {
            throw new InvalidOperationException($"Patient with ID '{patientId}' not found.");
        }

        // Validaciones de negocio antes de eliminar (replicando Laravel)
        // Appointment::CANCELLED, Appointment::CHECK_OUT (ej. 3 y 4)
        var excludedStatuses = new[] { 3, 4 }; // Confirmar estos valores de tu DB/Enum
        var hasPendingAppointments = await _patientRepository.HasPendingAppointmentsAsync(patientId, excludedStatuses);
        var hasVisits = await _patientRepository.HasVisitsAsync(patientId);

        if (hasPendingAppointments || hasVisits)
        {
            throw new InvalidOperationException("Patient cannot be deleted as there are existing active appointments or visits.");
        }

        await _patientRepository.DeletePatientAsync(patientId);
    }

    public async Task<IEnumerable<PatientAppointmentListItemModel>> GetPatientAppointmentsAsync(
        Guid patientId,
        string? statusFilter = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        Guid? loggedInDoctorId = null)
    {
        // Validación de existencia del paciente si es requerida antes de obtener las citas
        var patientExists = await _patientRepository.GetPatientByIdAsync(patientId) != null;
        if (!patientExists)
        {
            throw new InvalidOperationException($"Patient with ID '{patientId}' not found.");
        }

        // Lógica de Laravel: si el usuario logueado es un doctor, solo muestra sus propias citas.
        // Esta lógica debe estar más arriba en el controlador o en un servicio de autorización para obtener loggedInDoctorId.
        // Aquí solo pasamos el loggedInDoctorId al repositorio.

        return await _patientRepository.GetPatientAppointmentsAsync(patientId, statusFilter, startDate, endDate, loggedInDoctorId);
    }
}

// DTO para la respuesta de datos para la creación de pacientes
public class PatientCreationDataResponse
{
    public List<BranchModel> AvailableBranches { get; set; } = new List<BranchModel>();
    // Puedes añadir otras listas aquí si se necesitan para dropdowns, ej. grupos sanguíneos, géneros, etc.
}