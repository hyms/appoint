using appoint.Models;

namespace appoint.Repository;

public interface IAddressRepository
{
    // Obtener una dirección por su ID
    Task<AddressModel?> GetAddressByIdAsync(Guid addressId);

    // Añadir una nueva dirección
    Task<Guid> AddAddressAsync(AddressModel address);

    // Actualizar una dirección existente
    Task UpdateAddressAsync(AddressModel address);

    // Eliminar una dirección por su ID
    Task DeleteAddressAsync(Guid addressId);
}