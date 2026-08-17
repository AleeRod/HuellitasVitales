using System;
using System.Data;
using Npgsql;

var cs = "Host=aws-1-us-west-2.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.xqnwlfuyjhxxnpumlfui;Password=Huellitas1234;SSL Mode=Require;Trust Server Certificate=true";
using var conn = new NpgsqlConnection(cs);
conn.Open();
using var cmd = new NpgsqlCommand(@"SELECT u.""IdUsuario"", u.""Correo"", u.""IdRol"", v.""IdVeterinario"" FROM ""USUARIO"" u LEFT JOIN ""VETERINARIO"" v ON v.""IdUsuario"" = u.""IdUsuario"" WHERE u.""IdRol"" = 2 ORDER BY u.""IdUsuario"" LIMIT 20;", conn);
using var reader = cmd.ExecuteReader();
var rows = 0;
while (reader.Read()) {
    rows++;
    Console.WriteLine($"{reader[0]} | {reader[1]} | rol={reader[2]} | vet={reader[3]}");
}
Console.WriteLine($"ROWS={rows}");
