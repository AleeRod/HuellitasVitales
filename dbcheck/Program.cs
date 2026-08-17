using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;

var cs = "Host=aws-1-us-west-2.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.xqnwlfuyjhxxnpumlfui;Password=Huellitas1234;SSL Mode=Require;Trust Server Certificate=true";
var options = new DbContextOptionsBuilder<DbContext>().UseNpgsql(cs).Options;
using var ctx = new DbContext(options);
var sql = "SELECT \"IdUsuario\", \"Correo\", \"IdRol\", \"Proveedor_Auth\" FROM \"USUARIO\" ORDER BY \"IdUsuario\" LIMIT 20;";
var rows = ctx.Database.SqlQueryRaw<dynamic>(sql).ToList();
Console.WriteLine(rows.Count == 0 ? "NO_ROWS" : string.Join("\n", rows.Select(r => r.ToString())));
