import { useState } from "react";
import { waitlistCollection } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useAtomValue } from "jotai";
import { translationAtom } from "@/atoms/translations-atom";

const nameRegex = /^[A-Za-z\s.'-]+$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const UpscaylCloudModal = ({ show, setShow, setDontShowCloudModal }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const t = useAtomValue(translationAtom);

  return (
    <dialog className={`modal ${show && "modal-open"}`}>
      <div className="modal-box flex flex-col items-center gap-4 text-center">
        <button
          className="btn btn-circle absolute top-2 right-4"
          onClick={() => setShow(false)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <rect
              x="0"
              y="0"
              width="24"
              height="24"
              fill="none"
              stroke="none"
            />
            <path
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="1.5"
              d="m8.464 15.535l7.072-7.07m-7.072 0l7.072 7.07"
            />
          </svg>
        </button>
        <p className="badge badge-neutral text-xs">
          {t("Coming soon!")}
        </p>
        <p className="text-2xl font-semibold">{t("Introducing Upscayl Cloud!")}</p>
        <p className="w-9/12 text-lg font-medium">
          {t("No more errors, hardware issues, quality compromises or long loading times!")}
        </p>

        <div className="flex flex-col gap-2 text-start">
          <pre style={{ fontFamily: "inherit" }} className="leading-8">
            {t("🌐 Upscayl anywhere, anytime, any device\n☁️ No Graphics Card or hardware required\n👩 Face Enhancement\n🦋 10+ models to choose from\n🏎 5x faster than Upscayl Desktop\n🎞 Video Upscaling\n💰 Commercial Usage\n😴 Upscayl while you sleep")}
          </pre>
        </div>

        <form
          className="flex flex-col items-center gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              name &&
              email &&
              nameRegex.test(name) &&
              emailRegex.test(email)
            ) {
              try {
                await setDoc(doc(waitlistCollection, email), {
                  name,
                  email,
                });
              } catch (error) {
                alert(t("Thank you {name}! It seems that your email has already been registered :D If that's not the case, please try again.", { name }));
                return;
              }
              setName("");
              setEmail("");
              setDontShowCloudModal(true);
              setShow(false);
              alert(t("Thank you for joining the waitlist! We will notify you when Upscayl Cloud is ready for you."));
            } else {
              alert(t("Please fill in all the fields correctly."));
            }
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              className="input input-bordered"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="email"
              className="input input-bordered"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="bg-success text-success-content rounded-2xl px-4 py-2"
          >
            {t("Join the waitlist")}
          </button>

          <button
            className="text-base-content/50 text-xs"
            onClick={() => {
              setDontShowCloudModal(true);
              setShow(false);
            }}
            type="button"
          >
            {t("DON'T SHOW AGAIN")}
          </button>
        </form>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button onClick={() => setShow(false)}>
          {t("Close")}
        </button>
      </form>
    </dialog>
  );
};
