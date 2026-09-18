import { Icons } from "../components/Icons";

interface PortalProps {
  onEnter: () => void;
}

export function Portal({ onEnter }: PortalProps) {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-sans"
      style={{
        backgroundColor: "#065f46",
        backgroundImage: "url('/portal-background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* ── Logo — top-left ── */}
      <header
        className="absolute z-30"
        style={{ top: "26px", left: "32px" }}
      >
        <img
          src="/logorsi.png"
          alt="RSI Sultan Agung"
          style={{
            height: "56px",
            width: "auto",
            objectFit: "contain",
            display: "block",
          }}
        />
      </header>

      {/* ── Heading + Description — down into the white/mint transition ── */}
      <div
        className="absolute z-20 flex flex-col"
        style={{
          left: "11vw",
          top: "calc(27% + 72px)",
          gap: "18px",
          maxWidth: "720px",
        }}
      >
        {/* Heading */}
        <h1
          style={{
            color: "#075E4B",
            fontWeight: 700,
            fontSize: "clamp(48px, 3.6vw, 52px)",
            lineHeight: 1.05,
            margin: 0,
            whiteSpace: "pre-line",
            maxWidth: "720px",
          }}
        >
          {"Sistem Peminjaman dan\nPengembalian Rekam Medis"}
        </h1>

        {/* Description */}
        <p
          style={{
            color: "#4C8F83",
            fontSize: "clamp(13px, 1vw, 15px)",
            lineHeight: 1.6,
            margin: 0,
            maxWidth: "580px",
            fontWeight: 400,
          }}
        >
          Layanan pengelolaan, peminjaman, dan penelusuran berkas rekam
          <br />
          medis RSI Sultan Agung yang cepat, aman, paperless, dan berintegritas
          <br />
          syariah.
        </p>
      </div>

      {/* ── CTA — independent positioning, lower portion of the page ── */}
      <div
        className="absolute z-20"
        style={{ left: "11vw", top: "83%" }}
      >
        <button
          onClick={onEnter}
          className="group flex items-center gap-4 bg-white hover:bg-gray-50 text-[#065f46] rounded-full pr-8 pl-2 py-2 shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
          style={{ border: "2px solid transparent" }}
        >
          <div className="w-12 h-12 bg-[#fbbf24] rounded-full flex items-center justify-center text-white transition-transform duration-300 group-hover:rotate-12 shadow-inner">
            <Icons.ChevronRight />
          </div>
          <span className="font-bold tracking-widest text-sm">
            MASUK KE SISTEM
          </span>
        </button>
      </div>

      {/* ── Rekam Medis card — right side ── */}
      <div
        className="absolute z-10 pointer-events-none"
        style={{ top: "18%", right: "10%" }}
      >
        <div
          className="bg-gradient-to-br from-[#14b8a6] to-[#0f766e] rounded-[2rem] flex flex-col overflow-hidden relative"
          style={{
            width: "280px",
            height: "390px",
            transform: "rotate(6deg)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          {/* top-right dots */}
          <div className="absolute top-5 right-5 flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
          </div>

          {/* top-left bar */}
          <div className="absolute top-6 left-6">
            <div className="w-10 h-1.5 rounded-full bg-white/30" />
          </div>

          {/* centre icon + label */}
          <div className="flex-1 flex flex-col items-center justify-center gap-5 mt-4">
            <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner text-white">
              <Icons.DataRM />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <h2 className="text-2xl font-bold text-white tracking-wide">
                Rekam Medis
              </h2>
              <div className="w-12 h-1 bg-[#fbbf24] rounded-full" />
            </div>
          </div>

          {/* bottom bar */}
          <div
            className="border-t border-white/10 p-5 flex flex-col justify-center gap-2"
            style={{ height: "80px", background: "rgba(255,255,255,0.05)" }}
          >
            <div className="w-full h-1.5 bg-white/20 rounded-full" />
            <div className="w-2/3 h-1.5 bg-white/10 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
