import React from 'react';
import { Dog, Cat, PawPrint, Bird, Rabbit, Fish, Turtle, Bone, Heart, User } from 'lucide-react';

// Set único de íconos predefinidos que el cliente puede elegir como avatar de perfil (ver
// Configuracion.jsx). Las claves deben coincidir exactamente con
// UsuarioService.IconosPerfilValidos en el backend — ese es quien valida qué se puede guardar,
// esto solo decide cómo se dibuja cada clave.
export const ICONOS_PERFIL = [
  { clave: 'dog', etiqueta: 'Perro', Icon: Dog },
  { clave: 'cat', etiqueta: 'Gato', Icon: Cat },
  { clave: 'pawprint', etiqueta: 'Huella', Icon: PawPrint },
  { clave: 'bird', etiqueta: 'Ave', Icon: Bird },
  { clave: 'rabbit', etiqueta: 'Conejo', Icon: Rabbit },
  { clave: 'fish', etiqueta: 'Pez', Icon: Fish },
  { clave: 'turtle', etiqueta: 'Tortuga', Icon: Turtle },
  { clave: 'bone', etiqueta: 'Hueso', Icon: Bone },
  { clave: 'heart', etiqueta: 'Corazón', Icon: Heart },
  { clave: 'user', etiqueta: 'Persona', Icon: User },
];

const MAPA_ICONOS = Object.fromEntries(ICONOS_PERFIL.map((i) => [i.clave, i.Icon]));

// Dibuja el ícono guardado en USUARIO.AvatarIcono; si todavía no eligió ninguno (o el valor no
// se reconoce), cae en la huella genérica en vez de romper.
export const IconoDePerfil = ({ icono, size = 20, ...props }) => {
  const Icon = MAPA_ICONOS[icono] || PawPrint;
  return <Icon size={size} {...props} />;
};

export default ICONOS_PERFIL;
