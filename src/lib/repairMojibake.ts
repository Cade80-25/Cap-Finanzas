// Reparación de mojibake: caracteres acentuados corrompidos por doble codificación.
//
// El carácter U+FFFD (bytes UTF-8 "ef bf bd") fue mal decodificado, produciendo
// VARIAS secuencias corruptas distintas según cómo se interpretaron los bytes:
//   1. "ï¿½"  = U+00EF U+00BF U+00BD   (ef bf bd como 3 bytes latin-1)
//   2. "¿ï½" = U+00BF U+00EF U+00BD   (bf ef bd, orden invertido)
//   3. "뿯½" = U+BFEF U+00BD           (bf+ef como UN code unit LE = Hangul 뿯, + ½)
//      ← ESTA es la variante REAL encontrada en los datos del usuario.
//
// Ejemplos reales vistos en el localStorage de Cap Finanzas:
//   "Alimentaci뿯½n"  → "Alimentación"
//   "Educaci뿯½n"     → "Educación"
//   "Tecnolog뿯½a"    → "Tecnología"
export const MOJIBAKE = "\u00EF\u00BF\u00BD"; // variante 1: "ï¿½"
export const MOJIBAKE_REV = "\u00BF\u00EF\u00BD"; // variante 2: "¿ï½"
export const MOJIBAKE_REAL = "\uBFEF\u00BD"; // variante 3 (REAL): "뿯½"

export function repairMojibake(input: string): string {
  if (!input) return input;
  // Solo reparamos si alguna de las tres secuencias corruptas está presente.
  if (
    input.indexOf(MOJIBAKE) === -1 &&
    input.indexOf(MOJIBAKE_REV) === -1 &&
    input.indexOf(MOJIBAKE_REAL) === -1
  ) {
    return input;
  }

  let out = input;

  // Diccionario de palabras completas: [prefijo, sufijo, palabra correcta].
  const entries: [string, string, string][] = [
    ["Devoluci", "n", "Devolución"],
    ["Contribuci", "n", "Contribución"],
    ["contribuci", "n", "contribución"],
    ["Alimentaci", "n", "Alimentación"],
    ["Iluminaci", "n", "Iluminación"],
    ["Educaci", "n", "Educación"],
    ["educaci", "n", "educación"],
    ["Matr", "cula", "Matrícula"],
    ["matr", "cula", "matrícula"],
    ["M", "sica", "Música"],
    ["m", "sica", "música"],
    ["Clases de M", "sica", "Clases de Música"],
    ["devoluci", "n", "devolución"],
    ["Polic", "a", "Policía"],
    ["polic", "a", "policía"],
    ["Jos", "", "José"],
    ["P", "rez", "Pérez"],
    ["R", "o", "Río"],
    ["R", "os", "Ríos"],
    ["Buj", "a", "Bujía"],
    ["cient", "fica", "científica"],
    ["pr", "ximo", "próximo"],
    ["pr", "xim", "próxim"],
    ["est", "", "está"],
    ["", "ltima", "última"],
    ["", "nica", "única"],
    ["Jefatura de Polic", "a", "Jefatura de Policía"],
    ["Corral", "n", "Corralón"],
    ["Carpinter", "a", "Carpintería"],
    ["Plusval", "a", "Plusvalía"],
    ["Cafeter", "a", "Cafetería"],
    ["Panader", "a", "Panadería"],
    ["Transporte P", "blico", "Transporte Público"],
    ["Construcci", "n", "Construcción"],
    ["Tel", "fono", "Teléfono"],
    ["M", "dico", "Médico"],
    ["Seguro M", "dico", "Seguro Médico"],
    ["M", "vil", "Móvil"],
    ["Ahorro Contribuci", "n", "Ahorro Contribución"],
    ["Contribuci", "n y Patentes", "Contribución y Patentes"],
  ];

  const variants = [MOJIBAKE, MOJIBAKE_REV, MOJIBAKE_REAL];
  for (const [prefix, suffix, good] of entries) {
    for (const M of variants) {
      const bad = prefix + M + suffix;
      out = out.split(bad).join(good);
    }
  }

  // Reglas genéricas (por vocal acentuada), con las tres variantes.
  for (const M of variants) {
    out = out
      .replace(new RegExp("([a-záéíóúñ])ci" + M + "n\\b", "gi"), (_m, p1) => `${p1}ción`)
      .replace(new RegExp("([a-záéíóúñ])" + M + "n\\b", "gi"), (_m, p1) => `${p1}ón`)
      .replace(new RegExp("([a-záéíóúñ])" + M + "a\\b", "gi"), (_m, p1) => `${p1}ía`)
      .replace(new RegExp("([a-záéíóúñ])" + M + "s\\b", "gi"), (_m, p1) => `${p1}ús`)
      .replace(new RegExp("([a-záéíóúñ])" + M, "gi"), (_m, p1) => `${p1}í`);
  }

  return out;
}

export default repairMojibake;