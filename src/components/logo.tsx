const Logo = function () {
  return (
    <div className="logo">
      <svg
        id="sw-js-blob-svg"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        {" "}
        <defs>
          {" "}
          <linearGradient id="sw-gradient" x1="0" x2="1" y1="1" y2="0">
            {" "}
            <stop
              id="stop1"
              stopColor="rgba(55, 248, 195.69, 1)"
              offset="0%"
            ></stop>{" "}
            <stop
              id="stop2"
              stopColor="rgba(31, 183.919, 251, 1)"
              offset="100%"
            ></stop>{" "}
          </linearGradient>{" "}
        </defs>{" "}
        <path
          fill="url(#sw-gradient)"
          d="M26.6,-22.8C32.8,-13.4,35.1,-2.4,32.8,7.4C30.5,17.2,23.6,26,14,31.4C4.5,36.9,-7.7,39.1,-17.3,34.9C-26.9,30.6,-33.9,20,-36.7,8.2C-39.6,-3.5,-38.1,-16.4,-31.3,-26C-24.5,-35.6,-12.2,-41.8,-1,-41C10.2,-40.2,20.4,-32.3,26.6,-22.8Z"
          width="100%"
          height="100%"
          transform="translate(50 50)"
          strokeWidth="0"
        ></path>{" "}
      </svg>
    </div>
  );
};
export default Logo;
