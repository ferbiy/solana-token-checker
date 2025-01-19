import * as React from "react";
import { SVGProps, memo } from "react";

const SolscanIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={266.667}
    height={266.667}
    viewBox="0 0 200 200"
  >
    <path d="M91 61.6c-5.1 1-14.6 6.4-19.1 10.7-2.5 2.5-5.8 7.2-7.5 10.4-2.7 5.4-2.9 6.6-2.9 17.3 0 10.7.2 11.9 2.9 17.3 3.9 7.7 10.6 14.2 18.6 18 6.1 2.9 7.2 3.1 17 3.1 9.6-.1 11-.3 16.5-3.1 11.8-6 19.7-16.9 21.5-29.4 2.5-17.3-6-33.5-21.5-41.1-4.9-2.5-7.5-3-14.5-3.3-4.7-.2-9.6-.1-11 .1z" />
  </svg>
);

export default memo(SolscanIcon);
