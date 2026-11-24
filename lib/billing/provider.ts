import "server-only";
import type { ValidCard } from "./card";

/**
 * Prestataire de paiement des abonnements.
 *
 * Seule l'implémentation « simulation » existe pour l'instant. Pour brancher un vrai
 * prestataire (Stripe, Paystack, Flutterwave…), implémentez cette interface :
 * - le numéro de carte ne doit alors JAMAIS transiter par notre serveur : le formulaire
 *   utilise les champs hébergés du prestataire, qui renvoient un jeton ;
 * - les renouvellements arrivent par webhook au lieu d'être calculés à la lecture.
 */
export interface BillingProvider {
  id: string;
  /** Vérifie la carte et l'enregistre chez le prestataire. Aucun débit. */
  attachCard(card: ValidCard, customerId: string | null): Promise<AttachResult>;
  /** Débite un montant en FCFA sur la carte enregistrée. */
  charge(customerId: string, amount: number, last4: string): Promise<{ ok: true } | { ok: false; error: string }>;
}

export type AttachResult =
  | { ok: true; customerId: string; brand: string; last4: string; expMonth: number; expYear: number }
  | { ok: false; error: string };

/**
 * Cartes de test (comme chez Stripe) :
 * - 4242 4242 4242 4242 : acceptée
 * - 4000 0000 0000 0002 : refusée par la banque
 * - 4000 0000 0000 9995 : acceptée à l'enregistrement, mais les débits échouent (fonds insuffisants)
 */
const DECLINED = "4000000000000002";
const INSUFFICIENT_FUNDS_LAST4 = "9995";

export const simulatedProvider: BillingProvider = {
  id: "simulation",

  async attachCard(card, customerId) {
    if (card.number === DECLINED) {
      return { ok: false, error: "Votre banque a refusé cette carte. Essayez une autre carte." };
    }
    return {
      ok: true,
      customerId: customerId ?? `sim_cus_${crypto.randomUUID().slice(0, 12)}`,
      brand: card.brand,
      last4: card.last4,
      expMonth: card.expMonth,
      expYear: card.expYear,
    };
  },

  async charge(_customerId, _amount, last4) {
    if (last4 === INSUFFICIENT_FUNDS_LAST4) {
      return { ok: false, error: "Le paiement a été refusé : fonds insuffisants." };
    }
    return { ok: true };
  },
};

export const billingProvider: BillingProvider = simulatedProvider;
export const isSimulatedBilling = billingProvider.id === "simulation";
