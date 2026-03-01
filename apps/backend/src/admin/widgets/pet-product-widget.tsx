import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type Props = { data: { id: string } };

type PetProductData = {
  category: string;
  species_tags: string[] | null;
  breed_specific: boolean;
  age_group: string | null;
  weight_range: string | null;
  prescription_required: boolean;
  dietary_type: string | null;
};

const PetProductWidget = ({ data }: Props) => {
  const [pet, setPet] = useState<PetProductData | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=pet_product.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.pet_product) setPet(d.product.pet_product);
      })
      .catch(() => null);
  }, [data.id]);

  if (!pet) return null;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Pet Product Details</Heading>
        {pet.prescription_required && <Badge color="red">Rx Required</Badge>}
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-sm">
        <div>
          <Text className="text-ui-fg-subtle">Category</Text>
          <Text className="font-medium capitalize">{pet.category}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Age Group</Text>
          <Text className="font-medium capitalize">
            {pet.age_group ?? "All ages"}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Weight Range</Text>
          <Text className="font-medium">{pet.weight_range ?? "Any"}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Breed Specific</Text>
          <Text className="font-medium">
            {pet.breed_specific ? "Yes" : "No"}
          </Text>
        </div>
        {pet.species_tags && (
          <div className="col-span-2">
            <Text className="text-ui-fg-subtle">Species</Text>
            <div className="mt-1 flex flex-wrap gap-1">
              {pet.species_tags.map((s, i) => (
                <Badge
                  key={i}
                  size="xsmall"
                  color="purple"
                  className="capitalize"
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});
export default PetProductWidget;
