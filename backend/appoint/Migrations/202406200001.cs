using FluentMigrator;
using System;
using BCrypt.Net; // Asegúrate de tener BCrypt.Net-Next instalado para el hashing de contraseñas

namespace appoint.Migrations;

[Migration(202406200001)]
public class InitialDataSeeding : Migration
{
    public override void Up()
    {
        // Define los GUIDs que usarás.
        // Es buena práctica generarlos una vez y usarlos de forma consistente.
        // O puedes usar SystemMethods.NewGuid() directamente en los inserts.

        // GUIDs para la Sucursal
        Guid branchId = Guid.Parse("4383c0f4-5f16-4a4a-9b4f-8e2b8c5f1a23"); // Usa el mismo que en tu script SQL si quieres consistencia
        
        // GUIDs para Roles
        Guid adminRoleId = Guid.Parse("d030c1e8-7a5f-4a0e-8f2c-1a0e8f2c7a5f");
        Guid patientRoleId = Guid.Parse("a1b2c3d4-e5f6-7890-1234-567890abcdef");
        Guid doctorRoleId = Guid.Parse("1a2b3c4d-5e6f-7890-1234-567890abcdef");
        Guid staffRoleId = Guid.Parse("a9e8f7d6-c5b4-3210-fedc-ba9876543210");

        // GUID para el Usuario Admin
        Guid adminUserId = Guid.Parse("e6543210-9876-5432-1fed-cba987654321");

        // Contraseña hasheada para "password"
        string hashedPassword = BCrypt.Net.BCrypt.HashPassword("password");


        // 1. Insertar una Sucursal Inicial
        Insert.IntoTable("Branches").Row(new {
            Id = branchId,
            Name = "Sucursal Principal",
            AddressLine1 = "Av. La Salle #123",
            AddressLine2 = (string)null,
            City = "Santa Cruz de la Sierra",
            State = "Santa Cruz",
            Country = "Bolivia",
            PostalCode = "3300",
            PhoneNumber = "335-5050",
            Email = "info@test.com",
            IsActive = true,
            CreatedAt = SystemMethods.CurrentDateTime,
            UpdatedAt = SystemMethods.CurrentDateTime
        });

        // 2. Insertar Roles Básicos
        Insert.IntoTable("Roles").Row(new { Id = adminRoleId, Name = "Admin" });
        Insert.IntoTable("Roles").Row(new { Id = patientRoleId, Name = "Patient" });
        Insert.IntoTable("Roles").Row(new { Id = doctorRoleId, Name = "Doctor" });
        Insert.IntoTable("Roles").Row(new { Id = staffRoleId, Name = "Staff" });

        // 3. Insertar el Primer Usuario (Administrador)
        Insert.IntoTable("Users").Row(new {
            Id = adminUserId,
            Email = "admin@appoint.com",
            // Username = "admin@appoint.com", // Añadir Username ya que la tabla Users lo tiene NotNullable().Unique()
            PasswordHash = hashedPassword,
            FirstName = "Admin",
            LastName = "User",
            Type = "Admin",
            EmailVerifiedAt = SystemMethods.CurrentDateTime,
            Contact = "777-12345",
            RegionCode = "591",
            BloodGroup = (string)null,
            Gender = (int?)null,
            Dob = (DateTime?)null,
            BranchId = branchId,
            EmailNotificationEnabled = true,
            CreatedAt = SystemMethods.CurrentDateTime,
            UpdatedAt = SystemMethods.CurrentDateTime
        });

        // 4. Asignar el rol 'Admin' al usuario en la tabla pivote UserRoles
        Insert.IntoTable("UserRoles").Row(new {
            UserId = adminUserId,
            RoleId = adminRoleId
        });

        // *** INICIO DE LA MODIFICACIÓN: INSERTAR DATOS INICIALES EN SETTINGS ***
        Insert.IntoTable("Settings").Row(new { Id = Guid.NewGuid(), Key = "clinic_name", Value = "Appoint Clinic" });
        Insert.IntoTable("Settings").Row(new { Id = Guid.NewGuid(), Key = "contact_no", Value = "+59170012345" });
        Insert.IntoTable("Settings").Row(new { Id = Guid.NewGuid(), Key = "email", Value = "info@appointclinic.com" });
        Insert.IntoTable("Settings").Row(new { Id = Guid.NewGuid(), Key = "email_verified", Value = "true" });
        Insert.IntoTable("Settings").Row(new { Id = Guid.NewGuid(), Key = "currency", Value = "BOB" });
        // Puedes añadir más configuraciones iniciales aquí si las necesitas
        // *** FIN DE LA MODIFICACIÓN ***
    }

    public override void Down()
    {
        // El orden inverso de eliminación es importante para no violar FKs
        // Eliminar la asignación de rol primero
        Delete.FromTable("UserRoles").Row(new {
            UserId = Guid.Parse("e6543210-9876-5432-1fed-cba987654321"),
            RoleId = Guid.Parse("d030c1e8-7a5f-4a0e-8f2c-1a0e8f2c7a5f")
        });

        // Eliminar las configuraciones insertadas en la tabla Settings
        Delete.FromTable("Settings").Row(new { Key = "clinic_name" });
        Delete.FromTable("Settings").Row(new { Key = "contact_no" });
        Delete.FromTable("Settings").Row(new { Key = "email" });
        Delete.FromTable("Settings").Row(new { Key = "email_verified" });
        Delete.FromTable("Settings").Row(new { Key = "currency" });

        // Eliminar el usuario
        Delete.FromTable("Users").Row(new { Id = Guid.Parse("e6543210-9876-5432-1fed-cba987654321") });

        // Eliminar los roles (solo si sabes que estos roles fueron creados por esta migración)
        Delete.FromTable("Roles").Row(new { Id = Guid.Parse("d030c1e8-7a5f-4a0e-8f2c-1a0e8f2c7a5f") }); // Admin
        Delete.FromTable("Roles").Row(new { Id = Guid.Parse("a1b2c3d4-e5f6-7890-1234-567890abcdef") }); // Patient
        Delete.FromTable("Roles").Row(new { Id = Guid.Parse("1a2b3c4d-5e6f-7890-1234-567890abcdef") }); // Doctor
        Delete.FromTable("Roles").Row(new { Id = Guid.Parse("a9e8f7d6-c5b4-3210-fedc-ba9876543210") }); // Staff

        // Eliminar la sucursal
        Delete.FromTable("Branches").Row(new { Id = Guid.Parse("4383c0f4-5f16-4a4a-9b4f-8e2b8c5f1a23") });
    }
}
