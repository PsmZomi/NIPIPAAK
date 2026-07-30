const PAWLPI_HERO_IMG =
  "https://res.cloudinary.com/dpgqehxeh/image/upload/e_background_removal/f_png/v1772016903/clmwampvntxosiidecar.png";

export default function Pawlpi() {
  return (
    <header className="text-center pt-0 mb-3 lg:mb-4">
      <div className="flex flex-col items-center gap-1.5">
        <h1
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-ink tracking-tight leading-none"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Pawlpi
        </h1>
        <img
          src={PAWLPI_HERO_IMG}
          alt="Pawlpi"
          className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 object-contain"
        />
      </div>
    </header>
  );
}
