using System.Data;
using Dapper;
using MySqlConnector;

namespace appoint.Infrastructure.Data;

// Implementación concreta que usa Dapper y gestiona la conexión
public class SqlDataAccess : ISqlDataAccess
{
    private readonly IConfiguration _config;
    private readonly string _connectionStringName;

    public SqlDataAccess(IConfiguration config)
    {
        _config = config;
        // Asumiendo que tu cadena de conexión se llama "DefaultConnection" en appsettings.json
        _connectionStringName = "DefaultConnection"; 
    }

    // NUEVO: Implementación del método GetConnection()
    public IDbConnection GetConnection()
    {
        string connectionString = _config.GetConnectionString(_connectionStringName);
        // Asegúrate de usar la clase de conexión correcta para tu base de datos
        return new MySqlConnection(connectionString); // O new NpgsqlConnection(connectionString), etc.
    }

    public async Task<IEnumerable<T>> LoadData<T, TU>(string sql, TU parameters)
    {
        using (IDbConnection connection = GetConnection()) // Usa GetConnection() aquí también
        {
            return await connection.QueryAsync<T>(sql, parameters);
        }
    }

    public async Task SaveData<T>(string sql, T parameters)
    {
        using (IDbConnection connection = GetConnection()) // Usa GetConnection() aquí también
        {
            await connection.ExecuteAsync(sql, parameters);
        }
    }
}