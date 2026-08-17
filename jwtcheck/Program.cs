using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

var key = Encoding.UTF8.GetBytes("ClaveSecretaSuperSeguraParaHuellitasVitales2026!");
var tokenHandler = new JwtSecurityTokenHandler();
var token = tokenHandler.CreateToken(new SecurityTokenDescriptor
{
    Subject = new ClaimsIdentity(new[]
    {
        new Claim("sub", "5"),
        new Claim("rol", "2")
    }),
    Expires = DateTime.UtcNow.AddHours(2),
    SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256)
});
var jwt = tokenHandler.WriteToken(token);
Console.WriteLine(jwt);
