// web/app/components/Header.tsx
"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="nav">
      <div className="nav__inner">
        <Link href="/" className="nav__brand" aria-label="The Pixel Dream home">
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
        </Link>
        <div className="nav__actions">
          <a className="nav__login" href="/login">Login · Sign up</a>
        </div>
      </div>
    </header>
  );
}