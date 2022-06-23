import {DateTime} from "luxon";
import React, {useEffect, useState} from "react";
import {UncontrolledTooltip} from "reactstrap";

import {Localized} from "@/i18n";
import {formatDateTime} from "@/utils/datetime";

const startTime = DateTime.utc(2016, 6, 9, 10, 11).toLocal();

function getDiff() {
  return startTime.diffNow().negate()
    .shiftTo("days", "hours", "minutes", "seconds").normalize();
}

export const RunningTime: React.FC = () => {
  const [diff, setDiff] = useState(getDiff);

  useEffect(() => {
    // eslint-disable-next-line no-undef
    const timer = setInterval(() => setDiff(getDiff()), 1000);
    return () => {
      // eslint-disable-next-line no-undef
      clearInterval(timer);
    };
  }, []);

  const replacements = [diff.days, diff.hours, diff.minutes, Math.floor(diff.seconds)]
    .map((data, i) => <strong key={i}>{data}</strong>);

  return (
    <p>
      <UncontrolledTooltip placement="auto-end" target="running-time">
        <span>{formatDateTime(startTime)}</span>
      </UncontrolledTooltip>
      <span id="running-time">
        📅 <Localized id="footer.runningTime" args={replacements}/>
      </span>
    </p>
  );
};
