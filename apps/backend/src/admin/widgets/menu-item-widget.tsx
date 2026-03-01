import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type Props = { data: { id: string } };

type MenuItemData = {
  category: string | null;
  is_featured: boolean;
  calories: number | null;
  allergens: string[] | null;
  dietary_tags: string[] | null;
  prep_time_minutes: number | null;
  display_order: number;
};

const MenuItemWidget = ({ data }: Props) => {
  const [item, setItem] = useState<MenuItemData | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=menu_item.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.menu_item) setItem(d.product.menu_item);
      })
      .catch(() => null);
  }, [data.id]);

  if (!item) return null;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Restaurant Menu Item</Heading>
        <div className="flex gap-2">
          {item.is_featured && <Badge color="orange">Featured</Badge>}
          {item.category && (
            <Badge color="purple" className="capitalize">
              {item.category}
            </Badge>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-sm">
        <div>
          <Text className="text-ui-fg-subtle">Prep Time</Text>
          <Text className="font-medium">
            {item.prep_time_minutes ?? "—"} min
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Calories</Text>
          <Text className="font-medium">{item.calories ?? "—"} kcal</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Display Order</Text>
          <Text className="font-medium">#{item.display_order}</Text>
        </div>
        {item.dietary_tags && item.dietary_tags.length > 0 && (
          <div className="col-span-2">
            <Text className="text-ui-fg-subtle">Dietary Tags</Text>
            <div className="mt-1 flex flex-wrap gap-1">
              {item.dietary_tags.map((t, i) => (
                <Badge
                  key={i}
                  size="xsmall"
                  color="green"
                  className="capitalize"
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {item.allergens && item.allergens.length > 0 && (
          <div className="col-span-2">
            <Text className="text-ui-fg-subtle">Allergens</Text>
            <div className="mt-1 flex flex-wrap gap-1">
              {item.allergens.map((a, i) => (
                <Badge key={i} size="xsmall" color="red" className="capitalize">
                  {a}
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
export default MenuItemWidget;
