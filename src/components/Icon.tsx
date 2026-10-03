type IconName =
  | 'arrow'
  | 'down'
  | 'close'
  | 'menu'
  | 'source'
  | 'rotate'
  | 'expand'
  | 'sun'
  | 'plus'
  | 'sound'
  | 'soundOff';
const paths: Record<IconName, string> = {
  arrow: 'M4 12h15M13 5l7 7-7 7',
  down: 'M12 4v16M5 13l7 7 7-7',
  close: 'M5 5l14 14M19 5 5 19',
  menu: 'M4 7h16M4 16h16',
  source: 'M5 3h11l3 3v15H5zM8 9h8M8 13h8M8 17h5',
  rotate: 'M20 7v5h-5M19.5 12a7.5 7.5 0 1 0-2 6',
  expand: 'M9 4H4v5M15 4h5v5M20 15v5h-5M4 15v5h5',
  sun: 'M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M19 5l-1 1M6 18l-1 1M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  plus: 'M12 5v14M5 12h14',
  sound: 'M11 5 6 9H3v6h3l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13',
  soundOff: 'M11 5 6 9H3v6h3l5 4V5zM22 9l-6 6M16 9l6 6',
};
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
