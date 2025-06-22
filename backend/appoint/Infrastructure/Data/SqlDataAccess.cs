using System.Data;
using Dapper;
using MySqlConnector;

namespace appoint.Infrastructure.Data;

// Implementación concreta que usa Dapper y gestiona la conexión
public class SqlDataAccess : ISqlDataAccess
{
    private readonly IConfiguration _config;
    private readonly string _connectionStringName = "DefaultConnection"; // Nombre de la cadena de conexión en appsettings.json

    public SqlDataAccess(IConfiguration config)
    {
        _config = config;
    }

    // Método para obtener una conexión a la base de datos
    public IDbConnection GetConnection()
    {
        // Obtener la cadena de conexión del archivo de configuración
        string? connectionString = _config.GetConnectionString(_connectionStringName);
        if (string.IsNullOrEmpty(connectionString))
        {
            throw new InvalidOperationException($"Connection string '{_connectionStringName}' not found.");
        }

        return new MySqlConnection(connectionString);
    }

    // Implementación para cargar una lista de datos
    public async Task<IEnumerable<T>> LoadData<T, TU>(string sql, TU parameters)
    {
        using IDbConnection connection = GetConnection();
        // Dapper mapea automáticamente los resultados a objetos T
        return await connection.QueryAsync<T>(sql, parameters);
    }

    // Implementación para guardar datos (insertar, actualizar, eliminar)
    public async Task<int> SaveData<T>(string sql, T parameters)
    {
        using IDbConnection connection = GetConnection();
        // ExecuteAsync devuelve el número de filas afectadas
        return await connection.ExecuteAsync(sql, parameters);
    }

    // Implementación para obtener el primer o el valor por defecto
    public async Task<T?> QueryFirstOrDefaultAsync<T, TU>(string sql, TU parameters)
    {
        using IDbConnection connection = GetConnection();
        return await connection.QueryFirstOrDefaultAsync<T>(sql, parameters);
    }
}
