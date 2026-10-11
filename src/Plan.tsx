export default function Plan({ variant = 'courtyard' }: { variant?: string }) {
  if (variant !== 'courtyard')
    return (
      <svg
        viewBox="0 0 800 570"
        className="floor-plan"
        role="img"
        aria-label={`${variant === 'form' ? 'Gallery display' : 'Workspace furniture'} arrangement with circulation and dimensions`}
      >
        <defs>
          <pattern
            id="studio-grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M20 0H0V20"
              fill="none"
              stroke="#d8d9d3"
              strokeWidth=".4"
            />
          </pattern>
        </defs>
        <rect width="800" height="570" fill="#eeefe9" />
        <rect x="40" y="30" width="720" height="510" fill="url(#studio-grid)" />
        <g stroke="#b0b3a9" strokeWidth="1" fill="none">
          <path d="M155 68H645M155 61V80M645 61V80M95 105V435M86 105H106M86 435H106" />
        </g>
        <g fill="#8b8e83" fontFamily="monospace" fontSize="10">
          <text x="376" y="61">
            12 400
          </text>
          <text x="70" y="286" transform="rotate(-90 70 286)">
            8 350
          </text>
        </g>
        <rect
          x="155"
          y="105"
          width="490"
          height="330"
          fill="#fafbf7"
          stroke="#41473c"
          strokeWidth="8"
        />
        <g stroke="#41473c" strokeWidth="5">
          <path d="M530 105V242M530 280V435M530 310H645" />
        </g>
        <g fill="#e5e9de" stroke="#8c9781" strokeWidth="1.5">
          {variant === 'form' ? (
            <>
              <rect x="215" y="175" width="75" height="44" />
              <rect x="350" y="175" width="110" height="44" />
              <rect x="215" y="285" width="75" height="44" />
              <rect x="350" y="285" width="110" height="44" />
              <rect x="550" y="130" width="72" height="28" />
              <path d="M180 130H495V142H180ZM180 394H495V406H180Z" />
            </>
          ) : (
            <>
              <rect x="200" y="152" width="100" height="40" />
              <rect x="200" y="223" width="100" height="40" />
              <rect x="200" y="295" width="100" height="40" />
              <rect x="374" y="194" width="110" height="120" rx="2" />
              <rect x="391" y="215" width="76" height="76" rx="10" />
              <g fill="#d4dccc">
                {[160, 230, 300].map((y) => (
                  <g key={y}>
                    <rect x="187" y={y} width="11" height="20" rx="3" />
                    <rect x="304" y={y} width="11" height="20" rx="3" />
                  </g>
                ))}
              </g>
            </>
          )}
          <rect x="553" y="348" width="67" height="26" />
          <circle cx="574" cy="359" r="6" />
        </g>
        <path
          d="M325 415V127M321 137L325 127L329 137"
          fill="none"
          stroke="#a3b296"
          strokeWidth="1.6"
          strokeDasharray="6 4"
        />
        <g
          fill="#69715f"
          fontFamily="sans-serif"
          fontSize="10"
          letterSpacing="1"
          textAnchor="middle"
        >
          <text x="350" y="376">
            {variant === 'form' ? 'GALLERY / DISPLAY' : 'OPEN WORKSPACE'}
          </text>
          <text x="587" y="207">
            {variant === 'form' ? 'RECEPTION' : 'LOUNGE'}
          </text>
          <text x="587" y="415">
            SERVICE
          </text>
          <text x="325" y="450">
            ENTRANCE
          </text>
          {variant !== 'form' && (
            <text x="429" y="258">
              MEETING
            </text>
          )}
        </g>
        <g fill="#686e60" fontFamily="monospace" fontSize="10">
          <text x="48" y="543">
            FIELDWORK / {variant.toUpperCase()} / GENERAL ARRANGEMENT
          </text>
          <text x="660" y="543">
            1:100 @ A3
          </text>
          <text x="712" y="48">
            N
          </text>
        </g>
        <path
          d="M716 60V88M711 68L716 60L721 68"
          fill="none"
          stroke="#686e60"
          strokeWidth="1.5"
        />
      </svg>
    )
  return (
    <svg
      viewBox="0 0 800 570"
      className="floor-plan"
      role="img"
      aria-label={`${variant === 'courtyard' ? 'Courtyard house' : 'Studio'} floor plan with rooms, dimensions and furniture`}
    >
      <defs>
        <pattern
          id="plan-grid"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <path d="M20 0H0V20" fill="none" stroke="#d8d9d3" strokeWidth=".4" />
        </pattern>
        <pattern
          id="plan-hatch"
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="5" stroke="#c0c2ba" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="800" height="570" fill="#eeefe9" />
      <rect x="40" y="30" width="720" height="510" fill="url(#plan-grid)" />
      <g fill="none" stroke="#b0b3a9" strokeWidth="1">
        <path d="M155 68H645M155 61V80M645 61V80M95 105V435M86 105H106M86 435H106" />
        <path d="M155 496H645M155 488V505M645 488V505" />
      </g>
      <g fontFamily="monospace" fontSize="10" fill="#8b8e83">
        <text x="375" y="61">
          12 400
        </text>
        <text x="70" y="285" transform="rotate(-90 70 285)">
          8 350
        </text>
        <text x="375" y="517">
          12 400
        </text>
      </g>
      <path
        d="M155 105H645V435H155Z M315 230H480V340H315Z"
        fill="#fafbf7"
        fillRule="evenodd"
        stroke="#41473c"
        strokeWidth="8"
      />
      <rect x="315" y="230" width="165" height="110" fill="#d5dccb" />
      <g fill="#afbe9e" opacity=".75">
        <circle cx="337" cy="257" r="14" />
        <circle cx="363" cy="249" r="11" />
        <circle cx="451" cy="316" r="14" />
        <circle cx="431" cy="309" r="10" />
      </g>
      <g stroke="#41473c" strokeWidth="5" fill="none">
        <path d="M155 220H280M280 105V220M480 105V195M480 195H645M155 340H280M280 340V435M480 340V435M530 195V340M530 340H645" />
      </g>
      <g stroke="#82917b" strokeWidth="2" fill="#eef1e9">
        <rect x="176" y="128" width="76" height="62" />
        <rect x="185" y="135" width="24" height="16" />
        <rect x="214" y="135" width="25" height="16" />
        <rect x="176" y="362" width="76" height="51" />
        <rect x="181" y="367" width="27" height="14" />
        <rect x="213" y="367" width="27" height="14" />
        <rect x="514" y="117" width="105" height="42" />
        <rect x="552" y="228" width="70" height="63" />
        <rect x="565" y="350" width="54" height="64" />
        <rect x="342" y="375" width="101" height="29" rx="2" />
        <path d="M342 380H443M342 399H443" />
      </g>
      <g stroke="#90988a" fill="none" strokeWidth="1.4">
        <path d="M281 190H311V220M311 190A30 30 0 0 1 281 220M281 342H311V372M311 342A30 30 0 0 1 281 372M479 195V225H509M479 225A30 30 0 0 1 509 195" />
        <path d="M202 105H252M202 101V109M252 101V109M155 260V311M150 260H160M150 311H160M350 435H424M350 431V439M424 431V439" />
      </g>
      <g
        fill="#69715f"
        fontFamily="sans-serif"
        fontSize="10"
        textAnchor="middle"
        letterSpacing="1"
      >
        <text x="217" y="206">
          BEDROOM 01
        </text>
        <text x="217" y="425">
          BEDROOM 02
        </text>
        <text x="388" y="180">
          LIVING ROOM
        </text>
        <text x="568" y="179">
          DINING
        </text>
        <text x="580" y="315">
          KITCHEN
        </text>
        <text x="590" y="428">
          UTILITY
        </text>
        <text x="397" y="285">
          COURTYARD
        </text>
        <text x="393" y="427">
          ENTRANCE
        </text>
      </g>
      <g fill="#686e60" fontFamily="monospace" fontSize="10">
        <text x="48" y="543">
          FIELDWORK / {variant.toUpperCase()} / GENERAL ARRANGEMENT
        </text>
        <text x="660" y="543">
          1:100 @ A3
        </text>
        <text x="712" y="48">
          N
        </text>
      </g>
      <path
        d="M716 60V88M711 68L716 60L721 68"
        fill="none"
        stroke="#686e60"
        strokeWidth="1.5"
      />
    </svg>
  )
}
