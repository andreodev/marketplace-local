import {
  CreateCategoryForm,
  UpdateCategoryForm,
} from "@/modules/categories/components/admin-category-form";
import { listCategoriesForAdmin } from "@/modules/categories/queries/admin-categories";

export default async function Page() {
  const categories = await listCategoriesForAdmin();
  return (
    <>
      <h1 className="text-3xl font-semibold">Categorias</h1>
      <p className="mt-3 text-muted-foreground">
        Crie, ordene ou desative categorias. Categorias com anúncios não são
        apagadas.
      </p>
      <div className="mt-6">
        <CreateCategoryForm />
      </div>
      <div className="mt-8">
        {categories.map((category) => (
          <div key={category.id}>
            <UpdateCategoryForm category={category} />
            <p className="-mt-3 pb-3 text-xs text-muted-foreground">
              {category._count.listings} anúncios vinculados
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
