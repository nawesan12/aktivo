import Link from "next/link";
import { JikuLogo } from "@/components/brand/jiku-logo";

/**
 * Site footer and legal line.
 */
export function Footer() {
  return (
    <footer className="jiku-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link href="/" className="nav-logo" style={{ marginBottom: 4 }}>
              <JikuLogo size="md" />
            </Link>
            <p className="footer-brand-desc">
              El <span className="jade">eje</span> de tu negocio. Más que turnos, crecimiento.
            </p>
          </div>
          <div className="footer-col">
            <h4>Producto</h4>
            <a href="#features">
              Funciones
            </a>
            <a href="#pricing">
              Planes
            </a>
            <a href="#">Integraciones</a>
            <a href="#">API</a>
          </div>
          <div className="footer-col">
            <h4>Recursos</h4>
            <a href="#">Centro de ayuda</a>
            <a href="#">Blog</a>
            <a href="#">Guías</a>
            <a href="#">Status</a>
          </div>
          <div className="footer-col">
            <h4>Empresa</h4>
            <a href="#">Nosotros</a>
            <a href="#">Contacto</a>
            <a href="#">Términos</a>
            <a href="#">Privacidad</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Jiku. Todos los derechos reservados.</span>
          <span className="serif" style={{ fontStyle: "italic", fontSize: "0.85rem" }}>
            <span className="jade">軸</span> — El <span className="jade">eje</span> de tu negocio
          </span>
        </div>
      </div>
    </footer>
  );
}
