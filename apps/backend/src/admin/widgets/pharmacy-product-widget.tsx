import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type Props = { data: { id: string } };

type PharmacyData = {
  dosage_form: string;
  prescription_required: boolean;
  controlled_substance_schedule: string | null;
  storage_conditions: string | null;
  expiry_date: string | null;
};

const PharmacyProductWidget = ({ data }: Props) => {
  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=pharmacy_product.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.pharmacy_product)
          setPharmacy(d.product.pharmacy_product);
      })
      .catch(() => null);
  }, [data.id]);

  if (!pharmacy) return null;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Pharmacy Details</Heading>
        <div className="flex gap-2">
          {pharmacy.prescription_required && (
            <Badge color="red">Rx Required</Badge>
          )}
          {pharmacy.controlled_substance_schedule && (
            <Badge color="orange">
              Schedule {pharmacy.controlled_substance_schedule}
            </Badge>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-sm">
        <div>
          <Text className="text-ui-fg-subtle">Dosage Form</Text>
          <Text className="font-medium capitalize">{pharmacy.dosage_form}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Storage</Text>
          <Text className="font-medium">
            {pharmacy.storage_conditions ?? "Room temp"}
          </Text>
        </div>
        {pharmacy.expiry_date && (
          <div className="col-span-2">
            <Text className="text-ui-fg-subtle">Expiry</Text>
            <Text className="font-medium">
              {new Date(pharmacy.expiry_date).toLocaleDateString()}
            </Text>
          </div>
        )}
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});
export default PharmacyProductWidget;
