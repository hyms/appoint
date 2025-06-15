using System.Data;
using Dapper;
using MySqlConnector;

namespace appoint.Infrastructure.Data;

// Implementación concreta que usa Dapper y gestiona la conexión
public class SqlDataAccess : ISqlDataAccess
{
    private readonly IConfiguration _config;
    private readonly string _connectionString;

    public SqlDataAccess(IConfiguration config)
    {
        _config = config;
        // Obtener la cadena de conexión del appsettings.json
        _connectionString = _config.GetConnectionString("DefaultConnection");
        if (string.IsNullOrEmpty(_connectionString))
        {
            throw new InvalidOperationException("La cadena de conexión 'DefaultConnection' no está configurada.");
        }
    }

    // Método para crear y abrir una conexión a la base de datos
    private IDbConnection CreateConnection()
    {
        // Usa MySqlConnection para MySQL, SqlConnection para SQL Server, etc.
        var connection = new MySqlConnection(_connectionString);
        connection.Open(); // Abre la conexión
        return connection;
    }

    public async Task<IEnumerable<T>> LoadData<T, U>(string storedProcedure, U parameters, string connectionId = "DefaultConnection")
    {
        using IDbConnection connection = CreateConnection();
        return await connection.QueryAsync<T>(storedProcedure, parameters, commandType: CommandType.StoredProcedure);
    }

    public async Task SaveData<T>(string storedProcedure, T parameters, string connectionId = "DefaultConnection")
    {
        using IDbConnection connection = CreateConnection();
        await connection.ExecuteAsync(storedProcedure, parameters, commandType: CommandType.StoredProcedure);
    }

    public async Task<int> ExecuteScalar<T>(string storedProcedure, T parameters, string connectionId = "DefaultConnection")
    {
        using IDbConnection connection = CreateConnection();
        return await connection.ExecuteScalarAsync<int>(storedProcedure, parameters, commandType: CommandType.StoredProcedure);
    }

    // Implementaciones de los métodos para SQL directo (sin Stored Procedures)
    public async Task<T> QueryFirstOrDefaultAsync<T, U>(string sql, U parameters, string connectionId = "DefaultConnection")
    {
        using IDbConnection connection = CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<T>(sql, parameters);
    }

    public async Task<IEnumerable<T>> QueryAsync<T, U>(string sql, U parameters, string connectionId = "DefaultConnection")
    {
        using IDbConnection connection = CreateConnection();
        return await connection.QueryAsync<T>(sql, parameters);
    }

    public async Task<int> ExecuteAsync<T>(string sql, T parameters, string connectionId = "DefaultConnection")
    {
        using IDbConnection connection = CreateConnection();
        return await connection.ExecuteAsync(sql, parameters);
    }
}