using FluentMigrator;

namespace appoint.Migrations;

[Migration(20250517_140500, "Initial MariaDB Database Schema")]
public class InitialMariaDbDatabaseSchema : AutoReversingMigration
{
    public override void Up()
    {
        // Tabla: patients
        Create.Table("patients")
            .WithColumn("phone_number").AsString(255).PrimaryKey()
            .WithColumn("name").AsString(255).Nullable()
            .WithColumn("email").AsString(255).Nullable()
            .WithColumn("created_at").AsDateTime().WithDefaultValue(SystemMethods.CurrentDateTime)
            .WithColumn("updated_at").AsDateTime().WithDefaultValue(SystemMethods.CurrentDateTime);

        // Tabla: doctors
        Create.Table("doctors")
            .WithColumn("id").AsInt32().PrimaryKey().Identity()
            .WithColumn("name").AsString(255).Nullable()
            .WithColumn("speciality").AsString(255).Nullable()
            .WithColumn("created_at").AsDateTime().WithDefaultValue(SystemMethods.CurrentDateTime)
            .WithColumn("updated_at").AsDateTime().WithDefaultValue(SystemMethods.CurrentDateTime);

        // Tabla: appointments
        Create.Table("appointments")
            .WithColumn("id").AsInt32().PrimaryKey().Identity()
            .WithColumn("patient_phone").AsString(255)
            .WithColumn("doctor_id").AsInt32()
            .WithColumn("appointment_datetime").AsDateTime()
            .WithColumn("status").AsString(50).Nullable()
            .WithColumn("notes").AsString(1000).Nullable()
            .WithColumn("created_at").AsDateTime().WithDefaultValue(SystemMethods.CurrentDateTime)
            .WithColumn("updated_at").AsDateTime().WithDefaultValue(SystemMethods.CurrentDateTime);

        // Tabla: users
        Create.Table("users")
            .WithColumn("id").AsInt32().PrimaryKey().Identity()
            .WithColumn("username").AsString(255).Unique().NotNullable()
            .WithColumn("password").AsString(255).NotNullable()
            .WithColumn("role").AsString(50).NotNullable()
            .WithColumn("created_at").AsDateTime().WithDefaultValue(SystemMethods.CurrentDateTime)
            .WithColumn("updated_at").AsDateTime().WithDefaultValue(SystemMethods.CurrentDateTime);
       
        // Tabla: configurations
        Create.Table("configurations")
            .WithColumn("id").AsInt32().PrimaryKey().Identity()
            .WithColumn("setting_name").AsString(255).Unique().NotNullable()
            .WithColumn("setting_value").AsString(1000).Nullable()
            .WithColumn("created_at").AsDateTime().WithDefaultValue(SystemMethods.CurrentDateTime)
            .WithColumn("updated_at").AsDateTime().WithDefaultValue(SystemMethods.CurrentDateTime);

        // Tabla: permissions
        Create.Table("permissions")
            .WithColumn("id").AsInt32().PrimaryKey().Identity()
            .WithColumn("name").AsString(255).Unique().NotNullable()
            .WithColumn("description").AsString(1000).Nullable();

        // Tabla: role_permissions
        Create.Table("role_permissions")
            .WithColumn("role_name").AsString(50)
            .WithColumn("permission_id").AsInt32();

    }

    // public override void Down()
    // {
    //     Delete.Table("role_permissions");
    //     Delete.Table("permissions");
    //     Delete.Table("configurations");
    //     Delete.Table("users");
    //     Delete.Table("appointments");
    //     Delete.Table("doctors");
    //     Delete.Table("patients");
    // }
}