import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { label: "Início", href: "/" },
  { label: "Cardápio", href: "/cardapio" },
  { label: "Sobre Nós", href: "/sobre" },
  { label: "Contato", href: "/contato" },
];

const socialLinks = [
  {
    label: "Instagram",
    href: "https://instagram.com/seuusuario",
    icon: InstagramIcon,
  },
  {
    label: "Facebook",
    href: "https://facebook.com/suapagina",
    icon: FacebookIcon,
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/55SEUNUMERO",
    icon: WhatsAppIcon,
  },
];

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.67.15-.198.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.075-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.001 2C6.478 2 2 6.477 2 12c0 1.888.525 3.653 1.437 5.159L2 22l4.965-1.402A9.953 9.953 0 0 0 12.001 22c5.523 0 10-4.477 10-10S17.524 2 12.001 2zm0 18.2a8.16 8.16 0 0 1-4.169-1.14l-.299-.177-2.945.832.8-2.906-.194-.298A8.16 8.16 0 0 1 3.8 12c0-4.522 3.678-8.2 8.201-8.2 4.522 0 8.2 3.678 8.2 8.2 0 4.523-3.678 8.2-8.2 8.2z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-200">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-3 py-8 md:flex-row md:justify-between md:gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="relative md:h-19 md:w-19  h-11 w-11">
            <Image
              src="/icon.png"
              alt=""
              fill
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <div className="leading-tight">
            <span className="text-lg font-bold">
              Sabor<span className="text-orange-500">Top</span>
            </span>
            <p className="text-xs text-neutral-400">
              Burgers, Pizzas e Muito Mais
            </p>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="flex flex-wrap items-center justify-center gap-4 text-sm sm:gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-neutral-300 transition-colors hover:text-orange-500"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Social + copyright */}
        <div className="flex flex-col items-center gap-3 md:items-end">
          <div className="flex items-center gap-3">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-neutral-200 transition-colors hover:bg-orange-500 hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} SaborTop. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
