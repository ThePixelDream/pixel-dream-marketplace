// web/app/components/Header.tsx
"use client";

import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="nav">
      <div className="nav__inner">
        <Link href="/" className="nav__brand" aria-label="The Pixel Dream home">
          {/*
            next/image para a logo:
            - width e height explícitos eliminam o CLS (Layout Shift) no iOS Safari
            - priority=true: a logo está na primeira dobra — carregada com alta prioridade
            - next/image gera automaticamente o srcset e serve WebP/AVIF quando suportado
          */}
          <Image
            className="nav__mark"
            src="/assets/nav-heart.png"
            alt=""
            width={33}
            height={28}
            priority
            aria-hidden="true"
            style={{ imageRendering: "pixelated" }}
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
