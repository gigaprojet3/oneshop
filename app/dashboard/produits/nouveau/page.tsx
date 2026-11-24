import type { Metadata } from "next";
import { BackLink } from "@/components/back-link";
import { PageHeader, Panel } from "@/components/ui";
import { createProduct } from "@/lib/actions/products";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Ajouter un produit" };

export default function NewProductPage() {
  return (
    <>
      <PageHeader title="Ajouter un produit" back={<BackLink href="/dashboard/produits">Produits</BackLink>} />
      <Panel className="p-5 sm:p-8">
        <ProductForm action={createProduct} submitLabel="Enregistrer le produit" />
      </Panel>
    </>
  );
}
