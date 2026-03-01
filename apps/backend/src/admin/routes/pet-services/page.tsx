import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Text,
  Badge,
  Button,
  Input,
  Label,
  toast,
} from "@medusajs/ui";
import { Heart, CurrencyDollar, Plus } from "@medusajs/icons";
import { useState } from "react";
import {
  usePetProfiles,
  useCreatePetProfile,
} from "../../hooks/use-pet-services.js";
import { DataTable } from "../../components/tables/data-table.js";
import { StatusBadge } from "../../components/common";
import { StatsGrid } from "../../components/charts/stats-grid.js";
import { FormDrawer } from "../../components/forms/form-drawer.js";

const PetServicesPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    species: "dog" as const,
    breed: "",
    owner_id: "",
    color: "",
    gender: "unknown" as const,
  });

  const { data, isLoading } = usePetProfiles();
  const createProfile = useCreatePetProfile();

  const pets = data?.items || [];
  const speciesCount = [...new Set(pets.map((p: any) => p.species))].length;
  const neuteredCount = pets.filter((p: any) => p.is_neutered).length;

  const stats = [
    {
      label: "Total Pets",
      value: pets.length,
      icon: <Heart className="w-5 h-5" />,
    },
    { label: "Species", value: speciesCount, color: "blue" as const },
    { label: "Neutered", value: neuteredCount, color: "green" as const },
    {
      label: "Total Profiles",
      value: pets.length,
      icon: <CurrencyDollar className="w-5 h-5" />,
      color: "green" as const,
    },
  ];

  const handleCreate = async () => {
    try {
      await createProfile.mutateAsync({
        name: formData.name,
        species: formData.species,
        breed: formData.breed,
        owner_id: formData.owner_id,
        color: formData.color,
        gender: formData.gender,
        tenant_id: "default",
      });
      toast.success("Pet profile created");
      setShowCreate(false);
      setFormData({
        name: "",
        species: "dog",
        breed: "",
        owner_id: "",
        color: "",
        gender: "unknown",
      });
    } catch (error) {
      toast.error("Failed to create pet profile");
    }
  };

  const getSpeciesColor = (species: string) => {
    switch (species) {
      case "dog":
        return "blue";
      case "cat":
        return "orange";
      case "bird":
        return "green";
      case "fish":
        return "purple";
      default:
        return "grey";
    }
  };

  const columns = [
    {
      key: "name",
      header: "Pet",
      sortable: true,
      cell: (p: any) => (
        <div>
          <Text className="font-medium">{p.name}</Text>
          <Text className="text-ui-fg-muted text-sm">{p.breed || "—"}</Text>
        </div>
      ),
    },
    {
      key: "species",
      header: "Species",
      cell: (p: any) => (
        <Badge color={getSpeciesColor(p.species)}>{p.species}</Badge>
      ),
    },
    {
      key: "owner_id",
      header: "Owner",
      cell: (p: any) => <Text className="font-mono text-sm">{p.owner_id}</Text>,
    },
    {
      key: "gender",
      header: "Gender",
      cell: (p: any) => <Badge color="grey">{p.gender || "unknown"}</Badge>,
    },
    {
      key: "weight_kg",
      header: "Weight",
      sortable: true,
      cell: (p: any) => (p.weight_kg ? `${p.weight_kg} kg` : "—"),
    },
    {
      key: "is_neutered",
      header: "Neutered",
      cell: (p: any) =>
        p.is_neutered ? (
          <Badge color="green">Yes</Badge>
        ) : (
          <Badge color="grey">No</Badge>
        ),
    },
  ];

  return (
    <Container className="p-0">
      <div className="p-6 border-b border-ui-border-base">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Pet Services</Heading>
            <Text className="text-ui-fg-muted">
              Manage pet care services, providers, and bookings
            </Text>
          </div>
          <Button
            variant="primary"
            size="small"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Pet
          </Button>
        </div>
      </div>

      <div className="p-6">
        <StatsGrid stats={stats} columns={4} />
      </div>

      <div className="px-6 pb-6">
        <DataTable
          data={pets}
          columns={columns}
          searchable
          searchPlaceholder="Search pets..."
          searchKeys={["name", "species", "breed"]}
          loading={isLoading}
          emptyMessage="No pet profiles found"
        />
      </div>

      <FormDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Create Pet Profile"
        onSubmit={handleCreate}
        submitLabel="Create"
        loading={createProfile.isPending}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value as any })
              }
              placeholder="Pet name"
            />
          </div>
          <div>
            <Label htmlFor="owner_id">Owner ID</Label>
            <Input
              id="owner_id"
              value={formData.owner_id}
              onChange={(e) =>
                setFormData({ ...formData, owner_id: e.target.value as any })
              }
              placeholder="Owner ID"
            />
          </div>
          <div>
            <Label htmlFor="species">Species</Label>
            <select
              id="species"
              value={formData.species}
              onChange={(e) =>
                setFormData({ ...formData, species: e.target.value as any })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="bird">Bird</option>
              <option value="fish">Fish</option>
              <option value="reptile">Reptile</option>
              <option value="rabbit">Rabbit</option>
              <option value="hamster">Hamster</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <Label htmlFor="breed">Breed</Label>
            <Input
              id="breed"
              value={formData.breed}
              onChange={(e) =>
                setFormData({ ...formData, breed: e.target.value as any })
              }
              placeholder="Breed"
            />
          </div>
          <div>
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              value={formData.color}
              onChange={(e) =>
                setFormData({ ...formData, color: e.target.value as any })
              }
              placeholder="Color"
            />
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value as any })
              }
              className="w-full border border-ui-border-base rounded-md px-3 py-2 bg-ui-bg-base"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
        </div>
      </FormDrawer>
    </Container>
  );
};

export const config = defineRouteConfig({ label: "Pet Services", icon: Heart });
export default PetServicesPage;
