import clsx from 'clsx';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={clsx('bg-gray-200 animate-pulse rounded-md', className)}
      {...props}
    />
  );
}

export { Skeleton };
