using System.Data;

namespace appoint.Infrastructure;

// Interfaz que define las operaciones básicas de acceso a datos
public interface ISqlDataAccess
{
    // Método para cargar datos (lista de objetos)
    Task<IEnumerable<T>> LoadData<T, TU>(string sql, TU parameters);

    // Método para guardar datos (insertar, actualizar, eliminar)
    Task SaveData<T>(string sql, T parameters);

    // NUEVO: Método para obtener la conexión de base de datos directamente.
    // Esto permite usar métodos avanzados de Dapper como QueryMultiple o Query<T1,T2,TReturn>.
    IDbConnection GetConnection();
}