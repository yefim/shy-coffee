import { useEffect, useRef, useState } from "react";
import "./App.css";

import { createClient } from "@supabase/supabase-js";
import * as Dialog from "@radix-ui/react-dialog";
import { sample } from "lodash";
import { LoadingOutlined } from "@ant-design/icons";
import { flushSync } from "react-dom";

const supabaseUrl = "https://nlmvouryycplqrhwjnxe.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sbXZvdXJ5eWNwbHFyaHdqbnhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDIzNTU4MDcsImV4cCI6MjAxNzkzMTgwN30.DNwk34GuKgDUicfJ3pjYsP_abyaFbscPWU37eARvj4U";
const supabase = createClient(supabaseUrl, supabaseKey);

interface Cafe {
  id: number;
  name: string;
  address: string;
  notes: string | null;
  createdAt: Date;
}

function App() {
  const [cafes, setCafes] = useState<Cafe[] | "loading">("loading");
  const [name, setName] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<"idle" | "pending">("idle");
  const [id, setId] = useState<number>();
  const placeholder = useRef<string>(getPlaceholder());
  const [user, setUser] = useState<string>();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(event, session?.user.email);
      const email = session?.user.email;

      if (
        (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
        !!email &&
        email !== user
      ) {
        setUser(email);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  function clearMe() {
    setName("");
    setAddress("");
    setNotes("");
    setId(undefined);
    setStatus("idle");
  }

  useEffect(() => {
    async function loadCafes() {
      console.log("Fetching cafes...");

      const { data, error } = await supabase
        .from("Cafes")
        .select()
        .order("created_at", { ascending: true });
      if (error == null && !!data) {
        const newCafes = data.map((row) => ({
          id: row.id,
          name: row.name,
          address: row.address,
          notes: row.notes,
          createdAt: new Date(row.created_at),
        }));
        console.log("Got cafes", newCafes);

        flushSync(() => {
          setCafes((prevCafes) =>
            prevCafes === "loading" ? newCafes : [...prevCafes, ...newCafes],
          );
        });

        window.scrollTo(0, document.body.scrollHeight);
      }
    }
    loadCafes();
  }, []);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;

    setStatus("pending");

    const cafe: Omit<Cafe, "id" | "createdAt"> = {
      name: name.trim(),
      address: address.trim(),
      notes: notes.trim() || null,
    };

    if (id == null) {
      console.log("Adding cafe...");
      const { error, data } = await supabase
        .from("Cafes")
        .insert(cafe)
        .select();

      if (error) {
        alert(
          `${user} is not allowed to update Shy.coffee. This incident will be reported.`,
        );
        setStatus("idle");
      } else if (data) {
        const newCafe: Cafe = {
          id: data[0].id,
          name: data[0].name,
          address: data[0].address,
          notes: data[0].notes,
          createdAt: new Date(data[0].created_at),
        };

        console.log(newCafe);
        setTimeout(() => {
          flushSync(() => {
            setCafes((prevCafes) =>
              prevCafes === "loading" ? [newCafe] : [...prevCafes, newCafe],
            );
            setOpen(false);
            clearMe();
          });

          window.scrollTo(0, document.body.scrollHeight);
        }, 400);
      }
    } else {
      console.log("Updating cafe...");
      const { error, data } = await supabase
        .from("Cafes")
        .update(cafe)
        .eq("id", id)
        .select();

      if (error) {
        alert(
          `${user} is not allowed to update Shy.coffee. This incident will be reported.`,
        );
        setStatus("idle");
      } else if (data) {
        const updatedCafe: Cafe = {
          id: data[0].id,
          name: data[0].name,
          address: data[0].address,
          notes: data[0].notes,
          createdAt: new Date(data[0].created_at),
        };

        console.log(updatedCafe);
        setTimeout(() => {
          setCafes((prevCafes) => {
            if (prevCafes === "loading") return [updatedCafe];

            const index = prevCafes.findIndex((c) => c.id === updatedCafe.id);
            const clone = [...prevCafes];
            clone[index] = updatedCafe;
            return clone;
          });
          setOpen(false);
          clearMe();
        }, 400);
      }
    }
  }

  const editing =
    id == null || cafes === "loading"
      ? undefined
      : cafes.find((c) => c.id === id);

  return (
    <>
      {cafes === "loading" ? (
        <LoadingOutlined />
      ) : (
        <>
          <h1 className="heading-1">
            Shy.coffee is a place for Shy to collect all sorts of coffee
            recommendations
          </h1>
          <div className="cafes">
            {cafes.length > 0 &&
              cafes.map((cafe, i) => (
                <Cafe
                  key={i}
                  cafe={cafe}
                  onClick={() => {
                    setName(cafe.name);
                    setAddress(cafe.address);
                    setNotes(cafe.notes || "");
                    setId(cafe.id);
                    setOpen(true);
                  }}
                />
              ))}
          </div>
        </>
      )}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button onClick={clearMe} className="add-a-spot-btn" type="button">
            Add a spot
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="DialogOverlay" />
          <Dialog.Content className="DialogContent">
            {user ? (
              <>
                <h2>
                  {editing == null ? "Add a spot" : `Edit ${editing.name}`}
                </h2>
                <form
                  autoComplete="off"
                  className="add-a-spot"
                  method="post"
                  onSubmit={handleSubmit}
                >
                  <label>
                    <span className="emoji">📇</span> Name
                    <input
                      type="text"
                      autoComplete="off"
                      placeholder="Coffee Deluxe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </label>
                  <label>
                    <span className="emoji">📍</span> Address
                    <input
                      type="text"
                      autoComplete="off"
                      placeholder="123 Bean St"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </label>
                  <label>
                    <span className="emoji">📝</span> Notes (optional)
                    <textarea
                      rows={3}
                      autoComplete="off"
                      placeholder={placeholder.current || ""}
                      onChange={(e) => setNotes(e.target.value)}
                      value={notes}
                    />
                    {!!editing && (
                      <span className="timestamp">
                        Added {editing.createdAt.toLocaleDateString()}
                      </span>
                    )}
                  </label>
                  <div className="action-buttons">
                    <button disabled={status === "pending"} type="submit">
                      {status === "idle"
                        ? id == null
                          ? "Add"
                          : "Update"
                        : id == null
                          ? "Adding..."
                          : "Updating..."}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <button
                className="login-with-google-btn"
                onClick={() => {
                  supabase.auth.signInWithOAuth({
                    provider: "google",
                  });
                }}
                type="button"
              >
                Sign in with Google 👀
              </button>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function getPlaceholder(): string {
  return sample([
    "The coffee here really took my breath away...",
    "Immaculate vibes all around...",
    "Loved every second...",
    "☕️❤️...",
    "Divine pastries, need I say otherwise??",
  ]);
}

function Cafe({ cafe, onClick }: { cafe: Cafe; onClick: () => void }) {
  const prettyAddress = (cafe.address.split(",").at(0) || "")
    .replace(/^\d+\w?\s/, "")
    .trim();

  return (
    <div className="cafe">
      <button className="edit-btn" type="button" onClick={onClick}>
        ✍️
      </button>
      <h2>{cafe.name}</h2>
      {cafe.notes && (
        <div className="notes">
          <span>📝</span>
          <p>{cafe.notes}</p>
        </div>
      )}
      <a
        className="location-link"
        target="_blank"
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          cafe.address,
        )}`}
      >
        📍 Take me there{prettyAddress && ` (${prettyAddress})`}
      </a>
    </div>
  );
}

export default App;
