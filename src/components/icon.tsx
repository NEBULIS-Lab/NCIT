type IconName = 'arrow-right' | 'arrow-up-right' | 'arrow-up' | 'expand' | 'collapse' | 'menu' | 'close';

const paths: Record<IconName, string> = {
  'arrow-right': 'M4.5 12h14.75M13 5.75 19.25 12 13 18.25',
  'arrow-up-right': 'M6.5 17.5 17.5 6.5M6.5 6.5h11v11',
  'arrow-up': 'M12 19.5V4.75M5.75 11 12 4.75 18.25 11',
  expand: 'M8.5 4.5h-4v4M15.5 4.5h4v4M19.5 15.5v4h-4M8.5 19.5h-4v-4',
  collapse: 'M4.5 8.5h4v-4M15.5 4.5v4h4M19.5 15.5h-4v4M8.5 19.5v-4h-4',
  menu: 'M4.5 7h15M4.5 12h15M4.5 17h15',
  close: 'm6 6 12 12M6 18 18 6',
};

export default function Icon({name,className=''}:{name:IconName;className?:string}) {
  return <svg className={`ui-icon icon-${name} ${className}`} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]}/></svg>;
}
