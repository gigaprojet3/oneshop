import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackLink } from "@/components/back-link";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { TrashIcon } from "@/components/icons";
import { PageHeader, Panel, Skeleton } from "@/components/ui";
import { deleteProduct, updateProduct } from "@/lib/actions/products";
import { getProduct } from "@/lib/dal";
import { productImageUrl } from "@/lib/supabase/env";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Modifier le produit" };

export default function EditProductPage({ params }: PageProps<"/dashboard/produits/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <Skeleton className="mb-8 h-12 w-72" />
          <Skeleton className="h-[30rem]" />
        </>
      }
    >
      <EditProduct params={params} />
    </Suspense>
  );
}

async function EditProduct({ params }: { params: PageProps<"/dashboard/produits/[id]">["params"] }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        title={product.name}
        back={<BackLink href="/dashboard/produits">Produits</BackLink>}
        actions={
          <form action={deleteProduct.bind(null, product.id)}>
            <ConfirmSubmit
              variant="danger"
              message={`Supprimer « ${product.name} » ? Les commandes passées gardent le nom et le prix du produit.`}
            >
              <TrashIcon className="size-4" />
              Supprimer
            </ConfirmSubmit>
          </form>
        }
      />
      <Panel className="p-5 sm:p-8">
        <ProductForm
          action={updateProduct.bind(null, product.id)}
          product={product}
          imageUrl={productImageUrl(product.image_path)}
          submitLabel="Enregistrer les modifications"
        />
      </Panel>
    </>
  );
}
