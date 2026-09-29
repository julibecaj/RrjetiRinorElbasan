"use client";
import Link from "next/link";
import { useDemo } from "@/components/demo/DemoProvider";
import { userPoints } from "@/lib/demo-state";
import { ApplicationList, PointsList } from "./ProfileTables";
import { PageHeading } from "@/components/ui/PageHeading";
export function ProfilePage({
  view = "overview",
}: {
  view?: "overview" | "applications" | "activities" | "points";
}) {
  const { state } = useDemo();
  const user = state.users.find((u) => u.id === (state.currentUserId ?? "u1"))!;
  const apps = state.applications.filter((a) => a.userId === user.id);
  if (view === "applications")
    return (
      <>
        <PageHeading title="Aplikimet e mia">
          <p>Ndiq përgjigjet e organizatorëve për çdo aktivitet.</p>
        </PageHeading>
        <ApplicationList userId={user.id} />
      </>
    );
  if (view === "activities")
    return (
      <>
        <PageHeading title="Aktivitetet ku kam marrë pjesë">
          <p>Pjesëmarrja jote e konfirmuar dhe pikët e fituara.</p>
        </PageHeading>
        <ApplicationList userId={user.id} attendedOnly />
      </>
    );
  if (view === "points")
    return (
      <>
        <PageHeading title="Pikët e mia" />
        <div className="points-summary">
          <span>{userPoints(state, user.id)}</span>
          <div>
            <h2>Pikë të mbledhura</h2>
            <p>Një vlerësim për angazhimin tënd. Nuk kanë vlerë monetare.</p>
          </div>
        </div>
        <p className="notice">
          Pikët shtohen vetëm kur administratori konfirmon pjesëmarrjen. Çdo
          aktivitet shpërblehet një herë.
        </p>
        <PointsList userId={user.id} />
      </>
    );
  return (
    <>
      <div className="profile-greeting">
        <div className="avatar" aria-hidden="true">
          {user.firstName[0]}
          {user.lastName[0]}
        </div>
        <PageHeading
          eyebrow="PËRSHËNDETJE,"
          title={`${user.firstName} ${user.lastName}!`}
        >
          <p>Çdo angazhim i vogël bën një ndryshim të madh.</p>
        </PageHeading>
      </div>
      <div className="stats-grid">
        {[
          [userPoints(state, user.id), "Pikë", "/profile/points"],
          [apps.length, "Aplikime", "/profile/applications"],
          [
            apps.filter((a) => a.status === "accepted").length,
            "Të pranuara",
            "/profile/applications",
          ],
          [
            apps.filter((a) => a.status === "attended").length,
            "Pjesëmarrje",
            "/profile/activities",
          ],
        ].map(([value, label, href]) => (
          <Link key={String(label)} href={String(href)} className="stat">
            <strong>{value}</strong>
            <span>{label} →</span>
          </Link>
        ))}
      </div>
      <section className="section-space">
        <div className="section-heading">
          <h2>Aplikimet e mia</h2>
          <Link className="text-link" href="/events">
            Gjej aktivitete →
          </Link>
        </div>
        <ApplicationList userId={user.id} />
      </section>
      <section className="section-space">
        <h2>Pikët e fundit</h2>
        <PointsList userId={user.id} />
      </section>
    </>
  );
}
