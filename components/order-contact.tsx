import { MailIcon, PhoneIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui";
import { orderRef } from "@/lib/format";
import type { Order } from "@/lib/types";

/** Appeler le client, ou lui écrire s'il a laissé son email. */
export function OrderContact({
  order,
  shopName,
  compact = false,
}: {
  order: Pick<Order, "number" | "customer_name" | "customer_phone"> & { customer_email?: string | null };
  shopName: string;
  compact?: boolean;
}) {
  const phone = order.customer_phone.replace(/\s/g, "");
  const subject = `Votre commande ${orderRef(order.number)} chez ${shopName}`;

  return (
    <div className="flex gap-2">
      <a
        href={`tel:${phone}`}
        className={buttonClass("secondary", "sm", compact ? "w-9 px-0" : "")}
        aria-label={`Appeler ${order.customer_name}`}
      >
        <PhoneIcon className="size-4" />
        {compact ? null : "Appeler"}
      </a>
      {order.customer_email ? (
        <a
          href={`mailto:${order.customer_email}?subject=${encodeURIComponent(subject)}`}
          className={buttonClass("secondary", "sm", compact ? "w-9 px-0" : "")}
          aria-label={`Écrire à ${order.customer_name}`}
        >
          <MailIcon className="size-4" />
          {compact ? null : "Email"}
        </a>
      ) : null}
    </div>
  );
}
