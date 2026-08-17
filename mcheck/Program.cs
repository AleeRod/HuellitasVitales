using System;
using Npgsql;
var cs = "Host=aws-1-us-west-2.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.xqnwlfuyjhxxnpumlfui;Password=Huellitas1234;SSL Mode=Require;Trust Server Certificate=true";
using var conn = new NpgsqlConnection(cs);
conn.Open();
using var cmd = new NpgsqlCommand("SELECT \"IdMascota\", \"IdUsuario\", \"Nombre\", \"Raza\", \"IdEspecie\", \"Activo\" FROM \"MASCOTA\" ORDER BY \"IdMascota\" LIMIT 20;", conn);
using var reader = cmd.ExecuteReader();
while (reader.Read())
{
    Console.WriteLine($"{reader[0]} | user={reader[1]} | nombre={reader[2]} | raza={reader[3]} | especie={reader[4]} | activo={reader[5]}");
}
