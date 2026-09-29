"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useDemo } from "@/components/demo/DemoProvider";
import { PageHeading } from "@/components/ui/PageHeading";
export function ContentEditor() {
  const { state, dispatch } = useDemo();
  const [saved, setSaved] = useState(false);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    dispatch({
      type: "content",
      content: {
        mission: String(data.get("mission")).trim(),
        vision: String(data.get("vision")).trim(),
        supporters: String(data.get("supporters"))
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      },
    });
    setSaved(true);
  }
  return (
    <>
      <PageHeading title="Përmbajtja & mbështetësit">
        <p>Përditëso tekstet që shfaqen në About dhe mbështetësit e faqes.</p>
      </PageHeading>
      <form className="form-stack" onSubmit={submit}>
        <label>
          Misioni
          <textarea
            name="mission"
            required
            rows={4}
            defaultValue={state.content.mission}
          />
        </label>
        <label>
          Vizioni
          <textarea
            name="vision"
            required
            rows={4}
            defaultValue={state.content.vision}
          />
        </label>
        <label>
          Mbështetësit — një emër në çdo rresht
          <textarea
            name="supporters"
            required
            rows={5}
            defaultValue={state.content.supporters.join("\n")}
          />
        </label>
        <p className="help-text">
          Logot janë shenja ilustruese me iniciale. Nuk publikohen ndryshime
          jashtë këtij sesioni.
        </p>
        {saved && (
          <p className="notice success" role="status">
            Përmbajtja u përditësua në demo.
          </p>
        )}
        <div className="button-row">
          <button className="button button-primary" type="submit">
            Ruaj përmbajtjen
          </button>
          <Link className="text-link" href="/about">
            Shiko About →
          </Link>
        </div>
      </form>
    </>
  );
}
