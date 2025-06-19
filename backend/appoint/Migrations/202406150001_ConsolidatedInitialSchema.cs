using FluentMigrator;
using System;

namespace appoint.Migrations;

[Migration(20240615001)] // Mantén la misma estampilla de tiempo si no quieres un nuevo archivo de migración
public class ConsolidatedInitialSchema : Migration
{
    public override void Up()
    {
        // 1. Crear tabla 'Branches' PRIMERO, ya que 'Users' depende de ella.
        Create.Table("Branches")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("Name").AsString(255).NotNullable().Unique()
            .WithColumn("AddressLine1").AsString(255).NotNullable()
            .WithColumn("AddressLine2").AsString(255).Nullable()
            .WithColumn("City").AsString(100).NotNullable()
            .WithColumn("State").AsString(100).NotNullable()
            .WithColumn("Country").AsString(100).NotNullable()
            .WithColumn("PostalCode").AsString(20).Nullable()
            .WithColumn("PhoneNumber").AsString(50).Nullable()
            .WithColumn("Email").AsString(225).Nullable()
            .WithColumn("IsActive").AsBoolean().NotNullable().WithDefaultValue(true)
            .WithColumn("CreatedAt").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("UpdatedAt").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentDateTime);

        // 2. Crear tabla 'Users' (ahora 'Branches' ya existe)
        Create.Table("Users")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("Username").AsString(255).NotNullable().Unique()
            .WithColumn("PasswordHash").AsString(255).NotNullable()
            // .WithColumn("Role").AsString(50).NotNullable() // ELIMINADA: Rol gestionado por UserRoles
            .WithColumn("FirstName").AsString(100).NotNullable()
            .WithColumn("LastName").AsString(100).NotNullable()
            .WithColumn("Type").AsString(50).NotNullable() // Tipo de usuario (Admin, Doctor, Patient, Staff)
            .WithColumn("EmailVerifiedAt").AsDateTime().Nullable()
            .WithColumn("Contact").AsString(50).Nullable()
            .WithColumn("RegionCode").AsString(10).Nullable()
            .WithColumn("BloodGroup").AsString(10).Nullable()
            .WithColumn("Gender").AsInt32().Nullable()
            .WithColumn("Dob").AsDateTime().Nullable()
            .WithColumn("BranchId").AsGuid().NotNullable() // Cada usuario debe estar relacionado a una sucursal
            .ForeignKey("FK_Users_BranchId_Branches_Id", "Branches", "Id") // Clave Foránea
            .WithColumn("EmailNotificationEnabled").AsBoolean().NotNullable().WithDefaultValue(true) // Añadida en discusión previa
            .WithColumn("CreatedAt").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("UpdatedAt").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentDateTime);

        // 3. Crear tablas de Roles y Permisos
        Create.Table("Roles")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("Name").AsString(255).NotNullable().Unique();

        Create.Table("Permissions")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("Name").AsString(255).NotNullable().Unique()
            .WithColumn("GuardName").AsString(255).NotNullable().WithDefaultValue("web");

        Create.Table("RolePermissions")
            .WithColumn("RoleId").AsGuid().NotNullable()
            .WithColumn("PermissionId").AsGuid().NotNullable();

        Create.PrimaryKey("PK_RolePermissions")
            .OnTable("RolePermissions")
            .Columns("RoleId", "PermissionId");

        Create.ForeignKey("FK_RolePermissions_RoleId_Roles_Id")
            .FromTable("RolePermissions").InSchema("dbo").ForeignColumn("RoleId")
            .ToTable("Roles").InSchema("dbo").PrimaryColumn("Id");

        Create.ForeignKey("FK_RolePermissions_PermissionId_Permissions_Id")
            .FromTable("RolePermissions").InSchema("dbo").ForeignColumn("PermissionId")
            .ToTable("Permissions").InSchema("dbo").PrimaryColumn("Id");
            
        // 4. Crear la tabla pivote UserRoles (depende de Users y Roles)
        Create.Table("UserRoles")
            .WithColumn("UserId").AsGuid().NotNullable()
            .WithColumn("RoleId").AsGuid().NotNullable();

        Create.PrimaryKey("PK_UserRoles")
            .OnTable("UserRoles")
            .Columns("UserId", "RoleId");

        Create.ForeignKey("FK_UserRoles_UserId_Users_Id")
            .FromTable("UserRoles").InSchema("dbo").ForeignColumn("UserId")
            .ToTable("Users").InSchema("dbo").PrimaryColumn("Id");

        Create.ForeignKey("FK_UserRoles_RoleId_Roles_Id")
            .FromTable("UserRoles").InSchema("dbo").ForeignColumn("RoleId")
            .ToTable("Roles").InSchema("dbo").PrimaryColumn("Id");

        // 5. Crear tabla de Especializaciones (antes que DoctorSpecializations)
        Create.Table("Specializations")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("Name").AsString(255).NotNullable().Unique();

        // 6. Crear tabla ServiceCategories (MOVIDA AQUÍ - ANTES DE SERVICES)
        Create.Table("ServiceCategories")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("Name").AsString(255).NotNullable().Unique();

        // 7. Crear tablas de Pacientes y Doctores
        Create.Table("Patients")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("UserId").AsGuid().NotNullable().Unique()
            .ForeignKey("FK_Patients_UserId_Users_Id", "Users", "Id")
            .WithColumn("PatientUniqueId").AsString(50).NotNullable().Unique();

        Create.Table("Doctors")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("UserId").AsGuid().NotNullable().Unique()
            .ForeignKey("FK_Doctors_UserId_Users_Id", "Users", "Id");
            // .WithColumn("Specialization").AsString(255).Nullable(); // ELIMINADA: Usar DoctorSpecializations

        // 8. Crear tabla pivote DoctorSpecializations (depende de Doctors y Specializations)
        Create.Table("DoctorSpecializations")
            .WithColumn("DoctorId").AsGuid().NotNullable()
            .WithColumn("SpecializationId").AsGuid().NotNullable();

        Create.PrimaryKey("PK_DoctorSpecializations")
            .OnTable("DoctorSpecializations")
            .Columns("DoctorId", "SpecializationId");

        Create.ForeignKey("FK_DoctorSpecializations_DoctorId_Doctors_Id")
            .FromTable("DoctorSpecializations").InSchema("dbo").ForeignColumn("DoctorId")
            .ToTable("Doctors").InSchema("dbo").PrimaryColumn("Id");

        Create.ForeignKey("FK_DoctorSpecializations_SpecializationId_Specializations_Id")
            .FromTable("DoctorSpecializations").InSchema("dbo").ForeignColumn("SpecializationId")
            .ToTable("Specializations").InSchema("dbo").PrimaryColumn("Id");

        // 9. Crear tabla de Servicios (AHORA CategoryId puede referenciar a ServiceCategories)
        Create.Table("Services")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("Name").AsString(255).NotNullable().Unique()
            .WithColumn("Price").AsDecimal(18, 2).NotNullable()
            .WithColumn("Status").AsString(50).NotNullable().WithDefaultValue("Active")
            .WithColumn("CategoryId").AsGuid().Nullable() // Añadido para serviceCategory
            .ForeignKey("FK_Services_CategoryId_ServiceCategories_Id", "ServiceCategories", "Id") // FK ahora válida
            .WithColumn("ShortDescription").AsString(int.MaxValue).Nullable() // Añadido de ServiceController
            .WithColumn("Icon").AsString(255).Nullable(); // Añadido de ServiceController

        // 10. Crear tabla pivote ServiceDoctors (depende de Services y Doctors)
        Create.Table("ServiceDoctors")
            .WithColumn("ServiceId").AsGuid().NotNullable()
            .WithColumn("DoctorId").AsGuid().NotNullable();

        Create.PrimaryKey("PK_ServiceDoctors")
            .OnTable("ServiceDoctors")
            .Columns("ServiceId", "DoctorId");

        Create.ForeignKey("FK_ServiceDoctors_ServiceId_Services_Id")
            .FromTable("ServiceDoctors").InSchema("dbo").ForeignColumn("ServiceId")
            .ToTable("Services").InSchema("dbo").PrimaryColumn("Id");

        Create.ForeignKey("FK_ServiceDoctors_DoctorId_Doctors_Id")
            .FromTable("ServiceDoctors").InSchema("dbo").ForeignColumn("DoctorId")
            .ToTable("Doctors").InSchema("dbo").PrimaryColumn("Id");

        // 11. Crear tabla de Citas
        Create.Table("Appointments")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("AppointmentUniqueId").AsString(50).NotNullable().Unique()
            .WithColumn("PatientId").AsGuid().NotNullable()
                .ForeignKey("FK_Appointments_PatientId_Patients_Id", "Patients", "Id")
            .WithColumn("DoctorId").AsGuid().NotNullable()
                .ForeignKey("FK_Appointments_DoctorId_Doctors_Id", "Doctors", "Id")
            .WithColumn("ServiceId").AsGuid().NotNullable()
                .ForeignKey("FK_Appointments_ServiceId_Services_Id", "Services", "Id")
            .WithColumn("Date").AsDate().NotNullable()
            .WithColumn("FromTime").AsTime().NotNullable()
            .WithColumn("ToTime").AsTime().NotNullable()
            .WithColumn("Status").AsInt32().NotNullable()
            .WithColumn("PayableAmount").AsDecimal(18, 2).NotNullable()
            .WithColumn("PaymentType").AsInt32().NotNullable()
            .WithColumn("PaymentMethod").AsInt32().Nullable()
            .WithColumn("CreatedAt").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("UpdatedAt").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentDateTime);

        // 12. Crear tabla de Días Feriados del Doctor
        Create.Table("DoctorHolidays")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("DoctorId").AsGuid().NotNullable()
                .ForeignKey("FK_DoctorHolidays_DoctorId_Doctors_Id", "Doctors", "Id")
            .WithColumn("StartDate").AsDate().NotNullable()
            .WithColumn("EndDate").AsDate().NotNullable()
            .WithColumn("Reason").AsString(500).Nullable();

        // 13. Crear tabla de Sesiones del Doctor
        Create.Table("DoctorSessions")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("DoctorId").AsGuid().NotNullable()
                .ForeignKey("FK_DoctorSessions_DoctorId_Doctors_Id", "Doctors", "Id")
            .WithColumn("SessionName").AsString(255).NotNullable()
            .WithColumn("StartTime").AsTime().NotNullable()
            .WithColumn("EndTime").AsTime().NotNullable()
            .WithColumn("IsActive").AsBoolean().NotNullable().WithDefaultValue(true);

        // 14. Crear tabla de Días de Semana de Sesión
        Create.Table("SessionWeekDays")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("DoctorSessionId").AsGuid().NotNullable()
                .ForeignKey("FK_SessionWeekDays_DoctorSessionId_DoctorSessions_Id", "DoctorSessions", "Id")
            .WithColumn("WeekDay").AsInt32().NotNullable()
            .WithColumn("DayStartTime").AsTime().NotNullable()
            .WithColumn("DayEndTime").AsTime().NotNullable();

        Create.UniqueConstraint("UQ_SessionWeekDays_DoctorSessionId_WeekDay")
            .OnTable("SessionWeekDays")
            .Columns("DoctorSessionId", "WeekDay");

        // 15. Crear tabla de Notificaciones
        Create.Table("Notifications")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("UserId").AsGuid().NotNullable()
                .ForeignKey("FK_Notifications_UserId_Users_Id", "Users", "Id")
            .WithColumn("Title").AsString(500).NotNullable()
            .WithColumn("Type").AsInt32().NotNullable()
            .WithColumn("IsRead").AsBoolean().NotNullable().WithDefaultValue(false)
            .WithColumn("CreatedAt").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentDateTime);

        // 16. Crear tabla de Prescripciones
        Create.Table("Prescriptions")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("PatientId").AsGuid().NotNullable()
                .ForeignKey("FK_Prescriptions_PatientId_Patients_Id", "Patients", "Id")
            .WithColumn("DoctorId").AsGuid().NotNullable()
                .ForeignKey("FK_Prescriptions_DoctorId_Doctors_Id", "Doctors", "Id")
            .WithColumn("AppointmentId").AsGuid().Nullable()
                .ForeignKey("FK_Prescriptions_AppointmentId_Appointments_Id", "Appointments", "Id")
            .WithColumn("PrescriptionDate").AsDate().NotNullable()
            .WithColumn("MedicineDetails").AsString(1000).NotNullable()
            .WithColumn("Dosage").AsString(255).Nullable()
            .WithColumn("Frequency").AsString(255).Nullable()
            .WithColumn("Notes").AsString(2000).Nullable()
            .WithColumn("CreatedAt").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("UpdatedAt").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentDateTime);

        // 17. Crear tabla de Configuraciones
        Create.Table("Settings")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("Key").AsString(255).NotNullable().Unique()
            .WithColumn("Value").AsString(int.MaxValue).NotNullable();

        // 18. Crear tabla de Visitas
        Create.Table("Visits")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("PatientId").AsGuid().NotNullable()
                .ForeignKey("FK_Visits_PatientId_Patients_Id", "Patients", "Id")
            .WithColumn("VisitDate").AsDateTime().NotNullable()
            .WithColumn("Description").AsString(1000).Nullable()
            .WithColumn("CreatedAt").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("UpdatedAt").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentDateTime);

        // 19. Crear tabla pivote VisitPrescriptions
        Create.Table("VisitPrescriptions")
            .WithColumn("VisitId").AsGuid().NotNullable()
            .WithColumn("PrescriptionId").AsGuid().NotNullable();

        Create.PrimaryKey("PK_VisitPrescriptions")
            .OnTable("VisitPrescriptions")
            .Columns("VisitId", "PrescriptionId");

        Create.ForeignKey("FK_VisitPrescriptions_VisitId_Visits_Id")
            .FromTable("VisitPrescriptions").InSchema("dbo").ForeignColumn("VisitId")
            .ToTable("Visits").InSchema("dbo").PrimaryColumn("Id");

        Create.ForeignKey("FK_VisitPrescriptions_PrescriptionId_Prescriptions_Id")
            .FromTable("VisitPrescriptions").InSchema("dbo").ForeignColumn("PrescriptionId")
            .ToTable("Prescriptions").InSchema("dbo").PrimaryColumn("Id");
    }

    public override void Down()
    {
        // El orden de eliminación es CRÍTICO debido a las claves foráneas.
        // Debe ser inverso al orden de creación de tablas dependientes.

        // Eliminar tablas pivote primero
        Delete.Table("VisitPrescriptions");
        Delete.Table("DoctorSpecializations");
        Delete.Table("ServiceDoctors");
        Delete.Table("UserRoles");
        Delete.Table("RolePermissions");

        // Eliminar tablas dependientes antes que sus padres
        Delete.Table("VisitObservations"); // Esta tabla no fue creada en Up(), eliminar si no existe
        Delete.Table("VisitNotes");       // Esta tabla no fue creada en Up(), eliminar si no existe
        Delete.Table("Visits");
        Delete.Table("Notifications");
        Delete.Table("Prescriptions");
        Delete.Table("Appointments");
        Delete.Table("SessionWeekDays");
        Delete.Table("DoctorHolidays");
        Delete.Table("DoctorSessions");
        
        // Eliminar FKs antes de las tablas padre si no están configuradas en cascada
        Delete.ForeignKey("FK_Appointments_PatientId_Patients_Id").OnTable("Appointments");
        Delete.ForeignKey("FK_Appointments_DoctorId_Doctors_Id").OnTable("Appointments");
        Delete.ForeignKey("FK_Appointments_ServiceId_Services_Id").OnTable("Appointments");
        Delete.ForeignKey("FK_DoctorHolidays_DoctorId_Doctors_Id").OnTable("DoctorHolidays");
        Delete.ForeignKey("FK_DoctorSessions_DoctorId_Doctors_Id").OnTable("DoctorSessions");
        Delete.ForeignKey("FK_SessionWeekDays_DoctorSessionId_DoctorSessions_Id").OnTable("SessionWeekDays");
        Delete.ForeignKey("FK_Notifications_UserId_Users_Id").OnTable("Notifications");
        Delete.ForeignKey("FK_Prescriptions_PatientId_Patients_Id").OnTable("Prescriptions");
        Delete.ForeignKey("FK_Prescriptions_DoctorId_Doctors_Id").OnTable("Prescriptions");
        Delete.ForeignKey("FK_Prescriptions_AppointmentId_Appointments_Id").OnTable("Prescriptions");
        Delete.ForeignKey("FK_Visits_PatientId_Patients_Id").OnTable("Visits");
        Delete.ForeignKey("FK_VisitPrescriptions_VisitId_Visits_Id").OnTable("VisitPrescriptions");
        Delete.ForeignKey("FK_VisitPrescriptions_PrescriptionId_Prescriptions_Id").OnTable("VisitPrescriptions");
        Delete.ForeignKey("FK_ServiceDoctors_ServiceId_Services_Id").OnTable("ServiceDoctors");
        Delete.ForeignKey("FK_ServiceDoctors_DoctorId_Doctors_Id").OnTable("ServiceDoctors");
        Delete.ForeignKey("FK_DoctorSpecializations_DoctorId_Doctors_Id").OnTable("DoctorSpecializations");
        Delete.ForeignKey("FK_DoctorSpecializations_SpecializationId_Specializations_Id").OnTable("DoctorSpecializations");
        Delete.ForeignKey("FK_RolePermissions_RoleId_Roles_Id").OnTable("RolePermissions");
        Delete.ForeignKey("FK_RolePermissions_PermissionId_Permissions_Id").OnTable("RolePermissions");
        Delete.ForeignKey("FK_UserRoles_UserId_Users_Id").OnTable("UserRoles");
        Delete.ForeignKey("FK_UserRoles_RoleId_Roles_Id").OnTable("UserRoles");
        Delete.ForeignKey("FK_Patients_UserId_Users_Id").OnTable("Patients");
        Delete.ForeignKey("FK_Doctors_UserId_Users_Id").OnTable("Doctors");
        Delete.ForeignKey("FK_Services_CategoryId_ServiceCategories_Id").OnTable("Services");
        Delete.ForeignKey("FK_Users_BranchId_Branches_Id").OnTable("Users");

        Delete.Table("Patients");
        Delete.Table("Doctors");
        Delete.Table("Services");
        Delete.Table("Specializations");
        Delete.Table("ServiceCategories");
        Delete.Table("Branches");
        Delete.Table("Permissions");
        Delete.Table("Roles");
        Delete.Table("Users");
        Delete.Table("Settings"); // Asegurarse de eliminar Settings, ya que es una tabla raíz
    }
}
