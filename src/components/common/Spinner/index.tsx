export function Spinner({
  className,
  wrapperClassName,
}: {
  className?: string;
  wrapperClassName?: string;
}) {
  return (
    <div
      className={`flex justify-center items-center h-full py-20 w-full mx-auto ${wrapperClassName}`}
    >
      <div
        className={`size-20 p-2 aspect-square rounded-full border-[#25b09b] border-2 border-t-transparent animate-spin ${className}`}
      ></div>
    </div>
  );
}

export default Spinner;
