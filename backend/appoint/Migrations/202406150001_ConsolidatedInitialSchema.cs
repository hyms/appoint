using FluentMigrator;
using System;

namespace appoint.Migrations;

[Migration(202506150845)]
public class ConsolidatedInitialSchema : Migration
{
    public override void Up()
    {
        // 1. CreateUsersTable
        Create.Table("Users")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("Username").AsString(255).NotNullable().Unique()
            .WithColumn("PasswordHash").AsString(255).NotNullable()
            .WithColumn("Role").AsString(50).NotNullable()
            .WithColumn("FirstName").AsString(100).NotNullable()
            .WithColumn("LastName").AsString(100).NotNullable()
            .WithColumn("Type").AsString(50).NotNullable()
            .WithColumn("EmailVerifiedAt").AsDateTime().Nullable()
            .WithColumn("Contact").AsString(50).Nullable()
            .WithColumn("RegionCode").AsString(10).Nullable()
            .WithColumn("BloodGroup").AsString(10).Nullable()
            .WithColumn("Gender").AsInt32().Nullable()
            .WithColumn("Dob").AsDateTime().Nullable()
            .WithColumn("CreatedAt").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("UpdatedAt").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentDateTime);

        // 2. CreateRolesAndPermissionsTables (FKs DESCOMENTADAS)
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

        // 3. CreateAddressesTable
        Create.Table("Addresses")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("Address1").AsString(255).NotNullable()
            .WithColumn("Address2").AsString(255).Nullable()
            .WithColumn("CountryId").AsGuid().Nullable()
            .WithColumn("StateId").AsGuid().Nullable()
            .WithColumn("CityId").AsGuid().Nullable()
            .WithColumn("PostalCode").AsString(20).Nullable()
            .WithColumn("CreatedAt").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("UpdatedAt").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentDateTime);

        // 4. CreatePatientsAndDoctorsTables (Specialization REMOVIDA de Doctors)
        Create.Table("Patients")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("UserId").AsGuid().NotNullable().Unique()
                .ForeignKey("FK_Patients_UserId_Users_Id", "Users", "Id")
            .WithColumn("AddressId").AsGuid().Nullable()
                .ForeignKey("FK_Patients_AddressId_Addresses_Id", "Addresses", "Id")
            .WithColumn("PatientUniqueId").AsString(50).NotNullable().Unique();

        Create.Table("Doctors")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("UserId").AsGuid().NotNullable().Unique()
                .ForeignKey("FK_Doctors_UserId_Users_Id", "Users", "Id");
        // Columna Specialization REMOVIDA de Doctors aquí, se manejará con tabla pivote

        // 5. CreateServicesTable
        Create.Table("Services")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("Name").AsString(255).NotNullable().Unique()
            .WithColumn("Price").AsDecimal(18, 2).NotNullable()
            .WithColumn("Status").AsString(50).NotNullable().WithDefaultValue("Active");

        // 6. CreateAppointmentsTable (FromTime/ToTime como AsTime(), Types REMOVIDOS)
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
            .WithColumn("FromTime").AsTime().NotNullable() // CAMBIO: Usar AsTime()
            .WithColumn("ToTime").AsTime().NotNullable()   // CAMBIO: Usar AsTime()
            .WithColumn("Status").AsInt32().NotNullable()
            .WithColumn("PayableAmount").AsDecimal(18, 2).NotNullable()
            .WithColumn("PaymentType").AsInt32().NotNullable()
            .WithColumn("PaymentMethod").AsInt32().Nullable()
            .WithColumn("CreatedAt").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("UpdatedAt").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentDateTime);

        // 7. CreateServiceDoctorTable (FKs DESCOMENTADAS)
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

        // 8. CreateDoctorHolidaysTable
        Create.Table("DoctorHolidays")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("DoctorId").AsGuid().NotNullable()
                .ForeignKey("FK_DoctorHolidays_DoctorId_Doctors_Id", "Doctors", "Id")
            .WithColumn("StartDate").AsDate().NotNullable()
            .WithColumn("EndDate").AsDate().NotNullable()
            .WithColumn("Reason").AsString(500).Nullable();

        // 9. CreateDoctorSessionsTable
        Create.Table("DoctorSessions")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("DoctorId").AsGuid().NotNullable()
                .ForeignKey("FK_DoctorSessions_DoctorId_Doctors_Id", "Doctors", "Id")
            .WithColumn("SessionName").AsString(255).NotNullable()
            .WithColumn("StartTime").AsTime().NotNullable()
            .WithColumn("EndTime").AsTime().NotNullable()
            .WithColumn("IsActive").AsBoolean().NotNullable().WithDefaultValue(true);

        // 10. CreateSessionWeekDaysTable
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

        // 11. CreateDoctorSpecializationTable (ahora solo tabla de especializaciones)
        Create.Table("Specializations")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("Name").AsString(255).NotNullable().Unique();

        // **NUEVA TABLA**: DoctorSpecializations (pivote) para relación muchos a muchos
        // Esta debería tener un número de migración posterior a Specializations y Doctors
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

        // 12. CreateNotificationsTable
        Create.Table("Notifications")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("UserId").AsGuid().NotNullable()
                .ForeignKey("FK_Notifications_UserId_Users_Id", "Users", "Id")
            .WithColumn("Title").AsString(500).NotNullable()
            .WithColumn("Type").AsInt32().NotNullable()
            .WithColumn("IsRead").AsBoolean().NotNullable().WithDefaultValue(false)
            .WithColumn("CreatedAt").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentDateTime);

        // 13. CreatePrescriptionsTable
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

        // 14. CreateSettingsTable
        Create.Table("Settings")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("Key").AsString(255).NotNullable().Unique()
            .WithColumn("Value").AsString(int.MaxValue).NotNullable();

        // 15. CreateVisitsTable
        Create.Table("Visits")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("PatientId").AsGuid().NotNullable()
                .ForeignKey("FK_Visits_PatientId_Patients_Id", "Patients", "Id")
            .WithColumn("VisitDate").AsDateTime().NotNullable()
            .WithColumn("Description").AsString(1000).Nullable()
            .WithColumn("CreatedAt").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("UpdatedAt").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentDateTime);

        // 16. CreateVisitNotesTable
        Create.Table("VisitNotes")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("VisitId").AsGuid().NotNullable()
                .ForeignKey("FK_VisitNotes_VisitId_Visits_Id", "Visits", "Id")
            .WithColumn("Note").AsString(2000).NotNullable()
            .WithColumn("CreatedAt").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("UpdatedAt").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentDateTime);

        // 17. CreateVisitObservationsTable
        Create.Table("VisitObservations")
            .WithColumn("Id").AsGuid().NotNullable().PrimaryKey()
            .WithColumn("VisitId").AsGuid().NotNullable()
                .ForeignKey("FK_VisitObservations_VisitId_Visits_Id", "Visits", "Id")
            .WithColumn("Observation").AsString(2000).NotNullable()
            .WithColumn("CreatedAt").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentDateTime)
            .WithColumn("UpdatedAt").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentDateTime);

        // 18. CreateVisitPrescriptionsTable (FKs DESCOMENTADAS)
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
        Delete.Table("RolePermissions");

        // Eliminar tablas dependientes antes que sus padres
        Delete.Table("VisitObservations");
        Delete.Table("VisitNotes");
        Delete.Table("Visits");
        Delete.Table("Notifications");
        Delete.Table("Prescriptions");
        Delete.Table("Appointments");
        Delete.Table("SessionWeekDays");
        Delete.Table("DoctorHolidays");
        Delete.Table("DoctorSessions");
        Delete.Table("Patients");
        Delete.Table("Doctors");
        Delete.Table("Services");
        Delete.Table("Specializations");
        Delete.Table("Addresses");
        Delete.Table("Permissions");
        Delete.Table("Roles");
        Delete.Table("Users");
    }
}