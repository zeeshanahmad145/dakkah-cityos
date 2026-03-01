import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

type CourseData = {
  id: string;
  course_level: string;
  delivery_mode: string;
  duration_hours: number;
  language: string;
  certificate_type: string;
  max_students: number;
  enrolled_count: number;
  is_self_paced: boolean;
  accreditation_body: string;
};

const EducationWidget = ({ data }: { data: { id: string } }) => {
  const [course, setCourse] = useState<CourseData | null>(null);

  useEffect(() => {
    fetch(`/admin/products/${data.id}?fields=course.*`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.product?.course) setCourse(d.product.course);
      })
      .catch(() => null);
  }, [data.id]);

  if (!course) return null;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Course Details</Heading>
        <div className="flex gap-2">
          {course.is_self_paced && <Badge color="blue">Self-Paced</Badge>}
          <Badge color="purple" className="capitalize">
            {course.course_level}
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-sm">
        <div>
          <Text className="text-ui-fg-subtle">Mode</Text>
          <Text className="font-medium capitalize">
            {course.delivery_mode?.replace("_", " ")}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Duration</Text>
          <Text className="font-medium">{course.duration_hours}h</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Language</Text>
          <Text className="font-medium">{course.language?.toUpperCase()}</Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Certificate</Text>
          <Text className="font-medium capitalize">
            {course.certificate_type?.replace("_", " ") || "None"}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Enrolled</Text>
          <Text className="font-medium">
            {course.enrolled_count || 0} / {course.max_students || "∞"}
          </Text>
        </div>
        <div>
          <Text className="text-ui-fg-subtle">Accreditation</Text>
          <Text className="font-medium">
            {course.accreditation_body || "—"}
          </Text>
        </div>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});
export default EducationWidget;
