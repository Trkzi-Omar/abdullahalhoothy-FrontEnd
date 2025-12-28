const LandingLogo = () => {
  return (
    <div className="flex items-center shrink-0">
      <img
        src="/images/landing/logo-full.png"
        alt="S-LOC Logo"
        className="h-16 md:h-20 w-auto object-contain transition-all duration-300"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          const parent = e.currentTarget.parentNode as HTMLElement;
          if (parent) {
            parent.innerHTML = '<span class="text-white font-black text-4xl">S-LOC</span>';
          }
        }}
      />
    </div>
  );
};

export default LandingLogo;
