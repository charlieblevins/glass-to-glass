import React from "react";

const FAQ: React.FC = () => {
  return (
    <div>
      <h1>F.A.Q.</h1>
      <article>
        <div id="faq-purpose" className="faq-group">
          <h2>What is this tool's purpose?</h2>
          <p>
            The purpose is to measure the latency (or delay) of a live video
            stream. Here is a{" "}
            <a
              href="https://web.archive.org/web/20260103132552/https://whitepapers.axis.com/en-US/latency-in-live-network-video-surveillance"
              target="_blank"
            >
              great explanation
            </a>{" "}
            from Axis. As mentioned in that article, glass-to-glass latency
            measurement is a very common method with some advantages over other
            methods. Glass to Glass aims to automate some of the manual effort.
            Glass to Glass also interpolates milliseconds so that milliseconds
            do not have to be rendered to get sub-second precision.
          </p>
        </div>
        <div id="faq-" className="faq-group">
          <h2>What makes a good screen recording?</h2>
          <ol>
            <li>🔟 🕕 10 second duration.</li>
            <li>2️⃣ ⏱️ Two clocks are visible - the capture clock and the viewer clock.</li>
            <li>🚫 🗓️ No date values needed.</li>
          </ol>
        </div>
      </article>
    </div>
  );
};

export default FAQ;
