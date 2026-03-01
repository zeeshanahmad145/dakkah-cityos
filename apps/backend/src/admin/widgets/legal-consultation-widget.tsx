import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type Props = { data: { id: string } };

type LegalData = {
  attorney_id: string | null;
  consultation_type: string;
  is_virtual: boolean;
  virtual_link: string | null;
  duration_minutes: number;
};

const LegalConsultationWidget = ({ data }: Props) => {
  const [consult, setConsult] = useState<LegalData | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=legal_consultation.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.legal_consultation)
          setConsult(d.product.legal_consultation);
      })
      .catch(() => null);
  }, [data.id]);

  if (!consult) return null;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Legal Consultation</Heading>
        <Badge color={consult.is_virtual ? "blue" : "purple"}>
          {consult.is_virtual ? "Virtual" : "In-Person"}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-sm">
        <div>
          <Text className="text-ui-fg-subtle">Type</Text>
          <Text className="font-medium capitalize">
            {consult.consultation_type?.replace("_", " ")}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Duration</Text>
          <Text className="font-medium">{consult.duration_minutes} min</Text>
        </div>
        {consult.virtual_link && (
          <div className="col-span-2">
            <Text className="text-ui-fg-subtle">Meeting Link</Text>
            <a
              href={consult.virtual_link}
              className="text-blue-500 underline text-xs break-all"
            >
              {consult.virtual_link}
            </a>
          </div>
        )}
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});
export default LegalConsultationWidget;
