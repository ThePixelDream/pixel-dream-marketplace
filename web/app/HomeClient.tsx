"use client";

// web/app/HomeClient.tsx

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function HomeClient({ videoUrls }: { videoUrls: string[] }) {
  const allVideos = [...videoUrls, ...videoUrls];
  const sectionRef = useRef<HTMLElement>(null);

  // Força o React a remontar o carrossel se o usuário voltar via bfcache
  const [reelKey, setReelKey] = useState(0);

  // EFFECT 1: Controle de pausa ao passar o mouse (apenas em dispositivos com hover)
  useEffect(() => {
    const reelSection = sectionRef.current;
    if (!reelSection) return;

    const handleEnter = () => reelSection.classList.add("reel--paused");
    const handleLeave = () => reelSection.classList.remove("reel--paused");

    if (window.matchMedia("(hover: hover)").matches) {
      reelSection.addEventListener("mouseenter", handleEnter);
      reelSection.addEventListener("mouseleave", handleLeave);
    }

    return () => {
      reelSection.removeEventListener("mouseenter", handleEnter);
      reelSection.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  // EFFECT 2: Forçar reprodução e detectar o botão "Voltar" (bfcache)
  useEffect(() => {
    function tryPlayVideo(video: HTMLVideoElement) {
      if (!video) return;
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");

      const p = video.play();
      if (p !== undefined) {
        p.catch(() => {
          // Fallback: se o navegador bloquear, tenta dar play no primeiro toque
          const playOnInteraction = () => {
            video.play();
          };
          document.addEventListener("click", playOnInteraction, { once: true });
          document.addEventListener("touchstart", playOnInteraction, { once: true });
        });
      }
    }

    function bootReelVideos() {
      document.querySelectorAll(".reel__slide video").forEach((v) => {
        tryPlayVideo(v as HTMLVideoElement);
      });
    }

    // Dá o play assim que cada vídeo carregar os primeiros dados
    document.querySelectorAll(".reel__slide video").forEach((v) => {
      const video = v as HTMLVideoElement;
      video.addEventListener("loadeddata", () => tryPlayVideo(video), { once: true });
    });

    bootReelVideos();

    // INTERCEPÇÃO DO BOTÃO VOLTAR (bfcache)
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setReelKey((prev) => prev + 1);
        setTimeout(bootReelVideos, 50);
      }
    };

    const handleVisibility = () => {
      if (!document.hidden) bootReelVideos();
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [videoUrls]);

  return (
    <>
      <main>
        <div className="hero-band">
          <section className="hero">
            <h1 className="hero__title">
              <span className="hero__accent">Ultra realistic AI models</span>
              Built to Monetize.
            </h1>
            <p className="hero__sub">
              AI girls available for monetization, licensing, and exclusive acquisition.
            </p>
            <div className="hero__cta-row">
              <a className="btn-hero-black" href="/marketplace">View Marketplace</a>
              <div className="hero__secondary-row">
                <a className="btn-hero-white" href="#workflow">More Services</a>
                <a className="btn-hero-white" href="/signup?affiliate=1">Become an Affiliate</a>
              </div>
            </div>
          </section>

          {/* Carrossel de vídeos — key força remontagem após bfcache */}
          <section ref={sectionRef} className="reel" aria-label="Video previews" key={reelKey}>
            <div className="reel__viewport" dir="ltr">
              <div className="reel__track">
                {allVideos.map((src, i) => (
                  <div
                    key={i}
                    className={`reel__slide${i >= videoUrls.length ? " reel__slide--dup" : ""}`}
                    aria-hidden={i >= videoUrls.length ? "true" : undefined}
                  >
                    {/*
                      Otimizações de vídeo para mobile:
                      - preload="metadata": carrega apenas os metadados inicialmente,
                        evitando download massivo de dados na GPU no carregamento da página.
                      - muted + playsInline: obrigatórios para autoplay no iOS/Android.
                      - loop: reprodução contínua sem interação.
                      - O atributo "autoPlay" é complementado pelo useEffect acima,
                        garantindo compatibilidade com Safari e bfcache.
                    */}
                    <video
                      muted
                      playsInline
                      loop
                      autoPlay
                      preload="metadata"
                      tabIndex={i >= videoUrls.length ? -1 : undefined}
                    >
                      {/*
                        Suporte a WebM como fonte primária (codec VP9/AV1 — menor bitrate,
                        melhor compressão, menos calor na GPU mobile).
                        O MP4 fica como fallback para Safari antigo e iOS < 14.
                        Nota: os vídeos externos (andreatuysuzian.com) são .mp4.
                        Quando migrados para o Supabase Storage, fornecer ambos os formatos.
                      */}
                      {src.replace(/\.mp4$/i, ".webm") !== src ? (
                        <>
                          <source src={src.replace(/\.mp4$/i, ".webm")} type="video/webm" />
                          <source src={src} type="video/mp4" />
                        </>
                      ) : (
                        <source src={src} type="video/mp4" />
                      )}
                    </video>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className="band-dark" id="workflow">
          <div className="band-dark__inner">
            <h2>
              New at The Pixel Dream,
              <br />
              <em>Create your workflow.</em>
            </h2>
            <p className="lead">
              Bring every ad tool and workflow onto one infinite canvas — create, test, and scale
              campaigns faster with your team.
            </p>
            <a className="btn-dark-pill" href="/marketplace">
              <span className="ico" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <path d="M10 6.5h4M10 17.5h4M6.5 10v4M17.5 10v4" />
                </svg>
              </span>
              Create your workflow
            </a>
            <div className="canvas-mock" aria-hidden="true">
              <div className="canvas-mock__grid">
                <div className="canvas-card">
                  <span>Image generator</span>
                  <div className="ph">◇</div>
                </div>
                <div className="canvas-card">
                  <span>Upscaler</span>
                  {/* width e height explícitos para evitar CLS */}
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80"
                    alt=""
                    width={160}
                    height={78}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="strip">
          <div className="strip__head">
            <h3>Used by <em>6,000+ teams</em> worldwide</h3>
            <p>D2C brands, app studios, lead gen, and growth agencies.</p>
          </div>
          <div className="strip__logos">
            {/* Logos com width/height explícitos para evitar CLS */}
            <img src="https://cdn.prod.website-files.com/685001cf708232477ed43d3f/689b51401f25fa51271c26c7_healdway.png" alt="" width={120} height={26} loading="lazy" decoding="async" />
            <img src="https://cdn.prod.website-files.com/685001cf708232477ed43d3f/689b5140903006c3cea68b6b_clickfunnel.png" alt="" width={120} height={26} loading="lazy" decoding="async" />
            <img src="https://cdn.prod.website-files.com/685001cf708232477ed43d3f/689b5140fc7e2b22c9c78c12_bendingspoon.png" alt="" width={120} height={26} loading="lazy" decoding="async" />
            <img src="https://cdn.prod.website-files.com/685001cf708232477ed43d3f/689b5140cf0eceb0f779f0ba_asana.png" alt="" width={120} height={26} loading="lazy" decoding="async" />
          </div>
        </section>

        <section className="testi" id="testimonials">
          <div className="testi__inner">
            <div className="testi__title">
              <h2>Recommended by <em>top OFM marketers</em></h2>
            </div>
            <p className="testi__sub">Check out some reviews</p>
            <div className="testi__scroller">
              <div className="testi-card">
                {/* Avatares com width/height explícitos — evitam CLS e são below-the-fold */}
                <img src="https://cdn.prod.website-files.com/685001cf708232477ed43d3f/68c82db70b127fb633ecdf61_Frame%202087325049.webp" alt="" width={52} height={52} loading="lazy" decoding="async" />
                <div><strong>Alex Cooper</strong><span>Founder @ Adcrate</span></div>
              </div>
              <div className="testi-card">
                <img src="https://cdn.prod.website-files.com/685001cf708232477ed43d3f/68ee7e070337dcb0227d51f9_image.webp" alt="" width={52} height={52} loading="lazy" decoding="async" />
                <div><strong>Greg Isenberg</strong><span>CEO @ Late Checkout</span></div>
              </div>
              <div className="testi-card">
                <img src="https://cdn.prod.website-files.com/685001cf708232477ed43d3f/68c82db75be0d592d58004ec_Frame%202087325051.webp" alt="" width={52} height={52} loading="lazy" decoding="async" />
                <div><strong>Sam Piliero</strong><span>CEO @ The Moonlighters</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="feature-dark">
          <div className="feature-dark__card">
            <div className="feature-collage-wrapper">
              {/*
                next/image para a colagem de modelos:
                - Serve WebP/AVIF automaticamente
                - Evita CLS com placeholder blur
                - Otimiza tamanho por viewport (srcset automático)
              */}
              <Image
                src="/assets/models-collage.jpg"
                alt="AI Models Collage"
                className="feature-collage-static"
                width={920}
                height={460}
                priority={false}
                loading="lazy"
                quality={80}
              />
            </div>
            <h2>Ultra-realistic <em>AI models</em></h2>
            <p className="sub">
              The largest library of licensable AI faces and bodies — built for monetization workflows.
            </p>
            <a className="btn-sparkle" href="/marketplace">
              <img
                src="https://cdn.prod.website-files.com/685001cf708232477ed43d3f/68930995f165ad9969fa1efd_sparkles-2.png"
                width={22}
                height={22}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
              />
              Browse the library
            </a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer__grid">
          <div className="footer__col">
            <h4>Quick Links</h4>
            <ul>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/marketplace">Marketplace</Link></li>
              <li><a href="#workflow">More Services</a></li>
            </ul>
          </div>
        </div>
        <div className="footer__rule" />
        <div className="footer__bottom">
          <p className="copy">Copyright © 2026 The Pixel Dream</p>
          <div className="footer__legal">
            <Link href="/support">Help &amp; support</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
