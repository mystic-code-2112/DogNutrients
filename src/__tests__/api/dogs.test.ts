import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/dogs/route";
import { GET as getDog, PATCH, DELETE } from "@/app/api/dogs/[dogId]/route";

vi.mock("@/lib/db", () => ({
  prisma: {
    dog: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";

const mockDog = {
  id: "cldog1",
  name: "Rex",
  breed: "Labrador",
  weightKg: 30,
  ageMonths: 24,
  sex: "MALE" as const,
  lifeStage: "ADULT" as const,
  isNeutered: true,
  activityLevel: "MODERATE" as const,
  healthConditions: [] as string[],
  notes: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

function makeParams(dogId: string) {
  return { params: Promise.resolve({ dogId }) };
}

beforeEach(() => vi.clearAllMocks());

// ─── GET /api/dogs ───────────────────────────────────────────────────────────

describe("GET /api/dogs", () => {
  it("returns empty array when no dogs", async () => {
    vi.mocked(prisma.dog.findMany).mockResolvedValue([]);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns list of dogs", async () => {
    vi.mocked(prisma.dog.findMany).mockResolvedValue([mockDog]);
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Rex");
  });

  it("returns 500 on DB error", async () => {
    vi.mocked(prisma.dog.findMany).mockRejectedValue(new Error("DB error"));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});

// ─── POST /api/dogs ──────────────────────────────────────────────────────────

describe("POST /api/dogs", () => {
  const validBody = {
    name: "Bella",
    weightKg: 20,
    ageMonths: 12,
    sex: "FEMALE" as const,
    lifeStage: "ADULT" as const,
    isNeutered: false,
    activityLevel: "MODERATE" as const,
    healthConditions: [] as string[],
  };

  it("creates a dog and returns 201", async () => {
    vi.mocked(prisma.dog.create).mockResolvedValue({ ...mockDog, ...validBody, id: "cldog2" });
    const req = new Request("http://localhost/api/dogs", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe("Bella");
  });

  it("returns 400 on missing required fields", async () => {
    const req = new Request("http://localhost/api/dogs", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 on negative weight", async () => {
    const req = new Request("http://localhost/api/dogs", {
      method: "POST",
      body: JSON.stringify({ ...validBody, weightKg: -5 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ─── GET /api/dogs/:id ────────────────────────────────────────────────────────

describe("GET /api/dogs/:id", () => {
  it("returns dog when found", async () => {
    vi.mocked(prisma.dog.findUnique).mockResolvedValue(mockDog);
    const res = await getDog(new Request("http://localhost"), makeParams("cldog1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("cldog1");
  });

  it("returns 404 when not found", async () => {
    vi.mocked(prisma.dog.findUnique).mockResolvedValue(null);
    const res = await getDog(new Request("http://localhost"), makeParams("nope"));
    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/dogs/:id ──────────────────────────────────────────────────────

describe("PATCH /api/dogs/:id", () => {
  it("updates a dog", async () => {
    const updated = { ...mockDog, name: "Rex Jr" };
    vi.mocked(prisma.dog.update).mockResolvedValue(updated);
    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ name: "Rex Jr" }),
    });
    const res = await PATCH(req, makeParams("cldog1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Rex Jr");
  });
});

// ─── DELETE /api/dogs/:id ────────────────────────────────────────────────────

describe("DELETE /api/dogs/:id", () => {
  it("deletes a dog and returns 204", async () => {
    vi.mocked(prisma.dog.delete).mockResolvedValue(mockDog);
    const res = await DELETE(new Request("http://localhost"), makeParams("cldog1"));
    expect(res.status).toBe(204);
  });
});
