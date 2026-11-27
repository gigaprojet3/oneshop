import "server-only";
import { io } from "next/cache";

/**
 * L'heure de la requête, pour le rendu serveur.
 * Avec Cache Components et le préchargement partiel, Next.js pré-rend aussi ce qui dépend des cookies :
 * `io()` exclut la suite du pré-rendu, pour que l'heure soit lue à chaque requête.
 */
export async function requestTime() {
  await io();
  return Date.now();
}
