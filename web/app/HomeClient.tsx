"use client";

// web/app/HomeClient.tsx

import { useEffect, useRef } from "react";

export default function HomeClient({ videoUrls }: { videoUrls: string[] }) {
  const allVideos = [...videoUrls, ...videoUrls];
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    const reelViewport = viewportRef.current;
    const reelTrack = trackRef.current;
    const reelSection = sectionRef.current;

    if (!reelViewport || !reelTrack) return;

    let animationFrameId: number;
    let marqueeStarted = false;

    function startMarquee() {
      if (marqueeStarted || !reelViewport || !reelTrack) return;
      marqueeStarted = true;

      reelViewport.style.overflowX = "auto";

      const loopMs = 32000;
      let scrollPos = 0;
      let last = performance.now();
      let pausedByHover = false;

      if (reelSection && window.matchMedia("(hover: hover)").matches) {
        const handleEnter = () => { pausedByHover = true; };
        const handleLeave = () => { pausedByHover = false; };
        reelSection.addEventListener("mouseenter", handleEnter);
        reelSection.addEventListener("mouseleave", handleLeave);
      }

      function tick(now: number) {
        const half = reelTrack!.scrollWidth * 0.5;

        if (half > 0 && !pausedByHover) {
          const dt = now - last;
          scrollPos += (half / loopMs) * dt;

          while (scrollPos >= half) {
            scrollPos -= half;
          }

          reelViewport!.scrollLeft = scrollPos;
        }

        last = now;
        animationFrameId = requestAnimationFrame(tick);
      }

      animationFrameId = requestAnimationFrame(tick);
    }

    function readyMarquee() {
      if (!reelViewport || !reelTrack) return;

      function startWhenReady() {
        const fullWidth = reelTrack!.scrollWidth;
        if (fullWidth > reelViewport!.clientWidth + 50) {
          startMarquee();
        } else {
          animationFrameId = requestAnimationFrame(startWhenReady);
        }
      }

      setTimeout(startWhenReady, 300);
    }

    if (document.readyState === "complete") {
      readyMarquee();
    } else {
      window.addEventListener("load", readyMarquee);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener("load", readyMarquee);
    };
  }, []);

  useEffect(() => {
    function tryPlayVideo(video: HTMLVideoElement) {
      if (!video) return;
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute("muted", "");
      const p = video.play();
      if (p !== undefined) p.catch(() => {});
    }

    function bootReelVideos() {
      document.querySelectorAll(".reel__slide video").forEach((v) => {
        const video = v as HTMLVideoElement;
        video.setAttribute("playsinline", "");
        video.setAttribute("webkit-playsinline", "");
        tryPlayVideo(video);
      });
    }

    document.querySelectorAll(".reel__slide video").forEach((v) => {
      const video = v as HTMLVideoElement;
      video.addEventListener("loadeddata", () => tryPlayVideo(video));
    });

    bootReelVideos();
    
    const handleTouch = () => bootReelVideos();
    const handleClick = () => bootReelVideos();
    const handleVisibility = () => { if (!document.hidden) bootReelVideos(); };
    const handlePageShow = (e: PageTransitionEvent) => { if (e.persisted) bootReelVideos(); };

    document.addEventListener("touchstart", handleTouch, { passive: true, capture: true, once: true });
    document.addEventListener("click", handleClick, { once: true });
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  return (
    <>
      <header className="nav">
        <div className="nav__inner">
          <a href="/" className="nav__brand" aria-label="The Pixel Dream home">
            <img
              className="nav__mark"
              src="/assets/nav-heart.png"
              alt=""
              width={33}
              height={28}
              decoding="async"
              aria-hidden="true"
            />
            <span className="nav__brand-text">The Pixel Dream</span>
          </a>
          <div className="nav__actions">
            <a className="nav__login" href="/login">Login · Sign up</a>
          </div>
        </div>
      </header>

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

          <section ref={sectionRef} className="reel" aria-label="Video previews">
            <div ref={viewportRef} className="reel__viewport" dir="ltr">
              <div ref={trackRef} className="reel__track">
                {allVideos.map((src, i) => (
                  <div
                    key={i}
                    className={`reel__slide${i >= videoUrls.length ? " reel__slide--dup" : ""}`}
                    aria-hidden={i >= videoUrls.length ? "true" : undefined}
                  >
                    <video
                      src={src}
                      muted
                      playsInline
                      loop
                      autoPlay
                      preload="auto"
                      tabIndex={i >= videoUrls.length ? -1 : undefined}
                    />
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
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80" alt="" />
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
            <img src="https://cdn.prod.website-files.com/685001cf708232477ed43d3f/689b51401f25fa51271c26c7_healdway.png" alt="" />
            <img src="https://cdn.prod.website-files.com/685001cf708232477ed43d3f/689b5140903006c3cea68b6b_clickfunnel.png" alt="" />
            <img src="https://cdn.prod.website-files.com/685001cf708232477ed43d3f/689b5140fc7e2b22c9c78c12_bendingspoon.png" alt="" />
            <img src="https://cdn.prod.website-files.com/685001cf708232477ed43d3f/689b5140cf0eceb0f779f0ba_asana.png" alt="" />
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
                <img src="https://cdn.prod.website-files.com/685001cf708232477ed43d3f/68c82db70b127fb633ecdf61_Frame%202087325049.webp" alt="" />
                <div><strong>Alex Cooper</strong><span>Founder @ Adcrate</span></div>
              </div>
              <div className="testi-card">
                <img src="https://cdn.prod.website-files.com/685001cf708232477ed43d3f/68ee7e070337dcb0227d51f9_image.webp" alt="" />
                <div><strong>Greg Isenberg</strong><span>CEO @ Late Checkout</span></div>
              </div>
              <div className="testi-card">
                <img src="https://cdn.prod.website-files.com/685001cf708232477ed43d3f/68c82db75be0d592d58004ec_Frame%202087325051.webp" alt="" />
                <div><strong>Sam Piliero</strong><span>CEO @ The Moonlighters</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="feature-dark">
          <div className="feature-dark__card">
            <div className="feature-dark__visual">
              <div className="feature-dark__stack">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=85" alt="" />
                <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=85" alt="" />
                <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=85" alt="" />
              </div>
              <img
                className="feature-dark__hero-img"
                src="https://cdn.prod.website-files.com/685001cf708232477ed43d3f/690be662e210dddca9d45726_The%20most%20realistic%20and%20captivating%20AI%20Actors.webp"
                alt="AI models preview"
              />
            </div>
            <h2>Ultra-realistic <em>AI models</em></h2>
            <p className="sub">
              The largest library of licensable AI faces and bodies — built for monetization workflows.
            </p>
            <a className="btn-sparkle" href="/marketplace">
              <img src="https://cdn.prod.website-files.com/685001cf708232477ed43d3f/68930995f165ad9969fa1efd_sparkles-2.png" width={22} height={22} alt="" aria-hidden="true" />
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
              <li><a href="/">Home</a></li>
              <li><a href="/marketplace">Marketplace</a></li>
              <li><a href="#workflow">More Services</a></li>
            </ul>
          </div>
        </div>
        <div className="footer__rule" />
        <div className="footer__bottom">
          <p className="copy">Copyright © 2026 The Pixel Dream</p>
          <div className="footer__legal">
            <a href="#">Help &amp; support</a>
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
          </div>
        </div>
      </footer>


    </>
  );
}
