// Reparación de mojibake: caracteres acentuados corrompidos por doble codificación.
// UTF-8 leído como Latin-1 convierte el carácter U+FFFD (ef bf bd) en 3 caracteres
// separados: ï (U+00EF) ¿ (U+00BF) ½ (U+00BD) = "ï¿½". Por eso el patrón real es
// la secuencia "ï¿½" (3 code units), NO el carácter único U+FFFD (código 65533).
// Ejemplos: "Devoluciï¿½n" = "Devolución", "Alimentaciï¿½n" = "Alimentación".
export const MOJIBAKE = "\u00EF\u00BF\u00BD"; // la secuencia "ï¿½"

export function repairMojibake(input: string): string {
  if (!input) return input;
  if (input.indexOf(MOJIBAKE) === -1) return input;

  let out = input;
  // Reparaciones de palabras completas (patrón real: "ï¿½" por vocal acentuada)
  const words: [string, string][] = [
    ["Devoluci" + MOJIBAKE + "n", "Devolución"],
    ["Contribuci" + MOJIBAKE + "n", "Contribución"],
    ["contribuci" + MOJIBAKE + "n", "contribución"],
    ["Alimentaci" + MOJIBAKE + "n", "Alimentación"],
    ["Iluminaci" + MOJIBAKE + "n", "Iluminación"],
    ["Educaci" + MOJIBAKE + "n", "Educación"],
    ["educaci" + MOJIBAKE + "n", "educación"],
    ["Matr" + MOJIBAKE + "cula", "Matrícula"],
    ["matr" + MOJIBAKE + "cula", "matrícula"],
    ["M" + MOJIBAKE + "sica", "Música"],
    ["m" + MOJIBAKE + "sica", "música"],
    ["Clases de M" + MOJIBAKE + "sica", "Clases de Música"],
    ["devoluci" + MOJIBAKE + "n", "devolución"],
    ["Polic" + MOJIBAKE + "a", "Policía"],
    ["polic" + MOJIBAKE + "a", "policía"],
    ["Jos" + MOJIBAKE, "José"],
    ["P" + MOJIBAKE + "rez", "Pérez"],
    ["R" + MOJIBAKE + "o", "Río"],
    ["R" + MOJIBAKE + "os", "Ríos"],
    ["Buj" + MOJIBAKE + "a", "Bujía"],
    ["cient" + MOJIBAKE + "fica", "científica"],
    ["pr" + MOJIBAKE + "ximo", "próximo"],
    ["pr" + MOJIBAKE + "xim", "próxim"],
    ["est" + MOJIBAKE, "está"],
    [MOJIBAKE + "ltima", "última"],
    [MOJIBAKE + "nica", "única"],
    ["Jefatura de Polic" + MOJIBAKE + "a", "Jefatura de Policía"],
    ["Corral" + MOJIBAKE + "n", "Corralón"],
  ];
  for (const [bad, good] of words) {
    out = out.split(bad).join(good);
  }
  // Reglas genéricas para patrones restantes ("ï¿½" antes de la consonante final)
  const M = MOJIBAKE;
  return out
    .replace(new RegExp("([a-záéíóúñ])ci" + M + "n\\b", "gi"), (_m, p1) => `${p1}ción`)
    .replace(new RegExp("([a-záéíóúñ])" + M + "n\\b", "gi"), (_m, p1) => `${p1}ón`)
    .replace(new RegExp("([a-záéíóúñ])" + M + "a\\b", "gi"), (_m, p1) => `${p1}ía`)
    .replace(new RegExp("([a-záéíóúñ])" + M + "s\\b", "gi"), (_m, p1) => `${p1}ús`)
    .replace(new RegExp("([a-záéíóúñ])" + M, "gi"), (_m, p1) => `${p1}í`);
}

export default repairMojibake;