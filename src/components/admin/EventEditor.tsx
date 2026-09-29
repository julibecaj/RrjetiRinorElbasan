"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useDemo } from "@/components/demo/DemoProvider";
import { occupiedPlaces } from "@/lib/demo-state";
import { categories, DEMO_TODAY } from "@/lib/format";
import type { Category, EventStatus } from "@/types";
import { PageHeading } from "@/components/ui/PageHeading";
import { EmptyState } from "@/components/ui/EmptyState";
export function EventEditor({
  id,
  created = false,
}: {
  id?: string;
  created?: boolean;
}) {
  const { state, dispatch } = useDemo();
  const router = useRouter();
  const event = state.events.find((e) => e.id === id);
  const [image, setImage] = useState(event?.image ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(created);
  const [loadingImage, setLoadingImage] = useState(false);
  if (id && !event)
    return (
      <EmptyState
        title="Aktiviteti nuk u gjet"
        description="Mund të krijosh një aktivitet të ri."
        href="/admin/events"
        label="Kthehu te aktivitetet"
      />
    );
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaved(false);
    const data = new FormData(e.currentTarget);
    const capacity = Number(data.get("capacity"));
    if (id && capacity < occupiedPlaces(state, id)) {
      setError(
        "Kapaciteti nuk mund të jetë më i vogël se numri i pjesëmarrësve të konfirmuar.",
      );
      return;
    }
    const eventId = id ?? crypto.randomUUID();
    dispatch({
      type: "event",
      event: {
        id: eventId,
        title: String(data.get("title")).trim(),
        category: data.get("category") as Category,
        description: String(data.get("description")).trim(),
        fullDescription: String(data.get("fullDescription")).trim(),
        date: String(data.get("date")),
        time: String(data.get("time")),
        location: String(data.get("location")).trim(),
        organizer: String(data.get("organizer")).trim(),
        capacity,
        status: data.get("status") as EventStatus,
        points: Number(data.get("points")),
        image,
      },
    });
    if (!id) router.push(`/admin/events/${eventId}/edit?saved=1`);
    else setSaved(true);
  }
  return (
    <>
      <Link href="/admin/events" className="text-link">
        ← Aktivitetet
      </Link>
      <PageHeading title={id ? "Ndrysho aktivitetin" : "Krijo aktivitet"} />
      <form className="form-stack" onSubmit={submit}>
        <label>
          Titulli
          <input
            name="title"
            required
            defaultValue={event?.title}
            maxLength={140}
          />
        </label>
        <div className="two-column">
          <label>
            Kategoria
            <select name="category" defaultValue={event?.category ?? "events"}>
              {Object.entries(categories).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Statusi
            <select name="status" defaultValue={event?.status ?? "draft"}>
              <option value="draft">Draft</option>
              <option value="published">Publikuar</option>
              <option value="full">Plot</option>
              <option value="completed">Përfunduar</option>
              <option value="cancelled">Anuluar</option>
            </select>
          </label>
        </div>
        <label>
          Përshkrimi i shkurtër
          <textarea
            name="description"
            rows={2}
            required
            defaultValue={event?.description}
            maxLength={300}
          />
        </label>
        <label>
          Përshkrimi i plotë
          <textarea
            name="fullDescription"
            rows={5}
            required
            defaultValue={event?.fullDescription}
          />
        </label>
        <div className="two-column">
          <label>
            Data
            <input
              name="date"
              type="date"
              required
              defaultValue={event?.date ?? DEMO_TODAY}
            />
          </label>
          <label>
            Ora
            <input
              name="time"
              type="time"
              required
              defaultValue={event?.time ?? "10:00"}
            />
          </label>
          <label>
            Vendndodhja
            <input name="location" required defaultValue={event?.location} />
          </label>
          <label>
            Organizatori
            <input
              name="organizer"
              required
              defaultValue={event?.organizer ?? "Rrjeti Rinor Elbasan"}
            />
          </label>
          <label>
            Kapaciteti
            <input
              name="capacity"
              type="number"
              min={1}
              max={10000}
              required
              defaultValue={event?.capacity ?? 25}
            />
          </label>
          <label>
            Pikë për pjesëmarrje
            <input
              name="points"
              type="number"
              min={0}
              max={1000}
              required
              defaultValue={event?.points ?? 20}
            />
          </label>
        </div>
        <div className="upload-placeholder">
          <label>
            Fotografia (opsionale, deri në 2 MB)
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (
                  file.size > 2 * 1024 * 1024 ||
                  !["image/png", "image/jpeg", "image/webp"].includes(file.type)
                ) {
                  setError("Zgjidh PNG, JPG ose WebP deri në 2 MB.");
                  e.target.value = "";
                  return;
                }
                setError("");
                setLoadingImage(true);
                const reader = new FileReader();
                reader.onload = () => {
                  setImage(String(reader.result));
                  setLoadingImage(false);
                };
                reader.onerror = () => {
                  setError("Fotografia nuk u lexua. Provo përsëri.");
                  setLoadingImage(false);
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
          <p className="help-text">
            Pamje paraprake lokale. Asnjë skedar nuk ngarkohet në server.
          </p>
          {image && (
            <>
              <Image
                className="upload-preview"
                src={image}
                width={480}
                height={240}
                unoptimized
                alt="Pamje paraprake e aktivitetit"
              />
              <button
                className="text-link"
                type="button"
                onClick={() => setImage("")}
              >
                Hiq fotografinë
              </button>
            </>
          )}
        </div>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        {saved && (
          <p className="notice success" role="status">
            Aktiviteti u ruajt në demo.
          </p>
        )}
        <div className="button-row">
          <button
            className="button button-primary"
            type="submit"
            disabled={loadingImage}
          >
            {loadingImage ? "Duke lexuar fotografinë…" : "Ruaj aktivitetin"}
          </button>
          {id && (
            <Link className="button" href={`/events/${id}`}>
              Shiko aktivitetin
            </Link>
          )}
          <Link className="text-link" href="/admin/events">
            Anulo
          </Link>
        </div>
      </form>
    </>
  );
}
