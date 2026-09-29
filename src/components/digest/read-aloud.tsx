"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { buildReadAloudScript } from "@/lib/digest/script";
import type { Digest } from "@/lib/digest/schema";
import { UI } from "@/lib/locale/labels";
import { speechLang, type DigestLocale } from "@/lib/locale/types";

type Status = "idle" | "playing" | "paused";

function pickVoice(locale: DigestLocale): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const lang = speechLang(locale);
  const exact = voices.find((v) => v.lang === lang || v.lang.replace("_", "-") === lang);
  if (exact) return exact;
  if (locale === "en-GB") {
    return (
      voices.find((v) => v.lang.toLowerCase().startsWith("en-gb")) ||
      voices.find((v) => v.lang.toLowerCase().startsWith("en")) ||
      null
    );
  }
  return (
    voices.find((v) => /zh(-|_)(hk|yue)/i.test(v.lang)) ||
    voices.find((v) => v.lang.toLowerCase().startsWith("zh")) ||
    null
  );
}

export function ReadAloud({ digest }: { digest: Digest }) {
  const locale = (digest.locale ?? "zh-HK") as DigestLocale;
  const t = UI[locale];
  const script = useMemo(() => buildReadAloudScript(digest), [digest]);
  const [status, setStatus] = useState<Status>("idle");
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    const warm = () => window.speechSynthesis?.getVoices();
    warm();
    window.speechSynthesis?.addEventListener("voiceschanged", warm);
    return () => {
      window.speechSynthesis?.cancel();
      window.speechSynthesis?.removeEventListener("voiceschanged", warm);
    };
  }, []);

  function speak() {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(script);
    utter.lang = speechLang(locale);
    const voice = pickVoice(locale);
    if (voice) utter.voice = voice;
    utter.rate = locale === "zh-HK" ? 1.02 : 1;
    utter.onend = () => setStatus("idle");
    utter.onerror = () => setStatus("idle");
    window.speechSynthesis.speak(utter);
    setStatus("playing");
  }

  function pause() {
    window.speechSynthesis.pause();
    setStatus("paused");
  }

  function resume() {
    window.speechSynthesis.resume();
    setStatus("playing");
  }

  function stop() {
    window.speechSynthesis.cancel();
    setStatus("idle");
  }

  if (!supported) return null;

  if (status === "idle") {
    return (
      <Button size="sm" variant="ghost" onClick={speak}>
        {t.readAloud}
      </Button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1">
      {status === "playing" ? (
        <Button size="sm" variant="ghost" onClick={pause}>
          {t.pause}
        </Button>
      ) : (
        <Button size="sm" variant="ghost" onClick={resume}>
          {t.resume}
        </Button>
      )}
      <Button size="sm" variant="ghost" onClick={stop}>
        {t.stop}
      </Button>
    </div>
  );
}
