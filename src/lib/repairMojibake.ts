// Reparación de mojibake: caracteres acentuados corrompidos por doble codificación.
//
// Hay DOS variantes del carácter de reemplazo U+FFFD (bytes UTF-8 "ef bf bd"),
// decodificado como Latin-1, que produce SECUENCIAS de 3 caracteres distintas:
//   1. "ï¿½" = U+00EF U+00BF U+00BD  (bytes ef bf bd en orden)
//   2. "¿ï½" = U+00BF U+00EF U+00BD  (bytes bf ef bd, orden invertido — ocurre con
//      doble decodificación: UTF-8(ef bf bd) tratado como bytes Latin-1 y re-UTF8).
//
// Ejemplos reales vistos:
//   "Devoluciï¿½n" / "Devoluci¿ï½n" → "Devolución"
//   "Educaci¿ï½n"                  → "Educación"
//   "Tecnolog¿ï½a"                 → "Tecnología"
//   "M¿ï½sica"                      → "Música"
export const MOJIBAKE = "\u00EF\u00BF\u00BD"; // variante 1: "ï¿½"
export const MOJIBAKE_REV = "\u00BF\u00EF\u00BD"; // variante 2: "¿ï½"

export function repairMojibake(input: string): string {
  if (!input) return input;
  // Solo reparamos si alguna de las dos secuencias corruptas está presente.
  if (input.indexOf(MOJIBAKE) === -1 && input.indexOf(MOJIBAKE_REV) === -1) {
    return input;
  }

  let out = input;

  // Construir el array de reemplazo [patrón_roto, palabra_correcta]
  const words: [string, string][] = [];
  const mk = (prefix: string, suffix: string, good: string) => {
    // prefijo + MOJIBAKE/REV + sufijo -> good
    words.push([prefix + MOJIBAKE + suffix, good]);
    words.push([prefix + MOJIBAKE_REV + suffix, good]);
  };

  mk("Devoluci", "n", "Devolución");
  mk("Contribuci", "n", "Contribución");
  mk("contribuci", "n", "contribución");
  mk("Alimentaci", "n", "Alimentación");
  mk("Iluminaci", "n", "Iluminación");
  mk("Educaci", "n", "Educación");
  mk("educaci", "n", "educación");
  mk("Matr", "cula", "Matrícula");
  mk("matr", "cula", "matrícula");
  mk("M", "sica", "Música");
  mk("m", "sica", "música");
  mk("Clases de M", "sica", "Clases de Música");
  mk("devoluci", "n", "devolución");
  mk("Polic", "a", "Policía");
  mk("polic", "a", "policía");
  mk("Jos", "", "José");
  mk("P", "rez", "Pérez");
  mk("R", "o", "Río");
  mk("R", "os", "Ríos");
  mk("Buj", "a", "Bujía");
  mk("cient", "fica", "científica");
  mk("pr", "ximo", "próximo");
  mk("pr", "xim", "próxim");
  mk("est", "", "está");
  mk("", "ltima", "última");
  mk("", "nica", "única");
  mk("Jefatura de Polic", "a", "Jefatura de Policía");
  mk("Corral", "n", "Corralón");

  for (const [bad, good] of words) {
    out = out.split(bad).join(good);
  }

  // Reglas genéricas con AMBAS variantes antes de la consonante final.
  const variants = [MOJIBAKE, MOJIBAKE_REV];
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