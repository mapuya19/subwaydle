import { useEffect, useState, useMemo } from 'react';
import { Header } from 'semantic-ui-react';

const formatNumber = (number) => {
  const numStr = Math.floor(number).toString();
  if (numStr.length === 1) {
    return '0' + numStr;
  }
  return numStr;
}

const Countdown = () => {
  const midnight = useMemo(() => {
    const date = new Date();
    date.setHours(24);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  }, []);

  const [countDown, setCountDown] = useState(
    (midnight - Date.now()) / 1000
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const time = (midnight - Date.now()) / 1000
      if (time <= 0) {
        // eslint-disable-next-line no-restricted-globals
        location.reload();
      }
      setCountDown(time);
    }, 1000);

    return () => clearInterval(interval);
  }, [midnight]);

  return (
    <Header as='h5'>
      Next Subwaydle in { formatNumber(countDown/3600) }:{ formatNumber(countDown/60 % 60) }:{ formatNumber(countDown % 60) }
    </Header>
  );
}

export default Countdown;
