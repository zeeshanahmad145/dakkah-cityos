import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Text,
  Button,
  Input,
  Label,
  toast,
} from "@medusajs/ui";
import { AcademicCap, Plus } from "@medusajs/icons";
import { useState } from "react";
import {
  useEducation,
  useCreateCourse,
  Course,
} from "../../hooks/use-education.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";

const EducationPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    format: "self_paced" as const,
    level: "all_levels" as const,
    price: "",
    currency_code: "usd",
    tenant_id: "",
    duration_hours: "",
    category: "",
  });

  const { data, isLoading } = useEducation();
  const createCourse = useCreateCourse();

  const courses = data?.items || [];
  const activeCourses = courses.filter(
    (c: any) => c.status === "published",
  ).length;
  const draftCourses = courses.filter((c: any) => c.status === "draft").length;

  const stats = [
    {
      label: "Total Courses",
      value: courses.length,
      icon: <AcademicCap className="w-5 h-5" />,
    },
    { label: "Published", value: activeCourses, color: "green" as const },
    { label: "Draft", value: draftCourses, color: "orange" as const },
    {
      label: "Archived",
      value: courses.filter((c: any) => c.status === "archived").length,
      color: "blue" as const,
    },
  ];

  const handleCreate = async () => {
    try {
      await createCourse.mutateAsync({
        ...formData,
        price: formData.price ? Number(formData.price) : undefined,
        duration_hours: formData.duration_hours
          ? Number(formData.duration_hours)
          : undefined,
      });
      toast.success("Course created");
      setShowCreate(false);
      setFormData({
        title: "",
        format: "self_paced",
        level: "all_levels",
        price: "",
        currency_code: "usd",
        tenant_id: "",
        duration_hours: "",
        category: "",
      });
    } catch (error) {
      toast.error("Failed to create course");
    }
  };

  const columns = [
    {
      key: "title",
      header: "Course",
      sortable: true,
      cell: (c: Course) => (
        <div>
          <Text className="font-medium">{c.title}</Text>
          <Text className="text-ui-fg-muted text-sm">
            {c.duration_hours ? `${c.duration_hours}h` : ""}
            {c.category ? ` · ${c.category}` : ""}
          </Text>
        </div>
      ),
    },
    { key: "format", header: "Format", cell: (c: Course) => c.format },
    { key: "level", header: "Level", cell: (c: Course) => c.level || "-" },
    {
      key: "price",
      header: "Price",
      sortable: true,
      cell: (c: Course) => (
        <Text className="font-medium">
          {c.is_free ? "Free" : c.price ? `$${c.price.toFixed(2)}` : "-"}
        </Text>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (c: Course) => <StatusBadge status={c.status} />,
    },
  ];

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Education / Courses</Heading>
            <Text className="text-ui-fg-muted">
              Manage courses, instructors, and student enrollments
            </Text>
          </div>
          <Button variant="secondary" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Create Course
          </Button>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <DataTable
          data={courses}
          columns={columns}
          searchable
          searchPlaceholder="Search courses..."
          searchKeys={["title", "category"]}
          loading={isLoading}
          emptyMessage="No courses found"
        />
      </div>

      <FormDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Create Course"
        onSubmit={handleCreate}
        submitLabel="Create"
        loading={createCourse.isPending}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value as any })
              }
              placeholder="Course title"
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as any })
              }
              placeholder="e.g. Technology"
            />
          </div>
          <div>
            <Label htmlFor="tenant_id">Tenant ID</Label>
            <Input
              id="tenant_id"
              value={formData.tenant_id}
              onChange={(e) =>
                setFormData({ ...formData, tenant_id: e.target.value as any })
              }
              placeholder="Tenant ID"
            />
          </div>
          <div>
            <Label htmlFor="format">Format</Label>
            <select
              id="format"
              value={formData.format}
              onChange={(e) =>
                setFormData({ ...formData, format: e.target.value as any })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="self_paced">Self Paced</option>
              <option value="live">Live</option>
              <option value="hybrid">Hybrid</option>
              <option value="in_person">In Person</option>
            </select>
          </div>
          <div>
            <Label htmlFor="level">Level</Label>
            <select
              id="level"
              value={formData.level}
              onChange={(e) =>
                setFormData({ ...formData, level: e.target.value as any })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="all_levels">All Levels</option>
            </select>
          </div>
          <div>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value as any })
              }
              placeholder="Price (optional)"
            />
          </div>
          <div>
            <Label htmlFor="currency_code">Currency Code</Label>
            <Input
              id="currency_code"
              value={formData.currency_code}
              onChange={(e) =>
                setFormData({ ...formData, currency_code: e.target.value as any })
              }
              placeholder="usd"
            />
          </div>
          <div>
            <Label htmlFor="duration_hours">Duration (hours)</Label>
            <Input
              id="duration_hours"
              type="number"
              value={formData.duration_hours}
              onChange={(e) =>
                setFormData({ ...formData, duration_hours: e.target.value as any })
              }
              placeholder="Duration in hours"
            />
          </div>
        </div>
      </FormDrawer>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Education",
  icon: AcademicCap,
});
export default EducationPage;
