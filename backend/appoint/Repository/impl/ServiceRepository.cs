using System.Data;
using appoint.Infrastructure;
using appoint.Models;
using Dapper;

namespace appoint.Repository.impl;

public class ServiceRepository : IServiceRepository
{
    private readonly ISqlDataAccess _db;

    public ServiceRepository(ISqlDataAccess db)
    {
        _db = db;
    }

    public async Task<IEnumerable<ServiceListItemModel>> GetAllServiceListItemsAsync(string? statusFilter = null)
    {
        var sql = @"
            SELECT
                s.Id, s.Name, s.Price as Charge, s.Status, s.Icon,
                sc.Name AS CategoryName
            FROM Services s
            LEFT JOIN ServiceCategories sc ON s.CategoryId = sc.Id";

        var parameters = new DynamicParameters();

        if (!string.IsNullOrEmpty(statusFilter) && !statusFilter.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            sql += " WHERE s.Status = @StatusFilter";
            parameters.Add("StatusFilter", statusFilter);
        }

        var services = await _db.LoadData<ServiceListItemModel, DynamicParameters>(sql, parameters);
        return services;
    }

    public async Task<ServiceModel?> GetServiceByIdAsync(Guid serviceId)
    {
        const string sql = @"
            SELECT
                s.Id, s.Name, s.CategoryId, s.Price, s.ShortDescription, s.Status, s.Icon, s.CreatedAt, s.UpdatedAt,
                sc.Id AS CategoryId_Alias, sc.Name AS CategoryName, -- Alias para ServiceCategory
                d.Id AS DoctorId_Alias, u.FirstName, u.LastName, u.Email -- Alias para Doctor y User
            FROM Services s
            LEFT JOIN ServiceCategories sc ON s.CategoryId = sc.Id
            LEFT JOIN ServiceDoctors sd ON s.Id = sd.ServiceId
            LEFT JOIN Doctors d ON sd.DoctorId = d.Id
            LEFT JOIN Users u ON d.UserId = u.Id
            WHERE s.Id = @ServiceId;";

        var serviceDictionary = new Dictionary<Guid, ServiceModel>();

        using (IDbConnection connection = _db.GetConnection())
        {
            var result = await connection.QueryAsync<ServiceModel, ServiceCategoryModel, DoctorModel, ServiceModel>(
                sql,
                (service, serviceCategory, doctor) =>
                {
                    if (!serviceDictionary.TryGetValue(service.Id, out var currentService))
                    {
                        currentService = service;
                        currentService.ServiceCategory = serviceCategory;
                        currentService.Doctors = new List<DoctorModel>();
                        serviceDictionary.Add(currentService.Id, currentService);
                    }

                    if (doctor != null && doctor.Id != Guid.Empty)
                    {
                        // Para evitar duplicados si un doctor puede aparecer varias veces en el join por alguna razón,
                        // o si el DoctorModel incluye Specializations que no queremos cargar aquí.
                        // Solo cargamos el ID, y podríamos obtener los detalles completos del doctor si es necesario.
                        if (!currentService.Doctors!.Any(d => d.Id == doctor.Id))
                        {
                             // Aquí se podría mapear el User del doctor si la consulta trae esos datos
                             doctor.User = new UserModel { FirstName = doctor.User.FirstName, LastName = doctor.User.LastName, Email = doctor.User.Email }; // Mapeo parcial
                            currentService.Doctors!.Add(doctor);
                        }
                    }
                    return currentService;
                },
                param: new { ServiceId = serviceId },
                splitOn: "CategoryId_Alias,DoctorId_Alias" // Puntos de división
            );
        }

        return serviceDictionary.Values.FirstOrDefault();
    }

    public async Task<Guid> AddServiceAsync(ServiceModel service, IEnumerable<Guid>? doctorIds)
    {
        using (IDbConnection connection = _db.GetConnection())
        {
            connection.Open();
            using (var transaction = connection.BeginTransaction())
            {
                try
                {
                    service.Id = Guid.NewGuid();
                    service.CreatedAt = DateTime.UtcNow;
                    service.UpdatedAt = DateTime.UtcNow;

                    const string insertServiceSql = @"
                        INSERT INTO Services (Id, Name, CategoryId, Price, ShortDescription, Status, Icon, CreatedAt, UpdatedAt)
                        VALUES (@Id, @Name, @CategoryId, @Price, @ShortDescription, @Status, @Icon, @CreatedAt, @UpdatedAt)";
                    
                    await connection.ExecuteAsync(insertServiceSql, service, transaction: transaction);

                    // Asignar doctores al servicio
                    await AssignDoctorsToServiceInternalAsync(service.Id, doctorIds, transaction);

                    transaction.Commit();
                    return service.Id;
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
        }
    }

    public async Task UpdateServiceAsync(ServiceModel service, IEnumerable<Guid>? doctorIds)
    {
        using (IDbConnection connection = _db.GetConnection())
        {
            connection.Open();
            using (var transaction = connection.BeginTransaction())
            {
                try
                {
                    service.UpdatedAt = DateTime.UtcNow;
                    const string updateServiceSql = @"
                        UPDATE Services SET
                            Name = @Name, CategoryId = @CategoryId, Price = @Price,
                            ShortDescription = @ShortDescription, Status = @Status, Icon = @Icon, UpdatedAt = @UpdatedAt
                        WHERE Id = @Id";
                    
                    await connection.ExecuteAsync(updateServiceSql, service, transaction: transaction);

                    // Sincronizar doctores asociados al servicio
                    await AssignDoctorsToServiceInternalAsync(service.Id, doctorIds, transaction);

                    transaction.Commit();
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
        }
    }

    public async Task DeleteServiceAsync(Guid serviceId)
    {
        using (IDbConnection connection = _db.GetConnection())
        {
            connection.Open();
            using (var transaction = connection.BeginTransaction())
            {
                try
                {
                    // Eliminar registros en la tabla pivote ServiceDoctors
                    await connection.ExecuteAsync("DELETE FROM ServiceDoctors WHERE ServiceId = @ServiceId", new { ServiceId = serviceId }, transaction: transaction);

                    // Eliminar el servicio
                    await connection.ExecuteAsync("DELETE FROM Services WHERE Id = @ServiceId", new { ServiceId = serviceId }, transaction: transaction);

                    transaction.Commit();
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
        }
    }

    public async Task UpdateServiceStatusAsync(Guid serviceId, string status)
    {
        const string sql = "UPDATE Services SET Status = @Status, UpdatedAt = @UpdatedAt WHERE Id = @ServiceId";
        await _db.SaveData(sql, new { Status = status, UpdatedAt = DateTime.UtcNow, ServiceId = serviceId });
    }

    public async Task<IEnumerable<ServiceModel>> GetServicesByDoctorIdAsync(Guid doctorId)
    {
        // Esta consulta obtiene los servicios que un doctor ofrece
        // Y filtra por el estado del servicio si es necesario (ej. Service::ACTIVE en Laravel)
        const string sql = @"
            SELECT
                s.Id, s.Name, s.CategoryId, s.Price, s.ShortDescription, s.Status, s.Icon, s.CreatedAt, s.UpdatedAt,
                sc.Id AS CategoryId_Alias, sc.Name AS CategoryName
            FROM Services s
            JOIN ServiceDoctors sd ON s.Id = sd.ServiceId
            LEFT JOIN ServiceCategories sc ON s.CategoryId = sc.Id
            WHERE sd.DoctorId = @DoctorId AND s.Status = 'Active'"; // Asumiendo "Active" como el estado activo
        
        var serviceDictionary = new Dictionary<Guid, ServiceModel>();

        using (IDbConnection connection = _db.GetConnection())
        {
            var result = await connection.QueryAsync<ServiceModel, ServiceCategoryModel, ServiceModel>(
                sql,
                (service, serviceCategory) =>
                {
                    if (!serviceDictionary.TryGetValue(service.Id, out var currentService))
                    {
                        currentService = service;
                        currentService.ServiceCategory = serviceCategory;
                        serviceDictionary.Add(currentService.Id, currentService);
                    }
                    return currentService;
                },
                param: new { DoctorId = doctorId },
                splitOn: "CategoryId_Alias"
            );
        }
        return serviceDictionary.Values.ToList();
    }

    public async Task<decimal?> GetServicePriceByIdAsync(Guid serviceId)
    {
        const string sql = "SELECT Price FROM Services WHERE Id = @ServiceId";
        using (var connection = _db.GetConnection())
        {
            return await connection.QueryFirstOrDefaultAsync<decimal?>(sql, new { ServiceId = serviceId });
        }
    }

    public async Task AssignDoctorsToServiceAsync(Guid serviceId, IEnumerable<Guid> doctorIds)
    {
        using (IDbConnection connection = _db.GetConnection())
        {
            connection.Open();
            using (var transaction = connection.BeginTransaction())
            {
                try
                {
                    await AssignDoctorsToServiceInternalAsync(serviceId, doctorIds, transaction);
                    transaction.Commit();
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
        }
    }

    // Método interno para reusar la lógica de asignación de doctores dentro de transacciones
    private async Task AssignDoctorsToServiceInternalAsync(Guid serviceId, IEnumerable<Guid>? doctorIds, IDbTransaction transaction)
    {
        // Eliminar asociaciones existentes para este servicio
        await transaction.Connection.ExecuteAsync("DELETE FROM ServiceDoctors WHERE ServiceId = @ServiceId", new { ServiceId = serviceId }, transaction: transaction);

        if (doctorIds != null && doctorIds.Any())
        {
            var sqlValues = string.Join(",", doctorIds.Select(id => $"('{serviceId}', '{id}')"));
            var insertSql = $"INSERT INTO ServiceDoctors (ServiceId, DoctorId) VALUES {sqlValues}";
            await transaction.Connection.ExecuteAsync(insertSql, transaction: transaction);
        }
    }
}