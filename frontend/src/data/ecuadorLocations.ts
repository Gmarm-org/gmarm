export interface Canton {
  nombre: string;
}

export interface Provincia {
  nombre: string;
  cantones: Canton[];
}

export const ecuadorProvinces: Provincia[] = [
  {
    nombre: "Azuay",
    cantones: [
      { nombre: "Cuenca" },
      { nombre: "Girón" },
      { nombre: "Gualaceo" },
      { nombre: "Nabón" },
      { nombre: "Paute" },
      { nombre: "Pucará" },
      { nombre: "San Fernando" },
      { nombre: "Santa Isabel" },
      { nombre: "Sigsig" },
      { nombre: "Oña" },
      { nombre: "Chordeleg" },
      { nombre: "El Pan" },
      { nombre: "Sevilla de Oro" },
      { nombre: "Guachapala" },
      { nombre: "Camilo Ponce Enríquez" }
    ]
  },
  {
    nombre: "Bolívar",
    cantones: [
      { nombre: "Guaranda" },
      { nombre: "Chillanes" },
      { nombre: "Chimbo" },
      { nombre: "Echeandía" },
      { nombre: "San Miguel" },
      { nombre: "Caluma" },
      { nombre: "Las Naves" }
    ]
  },
  {
    nombre: "Cañar",
    cantones: [
      { nombre: "Azogues" },
      { nombre: "Biblián" },
      { nombre: "Cañar" },
      { nombre: "La Troncal" },
      { nombre: "El Tambo" },
      { nombre: "Déleg" },
      { nombre: "Suscal" }
    ]
  },
  {
    nombre: "Carchi",
    cantones: [
      { nombre: "Tulcán" },
      { nombre: "Bolívar" },
      { nombre: "Espejo" },
      { nombre: "Mira" },
      { nombre: "Montúfar" },
      { nombre: "San Pedro de Huaca" }
    ]
  },
  {
    nombre: "Chimborazo",
    cantones: [
      { nombre: "Riobamba" },
      { nombre: "Alausí" },
      { nombre: "Colta" },
      { nombre: "Cumandá" },
      { nombre: "Guamote" },
      { nombre: "Guano" },
      { nombre: "Pallatanga" },
      { nombre: "Penipe" },
      { nombre: "Chunchi" },
      { nombre: "Chambo" }
    ]
  },
  {
    nombre: "Cotopaxi",
    cantones: [
      { nombre: "Latacunga" },
      { nombre: "La Maná" },
      { nombre: "Pangua" },
      { nombre: "Pujilí" },
      { nombre: "Salcedo" },
      { nombre: "Saquisilí" },
      { nombre: "Sigchos" }
    ]
  },
  {
    nombre: "El Oro",
    cantones: [
      { nombre: "Machala" },
      { nombre: "Arenillas" },
      { nombre: "Atahualpa" },
      { nombre: "Balsas" },
      { nombre: "Chilla" },
      { nombre: "El Guabo" },
      { nombre: "Huaquillas" },
      { nombre: "Marcabelí" },
      { nombre: "Pasaje" },
      { nombre: "Piñas" },
      { nombre: "Portovelo" },
      { nombre: "Santa Rosa" },
      { nombre: "Zaruma" },
      { nombre: "Las Lajas" }
    ]
  },
  {
    nombre: "Esmeraldas",
    cantones: [
      { nombre: "Esmeraldas" },
      { nombre: "Eloy Alfaro" },
      { nombre: "Muisne" },
      { nombre: "Quinindé" },
      { nombre: "San Lorenzo" },
      { nombre: "Atacames" },
      { nombre: "Rioverde" }
    ]
  },
  {
    nombre: "Galápagos",
    cantones: [
      { nombre: "San Cristóbal" },
      { nombre: "Isabela" },
      { nombre: "Santa Cruz" }
    ]
  },
  {
    nombre: "Guayas",
    cantones: [
      { nombre: "Guayaquil" },
      { nombre: "Alfredo Baquerizo Moreno" },
      { nombre: "Balao" },
      { nombre: "Balzar" },
      { nombre: "Colimes" },
      { nombre: "Daule" },
      { nombre: "Durán" },
      { nombre: "El Empalme" },
      { nombre: "El Triunfo" },
      { nombre: "Milagro" },
      { nombre: "Naranjal" },
      { nombre: "Naranjito" },
      { nombre: "Palestina" },
      { nombre: "Pedro Carbo" },
      { nombre: "Samborondón" },
      { nombre: "Santa Lucía" },
      { nombre: "Salitre" },
      { nombre: "San Jacinto de Yaguachi" },
      { nombre: "Playas" },
      { nombre: "Simón Bolívar" },
      { nombre: "Coronel Marcelino Maridueña" },
      { nombre: "Lomas de Sargentillo" },
      { nombre: "Nobol" },
      { nombre: "General Antonio Elizalde" },
      { nombre: "Isidro Ayora" }
    ]
  },
  {
    nombre: "Imbabura",
    cantones: [
      { nombre: "Ibarra" },
      { nombre: "Antonio Ante" },
      { nombre: "Cotacachi" },
      { nombre: "Otavalo" },
      { nombre: "Pimampiro" },
      { nombre: "San Miguel de Urcuquí" }
    ]
  },
  {
    nombre: "Loja",
    cantones: [
      { nombre: "Loja" },
      { nombre: "Calvas" },
      { nombre: "Catamayo" },
      { nombre: "Celica" },
      { nombre: "Chaguarpamba" },
      { nombre: "Espíndola" },
      { nombre: "Gonzanamá" },
      { nombre: "Macará" },
      { nombre: "Paltas" },
      { nombre: "Puyango" },
      { nombre: "Saraguro" },
      { nombre: "Sozoranga" },
      { nombre: "Zapotillo" },
      { nombre: "Pindal" },
      { nombre: "Quilanga" },
      { nombre: "Olmedo" }
    ]
  },
  {
    nombre: "Los Ríos",
    cantones: [
      { nombre: "Babahoyo" },
      { nombre: "Baba" },
      { nombre: "Montalvo" },
      { nombre: "Puebloviejo" },
      { nombre: "Quevedo" },
      { nombre: "Urdaneta" },
      { nombre: "Ventanas" },
      { nombre: "Vínces" },
      { nombre: "Palenque" },
      { nombre: "Buena Fe" },
      { nombre: "Valencia" },
      { nombre: "Mocache" },
      { nombre: "Quinsaloma" }
    ]
  },
  {
    nombre: "Manabí",
    cantones: [
      { nombre: "Portoviejo" },
      { nombre: "Bolívar" },
      { nombre: "Chone" },
      { nombre: "El Carmen" },
      { nombre: "Flavio Alfaro" },
      { nombre: "Jipijapa" },
      { nombre: "Junín" },
      { nombre: "Manta" },
      { nombre: "Montecristi" },
      { nombre: "Paján" },
      { nombre: "Pichincha" },
      { nombre: "Rocafuerte" },
      { nombre: "Santa Ana" },
      { nombre: "Sucre" },
      { nombre: "Tosagua" },
      { nombre: "24 de Mayo" },
      { nombre: "Pedernales" },
      { nombre: "Olmedo" },
      { nombre: "Puerto López" },
      { nombre: "Jama" },
      { nombre: "Jaramijó" },
      { nombre: "San Vicente" }
    ]
  },
  {
    nombre: "Morona Santiago",
    cantones: [
      { nombre: "Macas" },
      { nombre: "Gualaquiza" },
      { nombre: "Limon-Indanza" },
      { nombre: "Palora" },
      { nombre: "Santiago" },
      { nombre: "Sucúa" },
      { nombre: "Huamboya" },
      { nombre: "San Juan Bosco" },
      { nombre: "Taisha" },
      { nombre: "Logroño" },
      { nombre: "Pablo Sexto" },
      { nombre: "Tiwinza" },
      { nombre: "Santiago de Méndez" }
    ]
  },
  {
    nombre: "Napo",
    cantones: [
      { nombre: "Tena" },
      { nombre: "Archidona" },
      { nombre: "El Chaco" },
      { nombre: "Quijos" },
      { nombre: "Carlos Julio Arosemena Tola" }
    ]
  },
  {
    nombre: "Orellana",
    cantones: [
      { nombre: "Francisco de Orellana" },
      { nombre: "Aguarico" },
      { nombre: "La Joya de los Sachas" },
      { nombre: "Loreto" }
    ]
  },
  {
    nombre: "Pastaza",
    cantones: [
      { nombre: "Pastaza" },
      { nombre: "Mera" },
      { nombre: "Santa Clara" },
      { nombre: "Arajuno" }
    ]
  },
  {
    nombre: "Pichincha",
    cantones: [
      { nombre: "Quito" },
      { nombre: "Cayambe" },
      { nombre: "Mejía" },
      { nombre: "Pedro Moncayo" },
      { nombre: "Rumiñahui" },
      { nombre: "San Miguel de los Bancos" },
      { nombre: "Pedro Vicente Maldonado" },
      { nombre: "Puerto Quito" }
    ]
  },
  {
    nombre: "Santa Elena",
    cantones: [
      { nombre: "Santa Elena" },
      { nombre: "La Libertad" },
      { nombre: "Salinas" }
    ]
  },
  {
    nombre: "Santo Domingo de los Tsáchilas",
    cantones: [
      { nombre: "Santo Domingo" },
      { nombre: "La Concordia" }
    ]
  },
  {
    nombre: "Sucumbíos",
    cantones: [
      { nombre: "Nueva Loja" },
      { nombre: "Cascales" },
      { nombre: "Cuyabeno" },
      { nombre: "Gonzalo Pizarro" },
      { nombre: "Lago Agrio" },
      { nombre: "Putumayo" },
      { nombre: "Shushufindi" },
      { nombre: "Sucumbíos" }
    ]
  },
  {
    nombre: "Tungurahua",
    cantones: [
      { nombre: "Ambato" },
      { nombre: "Baños de Agua Santa" },
      { nombre: "Cevallos" },
      { nombre: "Mocha" },
      { nombre: "Patate" },
      { nombre: "Quero" },
      { nombre: "San Pedro de Pelileo" },
      { nombre: "Santiago de Píllaro" },
      { nombre: "Tisaleo" }
    ]
  },
  {
    nombre: "Zamora Chinchipe",
    cantones: [
      { nombre: "Zamora" },
      { nombre: "Chinchipe" },
      { nombre: "Nangaritza" },
      { nombre: "Yacuambi" },
      { nombre: "Yantzaza" },
      { nombre: "El Pangui" },
      { nombre: "Centinela del Cóndor" },
      { nombre: "Palanda" },
      { nombre: "Paquisha" }
    ]
  }
]; 